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

    @property
    def is_admin(self) -> bool:
        return self.role == "admin"

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

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    explicit_requirements = Column(Text, nullable=True)
    inferred_requirements = Column(Text, nullable=True)
    rejected_laptops = Column(Text, nullable=True)
    session_context = Column(Text, nullable=True)

    # Relationships
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")
    user = relationship("User")

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("chat_sessions.session_id", ondelete="CASCADE"), nullable=False)
    role = Column(String, nullable=False)  # "user", "assistant"
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    session = relationship("ChatSession", back_populates="messages")

class ProductRequest(Base):
    __tablename__ = "product_requests"

    id = Column(Integer, primary_key=True, index=True)
    customer_name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    requested_laptop = Column(String, nullable=False)
    budget = Column(Float, nullable=False)
    use_case = Column(String, nullable=True)
    status = Column(String, default="New")  # "New", "Pending", "Fulfilled", "Cancelled"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class LaptopBenchmark(Base):
    __tablename__ = "laptop_benchmarks"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=True, unique=True)
    cpu_score = Column(Integer, default=50)
    gpu_score = Column(Integer, default=50)
    portability_score = Column(Integer, default=50)
    battery_score = Column(Integer, default=50)
    productivity_score = Column(Integer, default=50)
    gaming_score = Column(Integer, default=50)

    # Relationships
    product = relationship("Product", backref="benchmark", uselist=False)

class AgentAnalytics(Base):
    __tablename__ = "agent_analytics"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, nullable=True)
    recommended_product = Column(String, nullable=False)
    conversion_status = Column(String, default="Recommended")  # Recommended, Clicked, Purchased
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

