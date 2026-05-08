# Sona Chandi — Mobile App

React Native (Expo) mobile app mirroring the web frontend exactly.

## Stack

- **Expo SDK 52** (React Native 0.76)
- **React Navigation v7** — Stack + Bottom Tabs
- **axios** — API calls with JWT interceptors
- **AsyncStorage** — Token & preference persistence
- **expo-image-picker** — Profile photo uploads
- **@expo/vector-icons** — Ionicons + MaterialCommunityIcons

## Setup

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with Expo Go (iOS/Android) or press `i`/`a` for simulators.

## Structure

```
src/
├── services/api.ts          # Axios instance (points to localhost:9999)
├── context/
│   ├── AuthContext.tsx      # JWT auth state + user profile
│   └── ThemeContext.tsx     # Dark/light + gender-based accent color
├── navigation/
│   ├── types.ts             # Navigation param types
│   └── AppNavigator.tsx     # Root → Auth Stack | Main Tabs + modals
├── theme/index.ts           # Colors, typography, spacing constants
├── utils/jwt.ts             # Safe JWT payload decoder
├── components/
│   ├── GlassCard.tsx        # Frosted glass container
│   ├── GoldButton.tsx       # Gold/outline/danger button variants
│   ├── FormInput.tsx        # Icon-prefixed text input
│   ├── AvatarImage.tsx      # Profile picture with initial fallback
│   └── LoadingScreen.tsx    # Full-screen loading state
└── screens/
    ├── auth/                # Login, Register, ForgotPassword, ResetPassword
    ├── DashboardScreen.tsx  # Stats + quick actions
    ├── SearchScreen.tsx     # User search with friend requests
    ├── GroupsScreen.tsx     # Squad management + game lobby
    ├── FriendsScreen.tsx    # Alliance + incoming requests
    ├── HistoryScreen.tsx    # Match history with drilldown tables
    ├── ProfileScreen.tsx    # Profile pic upload, privacy, theme toggle
    ├── GameArenaScreen.tsx  # Full real-time game (2s polling, heartbeat, roulette)
    └── admin/
        ├── AdminCardsScreen.tsx  # Card template CRUD
        └── AdminUsersScreen.tsx  # User management / purge
```

## API Configuration

Edit `src/services/api.ts` to change the `API_URL`:

```ts
const API_URL = 'http://localhost:9999'; // Change to your backend URL
```

For physical devices, replace `localhost` with your machine's local IP.

## Key Features

- **Real-time game arena** — 2s polling + 3s heartbeat + inactivity detection
- **Roulette animation** — First player selection on new games
- **Turn-based card play** — Select card → confirm pass to next player
- **Gender-based theming** — Blue (Male) / Pink (Female) / Gold (Other) accents
- **Admin screens** — Card template management + user registry/purge
- **Deep feature parity** — All web screens reproduced faithfully
