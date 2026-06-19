import time
from typing import Dict, List
from fastapi import APIRouter, HTTPException, Request, status
from app import schemas
from app.email_service import send_contact_email

router = APIRouter(prefix="/contact", tags=["Contact Inquiries"])

# In-memory sliding window rate limiter
# Key: Client IP Address -> Value: List of request epoch timestamps
rate_limit_store: Dict[str, List[float]] = {}
RATE_LIMIT_WINDOW_SECONDS = 60
RATE_LIMIT_MAX_REQUESTS = 3

def check_rate_limit(client_ip: str) -> bool:
    """Returns True if the IP is allowed to proceed, False if rate-limited."""
    now = time.time()
    if client_ip not in rate_limit_store:
        rate_limit_store[client_ip] = []
    
    # Filter timestamps older than the sliding window limit
    rate_limit_store[client_ip] = [
        t for t in rate_limit_store[client_ip]
        if now - t < RATE_LIMIT_WINDOW_SECONDS
    ]
    
    if len(rate_limit_store[client_ip]) >= RATE_LIMIT_MAX_REQUESTS:
        return False
    
    # Append current timestamp
    rate_limit_store[client_ip].append(now)
    return True

@router.post("", status_code=status.HTTP_200_OK)
def submit_contact_inquiry(inquiry: schemas.ContactInquiry, request: Request):
    """
    Accepts contact inquiries and dispatches them via the email service.
    Protects endpoint with an in-memory rate-limiter (3 requests/min per IP).
    """
    client_ip = request.client.host or "127.0.0.1"
    
    # Apply rate limiting
    if not check_rate_limit(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many contact inquiries. Please wait a minute before trying again."
        )
        
    try:
        send_contact_email(inquiry)
        return {"message": "Thank you! Your contact inquiry has been sent successfully."}
    except ValueError as exc:
        # Configuration credentials errors
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc)
        )
    except Exception as exc:
        # Delivery transmission exceptions
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="System failed to dispatch email. Please try again later."
        )
