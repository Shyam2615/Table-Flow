'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import API from '@/lib/api';

export default function WaiterOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active');

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!user?.restaurantId) return;
    let cancelled = false;
    API.get(`/orders/restaurant/${user.restaurantId}?date=${today}`).then(({ data }) => {
      if (cancelled) return;
      setOrders(data.orders ?? data ?? []);
    }).catch(() => {}).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [user, today]);

  const updateStatus = async (id, status) => {
    await API.put(`/orders/${id}`, { status });
    const { data } = await API.get(`/orders/restaurant/${user.restaurantId}?date=${today}`);
    setOrders(data.orders ?? data ?? []);
  };

  const activeStatuses = ['pending', 'preparing', 'ready', 'served'];
  const filteredOrders = filter === 'active'
    ? orders.filter(o => activeStatuses.includes(o.status))
    : filter === 'completed'
    ? orders.filter(o => o.status === 'completed')
    : orders;

  const getStatusBadge = (status) => {
    const map = { pending: 'badge-warning', preparing: 'badge-info', ready: 'badge-primary', served: 'badge-success', completed: 'badge-success', cancelled: 'badge-danger' };
    return <span className={`badge ${map[status] || 'badge-neutral'}`}>{status}</span>;
  };

  if (loading) return <div className="loading" style={{ minHeight: '60vh' }}><div className="spinner"></div></div>;

  return (
    <div className="fade-in">
      <div className="page-header" style={{ borderBottom: 'none' }}>
        <h1>Orders</h1>
        <p>Manage active orders and update status</p>
      </div>

      <div style={{
        background: 'var(--surface)',
        border: '2px solid var(--border)',
        borderRadius: '12px',
        padding: '12px 16px',
        marginBottom: 20,
        display: 'flex',
        gap: 8,
      }}>
        {[
          { key: 'active', label: 'Active' },
          { key: 'completed', label: 'Completed' },
          { key: 'all', label: 'All Today' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: '6px 16px',
              border: 'none',
              borderRadius: '8px',
              background: filter === f.key ? 'var(--primary)' : 'var(--bg)',
              color: filter === f.key ? '#fff' : 'var(--text)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
            }}
          >{f.label}</button>
        ))}
        <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.85rem', alignSelf: 'center' }}>
          {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
        </span>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">📋</div><h3>No orders</h3></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filteredOrders.map(o => (
            <div key={o._id} className="card">
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontWeight: 700 }}>Table {o.tableNumber}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>#{o._id.slice(-6)}</span>
                    {getStatusBadge(o.status)}
                  </div>
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>₹{o.total}</span>
                </div>

                <div style={{ background: 'var(--bg)', borderRadius: '8px', padding: 10, marginBottom: 10 }}>
                  {o.items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '0.9rem' }}>
                      <span>{item.name} <span style={{ color: 'var(--text-muted)' }}>×{item.quantity}</span></span>
                      <span style={{ color: 'var(--text-muted)' }}>₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                {o.notes && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 10 }}>📝 {o.notes}</p>
                )}

                {activeStatuses.includes(o.status) && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {o.status === 'pending' && (
                      <button onClick={() => updateStatus(o._id, 'preparing')} className="btn btn-primary btn-sm">→ Preparing</button>
                    )}
                    {o.status === 'preparing' && (
                      <button onClick={() => updateStatus(o._id, 'ready')} className="btn btn-primary btn-sm">→ Ready</button>
                    )}
                    {o.status === 'ready' && (
                      <button onClick={() => updateStatus(o._id, 'served')} className="btn btn-primary btn-sm">→ Served</button>
                    )}
                    {o.status === 'served' && (
                      <button onClick={() => updateStatus(o._id, 'completed')} className="btn btn-success btn-sm">✓ Complete</button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}