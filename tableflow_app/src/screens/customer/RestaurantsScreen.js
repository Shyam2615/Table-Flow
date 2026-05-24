import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, ActivityIndicator, TextInput } from 'react-native';
import API from '../../api';

export default function RestaurantsScreen({ navigation }) {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    API.get('/restaurants').then(({ data }) => setRestaurants(data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = restaurants.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#f97316" /></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Restaurants</Text>
      <TextInput style={styles.search} placeholder="Search restaurants..." placeholderTextColor="#666" value={search} onChangeText={setSearch} />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('RestaurantDetail', { restaurant: item })}>
            {item.image && <Image source={{ uri: item.image }} style={styles.image} />}
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.cuisine}>{item.cuisine?.join(' • ')}</Text>
              <Text style={styles.meta}>{item.address?.city} • ⭐ {item.rating?.toFixed(1) || 'N/A'} • {item.priceRange}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f', padding: 16 },
  center: { flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 12 },
  search: { backgroundColor: '#1a1a2e', borderRadius: 10, padding: 12, fontSize: 16, color: '#fff', marginBottom: 16, borderWidth: 1, borderColor: '#2a2a3a' },
  card: { backgroundColor: '#14141f', borderRadius: 14, marginBottom: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#2a2a3a' },
  image: { width: '100%', height: 160 },
  info: { padding: 16 },
  name: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 4 },
  cuisine: { fontSize: 14, color: '#f97316', marginBottom: 4 },
  meta: { fontSize: 13, color: '#888' },
});
