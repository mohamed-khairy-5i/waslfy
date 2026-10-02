/**
 * COD amount extraction. A bare number is NEVER accepted — an anchor word/currency
 * mark must be adjacent, otherwise we'd silently guess (forbidden by product rules).
 */
import type { Field } from '../types';
import { emptyField } from '../types';
import { prepare } from '../normalize';

const CUR = '(?:جنيه|ج\\.?\\s?م|ج(?![\\u0621-\\u064A]))';

const ANCHOR_WORDS =
  'المطلوب|الاجمالي|الإجمالي|اجمالي|كاش|تدفع|دافع|الدفع|التحصيل|مبلغ|هيدفع|هيكون|عند الاستلام|cod';

const pCurrencyAfter = new RegExp(`(\\d{2,6})\\s*${CUR}`);
const pCurrencyBefore = new RegExp(`${CUR}\\s*(\\d{2,6})`);
const pAnchorThenNum = new RegExp(`(?:${ANCHOR_WORDS})\\D{0,12}?(\\d{2,6})`);
const pNumThenAnchor = new RegExp(`(\\d{2,6})\\D{0,6}?(?:${ANCHOR_WORDS})`);

/** Years and sizes are not amounts. */
function implausible(n: number): boolean {
  return (n >= 1900 && n <= 2099) || n < 10 || n > 999999;
}

export function extractAmount(raw: string): Field<number> {
  const text = prepare(raw);
  const attempts: Array<{ re: RegExp; group: number; source: string }> = [
    { re: pCurrencyAfter, group: 1, source: 'currency-mark' },
    { re: pCurrencyBefore, group: 1, source: 'currency-mark' },
    { re: pAnchorThenNum, group: 1, source: 'anchor-word' },
    { re: pNumThenAnchor, group: 1, source: 'anchor-word' }
  ];

  for (const { re, group, source } of attempts) {
    for (const m of text.matchAll(new RegExp(re.source, 'g'))) {
      const raw = m[group as number];
      if (!raw) continue;
      const n = parseInt(raw, 10);
      if (Number.isNaN(n) || implausible(n)) continue;
      return { value: n, confidence: 'high', source };
    }
  }

  return emptyField<number>('none');
}
