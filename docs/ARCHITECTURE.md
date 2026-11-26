# ARCHITECTURE
Browser (React/Vite) → Firebase Auth (ID token) → Backend REST `/api/v1/*` (token verified) → Firestore (data), Redis (cache/rate limit), LiveKit (media).
Streaming: Publisher requests `/api/v1/livekit/token` (role publisher) → joins LiveKit room → publishes camera+mic. Viewer requests token (subscriber) → autoSubscribe → TrackSubscribed → attaches video (muted element) and audio (separate `<audio>`), playback gated by user gesture (`room.startAudio()`).
Backend layers: routes → controllers → services → repositories (Firestore) + validators + middleware; providers for email/payment/wallet; sockets for chat.
Deployment (current): Docker Compose (backend, Redis, LiveKit). Production not yet defined.

## Data flows (implemented)
- Checkout: UI -> POST /orders (server prices from event) -> POST /payments -> provider page -> /checkout/status polls POST /payments/verify -> backend marks order paid and issues tickets (Admin SDK). Webhooks verified by HMAC signature, idempotent by provider event id.
- Entitlement: frontend asks GET /tickets/my-tickets; LiveKit tokens and chat endpoints enforce the same rule server-side (`livekitAccess.assertCanViewEvent`).
- Chat: REST + 4s polling; moderation endpoints require creator/moderator/admin role AND event ownership/moderator membership (checked in moderation.service).
- Notifications: GET /notifications, /unread-count, PUT /:id/read, /read-all.
## Security boundaries
Firestore rules: clients cannot create tickets, change own role/status. Backend is the only issuer of tickets and LiveKit tokens.
