## UnlimitedHealthcare Mobile App Development Plan (React Native + Expo via Rork AI)

### Purpose and Goal
- **Primary goal**: Build a production-ready mobile application that strictly follows and fully utilizes the backend API specifications documented in `API_DOCUMENTATION.md`. Every feature, payload, and interaction must align with the backend’s Swagger/OpenAPI contract and implemented endpoints.
- **Scope**: Patient, provider/staff, and admin experiences that map 1:1 to the available backend endpoints. If a proposed feature is not present in the backend API, it will be categorized as “Backlog – requires backend endpoint” and excluded from the initial release.

### Tech Stack
- **Framework**: React Native (Expo) using Rork AI workflow
- **Language**: TypeScript (strict)
- **Navigation**: React Navigation
- **API**: OpenAPI-generated client (preferred) + React Query for data fetching/caching
- **Auth & Storage**: JWT (access/refresh), `expo-secure-store` for token persistence
- **Realtime**: `socket.io-client` (for notifications and any real-time channels exposed)
- **File Handling**: `expo-document-picker`, `expo-image-picker`, `react-native-webview` (for OHIF/DICOM viewer)
- **Forms & Validation**: `react-hook-form` + `zod`
- **UI**: A component library such as `react-native-paper` (or equivalent), icon set, and theme tokens
- **Location**: `expo-location`, optional geofencing via `expo-task-manager` + `expo-location`
- **Notifications**: In-app via WebSocket; optional OS push via `expo-notifications` (if/when backend supports push integration)
- **Testing**: Jest + React Native Testing Library; E2E via Detox or Maestro
- **CI/CD**: Expo EAS (build and OTA updates), release channels per environment

### Environment & Configuration
- Environments: development, staging, production
- Required runtime config (managed via Expo env):
  - `EXPO_PUBLIC_API_BASE_URL` (e.g., `https://api.example.com`)
  - `EXPO_PUBLIC_WS_URL` (e.g., `wss://api.example.com` if Socket.IO/WebSocket enabled)
  - Optional: `EXPO_PUBLIC_FILE_BASE_URL` if file URLs differ from API base
- Secrets (kept out of version control): store device-side tokens in `expo-secure-store`.

Example `.env` (do not commit real values):

```
EXPO_PUBLIC_API_BASE_URL=https://your-api
EXPO_PUBLIC_WS_URL=wss://your-api
```

### API Client Strategy (Strict Contract First)
1. Pull backend Swagger/OpenAPI JSON from the running backend.
2. Generate a fully typed TypeScript client:
   - Option A: `openapi-typescript` + `openapi-fetch`
   - Option B: `openapi-generator-cli` (typescript-fetch or axios)
3. Wrap generated client with a small API layer for:
   - Auth header injection (access token)
   - Automatic refresh token flow on 401
   - Error normalization to display consistent messages (as per backend error schema)
4. Use React Query for caching, retries, invalidations by tag per endpoint groups.

### Information Architecture & Navigation
- Root navigator with role-aware stacks:
  - Auth stack: Register, Login, Forgot Password (if implemented), Onboarding
  - Main tabs (role-based): Home, Appointments, Records, Notifications, Profile
  - Admin-only entries surfaced when `roles` includes `admin`
- Global screens for detail views (e.g., medical record detail, appointment detail)

### Security & Compliance (Mobile)
- Store tokens only in `expo-secure-store`.
- Enforce logout when refresh token fails.
- Respect server-side RBAC: hide UI for unauthorized operations; perform server checks regardless of UI state.
- Sanitize all inputs before submission; use schema validation.
- Avoid caching PHI beyond what’s necessary; provide explicit “clear cached data” control.
- Leverage HTTPS for all traffic; certificate pinning considered for production hardening.

### Feature Set (Aligned to Available Backend Endpoints)
The following features are in scope because they directly map to documented endpoints in `API_DOCUMENTATION.md`.

- Authentication
  - Register: `POST /auth/register`
  - Login: `POST /auth/login`
  - Logout: `POST /auth/logout`
  - Refresh: `POST /auth/refresh`
  - Current user: `GET /auth/me`

- Users
  - List users (admin): `GET /users`
  - Create user (admin): `POST /users`
  - Get user: `GET /users/:id`
  - Update user: `PATCH /users/:id`
  - Update profile: `PATCH /users/:id/profile`
  - Delete user (admin): `DELETE /users/:id`

- Patients
  - CRUD + self record: `POST/GET /patients`, `GET /patients/me`, `GET/PATCH/DELETE /patients/:id`
  - Visits: `POST/GET /patients/:id/visits`, `GET/PATCH/DELETE /patients/visits/:id`

