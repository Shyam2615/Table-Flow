'use client';
import { useState, useEffect } from 'react';
import API from '@/lib/api';

export default function SuperAdminOwners() {
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const loadData = async () => {
    const { data } = await API.get('/admin/owners');
    return data;
  };

  useEffect(() => {
    loadData().then(data => setOwners(data)).catch(() => { }).finally(() => setLoading(false));
  }, []);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const toggleActive = async (id, isActive) => {
    await API.put(`/admin/users/${id}`, { isActive: !isActive });
    showToast(`Owner ${!isActive ? 'activated' : 'deactivated'}`);
    const data = await loadData();
    setOwners(data);
  };

  return (
    <div className="fade-in">
      {toast && <div className={`toast toast-${toast.type}`} onClick={() => setToast(null)}>{toast.msg}</div>}
      <div className="page-header" style={{ borderBottom: 'none' }}>
        <h1>Restaurant Owners</h1>
        <p>Manage restaurant owners on the platform</p>
      </div>

      {loading ? <div className="loading"><div className="spinner"></div></div> : (
        <div className="table-container responsive-table">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Joined</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {owners.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No owners yet</td></tr>
              ) : owners.map(owner => (
                <tr key={owner._id}>
                  <td data-label="Name" style={{ fontWeight: 600 }}>{owner.name}</td>
                  <td data-label="Email">{owner.email}</td>
                  <td data-label="Phone">{owner.phone}</td>
                  <td data-label="Joined" style={{ color: 'var(--text-secondary)' }}>{new Date(owner.createdAt).toLocaleDateString()}</td>
                  <td data-label="Status"><span className={`badge ${owner.isActive ? 'badge-success' : 'badge-danger'}`}>{owner.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td data-label="Actions">
                    <button onClick={() => toggleActive(owner._id, owner.isActive)} className={`btn btn-sm ${owner.isActive ? 'btn-danger' : 'btn-success'}`}>
                      {owner.isActive ? 'Deactivate' : 'Activate'}
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
}
