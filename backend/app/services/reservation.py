from datetime import date

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.book import Book
from app.models.borrow_transaction import BorrowTransaction, BorrowStatus
from app.models.reservation import Reservation, ReservationStatus
from app.models.user import User


def _active_borrow_count(db: Session, isbn: str) -> int:
    return (
        db.query(BorrowTransaction)
        .filter(BorrowTransaction.isbn == isbn, BorrowTransaction.status == BorrowStatus.borrowed)
        .count()
    )


def create_reservation(db: Session, user: User, isbn: str) -> Reservation:
    book = db.get(Book, isbn)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    available = book.total_copies - _active_borrow_count(db, isbn)
    if available > 0:
        raise HTTPException(status_code=409, detail="Book is available — borrow it directly")

    existing = (
        db.query(Reservation)
        .filter(
            Reservation.user_id == user.id,
            Reservation.isbn == isbn,
            Reservation.status == ReservationStatus.active,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="You already have an active reservation for this book")

    reservation = Reservation(
        user_id=user.id,
        isbn=isbn,
        reservation_date=date.today(),
        status=ReservationStatus.active,
    )
    db.add(reservation)
    db.commit()
    db.refresh(reservation)
    return reservation


def cancel_reservation(db: Session, user: User, reservation_id: int) -> Reservation:
    reservation = db.get(Reservation, reservation_id)
    if not reservation:
        raise HTTPException(status_code=404, detail="Reservation not found")

    # Students can only cancel their own; librarian/admin can cancel any
    from app.models.user import UserRole
    if user.role == UserRole.student and reservation.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not your reservation")

    if reservation.status != ReservationStatus.active:
        raise HTTPException(status_code=409, detail=f"Reservation is already {reservation.status.value}")

    reservation.status = ReservationStatus.cancelled
    db.commit()
    db.refresh(reservation)
    return reservation