- Medical Records (with Files, Versioning, Search)
  - CRUD: `POST/GET /medical-records`, `GET/PATCH/DELETE /medical-records/:id`
  - Files: upload/list/get/url/delete, DICOM→JPEG: `/medical-records/:id/files`, `/medical-records/files/:fileId`, `/medical-records/files/:fileId/url`, `POST /medical-records/files/:fileId/convert/jpeg`
  - Versioning: list/get/revert/compare: `/medical-records/:id/versions`, `/medical-records/versions/:versionId`, `POST /medical-records/:id/revert/:versionNumber`, `GET /medical-records/versions/:v1/compare/:v2`
  - Discovery & taxonomy: `GET /medical-records/search`, `/medical-records/tags`, `/medical-records/categories`, categories CRUD

- Appointments
  - CRUD + state transitions: `POST/GET /appointments`, `GET/PATCH/DELETE /appointments/:id`, `PATCH /appointments/:id/{confirm|cancel|complete}`
  - Types (per center): `GET/POST /appointments/types/center/:centerId`
  - Provider availability: `GET /appointments/availability/provider/:providerId`, `POST /appointments/availability`, `PATCH /appointments/availability/:id`
  - Time slots: `GET /appointments/slots/provider/:providerId`
  - Reminders: `GET /appointments/reminders/pending`, `PATCH /appointments/reminders/:id/sent`, `POST /appointments/reminders`
  - Recurring: `POST/PATCH/DELETE/GET /appointments/recurring/:id`
  - Analytics: `GET /appointments/analytics/:centerId`

- Reviews & Ratings
  - Reviews CRUD: `POST/GET /reviews`, `GET /reviews/:id`, `PUT /reviews/:id`, `DELETE /reviews/:id`
  - Responses: `POST /reviews/:id/response`
  - Public center summary: `GET /reviews/centers/:centerId/summary`
  - Analytics & trends: `GET /reviews/centers/:centerId/{analytics|trends}`

- Medical Reports
  - Generate: `POST /reports/generate`
  - Get: `GET /reports/medical/:id`
  - Export: `POST /reports/export`
  - Analytics: `GET /reports/analytics/:centerId`

- Notifications
  - List/unread count: `GET /notifications`, `GET /notifications/unread-count`
  - Create (if role-allowed): `POST /notifications`
  - Read status: `PUT /notifications/:id/read`, `PUT /notifications/mark-all-read`
  - Delete: `DELETE /notifications/:id`
  - Preferences: `GET/PUT /notifications/preferences`
  - Test delivery (role-allowed): `POST /notifications/test/:type`
  - Realtime: subscribe to user channel via WebSocket (client)

- External Integrations
  - Payments: `POST /integrations/payments/process`, `GET /integrations/payments/:id/status`
  - Insurance: `POST /integrations/insurance/verify`, `GET /integrations/insurance/:id/benefits`
  - Healthcare lookup: `POST /integrations/healthcare/lookup`
  - SMS: `POST /integrations/sms/send`, `GET /integrations/sms/:id/status`

- Location Services
  - Update location: `POST /location/update`
  - Nearby: `GET /location/nearby/:type`
  - Geofence (admin): CRUD under `/location/geofence`
  - History: `GET /location/history/:userId`

- Analytics & Audit
  - Audit logs (authorized): `GET /analytics/audit-logs`

- Health Check
  - `GET /health` used for client-side readiness checks

### UX & UI Design Principles
- Consistent, role-aware navigation and feature exposure
- Accessibility: proper contrast, dynamic font sizes, screen reader support
- Error handling aligned to backend error format (statusCode, message, error)
- Empty states, loading skeletons, optimistic updates where safe
- Media and large-file workflows resilient to backgrounding and network changes

### DICOM Viewer Approach (Client)
- Use the provided file URLs and conversion endpoints for previews (JPEG when needed).
- For advanced viewing, embed an OHIF web viewer via `react-native-webview`, pointing it at accessible (authenticated) file URLs.

### AI Nurse Chatbot Assistant (Backlog – conditional)
- Only in scope if/when a backend endpoint is provided for chat/completions and embeddings/vector search.
- Until then, the mobile app will surface a placeholder entry with “Coming soon” or be excluded from initial release.

### Center-to-Center Communication & Referrals (Conditional)
- If referral/chat/document-sharing endpoints are exposed (not listed in the current excerpt), the app will add dedicated flows. Otherwise, classify as backlog.

### Blood Donation System (Backlog – conditional)
- Pending availability of documented backend endpoints for donor forms, matching, verification, payments, and card generation.

### Development Process (Step-by-Step)
1. Project Setup
   - Initialize Expo (TypeScript), install dependencies, set up React Navigation, theming, and React Query provider.
   - Configure environment handling and secure storage.
