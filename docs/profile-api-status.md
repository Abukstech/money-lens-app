# Profile integration

The Profile and Settings screens retain the existing preview layout, Aeonik fonts, artwork, cards, navigation and sheets. They now require the existing signed-in session. Old `/preview/*` links redirect to the corresponding authenticated page; there is no public preview mode.

## Connected contracts

Verified against `../money-lens-backend/src/auth/auth.controller.ts` and `auth.dto.ts`:

| Action | Existing endpoint | Contract |
| --- | --- | --- |
| Read profile | `GET /api/auth/me` | Bearer access token; returns `userId`, `email`, `firstName`, `emailVerifiedAt` |
| Save first name | `PATCH /api/auth/me` | Bearer access token; body contains **only** `firstName`, trimmed, 1–80 characters, no control characters; returns updated profile |
| Sign out | `POST /api/auth/logout` | Body contains the current `refreshToken`; local credentials are cleared even if the server cannot be reached |
| Delete account | `DELETE /api/auth/account` | Bearer access token; local credentials clear only after successful deletion |

Profile reload errors offer retry while preserving the last known identity. Name-save and deletion failures retain the current account and show an error. Sign-out and deletion require confirmation using the existing sheet. If server sign-out fails, the auth screen explains that sign-out was local only.

## Missing backend capabilities

These are absent contracts, not confirmed failures of the existing endpoints. No speculative API calls were added.

| Existing UI | Backend work needed before enabling it |
| --- | --- |
| Email address editing | Verified email-change flow, uniqueness checks and corresponding profile update contract |
| Phone number | User field, validation/verification policy, read/update contract |
| Profile photograph | Upload/remove endpoint and avatar URL in the profile response |
| Notification switches | Persisted preferences and authenticated read/update endpoint; delivery registration as appropriate |
| Change password | Authenticated password-change endpoint with current-password verification and session policy; the existing public recovery flow uses an email verification grant |
| Connected accounts | Provider authentication, linked-account listing and link/unlink endpoints |
| Privacy preferences | Defined preferences and authenticated read/update endpoint |
| Report an issue | Support destination or issue submission endpoint |

The user model stores a first name, not a full name. The editable field is labelled accordingly. Unsupported controls remain in their existing design and are disabled; no fake phone number, photo or saved preferences are displayed.

Terms, privacy policy and support links use `EXPO_PUBLIC_TERMS_URL`, `EXPO_PUBLIC_PRIVACY_URL` and `EXPO_PUBLIC_SUPPORT_URL`. They remain unavailable until configured.

## Scope and verification

Financial story, Ask, history and review retain sample data with a visible sample-data notice. This change does not connect those financial flows. Home upload and transaction results keep their existing integration.

Automated tests use fake transports and account-service mocks to verify profile contracts, state updates, failures, retry, confirmation and session races. They do not delete or modify a real account. Web sessions currently stay in memory and require signing in after a full page reload; native remembered sessions continue to use secure storage.

Validation on 2026-10-26: typecheck, lint and all 40 tests pass; web/iOS/Android export succeeds. A temporary visual fixture checked the existing Profile and Settings components at 390px and 320px, with no horizontal overflow or missing images. Its source and authentication-free fixture are excluded from the final export. `profile-connected-mobile.png` shows fixture identity data. The rebuilt app on port 8089 redirects unauthenticated Profile and legacy preview/Profile links to sign-in. The local backend health check returns 200; `/api/auth/me` without a token returns the expected 401. Authenticated live account mutations were not performed during verification.
