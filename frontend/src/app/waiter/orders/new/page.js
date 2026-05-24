'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import API from '@/lib/api';

export default function NewOrder() {
  const { user } = useAuth();
  const router = useRouter();
  const [menuItems, setMenuItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState('');
  const [category, setCategory] = useState('all');
  const [cart, setCart] = useState([]);
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);

  const filteredItems = menuItems.filter(m => category === 'all' || m.category === category);
  const categories = [...new Set(menuItems.map(m => m.category))];
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  useEffect(() => {
    if (!user?.restaurantId) return;
    let cancelled = false;
    Promise.all([
      API.get(`/menu/restaurant/${user.restaurantId}`),
      API.get(`/restaurants/${user.restaurantId}`),
    ]).then(([menuRes, restRes]) => {
      if (cancelled) return;
      setMenuItems(menuRes.data);
      setTables(restRes.data.tables || []);
    }).catch(() => {}).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [user]);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i._id === item._id);
      if (existing) {
        return prev.map(i => i._id === item._id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { _id: item._id, name: item.name, price: item.price, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => {
      const updated = prev.map(i => i._id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i);
      return updated.filter(i => i.qty > 0);
    });
  };

  const placeOrder = async () => {
    if (!selectedTable || cart.length === 0) return;
    setPlacing(true);
    try {
      const items = cart.map(i => ({
        menuItemId: i._id,
        name: i.name,
        price: i.price,
        quantity: i.qty,
      }));
      await API.post('/orders', {
        restaurantId: user.restaurantId,
        tableNumber: parseInt(selectedTable),
        items,
        notes,
      });
      router.push('/waiter/orders');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  if (loading) return <div className="loading" style={{ minHeight: '60vh' }}><div className="spinner"></div></div>;

  return (
    <div className="fade-in">
      <div className="page-header" style={{ borderBottom: 'none' }}>
        <h1>New Order</h1>
        <p>Select table and items to place an order</p>
      </div>

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
        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>🪑 Table</span>
        <select
          value={selectedTable}
          onChange={e => setSelectedTable(e.target.value)}
          className="select"
          style={{ minWidth: 140 }}
        >
          <option value="">Select table...</option>
          {tables.map(t => (
            <option key={t.tableNumber} value={t.tableNumber}>Table {t.tableNumber} ({t.capacity} seats)</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
        {/* Menu */}
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <button
              onClick={() => setCategory('all')}
              style={{
                padding: '6px 14px', border: 'none', borderRadius: '8px',
                background: category === 'all' ? 'var(--primary)' : 'var(--bg)',
                color: category === 'all' ? '#fff' : 'var(--text)',
                cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
              }}
            >All</button>
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                style={{
                  padding: '6px 14px', border: 'none', borderRadius: '8px',
                  background: category === c ? 'var(--primary)' : 'var(--bg)',
                  color: category === c ? '#fff' : 'var(--text)',
                  cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
                }}
              >{c}</button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {filteredItems.map(item => (
              <div
                key={item._id}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 8,
                }}
                onClick={() => addToCart(item)}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                    {item.isVeg ? (
                      <span style={{ color: '#22c55e', marginRight: 4 }}>🟢</span>
                    ) : (
                      <span style={{ color: '#ef4444', marginRight: 4 }}>🔴</span>
                    )}
                    {item.name}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: 2 }}>
                    {item.description?.slice(0, 50)}{item.description?.length > 50 ? '...' : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <div style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{item.price}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>+ Add</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cart */}
        <div style={{
          background: 'var(--surface)',
          border: '2px solid var(--border)',
          borderRadius: '12px',
          padding: '16px',
          position: 'sticky',
          top: 16,
          alignSelf: 'start',
          maxHeight: 'calc(100vh - 200px)',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <h3 style={{ fontWeight: 700, marginBottom: 12 }}>🛒 Order Summary</h3>

          {cart.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 24, fontSize: '0.9rem' }}>
              Click items from the menu to add them
            </p>
          ) : (
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: 12 }}>
              {cart.map(item => (
                <div key={item._id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 0', borderBottom: '1px solid var(--border)',
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: '0.85rem' }}>{item.name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>₹{item.price} each</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      onClick={() => updateQty(item._id, -1)}
                      style={{
                        width: 26, height: 26, borderRadius: '50%', border: '1px solid var(--border)',
                        background: 'var(--bg)', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >−</button>
                    <span style={{ fontWeight: 600, minWidth: 20, textAlign: 'center' }}>{item.qty}</span>
                    <button
                      onClick={() => updateQty(item._id, 1)}
                      style={{
                        width: 26, height: 26, borderRadius: '50%', border: 'none',
                        background: 'var(--primary)', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >+</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <textarea
            placeholder="Order notes..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="input"
            rows={2}
            style={{ width: '100%', boxSizing: 'border-box', marginBottom: 12, resize: 'none' }}
          />

          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 0', borderTop: '2px solid var(--border)',
            fontWeight: 700, fontSize: '1.1rem',
          }}>
            <span>Total</span>
            <span style={{ color: 'var(--primary)' }}>₹{cartTotal}</span>
          </div>

          <button
            onClick={placeOrder}
            disabled={!selectedTable || cart.length === 0 || placing}
            className="btn btn-primary"
            style={{
              width: '100%', marginTop: 12, padding: '12px',
              opacity: (!selectedTable || cart.length === 0 || placing) ? 0.6 : 1,
            }}
          >
            {placing ? 'Placing Order...' : 'Place Order →'}
          </button>
        </div>
      </div>
    </div>
  );
}