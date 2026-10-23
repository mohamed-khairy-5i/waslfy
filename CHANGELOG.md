# Changelog

All notable changes to Waslfy are documented here. Format based on [Keep a Changelog](https://keepachangelog.com/), versioning follows [SemVer](https://semver.org/).

## [0.1.1] — 2026-10

### Fixed — parser (`waslfy-parser@0.1.1`)
- **label-bleed**: bare labels with empty values (`الاسم:\nالتليفون:\nالعنوان:`) no longer leak the next label word as an extracted name — definite-article field keywords (`التليفون`، `الكود`، `المبلغ`…) added to STOPWORDS/FIELD_KEYWORDS, closing capture zones for name/address/amount alike
- 3 regression tests added; corpus accuracy stays **40/40 (100%) on all five fields**

### Changed — CI/CD
- workflows: `npm ci` + npm cache everywhere; wrangler pinned to v4 in the Cloudflare Pages job (a transient Cloudflare 10500 flake had failed one deploy; token + project were verified healthy)

### Added — release & landing (M7.1)
- first tagged release [v0.1.1](https://github.com/mohamed-khairy-5i/waslfy/releases/tag/v0.1.1) — validated the automated npm publish pipeline (version-guard skip path, green run)
- demo GIF in README (recorded from the live app) + 1200×630 OG/Twitter card image (`og-image.png`) wired into app metadata

## [0.1.0] — 2026-10

### Added — parser (`waslfy-parser@0.1.0`)
- Core extraction engine: `extractName`, `extractPhones`, `extractGovernorate`, `extractAddress`, `extractAmount`, and the aggregate `extractShipment`.
- `StoredField` contract everywhere: `{ value, confidence, source, alternatives?, confirmed }` — the "no silent values" rule.
- Arabic normalization: hamza variants, ta-marbuta/alef-maksura folding, Arabic-Indic numerals (٠١٢٣ → 0123), diacritics/tatweel stripping.
- Governorate matching: 27 governorates + aliases, Levenshtein distance ≤ 2 for fuzzy hits, city→governorate map ( Mansoura→الدقهلية, المهندسين→الجيزة, المعادي→القاهرة, … ).
- Egyptian phone detection: `(\+?20|0020)?01[0125]\d{8}` + multiple-candidate support.
- COD amount extraction: جنيه/ج/جم/EGP/كاش/COD patterns.
- Public corpus: 40 real-shaped Egyptian messages (MSA, dialect, English, Arabic-Indic numerals, one-liners, no-amount edge case) + `accuracy.test.ts` asserting live accuracy in CI.
- CLI demo: `npm run demo -- "رسالة"`.
- Zero runtime dependencies; ESM + CJS + types via tsup.

### Added — web app (`apps/web`)
- Paste-to-extract live view with per-field confidence badges and extraction-source transparency.
- Local-first persistence: IndexedDB via Dexie — survives refresh, zero server.
- Editable shipment cards with mandatory human confirmation for low/empty fields.
- A6 packing-slip printing with hand-rolled Code128 barcode (SVG, zero deps); batch printing for confirmed shipments; print-blocking gate with explicit missing-field reasons.
- Excel export with carrier templates + custom columns (phones exported as text); export-blocking uses the same gate.
- Backup/restore: JSON export + smart-merge import (newest-wins; stale backups can't clobber newer work).
- Arabic normalized full-text search across all shipments.
- UI v2: Cairo-paper identity (warm paper, pine green, amber), IBM Plex Sans Arabic, receipt-style extraction ticket with perforation, RTL-first, responsive down to 390px.
- **Offline PWA (M5)**: installable via web manifest (RTL, standalone, maskable icon); hand-rolled path-safe service worker — network-first navigation with offline shell fallback, cache-first immutable `_next/static` assets and self-hosted fonts; amber "ثبّت التطبيق" pill via `beforeinstallprompt`; service worker registers in production builds only, so `next dev` stays cache-free.

### Metrics
- Live accuracy on the public corpus: **100% on all five fields (40/40)** — address is low-confidence by design with informational extraction rate reported.
