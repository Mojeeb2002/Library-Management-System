from fastapi import FastAPI

from app.routers import auth, books

app = FastAPI(title="Library Management System", version="0.1.0")

app.include_router(auth.router)
app.include_router(books.router)


@app.get("/health")
def health():
    return {"status": "ok"}
