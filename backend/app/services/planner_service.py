import json
import logging
import httpx
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from app import models
from app.config import settings
from app.services import ai_agent
from app.services.planner_memory import extract_memory_from_history
from app.services.planner_schema import ExecutionPlan
from app.services.planner import ReasoningPlanner

logger = logging.getLogger(__name__)

def map_tool_name_for_log(name: str) -> str:
    mapping = {
        "search_inventory": "Inventory",
        "get_product_details": "Details",
        "compare_products": "Comparison",
        "create_product_request": "Sourcing Lead",
        "search_external_laptops": "Web Search"
    }
    return mapping.get(name, name.title())

async def execute_reasoning_pipeline(
    db: Session,
    session_id: str,
    message_text: str,
    user_id: Optional[int] = None
) -> Dict[str, Any]:
    """
    Main orchestrator for the Reasoning Planner layer.
    """
    logger.info("[Planner Started]")

    # 1. Fetch or create chat session
    session = db.query(models.ChatSession).filter(models.ChatSession.session_id == session_id).first()
    if not session:
        session = models.ChatSession(session_id=session_id, user_id=user_id)
        db.add(session)
        db.commit()
        db.refresh(session)

    # 2. Record User message in database
    user_msg = models.ChatMessage(session_id=session_id, role="user", message=message_text)
    db.add(user_msg)
    db.commit()

    # 3. Fetch session history log
    history = db.query(models.ChatMessage).filter(models.ChatMessage.session_id == session_id).order_by(models.ChatMessage.created_at.asc()).all()

    # 4. Extract context memory
    rejected_laptops, session_context = extract_memory_from_history(history, session)

    # 5. Call Reasoning Planner to build ExecutionPlan
    api_key = getattr(settings, "GROQ_API_KEY", "")
    if not api_key:
        # Failsafe fallback if API key is missing
        plan_dict = ReasoningPlanner.get_fallback_plan(history, rejected_laptops, session_context)
    else:
        plan_dict = await ReasoningPlanner.generate_plan(
            session_id=session_id,
            history=history,
            rejected_laptops=rejected_laptops,
            session_context=session_context,
            api_key=api_key
        )

    # Validate schema
    try:
        plan = ExecutionPlan(**plan_dict)
    except Exception as e:
        logger.error("Plan validation failed for dict: %s. Error: %s", json.dumps(plan_dict), str(e))
        plan = ExecutionPlan(**ReasoningPlanner.get_fallback_plan(history, rejected_laptops, session_context))

    intent_map = {
        "greeting": "Greeting",
        "recommendation": "Recommendation",
        "comparison": "Comparison",
        "details": "Details",
        "upgrade": "Upgrade Advice",
        "budget": "Budget Planning",
        "inventory": "Inventory Availability",
        "warranty": "Warranty",
        "contact": "Contact Request",
        "sourcing": "Product Sourcing",
        "question": "General Question"
    }
    mapped_intent = intent_map.get(plan.intent, plan.intent.capitalize())
    logger.info("[Intent = %s]", mapped_intent)
    logger.info("[Confidence = %d]", plan.confidence.overall_confidence)

    # 6. Execute Planned Tools with Try-Except Failsafe Retries
    tool_outputs = {}
    for tool_name in plan.tool_sequence:
        mapped_name = map_tool_name_for_log(tool_name)
        logger.info("[Selected Tool = %s]", mapped_name)
        try:
            output = await execute_single_tool(db, tool_name, plan, session_context)
            tool_outputs[tool_name] = output
            if isinstance(output, list):
                logger.info("[%s Returned = %d]", mapped_name, len(output))
            elif isinstance(output, dict) and "status" in output:
                logger.info("[%s Returned = %s]", mapped_name, str(output["status"]).capitalize())
            else:
                logger.info("[%s Returned = Success]", mapped_name)
        except Exception as ex:
            logger.error("Tool execution failed for %s (retrying once): %s", tool_name, str(ex))
            try:
                output = await execute_single_tool(db, tool_name, plan, session_context)
                tool_outputs[tool_name] = output
                if isinstance(output, list):
                    logger.info("[%s Returned = %d]", mapped_name, len(output))
                elif isinstance(output, dict) and "status" in output:
                    logger.info("[%s Returned = %s]", mapped_name, str(output["status"]).capitalize())
                else:
                    logger.info("[%s Returned = Success]", mapped_name)
            except Exception as retry_ex:
                logger.error("Tool execution failed again for %s: %s", tool_name, str(retry_ex))
                tool_outputs[tool_name] = {"error": f"Failsafe triggered. Tool {tool_name} was temporarily unavailable."}
                logger.info("[%s Returned = Failed]", mapped_name)

    # 7. Verification Gate: Verify inventory stock matches
    all_products_count = db.query(models.Product).filter(models.Product.stock > 0).count()
    matches = []
    
    # If the planner suggests recommending products, let's verify inventory matches
    if plan.response_strategy == "recommend_products" or "search_inventory" in tool_outputs or all_products_count == 0:
        inv_results = tool_outputs.get("search_inventory", [])
        # If inventory is empty, trigger external search fallback
        if not inv_results or "error" in str(inv_results) or all_products_count == 0:
            logger.info("Local catalog empty. Running Web Search Fallback Agent.")
            logger.info("[Selected Tool = Web Search]")
            try:
                ext_matches = ai_agent.search_external_laptops(
                    brand=plan.known.get("brand") or "Asus",
                    budget=float(plan.known.get("budget") or 300000)
                )
                tool_outputs["search_external_laptops"] = ext_matches
                plan.response_strategy = "recommend_external"
                logger.info("[Web Search Returned = %d]", len(ext_matches))
            except Exception:
                if all_products_count == 0:
                    plan.response_strategy = "recommend_external"
                    logger.info("[Web Search Returned = Failed]")
                else:
                    plan.response_strategy = "ask_question"

    # Extract rule-based requirements first
    explicit_rule, inferred_rule = ai_agent.infer_requirements_from_history(history)
    
    # Merge with planner's known parameters
    if plan.known.get("budget") is not None:
        explicit_rule["budget"] = plan.known.get("budget")
    if plan.known.get("brand") is not None:
        explicit_rule["brand"] = plan.known.get("brand")
    if plan.known.get("condition") is not None:
        explicit_rule["condition"] = plan.known.get("condition")
    if plan.known.get("screen_size") is not None:
        explicit_rule["screen_size"] = plan.known.get("screen_size")
    if session_context.get("os_preference") is not None:
        explicit_rule["os_preference"] = session_context.get("os_preference")
        
    if plan.known.get("purpose") is not None:
        if not inferred_rule.get("purpose") or inferred_rule.get("purpose") == "General Productivity":
            inferred_rule["purpose"] = plan.known.get("purpose")
            
    explicit = explicit_rule
    inferred = inferred_rule
    
    flat_prefs = {
        "budget": explicit["budget"],
        "purpose": inferred["purpose"],
        "gaming": inferred["gpu_dedicated_required"],
        "ai_ml": inferred["cuda_compatible"],
        "portability": inferred["portability_high"],
        "battery": inferred["battery_high"],
        "brand": explicit["brand"],
        "condition": explicit["condition"],
        "screen_size": explicit["screen_size"],
        "os_preference": explicit["os_preference"]
    }
    
    # Save explicit/inferred context to DB ChatSession
    session.explicit_requirements = json.dumps(explicit)
    session.inferred_requirements = json.dumps(inferred)
    db.commit()

    all_products = db.query(models.Product).filter(models.Product.stock > 0).all()
    # Filter out rejected brands from catalog scoring matches
    filtered_products = [p for p in all_products if p.brand.capitalize() not in rejected_laptops]
    matches = ai_agent.score_catalog_laptops_enhanced(filtered_products, explicit, inferred)

    # 8. Recommendation Gate: Prevent recommendation if overall confidence is low
    overall_conf = plan.confidence.overall_confidence
    if plan.response_strategy == "recommend_products" and overall_conf < 80:
        logger.info("Gate triggered: Confidence (%d%%) is too low to recommend. Reverting strategy to ask_question.", overall_conf)
        plan.response_strategy = "ask_question"

    # 9. Generate final dialog response
    response_text = await generate_consultant_dialog(plan, tool_outputs, history, api_key, matches)
    if not response_text:
        # Fallback rule-based conversational renderer
        response_text = ai_agent.get_rule_based_response(history, flat_prefs, matches)

    logger.info("[Recommendation Generated]")

    # 10. Record Assistant message response in database
    asst_msg = models.ChatMessage(session_id=session_id, role="assistant", message=response_text)
    db.add(asst_msg)
    
    # 11. Pre-compute and cache benchmarks/analytics
    for prod, scores, comp in matches[:5]:
        bench = db.query(models.LaptopBenchmark).filter(models.LaptopBenchmark.product_id == prod.id).first()
        if not bench:
            bench = models.LaptopBenchmark(
                product_id=prod.id,
                cpu_score=scores["cpu_score"],
                gpu_score=scores["gpu_score"],
                portability_score=scores["portability_score"],
                battery_score=scores["battery_score"],
                productivity_score=scores["productivity_score"],
                gaming_score=scores["gaming_score"]
            )
            db.add(bench)
            
    if overall_conf >= 80 and matches:
        top_prod = matches[0][0]
        analytics_exist = db.query(models.AgentAnalytics).filter(
            models.AgentAnalytics.session_id == session_id,
            models.AgentAnalytics.recommended_product == f"{top_prod.brand} {top_prod.name}"
        ).first()
        if not analytics_exist:
            analytics_log = models.AgentAnalytics(
                session_id=session_id,
                recommended_product=f"{top_prod.brand} {top_prod.name}",
                conversion_status="Recommended"
            )
            db.add(analytics_log)

    db.commit()
    logger.info("[Response Sent]")

    # 12. Return payload back to Next.js API router

    return {
        "session_id": session_id,
        "message": response_text,
        "preferences": flat_prefs,
        "confidence_score": round(overall_conf / 100.0, 2),
        "matches": [
            {
                "id": p.id,
                "name": p.name,
                "brand": p.brand,
                "price": p.price,
                "image_urls": p.image_urls,
                "condition": p.condition,
                "compatibility": round(comp, 1),
                "specs": p.specs
            }
            for p, s, comp in matches[:3]
        ] if (plan.response_strategy == "recommend_products" and overall_conf >= 80) else []
    }

