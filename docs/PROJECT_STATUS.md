# PROJECT_STATUS (2026-11-26)
Branches `claude/complete-build` in both repos (main untouched). Built/tested in a cloud workspace; NOT run against live Docker/LiveKit/Firebase or real devices.

## Verified (actually run)
- Backend: `tsc --noEmit` + build OK; jest **103 suites / 1364 tests pass**.
- Frontend: `npm ci` + `vite build` OK; vitest **8 files / 42 tests pass**.

## Implemented
- Auth: register/login/logout, password recovery, Profile page, route guards (`components/RouteGuards.jsx`, tested), Firestore rules block self-promotion and self-unban.
- Events: discovery page (search, sport filter, Live/Upcoming/Completed), event details, free vs paid.
- Checkout: ticket quantity -> order -> payment -> backend verification -> tickets issued by backend only (clients cannot create tickets; rules `create: false`). Pending/failed/success states, Orders page (cancel/refund where status allows). Backend: payment flow, webhook signature + idempotency, fulfillment (tests exist). Dev provider 'mock' is DEV-only.
- Streaming: LiveKit token authorization (creator/admin publish, ticket for paid), device selection/mute, loopback removed, Viewer reconnect (3 retries w/ fresh token), Reconnecting/Stream ended/Removed states, room leak on unmount fixed.
- Chat: real chat panel on Watch page (polling 4s), send, creator/admin delete + mute; backend now requires a ticket for paid-event chat (read and write). Fake viewer counts and local-only fake chat removed.
- Notifications: page, unread badge in navbar, mark read / mark all read.
- Security: secrets removed from compose/test script, role mapping, admin middleware fix, async middleware error forwarding.

## NOT done / unverified
Landing-page visual redesign and design system; creator public pages, profile/artwork/event image upload UI; event edit UI review; admin dashboard rebuild (existing one unchanged: user/event lists), live-stream monitoring, reports; analytics dashboards (no new real-data screens); VR viewer reconnection; Publisher reconnection UX; real-time chat via sockets (polling used); viewer count (no real source wired — removed rather than faked); payment provider sandbox run and webhook delivery test; Firebase emulator rules tests; Docker/LiveKit integration; Playwright/browser console/mobile layout checks; frontend tests for creator event management and admin authorization.

## Owner actions
1. Rotate LiveKit key/secret and Redis password (were in public git history); set real `.env`. 2. Confirm repos PRIVATE. 3. Review/merge both `claude/complete-build` branches. 4. `firebase deploy --only firestore:rules` and test. 5. Provide payment-provider sandbox keys + webhook secret. 6. Real two-device test (audio, reconnection by toggling network, paid-event access, chat moderation).
