# Tile Catalogue

A local, sample-data foundation for a tile catalogue SaaS. Built with genuine Next.js App Router, React, strict TypeScript, Tailwind CSS and Lucide icons. The application interface uses black, white and neutral greys; sample material textures retain their natural tones.

## Run locally

Use Node.js 22.18 or newer (for the built-in TypeScript test runner) and npm. Install with `npm ci`, then run `npm run dev` and open http://127.0.0.1:3000/products. For a production preview, run `npm run build` followed by `npm start`.

Scripts: `dev`, `build`, `start`, `typecheck`, `lint`, and `test`. The production build uses the supported Webpack compiler because Turbopack worker creation is restricted in this environment. Use only npm; package-lock.json pins dependency versions.

## This milestone

- Responsive workspace shell, mobile navigation, development identity and demo indicator.
- 20 varied sample designs with multiple technical variants and tile faces.
- Name/code search; combined size, collection, surface and status filters; reset; ascending/descending design sorting; eight products per page; empty results.
- Search, filters, sorting and pagination live in URL parameters, supporting refresh and browser history.
- Individual selection and select-all apply to visible rows only. Selection clears whenever the URL view changes. No selection persists across reloads.
- Read-only native dialog with images, variant specifications and media availability. Escape closes it, focus is trapped by the browser and restored to the opening control.
- Shared upcoming-milestone page for Catalogue Builder and Catalogue History.

## Structure

- `src/app`: server route components, layout and global monochrome tokens.
- `src/components/layout`: responsive application shell.
- `src/components/ui`: button and badge primitives.
- `src/features/products`: domain types, repository, query logic, interactions and tests.
- `src/config`: product name and navigation labels.
- `public/samples`: bundled original SVG texture illustrations, created for this demo.

## Data and media

`listProducts()` in the sample repository is the server-side data boundary. Replace its implementation with a backend query while preserving typed products or explicitly adapting backend records. For larger libraries, move filtering and pagination into the repository/server and retain URL query semantics.

Products represent design identity. Variants hold dimensions in millimetres, surface, thickness and body. Tile faces are distinct from other media roles. Preview URLs and original asset URLs are separate: original-resolution URLs are null because none were supplied.

The reference ZIP contains screenshots, not reusable product photography. Demo textures are labelled illustrations and repeat across a design's faces; they are not photographs or production assets. Room previews show an honest “None” state. No reference logos, personal information or proprietary artwork is copied.

## Limits and next milestone

No authentication, database, uploads, product editing, client management, permission enforcement, billing, analytics, PDF service or showroom animations. Data is illustrative and changes are not saved. Counts describe the sample library only. No deployment is configured or performed.

Next milestone: real product creation/editing and durable storage, with proper media ingestion. Keep future PDF rendering in a separate background service rather than ordinary web requests.

## Dependency audit

The initial audit reports a high-severity transitive `braces` issue through the development-only Next.js ESLint tooling (five affected package entries). The registry offers no compatible patch; its suggested downgrade to Next.js 14 tooling is intentionally not applied. Recheck before upgrading tooling. No runtime advisory was reported in this audit.
