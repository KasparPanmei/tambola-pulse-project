# Tambola Pulse — Pre-deployment Audit

Audit date: 2026-10-23  
Scope: source/configuration review of the uploaded working tree. This is a static code review plus syntax/import checks, not a penetration test or production certification.

## Summary

### Fixed in this package

- Expanded `.gitignore` to ignore `.env` and `.env.*`, while explicitly allowing `.env.example` templates.
- Replaced the tracked server example's weak JWT secret and UPI value with placeholders. Configure real values only in local untracked files or hosting environment settings.
- Added startup validation requiring a unique JWT secret of at least 32 characters.
- Added basic security response headers, disabled `X-Powered-By`, limited JSON request bodies, and added dedicated IP rate limits for OTP request/verification.
- Added an upload rate limit and a 500 MB music-library storage cap, in addition to the existing 25 MB per-file limit.
- Changed production error responses to avoid returning exception details and preserved valid HTTP error status codes.
- Removed raw exception messages from API error responses in controllers.
- Validated phone formats against the formats actually accepted by the Twilio destination normalizer.
- Blocked new ticket holds/bookings after a room leaves `upcoming` state.
- Fixed admin start/pause routes: starting now enables the auto-caller and requires at least one confirmed paid booking; pausing uses `paused` and stops the auto-caller.
- Fixed admin room reset: clears game/prize state, expires unsubmitted pending bookings, refuses to reset while manual payments await review, releases temporary holds, and preserves tickets attached to confirmed paid bookings.
- Switched ticket-shuffle and ball-draw randomness to Node's cryptographic random generator; increased booking-reference entropy from 40 to 64 bits.
- Removed the unused, broken Razorpay webhook route/utility. The route imported an export that did not exist and was not mounted; this codebase's active payment flow is manual UPI verification.

## Findings that still need attention before public launch

### High priority

1. **Manual payment approval is not a MongoDB transaction.** The booking record and ticket records are updated in separate operations. A database/process failure between them can leave a paid booking with tickets still held, or inconsistent ticket state. Use a MongoDB transaction on a replica set/Atlas, or implement explicit compensation and reconciliation. Test duplicate admin approval clicks and forced database failures.
2. **Payment verification is manual by design.** The player-supplied UPI reference or confirmation is not proof of payment. Admins must independently verify the actual credit in the receiving bank/UPI app before approving. Consider duplicate transaction-reference detection and an audit log of who approved/rejected each booking.
3. **JWTs are stored in `localStorage`.** This makes tokens readable to any successful same-origin XSS. No direct unsafe HTML sink was found in the reviewed client source, but consider HttpOnly, Secure, SameSite cookies plus CSRF protections for a stronger production design.
4. **OTP limits are IP-based.** They do not independently limit attempts per phone number. Keep Twilio Verify service limits enabled and monitor abuse/costs; configure trusted-proxy settings according to the selected hosting provider so IP rate limits behave correctly.

### Medium priority / deployment constraints

5. **Music files are stored on the local filesystem.** On hosts with ephemeral disks, uploaded tracks can disappear after redeploy/restart. Use a persistent disk or object storage for production and include a cleanup/delete workflow.
6. **The game timer is in-process.** Run a single server instance for the game engine, or add a distributed lock/leader election before scaling to multiple replicas; multiple instances can draw balls too quickly even though the database update guards against drawing the same number twice.
7. **Upload validation is primarily extension-based.** Uploads are admin-only, size-limited, rate-limited, and stored under random filenames, but a stricter production implementation should validate actual audio signatures and scan uploads.
8. **Public room endpoints serialize the Room document.** They do not include user phone numbers, but should ideally return an explicit public-field allowlist rather than the full Mongoose document.
9. **The server's production CORS middleware is intentionally disabled.** The current client defaults to same-origin `/api`, so deploy client and server together on one origin. If hosting them separately, configure a strict allowlist for the actual frontend origin; do not use wildcard CORS with bearer tokens.
10. **Some legacy/unused code remains**, including `OtpChallenge` and the duplicate room-management functions in `roomController.js`; these should be removed or documented after confirming no external scripts rely on them.

