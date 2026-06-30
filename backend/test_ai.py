import os
import unittest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.models import User, Product, ChatSession, ChatMessage, ProductRequest, LaptopBenchmark
from app.services import ai_agent
from app.main import app

class TestMRLaptopAISystem(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Setup testing database
        cls.db_file = "test_mr_laptop_ai.db"
        if os.path.exists(cls.db_file):
            os.remove(cls.db_file)
            
        cls.engine = create_engine(f"sqlite:///{cls.db_file}", connect_args={"check_same_thread": False})
        cls.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=cls.engine)
        Base.metadata.create_all(bind=cls.engine)
        
        # Configure TestClient
        def override_get_db():
            db = cls.SessionLocal()
            try:
                yield db
            finally:
                db.close()
                
        app.dependency_overrides[get_db] = override_get_db
        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        cls.engine.dispose()
        if os.path.exists(cls.db_file):
            os.remove(cls.db_file)
        app.dependency_overrides.clear()

    def setUp(self):
        self.db = self.SessionLocal()
        # Seed basic catalog products
        self.p1 = Product(
            name="ROG Strix G16",
            brand="Asus",
            condition="New",
            price=450000.0,
            discount=0.0,
            specs={
                "cpu": "Intel Core i9-13980HX",
                "ram": "32GB DDR5",
                "storage": "1TB PCIe NVMe SSD",
                "gpu": "NVIDIA GeForce RTX 4070",
                "display": "16 inch QHD+ 240Hz",
                "os": "Windows 11 Home"
            },
            image_urls=["http://test-image.com/img.png"],
            category="Gaming",
            stock=5,
            rating=4.8
        )
        self.p2 = Product(
            name="MacBook Air M3",
            brand="Apple",
            condition="New",
            price=310000.0,
            discount=5.0,
            specs={
                "cpu": "Apple M3",
                "ram": "16GB Unified",
                "storage": "512GB SSD",
                "gpu": "10-Core Apple GPU",
                "display": "13.6 inch Liquid Retina",
                "os": "macOS Sonoma"
            },
            image_urls=["http://test-image.com/img.png"],
            category="Student",
            stock=12,
            rating=4.9
        )
        self.db.add(self.p1)
        self.db.add(self.p2)
        self.db.commit()
        self.db.refresh(self.p1)
        self.db.refresh(self.p2)

    def tearDown(self):
        # Truncate tables
        self.db.query(Product).delete()
        self.db.query(ChatSession).delete()
        self.db.query(ChatMessage).delete()
        self.db.query(ProductRequest).delete()
        self.db.query(LaptopBenchmark).delete()
        self.db.commit()
        self.db.close()

    def test_weighted_scoring_engine(self):
        # Test Gaming Preferences scoring ROG higher than Macbook
        prefs_gaming = {
            "budget": 500000,
            "purpose": "High-end Gaming & Rendering",
            "gaming": True,
            "ai_ml": False,
            "portability": False,
            "battery": False,
            "brand": None,
            "condition": None
        }
        products = [self.p1, self.p2]
        scored = ai_agent.score_catalog_laptops(products, prefs_gaming)
        
        # ROG should be ranked first
        self.assertEqual(scored[0][0].name, "ROG Strix G16")
        # ROG should have higher Gaming compatibility score
        self.assertTrue(scored[0][2] > scored[1][2])

        # Test Portability/Battery Preferences scoring MacBook higher than ROG
        prefs_travel = {
            "budget": 400000,
            "purpose": "Lectures and Travel",
            "gaming": False,
            "ai_ml": False,
            "portability": True,
            "battery": True,
            "brand": None,
            "condition": None
        }
        scored_travel = ai_agent.score_catalog_laptops(products, prefs_travel)
        self.assertEqual(scored_travel[0][0].name, "MacBook Air M3")

    def test_rule_based_preference_parser(self):
        # Mock message log
        m1 = ChatMessage(session_id="test_sess", role="user", message="I have about 300,000 LKR to spend.")
        m2 = ChatMessage(session_id="test_sess", role="user", message="Mainly need it for software development, and maybe some lighter gaming.")
        m3 = ChatMessage(session_id="test_sess", role="user", message="Prefer Asus or Apple. Used condition is okay.")
        
        prefs = ai_agent.parse_preferences_rule_based([m1, m2, m3])
        
        self.assertEqual(prefs["budget"], 300000)
        self.assertEqual(prefs["purpose"], "Programming")
        self.assertEqual(prefs["brand"], "Asus")
        self.assertEqual(prefs["condition"], "Used")
        
        # Check confidence calculation
        conf = ai_agent.calculate_confidence_score(prefs)
        self.assertTrue(conf >= 0.70)

    def test_compare_agent_scores(self):
        ids = [self.p1.id, self.p2.id]
        compare_data = self.client.post("/api/ai/compare", json={"product_ids": ids})
        
        self.assertEqual(compare_data.status_code, 200)
        json_resp = compare_data.json()
        self.assertIn("comparison_text", json_resp)
        self.assertIn("scores", json_resp)
        
        rog_scores = json_resp["scores"][str(self.p1.id)]
        mac_scores = json_resp["scores"][str(self.p2.id)]
        
        # ROG should win in Gaming index
        self.assertTrue(rog_scores["Gaming"] > mac_scores["Gaming"])
        # MacBook should win in Battery index
        self.assertTrue(mac_scores["Battery"] > rog_scores["Battery"])

    def test_product_sourcing_lead_creation(self):
        payload = {
            "customer_name": "Test Customer",
            "email": "customer@gmail.com",
            "phone": "+94 771 234 567",
            "requested_laptop": "ASUS Zenbook 14 OLED",
            "budget": 350000.0,
            "use_case": "Programming and office work"
        }
        res = self.client.post("/api/ai/request", json=payload)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["requested_laptop"], "ASUS Zenbook 14 OLED")
        self.assertEqual(res.json()["status"], "New")

        # Verify insertion in database
        req = self.db.query(ProductRequest).filter(ProductRequest.customer_name == "Test Customer").first()
        self.assertIsNotNone(req)
        self.assertEqual(req.budget, 350000.0)

    def test_consultant_chat_endpoint(self):
        # Start new session
        res1 = self.client.post("/api/ai/chat", json={"message": "Looking for a coding laptop for 320k LKR"})
        self.assertEqual(res1.status_code, 200)
        data = res1.json()
        self.assertIn("session_id", data)
        self.assertIn("message", data)
        self.assertIn("preferences", data)
        
        sess_id = data["session_id"]
        # Verify message logged
        user_msgs = self.db.query(ChatMessage).filter(ChatMessage.session_id == sess_id, ChatMessage.role == "user").all()
        self.assertEqual(len(user_msgs), 1)
        self.assertEqual(user_msgs[0].message, "Looking for a coding laptop for 320k LKR")

        # Check alternative suggestions when stock is empty
        self.db.query(Product).delete()
        self.db.commit()
        res2 = self.client.post("/api/ai/chat", json={"session_id": sess_id, "message": "My budget is 300k, need a travel laptop"})
        self.assertEqual(res2.status_code, 200)
        msg_content = res2.json().get("message", "")
        print(f"DEBUG_TEST_RES2_MSG: {msg_content}")
        self.assertTrue("Currently unavailable in our inventory" in msg_content or "sourcing request" in msg_content.lower())

    def test_agent_tools(self):
        # 1. Test search_inventory
        inv = ai_agent.search_inventory(self.db, brand="Asus")
        self.assertEqual(len(inv), 1)
        self.assertEqual(inv[0]["name"], "ROG Strix G16")

        # 2. Test get_product_details
        details = ai_agent.get_product_details(self.db, self.p2.id)
        self.assertEqual(details["name"], "MacBook Air M3")
        self.assertEqual(details["brand"], "Apple")

        # 3. Test compare_products
        comp = ai_agent.compare_products(self.db, [self.p1.id, self.p2.id])
        self.assertIn(str(self.p1.id), comp)
        self.assertIn(str(self.p2.id), comp)
        self.assertEqual(comp[str(self.p2.id)]["name"], "Apple MacBook Air M3")

        # 4. Test create_product_request
        req = ai_agent.create_product_request(
            db=self.db,
            customer_name="Sourcing Client",
            email="sourcing@gmail.com",
            phone="+94 712 345 678",
            requested_laptop="ASUS Zenbook Pro Duo",
            budget=450000.0,
            use_case="Design"
        )
        self.assertEqual(req["status"], "success")
        
        # Verify in DB
        db_req = self.db.query(ProductRequest).filter(ProductRequest.customer_name == "Sourcing Client").first()
        self.assertIsNotNone(db_req)

        # 5. Test search_external_laptops
        ext = ai_agent.search_external_laptops("Lenovo", 350000.0)
        self.assertTrue(len(ext) > 0)
        self.assertEqual(ext[0]["brand"], "Lenovo")

    def test_reasoning_and_requirements_inference(self):
        # 1. Test infer_requirements_from_history
        m1 = ChatMessage(session_id="test_inference", role="user", message="I am an IT student planning to do deep learning AI training.")
        m2 = ChatMessage(session_id="test_inference", role="user", message="I have a budget of 400k LKR and prefer Apple.")
        
        explicit, inferred = ai_agent.infer_requirements_from_history([m1, m2])
        self.assertEqual(explicit["budget"], 400000)
        self.assertEqual(explicit["brand"], "Apple")
        self.assertEqual(inferred["purpose"], "AI/ML Engineering")
        self.assertTrue(inferred["nvidia_gpu_required"])
        self.assertTrue(inferred["cuda_compatible"])
        self.assertTrue(inferred["portability_high"])
        self.assertEqual(inferred["ram_min"], 16)
        
        # 2. Test handle_chat_message updates explicit and inferred requirements in DB
        res = self.db.query(ChatSession).filter(ChatSession.session_id == "test_inference").first()
        self.assertIsNone(res)
        
        # Trigger chat logic
        import asyncio
        async def run_chat():
            return await ai_agent.handle_chat_message(self.db, "test_inference", "I am an IT student looking for deep learning specs. Budget 400k LKR.")
            
        chat_res = asyncio.run(run_chat())
        
        # Verify columns updated in database
        session = self.db.query(ChatSession).filter(ChatSession.session_id == "test_inference").first()
        self.assertIsNotNone(session)
        self.assertIsNotNone(session.explicit_requirements)
        self.assertIsNotNone(session.inferred_requirements)
        
        import json
        exp_db = json.loads(session.explicit_requirements)
        inf_db = json.loads(session.inferred_requirements)
        self.assertEqual(exp_db["budget"], 400000)
        self.assertEqual(inf_db["purpose"], "AI/ML Engineering")

    def test_reasoning_planner_pipeline(self):
        from app.services.planner_memory import extract_memory_from_history
        from app.services import planner_service
        import json
        import asyncio

        # Pre-seed session in DB
        sess = ChatSession(session_id="test_planner_pipeline")
        self.db.add(sess)
        self.db.commit()

        # Add message logs
        m1 = ChatMessage(session_id="test_planner_pipeline", role="user", message="I do not want Apple. Avoid Dell.")
        m2 = ChatMessage(session_id="test_planner_pipeline", role="user", message="I commute travel a lot and need good battery backup.")
        self.db.add(m1)
        self.db.add(m2)
        self.db.commit()

        # Run memory extraction
        history = self.db.query(ChatMessage).filter(ChatMessage.session_id == "test_planner_pipeline").all()
        rejected, context = extract_memory_from_history(history, sess)

        # Check extracted rejections
        self.assertIn("Apple", rejected)
        self.assertIn("Dell", rejected)

        # Check extracted context
        self.assertEqual(context["travel_frequency"], "High")
        self.assertEqual(context["battery_preference"], "High")

        # Check DB updates
        self.db.commit()
        db_sess = self.db.query(ChatSession).filter(ChatSession.session_id == "test_planner_pipeline").first()
        self.assertIsNotNone(db_sess.rejected_laptops)
        self.assertIsNotNone(db_sess.session_context)

        # Trigger chat orchestration execution
        async def run_pipeline():
            return await planner_service.execute_reasoning_pipeline(
                self.db, "test_planner_pipeline", "I need a coding laptop, budget 300000 LKR."
            )
        res = asyncio.run(run_pipeline())
        self.assertEqual(res["session_id"], "test_planner_pipeline")
        self.assertIsNotNone(res["message"])

    def test_recommendations_endpoint(self):
        payload = {
            "budget": 350000.0,
            "purpose": "Programming",
            "gaming": False,
            "ai_ml": False,
            "portability": True,
            "battery": True,
            "brand": "Apple",
            "condition": "New"
        }
        res = self.client.post("/api/ai/recommend", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(isinstance(data, list))

    def test_chat_session_initialization(self):
        import uuid
        new_sess_id = f"test_init_{uuid.uuid4()}"
        res = self.client.get(f"/api/ai/chat/session/{new_sess_id}")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        
        self.assertEqual(data["session_id"], new_sess_id)
        self.assertTrue(len(data["messages"]) > 0)
        
        welcome_msg = data["messages"][0]
        self.assertEqual(welcome_msg["role"], "assistant")
        self.assertIsNotNone(welcome_msg["message"])
        self.assertFalse("What is your budget" in welcome_msg["message"])
        self.assertTrue(any(x in welcome_msg["message"].lower() for x in ["use", "help", "welcome"]))


