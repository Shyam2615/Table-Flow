'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import API from '@/lib/api';
import { useToast } from '@/components/Toast';

export default function AdminWaiters() {
  const { user } = useAuth();
  const { toast, showToast } = useToast();
  const [state, setState] = useState({
    waiters: [], loading: true,
  });
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (user?.role !== 'owner') return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await API.get('/auth/waiters');
        if (!cancelled) setState({ waiters: data, loading: false });
      } catch {
        if (!cancelled) setState(s => ({ ...s, loading: false }));
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const { waiters, loading } = state;

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) return;
    setCreating(true);
    try {
      await API.post('/auth/register-waiter', form);
      showToast(`Waiter "${form.name}" created successfully!`);
      setShowModal(false);
      setForm({ name: '', email: '', password: '', phone: '' });
      const { data } = await API.get('/auth/waiters');
      setState({ waiters: data, loading: false });
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create waiter', 'error');
    } finally {
      setCreating(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      await API.put(`/auth/waiters/${id}/toggle`);
      showToast(currentStatus ? 'Waiter deactivated' : 'Waiter activated');
      const { data } = await API.get('/auth/waiters');
      setState({ waiters: data, loading: false });
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  return (
    <div className="fade-in">
      {toast}
      <div className="page-header" style={{ borderBottom: 'none' }}>
        <h1>Waiters</h1>
        <p>Manage waiter accounts for your restaurant</p>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner"></div></div>
      ) : (
        <>
          <div style={{ marginBottom: 20 }}>
            <button onClick={() => setShowModal(true)} className="btn btn-primary">
              + Add Waiter
            </button>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {waiters.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No waiters created yet</td></tr>
                ) : waiters.map(w => (
                  <tr key={w._id}>
                    <td style={{ fontWeight: 600 }}>{w.name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{w.email}</td>
                    <td>{w.phone || '—'}</td>
                    <td>
                      <span className={`badge ${w.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {w.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {new Date(w.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <button
                        onClick={() => toggleStatus(w._id, w.isActive)}
                        className={`btn btn-sm ${w.isActive ? 'btn-danger' : 'btn-success'}`}
                      >
                        {w.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h2>Add Waiter</h2>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost">✕</button>
            </div>
            <div className="modal-body">
              <div className="input-group">
                <label>Full Name</label>
                <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Waiter name" />
              </div>
              <div className="input-group">
                <label>Email</label>
                <input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="waiter@restaurant.com" />
              </div>
              <div className="input-group">
                <label>Password</label>
                <input className="input" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Set a password" />
              </div>
              <div className="input-group">
                <label>Phone (optional)</label>
                <input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Phone number" />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
              <button
                onClick={handleCreate}
                className="btn btn-primary"
                disabled={creating || !form.name || !form.email || !form.password}
              >
                {creating ? 'Creating...' : 'Create Waiter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}