async def execute_single_tool(db: Session, name: str, plan: ExecutionPlan, session_context: Dict[str, Any]) -> Any:
    """Invokes existing agents/tools."""
    if name == "search_inventory":
        return ai_agent.search_inventory(
            db=db,
            brand=plan.known.get("brand"),
            price_max=plan.known.get("budget"),
            condition=plan.known.get("condition")
        )
    elif name == "get_product_details":
        return ai_agent.get_product_details(
            db=db,
            product_id=int(plan.known.get("product_id") or 0)
        )
    elif name == "compare_products":
        # Handled in comparison rendering
        return {}
    elif name == "create_product_request":
        # Sourcing
        return ai_agent.create_product_request(
            db=db,
            customer_name=plan.known.get("customer_name") or "Interested Customer",
            email=plan.known.get("email") or "sourcing@mrlaptop.lk",
            phone=plan.known.get("phone") or "+94 77 123 4567",
            requested_laptop=plan.known.get("requested_laptop") or "Alternative Laptop Specs",
            budget=float(plan.known.get("budget") or 300000),
            use_case=plan.known.get("purpose")
        )
    elif name == "search_external_laptops":
        return ai_agent.search_external_laptops(
            brand=plan.known.get("brand") or "Asus",
            budget=float(plan.known.get("budget") or 300000)
        )
    return {"error": f"Tool '{name}' unknown."}

