import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import API from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function RestaurantDetailScreen({ route, navigation }) {
  const { restaurant } = route.params;
  const { user } = useAuth();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('19:00');
  const [guests, setGuests] = useState('2');
  const [tableNumber, setTableNumber] = useState('');
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);

  const checkAvailability = async () => {
    setLoading(true);
    try {
      const { data } = await API.get(`/tables/restaurant/${restaurant._id}?date=${date}&time=${time}`);
      const available = (data.tables || []).filter(t => !data.bookedTableNumbers?.includes(t.tableNumber));
      setTables(available);
    } catch { Alert.alert('Error', 'Failed to check availability'); }
    finally { setLoading(false); }
  };

  const handleBooking = async () => {
    if (!tableNumber) { Alert.alert('Error', 'Select a table'); return; }
    setBooking(true);
    try {
      await API.post('/bookings', { restaurantId: restaurant._id, tableNumber: parseInt(tableNumber), date, time, guests: parseInt(guests) });
      Alert.alert('Success', 'Booking request sent!');
      navigation.goBack();
    } catch (err) { Alert.alert('Error', err.response?.data?.message || 'Booking failed'); }
    finally { setBooking(false); }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.name}>{restaurant.name}</Text>
      <Text style={styles.cuisine}>{restaurant.cuisine?.join(' • ')} • {restaurant.priceRange}</Text>
      <Text style={styles.desc}>{restaurant.description}</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Book a Table</Text>
        <TextInput style={styles.input} placeholder="Date (YYYY-MM-DD)" placeholderTextColor="#666" value={date} onChangeText={setDate} />
        <TextInput style={styles.input} placeholder="Time (HH:MM)" placeholderTextColor="#666" value={time} onChangeText={setTime} />
        <TextInput style={styles.input} placeholder="Guests" placeholderTextColor="#666" value={guests} onChangeText={setGuests} keyboardType="numeric" />
        <TouchableOpacity style={styles.button} onPress={checkAvailability} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Check Availability</Text>}
        </TouchableOpacity>

        {tables.length > 0 && (
          <>
            <Text style={styles.label}>Available Tables:</Text>
            {tables.map(t => (
              <TouchableOpacity key={t.tableNumber} style={[styles.tableItem, tableNumber === String(t.tableNumber) && styles.tableSelected]} onPress={() => setTableNumber(String(t.tableNumber))}>
                <Text style={styles.tableText}>Table {t.tableNumber} — {t.capacity} seats</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[styles.button, styles.bookBtn]} onPress={handleBooking} disabled={booking}>
              {booking ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Confirm Booking</Text>}
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f', padding: 16 },
  name: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 4 },
  cuisine: { fontSize: 14, color: '#f97316', marginBottom: 8 },
  desc: { fontSize: 14, color: '#888', marginBottom: 20, lineHeight: 20 },
  card: { backgroundColor: '#14141f', borderRadius: 14, padding: 20, borderWidth: 1, borderColor: '#2a2a3a' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 16 },
  input: { backgroundColor: '#1a1a2e', borderRadius: 10, padding: 14, fontSize: 16, color: '#fff', marginBottom: 12, borderWidth: 1, borderColor: '#2a2a3a' },
  label: { fontSize: 15, color: '#fff', fontWeight: '600', marginVertical: 12 },
  button: { backgroundColor: '#f97316', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8 },
  bookBtn: { backgroundColor: '#22c55e', marginTop: 16 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  tableItem: { backgroundColor: '#1a1a2e', borderRadius: 8, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#2a2a3a' },
  tableSelected: { borderColor: '#f97316', backgroundColor: '#1a1a2e' },
  tableText: { color: '#fff', fontSize: 15 },
});
