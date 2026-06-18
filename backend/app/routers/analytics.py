from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
import datetime

from app import models, schemas
from app.auth import get_current_admin
from app.database import get_db

router = APIRouter(prefix="/admin/analytics", tags=["Admin Analytics"])

@router.get("", response_model=schemas.AnalyticsResponse)
def get_admin_analytics(
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    # Total Revenue (only count Non-Cancelled orders)
    revenue_result = db.query(func.sum(models.Order.total_price)).filter(models.Order.status != "Cancelled").scalar()
    revenue = float(revenue_result) if revenue_result is not None else 0.0

    # Total Orders
    orders_count = db.query(models.Order).count()

    # Total Customers
    customers_count = db.query(models.User).filter(models.User.role == "customer").count()

    # Total Products
    products_count = db.query(models.Product).count()

    # Recent Orders (Top 10)
    recent_orders_db = db.query(models.Order).order_by(models.Order.created_at.desc()).limit(10).all()
    # Cast models.Order objects as Pydantic models for response serialization
    recent_orders = [schemas.OrderResponse.from_orm(o) for o in recent_orders_db]

    # Sales by Category
    # We iterate over all non-cancelled orders and aggregate product categories
    sales_by_category: Dict[str, float] = {}
    all_orders = db.query(models.Order).filter(models.Order.status != "Cancelled").all()
    for o in all_orders:
        items = o.items  # JSON list
        for item in items:
            product_id = item.get("product_id")
            quantity = item.get("quantity", 1)
            price = item.get("price", 0.0)
            
            # Fetch product category
            prod = db.query(models.Product).filter(models.Product.id == product_id).first()
            category = prod.category if prod else "Other"
            
            sales_by_category[category] = sales_by_category.get(category, 0.0) + (price * quantity)

    # Monthly Sales Chart data (Last 6 Months)
    monthly_sales: List[Dict[str, Any]] = []
    today = datetime.date.today()
    
    for i in range(5, -1, -1):
        # Calculate start and end of that month
        # Simplistic date manipulation
        month_delta = today - datetime.timedelta(days=30 * i)
        year = month_delta.year
        month = month_delta.month
        month_name = month_delta.strftime("%B")
        
        # Calculate sum for this month
        month_start = datetime.datetime(year, month, 1)
        if month == 12:
            month_end = datetime.datetime(year + 1, 1, 1)
        else:
            month_end = datetime.datetime(year, month + 1, 1)
            
        month_rev_result = db.query(func.sum(models.Order.total_price)).filter(
            models.Order.created_at >= month_start,
            models.Order.created_at < month_end,
            models.Order.status != "Cancelled"
        ).scalar()
        
        month_rev = float(month_rev_result) if month_rev_result is not None else 0.0
        
        monthly_sales.append({
            "name": month_name[:3], # e.g. "Jan", "Feb"
            "sales": month_rev
        })

    return {
        "revenue": revenue,
        "orders_count": orders_count,
        "customers_count": customers_count,
        "products_count": products_count,
        "recent_orders": recent_orders,
        "sales_by_category": sales_by_category,
        "monthly_sales": monthly_sales
    }
