from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import List, Optional, Dict, Any
from datetime import datetime

BCRYPT_MAX_PASSWORD_BYTES = 72
BCRYPT_PASSWORD_MESSAGE = "Password must be 72 bytes or fewer when encoded as UTF-8"

# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# --- User Schemas ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    address: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

    @field_validator("password")
    @classmethod
    def password_fits_bcrypt(cls, value: str) -> str:
        if len(value.encode("utf-8")) > BCRYPT_MAX_PASSWORD_BYTES:
            raise ValueError(BCRYPT_PASSWORD_MESSAGE)
        return value

class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)

    @field_validator("password")
    @classmethod
    def password_fits_bcrypt(cls, value: str) -> str:
        if len(value.encode("utf-8")) > BCRYPT_MAX_PASSWORD_BYTES:
            raise ValueError(BCRYPT_PASSWORD_MESSAGE)
        return value

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class UserResponse(UserBase):
    id: int
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Review Schemas ---
class ReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None

class ReviewResponse(BaseModel):
    id: int
    user_id: int
    product_id: int
    rating: int
    comment: Optional[str]
    created_at: datetime
    user_name: Optional[str] = None

    class Config:
        from_attributes = True

# --- Product Schemas ---
class ProductSpecs(BaseModel):
    cpu: str
    ram: str
    storage: str
    gpu: str
    display: str
    os: str

class ProductBase(BaseModel):
    name: str
    brand: str
    condition: str  # New, Used, Refurbished
    price: float
    discount: float = 0.0
    specs: ProductSpecs
    description: Optional[str] = None
    image_urls: List[str]
    category: str  # Gaming, Business, Student, Creator, Used, Accessories
    stock: int = 5

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    brand: Optional[str] = None
    condition: Optional[str] = None
    price: Optional[float] = None
    discount: Optional[float] = None
    specs: Optional[ProductSpecs] = None
    description: Optional[str] = None
    image_urls: Optional[List[str]] = None
    category: Optional[str] = None
    stock: Optional[int] = None

class ProductResponse(ProductBase):
    id: int
    rating: float
    created_at: datetime

    class Config:
        from_attributes = True

# --- Order Schemas ---
class OrderItemSchema(BaseModel):
    product_id: int
    name: str
    quantity: int
    price: float

class OrderCreate(BaseModel):
    payment_method: str  # Cash on Delivery, Bank Transfer
    shipping_address: str
    phone: str
    email: str
    items: List[OrderItemSchema]

class OrderUpdate(BaseModel):
    status: str

class OrderResponse(BaseModel):
    id: int
    user_id: Optional[int]
    total_price: float
    status: str
    payment_method: str
    shipping_address: str
    phone: str
    email: str
    items: List[OrderItemSchema]
    created_at: datetime

    class Config:
        from_attributes = True

# --- Analytics Schemas ---
class AnalyticsResponse(BaseModel):
    revenue: float
    orders_count: int
    customers_count: int
    products_count: int
    recent_orders: List[OrderResponse]
    sales_by_category: Dict[str, float]
    monthly_sales: List[Dict[str, Any]]


# ──────────────────────────────────────────────────────────
# Admin – User Management Schemas
# ──────────────────────────────────────────────────────────

class AdminUserListItem(BaseModel):
    """Compact user row for the admin table."""
    id: int
    full_name: str
    email: str
    phone: Optional[str] = None
    role: str
    account_status: str
    created_at: datetime
    last_login: Optional[datetime] = None
    total_orders: int = 0
    total_spent: float = 0.0
    wishlist_count: int = 0

    class Config:
        from_attributes = True


class AdminUserOrderItem(BaseModel):
    """Order row inside the user-detail drawer."""
    id: int
    total_price: float
    status: str
    payment_method: str
    items: List[OrderItemSchema]
    created_at: datetime

    class Config:
        from_attributes = True


class AdminUserDetail(BaseModel):
    """Full user profile for the detail side-panel."""
    id: int
    full_name: str
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None
    role: str
    account_status: str
    created_at: datetime
    last_login: Optional[datetime] = None
    # Shopping aggregates
    total_orders: int = 0
    total_spent: float = 0.0
    wishlist_count: int = 0
    cart_items: int = 0
    # Full order history
    orders: List[AdminUserOrderItem] = []
    # Wishlist product IDs (names shown client-side)
    wishlist_products: List[Dict[str, Any]] = []

    class Config:
        from_attributes = True


class AdminUserUpdate(BaseModel):
    """Payload accepted by PUT /api/admin/users/{id}."""
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    role: Optional[str] = None              # "admin" | "customer"
    account_status: Optional[str] = None    # "active" | "suspended"


class AdminUserStats(BaseModel):
    """Aggregate counters for the header stat cards."""
    total_users: int
    active_users: int
    admin_users: int
    new_users_this_month: int
    suspended_users: int


class AdminUserListResponse(BaseModel):
    """Paginated wrapper returned by GET /api/admin/users."""
    users: List[AdminUserListItem]
    total: int
    page: int
    per_page: int
    total_pages: int


class ContactInquiry(BaseModel):
    name: str = Field(..., min_length=1)
    email: EmailStr
    phone: str = Field(..., min_length=1)
    service: str = Field(..., min_length=1)
    message: str = Field(..., min_length=1)


