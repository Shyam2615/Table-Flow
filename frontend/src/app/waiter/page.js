'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import API from '@/lib/api';

export default function WaiterDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!user?.restaurantId) return;
    let cancelled = false;
    Promise.all([
      API.get(`/restaurants/${user.restaurantId}`),
      API.get(`/orders/restaurant/${user.restaurantId}?date=${today}`),
    ]).then(([restRes, ordersRes]) => {
      if (cancelled) return;
      setRestaurant(restRes.data);
      const ords = ordersRes.data.orders ?? ordersRes.data ?? [];
      setOrders(ords);
    }).catch(() => {}).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [user, today]);

  const activeOrders = orders.filter(o => !['completed', 'cancelled'].includes(o.status));
  const occupiedTables = [...new Set(activeOrders.map(o => o.tableNumber))];

  if (loading) return <div className="loading" style={{ minHeight: '60vh' }}><div className="spinner"></div></div>;

  return (
    <div className="fade-in">
      <div className="page-header" style={{ borderBottom: 'none' }}>
        <h1>Waiter Dashboard</h1>
        <p>{restaurant?.name || 'Restaurant'} • {today}</p>
      </div>

      <div className="grid-4" style={{ marginBottom: 32 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.15)' }}>🪑</div>
          <div className="stat-value">{occupiedTables.length}</div>
          <div className="stat-label">Occupied Tables</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(249,115,22,0.15)' }}>📋</div>
          <div className="stat-value">{activeOrders.length}</div>
          <div className="stat-label">Active Orders</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(34,197,94,0.15)' }}>✅</div>
          <div className="stat-value">{orders.filter(o => o.status === 'completed').length}</div>
          <div className="stat-label">Completed Today</div>
        </div>
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => window.open('/waiter/orders/new', '_self')}>
          <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.15)' }}>➕</div>
          <div className="stat-value" style={{ color: 'var(--primary)' }}>New Order</div>
          <div className="stat-label">Place an order</div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 32 }}>
        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontWeight: 700 }}>Active Orders by Table</h3>
              <Link href="/waiter/orders" className="btn btn-ghost btn-sm">View All</Link>
            </div>
            {activeOrders.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 24 }}>No active orders</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[...new Set(activeOrders.map(o => o.tableNumber))].sort().map(tn => {
                  const tableOrders = activeOrders.filter(o => o.tableNumber === tn);
                  return (
                    <div key={tn} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 14px', background: 'var(--bg)', borderRadius: '8px',
                    }}>
                      <div>
                        <span style={{ fontWeight: 700 }}>Table {tn}</span>
                        <span style={{ color: 'var(--text-muted)', marginLeft: 8, fontSize: '0.85rem' }}>
                          {tableOrders.length} order{tableOrders.length > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {tableOrders.map(o => (
                          <span key={o._id} className={`badge ${
                            o.status === 'pending' ? 'badge-warning' :
                            o.status === 'preparing' ? 'badge-info' :
                            o.status === 'ready' ? 'badge-primary' :
                            'badge-success'
                          }`}>{o.status}</span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link href="/waiter/orders/new" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                ➕ New Order
              </Link>
              <Link href="/waiter/orders" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                📋 View Orders
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}