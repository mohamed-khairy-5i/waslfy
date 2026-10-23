/**
 * تطبيع النص العربي — بيدوم طوله 1:1 مع النص الأصلي قدر الإمكان
 * (عن طريق map من index التطبيع إلى index الأصلي) عشان نقدر نرجّع
 * القيم المستخرَجة بالرسم الأصلي زي ما العميل كتبها.
 *
 * ملاحظة مهمة: ى متبيتحولش لـ ي — عشان "على" (حرف جر) تفضل مختلفة
 * عن "علي" (اسم علم) — ودي حاجة بتفرق فعلاً في أسماء العملاء.
 */

export interface NormalizedText {
  /** النص بعد التطبيع — ده اللي بنعمل عليه البحث */
  search: string;
  /** map[i] = index الحرف في النص الأصلي */
  map: number[];
  /** النص الأصلي زي ما هو */
  original: string;
}

const TASHKEEL_RE = /[\u064B-\u065F\u0670\u0640]/;
// zero-width + علامات الاتجاه RTL/LTR — شائعة جداً في رسائل واتساب
const INVISIBLE_RE = /[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/;

const CHAR_MAP: Record<string, string> = {
  'أ': 'ا',
  'إ': 'ا',
  'آ': 'ا',
  'ٱ': 'ا',
  'ؤ': 'و',
  'ئ': 'ي',
  'ة': 'ه',
  '،': ',',
  '؛': ';',
  '؟': '?',
  '–': '-',
  '—': '-',
  '−': '-',
  '\u00A0': ' ',
  'گ': 'ك',
  'چ': 'ج',
  'پ': 'ب',
  'ژ': 'ز',
};

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

function mapChar(ch: string): string | null {
  if (TASHKEEL_RE.test(ch) || INVISIBLE_RE.test(ch)) return null;
  const mapped = CHAR_MAP[ch];
  if (mapped !== undefined) return mapped === '' ? null : mapped;
  const ai = ARABIC_DIGITS.indexOf(ch);
  if (ai >= 0) return String(ai);
  const pi = PERSIAN_DIGITS.indexOf(ch);
  if (pi >= 0) return String(pi);
  return ch.toLowerCase();
}

export function normalizeText(original: string): NormalizedText {
  let search = '';
  const map: number[] = [];
  const src = original ?? '';
  for (let i = 0; i < src.length; i++) {
    const out = mapChar(src[i]);
    if (out === null) continue;
    search += out;
    map.push(i);
  }
  return { search, map, original: src };
}

/** بيرجّع الجزء المقابل من النص الأصلي (بالرسم الأصلي). */
export function originalSpan(
  n: NormalizedText,
  start: number,
  end: number,
  source?: string
): string {
  if (end <= start || n.map.length === 0) return '';
  const s = Math.max(0, Math.min(start, n.map.length - 1));
  const e = Math.max(0, Math.min(end - 1, n.map.length - 1));
  if (e < s) return '';
  const base = source ?? n.original;
  return base.slice(n.map[s], n.map[e] + 1);
}

/** تطبيع مبسّط للمقارنات (في الاختبارات والتقارير) — بدون map. */
export function normalizeSimple(s: string): string {
  let out = '';
  for (const ch of s ?? '') {
    const c = mapChar(ch);
    if (c !== null) out += c;
  }
  return out;
}

/** كلاس الحروف العربية للـ lookarounds. */
export const AR_LETTER = '[\\u0621-\\u064A]';
