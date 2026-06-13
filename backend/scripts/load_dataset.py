"""Idempotent loader: reads the Kaggle Books CSV and bulk-inserts into the books table.
Skips entirely if the table already has rows.
"""
import os
import sys
from datetime import date

import pandas as pd
from sqlalchemy import create_engine, text

DATABASE_URL = os.environ["DATABASE_URL"]
CSV_PATH = os.environ.get("BOOKS_CSV", "/data/books.csv")
CURRENT_YEAR = date.today().year


def load():
    engine = create_engine(DATABASE_URL)

    with engine.connect() as conn:
        count = conn.execute(text("SELECT COUNT(*) FROM books")).scalar()
        if count > 0:
            print(f"Books table already has {count} rows — skipping load.")
            return

    df = pd.read_csv(
        CSV_PATH,
        sep=";",
        encoding="latin-1",
        on_bad_lines="skip",
        dtype=str,
    )

    # Normalise column names to lowercase with underscores
    df.columns = [c.strip().lower().replace("-", "_") for c in df.columns]
    # Actual columns: isbn, book_title, book_author, year_of_publication, publisher, image_url_s/m/l

    df = df.rename(columns={
        "book_title": "title",
        "book_author": "author",
        "year_of_publication": "publication_year",
    })

    df = df[["isbn", "title", "author", "publisher", "publication_year"]]

    # Strip whitespace
    for col in df.columns:
        df[col] = df[col].str.strip()

    # Drop rows missing ISBN or title
    df = df.dropna(subset=["isbn", "title"])
    df = df[df["isbn"].str.len() > 0]
    df = df[df["title"].str.len() > 0]

    # Coerce publication_year: numeric only, null out 0 and future years
    df["publication_year"] = pd.to_numeric(df["publication_year"], errors="coerce")
    df["publication_year"] = df["publication_year"].where(
        df["publication_year"].between(1, CURRENT_YEAR), other=None
    )
    df["publication_year"] = df["publication_year"].astype("Int64")

    # De-duplicate on ISBN (keep first occurrence)
    df = df.drop_duplicates(subset=["isbn"])

    df["total_copies"] = 1

    records = df.to_dict(orient="records")

    # Bulk insert in batches, skip conflicts on ISBN PK
    batch_size = 1000
    inserted = 0
    with engine.begin() as conn:
        for i in range(0, len(records), batch_size):
            batch = records[i : i + batch_size]
            conn.execute(
                text(
                    """
                    INSERT INTO books (isbn, title, author, publisher, publication_year, total_copies)
                    VALUES (:isbn, :title, :author, :publisher, :publication_year, :total_copies)
                    ON CONFLICT (isbn) DO NOTHING
                    """
                ),
                batch,
            )
            inserted += len(batch)
            print(f"  inserted batch {i // batch_size + 1} ({inserted}/{len(records)})")

    print(f"Load complete: {len(records)} records processed.")


if __name__ == "__main__":
    try:
        load()
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)
