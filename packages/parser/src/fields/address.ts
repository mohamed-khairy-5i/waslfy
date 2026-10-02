/**
 * Address extraction — by product decision this is the least trusted field:
 * labeled addresses get medium, unlabeled segments get low, and anything
 * the parser can't anchor stays empty for the seller to fill manually.
 */
import type { Field } from '../types';
import { emptyField } from '../types';
import { prepare } from '../normalize';

const ADDRESS_LABEL =
  '(?:العنوان|عنواني|عنوان|عنوان البنايه|عنوان التسليم|address|addr)';

const ADDRESS_STOP =
  'هاتف|تليفون|موبايل|واتساب|واتس|whatsapp|mobile|phone|tel|رقم|مبلغ|كاش|جنيه|الاجمالي|cod|اسم|name';

const ADDRESS_ANCHORS =
  'شارع|عماره|عمارة|دور|شقه|شقة|حي|بلوك|فيلا|قدام|أمام|امام|جنب|خلف|مسجد|محطه|محطة|مدرسه|مدرسة|مستشفي|مستشفى|بنك|كافيه|كافيه|نادي|دوار|برج|امتداد|منطقه|منطقة|ساكن|ساكنه|مقيم|المنزل|عمارة|عقار|شارع|فوق|تحت';

function cutAtStop(s: string): string {
  // word-boundary safe: "الاسماعيليه" must NOT be cut by the stop word "اسم"
  const re = new RegExp(
    `(?<![\\u0621-\\u064Aa-z0-9])(?:${ADDRESS_STOP})(?![\\u0621-\\u064Aa-z0-9])[\\s\\S]*$`,
    'i'
  );
  return s.replace(re, '').replace(/\s+/g, ' ').trim();
}

export function extractAddress(raw: string): Field<string> {
  const text = prepare(raw);
  // 1) labeled: "العنوان: ..." — value is what the seller explicitly marked
  const labeled = new RegExp(`${ADDRESS_LABEL}\\s*[:：]?\\s*([^\\n]+)`, 'i').exec(text);
  if (labeled && labeled[1]) {
    const v = cutAtStop(labeled[1]);
    if (v.length >= 4) {
      return { value: v, confidence: 'medium', source: 'pattern:labeled' };
    }
  }

  // 2) anchor words inside a line (street/mosque/landmark vocabulary)
  const anchorRe = new RegExp(`(?:${ADDRESS_ANCHORS})`);
  for (const line of text.split('\n')) {
    const l = line.trim();
    if (!l || l.length < 6) continue;
    if (/^(?:السلام عليكم|سلام|مساء الخير|صباح الخير)/i.test(l)) continue;
    if (anchorRe.test(l)) {
      const v = cutAtStop(l);
      if (v.length >= 4) {
        return { value: v, confidence: 'low', source: 'context:anchors' };
      }
    }
  }

  return emptyField<string>('none');
}
