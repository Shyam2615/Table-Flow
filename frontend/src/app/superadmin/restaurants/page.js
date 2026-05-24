'use client';
import { useState, useEffect } from 'react';
import API from '@/lib/api';

export default function SuperAdminRestaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [tableActionLoading, setTableActionLoading] = useState(false);

  const [createForm, setCreateForm] = useState({
    name: '', description: '', cuisine: '', phone: '', email: '',
    address: { street: '', city: '', state: '', zipCode: '' },
    priceRange: '$$', image: '', ownerId: '', tableCount: 5,
  });

  const [editForm, setEditForm] = useState({
    name: '', description: '', cuisine: '', phone: '', email: '',
    address: { street: '', city: '', state: '', zipCode: '' },
    priceRange: '$$', image: '', tableCount: 0,
  });

  const loadData = async () => {
    const [restRes, ownerRes] = await Promise.all([
      API.get('/admin/restaurants'),
      API.get('/admin/owners'),
    ]);
    return { restaurants: restRes.data, owners: ownerRes.data };
  };

  useEffect(() => {
    loadData().then((data) => { setRestaurants(data.restaurants); setOwners(data.owners); }).catch(() => { }).finally(() => setLoading(false));
  }, []);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const toggleApproval = async (id, isApproved) => {
    await API.put(`/admin/restaurants/${id}`, { isApproved: !isApproved });
    showToast(`Restaurant ${!isApproved ? 'approved' : 'unapproved'}`);
    const data = await loadData();
    setRestaurants(data.restaurants);
  };

  const toggleActive = async (id, isActive) => {
    await API.put(`/admin/restaurants/${id}`, { isActive: !isActive });
    showToast(`Restaurant ${!isActive ? 'activated' : 'suspended'}`);
    const data = await loadData();
    setRestaurants(data.restaurants);
  };

  const openEdit = (r) => {
    setEditingRestaurant(r);
    setEditForm({
      name: r.name || '',
      description: r.description || '',
      cuisine: (r.cuisine || []).join(', '),
      phone: r.phone || '',
      email: r.email || '',
      address: {
        street: r.address?.street || '',
        city: r.address?.city || '',
        state: r.address?.state || '',
        zipCode: r.address?.zipCode || '',
      },
      priceRange: r.priceRange || '$$',
      image: r.image || '',
      tableCount: r.tables?.length || 0,
    });
    setShowEditModal(true);
  };

  const handleEditSave = async () => {
    if (!editForm.name) return;
    setSaving(true);
    try {
      const cuisineArray = editForm.cuisine.split(',').map(s => s.trim()).filter(Boolean);
      await API.put(`/admin/restaurants/${editingRestaurant._id}`, {
        name: editForm.name,
        description: editForm.description,
        cuisine: cuisineArray,
        phone: editForm.phone,
        email: editForm.email,
        address: editForm.address,
        priceRange: editForm.priceRange,
        image: editForm.image,
      });
      showToast('Restaurant updated!');
      setShowEditModal(false);
      setEditingRestaurant(null);
      const data = await loadData();
      setRestaurants(data.restaurants);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTableCountChange = async (delta) => {
    if (!editingRestaurant || tableActionLoading) return;
    const newCount = editForm.tableCount + delta;
    if (newCount < 1 || newCount > 100) return;
    setTableActionLoading(true);
    try {
      await API.post(`/tables/${editingRestaurant._id}/set-count`, { count: newCount });
      setEditForm(prev => ({ ...prev, tableCount: newCount }));
      showToast(`Table count set to ${newCount}`);
      const data = await loadData();
      setRestaurants(data.restaurants);
      const updated = data.restaurants.find(r => r._id === editingRestaurant._id);
      if (updated) setEditingRestaurant(updated);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update table count', 'error');
    } finally {
      setTableActionLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!createForm.name || !createForm.ownerId) return;
    setCreating(true);
    try {
      const cuisineArray = createForm.cuisine.split(',').map(s => s.trim()).filter(Boolean);
      const restaurantData = {
        ...createForm,
        cuisine: cuisineArray,
        tables: Array.from({ length: createForm.tableCount }, (_, i) => ({
          tableNumber: i + 1,
          tableName: `Table ${i + 1}`,
          capacity: 4,
          positionX: (i % 4) * 150 + 50,
          positionY: Math.floor(i / 4) * 150 + 50,
          isAvailable: true
        }))
      };
      delete restaurantData.tableCount;

      await API.post('/admin/restaurants', restaurantData);
      showToast('Restaurant created!');
      setShowCreateModal(false);
      setCreateForm({ name: '', description: '', cuisine: '', phone: '', email: '', address: { street: '', city: '', state: '', zipCode: '' }, priceRange: '$$', image: '', ownerId: '', tableCount: 5 });
      const data = await loadData();
      setRestaurants(data.restaurants);
      setOwners(data.owners);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed', 'error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fade-in">
      {toast && <div className={`toast toast-${toast.type}`} onClick={() => setToast(null)}>{toast.msg}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>All Restaurants</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage all restaurants on the platform</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">+ Create Restaurant</button>
      </div>

      {loading ? <div className="loading"><div className="spinner"></div></div> : (
        <div className="table-container">
          <table>
            <thead><tr><th>Restaurant</th><th>Owner</th><th>Cuisine</th><th>Tables</th><th>Rating</th><th>Approved</th><th>Active</th><th>Actions</th></tr></thead>
            <tbody>
              {restaurants.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No restaurants yet</td></tr>
              ) : restaurants.map(r => (
                <tr key={r._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <img src={r.image || 'https://via.placeholder.com/40'} alt="" style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />
                      <div>
                        <div style={{ fontWeight: 600 }}>{r.name}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{r.address?.city}</div>
                      </div>
                    </div>
                  </td>
                  <td>{r.ownerId?.name || 'N/A'}<br /><span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{r.ownerId?.email}</span></td>
                  <td>{r.cuisine?.join(', ')}</td>
                  <td><span className="badge badge-info">{r.tables?.length || 0}</span></td>
                  <td><span className="rating">⭐ {r.rating?.toFixed(1)}</span></td>
                  <td><span className={`badge ${r.isApproved ? 'badge-success' : 'badge-warning'}`}>{r.isApproved ? 'Yes' : 'No'}</span></td>
                  <td><span className={`badge ${r.isActive ? 'badge-success' : 'badge-danger'}`}>{r.isActive ? 'Active' : 'Suspended'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button onClick={() => openEdit(r)} className="btn btn-sm btn-primary" title="Edit restaurant info & tables">Edit</button>
                      <button onClick={() => toggleApproval(r._id, r.isApproved)} className={`btn btn-sm ${r.isApproved ? 'btn-secondary' : 'btn-success'}`}>
                        {r.isApproved ? 'Unapprove' : 'Approve'}
                      </button>
                      <button onClick={() => toggleActive(r._id, r.isActive)} className={`btn btn-sm ${r.isActive ? 'btn-danger' : 'btn-success'}`}>
                        {r.isActive ? 'Suspend' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h2>Create Restaurant</h2>
              <button onClick={() => setShowCreateModal(false)} className="btn btn-ghost">✕</button>
            </div>
            <div className="modal-body">
              <div className="input-group">
                <label>Owner</label>
                <select className="select" value={createForm.ownerId} onChange={e => setCreateForm({ ...createForm, ownerId: e.target.value })} required>
                  <option value="">— Select an owner —</option>
                  {owners.map(o => (
                    <option key={o._id} value={o._id}>{o.name} ({o.email})</option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label>Restaurant Name</label>
                <input className="input" value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} placeholder="e.g. Spice Garden" />
              </div>
              <div className="input-group">
                <label>Description</label>
                <textarea className="input" rows={2} value={createForm.description} onChange={e => setCreateForm({ ...createForm, description: e.target.value })} placeholder="Describe the restaurant..." />
              </div>
              <div className="grid-2">
                <div className="input-group">
                  <label>Cuisine (comma separated)</label>
                  <input className="input" value={createForm.cuisine} onChange={e => setCreateForm({ ...createForm, cuisine: e.target.value })} placeholder="Indian, Chinese" />
                </div>
                <div className="input-group">
                  <label>Price Range</label>
                  <select className="select" value={createForm.priceRange} onChange={e => setCreateForm({ ...createForm, priceRange: e.target.value })}>
                    <option value="$">$ - Budget</option>
                    <option value="$$">$$ - Moderate</option>
                    <option value="$$$">$$$ - Premium</option>
                    <option value="$$$$">$$$$ - Luxury</option>
                  </select>
                </div>
              </div>
              <div className="grid-2">
                <div className="input-group"><label>Phone</label><input className="input" value={createForm.phone} onChange={e => setCreateForm({ ...createForm, phone: e.target.value })} /></div>
                <div className="input-group"><label>Email</label><input className="input" type="email" value={createForm.email} onChange={e => setCreateForm({ ...createForm, email: e.target.value })} /></div>
              </div>
              <div className="input-group"><label>Street</label><input className="input" value={createForm.address.street} onChange={e => setCreateForm({ ...createForm, address: { ...createForm.address, street: e.target.value } })} /></div>
              <div className="grid-3">
                <div className="input-group"><label>City</label><input className="input" value={createForm.address.city} onChange={e => setCreateForm({ ...createForm, address: { ...createForm.address, city: e.target.value } })} /></div>
                <div className="input-group"><label>State</label><input className="input" value={createForm.address.state} onChange={e => setCreateForm({ ...createForm, address: { ...createForm.address, state: e.target.value } })} /></div>
                <div className="input-group"><label>ZIP</label><input className="input" value={createForm.address.zipCode} onChange={e => setCreateForm({ ...createForm, address: { ...createForm.address, zipCode: e.target.value } })} /></div>
              </div>
              <div className="input-group"><label>Image URL</label><input className="input" value={createForm.image} onChange={e => setCreateForm({ ...createForm, image: e.target.value })} placeholder="https://images.unsplash.com/..." /></div>

               <div className="input-group" style={{ marginTop: 16 }}>
                 <label>Number of Tables</label>
                 <input
                   className="input"
                   type="number"
                   min="1"
                   max="50"
                   value={createForm.tableCount}
                   onChange={e => setCreateForm({ ...createForm, tableCount: Math.max(1, parseInt(e.target.value) || 1) })}
                   placeholder="e.g. 10"
                 />
                 <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 6 }}>
                   Restaurant will be created with {createForm.tableCount} table(s). Owners can customize table names, capacity, and layout later.
                 </p>
               </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowCreateModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleCreate} className="btn btn-primary" disabled={creating || !createForm.name || !createForm.ownerId}>
                {creating ? 'Creating...' : 'Create Restaurant'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingRestaurant && (
        <div className="modal-overlay" onClick={() => { setShowEditModal(false); setEditingRestaurant(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h2>Edit Restaurant: {editingRestaurant.name}</h2>
              <button onClick={() => { setShowEditModal(false); setEditingRestaurant(null); }} className="btn btn-ghost">✕</button>
            </div>
            <div className="modal-body">
              <div className="input-group">
                <label>Restaurant Name</label>
                <input className="input" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div className="input-group">
                <label>Description</label>
                <textarea className="input" rows={2} value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
              </div>
              <div className="grid-2">
                <div className="input-group">
                  <label>Cuisine (comma separated)</label>
                  <input className="input" value={editForm.cuisine} onChange={e => setEditForm({ ...editForm, cuisine: e.target.value })} placeholder="Indian, Chinese" />
                </div>
                <div className="input-group">
                  <label>Price Range</label>
                  <select className="select" value={editForm.priceRange} onChange={e => setEditForm({ ...editForm, priceRange: e.target.value })}>
                    <option value="$">$ - Budget</option>
                    <option value="$$">$$ - Moderate</option>
                    <option value="$$$">$$$ - Premium</option>
                    <option value="$$$$">$$$$ - Luxury</option>
                  </select>
                </div>
              </div>
              <div className="grid-2">
                <div className="input-group"><label>Phone</label><input className="input" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} /></div>
                <div className="input-group"><label>Email</label><input className="input" type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} /></div>
              </div>
              <div className="input-group"><label>Street</label><input className="input" value={editForm.address.street} onChange={e => setEditForm({ ...editForm, address: { ...editForm.address, street: e.target.value } })} /></div>
              <div className="grid-3">
                <div className="input-group"><label>City</label><input className="input" value={editForm.address.city} onChange={e => setEditForm({ ...editForm, address: { ...editForm.address, city: e.target.value } })} /></div>
                <div className="input-group"><label>State</label><input className="input" value={editForm.address.state} onChange={e => setEditForm({ ...editForm, address: { ...editForm.address, state: e.target.value } })} /></div>
                <div className="input-group"><label>ZIP</label><input className="input" value={editForm.address.zipCode} onChange={e => setEditForm({ ...editForm, address: { ...editForm.address, zipCode: e.target.value } })} /></div>
              </div>
              <div className="input-group"><label>Image URL</label><input className="input" value={editForm.image} onChange={e => setEditForm({ ...editForm, image: e.target.value })} /></div>

              <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '1rem', marginBottom: 12 }}>Table Count</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <button
                    onClick={() => handleTableCountChange(-1)}
                    disabled={editForm.tableCount <= 1 || tableActionLoading}
                    style={{
                      width: 44, height: 44, borderRadius: 10, border: '2px solid var(--border)',
                      background: 'var(--surface)', fontSize: '1.5rem', fontWeight: 700,
                      cursor: editForm.tableCount > 1 ? 'pointer' : 'not-allowed',
                      opacity: editForm.tableCount > 1 ? 1 : 0.4,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s',
                    }}
                  >−</button>
                  <div style={{
                    minWidth: 60, textAlign: 'center',
                    fontSize: '2rem', fontWeight: 800, color: 'var(--primary)',
                  }}>
                    {editForm.tableCount}
                  </div>
                  <button
                    onClick={() => handleTableCountChange(1)}
                    disabled={editForm.tableCount >= 100 || tableActionLoading}
                    style={{
                      width: 44, height: 44, borderRadius: 10, border: '2px solid var(--border)',
                      background: 'var(--surface)', fontSize: '1.5rem', fontWeight: 700,
                      cursor: editForm.tableCount < 100 ? 'pointer' : 'not-allowed',
                      opacity: editForm.tableCount < 100 ? 1 : 0.4,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s',
                    }}
                  >+</button>
                  {tableActionLoading && <div className="spinner" style={{ width: 24, height: 24 }}></div>}
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 8 }}>
                  Adding tables creates new ones with capacity 4. Removing tables deletes from the end.
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => { setShowEditModal(false); setEditingRestaurant(null); }} className="btn btn-secondary">Cancel</button>
              <button onClick={handleEditSave} className="btn btn-primary" disabled={saving || !editForm.name}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
