'use client';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const isClerkUser = user?.clerkUserId;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link href="/" className="navbar-brand">
          🍽️ <span>Table</span>Flow
        </Link>
        <div className="navbar-links">
          <Link href="/restaurants">Restaurants</Link>

          {user ? (
            <>
              {user.role === 'customer' && (
                <>
                  <Link href="/my-bookings">My Bookings</Link>
                  <Link href="/my-orders">My Orders</Link>
                </>
              )}
              {user.role === 'owner' && (
                <Link href="/admin">Dashboard</Link>
              )}
              {user.role === 'waiter' && (
                <Link href="/waiter">Waiter Panel</Link>
              )}
              {user.role === 'superadmin' && (
                <Link href="/superadmin">Super Admin</Link>
              )}
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Hi, {user.name}
              </span>
              <button className="btn btn-ghost btn-sm" onClick={logout}>
                Logout
              </button>
            </>
          ) : !loading ? (
            <>
              <Link href="/login" className="btn btn-ghost btn-sm">Login</Link>
              <Link href="/register" className="btn btn-primary btn-sm">Sign Up</Link>
            </>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
