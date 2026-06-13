import enum
from datetime import date

from sqlalchemy import Enum, ForeignKey, Date, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base


class ReservationStatus(str, enum.Enum):
    active = "active"
    fulfilled = "fulfilled"
    cancelled = "cancelled"
    expired = "expired"


class Reservation(Base):
    __tablename__ = "reservations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    isbn: Mapped[str] = mapped_column(ForeignKey("books.isbn"), nullable=False)
    reservation_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[ReservationStatus] = mapped_column(
        Enum(ReservationStatus), default=ReservationStatus.active, nullable=False
    )

    user: Mapped["User"] = relationship(back_populates="reservations")
    book: Mapped["Book"] = relationship(back_populates="reservations")
