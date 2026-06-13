from pydantic import BaseModel


class BookBase(BaseModel):
    title: str
    author: str | None = None
    publisher: str | None = None
    publication_year: int | None = None
    total_copies: int = 1


class BookCreate(BookBase):
    isbn: str


class BookUpdate(BookBase):
    title: str | None = None
    total_copies: int | None = None


class BookOut(BookBase):
    isbn: str
    available_copies: int

    model_config = {"from_attributes": True}
