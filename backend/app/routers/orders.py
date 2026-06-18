from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app import models, schemas
from app.auth import get_current_user, get_current_admin
from app.database import get_db

router = APIRouter(prefix="/orders", tags=["Orders"])

@router.post("", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    order_data: schemas.OrderCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not order_data.items:
        raise HTTPException(status_code=400, detail="Cannot place an order with an empty cart")
        
    total_price = 0.0
    items_to_save = []
    
    # Process items and verify stock
    for item in order_data.items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product with ID {item.product_id} not found")
        if product.stock < item.quantity:
            raise HTTPException(
                status_code=400, 
                detail=f"Insufficient stock for {product.name}. Available: {product.stock}, Ordered: {item.quantity}"
            )
            
        # Calculate pricing with discount if any
        discounted_price = product.price * (1 - (product.discount / 100))
        item_total = discounted_price * item.quantity
        total_price += item_total
        
        # Decrement stock
        product.stock -= item.quantity
        
        items_to_save.append({
            "product_id": product.id,
            "name": product.name,
            "quantity": item.quantity,
            "price": discounted_price,
            "image_url": product.image_urls[0] if product.image_urls else ""
        })

    # Create the order record
    new_order = models.Order(
        user_id=current_user.id,
        total_price=total_price,
        status="Pending",
        payment_method=order_data.payment_method,
        shipping_address=order_data.shipping_address,
        phone=order_data.phone,
        email=order_data.email,
        items=items_to_save
    )
    
    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    return new_order

@router.get("", response_model=List[schemas.OrderResponse])
def get_orders(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Admin sees all orders; normal user only sees their own
    if current_user.role == "admin":
        return db.query(models.Order).order_by(models.Order.created_at.desc()).all()
    else:
        return db.query(models.Order).filter(models.Order.user_id == current_user.id).order_by(models.Order.created_at.desc()).all()

@router.get("/{order_id}", response_model=schemas.OrderResponse)
def get_order(
    order_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    # Check authorization
    if current_user.role != "admin" and order.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not have access to this order")
        
    return order

@router.put("/{order_id}/status", response_model=schemas.OrderResponse)
def update_order_status(
    order_id: int,
    order_update: schemas.OrderUpdate,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    valid_statuses = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"]
    if order_update.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {valid_statuses}")
        
    order.status = order_update.status
    db.commit()
    db.refresh(order)
    return order
