'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import API from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function RestaurantDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user, getAuthToken } = useAuth();
    const [restaurant, setRestaurant] = useState(null);
    const [menu, setMenu] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState([]);
    const [activeTab, setActiveTab] = useState('menu');
    const [tableNumber, setTableNumber] = useState('');
    const [orderNotes, setOrderNotes] = useState('');
    const [toast, setToast] = useState(null);

    useEffect(() => {
        Promise.all([
            API.get(`/restaurants/${id}`),
            API.get(`/menu/restaurant/${id}`)
        ]).then(([rRes, mRes]) => {
            setRestaurant(rRes.data);
            setMenu(mRes.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [id]);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const addToCart = (item) => {
        setCart(prev => {
            const existing = prev.find(c => c._id === item._id);
            if (existing) return prev.map(c => c._id === item._id ? { ...c, quantity: c.quantity + 1 } : c);
            return [...prev, { ...item, quantity: 1 }];
        });
        showToast(`${item.name} added to cart!`);
    };

    const updateQty = (itemId, delta) => {
        setCart(prev => prev.map(c => c._id === itemId ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c).filter(c => c.quantity > 0));
    };

    const cartTotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);

    const placeOrder = async () => {
        if (!user) return router.push('/login');
        if (!tableNumber) return showToast('Please select a table number', 'error');
        if (cart.length === 0) return showToast('Your cart is empty', 'error');
        try {
            const token = await getAuthToken();
            await API.post('/orders', {
                restaurantId: id,
                items: cart.map(c => ({ menuItemId: c._id, name: c.name, price: c.price, quantity: c.quantity })),
                tableNumber: parseInt(tableNumber),
                notes: orderNotes
            }, token ? { headers: { Authorization: `Bearer ${token}` } } : {});
            showToast('Order placed successfully! 🎉');
            setCart([]); setOrderNotes('');
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to place order', 'error');
        }
    };

    const categories = [...new Set(menu.map(m => m.category))];

    if (loading) return <div className="loading" style={{ minHeight: '60vh' }}><div className="spinner"></div> Loading...</div>;
    if (!restaurant) return <div className="empty-state" style={{ minHeight: '60vh' }}><h3>Restaurant not found</h3></div>;

    return (
        <div className="fade-in">
            {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}

            {/* Restaurant Header */}
            <div className="restaurant-header">
                <img src={restaurant.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200'}
                    alt={restaurant.name} className="restaurant-header-img" />
                <div className="restaurant-header-overlay" />
                <div className="container restaurant-header-content">
                    <h1 className="restaurant-header-title">{restaurant.name}</h1>
                    <div className="restaurant-header-meta">
                        <span className="rating">⭐ {restaurant.rating?.toFixed(1)}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{restaurant.totalReviews} reviews</span>
                        <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{restaurant.priceRange}</span>
                        <span style={{ color: 'var(--text-secondary)' }}>🕐 {restaurant.openingHours?.open} - {restaurant.openingHours?.close}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                        {restaurant.cuisine?.map((c, i) => <span key={i} className="badge badge-primary">{c}</span>)}
                    </div>
                </div>
            </div>

            <div className="container" style={{ padding: '32px' }}>
                {/* Tabs */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 32, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                    {['menu', 'info', 'book'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`btn btn-ghost ${activeTab === tab ? 'active' : ''}`}
                            style={activeTab === tab ? { color: 'var(--primary)', borderBottom: '2px solid var(--primary)', borderRadius: 0 } : {}}>
                            {tab === 'menu' ? '🍽️ Menu' : tab === 'info' ? 'ℹ️ Info' : '📅 Book Table'}
                        </button>
                    ))}
                </div>

                {activeTab === 'menu' && (
                    <div className="restaurant-page-grid">
                        {/* Menu Items */}
                        <div>
                            {categories.map(cat => (
                                <div key={cat} style={{ marginBottom: 32 }}>
                                    <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 16, color: 'var(--primary)' }}>{cat}</h2>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        {menu.filter(m => m.category === cat).map(item => (
                                            <div key={item._id} className="menu-item">
                                                <div className="item-info">
                                                    <h3>
                                                        <span className={item.isVeg ? 'veg-badge' : 'nonveg-badge'}></span>
                                                        {item.name}
                                                    </h3>
                                                    <p>{item.description}</p>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>⏱️ {item.preparationTime} min</span>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div className="item-price">₹{item.price}</div>
                                                    <button onClick={() => addToCart(item)} className="btn btn-primary btn-sm" style={{ marginTop: 8 }}>
                                                        + Add
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Cart Sidebar */}
                        <div className="cart-sidebar">
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 16 }}>🛒 Your Order</h3>
                            {cart.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No items yet</p>
                            ) : (
                                <>
                                    {cart.map(item => (
                                        <div key={item._id} className="cart-item">
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item.name}</div>
                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>₹{item.price} each</div>
                                            </div>
                                            <div className="item-qty">
                                                <button onClick={() => updateQty(item._id, -1)} className="qty-btn">-</button>
                                                <span style={{ fontWeight: 600 }}>{item.quantity}</span>
                                                <button onClick={() => updateQty(item._id, 1)} className="qty-btn">+</button>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="cart-total">
                                        <span>Total</span>
                                        <span style={{ color: 'var(--primary)' }}>₹{cartTotal}</span>
                                    </div>
                                    <div className="input-group">
                                        <label>Table Number</label>
                                        <select className="select" value={tableNumber} onChange={e => setTableNumber(e.target.value)}>
                                            <option value="">Select table</option>
                                            {restaurant.tables?.map(t => (
                                                <option key={t.tableNumber} value={t.tableNumber}>
                                                    Table {t.tableNumber} (Seats {t.capacity})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label>Notes (optional)</label>
                                        <textarea className="input" value={orderNotes} onChange={e => setOrderNotes(e.target.value)}
                                            placeholder="Special instructions..." rows={2} />
                                    </div>
                                    <button onClick={placeOrder} className="btn btn-primary" style={{ width: '100%' }}>
                                        Place Order — ₹{cartTotal}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'info' && (
                    <div className="card" style={{ maxWidth: 700 }}>
                        <div className="card-body">
                            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 16 }}>About</h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.8 }}>{restaurant.description}</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                <div><strong style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>ADDRESS</strong><p>{restaurant.address?.street}, {restaurant.address?.city}</p></div>
                                <div><strong style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>PHONE</strong><p>{restaurant.phone}</p></div>
                                <div><strong style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>EMAIL</strong><p>{restaurant.email}</p></div>
                                <div><strong style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>HOURS</strong><p>{restaurant.openingHours?.open} - {restaurant.openingHours?.close}</p></div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'book' && (
                    <BookingForm restaurant={restaurant} user={user} showToast={showToast} />
                )}
            </div>
        </div>
    );
}

function BookingForm({ restaurant, user, showToast }) {
    const router = useRouter();
    const { getAuthToken } = useAuth();
    const [form, setForm] = useState({ tableNumber: '', date: '', time: '', guests: 2, specialRequests: '' });
    const [submitting, setSubmitting] = useState(false);

    const handleBook = async (e) => {
        e.preventDefault();
        if (!user) return router.push('/login');
        if (!form.tableNumber || !form.date || !form.time) return showToast('Please fill all required fields', 'error');
        setSubmitting(true);
        try {
            const token = await getAuthToken();
            await API.post('/bookings', { ...form, restaurantId: restaurant._id, tableNumber: parseInt(form.tableNumber) },
                token ? { headers: { Authorization: `Bearer ${token}` } } : {});
            showToast('Table booked successfully! 🎉');
            setForm({ tableNumber: '', date: '', time: '', guests: 2, specialRequests: '' });
        } catch (err) {
            showToast(err.response?.data?.message || 'Booking failed', 'error');
        }
        setSubmitting(false);
    };

    return (
        <div style={{ maxWidth: 600 }}>
            <div className="card">
                <div className="card-body">
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 24 }}>Book a Table</h3>
                    <form onSubmit={handleBook}>
                        <div className="input-group">
                            <label>Select Table</label>
                            <div className="table-grid">
                                {restaurant.tables?.map(t => (
                                    <button type="button" key={t.tableNumber}
                                        onClick={() => t.isAvailable && setForm({ ...form, tableNumber: t.tableNumber.toString() })}
                                        className={`table-btn ${form.tableNumber === t.tableNumber.toString() ? 'selected' : ''} ${!t.isAvailable ? 'unavailable' : ''}`}>
                                        <div className="table-num">T{t.tableNumber}</div>
                                        <div className="table-cap">{t.capacity} seats</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="grid-2">
                            <div className="input-group">
                                <label>Date</label>
                                <input type="date" className="input" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
                            </div>
                            <div className="input-group">
                                <label>Time</label>
                                <input type="time" className="input" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} required />
                            </div>
                        </div>
                        <div className="input-group">
                            <label>Number of Guests</label>
                            <input type="number" className="input" min="1" max="20" value={form.guests}
                                onChange={e => setForm({ ...form, guests: parseInt(e.target.value) })} />
                        </div>
                        <div className="input-group">
                            <label>Special Requests</label>
                            <textarea className="input" value={form.specialRequests} onChange={e => setForm({ ...form, specialRequests: e.target.value })}
                                placeholder="Birthday celebration, high chair needed..." rows={3} />
                        </div>
                        <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={submitting}>
                            {submitting ? 'Booking...' : '📅 Confirm Booking'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
