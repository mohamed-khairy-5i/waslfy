/**
 * استخراج العنوان — دايماً low confidence بالتصميم (العنوان العربي محتاج مراجعة بشرية).
 * (1) label صريح "العنوان/address:" — بيسمح بالأرقام والدشات جوه العنوان
 * (2) fallback: أول مقطع فيه كلمة شارع/عمارة/بلوك...
 */
import { Field, mkField, emptyField } from '../types';
import { Token, STREET_KEYWORDS, FIELD_KEYWORDS, STOPWORDS } from '../tokens';
import { originalSpan } from '../normalize';
import { ExtractContext } from '../context';

const WC = `[A-Za-z\\u0621-\\u064A]`;
const LABEL_RE = new RegExp(
  `(?<!${WC})(?:العنوان|عنواني|عنوان|address|addr)(?!${WC})(?:\\s+(?:ده|دي|هو))?\\s*[:=\\-]*\\s*`,
  'g'
);

/** العنوان بيسمح بالأرقام — الدش بيقفل الالتقاط بس لو بعده حقل تاني (مثل "- تليفون:"). */
function captureAddressEnd(s: string, tokens: Token[], from: number): number {
  const limit = Math.min(s.length, from + 120);
  let end = limit;
  for (let i = from; i < limit; i++) {
    const ch = s[i];
    if (ch === ',' || ch === '|' || ch === ';' || ch === '\n' || ch === '/') { end = i; break; }
    if (ch === '-') {
      const tm = /^\s*([A-Za-z\u0621-\u064A0-9]+)/.exec(s.slice(i + 1, i + 25));
      if (tm && FIELD_KEYWORDS.has(tm[1])) { end = i; break; }
    }
  }
  for (const t of tokens) {
    if (t.end <= from) continue;
    if (t.start >= end) break;
    if (t.start > from && FIELD_KEYWORDS.has(t.text)) { end = Math.min(end, t.start); break; }
  }
  return end;
}

export function extractAddressCore(ctx: ExtractContext): Field<string> {
  const s = ctx.n.search;

  // 1) label صريح
  LABEL_RE.lastIndex = 0;
  const m = LABEL_RE.exec(s);
  if (m) {
    const from = m.index + m[0].length;
    const to = captureAddressEnd(s, ctx.tokens, from);
    const value = originalSpan(ctx.n, from, to, ctx.masked).replace(/\s+/g, ' ').trim();
    if (value.length > 0) return mkField(value, 'low', 'regex');
  }

  // 2) fallback: إبدا من كلمة الشارع نفسها + الرقم/المدينة اللي قبلها،
  //    ووقف عند الموبايل/الشرطة/كلمة حقل — عشان العنوان ميحملش اسم العميل.
  const segs = segmentRanges(s);
  for (const seg of segs) {
    const segTokens: Token[] = ctx.tokens.filter(
      (t) => t.start >= seg.start && t.end <= seg.end
    );
    const kwIdx = segTokens.findIndex((t) => STREET_KEYWORDS.has(t.text));
    if (kwIdx === -1) continue;

    let fromIdx = kwIdx;
    let i = kwIdx;
    while (i > 0) {
      const p = segTokens[i - 1];
      // رقم موبايل = حاجز
      const isPhone = ctx.phones.ranges.some((r) => p.start < r.end && p.end > r.start);
      if (isPhone) break;
      // شرطة/فاصل بين التوكِنين = حاجز ("الجيزة - 12 شارع X")
      const between = s.slice(p.end, segTokens[i].start);
      if (between.includes('-') || /[,|;\/]/.test(between)) break;
      if (STOPWORDS.has(p.text) || FIELD_KEYWORDS.has(p.text)) break;
      fromIdx = i - 1;
      i -= 1;
    }

    const from = segTokens[fromIdx].start;
    const to = captureAddressEnd(s, ctx.tokens, from);
    const value = originalSpan(ctx.n, from, to, ctx.masked)
      .replace(/\s+/g, ' ')
      .trim();
    if (value.length > 0) return mkField(value, 'low', 'context');
  }

  return emptyField<string>('', 'context');
}

import { segmentRanges } from '../tokens';
