'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function SuperAdminLayout({ children }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (!user || user.role !== 'superadmin') {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔒</div>
          <h2>Super Admin Only</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: 12, marginBottom: 24 }}>
            This area is restricted to platform administrators.
          </p>
          <Link href="/login" className="btn btn-primary">Go to Login</Link>
        </div>
      </div>
    );
  }

  const links = [
    { href: '/superadmin', label: 'Dashboard', icon: '📊' },
    { section: 'Management' },
    { href: '/superadmin/users', label: 'All Users', icon: '👥' },
    { href: '/superadmin/restaurants', label: 'Restaurants', icon: '🏪' },
    { href: '/superadmin/owners', label: 'Owners', icon: '👤' },
  ];

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="sidebar-brand" style={{ borderBottom: 'none', paddingBottom: 16 }}>
          <h2>🛡️ <span>Super</span> Admin</h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Platform Management</p>
        </div>
        <div style={{ padding: '0 12px', marginBottom: 16 }}>
          <div className="stat-card" style={{ padding: 12 }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Signed in as</div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', marginTop: 2 }}>{user.name}</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          {links.map((link, i) =>
            link.section ? (
              <div key={i} className="sidebar-section">{link.section}</div>
            ) : (
              <Link key={i} href={link.href} className={pathname === link.href ? 'active' : ''}>
                <span>{link.icon}</span> {link.label}
              </Link>
            )
          )}
        </nav>
        <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
          <button
            onClick={() => { logout(); router.push('/login'); }}
            className="btn btn-ghost"
            style={{ width: '100%', justifyContent: 'flex-start' }}
          >
            🚪 Logout
          </button>
        </div>
      </aside>
      <div className="admin-content">{children}</div>
    </div>
  );
}
