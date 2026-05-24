import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import API from '../../api';

export default function MyOrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/orders/my-orders').then(({ data }) => setOrders(data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const statusColor = { pending: '#f59e0b', preparing: '#3b82f6', ready: '#8b5cf6', served: '#22c55e', completed: '#22c55e', cancelled: '#ef4444' };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#f97316" /></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Orders</Text>
      <FlatList
        data={orders}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.restName}>{item.restaurantId?.name || 'Restaurant'}</Text>
              <Text style={[styles.status, { color: statusColor[item.status] || '#888' }]}>{item.status.toUpperCase()}</Text>
            </View>
            <Text style={styles.detail}>🪑 Table {item.tableNumber} • {new Date(item.createdAt).toLocaleString()}</Text>
            {item.items.map((it, i) => (
              <Text key={i} style={styles.item}>• {it.name} × {it.quantity} — ₹{it.price * it.quantity}</Text>
            ))}
            <Text style={styles.total}>Total: ₹{item.total}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No orders yet</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f', padding: 16 },
  center: { flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 16 },
  card: { backgroundColor: '#14141f', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a3a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  restName: { fontSize: 16, fontWeight: '700', color: '#fff' },
  status: { fontSize: 12, fontWeight: '700' },
  detail: { fontSize: 13, color: '#aaa', marginBottom: 8 },
  item: { fontSize: 14, color: '#ccc', paddingLeft: 8, marginBottom: 2 },
  total: { fontSize: 16, fontWeight: '700', color: '#f97316', marginTop: 8 },
  empty: { color: '#666', textAlign: 'center', padding: 40, fontSize: 16 },
});
