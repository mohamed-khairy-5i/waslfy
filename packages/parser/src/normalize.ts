/**
 * Arabic text normalization utilities.
 * Idempotent: normalize(normalize(x)) === normalize(x) — safe to run multiple times.
 */

const ARABIC_INDIC = '٠١٢٣٤٥٦٧٨٩';
const PERSIAN_INDIC = '۰۱۲۳۴۵۶۷۸۹';

/** Convert Arabic-Indic (٠-٩) and Persian (۰-۹) digits to Latin (0-9). */
export function toLatinDigits(s: string): string {
  return s.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, (d) => {
    const ai = ARABIC_INDIC.indexOf(d);
    if (ai !== -1) return String(ai);
    return String(PERSIAN_INDIC.indexOf(d));
  });
}

/**
 * Normalize Arabic letters for matching (NOT for display):
 * - remove tashkeel + tatweel
 * - remove zero-width chars and RTL/LTR control marks (very common in chat text!)
 * - unify hamza forms, taa marbouta, alef maqsura, ya/hamza carriers
 */
export function normalizeArabicLetters(s: string): string {
  return s
    // tashkeel + tatweel + superscript alef
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    // zero-width chars + bidi embedding/override marks
    .replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي');
}

/**
 * Full "keep structure" normalization used to prepare a message once before extraction:
 * letters unified, digits latin, latin lowercased, spaces/tabs collapsed, newlines kept.
 */
export function prepare(raw: string): string {
  return toLatinDigits(normalizeArabicLetters(raw ?? ''))
    .toLowerCase()
    .replace(/[ \t\u00A0]+/g, ' ');
}

/** For side-by-side comparison in tests/reports (also collapses newlines). */
export function loose(s: string): string {
  return prepare(s).replace(/\n+/g, ' ').trim();
}

/**
 * Build the prepared (normalized) form of `raw` together with a char map from
 * prepared indices back to raw indices. The prepared output is IDENTICAL to
 * prepare(raw) — the map is what lets us recover original casing/spans.
 */
export function buildCaseMap(raw: string): { prepared: string; map: number[] } {
  const src = raw ?? '';
  let prepared = '';
  const map: number[] = [];
  let inSpace = false;
  for (let i = 0; i < src.length; i++) {
    let ch = src[i];
    // deletions: tashkeel, tatweel, superscript alef, zero-width + bidi marks
    if (/[\u064B-\u065F\u0670\u0640\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/.test(ch)) continue;
    // 1:1 letter unification (same rules as normalizeArabicLetters)
    if ('أإآٱ'.includes(ch)) ch = 'ا';
    else if (ch === 'ى') ch = 'ي';
    else if (ch === 'ة') ch = 'ه';
    else if (ch === 'ؤ') ch = 'و';
    else if (ch === 'ئ') ch = 'ي';
    else {
      const ai = ARABIC_INDIC.indexOf(ch);
      if (ai !== -1) ch = String(ai);
      else {
        const pi = PERSIAN_INDIC.indexOf(ch);
        if (pi !== -1) ch = String(pi);
      }
    }
    // space collapse (same class as prepare)
    if (ch === ' ' || ch === '\t' || ch === '\u00A0') {
      if (inSpace) continue;
      inSpace = true;
      ch = ' ';
    } else {
      inSpace = false;
    }
    prepared += ch.toLowerCase();
    map.push(i);
  }
  return { prepared, map };
}

/**
 * Given a value extracted from prepare(raw), return the corresponding slice of
 * the ORIGINAL text — so Latin names/addresses keep their original casing and
 * displayed values never look mangled. Falls back to the prepared value when
 * the exact slice can't be located (e.g. after aggressive cleanup).
 */
export function restoreCase(raw: string, value: string): string {
  if (!value) return value;
  const { prepared, map } = buildCaseMap(raw);
  const start = prepared.indexOf(value);
  if (start === -1) return value;
  const rawStart = map[start];
  const rawEnd = map[start + value.length - 1] + 1;
  return (raw ?? '').slice(rawStart, rawEnd);
}

/** Arabic letter class used for word-boundary lookarounds. */
export const AR_LETTER = '[\\u0621-\\u064A]';
