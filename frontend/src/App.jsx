
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
      setError("Cannot connect to backend. Make sure your server is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // Handle form input
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // Add or update lead
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

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
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Something went wrong");
      }

      setMessage(result.message);
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);

      await fetchLeads();
    } catch (err) {
      setError(err.message);
    }
  };

  // Open edit form
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Delete lead
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

  // Cancel form
  const handleCancel = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setError("");
  };

  // Search and filter
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "All" || lead.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Dashboard counts
  const totalLeads = leads.length;
  const newLeads = leads.filter((lead) => lead.status === "New").length;
  const contactedLeads = leads.filter(
    (lead) => lead.status === "Contacted"
  ).length;
  const qualifiedLeads = leads.filter(
    (lead) => lead.status === "Qualified"
  ).length;
  const lostLeads = leads.filter((lead) => lead.status === "Lost").length;

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">L</div>
          <span>LeadFlow</span>
        </div>

        <p className="menu-label">WORKSPACE</p>

        <div className="menu-item active">
          <span>▦</span> Dashboard
        </div>

        <div className="menu-item">
          <span>♙</span> Leads
        </div>

        <div className="sidebar-bottom">
          <div className="profile-avatar">MP</div>
          <div>
            <strong>Manali Patil</strong>
            <small>Sales Workspace</small>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="breadcrumb">Workspace / Dashboard</p>
            <h1>Lead Management</h1>
            <p className="subtitle">
              Manage your leads and grow your business.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={() => {
              setForm(emptyForm);
              setEditingId(null);
              setShowForm(!showForm);
              setMessage("");
              setError("");
            }}
          >
            + Add New Lead
          </button>
        </header>

        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}

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
          <p className="lost-summary">Lost leads: {lostLeads}</p>
        )}

        {showForm && (
          <section className="form-card">
            <div className="section-heading">
              <div>
                <h2>{editingId ? "Edit Lead" : "Add New Lead"}</h2>
                <p>Enter the lead's contact information below.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="example@email.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Company *</label>
                  <input
                    name="company"
                    value={form.company}
                    onChange={handleChange}
                    placeholder="Enter company name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Lead Source *</label>
                  <select
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
                  <label>Lead Status *</label>
                  <select
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

                <button type="submit" className="primary-button">
                  {editingId ? "Update Lead" : "Save Lead"}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="table-card">
          <div className="table-heading">
            <div>
              <h2>All Leads</h2>
              <p>View and manage your captured leads.</p>
            </div>

            <span className="lead-count">{filteredLeads.length} leads</span>
          </div>

          <div className="filters">
            <input
              type="search"
              placeholder="Search by lead name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Qualified">Qualified</option>
              <option value="Lost">Lost</option>
            </select>
          </div>

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
                ) : filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-state">
                      No leads found. Add your first lead!
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => (
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
                            className="edit-button"
                            onClick={() => handleEdit(lead)}
                          >
                            Edit
                          </button>
                          <button
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
        </section>

        <footer className="footer">
          LeadFlow © 2026 · Lead Management Dashboard
        </footer>
      </main>
    </div>
  );
}

export default App;
