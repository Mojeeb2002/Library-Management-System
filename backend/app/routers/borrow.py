from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.borrow_transaction import BorrowTransaction, BorrowStatus
from app.models.user import User, UserRole
from app.schemas.borrow import BorrowRequest, ReturnRequest, TransactionOut
from app.services.borrow import borrow_book, return_book, _to_out

router = APIRouter(tags=["borrow"])


@router.post("/borrow", response_model=TransactionOut, status_code=201)
def borrow(
    body: BorrowRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tx = borrow_book(db, current_user, body.isbn)
    return _to_out(tx)


@router.post("/return", response_model=TransactionOut)
def return_(
    body: ReturnRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tx = return_book(db, current_user, body.isbn)
    return _to_out(tx)


@router.get("/transactions/me", response_model=list[TransactionOut])
def my_transactions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    txs = (
        db.query(BorrowTransaction)
        .filter(BorrowTransaction.user_id == current_user.id)
        .order_by(BorrowTransaction.borrow_date.desc())
        .all()
    )
    return [_to_out(tx) for tx in txs]


@router.get("/transactions", response_model=list[TransactionOut])
def all_transactions(
    status: BorrowStatus | None = Query(None),
    isbn: str | None = Query(None),
    user_id: int | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.librarian, UserRole.admin)),
):
    q = db.query(BorrowTransaction)
    if status:
        q = q.filter(BorrowTransaction.status == status)
    if isbn:
        q = q.filter(BorrowTransaction.isbn == isbn)
    if user_id:
        q = q.filter(BorrowTransaction.user_id == user_id)
    txs = q.order_by(BorrowTransaction.borrow_date.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return [_to_out(tx) for tx in txs]
