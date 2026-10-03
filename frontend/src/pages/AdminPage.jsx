import { useState, useEffect, useCallback, useRef } from 'react';
import Icon from '../components/Icon';
import Modal from '../components/Modal';
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

const ProjectsTab = ({ canEdit }) => {
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
        {canEdit && <button className="btn-teal" onClick={() => setShowForm((s) => !s)}>{showForm ? 'Cancel' : '+ Add Project'}</button>}
      </div>

      {canEdit && showForm && (
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
              <tr><th>Name</th><th>Category</th><th>Location</th><th>Status</th>{canEdit && <th></th>}</tr>
            </thead>
            <tbody>
              {programs.length === 0 && (
                <tr><td colSpan={canEdit ? 5 : 4} style={{ textAlign: 'center', color: 'var(--gray-500)', padding: '1.5rem' }}>No projects listed.</td></tr>
              )}
              {programs.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.category}</td>
                  <td>{p.location}</td>
                  <td><span className={`admin-status admin-status-${p.status}`}>{p.status}</span></td>
                  {canEdit && (
                    <td>
                      <button onClick={() => handleDelete(p.id)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                        Remove
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── Users tab (superadmin only) ────────────────────────────────────────────
// Manage everyone who can log in to the console — super admins, admins and
// other staff. Roles are enforced server-side; this screen just edits them.
const ROLE_INFO = {
  superadmin: { label: 'Super Admin', desc: 'Everything, including Users, API Key Settings and Database Tables.' },
  admin:      { label: 'Admin',       desc: 'View donations and update their status; manage projects.' },
  editor:     { label: 'Editor',      desc: 'View donations; add, edit and remove projects.' },
  viewer:     { label: 'Viewer',      desc: 'Read-only access to donations and projects.' },
};

const emptyUser = { username: '', name: '', email: '', role: 'viewer', password: '', is_active: true };

const linkBtn = (color) => ({ background: 'none', border: 'none', color, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 });

const UsersTab = ({ currentUsername }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState(emptyUser);
  const [editingId, setEditingId] = useState(null);   // null = creating a new user
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setUsers(await adminFetch('/api/users'));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditingId(null); setForm(emptyUser); setError(''); setNotice(''); setShowForm(true); };
  const openEdit = (u) => {
    setEditingId(u.id);
    setForm({ username: u.username, name: u.name || '', email: u.email || '', role: u.role, password: '', is_active: u.is_active });
    setError(''); setNotice(''); setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditingId(null); setForm(emptyUser); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      if (editingId) {
        const body = { name: form.name, email: form.email, role: form.role, is_active: form.is_active };
        if (form.password) body.password = form.password;   // blank = leave password alone
        await adminFetch(`/api/users/${editingId}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        });
        setNotice(`Saved changes to ${form.username}.`);
      } else {
        await adminFetch('/api/users', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
        });
        setNotice(`Created user ${form.username.trim().toLowerCase()}.`);
      }
      closeForm();
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (u) => {
    setError(''); setNotice('');
    try {
      await adminFetch(`/api/users/${u.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active: !u.is_active }),
      });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Remove ${u.username}? They will no longer be able to log in. This can't be undone.`)) return;
    setError(''); setNotice('');
    try {
      await adminFetch(`/api/users/${u.id}`, { method: 'DELETE' });
      setNotice(`Removed ${u.username}.`);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const card = { background: 'white', border: '1px solid var(--gray-200)', borderRadius: '16px' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--navy)' }}>Users</h3>
        <button className="btn-teal" onClick={showForm ? closeForm : openCreate}>{showForm ? 'Cancel' : '+ Add User'}</button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} style={{ ...card, padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h4 style={{ fontFamily: 'var(--font-display)', color: 'var(--navy)', marginBottom: '1rem' }}>
            {editingId ? `Edit ${form.username}` : 'New user'}
          </h4>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Username *</label>
              <input className="form-input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
                required disabled={!!editingId} autoComplete="off" placeholder="e.g. jsmith" />
            </div>
            <div className="form-group">
              <label className="form-label">Display Name</label>
              <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {Object.entries(ROLE_INFO).map(([value, { label }]) => <option key={value} value={value}>{label}</option>)}
              </select>
              <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.35rem' }}>{ROLE_INFO[form.role].desc}</p>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{editingId ? 'New Password (leave blank to keep current)' : 'Password * (min 8 characters)'}</label>
              <input className="form-input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                required={!editingId} minLength={form.password ? 8 : undefined} autoComplete="new-password" />
            </div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', cursor: 'pointer', paddingBottom: '0.7rem' }}>
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                Account active (can log in)
              </label>
            </div>
          </div>
          {error && <div className="payment-error">{error}</div>}
          <button className="donate-btn" type="submit" disabled={saving} style={{ opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : (editingId ? 'Save Changes' : 'Create User')}
          </button>
        </form>
      )}

      {!showForm && error && <div className="payment-error">{error}</div>}
      {notice && <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', color: '#065f46', borderRadius: '8px', padding: '0.7rem 1rem', marginBottom: '1rem', fontSize: '0.85rem' }}>{notice}</div>}
      {loading && <p style={{ color: 'var(--gray-600)' }}>Loading users…</p>}

      {!loading && (
        <div style={{ ...card, overflowX: 'auto' }}>
          <table className="admin-table" style={{ minWidth: 680 }}>
            <thead>
              <tr><th>Username</th><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Last login</th><th></th></tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--gray-500)', padding: '1.5rem' }}>No users yet.</td></tr>
              )}
              {users.map((u) => {
                const isSelf = u.username === currentUsername;
                return (
                  <tr key={u.id} style={{ opacity: u.is_active ? 1 : 0.6 }}>
                    <td><strong>{u.username}</strong>{isSelf && <span style={{ color: 'var(--gray-500)', fontSize: '0.75rem' }}> (you)</span>}</td>
                    <td>{u.name}</td>
                    <td>{u.email || '—'}</td>
                    <td>{ROLE_INFO[u.role]?.label || u.role}</td>
                    <td>
                      <span className={`admin-status admin-status-${u.is_active ? 'completed' : 'failed'}`}>{u.is_active ? 'active' : 'disabled'}</span>
                    </td>
                    <td>{u.last_login_at ? new Date(u.last_login_at).toLocaleString() : 'Never'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: '0.8rem' }}>
                        <button onClick={() => openEdit(u)} style={linkBtn('var(--teal)')}>Edit</button>
                        {!isSelf && (
                          <>
                            <button onClick={() => toggleActive(u)} style={linkBtn('var(--gray-700)')}>{u.is_active ? 'Disable' : 'Enable'}</button>
                            <button onClick={() => handleDelete(u)} style={linkBtn('#dc2626')}>Remove</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ ...card, padding: '1.2rem 1.5rem', marginTop: '1.5rem' }}>
        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--navy)', marginBottom: '0.6rem' }}>What each role can do</div>
        {Object.entries(ROLE_INFO).map(([value, { label, desc }]) => (
          <div key={value} style={{ fontSize: '0.82rem', color: 'var(--gray-700)', marginBottom: '0.3rem' }}>
            <strong>{label}</strong> — {desc}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Square Settings tab (superadmin only) ──────────────────────────────────
// Square credentials live in the database (access token encrypted), so
// they can be changed here without redeploying. Application ID + Location ID
// are public identifiers used by the donate form; the access token is the
// secret the server uses to actually take payments.
const SquareSettingsTab = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [meta, setMeta] = useState({ accessTokenSet: false, accessTokenLast4: null, sources: {} });
  const [form, setForm] = useState({ environment: 'sandbox', applicationId: '', locationId: '', accessToken: '' });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const s = await adminFetch('/api/square/settings');
      setMeta({ accessTokenSet: s.accessTokenSet, accessTokenLast4: s.accessTokenLast4, sources: s.sources || {} });
      setForm({ environment: s.environment, applicationId: s.applicationId, locationId: s.locationId, accessToken: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (extra = {}) => {
    setSaving(true); setError(''); setNotice(''); setTestResult(null);
    try {
      await adminFetch('/api/square/settings', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, ...extra }),
      });
      setNotice(extra.clearAccessToken ? 'Access token removed.' : 'Square settings saved. They take effect immediately — no restart needed.');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = (e) => { e.preventDefault(); save(); };

  const handleTest = async () => {
    setTesting(true); setError(''); setNotice(''); setTestResult(null);
    try {
      setTestResult({ ok: true, ...(await adminFetch('/api/square/test', { method: 'POST' })) });
    } catch (err) {
      setTestResult({ ok: false, message: err.message });
    } finally {
      setTesting(false);
    }
  };

  const card = { background: 'white', border: '1px solid var(--gray-200)', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' };
  const fromEnv = Object.values(meta.sources).includes('env');
  const hint = { fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.35rem' };

  if (loading) return <p style={{ color: 'var(--gray-600)' }}>Loading Square settings…</p>;

  return (
    <div>
      <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--navy)', marginBottom: '0.4rem' }}>Square Settings</h3>
      <p style={{ color: 'var(--gray-600)', fontSize: '0.88rem', marginBottom: '1.2rem' }}>
        Credentials used to take donations. Get them from the{' '}
        <a href="https://developer.squareup.com/apps" target="_blank" rel="noreferrer" style={{ color: 'var(--teal)' }}>Square Developer Dashboard</a>.
      </p>

      {fromEnv && (
        <div className="payment-notice">
          Some values are currently coming from server environment variables. Saving here stores them in the database, and those take priority from then on.
        </div>
      )}

      <form onSubmit={handleSubmit} style={card}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Environment</label>
            <select className="form-input" value={form.environment} onChange={(e) => setForm({ ...form, environment: e.target.value })}>
              <option value="sandbox">Sandbox (testing — no real money)</option>
              <option value="production">Production (live payments)</option>
            </select>
            {form.environment === 'production' && <p style={{ ...hint, color: '#b45309' }}>Live mode: real cards will be charged.</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Application ID</label>
            <input className="form-input" value={form.applicationId} onChange={(e) => setForm({ ...form, applicationId: e.target.value })}
              placeholder={form.environment === 'sandbox' ? 'sandbox-sq0idb-…' : 'sq0idp-…'} autoComplete="off" />
            <p style={hint}>Public — used by the card form on the Donate page.</p>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Location ID</label>
            <input className="form-input" value={form.locationId} onChange={(e) => setForm({ ...form, locationId: e.target.value })} placeholder="e.g. L1ABC23DEF456" autoComplete="off" />
            <p style={hint}>The Square location payments are taken against.</p>
          </div>
          <div className="form-group">
            <label className="form-label">Access Token (secret)</label>
            <input className="form-input" type="password" value={form.accessToken} onChange={(e) => setForm({ ...form, accessToken: e.target.value })}
              placeholder={meta.accessTokenSet ? `Saved — ends in ${meta.accessTokenLast4} (leave blank to keep)` : 'EAAA…'} autoComplete="new-password" />
            <p style={hint}>
              Stored encrypted and never shown again.
              {meta.accessTokenSet && (
                <> <button type="button" onClick={() => window.confirm('Remove the saved access token? Donations will stop being charged until a new one is added.') && save({ clearAccessToken: true })}
                  style={{ ...linkBtn('#dc2626'), fontSize: '0.75rem' }}>Remove saved token</button></>
              )}
            </p>
          </div>
        </div>

        {error && <div className="payment-error">{error}</div>}
        {notice && <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', color: '#065f46', borderRadius: '8px', padding: '0.7rem 1rem', marginBottom: '1rem', fontSize: '0.85rem' }}>{notice}</div>}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          <button className="donate-btn" type="submit" disabled={saving} style={{ width: 'auto', padding: '0.7rem 1.8rem', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
          <button className="btn-outline" type="button" onClick={handleTest} disabled={testing || !meta.accessTokenSet}
            title={meta.accessTokenSet ? '' : 'Save an access token first'}>
            {testing ? 'Testing…' : 'Test Connection'}
          </button>
        </div>
      </form>

      {testResult && !testResult.ok && <div className="payment-error">Connection failed: {testResult.message}</div>}
      {testResult && testResult.ok && (
        <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', borderRadius: '12px', padding: '1rem 1.2rem', fontSize: '0.85rem', color: '#065f46' }}>
          <strong>Connected to Square ({testResult.environment}).</strong>{' '}
          {testResult.locationId
            ? (testResult.locationFound
                ? <>Location “{testResult.locationName}” found.</>
                : <span style={{ color: '#b91c1c' }}>But Location ID “{testResult.locationId}” isn't on this account — pick one below.</span>)
            : 'No Location ID saved yet — pick one below.'}
          {testResult.locations.length > 0 && (
            <ul style={{ marginTop: '0.6rem', paddingLeft: '1.2rem', color: 'var(--gray-700)' }}>
              {testResult.locations.map((l) => (
                <li key={l.id}>
                  {l.name} — <code>{l.id}</code>{' '}
                  {l.id !== form.locationId && (
                    <button type="button" onClick={() => setForm({ ...form, locationId: l.id })} style={{ ...linkBtn('var(--teal)'), fontSize: '0.78rem' }}>Use this</button>
                  )}
                </li>
              ))}
            </ul>
          )}
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
          Users and Square Settings are managed on their own tabs instead of here, for safety.
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

// ─── Change own password (any role) ─────────────────────────────────────────
const ChangePasswordCard = ({ onDone }) => {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.newPassword !== form.confirm) { setError("The new passwords don't match."); return; }
    setSaving(true);
    try {
      await adminFetch('/api/admin-auth/change-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
      });
      setDone(true);
      setTimeout(onDone, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem', maxWidth: 480 }}>
      <h4 style={{ fontFamily: 'var(--font-display)', color: 'var(--navy)', marginBottom: '1rem' }}>Change your password</h4>
      <div className="form-group">
        <label className="form-label">Current password</label>
        <input className="form-input" type="password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} required autoComplete="current-password" />
      </div>
      <div className="form-group">
        <label className="form-label">New password (min 8 characters)</label>
        <input className="form-input" type="password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} required minLength={8} autoComplete="new-password" />
      </div>
      <div className="form-group">
        <label className="form-label">Confirm new password</label>
        <input className="form-input" type="password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} required autoComplete="new-password" />
      </div>
      {error && <div className="payment-error">{error}</div>}
      {done && <div style={{ color: '#065f46', fontSize: '0.85rem', marginBottom: '0.8rem' }}>Password updated.</div>}
      <button className="donate-btn" type="submit" disabled={saving || done} style={{ opacity: saving ? 0.7 : 1 }}>
        {saving ? 'Saving…' : 'Update Password'}
      </button>
    </form>
  );
};

// ─── System Email Settings ───────────────────────────────────────────────────
// SMTP details used to send donation receipts and admin notifications. The
// password is stored encrypted and never sent back to the browser.
const EmailSettingsTab = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [testTo, setTestTo] = useState('');
  const [meta, setMeta] = useState({ passwordSet: false, passwordLast4: null, sources: {}, configured: false });
  const [form, setForm] = useState({
    host: '', port: 587, secure: false, user: '', password: '',
    fromName: 'Headstart Education', fromAddress: '', replyTo: '', adminNotify: '',
    sendReceipts: true, notifyAdmin: true,
  });

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const s = await adminFetch('/api/email/settings');
      setMeta({ passwordSet: s.passwordSet, passwordLast4: s.passwordLast4, sources: s.sources || {}, configured: s.configured });
      setForm({
        host: s.host, port: s.port, secure: s.secure, user: s.user, password: '',
        fromName: s.fromName, fromAddress: s.fromAddress, replyTo: s.replyTo, adminNotify: s.adminNotify,
        sendReceipts: s.sendReceipts, notifyAdmin: s.notifyAdmin,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (extra = {}) => {
    setSaving(true); setError(''); setNotice(''); setTestResult(null);
    try {
      await adminFetch('/api/email/settings', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, ...extra }),
      });
      setNotice(extra.clearPassword ? 'Saved password removed.' : 'Email settings saved. They take effect immediately — no restart needed.');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = (e) => { e.preventDefault(); save(); };

  const handleTest = async () => {
    setTesting(true); setError(''); setNotice(''); setTestResult(null);
    try {
      setTestResult({ ok: true, ...(await adminFetch('/api/email/test', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: testTo }),
      })) });
    } catch (err) {
      setTestResult({ ok: false, message: err.message });
    } finally {
      setTesting(false);
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const card = { background: 'white', border: '1px solid var(--gray-200)', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' };
  const hint = { fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.35rem' };
  const checkRow = { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', color: 'var(--gray-700)', marginBottom: '0.6rem' };
  const fromEnv = Object.values(meta.sources).includes('env');

  if (loading) return <p style={{ color: 'var(--gray-600)' }}>Loading email settings…</p>;

  return (
    <div>
      <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--navy)', marginBottom: '0.4rem' }}>System Email Settings</h3>
      <p style={{ color: 'var(--gray-600)', fontSize: '0.88rem', marginBottom: '1.2rem' }}>
        The mail server (SMTP) this website uses to email donation receipts to donors and notify your team.
        Works with any provider — e.g. Google Workspace, Microsoft 365, SendGrid, Mailgun, Amazon SES.
      </p>

      {!meta.configured && <div className="payment-notice">Email is not configured yet — donors won't receive receipts until you save the details below.</div>}
      {fromEnv && <div className="payment-notice">Some values currently come from server environment variables. Saving here stores them in the database, and those take priority from then on.</div>}

      <form onSubmit={handleSubmit} style={card}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">SMTP Host</label>
            <input className="form-input" value={form.host} onChange={set('host')} placeholder="smtp.example.com" autoComplete="off" />
          </div>
          <div className="form-group">
            <label className="form-label">Port</label>
            <input className="form-input" type="number" value={form.port} onChange={set('port')} placeholder="587" />
            <p style={hint}>587 (STARTTLS) is most common; 465 uses SSL/TLS.</p>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Username</label>
            <input className="form-input" value={form.user} onChange={set('user')} placeholder="apikey or full email address" autoComplete="off" />
          </div>
          <div className="form-group">
            <label className="form-label">Password (secret)</label>
            <input className="form-input" type="password" value={form.password} onChange={set('password')}
              placeholder={meta.passwordSet ? `Saved — ends in ${meta.passwordLast4} (leave blank to keep)` : 'SMTP password or app password'} autoComplete="new-password" />
            <p style={hint}>
              Stored encrypted and never shown again.
              {meta.passwordSet && (
                <> <button type="button" onClick={() => window.confirm('Remove the saved SMTP password?') && save({ clearPassword: true })}
                  style={{ ...linkBtn('#dc2626'), fontSize: '0.75rem' }}>Remove saved password</button></>
              )}
            </p>
          </div>
        </div>
        <label style={checkRow}>
          <input type="checkbox" checked={form.secure} onChange={set('secure')} />
          Use SSL/TLS from the start (tick for port 465; leave off for 587)
        </label>

        <hr style={{ border: 'none', borderTop: '1px solid var(--gray-200)', margin: '1rem 0' }} />

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">“From” Name</label>
            <input className="form-input" value={form.fromName} onChange={set('fromName')} placeholder="Headstart Education" />
          </div>
          <div className="form-group">
            <label className="form-label">“From” Email Address</label>
            <input className="form-input" type="email" value={form.fromAddress} onChange={set('fromAddress')} placeholder="giving@hseducation.org" />
            <p style={hint}>Must be an address your mail provider allows you to send from.</p>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Reply-To (optional)</label>
            <input className="form-input" type="email" value={form.replyTo} onChange={set('replyTo')} placeholder="info@hseducation.org" />
          </div>
          <div className="form-group">
            <label className="form-label">Notify Admin At</label>
            <input className="form-input" type="email" value={form.adminNotify} onChange={set('adminNotify')} placeholder="giving@hseducation.org" />
            <p style={hint}>Where “new donation” alerts are sent.</p>
          </div>
        </div>
        <label style={checkRow}><input type="checkbox" checked={form.sendReceipts} onChange={set('sendReceipts')} /> Email a thank-you receipt to donors after a successful payment</label>
        <label style={{ ...checkRow, marginBottom: '1.2rem' }}><input type="checkbox" checked={form.notifyAdmin} onChange={set('notifyAdmin')} /> Email me when a new donation is received</label>

        {error && <div className="payment-error">{error}</div>}
        {notice && <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', color: '#065f46', borderRadius: '8px', padding: '0.7rem 1rem', marginBottom: '1rem', fontSize: '0.85rem' }}>{notice}</div>}

        <button className="donate-btn" type="submit" disabled={saving} style={{ width: 'auto', padding: '0.7rem 1.8rem', opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </form>

      <div style={card}>
        <h4 style={{ fontFamily: 'var(--font-display)', color: 'var(--navy)', marginBottom: '0.4rem' }}>Test your settings</h4>
        <p style={{ ...hint, marginTop: 0, marginBottom: '0.8rem' }}>Save first, then check the connection — add an address to also send a test email.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          <input className="form-input" type="email" value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="send a test to… (optional)" style={{ maxWidth: 320 }} />
          <button className="btn-outline" type="button" onClick={handleTest} disabled={testing || !form.host}>
            {testing ? 'Testing…' : (testTo ? 'Send Test Email' : 'Test Connection')}
          </button>
        </div>
        {testResult && !testResult.ok && <div className="payment-error" style={{ marginTop: '1rem', marginBottom: 0 }}>Failed: {testResult.message}</div>}
        {testResult && testResult.ok && (
          <div style={{ marginTop: '1rem', background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', borderRadius: '8px', padding: '0.7rem 1rem', fontSize: '0.85rem', color: '#065f46' }}>
            Connected to {testResult.host}:{testResult.port}.{testResult.sent ? <> Test email sent to <strong>{testResult.to}</strong> — check the inbox (and spam).</> : ' Login accepted.'}
          </div>
        )}
      </div>
    </div>
  );
};


// ─── Images ──────────────────────────────────────────────────────────────────
// Every photo on the website is stored in the database. Each row says where
// the image appears and what it is for; "Replace" swaps it everywhere at once.
const fmtBytes = (n) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
const MAX_UPLOAD = 6 * 1024 * 1024;

// Shrinks large photos in the browser before upload (keeps pages fast and
// stays under the 6 MB server limit). GIFs and already-small files pass through.
async function prepareImage(file) {
  if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) throw new Error('Please choose a JPG, PNG, WebP or GIF image.');
  const tooBig = file.size > 2.5 * 1024 * 1024;
  if (file.type === 'image/gif') {
    if (file.size > MAX_UPLOAD) throw new Error('That GIF is over 6 MB — choose a smaller one.');
    return file;
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image(); i.onload = () => resolve(i); i.onerror = () => reject(new Error('Could not read that image.')); i.src = url;
    });
    const MAX_EDGE = 2400;
    const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
    if (scale === 1 && !tooBig) return file;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.86));
    if (!blob) throw new Error('Could not process that image.');
    if (blob.size > MAX_UPLOAD) throw new Error('That image is still over 6 MB after resizing — choose a smaller one.');
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

const ImagesTab = ({ canEdit }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyKey, setBusyKey] = useState(null);
  const [pageFilter, setPageFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [dims, setDims] = useState({});            // key -> "800×533"
  const [preview, setPreview] = useState(null);    // item being previewed
  const [editing, setEditing] = useState(null);    // item whose details are being edited
  const [detailForm, setDetailForm] = useState({ label: '', purpose: '' });
  const fileRef = useRef(null);
  const replaceKey = useRef(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setItems(await adminFetch('/api/images')); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const imgUrl = (it) => `${API_URL}/api/images/${it.key}?v=${new Date(it.updated_at).getTime()}`;

  const pages = ['all', 'Home', 'About', 'Projects', 'Impact', 'Donate', 'Legal', 'unused'];
  const visible = items.filter((it) => {
    if (pageFilter === 'unused' && it.usage.length) return false;
    if (pageFilter !== 'all' && pageFilter !== 'unused' && !it.usage.some((u) => u.page === pageFilter)) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [it.label, it.key, it.purpose, ...it.usage.map((u) => `${u.page} ${u.section} ${u.note}`)].join(' ').toLowerCase().includes(q);
  });

  const startReplace = (it) => { replaceKey.current = it.key; fileRef.current.value = ''; fileRef.current.click(); };

  const onFileChosen = async (e) => {
    const file = e.target.files?.[0];
    const key = replaceKey.current;
    if (!file || !key) return;
    setBusyKey(key); setError(''); setNotice('');
    try {
      const body = await prepareImage(file);
      const res = await fetch(`${API_URL}/api/images/${key}`, {
        method: 'PUT', credentials: 'include', headers: { 'Content-Type': body.type || file.type }, body,
      });
      let data = null; try { data = await res.json(); } catch { /* no body */ }
      if (res.status === 401) throw new Error('Your admin session has expired — please log in again.');
      if (!res.ok) throw new Error(data?.message || 'Upload failed');
      setNotice('Image replaced. It now shows everywhere it is used on the website.');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyKey(null);
    }
  };

  const restore = async (it) => {
    if (!window.confirm(`Restore the original photo for “${it.label}”? Your uploaded image will be replaced.`)) return;
    setBusyKey(it.key); setError(''); setNotice('');
    try {
      await adminFetch(`/api/images/${it.key}/reset`, { method: 'POST' });
      setNotice('Original image restored.');
      await load();
    } catch (err) { setError(err.message); }
    finally { setBusyKey(null); }
  };

  const openDetails = (it) => { setEditing(it); setDetailForm({ label: it.label, purpose: it.purpose || '' }); };
  const saveDetails = async (e) => {
    e.preventDefault();
    setBusyKey(editing.key); setError(''); setNotice('');
    try {
      await adminFetch(`/api/images/${editing.key}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(detailForm),
      });
      setEditing(null);
      setNotice('Details saved.');
      await load();
    } catch (err) { setError(err.message); }
    finally { setBusyKey(null); }
  };

  const cell = { verticalAlign: 'top' };
  const small = { fontSize: '0.78rem', color: 'var(--gray-600)', lineHeight: 1.5 };

  return (
    <div>
      <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--navy)', marginBottom: '0.4rem' }}>Website Images</h3>
      <p style={{ color: 'var(--gray-600)', fontSize: '0.88rem', marginBottom: '1.2rem' }}>
        All photos on the site are stored in the database. Replacing an image updates <strong>every place it appears</strong> — check
        “Where it's used” first. Large photos are resized automatically before upload (max 6 MB).
      </p>

      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" style={{ display: 'none' }} onChange={onFileChosen} />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem', alignItems: 'center' }}>
        <select className="form-input" value={pageFilter} onChange={(e) => setPageFilter(e.target.value)} style={{ width: 'auto' }}>
          {pages.map((p) => <option key={p} value={p}>{p === 'all' ? 'All pages' : p === 'unused' ? 'Spare (not shown)' : `${p} page`}</option>)}
        </select>
        <input className="form-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search images, sections, purpose…" style={{ maxWidth: 320 }} />
        <span style={small}>{visible.length} of {items.length} images</span>
      </div>

      {error && <div className="payment-error">{error}</div>}
      {notice && <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', color: '#065f46', borderRadius: '8px', padding: '0.7rem 1rem', marginBottom: '1rem', fontSize: '0.85rem' }}>{notice}</div>}
      {loading && <p style={{ color: 'var(--gray-600)' }}>Loading images…</p>}

      {!loading && (
        <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '16px', overflowX: 'auto' }}>
          <table className="admin-table" style={{ minWidth: 860 }}>
            <thead>
              <tr><th>Image</th><th>Where it's used</th><th>Purpose</th><th>File</th>{canEdit && <th></th>}</tr>
            </thead>
            <tbody>
              {visible.map((it) => (
                <tr key={it.key}>
                  <td style={{ ...cell, width: 130 }}>
                    <img src={imgUrl(it)} alt={it.label} onClick={() => setPreview(it)}
                      onLoad={(e) => setDims((d) => (d[it.key] === `${e.target.naturalWidth}×${e.target.naturalHeight}` ? d : { ...d, [it.key]: `${e.target.naturalWidth}×${e.target.naturalHeight}` }))}
                      style={{ width: 110, height: 76, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--gray-200)', cursor: 'zoom-in', display: 'block', opacity: busyKey === it.key ? 0.4 : 1 }} />
                  </td>
                  <td style={cell}>
                    <div style={{ fontWeight: 600, color: 'var(--navy)', fontSize: '0.88rem' }}>{it.label}</div>
                    <div style={{ ...small, marginBottom: '0.35rem' }}><code>{it.key}</code></div>
                    {it.usage.length === 0 && <span className="admin-status">Spare — not shown on site</span>}
                    {it.usage.map((u, i) => (
                      <div key={i} style={{ ...small, marginBottom: '0.2rem' }}>
                        <strong style={{ color: 'var(--teal)' }}>{u.page}</strong> › {u.section}
                        {u.note && <span style={{ color: 'var(--gray-500)' }}> — {u.note}</span>}
                      </div>
                    ))}
                  </td>
                  <td style={{ ...cell, ...small, maxWidth: 260 }}>{it.purpose || <em>No description</em>}</td>
                  <td style={{ ...cell, ...small, whiteSpace: 'nowrap' }}>
                    {dims[it.key] && <div>{dims[it.key]} px</div>}
                    <div>{fmtBytes(it.size_bytes)}</div>
                    <div>{it.is_custom ? 'Custom upload' : 'Original'}</div>
                    <div style={{ color: 'var(--gray-500)' }}>{new Date(it.updated_at).toLocaleDateString()}{it.updated_by ? ` · ${it.updated_by}` : ''}</div>
                    {it.recommended && <div style={{ color: 'var(--gray-500)', whiteSpace: 'normal', maxWidth: 160, marginTop: '0.25rem' }}>Best: {it.recommended}</div>}
                  </td>
                  {canEdit && (
                    <td style={{ ...cell, whiteSpace: 'nowrap' }}>
                      <button className="btn-outline" type="button" onClick={() => startReplace(it)} disabled={busyKey === it.key} style={{ marginBottom: '0.4rem', display: 'block' }}>
                        {busyKey === it.key ? 'Working…' : 'Replace'}
                      </button>
                      <button type="button" onClick={() => openDetails(it)} style={{ ...linkBtn('var(--teal)'), display: 'block', marginBottom: '0.3rem' }}>Edit details</button>
                      {it.is_custom && <button type="button" onClick={() => restore(it)} style={{ ...linkBtn('#dc2626'), display: 'block' }}>Restore original</button>}
                    </td>
                  )}
                </tr>
              ))}
              {visible.length === 0 && <tr><td colSpan={canEdit ? 5 : 4} style={{ textAlign: 'center', color: 'var(--gray-500)', padding: '2rem' }}>No images match.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!preview} onClose={() => setPreview(null)} title={preview?.label || ''} width={760}>
        {preview && (
          <div>
            <img src={imgUrl(preview)} alt={preview.label} style={{ width: '100%', maxHeight: '55vh', objectFit: 'contain', borderRadius: 8, background: 'var(--gray-100)' }} />
            <p style={{ ...small, marginTop: '0.8rem' }}>{preview.purpose}</p>
          </div>
        )}
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit image details" width={500}>
        {editing && (
          <form onSubmit={saveDetails}>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input className="form-input" value={detailForm.label} onChange={(e) => setDetailForm({ ...detailForm, label: e.target.value })} maxLength={150} required />
            </div>
            <div className="form-group">
              <label className="form-label">Purpose — what is this image for?</label>
              <textarea className="form-input" rows={4} value={detailForm.purpose} onChange={(e) => setDetailForm({ ...detailForm, purpose: e.target.value })} maxLength={1000} style={{ resize: 'vertical' }} />
            </div>
            <p style={{ ...small, marginBottom: '1rem' }}>The “Where it's used” list is maintained automatically from the website's pages.</p>
            <button className="donate-btn" type="submit" disabled={busyKey === editing.key}>Save</button>
          </form>
        )}
      </Modal>
    </div>
  );
};


// ─── Groq AI settings ────────────────────────────────────────────────────────
const GroqSettingsTab = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [models, setModels] = useState([]);
  const [meta, setMeta] = useState({ apiKeySet: false, apiKeyLast4: null, sources: {} });
  const [form, setForm] = useState({ model: 'llama-3.3-70b-versatile', apiKey: '' });

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const s = await adminFetch('/api/groq/settings');
      setMeta({ apiKeySet: s.apiKeySet, apiKeyLast4: s.apiKeyLast4, sources: s.sources || {} });
      setForm({ model: s.model, apiKey: '' });
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async (extra = {}) => {
    setSaving(true); setError(''); setNotice(''); setTestResult(null);
    try {
      await adminFetch('/api/groq/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, ...extra }) });
      setNotice(extra.clearApiKey ? 'API key removed.' : 'Groq settings saved. They take effect immediately.');
      await load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const fetchModels = async () => {
    setLoadingModels(true); setError('');
    try { setModels(await adminFetch('/api/groq/models')); }
    catch (err) { setError(err.message); }
    finally { setLoadingModels(false); }
  };

  const runTest = async () => {
    setTesting(true); setError(''); setNotice(''); setTestResult(null);
    try { setTestResult({ ok: true, ...(await adminFetch('/api/groq/test', { method: 'POST' })) }); }
    catch (err) { setTestResult({ ok: false, message: err.message }); }
    finally { setTesting(false); }
  };

  const card = { background: 'white', border: '1px solid var(--gray-200)', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' };
  const hint = { fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.35rem' };
  if (loading) return <p style={{ color: 'var(--gray-600)' }}>Loading Groq settings…</p>;

  return (
    <div>
      <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--navy)', marginBottom: '0.4rem' }}>Groq AI Settings</h3>
      <p style={{ color: 'var(--gray-600)', fontSize: '0.88rem', marginBottom: '1.2rem' }}>
        Groq's language models draft emails to donors, members and partners in the <strong>Send Email</strong> tab. Create a key in the{' '}
        <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" style={{ color: 'var(--teal)' }}>Groq Console</a>.
      </p>
      {meta.sources.apiKey === 'env' && <div className="payment-notice">The key currently comes from a server environment variable (GROQ_API_KEY). Saving one here stores it in the database and takes priority.</div>}

      <form onSubmit={(e) => { e.preventDefault(); save(); }} style={card}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">API Key (secret)</label>
            <input className="form-input" type="password" value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
              placeholder={meta.apiKeySet ? `Saved — ends in ${meta.apiKeyLast4} (leave blank to keep)` : 'gsk_…'} autoComplete="new-password" />
            <p style={hint}>
              Stored encrypted and never shown again.
              {meta.apiKeySet && meta.sources.apiKey === 'console' && (
                <> <button type="button" onClick={() => window.confirm('Remove the saved Groq API key? AI drafting will stop working until a new key is added.') && save({ clearApiKey: true })}
                  style={{ ...linkBtn('#dc2626'), fontSize: '0.75rem' }}>Remove saved key</button></>
              )}
            </p>
          </div>
          <div className="form-group">
            <label className="form-label">Model</label>
            <input className="form-input" list="groq-models" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="llama-3.3-70b-versatile" autoComplete="off" />
            <datalist id="groq-models">{models.map((m) => <option key={m} value={m} />)}</datalist>
            <p style={hint}>
              Type a model or{' '}
              <button type="button" onClick={fetchModels} disabled={loadingModels || !meta.apiKeySet} style={{ ...linkBtn('var(--teal)'), fontSize: '0.75rem' }}>
                {loadingModels ? 'loading…' : 'load the list from Groq'}
              </button>
              {models.length > 0 && <> ({models.length} available — click the field to choose)</>}
            </p>
          </div>
        </div>
        {error && <div className="payment-error">{error}</div>}
        {notice && <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', color: '#065f46', borderRadius: '8px', padding: '0.7rem 1rem', marginBottom: '1rem', fontSize: '0.85rem' }}>{notice}</div>}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          <button className="donate-btn" type="submit" disabled={saving} style={{ width: 'auto', padding: '0.7rem 1.8rem', opacity: saving ? 0.7 : 1 }}>{saving ? 'Saving…' : 'Save Settings'}</button>
          <button className="btn-outline" type="button" onClick={runTest} disabled={testing || !meta.apiKeySet}>{testing ? 'Testing…' : 'Test Connection'}</button>
        </div>
      </form>

      {testResult && !testResult.ok && <div className="payment-error">Failed: {testResult.message}</div>}
      {testResult && testResult.ok && (
        <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', borderRadius: '12px', padding: '1rem 1.2rem', fontSize: '0.85rem', color: '#065f46' }}>
          <strong>Groq is working.</strong> Model <code>{testResult.model}</code> replied “{testResult.reply}” in {testResult.ms} ms.
        </div>
      )}
      <p style={{ ...hint, marginTop: '1rem' }}>Email text you write is sent to Groq to generate drafts. Don't include sensitive personal details in the brief.</p>
    </div>
  );
};

// ─── Contacts (members & partners) ───────────────────────────────────────────
const ContactsTab = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [filter, setFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', organisation: '', type: 'member' });
  const [importText, setImportText] = useState('');
  const [importType, setImportType] = useState('member');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setRows(await adminFetch('/api/contacts')); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const json = (method, body) => ({ method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

  const add = async (e) => {
    e.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      await adminFetch('/api/contacts', json('POST', form));
      setForm({ name: '', email: '', organisation: '', type: form.type });
      setNotice('Contact added.'); await load();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  const doImport = async (e) => {
    e.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      // One per line: name, email, organisation (optional)  — comma or tab separated.
      const parsed = importText.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
        const [name, email, organisation] = l.split(/[,\t]/).map((x) => x.trim());
        return { name, email, organisation, type: importType };
      });
      const r = await adminFetch('/api/contacts/import', json('POST', { rows: parsed }));
      setNotice(`${r.added} added${r.skipped.length ? `, ${r.skipped.length} skipped: ${r.skipped.slice(0, 3).join(' · ')}${r.skipped.length > 3 ? ' …' : ''}` : '.'}`);
      if (r.added) setImportText('');
      await load();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  const toggleSub = async (c) => {
    try { await adminFetch(`/api/contacts/${c.id}`, json('PATCH', { is_subscribed: !c.is_subscribed })); await load(); }
    catch (err) { setError(err.message); }
  };
  const del = async (c) => {
    if (!window.confirm(`Remove ${c.name} (${c.email})?`)) return;
    try { await adminFetch(`/api/contacts/${c.id}`, { method: 'DELETE' }); await load(); }
    catch (err) { setError(err.message); }
  };

  const shown = rows.filter((c) => filter === 'all' || c.type === filter);
  const card = { background: 'white', border: '1px solid var(--gray-200)', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' };
  const typeSelect = (value, onChange) => (
    <select className="form-input" value={value} onChange={onChange}>
      <option value="member">Member</option><option value="partner">Partner</option><option value="other">Other</option>
    </select>
  );

  return (
    <div>
      <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--navy)', marginBottom: '0.4rem' }}>Contacts</h3>
      <p style={{ color: 'var(--gray-600)', fontSize: '0.88rem', marginBottom: '1.2rem' }}>
        Members and partners you can email from the <strong>Send Email</strong> tab. Donors are picked up automatically from donations.
        People who click “Unsubscribe” in an email appear here as unsubscribed and are skipped from then on.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem', alignItems: 'center' }}>
        <button className="btn-outline" onClick={() => { setShowAdd((v) => !v); setShowImport(false); }}>{showAdd ? 'Close' : '+ Add contact'}</button>
        <button className="btn-outline" onClick={() => { setShowImport((v) => !v); setShowAdd(false); }}>{showImport ? 'Close' : 'Import list'}</button>
        <select className="form-input" value={filter} onChange={(e) => setFilter(e.target.value)} style={{ width: 'auto' }}>
          <option value="all">All types</option><option value="member">Members</option><option value="partner">Partners</option><option value="donor">Unsubscribed donors</option><option value="other">Other</option>
        </select>
        <span style={{ fontSize: '0.78rem', color: 'var(--gray-600)' }}>{shown.length} contacts</span>
      </div>

      {showAdd && (
        <form onSubmit={add} style={card}>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Organisation (optional)</label><input className="form-input" value={form.organisation} onChange={(e) => setForm({ ...form, organisation: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Type</label>{typeSelect(form.type, (e) => setForm({ ...form, type: e.target.value }))}</div>
          </div>
          <button className="donate-btn" type="submit" disabled={busy} style={{ width: 'auto', padding: '0.7rem 1.8rem' }}>{busy ? 'Adding…' : 'Add'}</button>
        </form>
      )}

      {showImport && (
        <form onSubmit={doImport} style={card}>
          <div className="form-group">
            <label className="form-label">Paste one person per line: name, email, organisation (optional)</label>
            <textarea className="form-input" rows={6} value={importText} onChange={(e) => setImportText(e.target.value)} placeholder={'Jane Smith, jane@example.com, Smith Foundation\nRaj Patel, raj@example.com'} style={{ fontFamily: 'monospace', fontSize: '0.82rem' }} required />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ minWidth: 160 }}>{typeSelect(importType, (e) => setImportType(e.target.value))}</div>
            <button className="donate-btn" type="submit" disabled={busy} style={{ width: 'auto', padding: '0.7rem 1.8rem' }}>{busy ? 'Importing…' : 'Import'}</button>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.6rem' }}>Only import people who have agreed to hear from Headstart Education.</p>
        </form>
      )}

      {error && <div className="payment-error">{error}</div>}
      {notice && <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', color: '#065f46', borderRadius: '8px', padding: '0.7rem 1rem', marginBottom: '1rem', fontSize: '0.85rem' }}>{notice}</div>}
      {loading && <p style={{ color: 'var(--gray-600)' }}>Loading contacts…</p>}

      {!loading && (
        <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '16px', overflowX: 'auto' }}>
          <table className="admin-table" style={{ minWidth: 640 }}>
            <thead><tr><th>Name</th><th>Email</th><th>Organisation</th><th>Type</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {shown.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td><td>{c.email}</td><td>{c.organisation || '—'}</td>
                  <td style={{ textTransform: 'capitalize' }}>{c.type}</td>
                  <td><span className="admin-status" style={c.is_subscribed ? {} : { background: 'rgba(220,38,38,0.1)', color: '#b91c1c' }}>{c.is_subscribed ? 'Subscribed' : 'Unsubscribed'}</span></td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button type="button" onClick={() => toggleSub(c)} style={{ ...linkBtn('var(--teal)'), marginRight: '0.6rem' }}>{c.is_subscribed ? 'Unsubscribe' : 'Resubscribe'}</button>
                    <button type="button" onClick={() => del(c)} style={linkBtn('#dc2626')}>Remove</button>
                  </td>
                </tr>
              ))}
              {shown.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--gray-500)', padding: '2rem' }}>No contacts yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── Send Email (AI-drafted, sent through the system email) ──────────────────
const SendEmailTab = () => {
  const [info, setInfo] = useState(null);
  const [audience, setAudience] = useState('donors');
  const [brief, setBrief] = useState('');
  const [details, setDetails] = useState('');
  const [tone, setTone] = useState('warm and grateful');
  const [length, setLength] = useState('medium');
  const [signOff, setSignOff] = useState('The Headstart Education Team');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [aiDrafted, setAiDrafted] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [testTo, setTestTo] = useState('');
  const [testing, setTesting] = useState(false);
  const [sending, setSending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadInfo = useCallback(async () => {
    try { setInfo(await adminFetch('/api/mail/audiences')); } catch (err) { setError(err.message); }
  }, []);
  const loadHistory = useCallback(async () => {
    try { setHistory(await adminFetch('/api/mail/history')); } catch { /* ignore */ }
  }, []);
  useEffect(() => { loadInfo(); loadHistory(); }, [loadInfo, loadHistory]);

  // Poll while a send is in progress.
  const anySending = history.some((h) => h.status === 'sending');
  useEffect(() => {
    if (!anySending) return undefined;
    const t = setInterval(loadHistory, 3000);
    return () => clearInterval(t);
  }, [anySending, loadHistory]);

  const post = (path, payload) => adminFetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  const count = info?.counts?.[audience] ?? 0;

  const draft = async () => {
    setDrafting(true); setError(''); setNotice('');
    try {
      const d = await post('/api/mail/draft', { audience, brief, details, tone, length, signOff });
      setSubject(d.subject); setBody(d.body); setAiDrafted(true);
      setNotice(`Draft written by Groq (${d.model}). Read it carefully and edit anything before sending.`);
    } catch (err) { setError(err.message); }
    finally { setDrafting(false); }
  };

  const sendTest = async () => {
    setTesting(true); setError(''); setNotice('');
    try { await post('/api/mail/send', { audience, subject, body, testTo, aiDrafted }); setNotice(`Test email sent to ${testTo}. Check the inbox (and spam).`); }
    catch (err) { setError(err.message); }
    finally { setTesting(false); }
  };

  const sendAll = async () => {
    setSending(true); setError(''); setNotice('');
    try {
      const r = await post('/api/mail/send', { audience, subject, body, aiDrafted, expectedCount: count });
      setConfirmOpen(false);
      setNotice(`Sending to ${r.total} ${audience}… progress is shown under “Sent emails” below.`);
      await loadHistory();
    } catch (err) { setConfirmOpen(false); setError(err.message); await loadInfo(); }
    finally { setSending(false); }
  };

  const card = { background: 'white', border: '1px solid var(--gray-200)', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' };
  const hint = { fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.35rem' };
  const ready = subject.trim() && body.trim().length >= 20;

  return (
    <div>
      <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--navy)', marginBottom: '0.4rem' }}>Send Email</h3>
      <p style={{ color: 'var(--gray-600)', fontSize: '0.88rem', marginBottom: '1.2rem' }}>
        Describe what you want to say and Groq writes the email. You review and edit it, send yourself a test, then send it to
        donors, members or partners through the system email.
      </p>

      {info && !info.groqConfigured && <div className="payment-notice">AI drafting is off — a super admin needs to add the Groq API key in <strong>API Key Settings → Groq AI</strong>. You can still write an email by hand below.</div>}
      {info && !info.emailConfigured && <div className="payment-notice">System email is not set up — a super admin needs to complete <strong>API Key Settings → System Email</strong> before anything can be sent.</div>}

      <div style={card}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Who is it for?</label>
            <select className="form-input" value={audience} onChange={(e) => setAudience(e.target.value)}>
              <option value="donors">Donors ({info?.counts?.donors ?? '…'})</option>
              <option value="members">Members ({info?.counts?.members ?? '…'})</option>
              <option value="partners">Partners ({info?.counts?.partners ?? '…'})</option>
            </select>
            <p style={hint}>Subscribed people only. Manage members/partners in the Contacts tab.</p>
          </div>
          <div className="form-group">
            <label className="form-label">Sign-off name</label>
            <input className="form-input" value={signOff} onChange={(e) => setSignOff(e.target.value)} maxLength={120} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">What should the email say?</label>
          <textarea className="form-input" rows={3} value={brief} onChange={(e) => setBrief(e.target.value)} style={{ resize: 'vertical' }}
            placeholder="e.g. Thank donors for their support this quarter and let them know our first school project in Uttar Pradesh is progressing." />
        </div>
        <div className="form-group">
          <label className="form-label">Facts to include (optional)</label>
          <textarea className="form-input" rows={2} value={details} onChange={(e) => setDetails(e.target.value)} style={{ resize: 'vertical' }}
            placeholder="Real numbers, dates, links or news. The AI is told not to invent any." />
        </div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Tone</label>
            <select className="form-input" value={tone} onChange={(e) => setTone(e.target.value)}>{(info?.tones || [tone]).map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Length</label>
            <select className="form-input" value={length} onChange={(e) => setLength(e.target.value)}><option value="short">Short</option><option value="medium">Medium</option><option value="long">Long</option></select></div>
        </div>
        <button className="donate-btn" type="button" onClick={draft} disabled={drafting || !info?.groqConfigured || brief.trim().length < 10}
          style={{ width: 'auto', padding: '0.7rem 1.8rem', opacity: drafting ? 0.7 : 1 }}>
          {drafting ? '✨ Writing…' : (body ? '✨ Rewrite with Groq' : '✨ Write with Groq')}
        </button>
      </div>

      {error && <div className="payment-error">{error}</div>}
      {notice && <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid #10b981', color: '#065f46', borderRadius: '8px', padding: '0.7rem 1rem', marginBottom: '1rem', fontSize: '0.85rem' }}>{notice}</div>}

      <div style={card}>
        <h4 style={{ fontFamily: 'var(--font-display)', color: 'var(--navy)', marginBottom: '0.8rem' }}>Your email</h4>
        <div className="form-group">
          <label className="form-label">Subject</label>
          <input className="form-input" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} />
        </div>
        <div className="form-group">
          <label className="form-label">Message</label>
          <textarea className="form-input" rows={12} value={body} onChange={(e) => setBody(e.target.value)} style={{ resize: 'vertical', lineHeight: 1.6 }} />
          <p style={hint}><code>{'{{first_name}}'}</code>, <code>{'{{name}}'}</code> and <code>{'{{organisation}}'}</code> are filled in for each person. An unsubscribe link is added automatically.</p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--gray-200)' }}>
          <input className="form-input" type="email" value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="your email, for a test" style={{ maxWidth: 260 }} />
          <button className="btn-outline" type="button" onClick={sendTest} disabled={testing || !ready || !testTo || !info?.emailConfigured}>{testing ? 'Sending…' : 'Send test'}</button>
          <span style={{ flex: 1 }} />
          <button className="donate-btn" type="button" onClick={() => setConfirmOpen(true)} disabled={!ready || count === 0 || !info?.emailConfigured}
            style={{ width: 'auto', padding: '0.7rem 1.8rem' }}>
            Send to {count} {audience}
          </button>
        </div>
      </div>

      <h4 style={{ fontFamily: 'var(--font-display)', color: 'var(--navy)', marginBottom: '0.8rem' }}>Sent emails</h4>
      <div style={{ background: 'white', border: '1px solid var(--gray-200)', borderRadius: '16px', overflowX: 'auto' }}>
        <table className="admin-table" style={{ minWidth: 640 }}>
          <thead><tr><th>Date</th><th>Subject</th><th>To</th><th>Result</th><th>By</th></tr></thead>
          <tbody>
            {history.map((h) => (
              <tr key={h.id}>
                <td style={{ whiteSpace: 'nowrap' }}>{new Date(h.created_at).toLocaleString()}</td>
                <td>{h.subject}{h.ai_drafted && <span title="Drafted with AI" style={{ marginLeft: 6 }}>✨</span>}</td>
                <td style={{ textTransform: 'capitalize' }}>{h.audience}</td>
                <td>
                  <span className="admin-status">{h.status === 'sending' ? `Sending… ${h.sent_count + h.failed_count}/${h.total}` : h.status}</span>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)' }}>{h.sent_count} sent{h.failed_count ? `, ${h.failed_count} failed` : ''}</div>
                  {h.failed_count > 0 && h.last_error && <div style={{ fontSize: '0.72rem', color: '#b91c1c', maxWidth: 260 }}>{h.last_error}</div>}
                </td>
                <td>{h.sent_by}</td>
              </tr>
            ))}
            {history.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--gray-500)', padding: '2rem' }}>Nothing sent yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal open={confirmOpen} onClose={() => !sending && setConfirmOpen(false)} title="Send this email?" width={480}>
        <p style={{ color: 'var(--gray-700)', marginBottom: '0.6rem' }}>
          This will email <strong>{count} {audience}</strong> from your system email address. Emails can't be recalled once sent.
        </p>
        <div style={{ background: 'var(--gray-100)', borderRadius: 8, padding: '0.7rem 0.9rem', fontSize: '0.85rem', marginBottom: '1rem' }}>
          <strong>{subject}</strong>
          {aiDrafted && <div style={{ ...hint, marginTop: '0.3rem' }}>✨ Drafted with AI — make sure you've read it and every fact is correct.</div>}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="donate-btn" onClick={sendAll} disabled={sending} style={{ opacity: sending ? 0.7 : 1 }}>{sending ? 'Starting…' : `Yes, send to ${count}`}</button>
          <button className="btn-outline" onClick={() => setConfirmOpen(false)} disabled={sending}>Cancel</button>
        </div>
      </Modal>
    </div>
  );
};


// ─── API Key Settings (tiles: Square, Email, Groq) ───────────────────────────
// One place for every third-party credential. Each tile shows whether that
// service is set up; click a tile to edit it.
const ApiKeySettingsTab = ({ isSuperAdmin, role }) => {
  const [active, setActive] = useState('square');
  const [status, setStatus] = useState({});
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!isSuperAdmin) return;
    let cancelled = false;
    (async () => {
      const get = async (path) => { try { return await adminFetch(path); } catch { return null; } };
      const [sq, em, gq] = await Promise.all([get('/api/square/settings'), get('/api/email/settings'), get('/api/groq/settings')]);
      if (cancelled) return;
      setStatus({
        square: sq ? !!(sq.accessTokenSet && sq.locationId && sq.applicationId) : null,
        email:  em ? !!em.configured : null,
        groq:   gq ? !!gq.apiKeySet : null,
      });
    })();
    return () => { cancelled = true; };
  }, [isSuperAdmin, active, tick]);

  // Re-check every few seconds so a tile flips to "Configured" soon after you save.
  useEffect(() => {
    if (!isSuperAdmin) return undefined;
    const id = setInterval(() => setTick((n) => n + 1), 5000);
    return () => clearInterval(id);
  }, [isSuperAdmin]);

  if (!isSuperAdmin) {
    return (
      <div className="payment-notice">
        🔒 API Key Settings can only be changed by a <strong>Super Admin</strong>. You are logged in as <strong>{role}</strong>.
        Ask a Super Admin to set up Square, Email and Groq, or to change your role in the Users tab.
      </div>
    );
  }

  const tiles = [
    { id: 'square', icon: '💳', title: 'Square', desc: 'Take card donations: environment, Application ID, Location ID and access token.' },
    { id: 'email',  icon: '✉️', title: 'System Email', desc: 'SMTP server used for donor receipts, alerts and bulk emails.' },
    { id: 'groq',   icon: '✨', title: 'Groq AI', desc: 'API key and model used to draft emails to donors, members and partners.' },
  ];
  const badge = (ok) => ok === null || ok === undefined
    ? { text: 'Checking…', bg: 'var(--gray-100)', color: 'var(--gray-600)' }
    : ok ? { text: '● Configured', bg: 'rgba(16,185,129,0.12)', color: '#065f46' }
         : { text: '○ Not set up', bg: 'rgba(212,160,23,0.15)', color: '#8a6a0a' };

  return (
    <div>
      <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--navy)', marginBottom: '0.4rem' }}>API Key Settings</h3>
      <p style={{ color: 'var(--gray-600)', fontSize: '0.88rem', marginBottom: '1.2rem' }}>
        Credentials for the services this website uses. Secrets are stored encrypted and never shown again. Changes take effect immediately.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {tiles.map((t) => {
          const b = badge(status[t.id]);
          const on = active === t.id;
          return (
            <button key={t.id} type="button" onClick={() => setActive(t.id)}
              style={{ textAlign: 'left', cursor: 'pointer', background: on ? 'rgba(13,115,119,0.06)' : 'white', border: `2px solid ${on ? 'var(--teal)' : 'var(--gray-200)'}`,
                borderRadius: '16px', padding: '1.2rem', fontFamily: 'var(--font-body)', transition: 'all 0.15s' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '1.6rem' }}>{t.icon}</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: 100, background: b.bg, color: b.color }}>{b.text}</span>
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--navy)', fontSize: '1.05rem', marginBottom: '0.3rem' }}>{t.title}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--gray-600)', lineHeight: 1.5 }}>{t.desc}</div>
            </button>
          );
        })}
      </div>

      {active === 'square' && <SquareSettingsTab key="square" />}
      {active === 'email'  && <EmailSettingsTab key="email" />}
      {active === 'groq'   && <GroqSettingsTab key="groq" />}
    </div>
  );
};


// ─── Main Admin page ─────────────────────────────────────────────────────────
const AdminPage = () => {
  const [checkingSession, setCheckingSession] = useState(true);
  const [admin, setAdmin] = useState(null);
  const [tab, setTab] = useState('donations');
  const isSuperAdmin = admin?.role === 'superadmin';
  const canSendMail = ['superadmin', 'admin'].includes(admin?.role);
  const canEditProjects = ['superadmin', 'admin', 'editor'].includes(admin?.role);
  const [showPassword, setShowPassword] = useState(false);

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
          <p style={{ color: 'rgba(255,255,255,0.85)' }}>Manage donations, projects, users and payments for Headstart Education</p>
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
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn-outline" onClick={() => setShowPassword((v) => !v)}>{showPassword ? 'Close' : 'Change Password'}</button>
                <button className="btn-outline" onClick={handleLogout}>Logout</button>
              </div>
            </div>

            {showPassword && <ChangePasswordCard onDone={() => setShowPassword(false)} />}

            <div className="tabs">
              <div className={`tab${tab === 'donations' ? ' active' : ''}`} onClick={() => setTab('donations')}>Donations</div>
              <div className={`tab${tab === 'projects' ? ' active' : ''}`} onClick={() => setTab('projects')}>Projects</div>
              <div className={`tab${tab === 'images' ? ' active' : ''}`} onClick={() => setTab('images')}>Images</div>
              <div className={`tab${tab === 'apikeys' ? ' active' : ''}`} onClick={() => setTab('apikeys')}>API Key Settings</div>
              {canSendMail && <div className={`tab${tab === 'mail' ? ' active' : ''}`} onClick={() => setTab('mail')}>Send Email</div>}
              {canSendMail && <div className={`tab${tab === 'contacts' ? ' active' : ''}`} onClick={() => setTab('contacts')}>Contacts</div>}
              {isSuperAdmin && <div className={`tab${tab === 'users' ? ' active' : ''}`} onClick={() => setTab('users')}>Users</div>}
              {isSuperAdmin && <div className={`tab${tab === 'database' ? ' active' : ''}`} onClick={() => setTab('database')}>Database Tables</div>}
            </div>

            {tab === 'donations' && <DonationsTab />}
            {tab === 'projects' && <ProjectsTab canEdit={canEditProjects} />}
            {tab === 'images' && <ImagesTab canEdit={canEditProjects} />}
            {tab === 'apikeys' && <ApiKeySettingsTab isSuperAdmin={isSuperAdmin} role={admin.role} />}
            {tab === 'users' && isSuperAdmin && <UsersTab currentUsername={admin.username} />}
            {tab === 'mail' && canSendMail && <SendEmailTab />}
            {tab === 'contacts' && canSendMail && <ContactsTab />}
            {tab === 'database' && isSuperAdmin && <DatabaseTablesTab />}
          </div>
        </section>
      )}
    </div>
  );
};

export default AdminPage;
