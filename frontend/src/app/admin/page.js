'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import API from '@/lib/api';
import { useToast } from '@/components/Toast';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast, showToast } = useToast();
  const [restaurant, setRestaurant] = useState(null);
  const [stats, setStats] = useState({ bookings: 0, orders: 0, revenue: 0, employees: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '', description: '', cuisine: '', phone: '', email: '',
    address: { street: '', city: '', state: '', zipCode: '' },
    priceRange: '$$', image: '',
  });
  const [creating, setCreating] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(false);
  const [editForm, setEditForm] = useState({});

  const loadData = async () => {
    const { data: rest } = await API.get('/restaurants/owner/my-restaurant');
    const [bookingsRes, ordersRes, employeesRes] = await Promise.all([
      API.get(`/bookings/restaurant/${rest._id}`),
      API.get(`/orders/restaurant/${rest._id}`),
      API.get(`/employees/restaurant/${rest._id}`),
    ]);
    const bookings = bookingsRes.data.bookings ?? bookingsRes.data ?? [];
    const orders = ordersRes.data.orders ?? ordersRes.data ?? [];
    return { rest, bookings, orders, employees: employeesRes.data };
  };

  useEffect(() => {
    if (user?.role !== 'owner') return;
    loadData().then((data) => {
      setRestaurant(data.rest);
      setRecentBookings(data.bookings.slice(0, 5));
      setRecentOrders(data.orders.slice(0, 5));
      const revenue = data.orders.reduce((s, o) => s + o.total, 0);
      setStats({ bookings: data.bookings.length, orders: data.orders.length, revenue, employees: data.employees.length });
    }).catch(() => setRestaurant(null)).finally(() => setLoading(false));
  }, [user]);

  const handleCreateRestaurant = async () => {
    setCreating(true);
    try {
      await API.post('/restaurants', createForm);
      showToast('Restaurant created successfully!');
      setShowCreateModal(false);
      setCreateForm({
        name: '', description: '', cuisine: '', phone: '', email: '',
        address: { street: '', city: '', state: '', zipCode: '' },
        priceRange: '$$', image: '',
      });
      const { rest, bookings, orders, employees } = await loadData();
      setRestaurant(rest);
      setRecentBookings(bookings.slice(0, 5));
      setRecentOrders(orders.slice(0, 5));
      const revenue = orders.reduce((s, o) => s + o.total, 0);
      setStats({ bookings: bookings.length, orders: orders.length, revenue, employees: employees.length });
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create restaurant', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateRestaurant = async () => {
    try {
      await API.put(`/restaurants/${restaurant._id}`, editForm);
      showToast('Restaurant updated!');
      setEditingRestaurant(false);
      const { rest, bookings, orders, employees } = await loadData();
      setRestaurant(rest);
      setRecentBookings(bookings.slice(0, 5));
      setRecentOrders(orders.slice(0, 5));
      const revenue = orders.reduce((s, o) => s + o.total, 0);
      setStats({ bookings: bookings.length, orders: orders.length, revenue, employees: employees.length });
    } catch (err) {
      showToast('Update failed', 'error');
    }
  };

  const openEditRestaurant = () => {
    setEditForm({
      name: restaurant.name,
      description: restaurant.description,
      cuisine: restaurant.cuisine?.join(', '),
      phone: restaurant.phone,
      email: restaurant.email,
      priceRange: restaurant.priceRange,
      address: restaurant.address || { street: '', city: '', state: '', zipCode: '' },
    });
    setEditingRestaurant(true);
  };

  const getStatusBadge = (status) => {
    const map = {
      pending: 'badge-warning', confirmed: 'badge-success',
      preparing: 'badge-info', ready: 'badge-primary',
      served: 'badge-success', completed: 'badge-success', cancelled: 'badge-danger',
    };
    return <span className={`badge ${map[status] || 'badge-neutral'}`}>{status}</span>;
  };

  if (loading) return <div className="loading" style={{ minHeight: '60vh' }}><div className="spinner"></div></div>;

  if (!restaurant) {
    return (
      <div className="fade-in" style={{ maxWidth: 600, margin: '0 auto', paddingTop: 60 }}>
        {toast}
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: 16 }}>🏪</div>
          <h2 style={{ marginBottom: 8 }}>Welcome to TableFlow!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>
            You don&apos;t have a restaurant yet. Create one to start managing bookings, orders, and staff.
          </p>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary btn-lg">
            + Create Your Restaurant
          </button>
        </div>

        {showCreateModal && (
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
              <div className="modal-header">
                <h2>Create Your Restaurant</h2>
                <button onClick={() => setShowCreateModal(false)} className="btn btn-ghost">✕</button>
              </div>
              <div className="modal-body">
                <div className="input-group">
                  <label>Restaurant Name</label>
                  <input className="input" value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} placeholder="e.g. Spice Garden" />
                </div>
                <div className="input-group">
                  <label>Description</label>
                  <textarea className="input" rows={3} value={createForm.description} onChange={e => setCreateForm({ ...createForm, description: e.target.value })} placeholder="Describe your restaurant..." />
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
                <div className="input-group">
                  <label>Street Address</label>
                  <input className="input" value={createForm.address.street} onChange={e => setCreateForm({ ...createForm, address: { ...createForm.address, street: e.target.value } })} />
                </div>
                <div className="grid-3">
                  <div className="input-group"><label>City</label><input className="input" value={createForm.address.city} onChange={e => setCreateForm({ ...createForm, address: { ...createForm.address, city: e.target.value } })} /></div>
                  <div className="input-group"><label>State</label><input className="input" value={createForm.address.state} onChange={e => setCreateForm({ ...createForm, address: { ...createForm.address, state: e.target.value } })} /></div>
                  <div className="input-group"><label>ZIP Code</label><input className="input" value={createForm.address.zipCode} onChange={e => setCreateForm({ ...createForm, address: { ...createForm.address, zipCode: e.target.value } })} /></div>
                </div>
                <div className="input-group">
                   <label>Image URL</label>
                   <input className="input" value={createForm.image} onChange={e => setCreateForm({ ...createForm, image: e.target.value })} placeholder="https://images.unsplash.com/..." />
                 </div>
               </div>
               <div className="modal-footer">
                 <button onClick={() => setShowCreateModal(false)} className="btn btn-secondary">Cancel</button>
                 <button onClick={handleCreateRestaurant} className="btn btn-primary" disabled={creating || !createForm.name}>
                   {creating ? 'Creating...' : 'Create Restaurant'}
                 </button>
               </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fade-in">
      {toast}

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(249,115,22,0.1), rgba(139,92,246,0.08))',
        borderRadius: 'var(--radius-lg)', padding: '28px 32px', marginBottom: 32,
        border: '1px solid rgba(249,115,22,0.2)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {restaurant.image && (
            <img src={restaurant.image} alt="" style={{ width: 64, height: 64, borderRadius: 'var(--radius-md)', objectFit: 'cover' }} />
          )}
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>{restaurant.name}</h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              {restaurant.cuisine?.join(' • ')} • {restaurant.address?.city || 'Location not set'} • ⭐ {restaurant.rating?.toFixed(1) || 'N/A'}
            </p>
          </div>
        </div>
        <button onClick={openEditRestaurant} className="btn btn-secondary btn-sm">✏️ Edit Details</button>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 32 }}>
        {[
          { icon: '📅', value: stats.bookings, label: 'Total Bookings', color: 'rgba(59,130,246,0.15)', link: '/admin/bookings' },
          { icon: '📦', value: stats.orders, label: 'Total Orders', color: 'rgba(249,115,22,0.15)', link: '/admin/orders' },
          { icon: '💰', value: `₹${stats.revenue.toLocaleString()}`, label: 'Revenue', color: 'rgba(34,197,94,0.15)' },
          { icon: '👥', value: stats.employees, label: 'Employees', color: 'rgba(139,92,246,0.15)', link: '/admin/employees' },
        ].map((s, i) => (
          <div key={i} className="stat-card" style={s.link ? { cursor: 'pointer' } : {}} onClick={() => s.link && window.open(s.link, '_self')}>
            <div className="stat-icon" style={{ background: s.color }}>{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid-2" style={{ marginBottom: 32 }}>
        <div className="table-container">
          <div style={{ padding: '20px 20px 12px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontWeight: 700 }}>Recent Orders</h3>
            <Link href="/admin/orders" className="btn btn-ghost btn-sm">View All</Link>
          </div>
          <table>
            <thead>
              <tr><th>Customer</th><th>Table</th><th>Total</th><th>Status</th></tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No orders yet</td></tr>
              ) : recentOrders.map(o => (
                <tr key={o._id}>
                  <td>{o.userId?.name || 'Guest'}</td>
                  <td>T{o.tableNumber}</td>
                  <td style={{ fontWeight: 600, color: 'var(--primary)' }}>₹{o.total}</td>
                  <td>{getStatusBadge(o.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="table-container">
          <div style={{ padding: '20px 20px 12px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontWeight: 700 }}>Recent Bookings</h3>
            <Link href="/admin/bookings" className="btn btn-ghost btn-sm">View All</Link>
          </div>
          <table>
            <thead>
              <tr><th>Guest</th><th>Date</th><th>Table</th><th>Status</th></tr>
            </thead>
            <tbody>
              {recentBookings.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No bookings yet</td></tr>
              ) : recentBookings.map(b => (
                <tr key={b._id}>
                  <td>{b.userId?.name || 'Guest'}</td>
                  <td>{b.date} {b.time}</td>
                  <td>T{b.tableNumber}</td>
                  <td>{getStatusBadge(b.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Links */}
      <div className="card">
        <div className="card-body" style={{ padding: 24 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Quick Management</h3>
           <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
             {[
               { href: '/admin/tables', icon: '🪑', label: 'Tables' },
               { href: '/admin/menu', icon: '🍽️', label: 'Menu' },
               { href: '/admin/bookings', icon: '📅', label: 'Bookings' },
               { href: '/admin/orders', icon: '📦', label: 'Orders' },
               { href: '/admin/employees', icon: '👥', label: 'Employees' },
               { href: '/admin/attendance', icon: '✅', label: 'Attendance' },
               { href: '/admin/leaves', icon: '🏖️', label: 'Leaves' },
               { href: '/admin/shifts', icon: '⏰', label: 'Shifts' },
               { href: '/admin/payroll', icon: '💰', label: 'Payroll' },
             ].map((l, i) => (
               <Link key={i} href={l.href} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                 <span>{l.icon}</span> {l.label}
               </Link>
             ))}
           </div>
        </div>
      </div>

      {/* Edit Restaurant Modal */}
      {editingRestaurant && (
        <div className="modal-overlay" onClick={() => setEditingRestaurant(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h2>Edit Restaurant</h2>
              <button onClick={() => setEditingRestaurant(false)} className="btn btn-ghost">✕</button>
            </div>
            <div className="modal-body">
              <div className="input-group"><label>Name</label><input className="input" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} /></div>
              <div className="input-group"><label>Description</label><textarea className="input" rows={3} value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} /></div>
              <div className="grid-2">
                <div className="input-group"><label>Cuisine</label><input className="input" value={editForm.cuisine} onChange={e => setEditForm({ ...editForm, cuisine: e.target.value })} /></div>
                <div className="input-group"><label>Price Range</label>
                  <select className="select" value={editForm.priceRange} onChange={e => setEditForm({ ...editForm, priceRange: e.target.value })}>
                    <option value="$">$</option><option value="$$">$$</option><option value="$$$">$$$</option><option value="$$$$">$$$$</option>
                  </select>
                </div>
              </div>
              <div className="grid-2">
                <div className="input-group"><label>Phone</label><input className="input" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} /></div>
                <div className="input-group"><label>Email</label><input className="input" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} /></div>
              </div>
              <div className="input-group"><label>Street</label><input className="input" value={editForm.address.street} onChange={e => setEditForm({ ...editForm, address: { ...editForm.address, street: e.target.value } })} /></div>
              <div className="grid-3">
                <div className="input-group"><label>City</label><input className="input" value={editForm.address.city} onChange={e => setEditForm({ ...editForm, address: { ...editForm.address, city: e.target.value } })} /></div>
                <div className="input-group"><label>State</label><input className="input" value={editForm.address.state} onChange={e => setEditForm({ ...editForm, address: { ...editForm.address, state: e.target.value } })} /></div>
               <div className="input-group"><label>ZIP</label><input className="input" value={editForm.address.zipCode} onChange={e => setEditForm({ ...editForm, address: { ...editForm.address, zipCode: e.target.value } })} /></div>
             </div>
             <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 16 }}>
               To manage tables, visit the <Link href="/admin/tables" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Table Management</Link> page.
             </p>
              </div>
              <div className="modal-footer">
                <button onClick={() => setEditingRestaurant(false)} className="btn btn-secondary">Cancel</button>
                <button onClick={handleUpdateRestaurant} className="btn btn-primary">Update Restaurant</button>
              </div>
          </div>
        </div>
      )}

      {/* Create Restaurant Modal (shown when user wants to create after deleting, or if somehow none exists) */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h2>Create Your Restaurant</h2>
              <button onClick={() => setShowCreateModal(false)} className="btn btn-ghost">✕</button>
            </div>
            <div className="modal-body">
              <div className="input-group"><label>Restaurant Name</label><input className="input" value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} /></div>
              <div className="input-group"><label>Description</label><textarea className="input" rows={3} value={createForm.description} onChange={e => setCreateForm({ ...createForm, description: e.target.value })} /></div>
              <div className="grid-2">
                <div className="input-group"><label>Cuisine</label><input className="input" value={createForm.cuisine} onChange={e => setCreateForm({ ...createForm, cuisine: e.target.value })} /></div>
                <div className="input-group"><label>Price Range</label>
                  <select className="select" value={createForm.priceRange} onChange={e => setCreateForm({ ...createForm, priceRange: e.target.value })}>
                    <option value="$">$</option><option value="$$">$$</option><option value="$$$">$$$</option><option value="$$$$">$$$$</option>
                  </select>
                </div>
              </div>
              <div className="grid-2">
                <div className="input-group"><label>Phone</label><input className="input" value={createForm.phone} onChange={e => setCreateForm({ ...createForm, phone: e.target.value })} /></div>
                <div className="input-group"><label>Email</label><input className="input" value={createForm.email} onChange={e => setCreateForm({ ...createForm, email: e.target.value })} /></div>
              </div>
              <div className="input-group"><label>Street</label><input className="input" value={createForm.address.street} onChange={e => setCreateForm({ ...createForm, address: { ...createForm.address, street: e.target.value } })} /></div>
              <div className="grid-3">
                <div className="input-group"><label>City</label><input className="input" value={createForm.address.city} onChange={e => setCreateForm({ ...createForm, address: { ...createForm.address, city: e.target.value } })} /></div>
                <div className="input-group"><label>State</label><input className="input" value={createForm.address.state} onChange={e => setCreateForm({ ...createForm, address: { ...createForm.address, state: e.target.value } })} /></div>
                <div className="input-group"><label>ZIP</label><input className="input" value={createForm.address.zipCode} onChange={e => setCreateForm({ ...createForm, address: { ...createForm.address, zipCode: e.target.value } })} /></div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowCreateModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleCreateRestaurant} className="btn btn-primary" disabled={creating || !createForm.name}>
                {creating ? 'Creating...' : 'Create Restaurant'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
