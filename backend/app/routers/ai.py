import uuid
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db
from app.auth import get_current_user, get_current_admin
from app.services import ai_agent, planner_service

router = APIRouter(prefix="/ai", tags=["AI Consultant"])

# --- Request Schemas specific to Router ---
from pydantic import BaseModel, EmailStr

class AIChatInput(BaseModel):
    session_id: Optional[str] = None
    message: str

class AIRecommendInput(BaseModel):
    budget: Optional[float] = None
    purpose: Optional[str] = None
    gaming: Optional[bool] = False
    ai_ml: Optional[bool] = False
    portability: Optional[bool] = False
    battery: Optional[bool] = False
    brand: Optional[str] = None
    condition: Optional[str] = None

# --- Chat endpoints ---

@router.post("/chat")
async def chat_with_consultant(
    payload: AIChatInput,
    db: Session = Depends(get_db)
):
    """
    Continues or starts an AI laptop consultant session.
    Generates structured advice and scans catalog inventory.
    """
    session_id = payload.session_id or str(uuid.uuid4())
    message = payload.message.strip()
    
    if not message:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message cannot be empty."
        )
        
    try:
        result = await ai_agent.handle_chat_message(
            db=db,
            session_id=session_id,
            message_text=message
        )
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred in AI processing: {str(e)}"
        )

@router.get("/chat/session/{session_id}", response_model=schemas.ChatSessionResponse)
async def get_chat_session_history(
    session_id: str,
    db: Session = Depends(get_db)
):
    """
    Fetches the dialogue history for a given chat session.
    If no session exists, runs the AI Conversation Initializer.
    """
    session = await planner_service.initialize_chat_session(db, session_id)
    return session

# --- Catalog Recommendation & Search ---

@router.post("/recommend")
async def get_instant_recommendations(
    payload: AIRecommendInput,
    db: Session = Depends(get_db)
):
    """
    Scores active catalog inventory against explicit preferences.
    Routes through the Reasoning Planner to fetch matches.
    """
    # 1. Create a session ID
    import uuid
    session_id = f"recommend_{uuid.uuid4()}"
    
    # 2. Formulate a prompt request to the planner
    message_text = f"I want recommendations matching: budget={payload.budget}, purpose={payload.purpose}, brand={payload.brand}"
    
    # 3. Call execute_reasoning_pipeline
    result = await ai_agent.handle_chat_message(db, session_id, message_text)
    
    # 4. Fetch matches and load benchmarks
    results = []
    for item in result.get("matches", []):
        prod = db.query(models.Product).filter(models.Product.id == item["id"]).first()
        if prod:
            bench = db.query(models.LaptopBenchmark).filter(models.LaptopBenchmark.product_id == prod.id).first()
            bench_dict = {
                "Gaming": bench.gaming_score if bench else 50,
                "Productivity": bench.productivity_score if bench else 50,
                "Battery": bench.battery_score if bench else 50,
                "Portability": bench.portability_score if bench else 50
            }
            results.append({
                "product": schemas.ProductResponse.from_orm(prod),
                "benchmarks": bench_dict,
                "compatibility": item["compatibility"]
            })
            
    return results

@router.post("/compare", response_model=schemas.AICompareResponse)
async def compare_laptops(
    payload: schemas.AICompareRequest,
    db: Session = Depends(get_db)
):
    """
    Generates radar-style benchmarks and summaries side-by-side for multiple laptop IDs.
    """
    if len(payload.product_ids) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Specify at least 2 product IDs to compare."
        )
        
    result = await ai_agent.compare_multiple_laptops(db, payload.product_ids)
    if "error" in result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=result["error"]
        )
    return result

# --- Product Sourcing Requests ---

@router.post("/request", response_model=schemas.ProductRequestResponse)
def create_sourcing_request(
    payload: schemas.ProductRequestCreate,
    db: Session = Depends(get_db)
):
    """
    Allows a customer to request an out-of-stock laptop to be sourced.
    """
    request_row = models.ProductRequest(
        customer_name=payload.customer_name,
        email=payload.email,
        phone=payload.phone,
        requested_laptop=payload.requested_laptop,
        budget=payload.budget,
        use_case=payload.use_case
    )
    db.add(request_row)
    db.commit()
    db.refresh(request_row)
    return request_row

@router.get("/requests", response_model=List[schemas.ProductRequestResponse])
def list_sourcing_requests(
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    """
    Admin-only: Fetches sourcing requests.
    """
    query = db.query(models.ProductRequest)
    if status_filter:
        query = query.filter(models.ProductRequest.status == status_filter)
    return query.order_by(models.ProductRequest.created_at.desc()).all()

@router.put("/request/{request_id}", response_model=schemas.ProductRequestResponse)
def update_sourcing_request_status(
    request_id: int,
    payload: schemas.ProductRequestUpdateStatus,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    """
    Admin-only: Updates sourcing request status (e.g., Pending, Fulfilled).
    """
    req = db.query(models.ProductRequest).filter(models.ProductRequest.id == request_id).first()
    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product request not found."
        )
    req.status = payload.status
    db.commit()
    db.refresh(req)
    return req

# --- AI Agent Analytics ---

@router.get("/analytics")
def get_ai_agent_analytics(
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    """
    Admin-only: Fetches usage statistics and conversion rates for the AI Consultant.
    """
    total_sessions = db.query(models.ChatSession).count()
    total_requests = db.query(models.ProductRequest).count()
    
    # Calculate conversion metrics
    total_recommendations = db.query(models.AgentAnalytics).count()
    clicks = db.query(models.AgentAnalytics).filter(models.AgentAnalytics.conversion_status == "Clicked").count()
    purchases = db.query(models.AgentAnalytics).filter(models.AgentAnalytics.conversion_status == "Purchased").count()
    
    conv_rate = (clicks / total_recommendations * 100.0) if total_recommendations > 0 else 0.0
    
    # Group by product
    by_prod = {}
    logs = db.query(models.AgentAnalytics).all()
    for l in logs:
        by_prod[l.recommended_product] = by_prod.get(l.recommended_product, 0) + 1
        
    return {
        "total_sessions": total_sessions,
        "total_requests": total_requests,
        "conversion_rate": round(conv_rate, 2),
        "total_recommendations": total_recommendations,
        "clicks": clicks,
        "purchases": purchases,
        "conversion_by_product": by_prod
    }
