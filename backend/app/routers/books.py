from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.book import Book
from app.models.borrow_transaction import BorrowTransaction, BorrowStatus
from app.models.user import User, UserRole
from app.schemas.book import BookCreate, BookOut, BookUpdate

router = APIRouter(prefix="/books", tags=["books"])


def _active_borrows_subq(db: Session):
    return (
        select(BorrowTransaction.isbn, func.count().label("active"))
        .where(BorrowTransaction.status == BorrowStatus.borrowed)
        .group_by(BorrowTransaction.isbn)
        .subquery()
    )


def _book_out(book: Book, db: Session) -> BookOut:
    subq = _active_borrows_subq(db)
    active = db.execute(
        select(subq.c.active).where(subq.c.isbn == book.isbn)
    ).scalar() or 0
    data = {c.name: getattr(book, c.name) for c in Book.__table__.columns}
    data["available_copies"] = max(book.total_copies - active, 0)
    return BookOut(**data)


@router.get("", response_model=dict)
def list_books(
    q: str | None = Query(None, description="Search title, author, isbn, or publisher"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    stmt = select(Book)
    if q:
        pattern = f"%{q}%"
        stmt = stmt.where(
            Book.title.ilike(pattern)
            | Book.author.ilike(pattern)
            | Book.isbn.ilike(pattern)
            | Book.publisher.ilike(pattern)
        )
    total = db.scalar(select(func.count()).select_from(stmt.subquery()))
    books = db.scalars(stmt.offset((page - 1) * page_size).limit(page_size)).all()

    subq = _active_borrows_subq(db)
    active_map: dict[str, int] = {
        row.isbn: row.active
        for row in db.execute(select(subq.c.isbn, subq.c.active)).all()
    }

    items = []
    for book in books:
        data = {c.name: getattr(book, c.name) for c in Book.__table__.columns}
        data["available_copies"] = max(book.total_copies - active_map.get(book.isbn, 0), 0)
        items.append(BookOut(**data))

    return {"total": total, "page": page, "page_size": page_size, "items": items}


@router.get("/{isbn}", response_model=BookOut)
def get_book(isbn: str, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    book = db.get(Book, isbn)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    return _book_out(book, db)


@router.post("", response_model=BookOut, status_code=status.HTTP_201_CREATED)
def create_book(
    body: BookCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.librarian, UserRole.admin)),
):
    if db.get(Book, body.isbn):
        raise HTTPException(status_code=400, detail="ISBN already exists")
    book = Book(**body.model_dump())
    db.add(book)
    db.commit()
    db.refresh(book)
    return _book_out(book, db)


@router.put("/{isbn}", response_model=BookOut)
def update_book(
    isbn: str,
    body: BookUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.librarian, UserRole.admin)),
):
    book = db.get(Book, isbn)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(book, field, value)
    db.commit()
    db.refresh(book)
    return _book_out(book, db)


@router.delete("/{isbn}", status_code=status.HTTP_204_NO_CONTENT)
def delete_book(
    isbn: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.librarian, UserRole.admin)),
):
    book = db.get(Book, isbn)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    db.delete(book)
    db.commit()
