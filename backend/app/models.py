import datetime
import enum
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, JSON, Text, Table, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

# Association Table for Wishlist (Many-to-Many between User and Product)
wishlist_association = Table(
    'wishlist',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id', ondelete="CASCADE"), primary_key=True),
    Column('product_id', Integer, ForeignKey('products.id', ondelete="CASCADE"), primary_key=True)
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, default="customer")  # admin, customer
    account_status = Column(String, default="active")  # active, suspended, deleted
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

    # Relationships
    orders = relationship("Order", back_populates="user", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="user", cascade="all, delete-orphan")
    wishlist_products = relationship("Product", secondary=wishlist_association, back_populates="wishlisted_by")

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    brand = Column(String, nullable=False, index=True)  # Apple, Dell, HP, Lenovo, Asus, Acer, MSI, Razer
    condition = Column(String, nullable=False)  # New, Used, Refurbished
    price = Column(Float, nullable=False)
    discount = Column(Float, default=0.0)  # discount percentage e.g. 10.0 for 10%
    specs = Column(JSON, nullable=False)  # {"ram": "16GB", "storage": "512GB SSD", "cpu": "Core i7", "gpu": "RTX 4060", "display": "15.6 FHD"}
    description = Column(Text, nullable=True)
    image_urls = Column(JSON, nullable=False)  # ["url1", "url2"]
    category = Column(String, nullable=False, index=True)  # Gaming, Business, Student, Creator, Used, Accessories
    stock = Column(Integer, default=5)
    rating = Column(Float, default=5.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    reviews = relationship("Review", back_populates="product", cascade="all, delete-orphan")
    wishlisted_by = relationship("User", secondary=wishlist_association, back_populates="wishlist_products")

class OrderStatus(str, enum.Enum):
    PENDING = "Pending"
    CONFIRMED = "Confirmed"
    PROCESSING = "Processing"
    SHIPPED = "Shipped"
    DELIVERED = "Delivered"
    CANCELLED = "Cancelled"

class PaymentStatus(str, enum.Enum):
    PENDING = "Pending"
    PAID = "Paid"
    FAILED = "Failed"
    REFUNDED = "Refunded"

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String, unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    customer_name = Column(String, nullable=False)
    customer_email = Column(String, nullable=False)
    customer_phone = Column(String, nullable=False)
    shipping_address = Column(Text, nullable=False)
    city = Column(String, nullable=False)
    district = Column(String, nullable=False)
    postal_code = Column(String, nullable=False)
    subtotal = Column(Float, nullable=False)
    shipping_fee = Column(Float, default=0.0, nullable=False)
    discount = Column(Float, default=0.0, nullable=False)
    total_amount = Column(Float, nullable=False)
    payment_method = Column(String, nullable=False)
    payment_status = Column(String, default=PaymentStatus.PENDING.value, nullable=False)
    order_status = Column(String, default=OrderStatus.PENDING.value, nullable=False)
    tracking_number = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    invoice_number = Column(String, nullable=True)
    is_deleted = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    product_name = Column(String, nullable=False)
    product_image = Column(String, nullable=True)
    unit_price = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False)
    total_price = Column(Float, nullable=False)

    # Relationships
    order = relationship("Order", back_populates="items")
    product = relationship("Product")

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    rating = Column(Integer, nullable=False)  # 1 to 5
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="reviews")
    product = relationship("Product", back_populates="reviews")
