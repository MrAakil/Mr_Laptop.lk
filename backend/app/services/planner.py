import json
import logging
import httpx
import re
from typing import List, Dict, Any
from app import models
from app.config import settings

logger = logging.getLogger(__name__)

class ReasoningPlanner:
    """
    Reasoning Planner that analyzes conversation context, calculates profile confidence,
    performs gap analyses, and builds an execution plan using Groq completions JSON mode.
    """
    @staticmethod
    async def generate_plan(
        session_id: str,
        history: List[models.ChatMessage],
        rejected_laptops: List[str],
        session_context: Dict[str, Any],
        api_key: str
    ) -> Dict[str, Any]:
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

        # Build context context summarization
        history_text = "\n".join([
            f"{msg.role}: {msg.message}" for msg in history
        ])

        system_prompt = (
            "You are 'AI Reasoning Planner' for Mr_Laptop.lk.\n"
            "Your objective is to read the conversation history, identify rejected laptops, analyze customer context, "
            "determine customer intent, calculate confidence scores, identify information gaps, and formulate an ExecutionPlan.\n\n"
            "OUTPUT SCHEMAS REQUIREMENTS:\n"
            "You must respond with a single valid JSON object matching this schema:\n"
            "{\n"
            "  \"reasoning\": \"Internal thinking process covering Observe, Understand, Infer, Plan, Select Tools, Verify\",\n"
            "  \"intent\": \"greeting\" | \"recommendation\" | \"comparison\" | \"details\" | \"upgrade\" | \"budget\" | \"inventory\" | \"warranty\" | \"contact\" | \"sourcing\" | \"question\",\n"
            "  \"known\": {\n"
            "     \"budget\": integer | null,\n"
            "     \"purpose\": string | null,\n"
            "     \"brand\": string | null,\n"
            "     \"condition\": string | null,\n"
            "     \"operating_system\": string | null,\n"
            "     \"screen_size\": string | null\n"
            "  },\n"
            "  \"missing\": [\"budget\", \"purpose\", etc. - list of missing fields],\n"
            "  \"confidence\": {\n"
            "     \"purpose_confidence\": integer (0-100),\n"
            "     \"budget_confidence\": integer (0-100),\n"
            "     \"brand_confidence\": integer (0-100),\n"
            "     \"performance_confidence\": integer (0-100),\n"
            "     \"overall_confidence\": integer (0-100)\n"
            "  },\n"
            "  \"tool_sequence\": [\"search_inventory\", \"compare_products\", etc. - list of tools needed],\n"
            "  \"response_strategy\": \"ask_question\" | \"recommend_products\" | \"perform_comparison\" | \"source_product\" | \"general_response\"\n"
            "}\n\n"
            "CORE PLANNER LOGIC RULES:\n"
            "1. Analyze intent: Greeting (e.g. 'hi'), Recommendation (looking for matching laptops), Comparison (comparing models), Details (specs for a model), Sourcing (explicit request lead), Question.\n"
            "2. If intent is 'recommendation':\n"
            "   - If overall confidence score is below 80% (e.g. missing purpose or budget range), response_strategy MUST be 'ask_question' and tool_sequence MUST be empty.\n"
            "   - If overall confidence score is >= 80% (budget and purpose are mostly known), response_strategy MUST be 'recommend_products' and tool_sequence should include 'search_inventory'.\n"
            "3. If intent is 'comparison': response_strategy MUST be 'perform_comparison' and tool_sequence MUST include 'compare_products'.\n"
            "4. If intent is 'sourcing': response_strategy MUST be 'source_product' and tool_sequence MUST include 'create_product_request'.\n"
            "5. If a laptop brand/model matches items in the rejected list, do not search or recommend them.\n"
            "6. Make sure to keep question strategies smart: only list one or two high-value missing fields to ask in your plan."
        )

        user_content = (
            f"REJECTED LAPTOPS MEMORY: {json.dumps(rejected_laptops)}\n"
            f"SESSION CONTEXT MEMORY: {json.dumps(session_context)}\n\n"
            f"CONVERSATION HISTORY:\n{history_text}\n\n"
            f"Generate the ExecutionPlan JSON now:"
        )

        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ],
            "response_format": {"type": "json_object"}
        }

        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(url, headers=headers, json=payload, timeout=15.0)
                if resp.status_code == 200:
                    data = resp.json()
                    plan_str = data["choices"][0]["message"]["content"].strip()
                    plan_dict = json.loads(plan_str)
                    logger.info("Reasoning Planner successfully built plan for session [%s]: %s", session_id, plan_str)
                    return plan_dict
        except Exception as e:
            logger.error("Failed to generate plan via Groq, triggering fallback constructor: %s", str(e))

        # Fallback plan constructor
        return ReasoningPlanner.get_fallback_plan(history, rejected_laptops, session_context)

    @staticmethod
    def get_fallback_plan(history: List[models.ChatMessage], rejected: List[str], context: Dict[str, Any]) -> Dict[str, Any]:
        """Failsafe plan builder if Groq call crashes."""
        user_texts = [msg.message.lower() for msg in history if msg.role == "user"]
        combined_text = " ".join(user_texts)

        intent = "recommendation"
        if any(k in combined_text for k in ["hi", "hello", "hey"]):
            intent = "greeting"
        elif any(k in combined_text for k in ["compare", "versus", "vs"]):
            intent = "comparison"
        elif any(k in combined_text for k in ["request", "sourcing", "contact"]):
            intent = "sourcing"

        # Determine budget and purpose presence
        budget_val = None
        k_match = re.search(r"(\d+)\s*k", combined_text)
        if k_match:
            budget_val = int(k_match.group(1)) * 1000
        else:
            digits = re.findall(r"\b\d{5,7}\b", combined_text.replace(",", ""))
            if digits:
                budget_val = int(digits[0])

        has_budget = budget_val is not None

        purpose_val = None
        if "gaming" in combined_text:
            purpose_val = "Gaming"
        elif "ai" in combined_text or "ml" in combined_text or "deep learning" in combined_text:
            purpose_val = "AI/ML Engineering"
        elif "program" in combined_text or "code" in combined_text or "develop" in combined_text:
            purpose_val = "Programming"
        elif "student" in combined_text or "study" in combined_text or "uni" in combined_text:
            purpose_val = "Student"
        elif "edit" in combined_text or "design" in combined_text or "creation" in combined_text:
            purpose_val = "Content Creation"
            
        has_purpose = purpose_val is not None

        overall = 40
        missing = []
        if not has_budget:
            missing.append("budget")
        else:
            overall += 30
        if not has_purpose:
            missing.append("purpose")
        else:
            overall += 30

        strategy = "ask_question"
        tools = []
        if intent == "comparison":
            strategy = "perform_comparison"
            tools = ["compare_products"]
        elif intent == "sourcing":
            strategy = "source_product"
            tools = ["create_product_request"]
        elif intent == "recommendation" and overall >= 80:
            strategy = "recommend_products"
            tools = ["search_inventory"]

        return {
            "reasoning": "Fallback constructor routing due to Groq timeout/failure.",
            "intent": intent,
            "known": {
                "budget": budget_val,
                "purpose": purpose_val,
                "brand": None,
                "condition": None,
                "operating_system": context.get("os_preference"),
                "screen_size": context.get("screen_size")
            },
            "missing": missing,
            "confidence": {
                "purpose_confidence": 90 if has_purpose else 10,
                "budget_confidence": 90 if has_budget else 10,
                "brand_confidence": 10,
                "performance_confidence": 30,
                "overall_confidence": overall
            },
            "tool_sequence": tools,
            "response_strategy": strategy
        }
