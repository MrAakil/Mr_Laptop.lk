import os
import unittest
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.database import Base, get_db
from app.main import app
from app import models, schemas
from app.auth import get_password_hash, create_access_token

# Test database setup
TEST_DB_FILE = "test_mr_laptop_orders.db"
if os.path.exists(TEST_DB_FILE):
    os.remove(TEST_DB_FILE)

engine = create_engine(f"sqlite:///{TEST_DB_FILE}", connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables
Base.metadata.create_all(bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

class TestMrLaptopOrders(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Create users
        db = TestingSessionLocal()
        
        cls.cust_email = "test_cust@mrlaptop.lk"
        cls.customer = models.User(
            email=cls.cust_email,
            hashed_password=get_password_hash("password123"),
            full_name="Test Customer",
            role="customer",
            account_status="active"
        )
        db.add(cls.customer)
        
        cls.admin_email = "test_admin@mrlaptop.lk"
        cls.admin = models.User(
            email=cls.admin_email,
            hashed_password=get_password_hash("password123"),
            full_name="Test Admin",
            role="admin",
            account_status="active"
        )
        db.add(cls.admin)
        
        # Create a sample laptop product
        cls.product = models.Product(
            name="MacBook Air M3 Test",
            brand="Apple",
            condition="New",
            price=300000.0,
            discount=10.0,  # 10% discount -> 270,000 LKR
            specs={"cpu": "M3", "ram": "8GB", "storage": "256GB SSD", "gpu": "8-core", "display": "13.6 Retina", "os": "macOS"},
            image_urls=["http://example.com/macbook.png"],
            category="Student",
            stock=5,
            rating=5.0
        )
        db.add(cls.product)
        
        db.commit()
        db.refresh(cls.customer)
        db.refresh(cls.admin)
        db.refresh(cls.product)
        
        # Tokens
        cls.cust_token = create_access_token(data={"sub": cls.customer.email, "role": cls.customer.role})
        cls.admin_token = create_access_token(data={"sub": cls.admin.email, "role": cls.admin.role})
        
        db.close()

    @classmethod
    def tearDownClass(cls):
        # Cleanup test DB file
        if os.path.exists(TEST_DB_FILE):
            os.remove(TEST_DB_FILE)

    def test_01_checkout_validation_and_stock(self):
        # Headers
        headers = {"Authorization": f"Bearer {self.cust_token}"}
        
        # Cart with items
        payload = {
            "customer_name": "Test Customer",
            "customer_email": self.cust_email,
            "customer_phone": "+94771234567",
            "shipping_address": "456 Galle Road",
            "city": "Colombo",
            "district": "Colombo",
            "postal_code": "00300",
            "notes": "Fragile tech",
            "payment_method": "Cash on Delivery",
            "items": [
                {
                    "product_id": self.product.id,
                    "quantity": 2
                }
            ]
        }
        
        response = client.post("/api/orders", json=payload, headers=headers)
        self.assertEqual(response.status_code, 201)
        
        data = response.json()
        self.assertIn("order_number", data)
        self.assertIn("invoice_number", data)
        self.assertEqual(data["subtotal"], 540000.0) # 270,000 * 2
        self.assertEqual(data["total_amount"], 540000.0)
        self.assertEqual(data["order_status"], "Pending")
        self.assertEqual(data["payment_status"], "Pending")
        self.assertEqual(len(data["items"]), 1)
        self.assertEqual(data["items"][0]["product_name"], "MacBook Air M3 Test")
        
        # Verify product stock depleted (5 - 2 = 3)
        db = TestingSessionLocal()
        p = db.query(models.Product).filter(models.Product.id == self.product.id).first()
        self.assertEqual(p.stock, 3)
        db.close()

    def test_02_checkout_out_of_stock_fails(self):
        headers = {"Authorization": f"Bearer {self.cust_token}"}
        
        # Request 4 units (only 3 left)
        payload = {
            "customer_name": "Test Customer",
            "customer_email": self.cust_email,
            "customer_phone": "+94771234567",
            "shipping_address": "456 Galle Road",
            "city": "Colombo",
            "district": "Colombo",
            "postal_code": "00300",
            "payment_method": "Cash on Delivery",
            "items": [
                {
                    "product_id": self.product.id,
                    "quantity": 4
                }
            ]
        }
        
        response = client.post("/api/orders", json=payload, headers=headers)
        self.assertEqual(response.status_code, 400)
        self.assertIn("Insufficient stock", response.json()["detail"])

    def test_03_customer_get_and_cancel_order(self):
        headers = {"Authorization": f"Bearer {self.cust_token}"}
        
        # Get customer orders
        response = client.get("/api/orders", headers=headers)
        self.assertEqual(response.status_code, 200)
        orders = response.json()
        self.assertEqual(len(orders), 1)
        order_id = orders[0]["id"]
        
        # Get order details
        response_detail = client.get(f"/api/orders/{order_id}", headers=headers)
        self.assertEqual(response_detail.status_code, 200)
        self.assertEqual(response_detail.json()["order_number"], orders[0]["order_number"])
        
        # Cancel order
        response_cancel = client.put(f"/api/orders/{order_id}/cancel", headers=headers)
        self.assertEqual(response_cancel.status_code, 200)
        self.assertEqual(response_cancel.json()["order_status"], "Cancelled")
        self.assertEqual(response_cancel.json()["payment_status"], "Failed")
        
        # Verify product stock restored (3 + 2 = 5)
        db = TestingSessionLocal()
        p = db.query(models.Product).filter(models.Product.id == self.product.id).first()
        self.assertEqual(p.stock, 5)
        db.close()

    def test_04_admin_list_and_stats(self):
        admin_headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Get admin orders list
        response = client.get("/api/admin/orders", headers=admin_headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["total"], 1)
        self.assertEqual(len(data["orders"]), 1)
        
        # Get stats
        stats_response = client.get("/api/admin/orders/stats", headers=admin_headers)
        self.assertEqual(stats_response.status_code, 200)
        stats = stats_response.json()
        self.assertEqual(stats["total_orders"], 1)
        self.assertEqual(stats["cancelled_orders"], 1)
        self.assertEqual(stats["revenue"], 0.0)  # Cancelled has no revenue

    def test_05_admin_update_order_and_soft_delete(self):
        admin_headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        db = TestingSessionLocal()
        order = db.query(models.Order).first()
        order_id = order.id
        db.close()
        
        # Update order status to Processing and payment to Paid
        payload = {
            "order_status": "Processing",
            "payment_status": "Paid",
            "tracking_number": "TRK123456",
            "notes": "Admin updated note"
        }
        
        response = client.put(f"/api/admin/orders/{order_id}", json=payload, headers=admin_headers)
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertEqual(data["order_status"], "Processing")
        self.assertEqual(data["payment_status"], "Paid")
        self.assertEqual(data["tracking_number"], "TRK123456")
        self.assertEqual(data["notes"], "Admin updated note")
        
        # Check stats again
        stats_response = client.get("/api/admin/orders/stats", headers=admin_headers)
        self.assertEqual(stats_response.json()["revenue"], 540000.0) # Processing + Paid adds to revenue
        
        # Soft delete order
        del_response = client.delete(f"/api/admin/orders/{order_id}", headers=admin_headers)
        self.assertEqual(del_response.status_code, 200)
        self.assertEqual(del_response.json()["message"], "Order soft-deleted successfully.")
        
        # Verify order no longer appears in customer lists
        cust_headers = {"Authorization": f"Bearer {self.cust_token}"}
        response_cust = client.get("/api/orders", headers=cust_headers)
        self.assertEqual(len(response_cust.json()), 0)

if __name__ == "__main__":
    unittest.main()
