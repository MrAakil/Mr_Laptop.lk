import json
import re
import datetime
import logging
from typing import List, Dict, Any, Optional, Tuple
import httpx
from sqlalchemy.orm import Session
from app import models, schemas
from app.config import settings
from app.services import planner_service

logger = logging.getLogger(__name__)

# Simple in-memory cache for Web Search Fallback recommendations
WEB_SEARCH_CACHE: Dict[str, List[Dict[str, Any]]] = {}

# Tool Declarations for Groq Function Calling
GROQ_TOOLS_CONFIG = [
    {
        "type": "function",
        "function": {
            "name": "search_inventory",
            "description": "Searches the local laptop catalog database by brand, maximum price limit, or condition. Returns matches. ALWAYS call this tool before recommending or talking about any laptop in stock.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Generic search query (e.g. i7, 16GB, RTX)"},
                    "brand": {"type": "string", "description": "Laptop brand (e.g. Apple, Asus, Lenovo, HP, Dell)"},
                    "price_max": {"type": "number", "description": "Maximum price in LKR"},
                    "condition": {"type": "string", "description": "Condition filter: 'New', 'Used', or 'Refurbished'"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_product_details",
            "description": "Retrieves the exact details, specifications, description, and stock of a single product using its integer ID.",
            "parameters": {
                "type": "object",
                "properties": {
                    "product_id": {"type": "integer", "description": "The unique numerical database ID of the product"}
                },
                "required": ["product_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "compare_products",
            "description": "Generates comparison benchmarks and natural-language strengths analysis for 2 or 3 laptop IDs.",
            "parameters": {
                "type": "object",
                "properties": {
                    "product_ids": {
                        "type": "array",
                        "items": {"type": "integer"},
                        "description": "A list of product IDs to compare"
                    }
                },
                "required": ["product_ids"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_product_request",
            "description": "Submits a sourcing request lead for a customer when their requested laptop is not available in our catalog inventory.",
            "parameters": {
                "type": "object",
                "properties": {
                    "customer_name": {"type": "string", "description": "Customer's full name"},
                    "email": {"type": "string", "description": "Customer's email address"},
                    "phone": {"type": "string", "description": "Customer's WhatsApp / Phone number"},
                    "requested_laptop": {"type": "string", "description": "Name / specifications of the laptop they want"},
                    "budget": {"type": "number", "description": "Target LKR budget"},
                    "use_case": {"type": "string", "description": "Usage purpose / specific software requirements"}
                },
                "required": ["customer_name", "email", "phone", "requested_laptop", "budget"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_external_laptops",
            "description": "Queries external brand databases (ASUS, Lenovo, Dell, HP, Acer, MSI) for models matching criteria when our local inventory is empty.",
            "parameters": {
                "type": "object",
                "properties": {
                    "brand": {"type": "string", "description": "Laptop brand to search"},
                    "budget": {"type": "number", "description": "Target budget in LKR"},
                    "use_case": {"type": "string", "description": "Use case context (optional)"}
                },
                "required": ["brand", "budget"]
            }
        }
    }
]

# --- Questions for Dialogue State Machine (Fallback Engine) ---
STAGE_QUESTIONS = [
    {
        "field": "budget",
        "question": "What is your target budget range in LKR for the laptop? (e.g., 250,000 LKR or 300k LKR)",
        "patterns": [r"(\d+[\d,\s]*\d*)", r"(\d+)\s*k"]
    },
    {
        "field": "purpose",
        "question": "Thank you so much! To ensure we find a laptop that supports your daily tasks beautifully, what is the main purpose you'll be using it for? (e.g., Programming, Gaming, AI/ML, Video Editing, Office Work, or Student tasks?)",
        "patterns": [r"(gaming|ai|ml|programming|coding|edit|office|student|study|work|developer)"]
    },
    {
        "field": "battery_portability",
        "question": "Got it! Are battery life and portability highly important for you? For instance, do you travel or move around a lot with your laptop, or will it mostly be used on a desk?",
        "patterns": [r"(yes|no|portab|travel|light|weight|battery|hour|plugged)"]
    },
    {
        "field": "brand_condition",
        "question": "We are almost there! Do you have any preferred brands, or a preference for brand new versus high-quality used or refurbished laptops?",
        "patterns": [r"(apple|macbook|asus|dell|hp|lenovo|msi|acer|new|used|refurb)"]
    }
]

def check_word(k: str, text: str) -> bool:
    if len(k) <= 2:
        return re.search(rf"\b{re.escape(k)}\b", text) is not None
    return k in text

def infer_requirements_from_history(history: List[models.ChatMessage]) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    """
    Requirements Inference Engine: Extracts explicit fields and infers hidden requirements
    from chat history.
    """
    # Explicit preferences directly mentioned
    explicit = {
        "budget": None,
        "brand": None,
        "condition": None,
        "screen_size": None,
        "os_preference": None
    }
    # Inferred preferences derived from user context
    inferred = {
        "purpose": None,
        "ram_min": 8,
        "nvidia_gpu_required": False,
        "cuda_compatible": False,
        "gpu_dedicated_required": False,
        "portability_high": False,
        "battery_high": False,
        "upgradeability_required": False,
        "strong_cpu_required": False,
        "color_accurate_display": False
    }

    user_texts = [msg.message.lower() for msg in history if msg.role == "user"]
    combined_text = " ".join(user_texts)

    # 1. Parsing Explicit Budget
    k_match = re.search(r"(\d+)\s*k", combined_text)
    if k_match:
        explicit["budget"] = int(k_match.group(1)) * 1000
    else:
        digits = re.findall(r"\b\d{5,7}\b", combined_text.replace(",", ""))
        if digits:
            explicit["budget"] = int(digits[-1])

    # Explicit Brands (Earliest Mention wins)
    brands = ["apple", "macbook", "asus", "dell", "hp", "lenovo", "msi", "acer", "razer"]
    earliest_idx = len(combined_text)
    matched_brand = None
    for b in brands:
        if check_word(b, combined_text):
            idx = combined_text.find(b)
            if idx != -1 and idx < earliest_idx:
                earliest_idx = idx
                matched_brand = "Apple" if b == "macbook" else b.capitalize()
    if matched_brand:
        explicit["brand"] = matched_brand

    # Explicit Condition
    if check_word("new", combined_text):
        explicit["condition"] = "New"
    elif any(check_word(k, combined_text) for k in ["used", "refurb", "second hand"]):
        explicit["condition"] = "Used"

    # Explicit Screen Size
    if "13" in combined_text:
        explicit["screen_size"] = "13-inch"
    elif "14" in combined_text:
        explicit["screen_size"] = "14-inch"
    elif "15" in combined_text:
        explicit["screen_size"] = "15.6-inch"
    elif "16" in combined_text:
        explicit["screen_size"] = "16-inch"

    # Explicit OS preference
    if any(check_word(k, combined_text) for k in ["macos", "mac os", "osx"]):
        explicit["os_preference"] = "macOS"
    elif any(check_word(k, combined_text) for k in ["windows", "win11", "win10"]):
        explicit["os_preference"] = "Windows"
    elif any(check_word(k, combined_text) for k in ["linux", "ubuntu", "debian"]):
        explicit["os_preference"] = "Linux"

    # 2. Inferring preferences
    # Determine purpose based on priority check
    if any(check_word(k, combined_text) for k in ["ai", "ml", "deep learning", "machine learning", "tensorflow", "pytorch", "cuda", "data science"]):
        inferred["purpose"] = "AI/ML Engineering"
    elif any(check_word(k, combined_text) for k in ["program", "code", "develop", "coding", "software", "developer", "cs"]):
        inferred["purpose"] = "Programming"
    elif any(check_word(k, combined_text) for k in ["gaming", "gamer", "play games", "rtx", "fps"]):
        inferred["purpose"] = "Gaming"
    elif any(check_word(k, combined_text) for k in ["edit", "render", "photoshop", "premiere", "creator", "design"]):
        inferred["purpose"] = "Video/Content Creation"
    elif any(check_word(k, combined_text) for k in ["student", "college", "study", "university"]):
        inferred["purpose"] = "Student Usage"
    elif any(check_word(k, combined_text) for k in ["office", "excel", "word", "business", "work"]):
        inferred["purpose"] = "Office & Productivity"

    # Independently apply criteria for all matching categories
    if any(check_word(k, combined_text) for k in ["ai", "ml", "deep learning", "machine learning", "tensorflow", "pytorch", "cuda", "data science"]):
        inferred["nvidia_gpu_required"] = True
        inferred["cuda_compatible"] = True
        inferred["gpu_dedicated_required"] = True
        inferred["ram_min"] = max(inferred["ram_min"], 16)
        inferred["strong_cpu_required"] = True

    if any(check_word(k, combined_text) for k in ["program", "code", "develop", "coding", "software", "developer", "cs"]):
        inferred["ram_min"] = max(inferred["ram_min"], 16)
        inferred["strong_cpu_required"] = True

    if any(check_word(k, combined_text) for k in ["gaming", "gamer", "play games", "rtx", "fps"]):
        inferred["gpu_dedicated_required"] = True
        inferred["strong_cpu_required"] = True

    if any(check_word(k, combined_text) for k in ["edit", "render", "photoshop", "premiere", "creator", "design"]):
        inferred["gpu_dedicated_required"] = True
        inferred["color_accurate_display"] = True

    if any(check_word(k, combined_text) for k in ["student", "college", "study", "university"]):
        inferred["portability_high"] = True
        inferred["battery_high"] = True
        inferred["ram_min"] = max(inferred["ram_min"], 16)
        inferred["upgradeability_required"] = True

    # Travel / Portability (Independent flag check)
    if any(check_word(k, combined_text) for k in ["travel", "portable", "portability", "light", "weight", "thin", "commute", "flight"]):
        inferred["portability_high"] = True
        inferred["battery_high"] = True

    # Battery (Independent flag check)
    if any(check_word(k, combined_text) for k in ["battery", "charger", "long hours", "backup"]):
        inferred["battery_high"] = True

    return explicit, inferred

def parse_preferences_rule_based(history: List[models.ChatMessage]) -> Dict[str, Any]:
    """
    Fallback preference parser wrapping the enhanced inference engine.
    """
    explicit, inferred = infer_requirements_from_history(history)
    return {
        "budget": explicit["budget"],
        "purpose": inferred["purpose"] or "General Productivity",
        "gaming": inferred["gpu_dedicated_required"],
        "ai_ml": inferred["cuda_compatible"],
        "portability": inferred["portability_high"],
        "battery": inferred["battery_high"],
        "brand": explicit["brand"],
        "condition": explicit["condition"],
        "screen_size": explicit["screen_size"],
        "os_preference": explicit["os_preference"]
    }

def calculate_confidence_score(prefs: Dict[str, Any]) -> float:
    score = 0.0
    if prefs.get("budget") is not None:
        score += 0.35
    if prefs.get("purpose") is not None and prefs.get("purpose") != "General Productivity":
        score += 0.35
    if prefs.get("portability") or prefs.get("battery"):
        score += 0.15
    if prefs.get("brand") is not None or prefs.get("condition") is not None:
        score += 0.15
    return round(score, 2)

def score_catalog_laptops_enhanced(
    products: List[models.Product],
    explicit: Dict[str, Any],
    inferred: Dict[str, Any]
) -> List[Tuple[models.Product, Dict[str, Any], float]]:
    """
    Intelligent inventory ranking that scores catalog items (0-100%)
    using granular sales weights.
    """
    scored_items = []
    
    pref_budget = explicit.get("budget")
    pref_brand = explicit.get("brand")
    pref_cond = explicit.get("condition")
    pref_screen = explicit.get("screen_size")
    pref_os = explicit.get("os_preference")
    
    pref_purpose = str(inferred.get("purpose") or "").lower()
    ram_min = inferred.get("ram_min", 8)
    nvidia_req = inferred.get("nvidia_gpu_required", False)
    cuda_req = inferred.get("cuda_compatible", False)
    gpu_ded_req = inferred.get("gpu_dedicated_required", False)
    portability_req = inferred.get("portability_high", False)
    battery_req = inferred.get("battery_high", False)
    upgrade_req = inferred.get("upgradeability_required", False)
    cpu_req = inferred.get("strong_cpu_required", False)
    display_req = inferred.get("color_accurate_display", False)
    
    for product in products:
        if product.stock <= 0:
            continue
            
        specs = product.specs or {}
        price = product.price
        
        # 1. Budget Match
        if pref_budget:
            if price <= pref_budget:
                budget_score = 100.0
            elif price <= pref_budget * 1.25:
                # Soft decay above budget (down to 30%)
                budget_score = 100.0 - ((price - pref_budget) / (pref_budget * 0.25)) * 70.0
            else:
                budget_score = 10.0
        else:
            budget_score = 100.0
            
        # 2. CPU Match
        cpu_str = str(specs.get("cpu", "")).lower()
        cpu_score = 50.0
        if any(k in cpu_str for k in ["i9", "ryzen 9", "m3 max", "m2 max", "m1 max", "ultra 9"]):
            cpu_score = 100.0
        elif any(k in cpu_str for k in ["i7", "ryzen 7", "m3 pro", "m2 pro", "m1 pro", "ultra 7"]):
            cpu_score = 88.0
        elif any(k in cpu_str for k in ["i5", "ryzen 5", "m3", "m2", "m1", "ultra 5"]):
            cpu_score = 72.0
        elif any(k in cpu_str for k in ["i3", "ryzen 3"]):
            cpu_score = 45.0
            
        if cpu_req and cpu_score < 75.0:
            cpu_score *= 0.7
            
        # 3. GPU Match
        gpu_str = str(specs.get("gpu", "")).lower()
        gpu_score = 50.0
        
        is_nvidia = "nvidia" in gpu_str or "rtx" in gpu_str or "gtx" in gpu_str
        is_dedicated = is_nvidia or "radeon rx" in gpu_str or "arc" in gpu_str
        
        if "4090" in gpu_str or "4080" in gpu_str:
            gpu_score = 100.0
        elif "4070" in gpu_str or "4060" in gpu_str or "3070" in gpu_str:
            gpu_score = 90.0
        elif "4050" in gpu_str or "3060" in gpu_str or "3050" in gpu_str:
            gpu_score = 78.0
        elif "apple" in gpu_str or "m1" in cpu_str or "m2" in cpu_str or "m3" in cpu_str:
            gpu_score = 70.0
        elif "integrated" in gpu_str or "iris" in gpu_str or "radeon graphics" in gpu_str:
            gpu_score = 40.0
            
        if nvidia_req and not is_nvidia:
            gpu_score *= 0.4
        elif gpu_ded_req and not is_dedicated:
            gpu_score *= 0.5
            
        # 4. RAM
        ram_str = str(specs.get("ram", "")).lower()
        ram_val = 8
        if "64" in ram_str:
            ram_val = 64
        elif "32" in ram_str:
            ram_val = 32
        elif "16" in ram_str:
            ram_val = 16
            
        ram_score = 100.0 if ram_val >= ram_min else (50.0 if ram_val >= ram_min / 2 else 20.0)

        # 5. Display Match
        display_str = str(specs.get("display", "")).lower()
        display_score = 60.0
        if "oled" in display_str or "amoled" in display_str:
            display_score = 100.0
        elif "qhd" in display_str or "2k" in display_str or "4k" in display_str or "retina" in display_str:
            display_score = 90.0
        elif "ips" in display_str or "120hz" in display_str or "144hz" in display_str or "240hz" in display_str:
            display_score = 80.0
            
        if display_req and "oled" not in display_str and "retina" not in display_str:
            display_score *= 0.7

        # 6. Battery & Portability
        portability_score = 70.0
        if "13" in display_str:
            portability_score = 98.0
        elif "14" in display_str:
            portability_score = 88.0
        elif "15" in display_str:
            portability_score = 65.0
        elif "16" in display_str or "17" in display_str:
            portability_score = 45.0
            
        brand = product.brand.lower()
        battery_score = 60.0
        if brand == "apple":
            battery_score = 98.0
        elif "business" in product.category.lower() or "student" in product.category.lower():
            battery_score = 80.0
            
        if battery_req:
            bat_port_score = battery_score * 0.6 + portability_score * 0.4
        elif portability_req:
            bat_port_score = portability_score * 0.6 + battery_score * 0.4
        else:
            bat_port_score = portability_score * 0.5 + battery_score * 0.5

        # 7. Upgradeability
        upgrade_score = 50.0
        if brand == "apple":
            upgrade_score = 10.0
        elif "gaming" in product.category.lower() or "rog" in product.name.lower() or "tuf" in product.name.lower() or "thinkpad" in product.name.lower():
            upgrade_score = 95.0
        else:
            upgrade_score = 70.0
            
        if upgrade_req and brand == "apple":
            upgrade_score = 5.0
            
        # 8. Purpose Match
        category_lower = product.category.lower()
        purpose_score = 50.0
        if pref_purpose == "gaming":
            if category_lower == "gaming":
                purpose_score = 100.0
            elif "dedicated" in gpu_str or is_dedicated:
                purpose_score = 80.0
        elif pref_purpose == "ai/ml engineering":
            if is_nvidia:
                purpose_score = 100.0
            elif is_dedicated:
                purpose_score = 70.0
        elif pref_purpose == "programming":
            if category_lower == "developer" or "i7" in cpu_str or "ryzen 7" in cpu_str or "m1" in cpu_str or "m2" in cpu_str or "m3" in cpu_str or ram_val >= 16:
                purpose_score = 100.0
            else:
                purpose_score = 75.0
        elif pref_purpose == "student usage":
            if category_lower == "student" or category_lower == "ultrabook" or portability_score >= 80:
                purpose_score = 100.0
            else:
                purpose_score = 80.0
        elif pref_purpose == "video/content creation":
            if display_score >= 90 and is_dedicated:
                purpose_score = 100.0
            elif is_dedicated:
                purpose_score = 85.0
        else:
            purpose_score = 100.0

        # Weights configuration
        w_budget = 0.15
        w_cpu = 0.15
        w_gpu = 0.15
        w_ram = 0.15
        w_display = 0.10
        w_bat_port = 0.10
        w_upgrade = 0.05
        w_purpose = 0.25

        if pref_purpose == "gaming" or pref_purpose == "ai/ml engineering":
            w_gpu = 0.25
            w_cpu = 0.20
            w_ram = 0.15
            w_budget = 0.10
            w_display = 0.10
            w_bat_port = 0.05
            w_upgrade = 0.05
            w_purpose = 0.10
        elif portability_req or battery_req:
            w_bat_port = 0.35
            w_budget = 0.20
            w_cpu = 0.05
            w_gpu = 0.05
            w_ram = 0.10
            w_display = 0.10
            w_upgrade = 0.05
            w_purpose = 0.10

        # Constraints multipliers
        multiplier = 1.0
        if pref_brand and pref_brand.lower() != brand:
            multiplier *= 0.4
        if pref_cond and pref_cond.lower() != product.condition.lower():
            multiplier *= 0.6
        if pref_os:
            if pref_os == "macOS" and brand != "apple":
                multiplier *= 0.2
            elif pref_os == "Windows" and brand == "apple":
                multiplier *= 0.3
                
        compatibility = (
            budget_score * w_budget +
            cpu_score * w_cpu +
            gpu_score * w_gpu +
            ram_score * w_ram +
            display_score * w_display +
            bat_port_score * w_bat_port +
            upgrade_score * w_upgrade +
            purpose_score * w_purpose
        ) * multiplier
        
        compatibility = min(max(compatibility, 0.0), 100.0)

        storage_str = str(specs.get("storage", "")).lower()
        storage_score = 50
        if "2tb" in storage_str:
            storage_score = 100
        elif "1tb" in storage_str:
            storage_score = 85
        elif "512" in storage_str:
            storage_score = 70
        elif "256" in storage_str:
            storage_score = 50

        productivity_bench = int((cpu_score * 0.4 + ram_score * 0.4 + storage_score * 0.2))
        gaming_bench = int((gpu_score * 0.6 + cpu_score * 0.3 + ram_score * 0.1))
        ai_ml_bench = int((gpu_score * 0.6 + ram_score * 0.25 + cpu_score * 0.15))
        
        bench_scores = {
            "cpu_score": int(cpu_score),
            "gpu_score": int(gpu_score),
            "portability_score": int(portability_score),
            "battery_score": int(battery_score),
            "productivity_score": productivity_bench,
            "gaming_score": gaming_bench,
            "ai_ml_score": ai_ml_bench,
            "total_score": round(compatibility, 1)
        }
        
        scored_items.append((product, bench_scores, compatibility))
        
    scored_items.sort(key=lambda x: x[2], reverse=True)
    return scored_items

def score_catalog_laptops(
    products: List[models.Product],
    prefs: Dict[str, Any]
) -> List[Tuple[models.Product, Dict[str, Any], float]]:
    """
    Backward-compatible wrapper for score_catalog_laptops_enhanced.
    """
    explicit = {
        "budget": prefs.get("budget"),
        "brand": prefs.get("brand"),
        "condition": prefs.get("condition"),
        "screen_size": prefs.get("screen_size"),
        "os_preference": prefs.get("os_preference")
    }
    
    purpose = prefs.get("purpose")
    inferred = {
        "purpose": purpose,
        "ram_min": 16 if (prefs.get("ai_ml") or prefs.get("gaming") or "programming" in str(purpose).lower()) else 8,
        "nvidia_gpu_required": bool(prefs.get("ai_ml")),
        "cuda_compatible": bool(prefs.get("ai_ml")),
        "gpu_dedicated_required": bool(prefs.get("gaming") or prefs.get("ai_ml")),
        "portability_high": bool(prefs.get("portability")),
        "battery_high": bool(prefs.get("battery")),
        "upgradeability_required": "student" in str(purpose).lower() or "programming" in str(purpose).lower(),
        "strong_cpu_required": "programming" in str(purpose).lower() or "ai" in str(purpose).lower() or "gaming" in str(purpose).lower(),
        "color_accurate_display": "creation" in str(purpose).lower() or "design" in str(purpose).lower()
    }
    
    return score_catalog_laptops_enhanced(products, explicit, inferred)

def get_rule_based_response(history: List[models.ChatMessage], prefs: Dict[str, Any], matches: List[Tuple[models.Product, Dict[str, Any], float]]) -> str:
    """
    Fallback conversational response builder when Gemini is unavailable.
    """
    confidence = calculate_confidence_score(prefs)
    
    if confidence < 0.70:
        if prefs.get("budget") is None:
            return STAGE_QUESTIONS[0]["question"]
        elif prefs.get("purpose") is None:
            return STAGE_QUESTIONS[1]["question"]
        elif not prefs.get("portability") and not prefs.get("battery") and len(history) < 6:
            return STAGE_QUESTIONS[2]["question"]
        else:
            return STAGE_QUESTIONS[3]["question"]
            
    if not matches:
        return (
            "Currently unavailable in our inventory.\n\n"
            "I checked our warehouse, but we do not have a matching laptop in stock right now. "
            "However, I recommend looking into these brand-new options:\n"
            "- **ASUS Zenbook 14 OLED** (Intel Core Ultra 7, 16GB RAM, 1TB SSD) - Est: 360,000 LKR\n"
            "- **Lenovo Yoga Slim 7** (Ryzen 7 7840U, 16GB RAM, 512GB SSD) - Est: 320,000 LKR\n"
            "- **Dell Inspiron 14** (Core i5 13th Gen, 16GB RAM, 512GB SSD) - Est: 240,000 LKR\n\n"
            "Would you like us to source one of these for you? Simply click the **'Submit Sourcing Request'** "
            "button below, and our team will find it for you at the best price!"
        )
        
    lead_match = matches[0]
    prod, scores, compatibility = lead_match
    
    response = (
        f"Wonderful news! I searched our stock and found **{len(matches[:3])} perfect matches** for you!\n\n"
        f"### 🥇 My Top Recommendation: {prod.brand} {prod.name}\n"
        f"* **Price**: {prod.price:,.0f} LKR\n"
        f"* **Specs**: {prod.specs.get('cpu', '')} | {prod.specs.get('ram', '')} RAM | {prod.specs.get('storage', '')} Storage\n"
        f"* **Condition**: {prod.condition}\n"
        f"* **Compatibility Match**: {compatibility:.1f}%\n\n"
        f"**Why I selected this device for you**:\n"
    )
    
    purpose = str(prefs.get("purpose") or "").lower()
    if "gaming" in purpose or prefs.get("gaming"):
        response += f"- It features a high-performance **{prod.specs.get('gpu', 'Dedicated GPU')}** capable of rendering modern titles smoothly.\n"
    elif "ai" in purpose or "ml" in purpose:
        response += f"- The GPU configuration ({prod.specs.get('gpu', '')}) and {prod.specs.get('ram', '')} RAM will support local CUDA model executions.\n"
    else:
        response += f"- It provides a solid balance of computing power with {prod.specs.get('cpu', '')} for everyday productivity.\n"
        
    if prefs.get("battery") or prefs.get("portability"):
        if prod.brand.lower() == "apple":
            response += "- MacBooks offer top-tier silent, fanless efficiency and extreme 15+ hour battery cycles for travelers.\n"
        else:
            response += "- Lightweight chassis configuration facilitates easy portability for workspace commutes.\n"
            
    response += f"\n* **Upgrade Advice**: If you require extra space later, we can upgrade this device's storage from {prod.specs.get('storage', '')} to 1TB NVMe for just 15,000 LKR.\n\n"
    
    if len(matches) > 1:
        response += "Other alternatives you can check out:\n"
        for alt_prod, alt_scores, alt_comp in matches[1:3]:
            response += f"- **{alt_prod.brand} {alt_prod.name}** ({alt_prod.price:,.0f} LKR, Match: {alt_comp:.1f}%) - [View Product](/product/{alt_prod.id})\n"
            
    return response


# =====================================================================
# AGENT TOOL EXECUTIONS & LOGGING
# =====================================================================

def search_inventory(db: Session, query: Optional[str] = None, brand: Optional[str] = None, price_max: Optional[float] = None, condition: Optional[str] = None) -> List[Dict[str, Any]]:
    """Tool: Searches local database catalog."""
    logger.info("Executing Tool Call [search_inventory] - Args: query=%s, brand=%s, price_max=%s, condition=%s", query, brand, price_max, condition)
    
    q = db.query(models.Product).filter(models.Product.stock > 0)
    if brand:
        q = q.filter(models.Product.brand.ilike(brand))
    if condition:
        q = q.filter(models.Product.condition.ilike(condition))
    if price_max:
        q = q.filter(models.Product.price <= price_max)
    if query:
        q = q.filter(
            models.Product.name.ilike(f"%{query}%") |
            models.Product.description.ilike(f"%{query}%")
        )
        
    results = q.all()
    logger.info("Tool Call [search_inventory] - Matches Found: %d", len(results))
    
    return [
        {
            "id": p.id,
            "name": p.name,
            "brand": p.brand,
            "price": p.price,
            "condition": p.condition,
            "stock": p.stock,
            "specs": p.specs
        }
        for p in results[:10]
    ]

def get_product_details(db: Session, product_id: int) -> Dict[str, Any]:
    """Tool: Fetch exact specs by product ID."""
    logger.info("Executing Tool Call [get_product_details] - Args: product_id=%d", product_id)
    
    prod = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not prod:
        logger.warning("Tool Call [get_product_details] - Product NOT found for ID: %d", product_id)
        return {"error": f"Product with ID {product_id} not found."}
        
    logger.info("Tool Call [get_product_details] - Found: %s %s", prod.brand, prod.name)
    return {
        "id": prod.id,
        "name": prod.name,
        "brand": prod.brand,
        "price": prod.price,
        "condition": prod.condition,
        "specs": prod.specs,
        "description": prod.description,
        "stock": prod.stock,
        "rating": prod.rating
    }

def compare_products(db: Session, product_ids: List[int]) -> Dict[str, Any]:
    """Tool: Side-by-side benchmark comparison."""
    logger.info("Executing Tool Call [compare_products] - Args: product_ids=%s", product_ids)
    
    products = db.query(models.Product).filter(models.Product.id.in_(product_ids)).all()
    if not products:
        return {"error": "No matching products found for comparison."}
        
    scores = {}
    for prod in products:
        # Load or generate benchmarks
        bench = db.query(models.LaptopBenchmark).filter(models.LaptopBenchmark.product_id == prod.id).first()
        if not bench:
            prefs = {"budget": prod.price, "purpose": prod.category}
            _, calc_scores, _ = score_catalog_laptops([prod], prefs)[0]
            bench = models.LaptopBenchmark(
                product_id=prod.id,
                cpu_score=calc_scores["cpu_score"],
                gpu_score=calc_scores["gpu_score"],
                portability_score=calc_scores["portability_score"],
                battery_score=calc_scores["battery_score"],
                productivity_score=calc_scores["productivity_score"],
                gaming_score=calc_scores["gaming_score"]
            )
            db.add(bench)
            db.commit()
            db.refresh(bench)
            
        scores[str(prod.id)] = {
            "name": f"{prod.brand} {prod.name}",
            "price": prod.price,
            "specs": prod.specs,
            "benchmarks": {
                "Gaming": bench.gaming_score,
                "Productivity": bench.productivity_score,
                "Battery": bench.battery_score,
                "Portability": bench.portability_score
            }
        }
        
    logger.info("Tool Call [compare_products] - Compared count: %d", len(products))
    return scores

def create_product_request(db: Session, customer_name: str, email: str, phone: str, requested_laptop: str, budget: float, use_case: Optional[str] = None) -> Dict[str, Any]:
    """Tool: Sourcing request lead collection."""
    logger.info("Executing Tool Call [create_product_request] - Args: customer=%s, email=%s, laptop=%s, budget=%s", customer_name, email, requested_laptop, budget)
    
    req = models.ProductRequest(
        customer_name=customer_name,
        email=email,
        phone=phone,
        requested_laptop=requested_laptop,
        budget=budget,
        use_case=use_case
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    
    logger.info("Tool Call [create_product_request] - Sourcing lead recorded. ID: %d", req.id)
    return {
        "status": "success",
        "message": "Product request has been submitted successfully.",
        "request_id": req.id
    }

def search_external_laptops(brand: str, budget: float, use_case: Optional[str] = None) -> List[Dict[str, Any]]:
    """Tool: Simulated search fallback manufacturer options."""
    logger.info("Executing Tool Call [search_external_laptops] - Args: brand=%s, budget=%s, use_case=%s", brand, budget, use_case)
    
    # Static model configurations matching criteria
    options = [
        {"brand": "Asus", "name": "Zenbook 14 OLED", "price": 360000, "cpu": "Intel Core Ultra 7", "ram": "16GB", "storage": "1TB SSD"},
        {"brand": "Lenovo", "name": "Yoga Slim 7 Pro", "price": 320000, "cpu": "AMD Ryzen 7 7840U", "ram": "16GB", "storage": "512GB SSD"},
        {"brand": "Dell", "name": "Inspiron 14", "price": 240000, "cpu": "Intel Core i5-1335U", "ram": "16GB", "storage": "512GB SSD"},
        {"brand": "HP", "name": "Pavilion Plus 14", "price": 280000, "cpu": "AMD Ryzen 5 7540U", "ram": "16GB", "storage": "512GB SSD"},
        {"brand": "MSI", "name": "Modern 15", "price": 195000, "cpu": "Intel Core i5-1235U", "ram": "8GB", "storage": "512GB SSD"},
        {"brand": "Acer", "name": "Swift Go 14", "price": 265000, "cpu": "Intel Core Ultra 5", "ram": "16GB", "storage": "512GB SSD"}
    ]
    
    matches = [o for o in options if o["brand"].lower() == brand.lower() and o["price"] <= budget * 1.25]
    if not matches:
        matches = [o for o in options if o["price"] <= budget * 1.25][:3]
        
    logger.info("Tool Call [search_external_laptops] - External Matches: %d", len(matches))
    return matches


# =====================================================================
# AGENT ORCHESTRATOR LOOP
# =====================================================================



async def handle_chat_message(
    db: Session,
    session_id: str,
    message_text: str,
    user_id: Optional[int] = None
) -> Dict[str, Any]:
    """
    Core entrypoint for AI Consultant Widget requests.
    Delegates execution planning, context processing, and tools sequence to the Reasoning Planner.
    """
    return await planner_service.execute_reasoning_pipeline(db, session_id, message_text, user_id)


async def compare_multiple_laptops(db: Session, product_ids: List[int]) -> Dict[str, Any]:
    """
    AI Compare Agent service logic that creates granular scores and natural text comparisons.
    Routes entirely through the Reasoning Planner layer.
    """
    products = db.query(models.Product).filter(models.Product.id.in_(product_ids)).all()
    if not products:
        return {"error": "No matching laptops found in inventory."}
        
    scores = {}
    for prod in products:
        bench = db.query(models.LaptopBenchmark).filter(models.LaptopBenchmark.product_id == prod.id).first()
        if not bench:
            prefs = {"budget": prod.price, "purpose": prod.category}
            _, calc_scores, _ = score_catalog_laptops([prod], prefs)[0]
            bench = models.LaptopBenchmark(
                product_id=prod.id,
                cpu_score=calc_scores["cpu_score"],
                gpu_score=calc_scores["gpu_score"],
                portability_score=calc_scores["portability_score"],
                battery_score=calc_scores["battery_score"],
                productivity_score=calc_scores["productivity_score"],
                gaming_score=calc_scores["gaming_score"]
            )
            db.add(bench)
            db.commit()
            db.refresh(bench)
            
        gaming = bench.gaming_score
        productivity = bench.productivity_score
        battery = bench.battery_score
        portability = bench.portability_score
        
        gpu_str = str(prod.specs.get("gpu", "")).lower()
        if "rtx 4090" in gpu_str or "rtx 4080" in gpu_str:
            ai_ml = 98
        elif "rtx 4070" in gpu_str or "rtx 4060" in gpu_str:
            ai_ml = 88
        elif "rtx 30" in gpu_str or "rtx 4050" in gpu_str:
            ai_ml = 75
        elif "apple" in gpu_str or "m1" in str(prod.specs.get("cpu")).lower() or "m2" in str(prod.specs.get("cpu")).lower() or "m3" in str(prod.specs.get("cpu")).lower():
            ai_ml = 72
        else:
            ai_ml = 45
            
        raw_spec_sum = bench.cpu_score + bench.gpu_score + (90 if "32" in str(prod.specs.get("ram")) else 70)
        value_metric = raw_spec_sum / (prod.price / 1000.0)
        value_for_money = int(min(max(value_metric * 12, 45), 98))
        
        scores[str(prod.id)] = {
            "Gaming": gaming,
            "Productivity": productivity,
            "AI/ML": ai_ml,
            "Battery": battery,
            "Portability": portability,
            "Value for Money": value_for_money
        }

    # 1. Start a comparison planning session
    session_id = f"compare_{'_'.join(map(str, sorted(product_ids)))}"
    
    # 2. Formulate message describing the comparison request
    message_text = f"I want to compare these laptop IDs side-by-side: {', '.join(map(str, product_ids))}"
    
    # 3. Route through execute_reasoning_pipeline
    pipeline_res = await planner_service.execute_reasoning_pipeline(db, session_id, message_text)
    
    return {
        "product_ids": product_ids,
        "comparison_text": pipeline_res["message"],
        "scores": scores
    }
