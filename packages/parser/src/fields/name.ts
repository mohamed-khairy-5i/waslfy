/**
 * Customer name extraction — the hardest field in Egyptian dialect messages.
 * Strategy cascade: explicit label → "انا X" pattern → clean short line.
 * Never high-confidence from a bare line: better to ask the seller than to guess.
 */
import type { Field } from '../types';
import { emptyField } from '../types';
import { prepare, restoreCase } from '../normalize';
import { extractGovernorate } from './governorate';

const NAME_LABEL =
  '(?:الاسم الكامل|الاسم|اسم العميل|اسم المشتري|اسم المستلم|اسمي|name)';

const STOP_AFTER_LABEL =
  'هاتف|تليفون|موبايل|واتساب|واتس|whatsapp|mobile|phone|tel|رقم|عنوان|العنوان|مبلغ|كاش|جنيه|الاجمالي|cod|\\n';

const HONORIFICS =
  /^(?:م\/|أ\/|د\/|د\.|الاستاذ|الأستاذ|استاذ|دكتور|حضرة|مدام|كابتن|عم\b|خالتو|توته)\s*/;

const TRAILING_STOP =
  /(?:عايز|عايزة|عايزين|محتاج|محتاجة|حابب|حابة|بص|يا|هيبقى|يكون|من|في|بتاع|بتاعي|المطلوب|كاش|جنيه|عنوان)\b/;

const ANA_NAME =
  /(?:انا)\s+([^\d\n]{2,28}?)(?=\s+(?:عايز|عايزة|عايزين|محتاج|محتاجة|حابب|حابة|بص|يا|هيبقى|من|في|عندي|دافع|هيدفع)|[،.!؟\n:]|$)/;

const AR_WORD = /^[\u0621-\u064A]+$/;

function cleanCandidate(raw: string): string {
  let s = raw
    .replace(new RegExp(`(?:${STOP_AFTER_LABEL})[\\s\\S]*$`, 'i'), '')
    .replace(/[،,:؛\-–—].*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
  // drop leading filler
  for (let i = 0; i < 3; i++) {
    s = s
      .replace(HONORIFICS, '')
      .replace(/^(?:بتاعي|بتاع|هو|هي|انا)\s+/, '')
      .trim();
  }
  // cut at trailing stop words
  const stop = s.search(TRAILING_STOP);
  if (stop > 0) s = s.slice(0, stop).trim();
  // keep at most 4 words
  const words = s.split(' ').filter(Boolean);
  return words.slice(0, 4).join(' ');
}

function isPlausibleName(s: string): boolean {
  if (!s || s.length < 2 || s.length > 32) return false;
  const words = s.split(' ').filter(Boolean);
  if (words.length < 1 || words.length > 4) return false;
  // at least one Arabic word; digits kill it
  if (/\d/.test(s)) return false;
  return words.some((w) => AR_WORD.test(w) || /^[a-z]+$/.test(w));
}

export function extractName(raw: string): Field<string> {
  const text = prepare(raw);
  const candidates: string[] = [];

  // 1) explicit label
  const labeled = new RegExp(`${NAME_LABEL}\\s*[:：]?\\s*([^\\n]+)`, 'i').exec(text);
  if (labeled && labeled[1]) {
    const c = cleanCandidate(labeled[1]);
    if (isPlausibleName(c)) {
      return { value: restoreCase(raw, c), confidence: 'high', source: 'pattern:labeled' };
    }
  }

  // 2) "انا X ..." (dialect self-introduction)
  const ana = ANA_NAME.exec(text);
  if (ana && ana[1]) {
    const c = cleanCandidate(ana[1]);
    if (isPlausibleName(c) && candidates.push(c)) {
      // keep scanning other lines for alternatives below
    }
  }

  // 3) clean short line (2-4 words, pure letters, no keywords/digits)
  const lines = text.split('\n');
  for (const line of lines) {
    const raw = line.trim();
    if (!raw || /\d/.test(raw)) continue;
    if (/عنوان|هاتف|تليفون|موبايل|رقم|كاش|مبلغ|جنيه|اجمالي|طلب/i.test(raw)) continue;
    const c = cleanCandidate(raw);
    if (!isPlausibleName(c)) continue;
    // a line that resolves to a governorate/city is a location, not a person
    if (extractGovernorate(c).value) continue;
    if (!candidates.includes(c)) candidates.push(c);
  }

  if (candidates.length > 0) {
    const restored = candidates.map((c) => restoreCase(raw, c));
    const [best, ...rest] = restored;
    const f: Field<string> = {
      value: best,
      confidence: 'medium',
      source: ana && candidates[0] === cleanCandidate(ana[1] ?? '') ? 'pattern:ana' : 'pattern:line'
    };
    if (rest.length > 0) f.alternatives = rest;
    return f;
  }

  return emptyField<string>('none');
}
