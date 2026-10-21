# Tile Catalogue

A local tile product library built with Next.js App Router, React and TypeScript. The interface is strictly monochrome; uploaded product images retain their original colours. The restored workspace design is preserved.

## Run locally

Use Node.js 22.18+ and npm. Run `npm ci`, then `npm run dev`. Open http://127.0.0.1:3000/products. Production preview: `npm run build`, then `npm start`. Build uses Webpack because this environment restricts Turbopack worker creation.

Checks: `npm run typecheck`, `npm run lint`, `npm test`.

## Product-management milestone

- Create, edit and duplicate designs; unique design codes and revision checks prevent accidental overwrites.
- Edit descriptions, tags, colour names, collections, status, and PDF/private preferences.
- Add multiple size, thickness, surface and body variants.
- Upload PNG, JPEG and WebP files up to 10 MB each as tile faces, room previews or closeups. Select a cover face, edit image descriptions, detach images and download originals.
- Search, sort, paginate and combine filters, including advanced variant and media filters. Variant criteria must match the same variant.
- Configure visible table columns, saved in this browser.
- Select visible rows and bulk change status or PDF/private preferences. Archive is reversible through status editing. Bulk changes are atomic.
- Export selected products or all filtered results to CSV, with one row per variant and spreadsheet formula protection.
- Inspect properties, technical variants and media in the detail dialog.

## Local persistence

Products are stored in `data/catalogue.sqlite` using Node's built-in SQLite driver; uploaded originals live in `data/media`. The data directory is ignored by Git. `TILE_DATA_DIR` can override its location. Twenty clearly labelled sample designs are seeded once. Refresh reads the latest saved library; saving checks revisions to detect concurrent edits.

Back up the entire data directory with the app stopped. Removing an attachment does not delete its original file. Cancelled uploads may also leave unattached files; automatic media cleanup is not implemented. Preview and original currently use the same file, so large libraries will need thumbnail processing and server-side pagination.

The reference ZIP supplies feature/layout references, not product photography. Bundled SVG textures are illustrations. No reference branding or personal information is copied.

## Scope

This is a local development workspace, not a deployed multi-tenant service. API mutations require the matching local browser origin. There is no authentication, user permission system, cloud storage, client management, billing or PDF generation yet. Private and Show in PDF are stored preferences for future sharing/catalogue features; they do not enforce access control. Catalogue Builder and Catalogue History remain upcoming milestones.

## Structure

`src/app/api` contains local product and image routes. `src/features/products` contains the SQLite repository, validation, query logic, editor, bulk tools, media views, CSV export and tests. `src/components` holds the shared shell and accessible native modal. `public/samples` contains sample textures.

## Validation

Automated checks cover persistence, unique codes, revision conflicts, atomic bulk edits, archive/restore, duplication, validation, image signatures, CSV protection and filtering. Tests use a separate temporary database.

The initial dependency audit reported a high-severity transitive `braces` issue through development-only Next.js ESLint tooling. No compatible patch was available at that audit; recheck when upgrading tooling. No runtime advisory was reported then.
