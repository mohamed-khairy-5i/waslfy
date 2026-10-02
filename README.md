# Waslfy

> Paste a chat message → get a ready-to-print shipping label. Built for Egyptian online sellers.

**وصللي** — أداة محلية بالكامل (offline-first PWA) بتحوّل رسائل الطلبات من فيسبوك/واتساب لبوليصة تغليف جاهزة للطباعة وملف Excel للرفع الجماعي على شركات الشحن.

## Packages

| Package | Description |
|---|---|
| `packages/parser` | `waslfy-parser` — zero-dependency Arabic/Egyptian order-message extraction engine |
| `packages/web` | The PWA (coming in M2) |
| `packages/worker` | Optional Smart-Mode proxy (Cloudflare Worker, coming in M6) |

## Quick start

```bash
npm install
npm test          # run the parser test suite + accuracy report
npm run demo -- "الاسم: محمود السيد العنوان: 15 شارع البحر دمنهور البحيرة الهاتف: 01012345678 المبلغ 350 جنيه كاش"
```

## Status

- [x] M0 — Monorepo scaffold + CI
- [x] M1 — Extraction engine + 30-message test corpus + accuracy report
- [ ] M2 — PWA shell + local persistence
- [ ] M3 — A6 label printing + barcode + archive
- [ ] M4 — Excel export templates + JSON backup
- [ ] M5 — Full offline mode
- [ ] M6 — Smart Mode (optional AI assist) + deployment
- [ ] M7 — Launch

See `docs/BLUEPRINT.md` for the full technical blueprint (in Arabic).
