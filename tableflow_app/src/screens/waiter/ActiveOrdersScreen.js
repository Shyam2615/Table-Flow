import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import API from '../../api';
import { useAuth } from '../../context/AuthContext';

const statusFlow = ['pending', 'preparing', 'ready', 'served', 'completed'];
const activeStatuses = ['pending', 'preparing', 'ready', 'served'];

export default function ActiveOrdersScreen() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active');
  const today = new Date().toISOString().split('T')[0];

  const loadOrders = async () => {
    const { data } = await API.get(`/orders/restaurant/${user.restaurantId}?date=${today}`);
    setOrders(data.orders ?? data ?? []);
  };

  useEffect(() => {
    if (!user?.restaurantId) return;
    loadOrders().finally(() => setLoading(false));
  }, [user]);

  const updateStatus = async (id, status) => {
    await API.put(`/orders/${id}`, { status });
    await loadOrders();
  };

  const filtered = filter === 'active' ? orders.filter(o => activeStatuses.includes(o.status))
    : filter === 'completed' ? orders.filter(o => o.status === 'completed') : orders;

  const getNextStatus = (status) => {
    const idx = statusFlow.indexOf(status);
    return idx >= 0 && idx < statusFlow.length - 1 ? statusFlow[idx + 1] : null;
  };

  const statusColor = { pending: '#f59e0b', preparing: '#3b82f6', ready: '#8b5cf6', served: '#22c55e', completed: '#22c55e', cancelled: '#ef4444' };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#f97316" /></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Orders</Text>

      <View style={styles.filterRow}>
        {[{ key: 'active', label: 'Active' }, { key: 'completed', label: 'Completed' }, { key: 'all', label: 'All' }].map(f => (
          <TouchableOpacity key={f.key} style={[styles.filterBtn, filter === f.key && styles.filterActive]} onPress={() => setFilter(f.key)}>
            <Text style={[styles.filterText, filter === f.key && { color: '#fff' }]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <View>
                <Text style={styles.tableNum}>Table {item.tableNumber}</Text>
                <Text style={styles.orderId}>#{item._id.slice(-6)}</Text>
              </View>
              <Text style={[styles.status, { color: statusColor[item.status] }]}>{item.status.toUpperCase()}</Text>
            </View>
            {item.items.map((it, i) => (
              <Text key={i} style={styles.item}>• {it.name} × {it.quantity} — ₹{it.price * it.quantity}</Text>
            ))}
            <Text style={styles.total}>₹{item.total}</Text>
            {item.notes ? <Text style={styles.notes}>📝 {item.notes}</Text> : null}
            {getNextStatus(item.status) && (
              <TouchableOpacity style={styles.btn} onPress={() => updateStatus(item._id, getNextStatus(item.status))}>
                <Text style={styles.btnText}>→ {getNextStatus(item.status)}</Text>
              </TouchableOpacity>
            )}
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
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  filterBtn: { backgroundColor: '#1a1a2e', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: '#2a2a3a' },
  filterActive: { backgroundColor: '#f97316', borderColor: '#f97316' },
  filterText: { color: '#aaa', fontWeight: '600', fontSize: 14 },
  card: { backgroundColor: '#14141f', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a3a' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  tableNum: { fontSize: 17, fontWeight: '700', color: '#fff' },
  orderId: { fontSize: 12, color: '#888', marginTop: 2 },
  status: { fontSize: 12, fontWeight: '700' },
  item: { fontSize: 14, color: '#ccc', paddingLeft: 8, marginBottom: 2 },
  total: { fontSize: 18, fontWeight: '800', color: '#f97316', marginTop: 6 },
  notes: { fontSize: 13, color: '#888', marginTop: 4, fontStyle: 'italic' },
  btn: { backgroundColor: '#f97316', borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 10 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  empty: { color: '#666', textAlign: 'center', padding: 40, fontSize: 16 },
});
