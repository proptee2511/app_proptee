# Proptee title, favicon and separate artwork

20 October 2026

Requested brand name: Proptee. Palette: lavender #C6A5FF with dark plum #302044.

## What changed and why

- Generated a standalone P/house icon image for the user as a visual brand concept. The browser asset is a small, clean SVG implementation of the same P/house direction, not a pixel-identical copy of that generated raster image.
- frontend/public/images/proptee-icon.svg: reusable vector logo and browser favicon. P has a house-shaped counter; readable silhouette and scalable sizing. No external image service is needed at runtime.
- frontend/public/favicon.svg: replaced the original scaffold favicon with the Proptee vector as a fallback for existing references.
- frontend/index.html: exact browser title Proptee and icon reference to /images/proptee-icon.svg.
- api/docs.html: Swagger browser title Proptee | Swagger and matching favicon.
- frontend/src/components/AuthLayout.tsx: visible brand now Proptee, using the separate icon file. Existing house illustration extracted from inline JSX into frontend/public/images/property-house.svg; login/register/forgot/reset continue sharing that illustration.
- frontend/src/index.css: illustration selectors now target img rather than svg, preserving existing sizes and responsive behavior.

## How to replace images manually

Replace images/proptee-icon.svg for the brand mark and favicon; replace images/property-house.svg for the shared authentication illustration. Keep the filenames to avoid editing component paths. These are separate assets by purpose. Unique artwork for each stage was not added: the current pages intentionally use one consistent shared house image.

Run npm run build from D:\CRM to update the frontend served by gateway. If the browser caches an old title/favicon, hard refresh or reopen the tab. Swagger HTML is read from disk on each request. Manual service startup remains unchanged; no servers were automatically launched or stopped for this branding task.

No database, authentication, passwords or API behavior changed. Generated image is supplied separately in chat; the production UI uses the local SVG assets.

Verification: npm run build passed (TypeScript + Vite). Both SVG assets are copied into frontend/dist/images by the build. Browser visual verification was not performed in this task.

## Login colour - 2026-10-25
Login uses #3C0C61 via the scoped .login-theme accent in frontend/src/index.css. AuthForm.tsx supplies this class only for login; AuthLayout.tsx accepts the optional className. Dark surfaces use white/light text for readability, with a darker hover state. Registration/recovery colours and image assets are unchanged. Build and lint passed; browser visual verification pending. See CHANGELOG.md for the task record.
