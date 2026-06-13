from datetime import date

from pydantic import BaseModel

from app.models.reservation import ReservationStatus


class ReservationRequest(BaseModel):
    isbn: str


class ReservationOut(BaseModel):
    id: int
    user_id: int
    isbn: str
    reservation_date: date
    status: ReservationStatus

    model_config = {"from_attributes": True}
