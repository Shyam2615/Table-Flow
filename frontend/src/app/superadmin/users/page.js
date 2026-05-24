'use client';
import { useState, useEffect } from 'react';
import API from '@/lib/api';
import { useToast } from '@/components/Toast';

export default function SuperAdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'customer', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const { toast, showToast } = useToast();
  const [filter, setFilter] = useState('all');

  const loadUsers = async () => {
    const { data } = await API.get('/admin/users');
    return data;
  };

  useEffect(() => {
    loadUsers().then(data => setUsers(data)).catch(() => { }).finally(() => setLoading(false));
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', email: '', password: '', role: 'customer', phone: '' });
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditing(user);
    setForm({ name: user.name, email: user.email, password: '', role: user.role, phone: user.phone || '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      if (editing) {
        const payload = { name: form.name, email: form.email, role: form.role, phone: form.phone };
        if (form.password) payload.password = form.password;
        await API.put(`/admin/users/${editing._id}`, payload);
        showToast('User updated!');
      } else {
        await API.post('/admin/users', form);
        showToast('User created!');
      }
      setShowModal(false);
      const data = await loadUsers();
      setUsers(data);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this user permanently?')) return;
    try {
      await API.delete(`/admin/users/${id}`);
      showToast('User deleted');
      const data = await loadUsers();
      setUsers(data);
    } catch (err) {
      showToast('Delete failed', 'error');
    }
  };

  const toggleActive = async (user) => {
    try {
      await API.put(`/admin/users/${user._id}`, { isActive: !user.isActive });
      showToast(`User ${user.isActive ? 'deactivated' : 'activated'}`);
      const data = await loadUsers();
      setUsers(data);
    } catch (err) {
      showToast('Failed', 'error');
    }
  };

  const filtered = filter === 'all' ? users : users.filter(u => u.role === filter);

  const roleBadge = (role) => {
    const colors = { superadmin: 'badge-primary', owner: 'badge-info', customer: 'badge-neutral' };
    return <span className={`badge ${colors[role] || 'badge-neutral'}`}>{role}</span>;
  };

  return (
    <div className="fade-in">
      {toast}

      <div className="page-header-flex">
        <div>
          <h1 className="page-title">All Users</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{users.length} registered users on the platform</p>
        </div>
        <button onClick={openCreate} className="btn btn-primary">+ Create User</button>
      </div>

      {!loading && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {['all', 'superadmin', 'owner', 'customer'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
              style={{ textTransform: 'capitalize' }}>{f}</button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="loading"><div className="spinner"></div></div>
      ) : (
        <div className="table-container responsive-table">
          <table>
            <thead>
              <tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No users found</td></tr>
              ) : filtered.map(u => (
                <tr key={u._id}>
                  <td data-label="Name" style={{ fontWeight: 600 }}>{u.name}</td>
                  <td data-label="Email" style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td data-label="Phone">{u.phone || '—'}</td>
                  <td data-label="Role">{roleBadge(u.role)}</td>
                  <td data-label="Status">
                    <button onClick={() => toggleActive(u)}
                      className={`badge ${u.isActive !== false ? 'badge-success' : 'badge-danger'}`}
                      style={{ cursor: 'pointer', border: 'none' }}>
                      {u.isActive !== false ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td data-label="Joined" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td data-label="Actions">
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openEdit(u)} className="btn btn-ghost btn-sm" title="Edit">✏️</button>
                      <button onClick={() => handleDelete(u._id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} title="Delete">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h2>{editing ? 'Edit User' : 'Create User'}</h2>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost">✕</button>
            </div>
            <div className="modal-body">
              <div className="input-group">
                <label>Full Name</label>
                <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="John Doe" />
              </div>
              <div className="input-group">
                <label>Email</label>
                <input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="john@example.com" />
              </div>
              <div className="input-group">
                <label>Password {editing && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>(leave blank to keep)</span>}</label>
                <input className="input" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder={editing ? 'Leave blank to keep' : 'At least 6 characters'} />
              </div>
              <div className="grid-2">
                <div className="input-group">
                  <label>Role</label>
                  <select className="select" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                    <option value="customer">Customer</option>
                    <option value="owner">Restaurant Owner</option>
                    <option value="superadmin">Super Admin</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Phone (optional)</label>
                  <input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+1 234 567 890" />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleSave} className="btn btn-primary" disabled={submitting || !form.name || !form.email || (!editing && !form.password)}>
                {submitting ? 'Saving...' : editing ? 'Update User' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
