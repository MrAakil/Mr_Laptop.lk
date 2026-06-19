"""
Admin User Management Router
─────────────────────────────
Secure admin-only endpoints for managing platform users.
All routes require `Depends(get_current_admin)`.
"""

import datetime
import math
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import get_current_admin
from app.database import get_db

router = APIRouter(prefix="/admin/users", tags=["Admin User Management"])


# ────────────────────────────────────────────────────
# Helper: build a user list item with computed fields
# ────────────────────────────────────────────────────

def _user_to_list_item(user: models.User, db: Session) -> schemas.AdminUserListItem:
    """Convert a User ORM object into an AdminUserListItem with aggregates."""
    # Total orders & total spent
    order_agg = (
        db.query(
            func.count(models.Order.id).label("cnt"),
            func.coalesce(func.sum(models.Order.total_amount), 0.0).label("total"),
        )
        .filter(
            models.Order.user_id == user.id,
            models.Order.order_status != "Cancelled",
        )
        .first()
    )

    # Wishlist count
    wishlist_count = (
        db.query(func.count())
        .select_from(models.wishlist_association)
        .filter(models.wishlist_association.c.user_id == user.id)
        .scalar()
    ) or 0

    return schemas.AdminUserListItem(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        phone=user.phone,
        role=user.role,
        account_status=getattr(user, "account_status", "active") or "active",
        created_at=user.created_at,
        last_login=getattr(user, "last_login", None),
        total_orders=order_agg.cnt if order_agg else 0,
        total_spent=float(order_agg.total) if order_agg else 0.0,
        wishlist_count=wishlist_count,
    )


# ────────────────────────────────────────────────────
# GET  /api/admin/users/stats
# ────────────────────────────────────────────────────

@router.get("/stats", response_model=schemas.AdminUserStats)
def get_user_stats(
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Aggregate counters for the header stat cards."""
    base = db.query(models.User).filter(
        or_(
            models.User.account_status != "deleted",
            models.User.account_status.is_(None),
        )
    )
    total_users = base.count()
    active_users = base.filter(
        or_(
            models.User.account_status == "active",
            models.User.account_status.is_(None),
        )
    ).count()
    admin_users = base.filter(models.User.role == "admin").count()
    suspended_users = base.filter(models.User.account_status == "suspended").count()

    # New this month
    now = datetime.datetime.now(datetime.UTC)
    month_start = datetime.datetime(now.year, now.month, 1)
    new_this_month = base.filter(models.User.created_at >= month_start).count()

    return schemas.AdminUserStats(
        total_users=total_users,
        active_users=active_users,
        admin_users=admin_users,
        new_users_this_month=new_this_month,
        suspended_users=suspended_users,
    )


# ────────────────────────────────────────────────────
# GET  /api/admin/users
# ────────────────────────────────────────────────────

@router.get("", response_model=schemas.AdminUserListResponse)
def list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    role: Optional[str] = Query(None),           # "admin" | "customer"
    status_filter: Optional[str] = Query(None, alias="status"),  # "active" | "suspended"
    sort_by: Optional[str] = Query("created_at"),
    sort_dir: Optional[str] = Query("desc"),     # "asc" | "desc"
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Paginated user list with search, filtering, and sorting."""

    # Base query – exclude soft-deleted
    query = db.query(models.User).filter(
        or_(
            models.User.account_status != "deleted",
            models.User.account_status.is_(None),
        )
    )

    # Search across name, email, phone
    if search:
        pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                models.User.full_name.ilike(pattern),
                models.User.email.ilike(pattern),
                models.User.phone.ilike(pattern),
            )
        )

    # Role filter
    if role and role in ("admin", "customer"):
        query = query.filter(models.User.role == role)

    # Status filter
    if status_filter and status_filter in ("active", "suspended"):
        query = query.filter(models.User.account_status == status_filter)

    # Total count (before pagination)
    total = query.count()

    # Sorting
    SORTABLE = {
        "created_at": models.User.created_at,
        "full_name": models.User.full_name,
        "email": models.User.email,
        "role": models.User.role,
    }
    sort_col = SORTABLE.get(sort_by, models.User.created_at)
    if sort_dir == "asc":
        query = query.order_by(sort_col.asc())
    else:
        query = query.order_by(sort_col.desc())

    # Paginate
    offset = (page - 1) * per_page
    users_page = query.offset(offset).limit(per_page).all()

    # Build response items with computed fields
    items = [_user_to_list_item(u, db) for u in users_page]
    total_pages = max(1, math.ceil(total / per_page))

    return schemas.AdminUserListResponse(
        users=items,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages,
    )


