'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import API from '@/lib/api';

export default function HomePage() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/restaurants').then(res => {
      setRestaurants(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className="hero">
        <div className="container slide-up">
          <h1>Discover & Book<br />The Best Restaurants</h1>
          <p>
            Browse curated restaurants, reserve your perfect table,
            and order delicious food — all in one place.
          </p>
          <div className="hero-actions">
            <Link href="/restaurants" className="btn btn-primary btn-lg">
              🍽️ Explore Restaurants
            </Link>
            <Link href="/register" className="btn btn-outline btn-lg">
              Join Free
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section-padding" style={{ background: 'var(--bg-surface)' }}>
        <div className="container">
          <h2 className="section-title" style={{ textAlign: 'center', marginBottom: 48 }}>
            How It Works
          </h2>
          <div className="grid-3">
            {[
              { icon: '🔍', title: 'Browse Restaurants', desc: 'Explore curated restaurants with detailed menus, photos, and reviews.' },
              { icon: '📅', title: 'Book Your Table', desc: 'Reserve your preferred table for any date and time, instant confirmation.' },
              { icon: '🍕', title: 'Order from Table', desc: 'Browse the menu and place orders directly from your table. No waiting!' },
            ].map((f, i) => (
              <div key={i} className="card" style={{ textAlign: 'center' }}>
                <div className="card-body">
                  <div style={{ fontSize: '3rem', marginBottom: 16 }}>{f.icon}</div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Restaurants */}
      <section className="section-padding">
        <div className="container">
          <div className="featured-header">
            <div>
              <h2 className="section-title">Featured Restaurants</h2>
              <p style={{ color: 'var(--text-secondary)' }}>Handpicked places for a great dining experience</p>
            </div>
            <Link href="/restaurants" className="btn btn-outline">View All →</Link>
          </div>

          {loading ? (
            <div className="loading"><div className="spinner"></div> Loading...</div>
          ) : restaurants.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🍽️</div>
              <h3>No restaurants yet</h3>
              <p>Check back soon for amazing dining options!</p>
            </div>
          ) : (
            <div className="grid-3">
              {restaurants.slice(0, 6).map(r => (
                <Link href={`/restaurants/${r._id}`} key={r._id} className="card restaurant-card">
                  <div className="card-image-wrap">
                    <img src={r.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400'} alt={r.name} className="card-image" />
                    <div className="card-cuisine">
                      {r.cuisine?.slice(0, 2).map((c, i) => (
                        <span key={i} className="cuisine-tag">{c}</span>
                      ))}
                    </div>
                  </div>
                  <div className="card-body">
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 4 }}>{r.name}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 8 }}>
                      {r.address?.city}{r.address?.street ? `, ${r.address.street}` : ''}
                    </p>
                    <div className="card-meta">
                      <span className="rating">⭐ {r.rating?.toFixed(1)}</span>
                      <span>{r.totalReviews} reviews</span>
                      <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{r.priceRange}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '40px 0', borderTop: '1px solid var(--border)', background: 'var(--bg-card)' }}>
        <div className="container" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <p>© 2026 TableFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
