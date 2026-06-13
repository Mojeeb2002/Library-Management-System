import enum
from datetime import date

from sqlalchemy import Enum, ForeignKey, Date, String, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base


class BorrowStatus(str, enum.Enum):
    borrowed = "borrowed"
    returned = "returned"


class BorrowTransaction(Base):
    __tablename__ = "borrow_transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    isbn: Mapped[str] = mapped_column(ForeignKey("books.isbn"), nullable=False)
    borrow_date: Mapped[date] = mapped_column(Date, nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    return_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[BorrowStatus] = mapped_column(
        Enum(BorrowStatus), default=BorrowStatus.borrowed, nullable=False
    )

    user: Mapped["User"] = relationship(back_populates="borrows")
    book: Mapped["Book"] = relationship(back_populates="borrows")
