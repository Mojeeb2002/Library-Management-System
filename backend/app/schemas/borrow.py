from datetime import date

from pydantic import BaseModel

from app.models.borrow_transaction import BorrowStatus


class BorrowRequest(BaseModel):
    isbn: str


class ReturnRequest(BaseModel):
    isbn: str


class TransactionOut(BaseModel):
    id: int
    user_id: int
    isbn: str
    borrow_date: date
    due_date: date
    return_date: date | None
    status: BorrowStatus
    overdue: bool

    model_config = {"from_attributes": True}
