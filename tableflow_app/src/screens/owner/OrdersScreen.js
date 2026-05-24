import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import API from '../../api';

const statusFlow = ['pending', 'preparing', 'ready', 'served', 'completed'];

export default function OwnerOrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    const { data: rest } = await API.get('/restaurants/owner/my-restaurant');
    const { data } = await API.get(`/orders/restaurant/${rest._id}`);
    setOrders(data.orders ?? data ?? []);
  };

  useEffect(() => { loadData().finally(() => setLoading(false)); }, []);

  const updateStatus = async (id, status) => {
    await API.put(`/orders/${id}`, { status });
    await loadData();
  };

  const getNextStatus = (status) => {
    const idx = statusFlow.indexOf(status);
    return idx >= 0 && idx < statusFlow.length - 1 ? statusFlow[idx + 1] : null;
  };

  const statusColor = { pending: '#f59e0b', preparing: '#3b82f6', ready: '#8b5cf6', served: '#22c55e', completed: '#22c55e', cancelled: '#ef4444' };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#f97316" /></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Orders</Text>
      <FlatList
        data={orders}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <View>
                <Text style={styles.orderId}>Order #{item._id.slice(-6)}</Text>
                <Text style={styles.detail}>👤 {item.userId?.name} • 🪑 Table {item.tableNumber}</Text>
              </View>
              <Text style={[styles.status, { color: statusColor[item.status] }]}>{item.status.toUpperCase()}</Text>
            </View>
            {item.items.map((it, i) => (
              <Text key={i} style={styles.item}>• {it.name} × {it.quantity} — ₹{it.price * it.quantity}</Text>
            ))}
            <View style={styles.footer}>
              <Text style={styles.total}>₹{item.total}</Text>
              {getNextStatus(item.status) && (
                <TouchableOpacity style={styles.btn} onPress={() => updateStatus(item._id, getNextStatus(item.status))}>
                  <Text style={styles.btnText}>→ {getNextStatus(item.status)}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No orders</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f', padding: 16 },
  center: { flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 16 },
  card: { backgroundColor: '#14141f', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a3a' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  orderId: { fontSize: 15, fontWeight: '700', color: '#fff' },
  status: { fontSize: 12, fontWeight: '700' },
  detail: { fontSize: 13, color: '#aaa', marginTop: 2 },
  item: { fontSize: 14, color: '#ccc', paddingLeft: 8, marginBottom: 2 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  total: { fontSize: 18, fontWeight: '800', color: '#f97316' },
  btn: { backgroundColor: '#f97316', borderRadius: 8, padding: 10, paddingHorizontal: 16 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  empty: { color: '#666', textAlign: 'center', padding: 40, fontSize: 16 },
});
