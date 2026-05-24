'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import API from '@/lib/api';

export default function MyOrdersPage() {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            API.get('/orders/my-orders').then(res => { setOrders(res.data); setLoading(false); }).catch(() => setLoading(false));
        }
    }, [user]);

    const getStatusBadge = (status) => {
        const map = { pending: 'badge-warning', preparing: 'badge-info', ready: 'badge-primary', served: 'badge-success', completed: 'badge-success', cancelled: 'badge-danger' };
        return <span className={`badge ${map[status] || 'badge-neutral'}`}>{status}</span>;
    };

    if (!user) return <div className="auth-page"><div className="auth-card"><h2>Please login to view orders</h2></div></div>;

    return (
        <div className="container fade-in" style={{ padding: '48px 32px' }}>
            <div className="page-header">
                <h1>My Orders</h1>
                <p>Track your food orders</p>
            </div>

            {loading ? (
                <div className="loading"><div className="spinner"></div> Loading...</div>
            ) : orders.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">🍕</div>
                    <h3>No orders yet</h3>
                    <p>Order delicious food from any restaurant!</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {orders.map(o => (
                        <div key={o._id} className="card">
                            <div className="card-body">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>
                                            {o.restaurantId?.name || 'Restaurant'}
                                        </h3>
                                        <div style={{ display: 'flex', gap: 16, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                            <span>🪑 Table {o.tableNumber}</span>
                                            <span>📅 {new Date(o.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        {getStatusBadge(o.status)}
                                        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)', marginTop: 4 }}>₹{o.total}</div>
                                    </div>
                                </div>
                                <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', padding: 16 }}>
                                    {o.items.map((item, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < o.items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                                            <span>{item.name} × {item.quantity}</span>
                                            <span style={{ color: 'var(--text-secondary)' }}>₹{item.price * item.quantity}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
