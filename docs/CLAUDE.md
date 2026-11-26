# CHANDARA — Project Instructions
Live sports streaming platform. Two repos (both should be PRIVATE):
- Frontend `chandara-vr` — React 18 + Vite + Tailwind, firebase 10, livekit-client 2.x, aframe (VR). Pages in `src/pages` (Publisher, Viewer, Watch, VRViewer, Admin/Streamer/User dashboards), API clients in `src/services`.
- Backend `chandara-backend` — Node + TypeScript, Express-style routes (`src/routes`), services/repositories/validators, Firestore, Redis, LiveKit, jest tests.
Local: frontend :5173, backend :3000, LiveKit ws://localhost:7880 (Docker Compose: backend, Redis, LiveKit).

## Commands
Frontend: `npm install`, `npm run dev`, `npm run build`. (`npm ci` fails: package-lock is out of sync — use `npm install`.)
Backend: `npm run dev | build | typecheck | test | lint`; `docker compose up -d`.

## Rules
- Never commit .env, service-account JSON, keys, or LiveKit secrets. Use `.env.example` placeholders.
- No mock payments. No force-push. Don't change working UDP/LiveKit settings without a verified reason.
- Verify real behaviour; hardware audio/camera needs a human test.

## Known pitfalls
- Never put React state in a track-attach effect's deps (cleanup runs on every change → detach/pause → `AbortError: play() interrupted`).
- Never `attach()` the local mic track to an `<audio>` element (feedback echo).
- Browsers block audio autoplay until a user gesture → keep the Enable Audio button, use `room.startAudio()`.
- Backend repo had hard-coded LiveKit secrets in `test-streaming.js` and `docker-compose.yml` (rotate; move to env).

## Frontend tests
`npm test` (vitest, jsdom). Firebase is globally mocked in `src/test/setup.js`. Services are mocked per test with `vi.mock`.
## More pitfalls
- Never read tickets from Firestore on the client for entitlement; use `services/entitlement.js`.
- Effects that disconnect on unmount must use refs, not state (stale closure leaks the LiveKit room).
- Express 4: async middleware must `next(err)`, not throw.
