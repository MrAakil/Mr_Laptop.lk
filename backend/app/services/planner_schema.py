from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class ConfidenceMetrics(BaseModel):
    purpose_confidence: int = Field(..., ge=0, le=100, description="Confidence in customer purpose/use-case (0-100)")
    budget_confidence: int = Field(..., ge=0, le=100, description="Confidence in customer budget parameters (0-100)")
    brand_confidence: int = Field(..., ge=0, le=100, description="Confidence in customer brand preference (0-100)")
    performance_confidence: int = Field(..., ge=0, le=100, description="Confidence in specs / performance class preference (0-100)")
    overall_confidence: int = Field(..., ge=0, le=100, description="Aggregate confidence to recommend laptops (0-100)")

class ExecutionPlan(BaseModel):
    reasoning: str = Field(..., description="Internal thinking process covering Observe, Understand, Infer, Plan, Select Tools, Verify")
    intent: str = Field(..., description="Determined customer intent (e.g. greeting, recommendation, comparison, details, upgrade, budget, inventory, warranty, contact, sourcing, question)")
    known: Dict[str, Any] = Field(..., description="Extract values for budget, purpose, brand, condition, operating_system, screen_size")
    missing: List[str] = Field(..., description="List of missing parameters from: budget, purpose, brand, condition, operating_system, screen_size")
    confidence: ConfidenceMetrics = Field(..., description="Extracted profile confidence metrics")
    tool_sequence: List[str] = Field(..., description="Exact array sequence of tools to run: search_inventory, get_product_details, compare_products, create_product_request, search_external_laptops")
    response_strategy: str = Field(..., description="Next strategy: 'ask_question' (gather details), 'recommend_products' (rank inventory), 'perform_comparison', 'source_product', 'general_response'")
