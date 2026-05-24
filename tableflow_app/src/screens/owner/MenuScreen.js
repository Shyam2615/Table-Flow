import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import API from '../../api';

export default function OwnerMenuScreen() {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data: rest } = await API.get('/restaurants/owner/my-restaurant');
        const { data } = await API.get(`/menu/restaurant/${rest._id}`);
        setMenu(data);
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  const categories = [...new Set(menu.map(m => m.category))];

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#f97316" /></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Menu Management</Text>
      <FlatList
        data={categories}
        keyExtractor={(item) => item}
        renderItem={({ item: cat }) => (
          <View style={styles.section}>
            <Text style={styles.catTitle}>{cat}</Text>
            {menu.filter(m => m.category === cat).map((item) => (
              <View key={item._id} style={styles.item}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{item.isVeg ? '🟢 ' : '🔴 '}{item.name}</Text>
                  <Text style={styles.itemDesc}>{item.description}</Text>
                </View>
                <Text style={styles.price}>₹{item.price}</Text>
              </View>
            ))}
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
  section: { marginBottom: 20 },
  catTitle: { fontSize: 18, fontWeight: '700', color: '#f97316', marginBottom: 10 },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#14141f', borderRadius: 10, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#2a2a3a' },
  itemName: { fontSize: 15, fontWeight: '600', color: '#fff' },
  itemDesc: { fontSize: 12, color: '#888', marginTop: 2 },
  price: { fontSize: 16, fontWeight: '700', color: '#f97316' },
});
