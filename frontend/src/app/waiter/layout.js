'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function WaiterLayout({ children }) {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user || user.role !== 'waiter') {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h2 style={{ textAlign: 'center' }}>🔒 Access Denied</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: 12 }}>
            Only waiters can access this page.
          </p>
          <Link href="/login" className="btn btn-primary" style={{ width: '100%', marginTop: 20 }}>Go to Login</Link>
        </div>
      </div>
    );
  }

  const links = [
    { href: '/waiter', label: 'Dashboard', icon: '🏠' },
    { href: '/waiter/orders/new', label: 'New Order', icon: '➕' },
    { href: '/waiter/orders', label: 'Active Orders', icon: '📋' },
  ];

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h2>🍽️ <span>Table</span>Flow</h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>Waiter Panel</p>
        </div>
        <nav className="sidebar-nav">
          {links.map((link, i) => (
            <Link key={i} href={link.href} className={pathname === link.href ? 'active' : ''}>
              <span>{link.icon}</span> {link.label}
            </Link>
          ))}
        </nav>
        <div style={{ marginTop: 'auto', padding: '16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {user.name}
        </div>
      </aside>
      <div className="admin-content">
        {children}
      </div>
    </div>
  );
}