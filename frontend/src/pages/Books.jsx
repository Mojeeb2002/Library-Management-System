import { useState, useEffect, useCallback } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

export default function Books() {
  const { user } = useAuth();
  const isStaff = user.role === "librarian" || user.role === "admin";

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ total: 0, items: [] });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Add/edit book form (staff only)
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ isbn: "", title: "", author: "", publisher: "", publication_year: "", total_copies: 1 });
  const [editIsbn, setEditIsbn] = useState(null);

  const PAGE_SIZE = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.books({ q: query, page, page_size: PAGE_SIZE });
      setResult(data);
    } catch (e) {
      setMessage({ type: "error", text: e.message });
    } finally {
      setLoading(false);
    }
  }, [query, page]);

  useEffect(() => { load(); }, [load]);

  function flash(type, text) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  }

  async function handleBorrow(isbn) {
    try {
      await api.borrow(isbn);
      flash("success", "Borrowed successfully!");
      load();
    } catch (e) {
      flash("error", e.message);
    }
  }

  async function handleReserve(isbn) {
    try {
      await api.reserve(isbn);
      flash("success", "Reserved successfully!");
      load();
    } catch (e) {
      flash("error", e.message);
    }
  }

  async function handleDelete(isbn) {
    if (!confirm(`Delete book ${isbn}?`)) return;
    try {
      await api.deleteBook(isbn);
      flash("success", "Book deleted.");
      load();
    } catch (e) {
      flash("error", e.message);
    }
  }

  function openEdit(book) {
    setForm({ isbn: book.isbn, title: book.title, author: book.author || "", publisher: book.publisher || "", publication_year: book.publication_year || "", total_copies: book.total_copies });
    setEditIsbn(book.isbn);
    setShowForm(true);
  }

  function openAdd() {
    setForm({ isbn: "", title: "", author: "", publisher: "", publication_year: "", total_copies: 1 });
    setEditIsbn(null);
    setShowForm(true);
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    const payload = { ...form, publication_year: form.publication_year ? Number(form.publication_year) : null, total_copies: Number(form.total_copies) };
    try {
      if (editIsbn) {
        await api.updateBook(editIsbn, payload);
        flash("success", "Book updated.");
      } else {
        await api.createBook(payload);
        flash("success", "Book added.");
      }
      setShowForm(false);
      load();
    } catch (e) {
      flash("error", e.message);
    }
  }

  const totalPages = Math.ceil(result.total / PAGE_SIZE);

  return (
    <div>
      <div className="page-header">
        <h2>Books ({result.total.toLocaleString()})</h2>
        {isStaff && <button className="btn-primary" onClick={openAdd}>+ Add Book</button>}
      </div>

      {message && <div className={`flash flash-${message.type}`}>{message.text}</div>}

      <div className="search-bar">
        <input
          placeholder="Search by title, author, ISBN, or publisher…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1); }}
        />
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={handleFormSubmit}>
            <h3>{editIsbn ? "Edit Book" : "Add Book"}</h3>
            {!editIsbn && <label>ISBN<input required value={form.isbn} onChange={(e) => setForm(f => ({ ...f, isbn: e.target.value }))} /></label>}
            <label>Title<input required value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} /></label>
            <label>Author<input value={form.author} onChange={(e) => setForm(f => ({ ...f, author: e.target.value }))} /></label>
            <label>Publisher<input value={form.publisher} onChange={(e) => setForm(f => ({ ...f, publisher: e.target.value }))} /></label>
            <label>Year<input type="number" value={form.publication_year} onChange={(e) => setForm(f => ({ ...f, publication_year: e.target.value }))} /></label>
            <label>Total Copies<input type="number" min="1" required value={form.total_copies} onChange={(e) => setForm(f => ({ ...f, total_copies: e.target.value }))} /></label>
            <div className="modal-actions">
              <button type="submit" className="btn-primary">Save</button>
              <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <p>Loading…</p> : (
        <table className="data-table">
          <thead>
            <tr>
              <th>ISBN</th><th>Title</th><th>Author</th><th>Year</th>
              <th>Available</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {result.items.map((book) => (
              <tr key={book.isbn}>
                <td className="mono">{book.isbn}</td>
                <td>{book.title}</td>
                <td>{book.author || "—"}</td>
                <td>{book.publication_year || "—"}</td>
                <td>
                  <span className={book.available_copies > 0 ? "badge-green" : "badge-red"}>
                    {book.available_copies}/{book.total_copies}
                  </span>
                </td>
                <td className="actions">
                  {book.available_copies > 0
                    ? <button className="btn-sm btn-primary" onClick={() => handleBorrow(book.isbn)}>Borrow</button>
                    : <button className="btn-sm btn-secondary" onClick={() => handleReserve(book.isbn)}>Reserve</button>
                  }
                  {isStaff && <>
                    <button className="btn-sm" onClick={() => openEdit(book)}>Edit</button>
                    <button className="btn-sm btn-danger" onClick={() => handleDelete(book.isbn)}>Delete</button>
                  </>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="pagination">
        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
        <span>Page {page} of {totalPages || 1}</span>
        <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
      </div>
    </div>
  );
}
