# Figma UI alignment

Source: [Money Lens](https://www.figma.com/design/5QtCax5pSzacafM8l464qp/Money-Lens?node-id=196-379), reviewed 2026-10-25. The supplied node is the “Upload your statement” text layer; its surrounding Visual Design page contains the screen references.

## Applied to the existing app

- Onboarding: original photographs, image crop transforms, outlined title artwork, glass cards, social button geometry, slide indicators, clipped slide boundaries, and accessible paging.
- Authentication: original email, code, padlock, name and success illustrations; exact Financial Clarity artwork; shared field icons, back arrow, typography sizes, spacing, colors, and button sizes. The code entry retains one accessible input for six-digit paste/autofill and renders the two visual groups from the design.
- Home/upload: original folder, navigation, notification, upload, information, arrow, chevron, and delete artwork; matching heading scale, rounded upload cards, progress styling, navigation capsule, and sheet styling. Transaction results use rounded white cards while displaying the real API data.
- Google and Apple: transparent original marks from the Figma social components, without baked button backgrounds.

All artwork lives in `assets/figma/`, with layer provenance in its README. PNG artwork was exported directly from Figma with `contentsOnly: true` and sRGB colors. Images have local static references; temporary asset URLs are not used at runtime. Device status bars and home indicators remain native to the device.

## Intentional functional differences

- Email onboarding remains available because social authentication is not connected. A compact email link is retained in the onboarding card.
- The backend requires 12-character passwords and limits PDFs to 20 MB, so those values remain accurate instead of the design's sample 8-character/50 MB copy.
- Upload completion reflects actual transfer/processing state. Selecting a local file says “Ready to analyse.” Privacy and transaction-review copy describes implemented behavior.
- Account avatars use the signed-in user’s initial until an avatar API exists; the sample photograph is not presented as the real user.
- Aeonik Regular/Bold trial files are supplied locally. Medium is mapped to Regular because no Medium font file was supplied. Licensed app/web fonts, including Medium, are needed for final typography fidelity and release.

## Signed-in pages

The existing screen designs now live at `/story`, `/spending`, `/review`, `/ask`, `/history`, `/profile` and `/settings`, behind authentication. Legacy `/preview/*` links redirect to these pages.

Profile reads the real account, edits the first name, signs out and deletes the account through existing endpoints. Its layout, artwork, typography, cards, navigation and sheets are preserved. Settings without backend support keep their controls disabled. See [Profile API status](profile-api-status.md) for the contracts and remaining work.

Financial pages retain sample amounts and responses, with “Sample data · Analysis not connected” displayed. Review choices and history removal remain local; no financial API integration is implied.

## Validation

The original UI alignment was checked in browser at mobile sizes and exported for web/iOS/Android. Profile integration adds automated coverage for the signed-in identity, name saving, read-only unsupported fields, retry, logout/deletion confirmation and failures, and session races. Temporary visual fixtures must remain excluded from the release source and export.

## Updated money-story Home — 2026-11-01

Implemented the supplied section `399:412`, Home frame `480:1395`, in `src/screens/Story.tsx` at `/story`. The review frame in the same section retains its existing interactive implementation. The statement-upload Home and authenticated Profile remain connected as before.

The Home screen now uses the exact original texture and piggy-bank illustration, a compact payday-pattern card, the potential-savings card with the supplied copy, and a horizontal row of 162×186 snapshot cards with the original 32px icons. The See Pattern button opens the existing detail sheet. Artwork provenance is recorded in `assets/figma/README.md`. No Figma image is used as a screenshot of the entire interface.

Intentional differences: the real account uses initials until an avatar API exists; the period says “Sample analysis” and the footer identifies sample data because financial analysis is not connected. Medium remains mapped to the supplied Regular font file. The navigation stays fixed to the viewport rather than at the Figma canvas's absolute position. Device status bars and home indicators remain native. Shared category rows retain their existing component styling.

Verified at 390px and 320px widths: no page overflow, all new assets load with correct proportions, the pattern detail opens, and the next snapshot card remains discoverable through horizontal scrolling. `home-updated-mobile.png` is a browser capture using temporary fixture identity data; the fixture is removed from source and the release export.
