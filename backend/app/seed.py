import json
from sqlalchemy.orm import Session
from app import models
from app.database import engine, SessionLocal
from app.auth import get_password_hash

def seed_db():
    db = SessionLocal()
    try:
        # 1. Create Admin and Test Customer
        admin_email = "admin@mrlaptop.lk"
        existing_admin = db.query(models.User).filter(models.User.email == admin_email).first()
        if not existing_admin:
            admin_user = models.User(
                email=admin_email,
                hashed_password=get_password_hash("admin123"),
                full_name="Mr. Laptop Admin",
                role="admin",
                phone="+94771234567",
                address="123 Galle Road, Colombo 03, Sri Lanka"
            )
            db.add(admin_user)
            print("Admin user seeded: admin@mrlaptop.lk / admin123")

        customer_email = "customer@mrlaptop.lk"
        existing_customer = db.query(models.User).filter(models.User.email == customer_email).first()
        if not existing_customer:
            customer_user = models.User(
                email=customer_email,
                hashed_password=get_password_hash("customer123"),
                full_name="Harsha Silva",
                role="customer",
                phone="+94779876543",
                address="456 Kandy Road, Kadawatha, Sri Lanka"
            )
            db.add(customer_user)
            print("Customer user seeded: customer@mrlaptop.lk / customer123")

        # 2. Seed Laptop Products
        # Check if products already exist
        product_count = db.query(models.Product).count()
        if product_count == 0:
            sample_products = [
                # Gaming Laptops
                {
                    "name": "Razer Blade 16 (2026)",
                    "brand": "Razer",
                    "condition": "New",
                    "price": 850000.0,
                    "discount": 5.0,
                    "specs": {
                        "cpu": "Intel Core i9-14900HX",
                        "ram": "32GB DDR5",
                        "storage": "2TB NVMe PCIe 4.0 SSD",
                        "gpu": "NVIDIA GeForce RTX 4080 12GB",
                        "display": "16\" QHD+ 240Hz OLED",
                        "os": "Windows 11 Home"
                    },
                    "description": "The Razer Blade 16 is the ultimate gaming powerhouse. Equipped with the latest Intel i9 14th Gen processor and a stunning 240Hz OLED display, it delivers unrivaled speed and screen clarity.",
                    "image_urls": [
                        "https://images.unsplash.com/photo-1603302576837-37561b2e2302?q=80&w=600&auto=format&fit=crop",
                        "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?q=80&w=600&auto=format&fit=crop"
                    ],
                    "category": "Gaming",
                    "stock": 4,
                    "rating": 4.9
                },
                {
                    "name": "ASUS ROG Zephyrus G14",
                    "brand": "Asus",
                    "condition": "New",
                    "price": 650000.0,
                    "discount": 10.0,
                    "specs": {
                        "cpu": "AMD Ryzen 9 8945HS",
                        "ram": "16GB LPDDR5X",
                        "storage": "1TB NVMe SSD",
                        "gpu": "NVIDIA GeForce RTX 4070 8GB",
                        "display": "14\" 3K 120Hz ROG Nebula OLED",
                        "os": "Windows 11 Home"
                    },
                    "description": "Compact, lightweight, and powerful. The ASUS ROG Zephyrus G14 brings portable gaming to a whole new level with Ryzen 9 and RTX 4070, packing a punch in a sleek 14-inch form factor.",
                    "image_urls": [
                        "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?q=80&w=600&auto=format&fit=crop"
                    ],
                    "category": "Gaming",
                    "stock": 5,
                    "rating": 4.8
                },
                
                # Business Laptops
                {
                    "name": "Lenovo ThinkPad X1 Carbon Gen 12",
                    "brand": "Lenovo",
                    "condition": "New",
                    "price": 580000.0,
                    "discount": 0.0,
                    "specs": {
                        "cpu": "Intel Core Ultra 7 155H",
                        "ram": "32GB LPDDR5X",
                        "storage": "1TB PCIe Gen 4 SSD",
                        "gpu": "Intel Arc Graphics",
                        "display": "14\" WUXGA IPS Anti-Glare",
                        "os": "Windows 11 Pro"
                    },
                    "description": "The benchmark for business excellence. Built with aerospace-grade carbon fiber, the ThinkPad X1 Carbon provides robust security, all-day battery life, and legendary keyboard performance.",
                    "image_urls": [
                        "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?q=80&w=600&auto=format&fit=crop"
                    ],
                    "category": "Business",
                    "stock": 6,
                    "rating": 4.7
                },
                {
                    "name": "Dell XPS 13 9340",
                    "brand": "Dell",
                    "condition": "New",
                    "price": 480000.0,
                    "discount": 8.0,
                    "specs": {
                        "cpu": "Intel Core Ultra 7 155H",
                        "ram": "16GB LPDDR5X",
                        "storage": "512GB NVMe SSD",
                        "gpu": "Intel Arc Graphics",
                        "display": "13.4\" FHD+ InfinityEdge",
                        "os": "Windows 11 Home"
                    },
                    "description": "Crafted with precision cut aluminum and glass, the Dell XPS 13 is the epitome of modern premium laptop design. Borderless infinity screen, touch function row, and exceptional battery.",
                    "image_urls": [
                        "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?q=80&w=600&auto=format&fit=crop"
                    ],
                    "category": "Business",
                    "stock": 3,
                    "rating": 4.6
                },

                # Student Laptops
                {
                    "name": "Apple MacBook Air 13\" M3",
                    "brand": "Apple",
                    "condition": "New",
                    "price": 380000.0,
                    "discount": 0.0,
                    "specs": {
                        "cpu": "Apple M3 (8-core CPU / 10-core GPU)",
                        "ram": "8GB Unified Memory",
                        "storage": "256GB Superfast SSD",
                        "gpu": "Apple M3 GPU",
                        "display": "13.6\" Liquid Retina Display",
                        "os": "macOS Sonoma"
                    },
                    "description": "Incredibly thin, lightning fast. The MacBook Air with Apple M3 chip handles coding, multitasking, and casual gaming with ease. Fanless design means complete silence.",
                    "image_urls": [
                        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=600&auto=format&fit=crop"
                    ],
                    "category": "Student",
                    "stock": 8,
                    "rating": 4.9
                },
                {
                    "name": "HP Pavilion 15-eg3000",
                    "brand": "HP",
                    "condition": "New",
                    "price": 220000.0,
                    "discount": 15.0,
                    "specs": {
                        "cpu": "Intel Core i5-1335U",
                        "ram": "8GB DDR4",
                        "storage": "512GB PCIe NVMe SSD",
                        "gpu": "Intel Iris Xe Graphics",
                        "display": "15.6\" FHD Micro-Edge Touch",
                        "os": "Windows 11 Home"
                    },
                    "description": "Perfect companion for school and college tasks. Crisp audio by B&O, fast charge battery, and a sleek natural silver finish at a very competitive price point in Sri Lanka.",
                    "image_urls": [
                        "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?q=80&w=600&auto=format&fit=crop"
                    ],
                    "category": "Student",
                    "stock": 10,
                    "rating": 4.4
                },

                # Creator Laptops
                {
                    "name": "Apple MacBook Pro 16\" M3 Max",
                    "brand": "Apple",
                    "condition": "New",
                    "price": 1150000.0,
                    "discount": 0.0,
                    "specs": {
                        "cpu": "Apple M3 Max (14-core CPU)",
                        "ram": "36GB Unified Memory",
                        "storage": "1TB SSD",
                        "gpu": "Apple M3 Max (30-core GPU)",
                        "display": "16.2\" Liquid Retina XDR",
                        "os": "macOS Sonoma"
                    },
                    "description": "Mind-blowing performance for extreme creative workflows. 3D rendering, 8K video editing, and massive software builds run flawlessly on the MacBook Pro 16\" with M3 Max.",
                    "image_urls": [
                        "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=600&auto=format&fit=crop"
                    ],
                    "category": "Creator",
                    "stock": 2,
                    "rating": 5.0
                },
                {
                    "name": "ASUS Zenbook Pro 14 Duo OLED",
                    "brand": "Asus",
                    "condition": "New",
                    "price": 780000.0,
                    "discount": 12.0,
                    "specs": {
                        "cpu": "Intel Core i9-13900H",
                        "ram": "32GB LPDDR5",
                        "storage": "1TB NVMe SSD",
                        "gpu": "NVIDIA GeForce RTX 4060 8GB",
                        "display": "14.5\" 2.8K 120Hz Touch Screen + ScreenPad Plus",
                        "os": "Windows 11 Home"
                    },
                    "description": "A dual-screen notebook built for productivity. The ASUS ScreenPad Plus secondary screen tilts dynamically to give creators more digital desktop space, cooled by AAA-grade performance hardware.",
                    "image_urls": [
                        "https://images.unsplash.com/photo-1603302576837-37561b2e2302?q=80&w=600&auto=format&fit=crop"
                    ],
                    "category": "Creator",
                    "stock": 3,
                    "rating": 4.7
                },

                # Used Laptops (Budget / Quality Tested)
                {
                    "name": "Lenovo ThinkPad T480 - Used (Excellent)",
                    "brand": "Lenovo",
                    "condition": "Used",
                    "price": 950000.0 / 10, # 95,000 LKR
                    "discount": 0.0,
                    "specs": {
                        "cpu": "Intel Core i5-8350U",
                        "ram": "8GB DDR4",
                        "storage": "256GB SSD",
                        "gpu": "Intel UHD Graphics 620",
                        "display": "14\" HD Anti-Glare",
                        "os": "Windows 10 Pro"
                    },
                    "description": "Budget student/office work beast. Tested and cleaned by Mr_Laptop.lk experts. Dual battery setup for extended battery health, heavy-duty durability.",
                    "image_urls": [
                        "https://images.unsplash.com/photo-1603302576837-37561b2e2302?q=80&w=600&auto=format&fit=crop"
                    ],
                    "category": "Used",
                    "stock": 12,
                    "rating": 4.5
                },
                {
                    "name": "Dell Latitude 7490 - Refurbished",
                    "brand": "Dell",
                    "condition": "Refurbished",
                    "price": 110000.0,
                    "discount": 5.0,
                    "specs": {
                        "cpu": "Intel Core i7-8650U",
                        "ram": "16GB DDR4",
                        "storage": "256GB NVMe SSD",
                        "gpu": "Intel UHD Graphics 620",
                        "display": "14\" FHD IPS Display",
                        "os": "Windows 11 Pro"
                    },
                    "description": "Certified refurbished. Grade A condition with minimal wear. High-performance i7, 16GB RAM for seamless multitasking. Includes a 6-month seller warranty.",
                    "image_urls": [
                        "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?q=80&w=600&auto=format&fit=crop"
                    ],
                    "category": "Used",
                    "stock": 7,
                    "rating": 4.6
                },

                # Accessories
                {
                    "name": "Razer DeathAdder Essential Gaming Mouse",
                    "brand": "Razer",
                    "condition": "New",
                    "price": 8500.0,
                    "discount": 0.0,
                    "specs": {
                        "cpu": "N/A",
                        "ram": "N/A",
                        "storage": "N/A",
                        "gpu": "N/A",
                        "display": "6,400 DPI Optical Sensor",
                        "os": "Windows / macOS"
                    },
                    "description": "The essential gaming mouse. Features an ergonomic form factor built for comfort, a 6,400 DPI optical sensor, and durable Razer mechanical mouse switches.",
                    "image_urls": [
                        "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?q=80&w=600&auto=format&fit=crop"
                    ],
                    "category": "Accessories",
                    "stock": 25,
                    "rating": 4.7
                },
                {
                    "name": "Dell USB-C Dual Video Docking Station (UD22)",
                    "brand": "Dell",
                    "condition": "New",
                    "price": 45000.0,
                    "discount": 10.0,
                    "specs": {
                        "cpu": "N/A",
                        "ram": "N/A",
                        "storage": "N/A",
                        "gpu": "N/A",
                        "display": "Supports Dual 4K Displays",
                        "os": "Universal Compatibility"
                    },
                    "description": "Maximize your workstation setup. Power and connect your laptop to dual 4K monitors and multiple USB accessories using a single USB-C cable.",
                    "image_urls": [
                        "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?q=80&w=600&auto=format&fit=crop"
                    ],
                    "category": "Accessories",
                    "stock": 15,
                    "rating": 4.5
                }
            ]

            for p in sample_products:
                prod = models.Product(**p)
                db.add(prod)
            print("Default laptops and accessories seeded successfully!")
        else:
            print(f"Products database already contains {product_count} items. Skipping seeding.")
        
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    # Ensure tables are created
    models.Base.metadata.create_all(bind=engine)
    seed_db()
