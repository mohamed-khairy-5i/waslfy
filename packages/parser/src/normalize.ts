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

/** Arabic letter class used for word-boundary lookarounds. */
export const AR_LETTER = '[\\u0621-\\u064A]';
