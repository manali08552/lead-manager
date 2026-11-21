
import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000/api/leads";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  company: "",
  source: "Website",
  status: "New",
};

function App() {
  const [leads, setLeads] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Sorting and pagination state
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Load leads from backend
  const fetchLeads = async () => {
    try {
      setLoading(true);

      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Unable to load leads");
      }

      const data = await response.json();
      setLeads(data);
      setError("");
    } catch (err) {
      setError(
        "Cannot connect to backend. Make sure your server is running."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    const updatedValue =
      name === "phone"
        ? value.replace(/\D/g, "").slice(0, 10)
        : value;

    setForm({
      ...form,
      [name]: updatedValue,
    });
  };

  // Add or update a lead
  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    const cleanedForm = {
      ...form,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      company: form.company.trim(),
    };

    if (
      !cleanedForm.name ||
      !cleanedForm.email ||
      !cleanedForm.phone ||
      !cleanedForm.company
    ) {
      setError("Please complete all required fields.");
      return;
    }

    if (!/^\d{10}$/.test(cleanedForm.phone)) {
      setError("Phone number must contain exactly 10 digits.");
      return;
    }

    try {
      const url = editingId
        ? `${API_URL}/${editingId}`
        : API_URL;

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanedForm),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Something went wrong");
      }

      setMessage(result.message);
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      setCurrentPage(1);

      await fetchLeads();
    } catch (err) {
      setError(err.message);
    }
  };

  // Edit a lead
  const handleEdit = (lead) => {
    setForm({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      source: lead.source,
      status: lead.status,
    });

    setEditingId(lead.id);
    setShowForm(true);
    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Delete a lead
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this lead?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Unable to delete lead");
      }

      setMessage(result.message);
      setError("");

      await fetchLeads();
    } catch (err) {
      setError(err.message);
    }
  };

  // Cancel the form
  const handleCancel = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setError("");
  };

  // Open the add lead form
  const handleAddLead = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(!showForm);
    setMessage("");
    setError("");
  };

  // Navigate to dashboard or leads
  const scrollToSection = (sectionId) => {
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: "smooth",
    });
  };

  // Search and filter leads
  const filteredLeads = leads.filter((lead) => {
    const searchTerm = search.toLowerCase().trim();

    const searchableFields = [
      lead.name,
      lead.email,
      lead.company,
      lead.phone,
    ];

    const matchesSearch = searchableFields.some((value) =>
      String(value ?? "").toLowerCase().includes(searchTerm)
    );

    const matchesStatus =
      statusFilter === "All" || lead.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Sort the filtered leads
  const sortedLeads = [...filteredLeads].sort((a, b) => {
    if (sortBy === "name-asc") {
      return String(a.name).localeCompare(String(b.name));
    }

    if (sortBy === "name-desc") {
      return String(b.name).localeCompare(String(a.name));
    }

    if (sortBy === "oldest") {
      const dateA = a.created_at
        ? new Date(a.created_at).getTime()
        : Number(a.id);
      const dateB = b.created_at
        ? new Date(b.created_at).getTime()
        : Number(b.id);

      return dateA - dateB;
    }

    // Newest first is the default
    const dateA = a.created_at
      ? new Date(a.created_at).getTime()
      : Number(a.id);
    const dateB = b.created_at
      ? new Date(b.created_at).getTime()
      : Number(b.id);

    return dateB - dateA;
  });

  // Pagination calculations
  const totalPages = Math.max(
    1,
    Math.ceil(sortedLeads.length / pageSize)
  );

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  const paginatedLeads = sortedLeads.slice(startIndex, endIndex);

  // Keep current page valid after deleting or filtering leads
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Dashboard statistics
  const totalLeads = leads.length;

  const newLeads = leads.filter(
    (lead) => lead.status === "New"
  ).length;

  const contactedLeads = leads.filter(
    (lead) => lead.status === "Contacted"
  ).length;

  const qualifiedLeads = leads.filter(
    (lead) => lead.status === "Qualified"
  ).length;

  const lostLeads = leads.filter(
    (lead) => lead.status === "Lost"
  ).length;

  // Reusable lead card for mobile and table rows for desktop
  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">L</div>
          <span>LeadFlow</span>
        </div>

        {/* Mobile navigation */}
        <nav className="mobile-nav">
          <button
            type="button"
            onClick={() => scrollToSection("dashboard")}
          >
            Dashboard
          </button>

          <button
            type="button"
            onClick={() => scrollToSection("leads")}
          >
            Leads
          </button>
        </nav>

        {/* Desktop navigation */}
        <p className="menu-label">WORKSPACE</p>

        <button
          type="button"
          className="menu-item active"
          onClick={() => scrollToSection("dashboard")}
        >
          <span>▦</span>
          Dashboard
        </button>

        <button
          type="button"
          className="menu-item"
          onClick={() => scrollToSection("leads")}
        >
          <span>♙</span>
          Leads
        </button>

        <div className="sidebar-bottom">
          <div className="profile-avatar">MP</div>

          <div>
            <strong>Manali Patil</strong>
            <small>Sales Workspace</small>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content" id="dashboard">
        <header className="topbar">
          <div className="page-heading">
            <p className="breadcrumb">Workspace / Dashboard</p>

            <h1>Lead Management</h1>

            <p className="subtitle">
              Manage your leads and grow your business.
            </p>
          </div>

          <button
            type="button"
            className="primary-button add-lead-button"
            onClick={handleAddLead}
          >
            + Add New Lead
          </button>
        </header>

        {/* Success and error messages */}
        {message && (
          <div className="success-message" role="status">
            {message}
          </div>
        )}

        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        {/* Dashboard statistics */}
        <section className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue">▦</div>
            <p>Total Leads</p>
            <h2>{totalLeads}</h2>
            <small>All captured leads</small>
          </div>

          <div className="stat-card">
            <div className="stat-icon purple">◷</div>
            <p>New Leads</p>
            <h2>{newLeads}</h2>
            <small>Awaiting contact</small>
          </div>

          <div className="stat-card">
            <div className="stat-icon orange">↗</div>
            <p>Contacted</p>
            <h2>{contactedLeads}</h2>
            <small>Follow-up in progress</small>
          </div>

          <div className="stat-card">
            <div className="stat-icon green">✓</div>
            <p>Qualified</p>
            <h2>{qualifiedLeads}</h2>
            <small>Potential customers</small>
          </div>
        </section>

        {lostLeads > 0 && (
          <p className="lost-summary">
            Lost leads: {lostLeads}
          </p>
        )}

        {/* Add and edit lead form */}
        {showForm && (
          <section className="form-card" id="lead-form">
            <div className="section-heading">
              <div>
                <h2>{editingId ? "Edit Lead" : "Add New Lead"}</h2>
                <p>
                  Enter the lead's contact information below.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="lead-name">Full Name *</label>
                  <input
                    id="lead-name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="lead-email">Email Address *</label>
                  <input
                    id="lead-email"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="example@email.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="lead-phone">Phone Number *</label>
                  <input
                    id="lead-phone"
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Enter 10-digit phone number"
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                    minLength={10}
                    maxLength={10}
                    autoComplete="tel"
                    title="Enter exactly 10 digits"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="lead-company">Company *</label>
                  <input
                    id="lead-company"
                    name="company"
                    value={form.company}
                    onChange={handleChange}
                    placeholder="Enter company name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="lead-source">Lead Source *</label>
                  <select
                    id="lead-source"
                    name="source"
                    value={form.source}
                    onChange={handleChange}
                  >
                    <option value="Website">Website</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Referral">Referral</option>
                    <option value="Advertisement">Advertisement</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="lead-status">Lead Status *</label>
                  <select
                    id="lead-status"
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleCancel}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                >
                  {editingId ? "Update Lead" : "Save Lead"}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Leads section */}
        <section className="table-card" id="leads">
          <div className="table-heading">
            <div>
              <h2>All Leads</h2>
              <p>View and manage your captured leads.</p>
            </div>

            <span className="lead-count">
              {filteredLeads.length} leads
            </span>
          </div>

          {/* Search, filter, sorting and page size */}
          <div className="filters">
            <input
              type="search"
              placeholder="Search by name, email, company or phone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Search leads"
            />

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter leads by status"
            >
              <option value="All">All Statuses</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Qualified">Qualified</option>
              <option value="Lost">Lost</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Sort leads"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name-asc">Name A–Z</option>
              <option value="name-desc">Name Z–A</option>
            </select>

            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              aria-label="Number of leads per page"
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
            </select>
          </div>

          {/* Desktop and tablet table */}
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>LEAD NAME</th>
                  <th>COMPANY</th>
                  <th>EMAIL</th>
                  <th>PHONE</th>
                  <th>SOURCE</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="empty-state">
                      Loading leads...
                    </td>
                  </tr>
                ) : paginatedLeads.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-state">
                      No leads found. Add your first lead!
                    </td>
                  </tr>
                ) : (
                  paginatedLeads.map((lead) => (
                    <tr key={lead.id}>
                      <td>
                        <strong>{lead.name}</strong>
                      </td>

                      <td>{lead.company}</td>
                      <td>{lead.email}</td>
                      <td>{lead.phone}</td>
                      <td>{lead.source}</td>

                      <td>
                        <span
                          className={`status-badge ${lead.status.toLowerCase()}`}
                        >
                          {lead.status}
                        </span>
                      </td>

                      <td>
                        <div className="action-buttons">
                          <button
                            type="button"
                            className="edit-button"
                            onClick={() => handleEdit(lead)}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="delete-button"
                            onClick={() => handleDelete(lead.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile lead cards */}
          <div className="mobile-lead-list">
            {loading ? (
              <p className="empty-state">Loading leads...</p>
            ) : paginatedLeads.length === 0 ? (
              <p className="empty-state">
                No leads found. Add your first lead!
              </p>
            ) : (
              paginatedLeads.map((lead) => (
                <article className="mobile-lead-card" key={lead.id}>
                  <div className="mobile-lead-top">
                    <strong>{lead.name}</strong>

                    <span
                      className={`status-badge ${lead.status.toLowerCase()}`}
                    >
                      {lead.status}
                    </span>
                  </div>

                  <div className="mobile-lead-details">
                    <p>
                      <strong>Company:</strong> {lead.company}
                    </p>

                    <p>
                      <strong>Email:</strong> {lead.email}
                    </p>

                    <p>
                      <strong>Phone:</strong> {lead.phone}
                    </p>

                    <p>
                      <strong>Source:</strong> {lead.source}
                    </p>
                  </div>

                  <div className="mobile-lead-actions">
                    <button
                      type="button"
                      className="edit-button"
                      onClick={() => handleEdit(lead)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="delete-button"
                      onClick={() => handleDelete(lead.id)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>

          {/* Pagination controls */}
          {!loading && filteredLeads.length > 0 && (
            <div
              className="pagination"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "12px",
                marginTop: "22px",
                paddingTop: "18px",
                borderTop: "1px solid #e5e7eb",
              }}
            >
              <p style={{ margin: 0, fontSize: "14px" }}>
                Showing {startIndex + 1}–
                {Math.min(endIndex, sortedLeads.length)} of{" "}
                {sortedLeads.length} leads
              </p>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <button
                  type="button"
                  className="secondary-button"
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((page) => Math.max(1, page - 1))
                  }
                >
                  Previous
                </button>

                <span style={{ fontSize: "14px", fontWeight: "600" }}>
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  className="secondary-button"
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.min(totalPages, page + 1)
                    )
                  }
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>

        <footer className="footer">
          LeadFlow © 2026 · Lead Management Dashboard
        </footer>
      </main>
    </div>
  );
}

export default App;
