'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function WaiterLayout({ children }) {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    if (!user || user.role !== 'waiter') {
        return (
            <div className="auth-page">
                <div className="auth-card">
                    <h2>🔒 Access Denied</h2>
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: 12 }}>
                        Only waiters can access this page.
                    </p>
                    <Link href="/login" className="btn btn-primary" style={{ width: '100%', marginTop: 20 }}>Go to Login</Link>
                </div>
            </div>
        );
    }

    const links = [
        { href: '/waiter', label: 'Dashboard', icon: '📊' },
        { href: '/waiter/orders/new', label: 'New Order', icon: '➕' },
        { href: '/waiter/orders', label: 'Active Orders', icon: '📋' },
    ];

    const closeSidebar = () => setSidebarOpen(false);

    return (
        <div className="admin-layout">
            <div className={`sidebar-overlay${sidebarOpen ? ' open' : ''}`} onClick={closeSidebar}></div>
            <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
                <div className="sidebar-brand">
                    <h2>🍽️ <span>Table</span>Flow</h2>
                    <p>Waiter Panel</p>
                </div>
                <nav className="sidebar-nav">
                    {links.map((link, i) => (
                        <Link key={i} href={link.href} className={pathname === link.href ? 'active' : ''} onClick={closeSidebar}>
                            <span>{link.icon}</span> {link.label}
                        </Link>
                    ))}
                </nav>
                <div style={{ padding: '24px', borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 8 }}>Signed in as</p>
                    <p style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 12 }}>{user.name}</p>
                    <button className="btn btn-danger btn-sm" style={{ width: '100%' }} onClick={logout}>Logout</button>
                </div>
            </aside>
            <div className="admin-content">
                <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
                    ☰ Menu
                </button>
                {children}
            </div>
        </div>
    );
}