async def generate_consultant_dialog(
    plan: ExecutionPlan,
    tool_outputs: Dict[str, Any],
    history: List[models.ChatMessage],
    api_key: str,
    matches: List[Tuple[models.Product, Dict[str, Any], float]]
) -> str:
    """Uses Groq to generate a warm, human-like sales engineer response."""
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    history_text = "\n".join([f"{msg.role}: {msg.message}" for msg in history[:-1]])

    # Build context for dialogue completion
    matches_info = []
    for prod, score, comp in matches[:3]:
        matches_info.append(
            f"- {prod.brand} {prod.name} ({prod.price:,.0f} LKR): specs={json.dumps(prod.specs)}, compatibility={comp:.1f}%"
        )
    matches_text = "\n".join(matches_info)

    system_prompt = (
        "You are 'Mr. Laptop AI Sales Consultant', an experienced, elite laptop sales engineer at Mr_Laptop.lk.\n"
        "Your objective is to reply to the customer with warm, consultative, and empathic dialogue based on the current ExecutionPlan.\n\n"
        "DIALOGUE RULES:\n"
        "1. NEVER reveal the JSON ExecutionPlan, confidence scores, or tool sequence keys to the customer. Act as a natural laptop advisor.\n"
        "2. Follow the response strategy: \n"
        "   - 'ask_question': Ask only one or two warm, high-value questions to gather missing parameters. Do not dump list parameters.\n"
        "   - 'recommend_products': Celebrate the matching inventory. Warmly explain the fit, specifications, upgrades, expected lifespan, and constraints of the recommended laptops.\n"
        "   - 'recommend_external': Explain that target items are 'Currently unavailable in our inventory'. Present external alternative options and offer to log a sourcing request using create_product_request.\n"
        "   - 'source_product': Confirm that their custom sourcing request has been successfully submitted and our team will get in touch shortly.\n"
        "   - 'general_response': Provide helpful tech-support or advice.\n"
        "3. Adapt your tone: Speak simple use cases for beginners, and dive into hardware specifics (generations, thermal headroom, upgrade paths) for experts.\n"
        "4. Always greet the user politely and keep it conversational."
    )

    user_content = (
        f"PLAN STRATEGY: {plan.response_strategy}\n"
        f"KNOWN PARAMS: {json.dumps(plan.known)}\n"
        f"MISSING PARAMS: {json.dumps(plan.missing)}\n"
        f"TOOL OUTPUTS: {json.dumps(tool_outputs)}\n"
        f"TOP MATCHES IN STOCK:\n{matches_text}\n\n"
        f"CONVERSATION HISTORY:\n{history_text}\n"
        f"CUSTOMER MESSAGE: {history[-1].message}\n\n"
        f"Generate Dialogue Response:"
    )

    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content}
        ]
    }

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, headers=headers, json=payload, timeout=15.0)
            if resp.status_code == 200:
                data = resp.json()
                return data["choices"][0]["message"]["content"].strip()
    except Exception as e:
        logger.error("Failed to generate dialog response: %s", str(e))
    return ""


