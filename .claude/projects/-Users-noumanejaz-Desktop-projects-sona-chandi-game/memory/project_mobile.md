---
name: mobile_app_created
description: React Native mobile app built for sona-chandi-game project, mirroring the web frontend
type: project
---

A complete React Native (Expo SDK 52) mobile app was built in `/mobile/` mirroring the Next.js frontend exactly.

**Why:** User requested mobile version matching the existing responsive web frontend at `/frontend/`.

**How to apply:** When working on mobile-related tasks, the structure is in `/mobile/src/` with screens, components, context, navigation, theme, and utils subdirectories.

Key architecture decisions:
- React Navigation v7 with bottom tabs + native stack
- AsyncStorage for JWT/gender storage (replaces localStorage)
- `src/utils/jwt.ts` — safe JWT decoder (atob polyfill for RN)
- API URL hardcoded to `localhost:9999` in `src/services/api.ts` (same as frontend .env)
- All 13 screens implemented with full feature parity
- Game arena uses setInterval polling (2s) + heartbeat (3s) matching web
- Admin screens accessible via navigation.navigate('AdminCards') / ('AdminUsers') from Dashboard
