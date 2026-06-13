from fastapi import FastAPI

from app.routers import auth, books, borrow, reservations, reports, users

app = FastAPI(title="Library Management System", version="0.1.0")

app.include_router(auth.router)
app.include_router(books.router)
app.include_router(borrow.router)
app.include_router(reservations.router)
app.include_router(reports.router)
app.include_router(users.router)


@app.get("/health")
def health():
    return {"status": "ok"}
