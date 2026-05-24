'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import API from '@/lib/api';

export default function RestaurantsPage() {
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [cuisineFilter, setCuisineFilter] = useState('');

    useEffect(() => {
        loadRestaurants();
    }, [cuisineFilter]);

    const loadRestaurants = async () => {
        try {
            const params = {};
            if (cuisineFilter) params.cuisine = cuisineFilter;
            const { data } = await API.get('/restaurants', { params });
            setRestaurants(data);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const filtered = restaurants.filter(r =>
        r.name.toLowerCase().includes(search.toLowerCase())
    );

    const allCuisines = [...new Set(restaurants.flatMap(r => r.cuisine || []))];

    return (
        <div className="container fade-in" style={{ padding: '48px 32px' }}>
            <div className="page-header">
                <h1>All Restaurants</h1>
                <p>Find your perfect dining experience</p>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
                <input
                    className="input" placeholder="Search restaurants..." value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ maxWidth: 360 }}
                />
                <select className="select" value={cuisineFilter} onChange={e => setCuisineFilter(e.target.value)}
                    style={{ maxWidth: 200 }}>
                    <option value="">All Cuisines</option>
                    {allCuisines.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>

            {loading ? (
                <div className="loading"><div className="spinner"></div> Loading restaurants...</div>
            ) : filtered.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">🔍</div>
                    <h3>No restaurants found</h3>
                    <p>Try adjusting your filters</p>
                </div>
            ) : (
                <div className="grid-3">
                    {filtered.map(r => (
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
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 8 }}>
                                    🕐 {r.openingHours?.open} - {r.openingHours?.close}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