## File-by-file review inventory

### Client source

| File | Review note |
|---|---|
| `client/src/main.jsx` | Route entry point; no direct security issue identified. |
| `client/src/index.css` | Styling only; no executable injection sink identified. |
| `client/src/lib/api.js` | Adds bearer token from `localStorage`; same-origin production API is assumed. |
| `client/src/lib/adminApi.js` | Adds admin bearer token from `localStorage`; token-storage risk noted above. |
| `client/src/components/AdminLoginModal.jsx` | OTP/admin login flow reviewed; backend role authorization remains authoritative. |
| `client/src/components/BackConfirmationGuard.jsx` | Browser-history handling reviewed; no direct injection sink identified. |
| `client/src/components/BottomNav.jsx` | Navigation/admin actions reviewed; privileged APIs are server-protected. |
| `client/src/components/CheckoutModal.jsx` | Checkout and booking requests reviewed; backend validates ticket ownership/availability. |
| `client/src/components/Countdown.jsx` | Countdown display logic; no security issue identified in static review. |
| `client/src/components/GameRoom.jsx` | Live game UI and API use reviewed; no `dangerouslySetInnerHTML`/`innerHTML` sink found. |
| `client/src/components/Header.jsx` | Presentational component; no security issue identified. |
| `client/src/components/JoinRoomModal.jsx` | Join request reviewed; backend checks authenticated user and matching phone. |
| `client/src/components/PaymentScreen.jsx` | Payment UI reviewed; UI confirmation is not payment proof; admin verification remains required. |
| `client/src/components/ThemeSelector.jsx` | Theme UI; no security issue identified. |
| `client/src/components/TicketCard.jsx` | Ticket display; no unsafe HTML sink identified. |
| `client/src/components/TicketGrid.jsx` | Ticket grid rendering; no unsafe HTML sink identified. |
| `client/src/components/TicketList.jsx` | Ticket list rendering; no unsafe HTML sink identified. |
| `client/src/components/admin/PaymentVerificationModal.jsx` | External link uses `rel="noreferrer"`; payment evidence must be independently verified. |
| `client/src/pages/Admin.jsx` | Large admin dashboard reviewed for API use and unsafe HTML sinks; privileged APIs are protected by server middleware. |
| `client/src/pages/Home.jsx` | Public room listing reviewed; no unsafe HTML sink identified. |
| `client/src/pages/RoomPage.jsx` | Room/join flow reviewed; backend enforces access. |

### Server source

| File | Review note |
|---|---|
| `server/src/server.js` | Security headers, body limit, rate limits, JWT startup validation, and production-safe error handling added. |
| `server/src/config/db.js` | Requires `MONGO_URI`; production database network access and credentials must be restricted. |
| `server/src/utils/auth.js` | JWT signing/verification; token lifetime is seven days. |
| `server/src/utils/adminAuth.js` | Now re-checks current database role so demoted admins cannot use an old token. |
| `server/src/utils/reference.js` | Booking-reference entropy increased; legacy OTP helper now uses cryptographic randomness. |
| `server/src/utils/tickets.js` | Ticket-strip generation reviewed; shuffle uses cryptographic randomness. |
| `server/src/utils/gameEngine.js` | Ball draw uses cryptographic randomness; in-process scheduler must not be replicated without coordination. |
| `server/src/utils/autoPrizeClaims.js` | Prize eligibility and paid/confirmed booking filters reviewed; reset clears claims and embedded prize state. |
| `server/src/controllers/authController.js` | OTP flow reviewed; phone format validation corrected; OTP rate limits added at route middleware. |
| `server/src/controllers/bookingController.js` | Holds, booking creation, payment submission/status, and room access reviewed; post-start sales blocked. |
| `server/src/controllers/adminController.js` | Admin room/ticket/payment operations reviewed; start/pause/reset behavior corrected; payment update atomicity remains. |
| `server/src/controllers/roomController.js` | Public room and player-state endpoints reviewed; duplicate admin operations are not mounted by current admin routes. |
| `server/src/controllers/ClaimController.js` | Admin-only claim management reviewed; controller error responses no longer expose raw exception messages. |
| `server/src/controllers/musicController.js` | Admin-only upload/library/playback reviewed; upload rate/storage limits added; local storage persistence remains a deployment concern. |
| `server/src/models/User.js` | Unique phone and role enum reviewed. |
| `server/src/models/Room.js` | Room state/prize/music fields reviewed; admin create-room input validation improved. |
| `server/src/models/Ticket.js` | Ticket status, ownership, and uniqueness indexes reviewed. |
| `server/src/models/Booking.js` | Payment and booking state model reviewed; multi-document consistency remains. |
| `server/src/models/PrizeClaim.js` | Unique room/prize/ticket index reviewed. |
| `server/src/models/MusicTrack.js` | Unique filename/URL metadata reviewed. |
| `server/src/models/OtpChallenge.js` | Not referenced by the active Twilio Verify flow; legacy model. |
| `server/src/routes/authRoutes.js` | Public OTP endpoints are protected by rate-limit middleware in `server.js`. |
| `server/src/routes/bookingRoutes.js` | Booking routes require authentication. |
| `server/src/routes/roomRoutes.js` | Public room routes and authenticated player state route reviewed. |
| `server/src/routes/adminRoutes.js` | Router-wide authentication and admin authorization; upload endpoint also rate-limited. |