# ────────────────────────────────────────────────────
# GET  /api/admin/users/{user_id}
# ────────────────────────────────────────────────────

@router.get("/{user_id}", response_model=schemas.AdminUserDetail)
def get_user_detail(
    user_id: int,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Full user profile for the detail side-panel."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Orders
    orders = (
        db.query(models.Order)
        .filter(models.Order.user_id == user.id)
        .order_by(models.Order.created_at.desc())
        .all()
    )

    total_spent = sum(
        o.total_amount for o in orders if o.order_status != "Cancelled"
    )

    # Wishlist products – return lightweight dicts
    wishlist_prods = []
    for p in user.wishlist_products:
        wishlist_prods.append({
            "id": p.id,
            "name": p.name,
            "brand": p.brand,
            "price": p.price,
            "image_url": p.image_urls[0] if p.image_urls else None,
        })

    order_items = []
    for o in orders:
        order_items.append(schemas.AdminUserOrderItem(
            id=o.id,
            order_number=o.order_number,
            total_amount=o.total_amount,
            order_status=o.order_status,
            payment_status=o.payment_status,
            payment_method=o.payment_method,
            items=o.items,
            created_at=o.created_at,
        ))

    return schemas.AdminUserDetail(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        phone=user.phone,
        address=user.address,
        role=user.role,
        account_status=getattr(user, "account_status", "active") or "active",
        created_at=user.created_at,
        last_login=getattr(user, "last_login", None),
        total_orders=len(orders),
        total_spent=total_spent,
        wishlist_count=len(wishlist_prods),
        cart_items=0,  # Cart is client-side only in this architecture
        orders=order_items,
        wishlist_products=wishlist_prods,
    )


# ────────────────────────────────────────────────────
# PUT  /api/admin/users/{user_id}
# ────────────────────────────────────────────────────

@router.put("/{user_id}", response_model=schemas.AdminUserListItem)
def update_user(
    user_id: int,
    payload: schemas.AdminUserUpdate,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Update user role, status, or profile details."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent admin from demoting/suspending themselves
    if user.id == current_admin.id:
        if payload.role and payload.role != "admin":
            raise HTTPException(
                status_code=400,
                detail="You cannot demote your own admin account",
            )
        if payload.account_status and payload.account_status != "active":
            raise HTTPException(
                status_code=400,
                detail="You cannot suspend your own account",
            )

    # Validate role
    if payload.role and payload.role not in ("admin", "customer"):
        raise HTTPException(status_code=400, detail="Invalid role value")

    # Validate account_status
    if payload.account_status and payload.account_status not in ("active", "suspended"):
        raise HTTPException(status_code=400, detail="Invalid account status value")

    # Apply updates
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)

    return _user_to_list_item(user, db)


# ────────────────────────────────────────────────────
# DELETE  /api/admin/users/{user_id}  (soft delete)
# ────────────────────────────────────────────────────

@router.delete("/{user_id}", status_code=status.HTTP_200_OK)
def delete_user(
    user_id: int,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Soft-delete a user by setting account_status to 'deleted'."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent admin from deleting themselves
    if user.id == current_admin.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot delete your own admin account",
        )

    user.account_status = "deleted"
    db.commit()

    return {"message": f"User {user.full_name} has been deleted successfully"}
