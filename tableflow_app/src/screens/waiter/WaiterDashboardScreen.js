import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import API from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function WaiterDashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [stats, setStats] = useState({ activeOrders: 0, occupiedTables: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!user?.restaurantId) return;
    API.get(`/orders/restaurant/${user.restaurantId}?date=${today}`).then(({ data }) => {
      const orders = data.orders ?? data ?? [];
      const active = orders.filter(o => !['completed', 'cancelled'].includes(o.status));
      setStats({
        activeOrders: active.length,
        occupiedTables: [...new Set(active.map(o => o.tableNumber))].length,
        completed: orders.filter(o => o.status === 'completed').length,
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#f97316" /></View>;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Waiter Dashboard</Text>

      <View style={styles.statsRow}>
        <View style={styles.statCard}><Text style={styles.statVal}>{stats.occupiedTables}</Text><Text style={styles.statLabel}>Occupied Tables</Text></View>
        <View style={styles.statCard}><Text style={styles.statVal}>{stats.activeOrders}</Text><Text style={styles.statLabel}>Active Orders</Text></View>
        <View style={styles.statCard}><Text style={styles.statVal}>{stats.completed}</Text><Text style={styles.statLabel}>Completed</Text></View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('NewOrder')}>
          <Text style={styles.actionIcon}>➕</Text>
          <Text style={styles.actionLabel}>New Order</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('ActiveOrders')}>
          <Text style={styles.actionIcon}>📋</Text>
          <Text style={styles.actionLabel}>Active Orders</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f', padding: 16 },
  center: { flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 20 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: { backgroundColor: '#14141f', borderRadius: 12, padding: 20, flex: 1, alignItems: 'center', borderWidth: 1, borderColor: '#2a2a3a' },
  statVal: { fontSize: 24, fontWeight: '800', color: '#f97316' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 4, textAlign: 'center' },
  actions: { gap: 12 },
  actionBtn: { backgroundColor: '#14141f', borderRadius: 14, padding: 24, flexDirection: 'row', alignItems: 'center', gap: 16, borderWidth: 1, borderColor: '#2a2a3a' },
  actionIcon: { fontSize: 32 },
  actionLabel: { fontSize: 18, fontWeight: '700', color: '#fff' },
});
