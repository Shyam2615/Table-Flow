import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, useAuth } from './src/context/AuthContext';

import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import RestaurantsScreen from './src/screens/customer/RestaurantsScreen';
import RestaurantDetailScreen from './src/screens/customer/RestaurantDetailScreen';
import MyBookingsScreen from './src/screens/customer/MyBookingsScreen';
import MyOrdersScreen from './src/screens/customer/MyOrdersScreen';
import OwnerDashboardScreen from './src/screens/owner/DashboardScreen';
import OwnerMenuScreen from './src/screens/owner/MenuScreen';
import OwnerBookingsScreen from './src/screens/owner/BookingsScreen';
import OwnerOrdersScreen from './src/screens/owner/OrdersScreen';
import OwnerTablesScreen from './src/screens/owner/TablesScreen';
import OwnerWaitersScreen from './src/screens/owner/WaitersScreen';
import WaiterDashboardScreen from './src/screens/waiter/WaiterDashboardScreen';
import NewOrderScreen from './src/screens/waiter/NewOrderScreen';
import ActiveOrdersScreen from './src/screens/waiter/ActiveOrdersScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const screenOptions = { headerStyle: { backgroundColor: '#0a0a0f' }, headerTintColor: '#fff', headerTitleStyle: { fontWeight: '700' } };

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ ...screenOptions, headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function CustomerTabs() {
  return (
    <Tab.Navigator screenOptions={{ ...screenOptions, tabBarStyle: { backgroundColor: '#14141f', borderTopColor: '#2a2a3a' }, tabBarActiveTintColor: '#f97316', tabBarInactiveTintColor: '#666' }}>
      <Tab.Screen name="Restaurants" component={RestaurantsScreen} options={{ tabBarIcon: () => null }} />
      <Tab.Screen name="MyBookings" component={MyBookingsScreen} options={{ title: 'My Bookings', tabBarIcon: () => null }} />
      <Tab.Screen name="MyOrders" component={MyOrdersScreen} options={{ title: 'My Orders', tabBarIcon: () => null }} />
    </Tab.Navigator>
  );
}

function OwnerStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="OwnerDashboard" component={OwnerDashboardScreen} options={{ title: 'Dashboard' }} />
      <Stack.Screen name="OwnerMenu" component={OwnerMenuScreen} options={{ title: 'Menu' }} />
      <Stack.Screen name="OwnerBookings" component={OwnerBookingsScreen} options={{ title: 'Bookings' }} />
      <Stack.Screen name="OwnerOrders" component={OwnerOrdersScreen} options={{ title: 'Orders' }} />
      <Stack.Screen name="OwnerTables" component={OwnerTablesScreen} options={{ title: 'Tables' }} />
      <Stack.Screen name="OwnerWaiters" component={OwnerWaitersScreen} options={{ title: 'Waiters' }} />
    </Stack.Navigator>
  );
}

function WaiterStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="WaiterDashboard" component={WaiterDashboardScreen} options={{ title: 'Dashboard' }} />
      <Stack.Screen name="NewOrder" component={NewOrderScreen} options={{ title: 'New Order' }} />
      <Stack.Screen name="ActiveOrders" component={ActiveOrdersScreen} options={{ title: 'Orders' }} />
    </Stack.Navigator>
  );
}

function CustomerStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="CustomerTabs" component={CustomerTabs} options={{ headerShown: false }} />
      <Stack.Screen name="RestaurantDetail" component={RestaurantDetailScreen} options={{ title: 'Restaurant' }} />
    </Stack.Navigator>
  );
}

function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0f', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  if (!user) return <AuthStack />;

  switch (user.role) {
    case 'owner':
      return <OwnerStack />;
    case 'waiter':
      return <WaiterStack />;
    default:
      return <CustomerStack />;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