2. API Contract Integration
   - Fetch Swagger JSON; generate typed client; implement auth interceptors and refresh logic.
3. Authentication & Session
   - Build Register, Login, Me, Logout; implement refresh token rotation; secure token storage; role hydration.
4. Global UI Scaffolding
   - Layout, theming, role-aware navigation, error toasts/snackbars, loading indicators.
5. Feature Modules (iterative)
   - Patients, Medical Records (+files/versioning/search), Appointments (+availability/recurring), Reviews & Ratings, Reports, Notifications (+WebSocket), Integrations, Location, Audit.
6. DICOM & File Workflows
   - Uploads, previews, JPEG conversion, OHIF WebView embedding.
7. Testing
   - Unit tests for hooks and components; integration tests for screens; E2E happy-paths.
8. Performance Hardening
   - Image/file caching, pagination, background fetch, bundle optimization.
9. Security Hardening
   - Sensitive data minimization, logout on token failure, jailbreak/root detection (if required), certificate pinning consideration.
10. Internationalization (optional)
   - i18n scaffolding; English baseline.
11. Release
   - EAS build pipelines, store metadata, privacy labels, release notes, OTA channels.

### Dependencies (Initial)
- Core: `react`, `react-native`, `expo`, `typescript`
- Navigation: `@react-navigation/native`, `@react-navigation/native-stack`, `react-native-screens`
- Data: `@tanstack/react-query`, `zod`, `react-hook-form`
- API: `openapi-typescript`, `openapi-fetch` (or `openapi-generator-cli` alternative)
- Auth/Storage: `expo-secure-store`
- UI: `react-native-paper`, `react-native-svg`
- Files/Media: `expo-document-picker`, `expo-image-picker`, `react-native-webview`
- Realtime: `socket.io-client`
- Location: `expo-location`, `expo-task-manager` (for geofencing tasks)
- Notifications (optional push): `expo-notifications`
- Testing: `jest`, `@testing-library/react-native`, `@testing-library/jest-native`, `detox` or `maestro`

### Milestones & Deliverables
- M0 – Project Bootstrap (Week 1)
  - Expo app scaffolded, env wired, API client generated from Swagger, CI with EAS
- M1 – Auth & Users (Week 2)
  - Register/Login/Logout/Me, role-aware navigation, user CRUD (admin views)
- M2 – Patients & Visits (Week 3)
  - Patient CRUD, visits CRUD, patient self record
- M3 – Medical Records (Week 4–5)
  - Record CRUD, files (upload/list/get/url/delete), DICOM→JPEG, versioning, search, tags, categories
- M4 – Appointments (Week 6)
  - CRUD + state changes, types per center, provider availability & slots, reminders, recurring, analytics
- M5 – Notifications (Week 7)
  - List, unread count, mark read/all-read, preferences, realtime channel; create/test (role-allowed)
- M6 – Reviews & Ratings (Week 8)
  - Reviews CRUD, responses, summaries, analytics, trends
- M7 – Reports (Week 9)
  - Generate, get, export, analytics
- M8 – Location Services (Week 10)
  - Update location, nearby, geofence (admin), history
- M9 – Analytics & Audit (Week 11)
  - Audit logs viewer (authorized roles)
- M10 – Hardening & Release (Week 12)
  - A11y, performance, security, E2E tests, App Store/Play Store submissions

Note: Items depending on currently non-documented endpoints (AI chatbot, blood donation, certain referral workflows) remain backlog until backend support is confirmed.

### Testing Strategy
- Unit: hooks (API, auth, forms) and UI components
- Integration: screen flows covering typical CRUD paths per module
- Contract: compile-time type safety via OpenAPI types; runtime validation on edge cases
- E2E: core happy-paths (auth, booking appointment, viewing records, notifications)

### Deployment & Release Management
- Build with EAS for Android and iOS
- Use release channels (dev/staging/prod) and OTA updates for non-native changes
- Align versions with backend releases when breaking API changes are introduced

### Acceptance Criteria (Definition of Done)
- All features listed above implemented using the exact backend endpoints and payloads
- All protected screens enforce JWT auth; refresh flow is reliable
- Error handling follows backend error schema consistently
- DICOM basic viewing (JPEG preview) working; OHIF via WebView available when networked
- React Query caches and invalidates correctly; offline-friendly where sensible
- Test suite green; E2E happy-paths pass; builds stable on target devices
- App Store and Play Store submissions ready with compliant metadata

### Expected End Result
- A fully functional, production-ready mobile application that aligns exactly with the backend API’s design and endpoints, delivering role-appropriate features for patients, providers/staff, and admins, with secure authentication, robust data handling, and a polished user experience.


