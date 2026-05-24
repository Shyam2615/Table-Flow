'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import API from '@/lib/api';

export default function MenuManagement() {
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [restaurant, setRestaurant] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', description: '', price: '', category: '', isVeg: false, spiceLevel: 'medium', preparationTime: 15 });
    const [toast, setToast] = useState(null);

    const loadData = async () => {
        const { data: rest } = await API.get('/restaurants/owner/my-restaurant');
        const { data } = await API.get(`/menu/restaurant/${rest._id}`);
        return { restaurant: rest, items: data };
    };

    useEffect(() => {
        loadData().then((data) => { setRestaurant(data.restaurant); setItems(data.items); }).catch(() => {});
    }, [user]);

    const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

    const openAdd = () => {
        setEditing(null);
        setForm({
            name: '',
            description: '',
            price: '',
            category: '',
            isVeg: false,
            spiceLevel: 'medium',
            preparationTime: 15
        });
        setShowModal(true);
    };

    const openEdit = (item) => {
        setEditing(item);
        setForm({ name: item.name, description: item.description, price: item.price, category: item.category, isVeg: item.isVeg, spiceLevel: item.spiceLevel, preparationTime: item.preparationTime });
        setShowModal(true);
    };

    const handleSave = async () => {
        try {
            if (editing) {
                await API.put(`/menu/${editing._id}`, form);
                showToast('Menu item updated!');
            } else {
                await API.post('/menu', { ...form, restaurantId: restaurant._id }); // ← fixed
                showToast('Menu item added!');
            }
            setShowModal(false);
            const data = await loadData();
            setRestaurant(data.restaurant); setItems(data.items);
        } catch (err) { showToast(err.response?.data?.message || 'Failed', 'error'); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this item?')) return;
        try {
            await API.delete(`/menu/${id}`);
            showToast('Item deleted');
            const data = await loadData();
            setRestaurant(data.restaurant); setItems(data.items);
        } catch (err) { showToast('Delete failed', 'error'); }
    };

    const toggleAvailability = async (item) => {
        await API.put(`/menu/${item._id}`, { isAvailable: !item.isAvailable });
        const data = await loadData();
        setRestaurant(data.restaurant); setItems(data.items);
    };

    const categories = [...new Set(items.map(i => i.category))];

    return (
        <div className="fade-in">
            {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Menu Management</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>{items.length} items in your menu</p>
                </div>
                <button onClick={openAdd} className="btn btn-primary">+ Add Item</button>
            </div>

            {categories.map(cat => (
                <div key={cat} style={{ marginBottom: 32 }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 16, color: 'var(--primary)' }}>{cat}</h2>
                    <div className="table-container">
                        <table>
                            <thead><tr><th>Item</th><th>Price</th><th>Type</th><th>Time</th><th>Status</th><th>Actions</th></tr></thead>
                            <tbody>
                                {items.filter(i => i.category === cat).map(item => (
                                    <tr key={item._id}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{item.name}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{item.description?.slice(0, 50)}...</div>
                                        </td>
                                        <td style={{ fontWeight: 600, color: 'var(--primary)' }}>₹{item.price}</td>
                                        <td><span className={item.isVeg ? 'veg-badge' : 'nonveg-badge'}></span></td>
                                        <td>{item.preparationTime}m</td>
                                        <td>
                                            <button onClick={() => toggleAvailability(item)} className={`badge ${item.isAvailable ? 'badge-success' : 'badge-danger'}`} style={{ cursor: 'pointer', border: 'none' }}>
                                                {item.isAvailable ? 'Available' : 'Unavailable'}
                                            </button>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button onClick={() => openEdit(item)} className="btn btn-ghost btn-sm">✏️</button>
                                                <button onClick={() => handleDelete(item._id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}>🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editing ? 'Edit Item' : 'Add Menu Item'}</h2>
                            <button onClick={() => setShowModal(false)} className="btn btn-ghost">✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="input-group"><label>Name</label><input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                            <div className="input-group"><label>Description</label><textarea className="input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} /></div>
                            <div className="grid-2">
                                <div className="input-group"><label>Price (₹)</label><input type="number" className="input" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></div>
                                <div className="input-group"><label>Category</label><input className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g. Main Course" /></div>
                            </div>
                            <div className="grid-2">
                                <div className="input-group"><label>Spice Level</label>
                                    <select className="select" value={form.spiceLevel} onChange={e => setForm({ ...form, spiceLevel: e.target.value })}>
                                        <option value="mild">Mild</option><option value="medium">Medium</option><option value="hot">Hot</option><option value="extra-hot">Extra Hot</option>
                                    </select>
                                </div>
                                <div className="input-group"><label>Prep Time (min)</label><input type="number" className="input" value={form.preparationTime} onChange={e => setForm({ ...form, preparationTime: e.target.value })} /></div>
                            </div>
                            <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <input type="checkbox" checked={form.isVeg} onChange={e => setForm({ ...form, isVeg: e.target.checked })} id="isVeg" />
                                <label htmlFor="isVeg" style={{ margin: 0 }}>Vegetarian</label>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                            <button onClick={handleSave} className="btn btn-primary">{editing ? 'Update' : 'Add Item'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
