'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import API from '@/lib/api';

export default function AdminBookings() {
  const { user } = useAuth();
  const [state, setState] = useState({
    bookings: [], loading: true, totalPages: 1, total: 0,
  });
  const [page, setPage] = useState(1);
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);

  const limit = 15;

  const loadData = useCallback(async (p) => {
    const { data: rest } = await API.get('/restaurants/owner/my-restaurant');
    const { data } = await API.get(
      `/bookings/restaurant/${rest._id}?date=${selectedDate}&page=${p}&limit=${limit}`
    );
    return data;
  }, [selectedDate]);

  useEffect(() => {
    let cancelled = false;
    loadData(page).then(data => {
      if (cancelled) return;
      setState({
        bookings: data.bookings ?? data ?? [], loading: false,
        totalPages: data.totalPages ?? 1, total: data.total ?? 0,
      });
    }).catch(() => {
      if (!cancelled) setState(s => ({ ...s, loading: false }));
    });
    return () => { cancelled = true; };
  }, [user, selectedDate, page, loadData]);

  const { bookings, loading, totalPages, total } = state;

  const updateStatus = async (id, status) => {
    await API.put(`/bookings/${id}`, { status });
    const data = await loadData(page);
    setState({
      bookings: data.bookings ?? data ?? [], loading: false,
      totalPages: data.totalPages ?? 1, total: data.total ?? 0,
    });
  };

  const getStatusBadge = (status) => {
    const map = { pending: 'badge-warning', confirmed: 'badge-success', cancelled: 'badge-danger', completed: 'badge-info' };
    return <span className={`badge ${map[status] || 'badge-neutral'}`}>{status}</span>;
  };

  return (
    <div className="fade-in">
      <div className="page-header" style={{ borderBottom: 'none' }}>
        <h1>Bookings</h1>
        <p>Manage table reservations</p>
      </div>

      {loading ? <div className="loading"><div className="spinner"></div></div> : (
        <>
          <div className="bookings-filter-bar">
            <span className="bookings-filter-label">📅 Filter by date</span>
            <div className="bookings-date-wrap">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => { setSelectedDate(e.target.value); setPage(1); }}
                className="bookings-date-input"
              />
              <span className="bookings-date-icon">📅</span>
            </div>
            {selectedDate !== today && (
              <button onClick={() => { setSelectedDate(today); setPage(1); }} className="bookings-today-btn">
                ◉ Today
              </button>
            )}
            <span className="bookings-count">
              {total} booking{total !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Desktop Table */}
          <div className="table-container bookings-table-desktop">
            <table>
              <thead>
                <tr>
                  <th>Guest</th>
                  <th>Contact</th>
                  <th>Date & Time</th>
                  <th>Table</th>
                  <th>Guests</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No bookings for this date</td></tr>
                ) : bookings.map(b => (
                  <tr key={b._id}>
                    <td style={{ fontWeight: 600 }}>{b.userId?.name || 'Guest'}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{b.userId?.email}<br />{b.userId?.phone}</td>
                    <td>{b.date}<br /><span style={{ color: 'var(--text-muted)' }}>{b.time}</span></td>
                    <td>T{b.tableNumber}</td>
                    <td>{b.guests}</td>
                    <td>{getStatusBadge(b.status)}</td>
                    <td>
                      {b.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => updateStatus(b._id, 'confirmed')} className="btn btn-success btn-sm">✓</button>
                          <button onClick={() => updateStatus(b._id, 'cancelled')} className="btn btn-danger btn-sm">✕</button>
                        </div>
                      )}
                      {b.status === 'confirmed' && (
                        <button onClick={() => updateStatus(b._id, 'completed')} className="btn btn-sm btn-secondary">Complete</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="bookings-cards-mobile">
            {bookings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No bookings for this date</div>
            ) : bookings.map(b => (
              <div key={b._id} className="card">
                <div className="card-body">
                  <div className="bookings-card-header">
                    <div>
                      <div className="bookings-card-name">{b.userId?.name || 'Guest'}</div>
                      <div className="bookings-card-contact">{b.userId?.email}{b.userId?.phone ? ` • ${b.userId.phone}` : ''}</div>
                    </div>
                    {getStatusBadge(b.status)}
                  </div>
                  <div className="bookings-card-details">
                    <span>📅 {b.date}</span>
                    <span>🕐 {b.time}</span>
                    <span>🪑 T{b.tableNumber}</span>
                    <span>👥 {b.guests}</span>
                  </div>
                  <div className="bookings-card-actions">
                    {b.status === 'pending' && (
                      <>
                        <button onClick={() => updateStatus(b._id, 'confirmed')} className="btn btn-success btn-sm">✓ Confirm</button>
                        <button onClick={() => updateStatus(b._id, 'cancelled')} className="btn btn-danger btn-sm">✕ Cancel</button>
                      </>
                    )}
                    {b.status === 'confirmed' && (
                      <button onClick={() => updateStatus(b._id, 'completed')} className="btn btn-sm btn-secondary">Complete</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

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