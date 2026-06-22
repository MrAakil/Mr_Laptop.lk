# Mr_Laptop.lk - E-Commerce Platform 💻🌌

A world-class, futuristic 3D e-commerce showcase and marketplace for buying and selling new, used, and refurbished laptops. The application is built using a modern **Next.js 16 (React 19) + Tailwind CSS v4** frontend and a highly optimized **FastAPI** backend with database normalization, visual performance benchmarks, and a custom procedural WebGL showroom.

---

## 🚀 Key Features

### 🌌 1. Futuristic 3D Showroom & UI
* **Procedural WebGL 3D Model:** A custom, fully responsive 3D laptop canvas built with vanilla **Three.js** to run at a solid 60 FPS without external model asset overhead.
* **Interactive Cursor Tracking:** Moving the cursor tilts, rotates, and floats the laptop dynamically, altering specular highlights and reflections on the chassis and screen.
* **Secondary Telemetry Canvas:** The 3D laptop screen displays a dynamic offscreen 2D canvas texture with grid systems, system telemetry, and a glowing digital logo.
* **Ambient Particles:** A floating neon cyan particle emitter rises behind the canvas.
* **Glassmorphic Aesthetic:** Deep space black (`#050816`) backing with neon cyan/electric blue ambient auroras, glowing outlines, and premium backdrop blurs.
* **3D Product Elevation:** Product listing cards feature hovering zoom effects, magnetic buttons, and spec chips that float outward on mouse hover.

### 📊 2. Apple-Style Specification Compare Board
* **Visual Benchmarks:** Side-by-side spec comparison graphs mapping CPUs, RAM, SSD capacity, GPUs, and portability indexes.
* **Smart Performance Indicators:** Automatic categorization of hardware capability (e.g., *Extreme Processing*, *Tier-1 Raytracing*, *Ultra Portable*) based on specification string parsing.
* **Snap Scroll Layout:** Horizontal snap-scrolling support for comparing up to three laptops simultaneously.

### 🛒 3. Order Management, Checkout & Invoicing
* **Normalized Data Schema:** Structured order details tracking custom `OrderItem` lists, inventory level validations, and payment statuses.
* **ReportLab PDF Invoices:** Auto-generated, print-ready PDF invoice downloads streamed directly from backend memory.
* **WhatsApp Direct Checkout Redirect:** Successful checkouts generate a detailed summary message with a direct redirect link to text the merchant on WhatsApp.
* **Anti-Spam Rate Limiter:** A sliding-window in-memory IP rate limiter protecting public endpoints (such as `/api/contact`) from abuse.
* **Resend API Integration:** Secure transactional emails powered by `httpx` with automatic sandbox domain bypass and standard SMTP fallback relays.

### 🛡️ 4. Admin Management Console
* **Administrative KPIs:** Dashboard widgets tracking revenue splits, average basket value, and active/completed order pipelines.
* **Order Processing Drawer:** Interactively review purchases, update shipping numbers, modify order states, and download invoices.
* **Case-Insensitive Security:** Strict password verification with `bcrypt`, dynamic role mappings for seeding administrative accounts, and safe JWT token claims (injecting `is_admin` flags).

---

## 🛠️ Technical Stack

### Frontend
* **Framework:** [Next.js 16](https://nextjs.org/) (App Router, React 19 concurrent hydration safety)
* **3D / Animations:** [Three.js](https://threejs.org/) & [GSAP](https://gsap.com/) for micro-interactions
* **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) with PostCSS & OKLCH color spacing
* **State Management:** React Context API (global Auth, Cart, Wishlist, Compare, and Theme state)
* **Icons:** [Lucide React](https://lucide.dev/)

### Backend
* **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python)
* **Web Server:** [Uvicorn](https://www.uvicorn.org/)
* **ORM:** [SQLAlchemy 2.0](https://www.sqlalchemy.org/) (SQLite locally with dynamic support for PostgreSQL)
* **Schemas & Config:** [Pydantic v2](https://docs.pydantic.dev/) & [pydantic-settings](https://docs.pydantic.dev/latest/concepts/pydantic_settings/) for environment variables
* **Email Client:** [Resend API](https://resend.com/) + custom MIME SMTP client

---

## 📂 Project Structure

```text
Laptop Website/
├── backend/               # FastAPI Python Backend
│   ├── requirements.txt   # Python dependencies
│   ├── app/
│   │   ├── main.py        # Application entry point
│   │   ├── config.py      # Pydantic environment configurations
│   │   ├── models.py      # Normalized SQLAlchemy models
│   │   ├── schemas.py     # Pydantic data validation schemas
│   │   ├── routers/       # Auth, products, orders, contact, admin routers
│   │   ├── services/      # Invoices PDF generators & business layers
│   │   └── email_service.py # Email template dispatch service
│   └── test_orders.py     # Automated backend unit tests
└── frontend/              # Next.js React Frontend
    ├── package.json       # Node.js dependencies
    ├── src/
    │   ├── app/           # App Router pages (homepage, compare, checkout, admin)
    │   ├── components/    # ThreeLaptop, ProductCard, CategoryCard, Navbar, etc.
    │   ├── context/       # Auth, Cart, Compare, Theme contexts
    │   └── utils/         # Centralized API fetch helpers (apiFetch)
    └── public/            # Static assets
```

---

## 💻 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher)
* [Python](https://www.python.org/) (v3.10 or higher)

### 1. Backend Setup

Navigate to the `backend` folder:
```bash
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install requirements
pip install -r requirements.txt

# Create .env file based on example
cp .env.example .env
```

Configure your `.env` settings:
```ini
DATABASE_URL=sqlite:///./mr_laptop.db
JWT_SECRET_KEY=your-super-secret-key-change-in-production
RESEND_API_KEY=re_your_resend_api_key
SMTP_FROM=mrlaptopsales@gmail.com
ADMIN_EMAIL=admin@mrlaptop.lk
```

Launch the Uvicorn backend:
```bash
uvicorn app.main:app --reload
```
The documentation will be available at [http://localhost:8000/docs](http://localhost:8000/docs).

### 2. Frontend Setup

Navigate to the `frontend` folder:
```bash
cd ../frontend

# Install node dependencies
npm install

# Create environment config
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Launch next.js dev server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the futuristic e-commerce showroom live.

---

## 📄 License

This project is licensed under the MIT License.

