import os
import unittest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models import User, Product, Order, Review, OrderItem
from app.auth import MAX_BCRYPT_PASSWORD_BYTES, get_password_hash, verify_password

class TestMrLaptopBackend(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Setup testing database
        cls.db_file = "test_mr_laptop.db"
        if os.path.exists(cls.db_file):
            os.remove(cls.db_file)
            
        cls.engine = create_engine(f"sqlite:///{cls.db_file}")
        cls.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=cls.engine)
        Base.metadata.create_all(bind=cls.engine)

    @classmethod
    def tearDownClass(cls):
        # Cleanup
        cls.engine.dispose()
        if os.path.exists(cls.db_file):
            os.remove(cls.db_file)

    def setUp(self):
        self.db = self.SessionLocal()

    def tearDown(self):
        self.db.close()

    def test_user_creation_and_auth(self):
        # Verify password hashing
        password = "test_secure_password_123"
        hashed = get_password_hash(password)
        self.assertNotEqual(password, hashed)
        self.assertTrue(verify_password(password, hashed))
        self.assertFalse(verify_password("wrong_password", hashed))

        # Save test user
        user = User(
            email="test_user@mrlaptop.lk",
            hashed_password=hashed,
            full_name="Test User",
            role="customer"
        )
        self.db.add(user)
        self.db.commit()

        # Query user
        queried = self.db.query(User).filter(User.email == "test_user@mrlaptop.lk").first()
        self.assertIsNotNone(queried)
        self.assertEqual(queried.full_name, "Test User")
        self.assertEqual(queried.role, "customer")

    def test_password_hashing_accepts_bcrypt_limit(self):
        password = "a" * MAX_BCRYPT_PASSWORD_BYTES
        hashed = get_password_hash(password)
        self.assertTrue(verify_password(password, hashed))

    def test_password_hashing_rejects_over_bcrypt_limit(self):
        password = "a" * (MAX_BCRYPT_PASSWORD_BYTES + 1)
        with self.assertRaises(ValueError):
            get_password_hash(password)

    def test_product_specs_and_json(self):
        # Save product with specs JSON
        product = Product(
            name="Test MacBook Air",
            brand="Apple",
            condition="New",
            price=350000.0,
            discount=5.0,
            specs={
                "cpu": "Apple M3",
                "ram": "16GB",
                "storage": "512GB SSD"
            },
            image_urls=["http://test-image.com/img.png"],
            category="Student",
            stock=10
        )
        self.db.add(product)
        self.db.commit()

        # Query and assert JSON specs parsing
        queried = self.db.query(Product).filter(Product.brand == "Apple").first()
        self.assertIsNotNone(queried)
        self.assertEqual(queried.specs["ram"], "16GB")
        self.assertEqual(queried.specs["cpu"], "Apple M3")

    def test_order_stock_decrement(self):
        # Create the product inside this test so it does not depend on test order.
        product = Product(
            name="Order Test MacBook Air",
            brand="Apple",
            condition="New",
            price=350000.0,
            discount=5.0,
            specs={
                "cpu": "Apple M3",
                "ram": "16GB",
                "storage": "512GB SSD"
            },
            image_urls=["http://test-image.com/img.png"],
            category="Student",
            stock=10
        )
        self.db.add(product)
        self.db.commit()
        self.db.refresh(product)

        initial_stock = product.stock
        order_qty = 2

        # Create Order
        unit_price = product.price * (1 - (product.discount / 100))
        total_item_price = unit_price * order_qty

        order = Order(
            order_number="ML-TEST-0001",
            user_id=1,
            customer_name="Test Customer",
            customer_email="cust@email.com",
            customer_phone="123456",
            shipping_address="Colombo, SL",
            city="Colombo",
            district="Colombo",
            postal_code="00300",
            subtotal=total_item_price,
            total_amount=total_item_price,
            payment_method="Cash on Delivery",
            order_status="Pending",
            payment_status="Pending",
            items=[
                OrderItem(
                    product_id=product.id,
                    product_name=product.name,
                    product_image=product.image_urls[0] if product.image_urls else "",
                    unit_price=unit_price,
                    quantity=order_qty,
                    total_price=total_item_price
                )
            ]
        )
        
        # Decrement product stock inside test
        product.stock -= order_qty
        self.db.add(order)
        self.db.commit()

        # Verify stock updated
        updated_product = self.db.query(Product).filter(Product.id == product.id).first()
        self.assertEqual(updated_product.stock, initial_stock - order_qty)

if __name__ == "__main__":
    unittest.main()
