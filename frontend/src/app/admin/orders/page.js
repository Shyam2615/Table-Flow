'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import API from '@/lib/api';

export default function AdminOrders() {
  const { user } = useAuth();
  const [state, setState] = useState({
    orders: [], loading: true, totalPages: 1, total: 0,
  });
  const [page, setPage] = useState(1);
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);

  const limit = 15;

  const loadData = useCallback(async (p) => {
    const { data: rest } = await API.get('/restaurants/owner/my-restaurant');
    const { data } = await API.get(
      `/orders/restaurant/${rest._id}?date=${selectedDate}&page=${p}&limit=${limit}`
    );
    return data;
  }, [selectedDate]);

  useEffect(() => {
    let cancelled = false;
    loadData(page).then(data => {
      if (cancelled) return;
      setState({
        orders: data.orders ?? data ?? [], loading: false,
        totalPages: data.totalPages ?? 1, total: data.total ?? 0,
      });
    }).catch(() => {
      if (!cancelled) setState(s => ({ ...s, loading: false }));
    });
    return () => { cancelled = true; };
  }, [user, selectedDate, page, loadData]);

  const { orders, loading, totalPages, total } = state;

  const updateStatus = async (id, status) => {
    await API.put(`/orders/${id}`, { status });
    const data = await loadData(page);
    setState({
      orders: data.orders ?? data ?? [], loading: false,
      totalPages: data.totalPages ?? 1, total: data.total ?? 0,
    });
  };

  const statusFlow = ['pending', 'preparing', 'ready', 'served', 'completed'];
  const getStatusBadge = (status) => {
    const map = { pending: 'badge-warning', preparing: 'badge-info', ready: 'badge-primary', served: 'badge-success', completed: 'badge-success', cancelled: 'badge-danger' };
    return <span className={`badge ${map[status] || 'badge-neutral'}`}>{status}</span>;
  };

  const getNextStatus = (status) => {
    const idx = statusFlow.indexOf(status);
    return idx >= 0 && idx < statusFlow.length - 1 ? statusFlow[idx + 1] : null;
  };

  return (
    <div className="fade-in">
      <div className="page-header" style={{ borderBottom: 'none' }}>
        <h1>Orders</h1>
        <p>Track and manage food orders</p>
      </div>

      {loading ? <div className="loading"><div className="spinner"></div></div> : (
        <>
          <div style={{
            background: 'var(--surface)',
            border: '2px solid var(--border)',
            borderRadius: '12px',
            padding: '14px 20px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            flexWrap: 'wrap',
          }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>📅 Filter by date</span>
            <div style={{ position: 'relative', minWidth: 170 }}>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => { setSelectedDate(e.target.value); setPage(1); }}
                style={{
                  padding: '8px 12px 8px 30px',
                  border: '1.5px solid var(--border)',
                  borderRadius: '8px',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: '0.85rem',
                  width: '100%',
                  boxSizing: 'border-box',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              />
              <span style={{
                position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                fontSize: '0.78rem', pointerEvents: 'none', opacity: 0.5,
              }}>📅</span>
            </div>
            {selectedDate !== today && (
              <button
                onClick={() => { setSelectedDate(today); setPage(1); }}
                style={{
                  padding: '6px 12px',
                  background: 'transparent',
                  color: 'var(--primary)',
                  border: '1.5px solid var(--primary)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.78rem',
                }}
              >
                ◉ Today
              </button>
            )}
            <span style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {total} order{total !== 1 ? 's' : ''}
            </span>
          </div>

          {orders.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">📦</div><h3>No orders for this date</h3></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {orders.map(o => (
                <div key={o._id} className="card">
                  <div className="card-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12, flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontWeight: 700 }}>Order #{o._id.slice(-6)}</span>
                          {getStatusBadge(o.status)}
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                          {o.userId?.name} • Table {o.tableNumber} • {new Date(o.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)' }}>₹{o.total}</span>
                        {getNextStatus(o.status) && (
                          <button onClick={() => updateStatus(o._id, getNextStatus(o.status))} className="btn btn-primary btn-sm">
                            → {getNextStatus(o.status)}
                          </button>
                        )}
                      </div>
                    </div>
                    <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', padding: 12 }}>
                      {o.items.map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                          <span>{item.name} × {item.quantity}</span>
                          <span style={{ color: 'var(--text-muted)' }}>₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                    {o.notes && <p style={{ marginTop: 8, fontSize: '0.9rem', color: 'var(--text-muted)' }}>📝 {o.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div style={{
              display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 20,
            }}>
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                style={{
                  padding: '8px 14px',
                  border: '1.5px solid var(--border)',
                  borderRadius: '8px',
                  background: page <= 1 ? 'var(--bg)' : 'var(--surface)',
                  color: page <= 1 ? 'var(--text-muted)' : 'var(--text)',
                  cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                }}
              >
                ← Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    width: 36, height: 36,
                    border: p === page ? 'none' : '1.5px solid var(--border)',
                    borderRadius: '8px',
                    background: p === page ? 'var(--primary)' : 'var(--surface)',
                    color: p === page ? '#fff' : 'var(--text)',
                    cursor: 'pointer',
                    fontWeight: p === page ? 700 : 500,
                    fontSize: '0.85rem',
                  }}
                >
                  {p}
                </button>
              ))}

              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                style={{
                  padding: '8px 14px',
                  border: '1.5px solid var(--border)',
                  borderRadius: '8px',
                  background: page >= totalPages ? 'var(--bg)' : 'var(--surface)',
                  color: page >= totalPages ? 'var(--text-muted)' : 'var(--text)',
                  cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                }}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}