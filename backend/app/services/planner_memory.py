import json
import re
from typing import List, Dict, Any, Tuple
from app import models

def check_keyword(k: str, text: str) -> bool:
    if len(k) <= 2:
        return re.search(rf"\b{re.escape(k)}\b", text) is not None
    return k in text

def extract_memory_from_history(history: List[models.ChatMessage], session: models.ChatSession) -> Tuple[List[str], Dict[str, Any]]:
    """
    Parses chat history to identify rejected laptops/brands and extract session context parameters.
    Saves updates back to session.rejected_laptops and session.session_context.
    """
    user_texts = [msg.message.lower() for msg in history if msg.role == "user"]
    combined_text = " ".join(user_texts)

    # 1. Load existing context state
    try:
        rejected = json.loads(session.rejected_laptops) if session.rejected_laptops else []
    except Exception:
        rejected = []

    try:
        context = json.loads(session.session_context) if session.session_context else {
            "travel_frequency": None,
            "battery_preference": None,
            "upgrade_plans": None,
            "os_preference": None,
            "screen_size": None
        }
    except Exception:
        context = {
            "travel_frequency": None,
            "battery_preference": None,
            "upgrade_plans": None,
            "os_preference": None,
            "screen_size": None
        }

    # 2. Extract Rejected Brands/Models
    # Patterns looking for negative sentiment like "don't want", "no apple", "avoid hp", "except dell", "not used"
    avoid_patterns = [
        r"(?:don't|dont|do not)\s+want\s+(\w+)",
        r"(?:avoid|except|excluding|no)\s+(\w+)",
        r"not\s+a\s+fan\s+of\s+(\w+)",
        r"hate\s+(\w+)"
    ]
    for pattern in avoid_patterns:
        matches = re.findall(pattern, combined_text)
        for m in matches:
            m_cap = m.capitalize()
            # Normalize Macbook -> Apple
            if m == "macbook":
                m_cap = "Apple"
            valid_brands = ["Apple", "Asus", "Dell", "Hp", "Lenovo", "Msi", "Acer", "Razer"]
            if m_cap in valid_brands and m_cap not in rejected:
                rejected.append(m_cap)

    # 3. Extract Session Context Parameters
    # Operating System
    if any(check_keyword(k, combined_text) for k in ["macos", "mac os", "osx"]):
        context["os_preference"] = "macOS"
    elif any(check_keyword(k, combined_text) for k in ["windows", "win11", "win10"]):
        context["os_preference"] = "Windows"
    elif any(check_keyword(k, combined_text) for k in ["linux", "ubuntu", "debian"]):
        context["os_preference"] = "Linux"

    # Screen Size
    if "13" in combined_text:
        context["screen_size"] = "13-inch"
    elif "14" in combined_text:
        context["screen_size"] = "14-inch"
    elif "15" in combined_text:
        context["screen_size"] = "15.6-inch"
    elif "16" in combined_text:
        context["screen_size"] = "16-inch"

    # Travel Frequency / Portability
    if any(check_keyword(k, combined_text) for k in ["travel", "portable", "portability", "light", "weight", "thin", "commute", "flight"]):
        context["travel_frequency"] = "High"
    elif any(check_keyword(k, combined_text) for k in ["desk", "stationary", "heavy is ok"]):
        context["travel_frequency"] = "Low"

    # Battery Preference
    if any(check_keyword(k, combined_text) for k in ["battery", "charger", "long hours", "backup"]):
        context["battery_preference"] = "High"

    # Upgrade Plans
    if any(check_keyword(k, combined_text) for k in ["upgrade", "expand", "add ram", "future proof"]):
        context["upgrade_plans"] = "Required"

    # Save updates back to database session
    session.rejected_laptops = json.dumps(rejected)
    session.session_context = json.dumps(context)

    return rejected, context
