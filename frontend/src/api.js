const BASE = "/api";

function getToken() {
  return localStorage.getItem("token");
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw Object.assign(new Error(err.detail || "Request failed"), { status: res.status });
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // auth
  register: (data) => request("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  login: (username, password) =>
    fetch(`${BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ username, password }),
    }).then(async (res) => {
      if (!res.ok) throw new Error("Invalid credentials");
      return res.json();
    }),
  me: () => request("/auth/me"),

  // books
  books: (params) => request(`/books?${new URLSearchParams(params)}`),
  book: (isbn) => request(`/books/${isbn}`),
  createBook: (data) => request("/books", { method: "POST", body: JSON.stringify(data) }),
  updateBook: (isbn, data) => request(`/books/${isbn}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteBook: (isbn) => request(`/books/${isbn}`, { method: "DELETE" }),

  // borrow
  borrow: (isbn) => request("/borrow", { method: "POST", body: JSON.stringify({ isbn }) }),
  return: (isbn) => request("/return", { method: "POST", body: JSON.stringify({ isbn }) }),
  myTransactions: () => request("/transactions/me"),
  allTransactions: (params) => request(`/transactions?${new URLSearchParams(params)}`),

  // reservations
  reserve: (isbn) => request("/reservations", { method: "POST", body: JSON.stringify({ isbn }) }),
  myReservations: () => request("/reservations/me"),
  cancelReservation: (id) => request(`/reservations/${id}`, { method: "DELETE" }),

  // reports
  mostBorrowed: () => request("/reports/most-borrowed"),
  activeUsers: () => request("/reports/active-users"),
  overdue: () => request("/reports/overdue"),
  monthlyStats: (year) => request(`/reports/monthly-stats?year=${year}`),

  // users (admin)
  users: () => request("/users"),
  updateRole: (id, role) => request(`/users/${id}/role`, { method: "PUT", body: JSON.stringify({ role }) }),
};
