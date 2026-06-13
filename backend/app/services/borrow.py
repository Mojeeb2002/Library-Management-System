from datetime import date, timedelta

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.book import Book
from app.models.borrow_transaction import BorrowTransaction, BorrowStatus
from app.models.reservation import Reservation, ReservationStatus
from app.models.user import User, UserRole


def _active_borrow_count(db: Session, isbn: str) -> int:
    return (
        db.query(BorrowTransaction)
        .filter(BorrowTransaction.isbn == isbn, BorrowTransaction.status == BorrowStatus.borrowed)
        .count()
    )


def borrow_book(db: Session, user: User, isbn: str) -> BorrowTransaction:
    book = db.get(Book, isbn)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    available = book.total_copies - _active_borrow_count(db, isbn)
    if available <= 0:
        raise HTTPException(status_code=409, detail="No copies available")

    if user.role == UserRole.student:
        active_borrows = (
            db.query(BorrowTransaction)
            .filter(
                BorrowTransaction.user_id == user.id,
                BorrowTransaction.status == BorrowStatus.borrowed,
            )
            .count()
        )
        if active_borrows >= settings.MAX_CONCURRENT_BORROWS_PER_STUDENT:
            raise HTTPException(
                status_code=409,
                detail=f"Borrow limit of {settings.MAX_CONCURRENT_BORROWS_PER_STUDENT} reached",
            )

    today = date.today()
    tx = BorrowTransaction(
        user_id=user.id,
        isbn=isbn,
        borrow_date=today,
        due_date=today + timedelta(days=settings.LOAN_PERIOD_DAYS),
        status=BorrowStatus.borrowed,
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx


def return_book(db: Session, user: User, isbn: str) -> BorrowTransaction:
    tx = (
        db.query(BorrowTransaction)
        .filter(
            BorrowTransaction.user_id == user.id,
            BorrowTransaction.isbn == isbn,
            BorrowTransaction.status == BorrowStatus.borrowed,
        )
        .first()
    )
    if not tx:
        raise HTTPException(status_code=404, detail="No active borrow found for this book")

    tx.return_date = date.today()
    tx.status = BorrowStatus.returned

    # Fulfil the oldest active reservation for this ISBN, if any
    oldest_reservation = (
        db.query(Reservation)
        .filter(Reservation.isbn == isbn, Reservation.status == ReservationStatus.active)
        .order_by(Reservation.reservation_date)
        .first()
    )
    if oldest_reservation:
        oldest_reservation.status = ReservationStatus.fulfilled

    db.commit()
    db.refresh(tx)
    return tx


def _to_out(tx: BorrowTransaction) -> dict:
    today = date.today()
    return {
        "id": tx.id,
        "user_id": tx.user_id,
        "isbn": tx.isbn,
        "borrow_date": tx.borrow_date,
        "due_date": tx.due_date,
        "return_date": tx.return_date,
        "status": tx.status,
        "overdue": tx.return_date is None and tx.due_date < today,
    }
