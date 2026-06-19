import random
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc, func

from app import models, schemas
from app.auth import get_current_user, get_current_admin
from app.database import get_db
from app.email_service import send_order_created_email, send_order_status_email
from app.services.invoice import generate_invoice_pdf

# Router for customers: /api/orders
router = APIRouter(prefix="/orders", tags=["Customer Orders"])

# Router for admins: /api/admin/orders
admin_router = APIRouter(prefix="/admin/orders", tags=["Admin Orders"])


def generate_unique_order_number() -> str:
    date_str = datetime.utcnow().strftime("%Y%m%d")
    random_digits = "".join(random.choices("0123456789", k=4))
    return f"ML-{date_str}-{random_digits}"


def generate_unique_invoice_number() -> str:
    date_str = datetime.utcnow().strftime("%Y%m%d")
    random_digits = "".join(random.choices("0123456789", k=4))
    return f"INV-{date_str}-{random_digits}"


# ──────────────────────────────────────────────────────────
# CUSTOMER ROUTERS (prefix: /api/orders)
# ──────────────────────────────────────────────────────────

@router.post("", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    order_data: schemas.OrderCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not order_data.items:
        raise HTTPException(status_code=400, detail="Cannot place an order with an empty cart")

    subtotal = 0.0
    items_to_save = []
    
    # Process items, check stock
    for item in order_data.items:
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product with ID {item.product_id} not found")
        if product.stock < item.quantity:
            raise HTTPException(
                status_code=400, 
                detail=f"Insufficient stock for {product.name}. Available: {product.stock}, Ordered: {item.quantity}"
            )
        
        # Calculate discount pricing
        discounted_unit_price = product.price * (1 - (product.discount / 100))
        item_total_price = discounted_unit_price * item.quantity
        subtotal += item_total_price
        
        # Decrement product stock
        product.stock -= item.quantity
        
        order_item = models.OrderItem(
            product_id=product.id,
            product_name=product.name,
            product_image=product.image_urls[0] if product.image_urls else "",
            unit_price=discounted_unit_price,
            quantity=item.quantity,
            total_price=item_total_price
        )
        items_to_save.append(order_item)

    # Free shipping default, zero discount on total
    shipping_fee = 0.0
    discount = 0.0
    total_amount = subtotal + shipping_fee - discount

    # Instantiate Order
    new_order = models.Order(
        order_number=generate_unique_order_number(),
        user_id=current_user.id,
        customer_name=order_data.customer_name,
        customer_email=order_data.customer_email,
        customer_phone=order_data.customer_phone,
        shipping_address=order_data.shipping_address,
        city=order_data.city,
        district=order_data.district,
        postal_code=order_data.postal_code,
        subtotal=subtotal,
        shipping_fee=shipping_fee,
        discount=discount,
        total_amount=total_amount,
        payment_method=order_data.payment_method,
        payment_status=models.PaymentStatus.PENDING.value,
        order_status=models.OrderStatus.PENDING.value,
        notes=order_data.notes,
        invoice_number=generate_unique_invoice_number(),
        items=items_to_save
    )

    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    # Trigger email notifications asynchronously/inline
    try:
        send_order_created_email(new_order)
    except Exception as exc:
        # Don't block order placement on mail server errors
        db.utility_error = str(exc)

    return new_order


@router.get("", response_model=List[schemas.OrderResponse])
def get_my_orders(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(models.Order).filter(
        models.Order.user_id == current_user.id,
        models.Order.is_deleted == False
    ).order_by(desc(models.Order.created_at)).all()


@router.get("/{id}", response_model=schemas.OrderResponse)
def get_order_details(
    id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(models.Order).filter(
        models.Order.id == id,
        models.Order.is_deleted == False
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Ownership guard
    if order.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="You do not have access to this order")
        
    return order


@router.put("/{id}/cancel", response_model=schemas.OrderResponse)
def cancel_order(
    id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(models.Order).filter(
        models.Order.id == id,
        models.Order.is_deleted == False
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Ownership check
    if order.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="You do not have access to cancel this order")

    # Cancel eligibility check (only Pending status)
    if order.order_status != models.OrderStatus.PENDING.value:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot cancel order with status: {order.order_status}. Contact support."
        )

    # Transition order status and restore inventory levels
    order.order_status = models.OrderStatus.CANCELLED.value
    order.payment_status = models.PaymentStatus.FAILED.value
    
    for item in order.items:
        if item.product_id:
            product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
            if product:
                product.stock += item.quantity

    db.commit()
    db.refresh(order)

    # Dispatch status change email
    try:
        send_order_status_email(order)
    except Exception:
        pass

    return order


@router.get("/{id}/invoice")
def get_order_invoice(
    id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(models.Order).filter(
        models.Order.id == id,
        models.Order.is_deleted == False
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    # Check privileges
    if order.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    pdf_buffer = generate_invoice_pdf(order)
    filename = f"Invoice-{order.order_number}.pdf"
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# ──────────────────────────────────────────────────────────
# ADMIN ROUTERS (prefix: /api/admin/orders)
# ──────────────────────────────────────────────────────────

@admin_router.get("", response_model=schemas.AdminOrderListResponse)
def admin_get_orders(
    page: int = 1,
    per_page: int = 10,
    search: Optional[str] = None,
    order_status: Optional[str] = None,
    payment_status: Optional[str] = None,
    sort_by: str = "created_at",
    sort_dir: str = "desc",
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    query = db.query(models.Order).filter(models.Order.is_deleted == False)

    # Filters
    if order_status:
        query = query.filter(models.Order.order_status == order_status)
    if payment_status:
        query = query.filter(models.Order.payment_status == payment_status)

    # Search (order number, name, email, phone)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                models.Order.order_number.like(search_term),
                models.Order.customer_name.like(search_term),
                models.Order.customer_email.like(search_term),
                models.Order.customer_phone.like(search_term)
            )
        )

    # Sorting
    sort_attr = getattr(models.Order, sort_by, models.Order.created_at)
    if sort_dir == "asc":
        query = query.order_by(asc(sort_attr))
    else:
        query = query.order_by(desc(sort_attr))

    # Pagination maths
    total = query.count()
    total_pages = max(1, (total + per_page - 1) // per_page)
    offset = (page - 1) * per_page
    orders_list = query.offset(offset).limit(per_page).all()

    return {
        "orders": orders_list,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages
    }


@admin_router.get("/stats", response_model=schemas.AdminOrderStatsResponse)
def admin_get_order_stats(
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    # Retrieve all active records
    orders = db.query(models.Order).filter(models.Order.is_deleted == False).all()
    
    total_orders = len(orders)
    
    # Calculate revenue: Sum of total_amount for Completed/Delivered or Paid orders
    revenue = sum(
        o.total_amount for o in orders 
        if o.order_status == models.OrderStatus.DELIVERED.value or o.payment_status == models.PaymentStatus.PAID.value
    )
    
    pending_orders = sum(1 for o in orders if o.order_status == models.OrderStatus.PENDING.value)
    processing_orders = sum(1 for o in orders if o.order_status == models.OrderStatus.PROCESSING.value)
    shipped_orders = sum(1 for o in orders if o.order_status == models.OrderStatus.SHIPPED.value)
    delivered_orders = sum(1 for o in orders if o.order_status == models.OrderStatus.DELIVERED.value)
    cancelled_orders = sum(1 for o in orders if o.order_status == models.OrderStatus.CANCELLED.value)
    
    # Average Order Value calculated over non-cancelled orders
    non_cancelled_orders = [o for o in orders if o.order_status != models.OrderStatus.CANCELLED.value]
    average_order_value = 0.0
    if non_cancelled_orders:
        average_order_value = sum(o.total_amount for o in non_cancelled_orders) / len(non_cancelled_orders)

    return {
        "total_orders": total_orders,
        "revenue": revenue,
        "pending_orders": pending_orders,
        "processing_orders": processing_orders,
        "shipped_orders": shipped_orders,
        "delivered_orders": delivered_orders,
        "cancelled_orders": cancelled_orders,
        "average_order_value": average_order_value
    }


@admin_router.get("/{id}", response_model=schemas.OrderResponse)
def admin_get_order(
    id: int,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    order = db.query(models.Order).filter(
        models.Order.id == id,
        models.Order.is_deleted == False
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@admin_router.put("/{id}", response_model=schemas.OrderResponse)
def admin_update_order(
    id: int,
    update_data: schemas.OrderUpdate,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    order = db.query(models.Order).filter(
        models.Order.id == id,
        models.Order.is_deleted == False
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    old_status = order.order_status

    # Apply updates
    if update_data.order_status is not None:
        order.order_status = update_data.order_status
    if update_data.payment_status is not None:
        order.payment_status = update_data.payment_status
    if update_data.tracking_number is not None:
        order.tracking_number = update_data.tracking_number
    if update_data.notes is not None:
        order.notes = update_data.notes

    # Handle transitions: Inventory restitution on cancellation
    if order.order_status == models.OrderStatus.CANCELLED.value and old_status != models.OrderStatus.CANCELLED.value:
        for item in order.items:
            if item.product_id:
                product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
                if product:
                    product.stock += item.quantity
    # Reverse inventory if status is changed back from Cancelled
    elif old_status == models.OrderStatus.CANCELLED.value and order.order_status != models.OrderStatus.CANCELLED.value:
        for item in order.items:
            if item.product_id:
                product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
                if product:
                    if product.stock < item.quantity:
                        raise HTTPException(
                            status_code=400, 
                            detail=f"Cannot undo cancellation. Insufficient stock for {product.name}."
                        )
                    product.stock -= item.quantity

    db.commit()
    db.refresh(order)

    # Fire status change email notification
    if update_data.order_status is not None and old_status != update_data.order_status:
        try:
            send_order_status_email(order)
        except Exception:
            pass

    return order


@admin_router.delete("/{id}", status_code=status.HTTP_200_OK)
def admin_delete_order(
    id: int,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    order = db.query(models.Order).filter(
        models.Order.id == id,
        models.Order.is_deleted == False
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Soft delete
    order.is_deleted = True
    db.commit()
    return {"message": "Order soft-deleted successfully."}
