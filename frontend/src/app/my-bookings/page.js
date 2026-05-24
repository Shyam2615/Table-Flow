'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import API from '@/lib/api';

export default function MyBookingsPage() {
    const { user } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            API.get('/bookings/my-bookings').then(res => { setBookings(res.data); setLoading(false); }).catch(() => setLoading(false));
        }
    }, [user]);

    const cancelBooking = async (id) => {
        try {
            await API.put(`/bookings/${id}/cancel`);
            setBookings(prev => prev.map(b => b._id === id ? { ...b, status: 'cancelled' } : b));
        } catch (err) { console.error(err); }
    };

    const getStatusBadge = (status) => {
        const map = { pending: 'badge-warning', confirmed: 'badge-success', cancelled: 'badge-danger', completed: 'badge-info' };
        return <span className={`badge ${map[status] || 'badge-neutral'}`}>{status}</span>;
    };

    if (!user) return <div className="auth-page"><div className="auth-card"><h2>Please login to view bookings</h2></div></div>;

    return (
        <div className="container fade-in" style={{ padding: '48px 32px' }}>
            <div className="page-header">
                <h1>My Bookings</h1>
                <p>View and manage your table reservations</p>
            </div>

            {loading ? (
                <div className="loading"><div className="spinner"></div> Loading...</div>
            ) : bookings.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📅</div>
                    <h3>No bookings yet</h3>
                    <p>Book a table at your favorite restaurant!</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {bookings.map(b => (
                        <div key={b._id} className="card">
                            <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>
                                        {b.restaurantId?.name || 'Restaurant'}
                                    </h3>
                                    <div style={{ display: 'flex', gap: 20, color: 'var(--text-secondary)', fontSize: '0.9rem', flexWrap: 'wrap' }}>
                                        <span>📅 {b.date}</span>
                                        <span>🕐 {b.time}</span>
                                        <span>🪑 Table {b.tableNumber}</span>
                                        <span>👥 {b.guests} guests</span>
                                    </div>
                                    {b.specialRequests && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 8 }}>📝 {b.specialRequests}</p>}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    {getStatusBadge(b.status)}
                                    {(b.status === 'pending' || b.status === 'confirmed') && (
                                        <button onClick={() => cancelBooking(b._id)} className="btn btn-danger btn-sm">Cancel</button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
