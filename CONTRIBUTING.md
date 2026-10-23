# Contributing to Waslfy

Thanks for thinking about contributing — the project is small on purpose, so the fastest way to help is also the most valuable one.

## The highest-value contribution: failing messages

The parser is only as good as its corpus. If `extractShipment` gets a real message wrong:

1. Open an issue titled `corpus: <short description>`.
2. Paste the raw message text **redacted** (replace real names/phones with dummies, keep the structure).
3. Say what the correct extraction should be.

Your message becomes a corpus entry with an assertion — which means every future change is tested against your failure, forever. That's the whole engine of quality here.

## Local development

```bash
git clone https://github.com/waslfy/waslfy.git
cd waslfy
npm install

npm test          # parser: 7 tests over the 40-message corpus (must stay green)
npm run demo -- "الاسم: كريم - الجيزة - 01012345678 - كود 620"
npm run web:dev   # the Next.js app on :3000
```

## Ground rules

- **No silent values.** Any extractor change must preserve the `confidence/source` honesty contract. A change that "fixes" a case by guessing confidently will be rejected.
- **Address stays low-by-design.** `extractAddress` may improve its *informational* capture, but its confidence must not be inflated — Arabic addresses need human review.
- **Parser stays zero-dependency.** No runtime deps in `packages/parser`, ever. If you need a table (like cities), put it in `src/data/`.
- **Corpus changes require a rationale.** Adding a case: show the real-world shape it represents. Removing one: never.
- **Tests before features.** A PR that changes extraction behavior without a corpus-backed test will be asked to add one.

## Pull requests

1. Fork, create a branch from `main`.
2. Make your change; keep `npm test` green and add corpus coverage for any behavior change.
3. Keep the UI consistent with the existing identity (Cairo paper / pine / amber, RTL-first, IBM Plex Sans Arabic).
4. Open the PR with a short description of *why*, not just *what*.

## Reporting bugs & security

- Bugs: GitHub Issues with the redacted message + expected output.
- Security: this app is local-first by design — if you find anything that sends data off-device, that's a critical bug; please report it as an issue marked **SECURITY**.
