from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import json

from app import models, schemas
from app.auth import get_current_user, get_current_admin
from app.database import get_db

router = APIRouter(prefix="/products", tags=["Products"])

@router.get("", response_model=List[schemas.ProductResponse])
def get_products(
    search: Optional[str] = None,
    brand: Optional[str] = None,
    condition: Optional[str] = None,
    category: Optional[str] = None,
    price_min: Optional[float] = None,
    price_max: Optional[float] = None,
    ram: Optional[str] = None,
    storage: Optional[str] = None,
    processor: Optional[str] = None,
    sort: Optional[str] = "newest",  # price_asc, price_desc, rating, newest
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(models.Product)

    # Basic Filtering
    if brand:
        query = query.filter(models.Product.brand.ilike(brand))
    if condition:
        query = query.filter(models.Product.condition.ilike(condition))
    if category:
        query = query.filter(models.Product.category.ilike(category))
    if price_min is not None:
        query = query.filter(models.Product.price >= price_min)
    if price_max is not None:
        query = query.filter(models.Product.price <= price_max)
    if search:
        query = query.filter(
            models.Product.name.ilike(f"%{search}%") | 
            models.Product.description.ilike(f"%{search}%")
        )

    # Fetch results first to perform database-agnostic JSON filtration and sorting
    products = query.all()

    # JSON specs filters (RAM, Storage, CPU)
    filtered_products = []
    for p in products:
        # Load specs (sometimes stored as string dict in sqlite or dict in postgres)
        specs_dict = p.specs
        if isinstance(specs_dict, str):
            try:
                specs_dict = json.loads(specs_dict)
            except Exception:
                specs_dict = {}

        match_ram = True
        match_storage = True
        match_cpu = True

        if ram:
            match_ram = ram.lower() in str(specs_dict.get("ram", "")).lower()
        if storage:
            match_storage = storage.lower() in str(specs_dict.get("storage", "")).lower()
        if processor:
            match_cpu = processor.lower() in str(specs_dict.get("cpu", "")).lower()

        if match_ram and match_storage and match_cpu:
            filtered_products.append(p)

    # Sort results
    if sort == "price_asc":
        filtered_products.sort(key=lambda x: x.price)
    elif sort == "price_desc":
        filtered_products.sort(key=lambda x: x.price, reverse=True)
    elif sort == "rating":
        filtered_products.sort(key=lambda x: x.rating, reverse=True)
    else:  # newest
        filtered_products.sort(key=lambda x: x.created_at or 0, reverse=True)

    # Apply pagination
    return filtered_products[skip : skip + limit]

@router.get("/wishlist", response_model=List[schemas.ProductResponse])
def get_wishlist(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return current_user.wishlist_products

@router.post("/wishlist/{product_id}")
def toggle_wishlist(
    product_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if product in current_user.wishlist_products:
        current_user.wishlist_products.remove(product)
        message = "Removed from wishlist"
    else:
        current_user.wishlist_products.append(product)
        message = "Added to wishlist"
    
    db.commit()
    return {"message": message, "in_wishlist": product in current_user.wishlist_products}

@router.get("/{product_id}", response_model=schemas.ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.post("", response_model=schemas.ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    product_data: schemas.ProductCreate,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    # Convert Pydantic specs dict back to native dict to save in JSON field
    specs_dict = product_data.specs.dict()
    new_product = models.Product(
        name=product_data.name,
        brand=product_data.brand,
        condition=product_data.condition,
        price=product_data.price,
        discount=product_data.discount,
        specs=specs_dict,
        description=product_data.description,
        image_urls=product_data.image_urls,
        category=product_data.category,
        stock=product_data.stock,
        rating=5.0  # default rating
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

@router.put("/{product_id}", response_model=schemas.ProductResponse)
def update_product(
    product_id: int,
    product_data: schemas.ProductUpdate,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = product_data.dict(exclude_unset=True)
    if "specs" in update_data and update_data["specs"] is not None:
        update_data["specs"] = product_data.specs.dict()
        
    for key, value in update_data.items():
        setattr(product, key, value)
        
    db.commit()
    db.refresh(product)
    return product

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()
    return None

# --- Product Reviews Endpoints ---

@router.get("/{product_id}/reviews", response_model=List[schemas.ReviewResponse])
def get_reviews(product_id: int, db: Session = Depends(get_db)):
    reviews = db.query(models.Review).filter(models.Review.product_id == product_id).all()
    # Inject user full names for display in reviews
    response = []
    for r in reviews:
        user = db.query(models.User).filter(models.User.id == r.user_id).first()
        name = user.full_name if user else "Anonymous"
        r_schema = schemas.ReviewResponse.from_orm(r)
        r_schema.user_name = name
        response.append(r_schema)
    return response

@router.post("/{product_id}/reviews", response_model=schemas.ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_review(
    product_id: int,
    review_data: schemas.ReviewCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check if user already reviewed
    existing_review = db.query(models.Review).filter(
        models.Review.product_id == product_id,
        models.Review.user_id == current_user.id
    ).first()
    
    if existing_review:
        # Update existing review
        existing_review.rating = review_data.rating
        existing_review.comment = review_data.comment
        existing_review.created_at = datetime.datetime.now(datetime.UTC)
        new_review = existing_review
    else:
        # Create new review
        new_review = models.Review(
            user_id=current_user.id,
            product_id=product_id,
            rating=review_data.rating,
            comment=review_data.comment
        )
        db.add(new_review)
    
    db.commit()
    db.refresh(new_review)
    
    # Recalculate average rating for the product
    all_reviews = db.query(models.Review).filter(models.Review.product_id == product_id).all()
    if all_reviews:
        avg_rating = sum(r.rating for r in all_reviews) / len(all_reviews)
        product.rating = round(avg_rating, 1)
        db.commit()
        
    r_schema = schemas.ReviewResponse.from_orm(new_review)
    r_schema.user_name = current_user.full_name
    return r_schema
import datetime