async def generate_ai_welcome_message() -> str:
    """Uses Groq LLM to generate a warm, professional, dynamic greeting prompt."""
    api_key = getattr(settings, "GROQ_API_KEY", "")
    if not api_key:
        return (
            "Hi! Welcome to Mr_Laptop.lk 👋\n\n"
            "I'm your AI Laptop Consultant. I'll help you find the best laptop based on your needs, budget, and future plans.\n\n"
            "To start, what will you mainly use your laptop for?"
        )
        
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    system_prompt = (
        "You are 'Mr. Laptop AI Sales Consultant', an experienced, elite laptop sales engineer at Mr_Laptop.lk.\n"
        "Generate a warm, professional, personalized opening welcome message for a new customer chat session.\n"
        "Introduce yourself naturally, explain briefly how you can help (needs, budget, plans), "
        "and ask the single most valuable opening question (e.g. what they will mainly use the laptop for).\n"
        "Never ask for the budget first. Do not include any HTML tags, markdown placeholders, or reasoning thinking blocks.\n"
        "Keep it concise, friendly, and under 4 sentences."
    )
    
    payload = {
        "model": "llama-3.3-70b-versatile",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "Generate welcome message:"}
        ]
    }
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, headers=headers, json=payload, timeout=10.0)
            if resp.status_code == 200:
                data = resp.json()
                return data["choices"][0]["message"]["content"].strip()
    except Exception as e:
        logger.error("Failed to generate dynamic AI welcome message: %s", str(e))
        
    return (
        "Hi! Welcome to Mr_Laptop.lk 👋\n\n"
        "I'm your AI Laptop Consultant. I'll help you find the best laptop based on your needs, budget, and future plans.\n\n"
        "To start, what will you mainly use your laptop for?"
    )


async def initialize_chat_session(db: Session, session_id: str, user_id: Optional[int] = None) -> models.ChatSession:
    """
    Creates/fetches session, generates dynamic welcome message using LLM,
    stores in conversation history, and returns the session object.
    """
    session = db.query(models.ChatSession).filter(models.ChatSession.session_id == session_id).first()
    if not session:
        session = models.ChatSession(session_id=session_id, user_id=user_id)
        db.add(session)
        db.commit()
        db.refresh(session)
        
    history = db.query(models.ChatMessage).filter(models.ChatMessage.session_id == session_id).all()
    if not history:
        logger.info("[Conversation Initialized]")
        welcome_message = await generate_ai_welcome_message()
        logger.info("[LLM Welcome Generated]")
        
        msg = models.ChatMessage(session_id=session_id, role="assistant", message=welcome_message)
        db.add(msg)
        db.commit()
        logger.info("[Session Saved]")
        
    logger.info("[Message Returned]")
    return session
