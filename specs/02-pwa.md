# PWA Specification

This document covers Progressive Web App capabilities, including the manifest, service worker, offline behavior, and installation experience.

---

## Current Status

The following PWA aspects are implemented or defined:
- **Offline data handling:** See [04-providers.md](./04-providers.md) for location caching
- **Orientation lock:** See [03-design-system.md](./03-design-system.md) for mobile orientation
- **Manifest + icons:** Configured via `vite-plugin-pwa` in `frontend/app.config.ts`
- **Theme color + manifest link + Apple touch icon:** Set in `frontend/src/entry-server.tsx`
- **Workbox runtime caching:** Google Fonts cache-first configured in `frontend/app.config.ts`

---

## Web App Manifest

### manifest.webmanifest
```json
{
  "name": "Waqt",
  "short_name": "Waqt",
  "description": "Collection of date and time widgets",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#000000",
  "theme_color": "#000000",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-maskable-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

### Required Icon Sizes
- **192×192** — Required for Android install
- **512×512** — Required for splash screens
- **Maskable 512×512** — For adaptive icons (Android)
- **180×180** — Apple touch icon (iOS)
- **Favicon** — 32×32 and 16×16

---

## Service Worker Strategy

### Tooling: `vite-plugin-pwa`
We will use **`vite-plugin-pwa`** to automatically generate the service worker.
- **Why:** Manual service workers cannot easily track hashed build assets (e.g., `assets/index.d8a7s.js`). The plugin automates this by injecting the exact build manifest into the service worker during the build process.
- **Mode:** `generateSW` (simplest for this use case) or `injectManifest` if custom logic is strictly needed. Given the requirements, `generateSW` is preferred unless we need complex runtime caching strategies beyond the defaults.

### Caching Strategy (via Plugin)
The plugin should be configured to:
1.  **Precache App Shell:** Automatically cache `index.html` and all generated JS/CSS/Font assets in the build.
2.  **Runtime Caching:**
    - **Google Fonts:** Cache-first.
    - **Images:** Cache-first.
    - **API (Geolocation/IP):** Network-only or Network-first (as defined in offline specs).

### Implementation Steps
1.  **Configure:** `vite-plugin-pwa` is already set up in `frontend/app.config.ts`.
2.  **Cleanup:** Ensure no manual `public/sw.js` is used (plugin handles SW).
3.  **Register:** Add explicit SW registration + update UX (ticket: `waq-05d0`).


### Offline Fallback
When offline:
- Shell loads from cache
- Clock continues using system time
- Sky renders using cached location/timezone
- Widgets show cached data or fallback messages

---

## Open Questions (TBD)

### Install Prompt
- [x] Should we show a custom install banner? **Yes.**
- [x] When to prompt? **First visit after 40 seconds.**
- [x] Dismiss behavior — **Show at most once per visit; if dismissed, show again on next visit after 40 seconds.**

### Push Notifications
- [x] Do we want prayer time notifications? **No for now.**
- [ ] How to handle notification permissions? (Defer)
- [ ] Notification content format? (Defer)

### Update Strategy
- [x] Update notifications: show a bottom banner when a new version is ready.
- [x] Refresh flow: user taps **Refresh** to reload the page and activate the new SW.
- [x] Offline ready: show a lightweight banner when assets are cached.

### Splash Screen
- [x] Custom splash screen design: **Primary background color + centered logo.**
- [x] Match the sky theme: **Use primary color (current theme background).**

### iOS Specific
- [x] Apple-specific meta tags needed? (Ticket: `waq-f22a`)
- [x] Status bar style (black-translucent)? (Ticket: `waq-f22a`)
- [x] Handle iOS PWA limitations? (Ticket: `waq-f22a`)

---

## Implementation Notes

### SolidStart PWA Setup
We have selected **vite-plugin-pwa** as the standard implementation.
- **Config:** Must be added to `app.config.ts` within the `vite` property.
- **Icons:** Ensure the manifest generation in the plugin config matches the existing `public/manifest.webmanifest` or points to it. preferably, let the plugin handle the manifest generation to ensure consistency, or explicitly include the `public` manifest in the context.

### iOS Web App Meta Tags
Add iOS-specific tags in `frontend/src/entry-server.tsx`:
- `apple-mobile-web-app-capable=yes` to allow standalone display.
- `apple-mobile-web-app-status-bar-style=black-translucent` so content can extend behind the status bar.
- `apple-mobile-web-app-title=Waqt` for the app name on the home screen.
- `apple-touch-icon` with a 180x180 PNG.
- `viewport-fit=cover` to allow full-bleed layouts on devices with notches.

### iOS Install Behavior + Limitations
- Install prompt: iOS does not support the `beforeinstallprompt` event, so we cannot trigger a native install prompt. Use the custom install banner to guide users to Share → Add to Home Screen.
- Browser support: iOS 16.3 and earlier only allow installation from Safari. iOS 16.4+ allows installation from the Share menu in Safari, Chrome, Edge, Firefox, and Orion.
- Standalone mode: Status bar styling only works when `apple-mobile-web-app-capable` is enabled.

### Testing PWA
- Chrome DevTools → Application → Manifest
- Lighthouse PWA audit
- Test offline mode via DevTools Network tab

---

## Future Considerations

- **Background sync** — Refresh prayer times when online
- **Periodic sync** — Update data daily in background
- **Share target** — Allow sharing to Waqt app
- **Shortcuts** — Quick actions from app icon