### Root files and deployment configuration

| File | Review note |
|---|---|
| `.gitignore` | Expanded to ignore `.env.*` while allowing `.env.example`. |
| `server/.env.example` | Replaced secret-like example values with placeholders; never deploy this file as a real environment. |
| `client/.env.example` | Local development API example only; production client defaults to same-origin `/api`. |
| `package.json`, `package-lock.json` | Root build/start scripts reviewed. |
| `server/package.json`, `server/package-lock.json` | Unused Razorpay dependency removed from server manifest/lock. |
| `client/package.json`, `client/package-lock.json` | Client dependency/build configuration reviewed. |
| `client/vite.config.js` | Vite development configuration reviewed. |
| `client/index.html` | HTML entry point reviewed. |
| `README.md`, `DESIGN.md`, `TWILIO_SETUP.md` | Project and setup documentation reviewed for deployment assumptions. |

## Checks performed

- All 45 remaining JavaScript/JSX source files parsed successfully after the edits.
- All server `.js` files passed `node --check`.
- 12 key backend route/controller/utility modules imported successfully.
- Tambola strip generator passed 100 randomized checks for six tickets, 15 numbers per ticket, sorted columns, and complete unique coverage of 1–90.
- The original ZIP included Windows-targeted `node_modules`; the Linux build failed because platform-specific optional binaries were missing. This release archive excludes all `node_modules`; install dependencies from lockfiles on the deployment/build machine.
- A live npm vulnerability audit could not be completed because the package registry was unreachable in the audit environment. Run `npm audit` in both `server` and `client` from a networked machine before deployment.
- No live MongoDB, Twilio, payment-provider, concurrency, browser end-to-end, or penetration tests were run.

## Before deployment checklist

- [ ] Rotate any real credentials that were included in the uploaded working-tree ZIP; `.gitignore` does not remove them from ZIP archives.
- [ ] Configure production `JWT_SECRET` (unique, random, at least 32 characters), `MONGO_URI`, Twilio Verify credentials, UPI ID, merchant name, and admin WhatsApp number in hosting environment settings.
- [ ] Run `npm ci` in `server` and `client`; run `npm audit` in both; resolve high/critical findings.
- [ ] Build the client on the target build environment and run end-to-end tests.
- [ ] Test two users selecting the same tickets concurrently, duplicate payment approvals, reset during pending bookings, OTP abuse limits, and game pause/resume.
- [ ] Restrict MongoDB network access and credentials; use HTTPS; configure trusted proxy only according to the host's guidance.
- [ ] Configure persistent storage for music or move uploads to object storage.
- [ ] Keep one game-engine instance until distributed scheduling/locking is implemented.
