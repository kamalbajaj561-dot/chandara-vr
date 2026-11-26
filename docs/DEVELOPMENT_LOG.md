# DEVELOPMENT_LOG
## 2026-11-23 — Audio reliability
- Root cause (viewer): `audioAttached` state in useEffect deps → cleanup (detach, pause) ran immediately after attach → play() aborted. Fix: deps `[audioTrack]` only; detach on cleanup.
- Root cause (echo): Publisher attached its own mic track to an `<audio autoPlay>` element. Fix: no local audio attach.
- Publisher stop/disconnect now `unpublishTrack(track, true)` + `stop()`.
- Files: chandara-vr/src/pages/Viewer.jsx, Publisher.jsx. Build: `vite build` OK. Hardware test pending.
- Secret scan: no .env/service-account files tracked; LiveKit secrets hard-coded in backend test-streaming.js and docker-compose.yml.

## 2026-11-24 — Security + platform pass
- LiveKit token route trusted client role/identity → added livekitAccess.ts (+tests). Files: routes/livekit.routes.ts, services/livekit.ts, types/index.ts.
- Role vocabulary mismatch (frontend admin/streamer/user vs backend administrator/creator/viewer) → normalizeRole in middleware/auth.ts.
- firestore.rules users.create allowed any role → restricted to 'user'.
- docker-compose.yml/test-streaming.js: removed hard-coded devsecret; required env vars; .gitignore hardened (service accounts, keys; package-lock now tracked in backend; .devin untracked in frontend).
- auth.service.ts: misplaced @ts-ignore replaced by `as jwt.SignOptions`; backend typechecks.
- Frontend lockfile regenerated: `npm ci` works. Publisher: device selection/toggles/errors/pagehide cleanup.
- Tests: livekit.test (real module + test keys), 3 notification repo suites (getter mocking) fixed. 45 failures remain (listed in PROJECT_STATUS).
- Commits (local only, push refused — GitHub app not installed): backend and frontend patches delivered as files.

## 2026-11-25
- Backend 45 test failures resolved: real defects (admin middleware user id, async middleware throwing, validator strictness) fixed in source; stale tests updated only where implementation is intentionally correct (rateLimit now asserts next(AppError 429)). Result 1324/1324. Commit 44c9028 on branch claude/complete-build (pushed).
- Frontend: forgot-password flow, Events page, Profile page, Firestore users rule hardening. Commit feec9f9 on claude/complete-build (pushed). Earlier commits: backend ec1d9a4, frontend 0ff77b5.

## 2026-11-26
- Frontend: checkout flow wired into EventDetails (old client-side ticket write removed); Orders, CheckoutStatus; Watch/VRViewer entitlement now via backend tickets (old Firestore buyerId query would have locked out paying users); fake viewer count + fake local chat removed; ChatPanel; NotificationBell + Notifications page; Viewer reconnect/ended states + fix: unmount cleanup captured stale `room` (null) so connections leaked; vitest + testing-library added (42 tests).
- Backend: chat routes now apply `requireEventAccess` (shared `assertCanViewEvent`) so paid-event chat needs a ticket; 6 tests. Total 1364 tests.
