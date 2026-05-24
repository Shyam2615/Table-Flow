'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link href="/" className="navbar-brand">🍽️ <span>Table</span>Flow</Link>
        <button
          className={`navbar-toggle${menuOpen ? ' active' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <div className={`navbar-links${menuOpen ? ' open' : ''}`}>
          <Link href="/restaurants" onClick={() => setMenuOpen(false)}>Restaurants</Link>
          {user ? (
            <>
              {user.role === 'customer' && (
                <><Link href="/my-bookings" onClick={() => setMenuOpen(false)}>My Bookings</Link><Link href="/my-orders" onClick={() => setMenuOpen(false)}>My Orders</Link></>
              )}
              {user.role === 'owner' && <Link href="/admin" onClick={() => setMenuOpen(false)}>Dashboard</Link>}
              {user.role === 'waiter' && <Link href="/waiter" onClick={() => setMenuOpen(false)}>Waiter Panel</Link>}
              {user.role === 'superadmin' && <Link href="/superadmin" onClick={() => setMenuOpen(false)}>Super Admin</Link>}
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '8px 16px' }}>Hi, {user.name}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => { logout(); setMenuOpen(false); }}>Logout</button>
            </>
          ) : !loading ? (
            <>
              <Link href="/login" className="btn btn-ghost btn-sm" onClick={() => setMenuOpen(false)}>Login</Link>
              <Link href="/register" className="btn btn-primary btn-sm" onClick={() => setMenuOpen(false)}>Sign Up</Link>
            </>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
