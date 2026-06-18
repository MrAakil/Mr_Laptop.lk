import datetime
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, JSON, Text, Table
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

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    total_price = Column(Float, nullable=False)
    status = Column(String, default="Pending")  # Pending, Processing, Shipped, Delivered, Cancelled
    payment_method = Column(String, nullable=False)  # Cash on Delivery, Bank Transfer
    shipping_address = Column(Text, nullable=False)
    phone = Column(String, nullable=False)
    email = Column(String, nullable=False)
    items = Column(JSON, nullable=False)  # [{"product_id": 1, "name": "Laptop X", "quantity": 1, "price": 150000}]
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="orders")

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
