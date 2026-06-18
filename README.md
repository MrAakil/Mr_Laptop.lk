# Mr_Laptop.lk - E-Commerce Platform

A premium full-stack e-commerce platform for buying and selling new, used, and refurbished laptops. The project is separated into a Next.js frontend and a FastAPI backend.

## 🚀 Features

- **Product Catalog:** Browse, search, and filter laptops by brand, category (Gaming, Business, etc.), and condition.
- **Shopping Cart & Checkout:** Full cart management and checkout flow.
- **User Accounts:** Registration, login, and customer dashboards.
- **Wishlist & Compare:** Save favorite items and compare technical specifications side-by-side.
- **Admin Dashboard:** Manage products, orders, and users.
- **Dark Mode Support:** Fully responsive glassmorphism UI with seamless light/dark mode toggling.

## 🛠️ Tech Stack

### Frontend
- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) with custom Glassmorphism UI
- **Icons:** Lucide React
- **State Management:** React Context API (Auth, Cart, Wishlist, Compare, Theme)

### Backend
- **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **Database:** SQLAlchemy (ORM)
- **Server:** Uvicorn

## 📂 Project Structure

```text
Laptop Website/
├── backend/               # FastAPI Python Backend
│   ├── requirements.txt   # Python dependencies
│   └── app/
│       ├── main.py        # Application entry point
│       ├── routers/       # API route handlers (auth, products, orders, etc.)
│       └── models.py      # Database models
└── frontend/              # Next.js React Frontend
    ├── package.json       # Node.js dependencies
    ├── src/
    │   ├── app/           # App Router pages and layouts
    │   ├── components/    # Reusable UI components
    │   └── context/       # Global state management
    └── public/            # Static assets
```

## 💻 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [Python](https://www.python.org/) (v3.8 or higher)

### 1. Backend Setup

Open a terminal and navigate to the backend directory:

```bash
cd backend

# Create a virtual environment (optional but recommended)
python3 -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`

# Install dependencies
pip install -r requirements.txt

# Run the backend server
uvicorn app.main:app --reload
```
The FastAPI backend will be running at `http://localhost:8000`. You can view the API documentation at `http://localhost:8000/docs`.

### 2. Frontend Setup

Open a new terminal window and navigate to the frontend directory:

```bash
cd frontend

# Install dependencies
npm install

# Run the development server
npm run dev
```
The Next.js application will be available at `http://localhost:3000`.

## 🤝 Contributing

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.
