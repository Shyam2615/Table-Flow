import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import API from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function NewOrderScreen({ navigation }) {
  const { user } = useAuth();
  const [menu, setMenu] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [selectedTable, setSelectedTable] = useState('');
  const [cart, setCart] = useState([]);
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    if (!user?.restaurantId) return;
    Promise.all([
      API.get(`/menu/restaurant/${user.restaurantId}`),
      API.get(`/restaurants/${user.restaurantId}`),
    ]).then(([menuRes, restRes]) => {
      setMenu(menuRes.data);
      setTables(restRes.data.tables || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  const categories = [...new Set(menu.map(m => m.category))];
  const filtered = menu.filter(m => category === 'all' || m.category === category);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i._id === item._id);
      if (existing) return prev.map(i => i._id === item._id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { _id: item._id, name: item.name, price: item.price, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(i => i._id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i).filter(i => i.qty > 0));
  };

  const placeOrder = async () => {
    if (!selectedTable || cart.length === 0) { Alert.alert('Error', 'Select a table and add items'); return; }
    setPlacing(true);
    try {
      await API.post('/orders', {
        restaurantId: user.restaurantId,
        tableNumber: parseInt(selectedTable),
        items: cart.map(i => ({ menuItemId: i._id, name: i.name, price: i.price, quantity: i.qty })),
        notes,
      });
      Alert.alert('Success', 'Order placed!');
      navigation.goBack();
    } catch (err) { Alert.alert('Error', err.response?.data?.message || 'Failed to place order'); }
    finally { setPlacing(false); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#f97316" /></View>;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>New Order</Text>

      <Text style={styles.label}>Select Table</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        {tables.map(t => (
          <TouchableOpacity key={t.tableNumber} style={[styles.tableChip, selectedTable === String(t.tableNumber) && styles.tableSelected]} onPress={() => setSelectedTable(String(t.tableNumber))}>
            <Text style={[styles.chipText, selectedTable === String(t.tableNumber) && { color: '#fff' }]}>Table {t.tableNumber}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.label}>Menu</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        <TouchableOpacity style={[styles.catChip, category === 'all' && styles.catSelected]} onPress={() => setCategory('all')}><Text style={[styles.catText, category === 'all' && { color: '#fff' }]}>All</Text></TouchableOpacity>
        {categories.map(c => (
          <TouchableOpacity key={c} style={[styles.catChip, category === c && styles.catSelected]} onPress={() => setCategory(c)}><Text style={[styles.catText, category === c && { color: '#fff' }]}>{c}</Text></TouchableOpacity>
        ))}
      </ScrollView>

      {filtered.map(item => (
        <TouchableOpacity key={item._id} style={styles.menuItem} onPress={() => addToCart(item)}>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemName}>{item.isVeg ? '🟢 ' : '🔴 '}{item.name}</Text>
            <Text style={styles.itemDesc}>{item.description}</Text>
          </View>
          <Text style={styles.itemPrice}>₹{item.price}</Text>
        </TouchableOpacity>
      ))}

      {cart.length > 0 && (
        <View style={styles.cart}>
          <Text style={styles.cartTitle}>🛒 Order Summary</Text>
          {cart.map(item => (
            <View key={item._id} style={styles.cartItem}>
              <Text style={{ flex: 1, color: '#fff' }}>{item.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQty(item._id, -1)}><Text style={styles.qtyBtnText}>−</Text></TouchableOpacity>
                <Text style={{ color: '#fff', fontWeight: '600', minWidth: 20, textAlign: 'center' }}>{item.qty}</Text>
                <TouchableOpacity style={[styles.qtyBtn, { backgroundColor: '#f97316' }]} onPress={() => updateQty(item._id, 1)}><Text style={[styles.qtyBtnText, { color: '#fff' }]}>+</Text></TouchableOpacity>
              </View>
              <Text style={{ color: '#f97316', fontWeight: '700', minWidth: 60, textAlign: 'right' }}>₹{item.price * item.qty}</Text>
            </View>
          ))}
          <TextInput style={styles.input} placeholder="Order notes..." placeholderTextColor="#666" value={notes} onChangeText={setNotes} multiline />
          <View style={styles.totalRow}>
            <Text style={styles.totalText}>Total</Text>
            <Text style={styles.totalPrice}>₹{cartTotal}</Text>
          </View>
          <TouchableOpacity style={styles.placeBtn} onPress={placeOrder} disabled={placing}>
            {placing ? <ActivityIndicator color="#fff" /> : <Text style={styles.placeText}>Place Order →</Text>}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f', padding: 16 },
  center: { flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 16 },
  label: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 8 },
  tableChip: { backgroundColor: '#1a1a2e', borderRadius: 10, padding: 12, marginRight: 8, borderWidth: 1, borderColor: '#2a2a3a' },
  tableSelected: { borderColor: '#f97316', backgroundColor: '#f97316' },
  chipText: { color: '#aaa', fontWeight: '600', fontSize: 14 },
  catChip: { backgroundColor: '#1a1a2e', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, borderWidth: 1, borderColor: '#2a2a3a' },
  catSelected: { backgroundColor: '#f97316', borderColor: '#f97316' },
  catText: { color: '#aaa', fontWeight: '600', fontSize: 13 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#14141f', borderRadius: 10, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#2a2a3a' },
  itemName: { fontSize: 15, fontWeight: '600', color: '#fff' },
  itemDesc: { fontSize: 12, color: '#888', marginTop: 2 },
  itemPrice: { fontSize: 16, fontWeight: '700', color: '#f97316' },
  cart: { backgroundColor: '#14141f', borderRadius: 14, padding: 16, marginTop: 20, borderWidth: 1, borderColor: '#2a2a3a' },
  cartTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 12 },
  cartItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#2a2a3a', gap: 8 },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#2a2a3a' },
  qtyBtnText: { fontSize: 18, fontWeight: '700', color: '#aaa' },
  input: { backgroundColor: '#1a1a2e', borderRadius: 10, padding: 12, fontSize: 14, color: '#fff', marginTop: 12, borderWidth: 1, borderColor: '#2a2a3a' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 2, borderTopColor: '#2a2a3a' },
  totalText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  totalPrice: { fontSize: 20, fontWeight: '800', color: '#f97316' },
  placeBtn: { backgroundColor: '#f97316', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 16 },
  placeText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
