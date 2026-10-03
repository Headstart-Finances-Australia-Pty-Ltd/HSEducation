import { useState, useEffect, useCallback } from 'react';
import Icon from '../components/Icon';
import API_URL from '../config';

// Wraps fetch with credentials:'include' (so the httpOnly admin session
// cookie is sent/received) and treats a 401 as "please log in again"
// rather than a generic error, since a session can expire mid-visit.
async function adminFetch(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, { ...options, credentials: 'include' });
  if (res.status === 401) {
    const err = new Error('Your admin session has expired — please log in again.');
    err.sessionExpired = true;
    throw err;
  }
  let data = null;
  try { data = await res.json(); } catch { /* no body */ }
  if (!res.ok) throw new Error(data?.message || data?.error || 'Request failed');
  return data;
}

// ─── Login card (shown when not authenticated) ──────────────────────────────
const AdminLogin = ({ onLogin }) => {
  const [form, setForm] = useState({ username: 'admin', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await adminFetch('/api/admin-auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      onLogin(data.admin);
    } catch (err) {
      setError(err.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section">
      <div className="section-inner" style={{ maxWidth: 440 }}>
        <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '16px', padding: '2rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--navy)', marginBottom: '1.5rem', textAlign: 'center' }}>Admin Login</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input className="form-input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} autoFocus autoComplete="username" />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="current-password" />
            </div>
            {error && <div className="payment-error">{error}</div>}
            <button className="donate-btn" type="submit" disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Logging in…' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

// ─── Donations tab ───────────────────────────────────────────────────────────
const DonationsTab = () => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setDonations(await adminFetch('/api/donations'));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const completed = donations.filter((d) => d.status === 'completed');
  const totalRaised = completed.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        {[
          { label: 'Total Donations', val: donations.length },
          { label: 'Completed Payments', val: completed.length },
          { label: 'Total Raised (AUD)', val: `$${totalRaised.toLocaleString(undefined, { minimumFractionDigits: 2 })}` },
        ].map(({ label, val }) => (
          <div key={label} style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '16px', padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700, color: 'var(--navy)' }}>{val}</div>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--gray-700)', marginTop: '4px' }}>{label}</div>
          </div>
        ))}
      </div>

      {loading && <p style={{ color: 'var(--gray-600)' }}>Loading donations…</p>}
      {error && <div className="payment-error">{error}</div>}

      {!loading && !error && (
        <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '16px', overflow: 'hidden' }}>
          <table className="admin-table">
            <thead>
              <tr><th>Donor</th><th>Email</th><th>Amount</th><th>Frequency</th><th>Status</th><th>Date</th></tr>
            </thead>
            <tbody>
              {donations.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--gray-500)', padding: '1.5rem' }}>No donations yet.</td></tr>
              )}
              {donations.map((d) => (
                <tr key={d.id}>
                  <td>{d.first_name} {d.last_name || ''}</td>
                  <td>{d.email}</td>
                  <td>${parseFloat(d.amount).toFixed(2)}</td>
                  <td style={{ textTransform: 'capitalize' }}>{d.frequency}</td>
                  <td><span className={`admin-status admin-status-${d.status}`}>{d.status}</span></td>
                  <td>{d.created_at ? new Date(d.created_at).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── Projects tab ────────────────────────────────────────────────────────────
const emptyProject = { name: '', category: 'Infrastructure', description: '', location: '', status: 'fundraising' };

const ProjectsTab = () => {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyProject);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setPrograms(await adminFetch('/api/programs'));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    setSaving(true);
    try {
      await adminFetch('/api/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setForm(emptyProject);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this project?')) return;
    try {
      await adminFetch(`/api/programs/${id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--navy)' }}>Projects</h3>
        <button className="btn-teal" onClick={() => setShowForm((s) => !s)}>{showForm ? 'Cancel' : '+ Add Project'}</button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Name *</label>
              <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {['Infrastructure', 'Scholarships', 'Literacy', 'Vocational', 'Indigenous', 'General'].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Location</label>
            <input className="form-input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Uttar Pradesh, India" />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ resize: 'vertical' }} />
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {['fundraising', 'active', 'paused', 'completed'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button className="donate-btn" type="submit" disabled={saving} style={{ opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : 'Save Project'}
          </button>
        </form>
      )}

      {loading && <p style={{ color: 'var(--gray-600)' }}>Loading projects…</p>}
      {error && <div className="payment-error">{error}</div>}

      {!loading && !error && (
        <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '16px', overflow: 'hidden' }}>
          <table className="admin-table">
            <thead>
              <tr><th>Name</th><th>Category</th><th>Location</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {programs.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--gray-500)', padding: '1.5rem' }}>No projects listed.</td></tr>
              )}
              {programs.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.category}</td>
                  <td>{p.location}</td>
                  <td><span className={`admin-status admin-status-${p.status}`}>{p.status}</span></td>
                  <td>
                    <button onClick={() => handleDelete(p.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── Admin Users tab (superadmin only) ──────────────────────────────────────
const AdminUsersTab = ({ currentUsername }) => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ username: '', password: '', name: '', role: 'admin' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setAdmins(await adminFetch('/api/admin-users'));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) return;
    setSaving(true);
    setError('');
    try {
      await adminFetch('/api/admin-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setForm({ username: '', password: '', name: '', role: 'admin' });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this admin account?')) return;
    try {
      await adminFetch(`/api/admin-users/${id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--navy)', marginBottom: '1.2rem' }}>Admin Accounts</h3>

      <form onSubmit={handleAdd} style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Username *</label>
            <input className="form-input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Display Name</label>
            <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Password *</label>
            <input className="form-input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="admin">Admin</option>
              <option value="superadmin">Super Admin</option>
            </select>
          </div>
        </div>
        {error && <div className="payment-error">{error}</div>}
        <button className="donate-btn" type="submit" disabled={saving} style={{ opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Creating…' : 'Create Admin Account'}
        </button>
      </form>

      {loading && <p style={{ color: 'var(--gray-600)' }}>Loading admin accounts…</p>}

      {!loading && (
        <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '16px', overflow: 'hidden' }}>
          <table className="admin-table">
            <thead><tr><th>Username</th><th>Name</th><th>Role</th><th>Created</th><th></th></tr></thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a.id}>
                  <td>{a.username}</td>
                  <td>{a.name}</td>
                  <td style={{ textTransform: 'capitalize' }}>{a.role}</td>
                  <td>{a.created_at ? new Date(a.created_at).toLocaleDateString() : '—'}</td>
                  <td>
                    {a.username !== currentUsername && (
                      <button onClick={() => handleDelete(a.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── Database Tables tab (super admin only) ─────────────────────────────────
// A generic Postgres table browser/editor — same idea as Kutumb's Database
// Tables tab: pick any table, search across it, filter by column values,
// sort, and add/edit/delete rows. Only works when a real Postgres (Neon)
// database is connected — the in-memory fallback has no information_schema
// to browse.

function displayValue(v) {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (Array.isArray(v)) return v.join(', ');
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

// One form control per column, matched to its Postgres type.
const FieldEditor = ({ column, value, onChange }) => {
  if (column.data_type === 'boolean') {
    return <input type="checkbox" checked={value === true || value === 'true'} onChange={(e) => onChange(e.target.checked)} />;
  }
  if (['integer', 'bigint', 'numeric', 'smallint', 'real', 'double precision'].includes(column.data_type)) {
    return <input className="form-input" type="number" value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? '' : e.target.value)} />;
  }
  if (column.data_type === 'boolean' || column.data_type === 'json' || column.data_type === 'jsonb') {
    return <textarea className="form-input" rows={2} value={typeof value === 'string' ? value : JSON.stringify(value ?? {})} onChange={(e) => onChange(e.target.value)} />;
  }
  return <input className="form-input" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
};

// Small funnel-icon dropdown: a checklist of every distinct value seen in
// this column, right-sized for an admin data browser (no fancy library).
const ColumnFilter = ({ label, options, selected, onChange }) => {
  const [open, setOpen] = useState(false);
  const isActive = selected.length > 0;
  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={`Filter ${label}`}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', color: isActive ? 'var(--teal)' : 'var(--gray-400)', fontSize: '0.7rem', verticalAlign: 'middle' }}
      >▼</button>
      {open && (
        <div className="col-filter-popover" onMouseLeave={() => setOpen(false)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0.6rem', borderBottom: '1px solid var(--gray-200)' }}>
            <button type="button" onClick={() => onChange([])} style={{ background: 'none', border: 'none', color: 'var(--teal)', fontSize: '0.75rem', cursor: 'pointer' }} disabled={!isActive}>Clear</button>
            <button type="button" onClick={() => onChange(options)} style={{ background: 'none', border: 'none', color: 'var(--teal)', fontSize: '0.75rem', cursor: 'pointer' }}>All</button>
          </div>
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {options.map((opt) => (
              <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.3rem 0.6rem', fontSize: '0.78rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={() => onChange(selected.includes(opt) ? selected.filter((v) => v !== opt) : [...selected, opt])}
                />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opt === '' ? '(blank)' : opt}</span>
              </label>
            ))}
            {options.length === 0 && <div style={{ padding: '0.5rem 0.6rem', fontSize: '0.78rem', color: 'var(--gray-500)' }}>No values</div>}
          </div>
        </div>
      )}
    </span>
  );
};

const DatabaseTablesTab = () => {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);
  const [truncated, setTruncated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [colFilters, setColFilters] = useState({});       // { column: [selected values] }
  const [sort, setSort] = useState({ column: null, dir: null });

  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRow, setNewRow] = useState({});

  useEffect(() => {
    adminFetch('/api/db-tables/tables').then(setTables).catch((err) => setError(err.message));
  }, []);

  const loadTable = useCallback(async (table) => {
    if (!table) return;
    setLoading(true);
    setError('');
    setShowAddForm(false);
    setEditingId(null);
    setSearch('');
    setColFilters({});
    setSort({ column: null, dir: null });
    try {
      const result = await adminFetch(`/api/db-tables/tables/${table}`);
      setColumns(result.columns);
      setRows(result.rows);
      setTruncated(result.truncated);
    } catch (err) {
      setError(err.message);
      setColumns([]);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (selectedTable) loadTable(selectedTable); }, [selectedTable, loadTable]);

  // ── search + per-column filter + sort, all applied client-side over the
  //    already-loaded page (same approach Kutumb uses: this is a data
  //    browser for up to 500 rows, not a full query tool) ──
  const visibleRows = (() => {
    let result = rows;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((row) => columns.some((c) => displayValue(row[c.column_name]).toLowerCase().includes(q)));
    }
    Object.entries(colFilters).forEach(([col, selected]) => {
      if (selected.length > 0) {
        result = result.filter((row) => selected.includes(displayValue(row[col])));
      }
    });
    if (sort.column && sort.dir) {
      result = [...result].sort((a, b) => {
        const av = displayValue(a[sort.column]);
        const bv = displayValue(b[sort.column]);
        const cmp = av.localeCompare(bv, undefined, { numeric: true });
        return sort.dir === 'asc' ? cmp : -cmp;
      });
    }
    return result;
  })();

  const distinctValues = (col) => [...new Set(rows.map((r) => displayValue(r[col])))];

  const toggleSort = (col) => {
    setSort((s) => {
      if (s.column !== col) return { column: col, dir: 'asc' };
      if (s.dir === 'asc') return { column: col, dir: 'desc' };
      return { column: null, dir: null };
    });
  };

  const startEdit = (row) => { setEditingId(row.id); setEditValues({ ...row }); };

  const saveEdit = async () => {
    try {
      await adminFetch(`/api/db-tables/tables/${selectedTable}/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editValues),
      });
      setEditingId(null);
      loadTable(selectedTable);
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteRow = async (row) => {
    if (!window.confirm(`Delete this row from ${selectedTable}? This can't be undone.`)) return;
    try {
      await adminFetch(`/api/db-tables/tables/${selectedTable}/${row.id}`, { method: 'DELETE' });
      loadTable(selectedTable);
    } catch (err) {
      setError(err.message);
    }
  };

  const createRow = async () => {
    try {
      await adminFetch(`/api/db-tables/tables/${selectedTable}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRow),
      });
      setNewRow({});
      setShowAddForm(false);
      loadTable(selectedTable);
    } catch (err) {
      setError(err.message);
    }
  };

  const creatableColumns = columns.filter((c) => c.column_name !== 'id');

  return (
    <div>
      <div className="form-group" style={{ maxWidth: 320 }}>
        <label className="form-label">Table</label>
        <select className="form-input" value={selectedTable} onChange={(e) => setSelectedTable(e.target.value)}>
          <option value="">-- Choose a table --</option>
          {tables.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.4rem' }}>
          Admin Users is managed on its own tab instead of here, for safety.
        </p>
      </div>

      {error && <div className="payment-error">{error}</div>}
      {loading && <p style={{ color: 'var(--gray-600)' }}>Loading…</p>}

      {selectedTable && !loading && (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <input
              className="form-input"
              style={{ maxWidth: 280 }}
              placeholder={`Search ${selectedTable}…`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                {visibleRows.length} of {rows.length} row{rows.length === 1 ? '' : 's'}{truncated ? ' (showing first 500)' : ''}
              </span>
              <button className="btn-teal" onClick={() => setShowAddForm((s) => !s)}>{showAddForm ? 'Cancel' : '+ Add Row'}</button>
            </div>
          </div>

          {showAddForm && (
            <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '16px', padding: '1.2rem', marginBottom: '1.5rem' }}>
              <h4 style={{ fontFamily: 'var(--font-display)', color: 'var(--navy)', marginBottom: '0.75rem', fontSize: '0.95rem' }}>New row in {selectedTable}</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                {creatableColumns.map((col) => (
                  <div key={col.column_name}>
                    <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--gray-600)' }}>
                      {col.column_name}{col.is_nullable === 'NO' && !col.column_default ? ' *' : ''}
                    </label>
                    <FieldEditor column={col} value={newRow[col.column_name]} onChange={(v) => setNewRow({ ...newRow, [col.column_name]: v })} />
                  </div>
                ))}
              </div>
              <button className="donate-btn" style={{ width: 'auto', padding: '0.6rem 1.5rem' }} onClick={createRow}>Create Row</button>
            </div>
          )}

          <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '16px', overflowX: 'auto', overflowY: 'visible' }}>
            <table className="admin-table" style={{ minWidth: 600 }}>
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th key={col.column_name}>
                      <span onClick={() => toggleSort(col.column_name)} style={{ cursor: 'pointer' }}>
                        {col.column_name}{' '}
                        <span style={{ color: 'var(--gray-400)' }}>
                          {sort.column === col.column_name ? (sort.dir === 'asc' ? '▲' : '▼') : '↕'}
                        </span>
                      </span>
                      <ColumnFilter
                        label={col.column_name}
                        options={distinctValues(col.column_name)}
                        selected={colFilters[col.column_name] || []}
                        onChange={(vals) => setColFilters({ ...colFilters, [col.column_name]: vals })}
                      />
                    </th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.length === 0 && (
                  <tr><td colSpan={columns.length + 1} style={{ textAlign: 'center', color: 'var(--gray-500)', padding: '1.5rem' }}>No matching rows.</td></tr>
                )}
                {visibleRows.map((row) => {
                  const isEditing = editingId === row.id;
                  return (
                    <tr key={row.id}>
                      {columns.map((col) => (
                        <td key={col.column_name} style={{ maxWidth: 220 }}>
                          {isEditing && col.column_name !== 'id' ? (
                            <FieldEditor column={col} value={editValues[col.column_name]} onChange={(v) => setEditValues({ ...editValues, [col.column_name]: v })} />
                          ) : (
                            <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={displayValue(row[col.column_name])}>
                              {displayValue(row[col.column_name])}
                            </span>
                          )}
                        </td>
                      ))}
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button className="btn-teal" style={{ padding: '0.3rem 0.8rem', fontSize: '0.78rem' }} onClick={saveEdit}>Save</button>
                            <button className="btn-outline" style={{ padding: '0.3rem 0.8rem', fontSize: '0.78rem' }} onClick={() => setEditingId(null)}>Cancel</button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '0.6rem' }}>
                            <button onClick={() => startEdit(row)} style={{ background: 'none', border: 'none', color: 'var(--teal)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Edit</button>
                            <button onClick={() => deleteRow(row)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Delete</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

// ─── Main Admin page ─────────────────────────────────────────────────────────
const AdminPage = () => {
  const [checkingSession, setCheckingSession] = useState(true);
  const [admin, setAdmin] = useState(null);
  const [tab, setTab] = useState('donations');
  const isSuperAdmin = admin?.role === 'superadmin';

  useEffect(() => {
    adminFetch('/api/admin-auth/me')
      .then((data) => setAdmin(data))
      .catch(() => setAdmin(null))
      .finally(() => setCheckingSession(false));
  }, []);

  const handleLogout = async () => {
    try { await adminFetch('/api/admin-auth/logout', { method: 'POST' }); } catch { /* ignore */ }
    setAdmin(null);
  };

  return (
    <div className="page-enter">
      <section className="admin-hero">
        <div className="section-inner" style={{ textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', color: 'white', marginBottom: '0.75rem' }}>Admin Console</h1>
          <p style={{ color: 'rgba(255,255,255,0.85)' }}>Manage donations and projects for Headstart Education</p>
        </div>
      </section>

      {checkingSession && (
        <section className="section"><p style={{ textAlign: 'center', color: 'var(--gray-500)' }}>Checking session…</p></section>
      )}

      {!checkingSession && !admin && <AdminLogin onLogin={setAdmin} />}

      {!checkingSession && admin && (
        <section className="section">
          <div className="section-inner">
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <p style={{ color: 'var(--gray-600)' }}>Logged in as <strong>{admin.name}</strong> ({admin.role})</p>
              <button className="btn-outline" onClick={handleLogout}>Logout</button>
            </div>

            <div className="tabs">
              <div className={`tab${tab === 'donations' ? ' active' : ''}`} onClick={() => setTab('donations')}>Donations</div>
              <div className={`tab${tab === 'projects' ? ' active' : ''}`} onClick={() => setTab('projects')}>Projects</div>
              {isSuperAdmin && <div className={`tab${tab === 'admins' ? ' active' : ''}`} onClick={() => setTab('admins')}>Admin Users</div>}
              {isSuperAdmin && <div className={`tab${tab === 'database' ? ' active' : ''}`} onClick={() => setTab('database')}>Database Tables</div>}
            </div>

            {tab === 'donations' && <DonationsTab />}
            {tab === 'projects' && <ProjectsTab />}
            {tab === 'admins' && isSuperAdmin && <AdminUsersTab currentUsername={admin.username} />}
            {tab === 'database' && isSuperAdmin && <DatabaseTablesTab />}
          </div>
        </section>
      )}
    </div>
  );
};

export default AdminPage;
