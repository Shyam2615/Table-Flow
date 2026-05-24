import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import API from '../../api';

export default function OwnerTablesScreen() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data: rest } = await API.get('/restaurants/owner/my-restaurant');
        const { data } = await API.get(`/tables/restaurant/${rest._id}`);
        setTables(data.tables || []);
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#f97316" /></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Table Management</Text>
      <FlatList
        data={tables}
        keyExtractor={(item) => String(item.tableNumber)}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.tableNum}>Table {item.tableNumber}</Text>
              <Text style={[styles.status, { color: item.isAvailable ? '#22c55e' : '#ef4444' }]}>
                {item.isAvailable ? 'Available' : 'Occupied'}
              </Text>
            </View>
            <Text style={styles.detail}>{item.tableName || 'Unnamed'} • {item.capacity} seats</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f', padding: 16 },
  center: { flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 16 },
  card: { backgroundColor: '#14141f', borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#2a2a3a' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  tableNum: { fontSize: 17, fontWeight: '700', color: '#fff' },
  status: { fontSize: 13, fontWeight: '700' },
  detail: { fontSize: 14, color: '#888' },
});
