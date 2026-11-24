# Money Lens landing page artwork

Original images and SVGs downloaded from the Figma design context for frame `532:759`, inside the supplied Landing Page section `581:2028`.

Source: https://www.figma.com/design/5QtCax5pSzacafM8l464qp/Money-Lens?node-id=581-2028

The assets are bundled locally. No temporary Figma URLs are used at runtime. `src/components/landingAssets.ts` records the original SVG root dimensions; `LandingImage` scales their containing views without rewriting their paths or root dimensions. On native platforms SVG text is read from the downloaded local Expo asset; web uses the bundled SVG directly.

The three hero phone photographs retain the crop transforms returned by Figma. `Screen14Pro` and `Screen14Pro1` are the upload and Ask screen images inside the device frames. `Frame2147226693` is the middle about-card photo, and `Frame2147226704` is the footer background; both use the design's cover fit. `Subtract` and `Subtract1` are the original expandable FAQ folder backgrounds. The other assets retain their Figma-generated names and positions.

The screen is implemented with React Native views and text in `src/screens/Landing.tsx`; the Figma screenshot is a verification reference only and is not an app asset.
