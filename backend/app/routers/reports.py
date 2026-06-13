from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, extract
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.dependencies import require_role
from app.models.book import Book
from app.models.borrow_transaction import BorrowTransaction, BorrowStatus
from app.models.user import User, UserRole

router = APIRouter(prefix="/reports", tags=["reports"])

_staff = require_role(UserRole.librarian, UserRole.admin)


@router.get("/most-borrowed")
def most_borrowed(
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(_staff),
):
    rows = (
        db.query(BorrowTransaction.isbn, Book.title, func.count().label("borrow_count"))
        .join(Book, Book.isbn == BorrowTransaction.isbn)
        .group_by(BorrowTransaction.isbn, Book.title)
        .order_by(func.count().desc())
        .limit(limit)
        .all()
    )
    return [{"isbn": r.isbn, "title": r.title, "borrow_count": r.borrow_count} for r in rows]


@router.get("/active-users")
def active_users(
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(_staff),
):
    rows = (
        db.query(BorrowTransaction.user_id, User.username, func.count().label("borrow_count"))
        .join(User, User.id == BorrowTransaction.user_id)
        .group_by(BorrowTransaction.user_id, User.username)
        .order_by(func.count().desc())
        .limit(limit)
        .all()
    )
    return [{"user_id": r.user_id, "username": r.username, "borrow_count": r.borrow_count} for r in rows]


@router.get("/borrowed")
def currently_borrowed(
    db: Session = Depends(get_db),
    _: User = Depends(_staff),
):
    count = (
        db.query(BorrowTransaction)
        .filter(BorrowTransaction.status == BorrowStatus.borrowed)
        .count()
    )
    return {"currently_borrowed": count}


@router.get("/overdue")
def overdue(
    db: Session = Depends(get_db),
    _: User = Depends(_staff),
):
    today = date.today()
    rows = (
        db.query(BorrowTransaction, User.username, Book.title)
        .join(User, User.id == BorrowTransaction.user_id)
        .join(Book, Book.isbn == BorrowTransaction.isbn)
        .filter(
            BorrowTransaction.status == BorrowStatus.borrowed,
            BorrowTransaction.due_date < today,
        )
        .order_by(BorrowTransaction.due_date)
        .all()
    )
    return [
        {
            "transaction_id": tx.id,
            "user_id": tx.user_id,
            "username": username,
            "isbn": tx.isbn,
            "title": title,
            "due_date": tx.due_date,
            "days_overdue": (today - tx.due_date).days,
        }
        for tx, username, title in rows
    ]


@router.get("/monthly-stats")
def monthly_stats(
    year: int = Query(date.today().year, ge=2000),
    db: Session = Depends(get_db),
    _: User = Depends(_staff),
):
    borrow_rows = (
        db.query(
            extract("month", BorrowTransaction.borrow_date).label("month"),
            func.count().label("borrows"),
        )
        .filter(extract("year", BorrowTransaction.borrow_date) == year)
        .group_by(extract("month", BorrowTransaction.borrow_date))
        .all()
    )
    return_rows = (
        db.query(
            extract("month", BorrowTransaction.return_date).label("month"),
            func.count().label("returns"),
        )
        .filter(
            BorrowTransaction.return_date.isnot(None),
            extract("year", BorrowTransaction.return_date) == year,
        )
        .group_by(extract("month", BorrowTransaction.return_date))
        .all()
    )
    returns_map = {int(r.month): r.returns for r in return_rows}
    return [
        {"month": int(r.month), "borrows": r.borrows, "returns": returns_map.get(int(r.month), 0)}
        for r in borrow_rows
    ]
