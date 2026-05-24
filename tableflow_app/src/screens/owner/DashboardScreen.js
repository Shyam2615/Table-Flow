import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import API from '../../api';

export default function OwnerDashboardScreen({ navigation }) {
  const [restaurant, setRestaurant] = useState(null);
  const [stats, setStats] = useState({ bookings: 0, orders: 0, revenue: 0, waiters: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data: rest } = await API.get('/restaurants/owner/my-restaurant');
        setRestaurant(rest);
        const [bRes, oRes, wRes] = await Promise.all([
          API.get(`/bookings/restaurant/${rest._id}`),
          API.get(`/orders/restaurant/${rest._id}`),
          API.get('/auth/waiters'),
        ]);
        const bookings = bRes.data.bookings ?? bRes.data ?? [];
        const orders = oRes.data.orders ?? oRes.data ?? [];
        const revenue = orders.reduce((s, o) => s + (o.total || 0), 0);
        setStats({ bookings: bookings.length, orders: orders.length, revenue, waiters: wRes.data.length });
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#f97316" /></View>;

  const menuItems = [
    { label: 'Menu', icon: '🍽️', screen: 'OwnerMenu' },
    { label: 'Bookings', icon: '📅', screen: 'OwnerBookings' },
    { label: 'Orders', icon: '📦', screen: 'OwnerOrders' },
    { label: 'Tables', icon: '🪑', screen: 'OwnerTables' },
    { label: 'Waiters', icon: '🧑‍🍳', screen: 'OwnerWaiters' },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{restaurant?.name || 'Dashboard'}</Text>

      <View style={styles.statsRow}>
        <View style={styles.statCard}><Text style={styles.statVal}>{stats.bookings}</Text><Text style={styles.statLabel}>Bookings</Text></View>
        <View style={styles.statCard}><Text style={styles.statVal}>{stats.orders}</Text><Text style={styles.statLabel}>Orders</Text></View>
        <View style={styles.statCard}><Text style={styles.statVal}>₹{stats.revenue}</Text><Text style={styles.statLabel}>Revenue</Text></View>
        <View style={styles.statCard}><Text style={styles.statVal}>{stats.waiters}</Text><Text style={styles.statLabel}>Waiters</Text></View>
      </View>

      <View style={styles.grid}>
        {menuItems.map((item, i) => (
          <TouchableOpacity key={i} style={styles.gridItem} onPress={() => navigation.navigate(item.screen)}>
            <Text style={styles.gridIcon}>{item.icon}</Text>
            <Text style={styles.gridLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f', padding: 16 },
  center: { flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 20 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  statCard: { backgroundColor: '#14141f', borderRadius: 12, padding: 16, flex: 1, minWidth: '45%', borderWidth: 1, borderColor: '#2a2a3a', alignItems: 'center' },
  statVal: { fontSize: 22, fontWeight: '800', color: '#f97316' },
  statLabel: { fontSize: 13, color: '#888', marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem: { backgroundColor: '#14141f', borderRadius: 14, padding: 20, width: '30%', alignItems: 'center', borderWidth: 1, borderColor: '#2a2a3a' },
  gridIcon: { fontSize: 28, marginBottom: 8 },
  gridLabel: { fontSize: 12, color: '#fff', fontWeight: '600' },
});
