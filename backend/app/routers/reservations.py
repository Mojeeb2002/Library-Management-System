from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.dependencies import get_current_user
from app.models.reservation import Reservation, ReservationStatus
from app.models.user import User
from app.schemas.reservation import ReservationOut, ReservationRequest
from app.services.reservation import create_reservation, cancel_reservation

router = APIRouter(prefix="/reservations", tags=["reservations"])


@router.post("", response_model=ReservationOut, status_code=status.HTTP_201_CREATED)
def reserve(
    body: ReservationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return create_reservation(db, current_user, body.isbn)


@router.get("/me", response_model=list[ReservationOut])
def my_reservations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Reservation)
        .filter(Reservation.user_id == current_user.id)
        .order_by(Reservation.reservation_date.desc())
        .all()
    )


@router.delete("/{reservation_id}", response_model=ReservationOut)
def cancel(
    reservation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return cancel_reservation(db, current_user, reservation_id)
