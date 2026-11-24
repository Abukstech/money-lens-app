# Money Lens

Expo Router / React Native / TypeScript app for iOS and Android, using the sibling Money Lens NestJS API. The supplied Figma file guides the visual design. Original photos, title artwork, illustrations, and icons are bundled locally. See [the UI audit](docs/figma-ui-audit.md) for the implemented scope and remaining design differences.

## Run

Use Node 22.21+ and npm.

```sh
npm ci
cp .env.example .env
npm start
```

Open the project in an Expo Go client compatible with SDK 58, or create a development build. `npm run ios` opens an installed iOS simulator; `npm run android` opens an installed Android emulator. `npm run web` starts the PWA using the same mobile design.

## Web / PWA

The PWA uses the **same screens, photos, typography, colours, buttons, and flows as the mobile app**: photo onboarding, authentication, personalization, Home, PDF upload, and paginated transaction results. Below 768px it shows the mobile app. At 768px and above it shows an “Open Money Lens on your phone” message. This is a viewport breakpoint, not device detection; landscape phones and tablets at those widths also see the message. Native and web share the route files and screen components; there is no separate landing-page or desktop-dashboard design.

```sh
npm run web         # Local development
npm run build:web   # Production static website in dist/
npm run preview:web # Preview the export at http://localhost:8089
```

For release, set `EXPO_PUBLIC_API_URL` to the deployed HTTPS API (including `/api`) **before building**, and configure the published terms and privacy URLs. Add the exact website origin to the backend CORS allowlist. Host `dist/` at the domain root over HTTPS with extensionless HTML routes (`/auth` → `/auth.html`). The included `_headers` file supports hosts such as Netlify and Cloudflare Pages; configure equivalent headers elsewhere, especially `Cache-Control: no-cache` for `/sw.js`.

### Signed-in pages

Sign in at `http://localhost:8089/auth` on a mobile-width screen. Profile and Settings use the signed-in account, support first-name updates, sign-out and confirmed account deletion. The existing preview design is preserved. Old `/preview/*` URLs redirect to authenticated pages. See [Profile API status](docs/profile-api-status.md) for missing backend capabilities.

Money story, spending breakdown, review, Ask and history retain clearly labelled sample data from Figma until their financial integration is completed. Home upload and transaction results continue to use the real API.

The manifest provides home-screen installation through the browser menu (on iOS: Safari → Share → Add to Home Screen). Installation depends on browser support and HTTPS. No installation banner or extra navigation changes the existing app design. The production-only service worker caches a standalone offline page; authenticated pages, PDFs, transactions, and API responses are never cached, and uploads are not queued.

Browser sessions remain in memory: reloading or closing the app requires signing in again, even with Remember me selected. Onboarding completion is stored separately. Loaded statement results clear when the app reloads; the backend remains the system of record. Native refresh tokens continue to use the OS secure store.

Verify live email/authentication, PDF extraction, pagination, and installation on real iOS/Android browsers before launch. Backend, legal, and provider release prerequisites below still apply.

Set `EXPO_PUBLIC_API_URL` before starting Expo:

| Target | Local backend address |
| --- | --- |
| iOS simulator | `http://localhost:3000/api` |
| Android emulator | `http://10.0.2.2:3000/api` |
| Physical device | `http://<your-computer-LAN-IP>:3000/api` |

Both devices must be on the same network, and the backend port must be reachable. With no environment override, the app chooses the simulator address for the current platform. Restart Metro after changing environment variables. Use HTTPS for deployed environments; local HTTP device behavior can depend on the development client's network policy. A browser preview needs a backend with an explicitly allowed CORS origin.

## Backend setup

The backend is at `../money-lens-backend`. Its PostgreSQL setup, OCR provider configuration, and document-processing authorization requirements remain in its README.

```sh
cd ../money-lens-backend
npm ci
npm run db:generate
# Configure .env, then migrate your local development database:
node --env-file=.env node_modules/prisma/build/index.js migrate deploy
npm run build
node --env-file=.env dist/main.js
```

The mobile-auth migration adds profile fields, email verification challenges, and shared rate-limit buckets. Existing accounts can still sign in. New registration now requires an email verification grant; older clients calling `/auth/register` without a grant must be updated.

Set backend-only `RESEND_API_KEY` and `RESEND_FROM` to enable verification/reset emails. The sender domain must be verified in Resend. Without them, the app displays that email verification is unavailable; existing accounts can still sign in. No test codes or authentication bypasses are built into the app. Automated integration tests substitute a fake mail adapter and never send email.

## Included flows

- Splash and first-use photo onboarding, with manual swipe and Skip.
- Email → six-digit verification → password → first-name personalization.
- Sign-in, Remember me, password visibility, reset verification, and reset success sheet.
- Personalized Home, connected Profile and first-name editing, sign-out, and confirmed account deletion.
- PDF selection up to 20 MB, actual upload progress, processing, cancellation, errors, and retry with a new selection.
- Read-only, paginated transactions; incomplete extractions remain visibly marked. Amounts are formatted directly from decimal strings without conversion through floating-point numbers.

Onboarding completion is stored independently. Remembered native sessions persist only refresh tokens in the OS secure store. Access tokens stay in memory, refresh calls are serialized, and definitive session rejection clears credentials. If Remember me is off, credentials last only for the running app process. Registration remembers the session by default.

The server processes uploaded documents in memory. The app removes its picker-created cache copy after completion, cancellation, failure, or leaving the upload screen. The user's original file remains where they selected it. Transactions are not written to local persistent storage. Uploads are not automatically replayed after a network failure.

## Checks

```sh
npm run check               # TypeScript, ESLint, unit tests, native component tests
npx expo export --platform all  # iOS, Android, and web bundle validation
```

Backend checks:

```sh
cd ../money-lens-backend
npm run typecheck
npm run lint
npm run build
npm test
# Apply migrations to an isolated database first; never use production:
TEST_DATABASE_URL=postgresql://... npm run test:integration
# The email auth suite also uses TEST_DATABASE_URL:
TEST_DATABASE_URL=postgresql://... npx vitest run test/mobile-auth.test.ts
```

The native component tests cover authentication navigation and statement transfer/analysis states with fake API responses. Backend integration tests exercise real PostgreSQL transactions, verification limits, concurrent grant consumption, password reset, session revocation, and compatibility with existing accounts. Live email/OCR tests require credentials and are separate from the automated checks.

## Release prerequisites

- Replace the bundled Aeonik Pro trial preview fonts with licensed app/web font files before publication. Current typography uses Regular and Bold; Medium and Italic files have not been supplied.

- Configure live API URL, Resend credentials and verified sender, and authorized OCR provider settings.
- Set published `EXPO_PUBLIC_TERMS_URL` and `EXPO_PUBLIC_PRIVACY_URL`. Unconfigured legal links are visibly unavailable and must be replaced before release.
- Confirm the application identifiers in `app.json`, signing, icon/wordmark approval, and rights to use the supplied photos.
- Finish physical-device iOS/Android QA, including small screens, keyboards, offline recovery, document providers, reduced motion, and secure-store restoration.
- Google and Apple sign-in are not connected yet. Google and Apple use their official bundled logos. Both controls remain disabled, with their Soon labels removed. Ask, additional profile settings, transaction corrections, and financial insights are deferred.

Compatible dependency security updates have been applied. npm still reports upstream advisories in Expo/Metro/Jest transitive tooling with no compatible resolution advertised; do not use `npm audit fix --force`, which proposes downgrading Expo. Recheck the audit when upgrading the SDK.
