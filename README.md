# Library Management System

A full-stack library management system built for WEX 328 Work Experience. Dockerized, seeded from the Kaggle Book-Crossing dataset (~270k books), with role-based access control and a minimalist black-and-white React frontend.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.12, FastAPI, Uvicorn |
| ORM / Migrations | SQLAlchemy 2.0, Alembic |
| Validation | Pydantic v2 |
| Database | PostgreSQL 16 |
| Auth | OAuth2 password flow → JWT (python-jose), bcrypt (passlib) |
| Frontend | React 18, Vite, React Router v6 |
| Web server | nginx (serves static build, proxies `/api` → backend) |
| Orchestration | Docker Compose |

---

## Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- The Kaggle Book-Crossing `books.csv` file (semicolon-separated, latin-1 encoded)

### 1. Clone the repo

```bash
git clone git@github.com:Mojeeb2002/Library-Management-System.git
cd Library-Management-System
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
POSTGRES_USER=libraryuser
POSTGRES_PASSWORD=yourpassword
POSTGRES_DB=librarydb
SECRET_KEY=a-long-random-secret-string
BOOKS_CSV_HOST_PATH=/absolute/path/to/books.csv
```

### 3. Run

```bash
docker compose up --build
```

On first start this will:
1. Start PostgreSQL and wait for it to be healthy
2. Run `alembic upgrade head` (creates all tables)
3. Load the Kaggle dataset into the `books` table (idempotent — skips if already populated)
4. Start the FastAPI backend on port 8000
5. Build and serve the React frontend via nginx on port 80

| URL | Description |
|---|---|
| http://localhost | React frontend |
| http://localhost:8000/docs | Swagger UI (interactive API docs) |

---

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── core/          # config, db session, JWT security, FastAPI dependencies
│   │   ├── models/        # SQLAlchemy models (User, Book, BorrowTransaction, Reservation)
│   │   ├── schemas/       # Pydantic request/response schemas
│   │   ├── routers/       # auth, books, borrow, reservations, reports, users
│   │   ├── services/      # borrow and reservation business logic
│   │   └── main.py
│   ├── alembic/           # database migrations
│   ├── scripts/
│   │   └── load_dataset.py   # Kaggle CSV cleaner and loader
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/         # Login, Books, MyHistory, MyReservations, Reports, Users
│   │   ├── components/    # Navbar
│   │   ├── context/       # AuthContext (JWT persistence)
│   │   └── api.js         # fetch wrapper with Bearer token injection
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
└── .env.example
```

---

## Roles & Permissions

| Action | Student | Librarian | Admin |
|---|:---:|:---:|:---:|
| Search & view books | ✓ | ✓ | ✓ |
| Borrow & return | ✓ | ✓ | ✓ |
| Reserve a book | ✓ | ✓ | ✓ |
| View own history | ✓ | ✓ | ✓ |
| Add / edit / delete books | | ✓ | ✓ |
| View all transactions | | ✓ | ✓ |
| View reports | | ✓ | ✓ |
| List users | | | ✓ |
| Change user roles | | | ✓ |

> The first registered user gets the `student` role by default. Promote to `admin` via the Users page (once you have an admin) or directly in the database.

---

## Business Rules

- **Loan period:** 14 days
- **Concurrent borrow limit (students):** 5 books
- **Availability:** `total_copies − active borrows` — computed live, never stored
- **Reservations:** only allowed when available copies = 0; max one active reservation per user per ISBN
- **Overdue:** `due_date < today AND return_date IS NULL` — derived in queries, never stored as a flag
- **On return:** the oldest active reservation for that ISBN is automatically marked `fulfilled`

All tunable defaults live in `backend/app/core/config.py`.

---

## API Reference

| Group | Endpoints |
|---|---|
| Auth | `POST /auth/register` · `POST /auth/login` · `GET /auth/me` |
| Books | `GET /books` (search + pagination) · `GET /books/{isbn}` · `POST /books` · `PUT /books/{isbn}` · `DELETE /books/{isbn}` |
| Borrow | `POST /borrow` · `POST /return` · `GET /transactions/me` · `GET /transactions` |
| Reservations | `POST /reservations` · `GET /reservations/me` · `DELETE /reservations/{id}` |
| Reports | `GET /reports/most-borrowed` · `/active-users` · `/borrowed` · `/overdue` · `/monthly-stats` |
| Users | `GET /users` · `PUT /users/{id}/role` |

Full interactive docs available at **http://localhost:8000/docs**.

---

## Dataset

Source: [Kaggle Book-Crossing Dataset](https://www.kaggle.com/datasets/). The loader (`backend/scripts/load_dataset.py`):

- Reads semicolon-separated, latin-1 encoded CSV
- Cleans publication years (nulls out 0, non-numeric, future years)
- Strips whitespace, drops rows missing ISBN or title, deduplicates on ISBN
- Bulk-inserts in batches of 1 000 with `ON CONFLICT DO NOTHING`
- Is **idempotent** — safe to run multiple times

---

## Database Schema

```
users               books
─────────────────   ──────────────────────
id (PK)             isbn (PK)
username (unique)   title
email (unique)      author
password_hash       publisher
role                publication_year
created_at          total_copies

borrow_transactions             reservations
───────────────────────────     ────────────────────────
id (PK)                         id (PK)
user_id (FK → users)            user_id (FK → users)
isbn    (FK → books)            isbn    (FK → books)
borrow_date                     reservation_date
due_date                        status: active | fulfilled
return_date (nullable)                   | cancelled | expired
status: borrowed | returned
```
