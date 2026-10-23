/**
 * استخراج مبلغ التحصيل (COD).
 * الأولوية: (1) كلمة مفتاحية + رقم — (2) رقم + عملة — (3) رقم وحيد أخير (fallback).
 * الأرقام اللي جوه أرقام الموبايل مستبعدة تماماً.
 */
import { NormalizedText } from '../normalize';
import { AR_LETTER } from '../normalize';
import { Field, mkField, emptyField } from '../types';
import { PhoneCore } from './phones';

const KW_RE = new RegExp(
  `(?<!${AR_LETTER})(?:المبلغ\\s*المستحق|الكود|التحصيل|المبلغ|المستحق|المطلوب|مطلوب|كود|كاش|مبلغ|تحصيل` +
    `|هتدفع|تدفع|هيسدد|يسدد|هتتحصل|تتحصل|cod|cash|amount)\\s*[:=\\-]*\\s*([0-9]{2,5})(?![0-9])`,
  'g'
);

/** المبلغ مكتوب بالكلمات — "كود الف" / "تحصيل نص الف" — شائع في العامية. */
const WORD_KW_RE = new RegExp(
  `(?<!${AR_LETTER})(?:الكود|المبلغ\\s*المستحق|التحصيل|المبلغ|المستحق|المطلوب|مطلوب|كود|كاش|مبلغ|تحصيل` +
    `|هتدفع|تدفع|هيسدد|يسدد|هتتحصل|تتحصل|cod|cash|amount)\\s*[:=\\-]*\\s*` +
    `(نص\\s*الف|الفين|الف|خمس\\s*الاف|خمس\\s*تالاف|عشرين\\s*الف|عشر\\s*الاف|عشر\\s*تالاف)(?!${AR_LETTER})`,
  'g'
);

function parseWordNumber(w: string): number | null {
  const t = w.replace(/\s+/g, '');
  if (t === 'نصالف') return 500;
  if (t === 'الف') return 1000;
  if (t === 'الفين') return 2000;
  if (t === 'خمسالاف' || t === 'خمستالاف') return 5000;
  if (t === 'عشرالاف' || t === 'عشرتالاف') return 10000;
  if (t === 'عشرينالف') return 20000;
  return null;
}

const SUFFIX_RE = new RegExp(
  `(?<![0-9])([0-9]{2,5})(?![0-9])\\s*(?:جنيه|جنيها|جم|كاش|كود|ج(?!${AR_LETTER})|egp|pounds?)(?!${AR_LETTER}|[a-z])`,
  'g'
);

const BARE_RE = /(?<![0-9])([0-9]{2,5})(?![0-9])/g;

const STREET_NUM_AFTER = new RegExp(`^\\s*(?:ش|شارع|عماره|شقه|بلوك|دور|منطقه)(?!${AR_LETTER})`);
const STREET_NUM_BEFORE = new RegExp(`(?:ش|شارع|عماره|شقه|بلوك|دور|منطقه)(?!${AR_LETTER})\\s*$`);

function overlaps(
  start: number,
  end: number,
  ranges: Array<{ start: number; end: number }>
): boolean {
  return ranges.some((r) => start < r.end && end > r.start);
}

export function extractAmountCore(n: NormalizedText, phones: PhoneCore): Field<number | null> {
  const s = n.search;

  // 1) كلمة مفتاحية + رقم
  KW_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = KW_RE.exec(s))) {
    const kwStart = m.index;
    const numStart = kwStart + m[0].indexOf(m[1]);
    const numEnd = numStart + m[1].length;
    if (overlaps(numStart, numEnd, phones.ranges)) continue;
    return mkField(parseInt(m[1], 10), 'high', 'regex');
  }

  // 1.5) كلمة مفتاحية + رقم بالكلمات ("كود الف جنيه")
  WORD_KW_RE.lastIndex = 0;
  while ((m = WORD_KW_RE.exec(s))) {
    const v = parseWordNumber(m[1]);
    if (v !== null) return mkField(v, 'high', 'regex');
  }

  // 2) رقم + عملة
  SUFFIX_RE.lastIndex = 0;
  while ((m = SUFFIX_RE.exec(s))) {
    if (overlaps(m.index, m.index + m[1].length, phones.ranges)) continue;
    return mkField(parseInt(m[1], 10), 'high', 'regex');
  }

  // 3) fallback: آخر رقم مش موبايل ومش رقم شارع — ثقة واطية
  BARE_RE.lastIndex = 0;
  let last: { v: number; start: number; end: number } | null = null;
  while ((m = BARE_RE.exec(s))) {
    const start = m.index;
    const end = start + m[1].length;
    if (overlaps(start, end, phones.ranges)) continue;
    const before = s.slice(Math.max(0, start - 14), start);
    const after = s.slice(end, end + 14);
    if (STREET_NUM_AFTER.test(after)) continue;
    if (STREET_NUM_BEFORE.test(before)) continue;
    last = { v: parseInt(m[1], 10), start, end };
  }
  if (last) return mkField(last.v, 'low', 'context');

  return emptyField<number | null>(null, 'regex');
}
