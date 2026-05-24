'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import API from '@/lib/api';

export default function AdminLayout({ children }) {
    const { user } = useAuth();
    const pathname = usePathname();
    const [restaurant, setRestaurant] = useState(null);

    useEffect(() => {
        if (user?.role === 'owner') {
            API.get('/restaurants/owner/my-restaurant').then(res => setRestaurant(res.data)).catch(() => { });
        }
    }, [user]);

    if (!user || user.role !== 'owner') {
        return (
            <div className="auth-page">
                <div className="auth-card">
                    <h2 style={{ textAlign: 'center' }}>🔒 Access Denied</h2>
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: 12 }}>
                        Only restaurant owners can access this page.
                    </p>
                    <Link href="/login" className="btn btn-primary" style={{ width: '100%', marginTop: 20 }}>Go to Login</Link>
                </div>
            </div>
        );
    }

    const links = [
        { href: '/admin', label: 'Dashboard', icon: '📊' },
        { section: 'Restaurant' },
        { href: '/admin/menu', label: 'Menu Management', icon: '🍽️' },
        { href: '/admin/bookings', label: 'Bookings', icon: '📅' },
        { href: '/admin/orders', label: 'Orders', icon: '📦' },
        { href: '/admin/tables', label: 'Table Management', icon: '🪑' },
        { href: '/admin/waiters', label: 'Waiters', icon: '🧑‍🍳' },
    ];

    return (
        <div className="admin-layout">
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <h2>🍽️ <span>Table</span>Flow</h2>
                    {/* <p>{restaurant?.name || 'Loading...'}</p> */}
                </div>
                <nav className="sidebar-nav">
                    {links.map((link, i) => (
                        link.section ? (
                            <div key={i} className="sidebar-section">{link.section}</div>
                        ) : (
                            <Link key={i} href={link.href} className={pathname === link.href ? 'active' : ''}>
                                <span>{link.icon}</span> {link.label}
                            </Link>
                        )
                    ))}
                </nav>
            </aside>
            <div className="admin-content">
                {children}
            </div>
        </div>
    );
}
