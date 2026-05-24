# TableFlow React Native App

React Native (Expo) version of the TableFlow restaurant management platform.

## Prerequisites

- **Node.js** (v18+)
- **Expo CLI**: `npm install -g expo-cli`
- **Android Studio** (for Android SDK) OR **Expo Go** app on your phone
- **Backend running** on your machine at `localhost:5000`

## Setup

```bash
cd tableflow_app
npm install
```

## Configure Backend URL

Edit `src/api.js` — change `BASE_URL` to your computer's local IP if testing on a physical phone:

```js
const BASE_URL = 'http://YOUR_COMPUTER_IP:5000/api';
```

On Android emulator, `10.0.2.2` maps to your host machine automatically.

## Run on Phone (Expo Go)

1. Install **Expo Go** from Play Store on your phone
2. Make sure your phone and computer are on the same WiFi
3. Run:
   ```bash
   npx expo start
   ```
4. Scan the QR code with Expo Go

## Build APK (standalone installable)

### Option 1: EAS Build (recommended, free)

1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```

2. Login to Expo:
   ```bash
   eas login
   ```

3. Configure build:
   ```bash
   eas build:configure
   ```

4. Build APK:
   ```bash
   eas build -p android --profile preview
   ```
   This builds an APK (not AAB). Download from the Expo dashboard.

### Option 2: Local APK with Expo (no EAS account)

```bash
npx expo run:android
```
This requires Android Studio with an Android SDK set up. The APK will be at:
`android/app/build/outputs/apk/debug/app-debug.apk`

### Option 3: APK via expo-cli (simplest)

```bash
npx expo build:android -t apk
```
Follow the prompts. This uploads to Expo's servers and builds remotely.

## Backend Connection

The app connects to your backend at `http://10.0.2.2:5000/api` (Android emulator) or `http://localhost:5000/api` (iOS simulator). For a physical phone, use your computer's local IP address.

Make sure the backend is running:
```bash
cd ../backend
npm run dev
```

## Features

- **Customer**: Browse restaurants, book tables, view orders
- **Owner**: Dashboard, menu, bookings, orders, tables, waiter management
- **Waiter**: Dashboard, place orders, manage active orders
