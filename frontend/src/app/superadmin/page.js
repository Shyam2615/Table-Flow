'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import API from '@/lib/api';

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({});
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentRestaurants, setRecentRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      API.get('/admin/stats'),
      API.get('/admin/users'),
      API.get('/admin/restaurants'),
    ]).then(([statsRes, usersRes, restRes]) => {
      setStats(statsRes.data);
      setRecentUsers(usersRes.data.slice(-5).reverse());
      setRecentRestaurants(restRes.data.slice(-5).reverse());
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading" style={{ minHeight: '60vh' }}><div className="spinner"></div></div>;

  const statCards = [
    { icon: '🏪', value: stats.totalRestaurants || 0, label: 'Total Restaurants', sub: `${stats.activeRestaurants || 0} active`, color: 'rgba(59,130,246,0.15)', accent: '#3b82f6' },
    { icon: '👥', value: stats.totalUsers || 0, label: 'Total Users', sub: `${stats.totalOwners || 0} owners`, color: 'rgba(139,92,246,0.15)', accent: '#8b5cf6' },
    { icon: '📅', value: stats.totalBookings || 0, label: 'Total Bookings', color: 'rgba(34,197,94,0.15)', accent: '#22c55e' },
    { icon: '📦', value: stats.totalOrders || 0, label: 'Total Orders', color: 'rgba(249,115,22,0.15)', accent: '#f97316' },
  ];

  return (
    <div className="fade-in">
      <div className="page-header" style={{ borderBottom: 'none', paddingBottom: 16 }}>
        <h1>Platform Dashboard</h1>
        <p>Overview of the entire TableFlow platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid-4" style={{ marginBottom: 32 }}>
        {statCards.map((s, i) => (
          <div key={i} className="stat-card" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{
              position: 'absolute', top: -20, right: -20, width: 80, height: 80,
              borderRadius: '50%', background: s.color, opacity: 0.5,
            }} />
            <div className="stat-icon" style={{ background: s.color }}>{s.icon}</div>
            <div className="stat-value" style={{ color: s.accent }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
            {s.sub && <div style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: 4 }}>{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* Revenue + Quick Actions */}
      <div className="grid-2" style={{ marginBottom: 32 }}>
        <div className="card">
          <div className="card-body" style={{ padding: 28, textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>💰</div>
            <div className="stat-value" style={{ color: 'var(--success)', fontSize: '2.5rem' }}>
              ₹{(stats.totalRevenue || 0).toLocaleString()}
            </div>
            <div className="stat-label" style={{ fontSize: '1rem' }}>Total Platform Revenue</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body" style={{ padding: 28 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 20 }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Link href="/superadmin/users" className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '14px 20px' }}>
                <span style={{ fontSize: '1.2rem' }}>👥</span> Manage Users
              </Link>
              <Link href="/superadmin/restaurants" className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '14px 20px' }}>
                <span style={{ fontSize: '1.2rem' }}>🏪</span> Manage Restaurants
              </Link>
              <Link href="/superadmin/owners" className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '14px 20px' }}>
                <span style={{ fontSize: '1.2rem' }}>👤</span> Manage Owners
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid-2">
        <div className="table-container">
          <div style={{ padding: '20px 20px 12px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontWeight: 700 }}>Recent Users</h3>
            <Link href="/superadmin/users" className="btn btn-ghost btn-sm">View All</Link>
          </div>
          <table>
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th></tr>
            </thead>
            <tbody>
              {recentUsers.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No users yet</td></tr>
              ) : recentUsers.map(u => (
                <tr key={u._id}>
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{u.email}</td>
                  <td><span className={`badge ${u.role === 'superadmin' ? 'badge-primary' : u.role === 'owner' ? 'badge-info' : 'badge-neutral'}`}>{u.role}</span></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="table-container">
          <div style={{ padding: '20px 20px 12px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontWeight: 700 }}>Recent Restaurants</h3>
            <Link href="/superadmin/restaurants" className="btn btn-ghost btn-sm">View All</Link>
          </div>
          <table>
            <thead>
              <tr><th>Restaurant</th><th>Owner</th><th>Status</th><th>Rating</th></tr>
            </thead>
            <tbody>
              {recentRestaurants.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No restaurants yet</td></tr>
              ) : recentRestaurants.map(r => (
                <tr key={r._id}>
                  <td style={{ fontWeight: 600 }}>{r.name}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{r.ownerId?.name || 'N/A'}</td>
                  <td><span className={`badge ${r.isApproved ? 'badge-success' : 'badge-warning'}`}>{r.isApproved ? 'Approved' : 'Pending'}</span></td>
                  <td>⭐ {r.rating?.toFixed(1) || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
