/**
 * استخراج اسم العميل — أصعب حقل في الرسائل المصرية.
 * الشلال: (1) label صريح "الاسم/اسم العميل/name:" → high
 *         (2) "العميل/الزبون/للسيدة/..." → medium
 *         (3) أول جملة توكِنات نضيفة (2-4 كلمات) في أول مقطعين → medium/low
 * القيمة بترجع بالرسم الأصلي زي ما اتكتب.
 */
import { Field, mkField, emptyField } from '../types';
import { Token, isLetters, STOPWORDS, NAME_CONNECTORS, FIELD_KEYWORDS } from '../tokens';
import { originalSpan } from '../normalize';
import { ExtractContext } from '../context';
import { isNameBlockedToken } from './governorate';

const WC = `[A-Za-z\\u0621-\\u064A]`;
const L1_RE = new RegExp(
  `(?<!${WC})(?:الاسم|اسم\\s*العميل|اسم\\s*الزبون|اسمي|اسم(?:ه|ها)?|name|customer)(?!${WC})\\s*[:=\\-]*\\s*`,
  'g'
);
const L2_RE = new RegExp(
  `(?<!${WC})(?:للعميل|للعميله|للسيده|العميل|العميله|الزبون|الزبونه|الزبر|المريض|المريضه|عميل|عميله|زبون|مريض)\\s*[:=\\-]?\\s*`,
  'g'
);
// "انا X عايز..." — التعريف بالنفس في الرسائل العامية
const ANA_RE = new RegExp(`(?<!${WC})انا\\s+`, 'g');

/** شيل "لل/ل" من أول توكِن (لعمده: "لعمر" → "عمر"). بيرجع null لو النتيجة بقت مش معقولة. */
function stripLam(t: string): string | null {
  if (t.startsWith('لل') && t.length - 2 >= 4) return t.slice(2);
  if (t.startsWith('ل') && t.length - 1 >= 3) return t.slice(1);
  return t;
}

/** "سيد/سيده" لو جايوا بعد اسم حقيقي بيكمّلوا الاسم ("مصطفى سيد") — مش لقب. */
const SAYED_TOKENS = new Set(['سيد', 'سيده']);

function nameLike(t: string): boolean {
  return isLetters(t) && !STOPWORDS.has(t) && !isNameBlockedToken(t);
}

/** نهاية منطقة الالتقاط: فاصلة/شرطة/رقم/كلمة مفتاحية. */
function captureEnd(s: string, tokens: Token[], from: number, maxLen: number, dashEnds: boolean): number {
  const limit = Math.min(s.length, from + maxLen);
  let end = limit;
  for (let i = from; i < limit; i++) {
    const ch = s[i];
    if (ch === ',' || ch === '|' || ch === ';' || ch === '\n' || ch === '/') { end = i; break; }
    if (ch === '-') {
      if (dashEnds) { end = i; break; }
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

/** تجميع توكِنات الاسم من منطقة الالتقاط — بيقف عند أول كلمة مش اسم.
 *  strict: لو أول توكِن مش اسم → قطع فورًا (لأنماط زي "انا X عايز..."). */
function collectLabeled(tokens: Token[], from: number, to: number, cap: number, strict = false): Token[] {
  const out: Token[] = [];
  for (const t of tokens) {
    if (t.end <= from) continue;
    if (t.start >= to) break;
    if (out.length >= cap) break;
    if (out.length === 0 && NAME_CONNECTORS.has(t.text)) continue;
    let txt = t.text;
    if (out.length === 0) {
      const stripped = stripLam(txt);
      if (stripped && STOPWORDS.has(stripped)) {
        if (strict) break;
        continue; // "للسيده" → "سيده" → استنى اللي بعدها
      }
      if (stripped) txt = stripped;
    }
    if (!nameLike(txt) && !(out.length > 0 && SAYED_TOKENS.has(txt))) {
      if (out.length > 0) break;
      if (strict) break;
      continue;
    }
    out.push(txt === t.text ? t : { ...t, text: txt, start: t.start + (t.text.length - txt.length) });
  }
  return out;
}

/** أول "جري" توكِنات نضيفة (≥2 كلمات متتالية) — لحد 4.
 *  لو التوكِن الأول جاي بعد فعل أمر/كلمة واقفة وبيبدأ بـ "ل" → بنشيل اللام ("لعمر" → "عمر"). */
function collectRun(tokens: Token[], from: number, to: number): Token[] | null {
  let run: Token[] = [];
  let prev: Token | null = null;
  for (const t of tokens) {
    if (t.end <= from) { prev = t; continue; }
    if (t.start >= to) break;
    let token: Token | null = null;
    const canStrip = run.length === 0 && t.text.startsWith('ل') && prev !== null && STOPWORDS.has(prev.text);
    if (canStrip) {
      const stripped = stripLam(t.text);
      if (stripped && stripped !== t.text && nameLike(stripped)) {
        token = { ...t, text: stripped, start: t.start + (t.text.length - stripped.length) };
      }
    }
    if (!token && (nameLike(t.text) || (run.length > 0 && SAYED_TOKENS.has(t.text)))) token = t;
    if (token) {
      run.push(token);
      if (run.length >= 4) break;
    } else {
      if (run.length >= 2) break;
      run = [];
    }
    prev = t;
  }
  return run.length >= 2 ? run : null;
}

function tokensToValue(ctx: ExtractContext, toks: Token[]): string {
  return toks
    .map((t) => originalSpan(ctx.n, t.start, t.end, ctx.masked).trim())
    .filter((v) => v.length > 0)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function spanTokens(ctx: ExtractContext, from: number, to: number): Token[] {
  return ctx.tokens.filter((t) => t.start >= from && t.end <= to);
}

export function extractNameCore(ctx: ExtractContext): Field<string> {
  const s = ctx.n.search;

  // 1) label صريح
  L1_RE.lastIndex = 0;
  let m = L1_RE.exec(s);
  if (m) {
    const from = m.index + m[0].length;
    const to = captureEnd(s, ctx.tokens, from, 80, true);
    const toks = collectLabeled(ctx.tokens, from, to, 4);
    if (toks.length >= 1) {
      return mkField(tokensToValue(ctx, toks), 'high', 'regex');
    }
  }

  // 2) كلمة عميل/زبون/سيدة
  L2_RE.lastIndex = 0;
  m = L2_RE.exec(s);
  if (m) {
    const from = m.index + m[0].length;
    const to = captureEnd(s, ctx.tokens, from, 80, true);
    const toks = collectLabeled(ctx.tokens, from, to, 2);
    if (toks.length >= 1) {
      return mkField(tokensToValue(ctx, toks), 'medium', 'regex');
    }
  }

  // 2.5) "انا X ..." — التعريف بالنفس في الرسائل العامية
  ANA_RE.lastIndex = 0;
  m = ANA_RE.exec(s);
  if (m) {
    const from = m.index + m[0].length;
    const to = captureEnd(s, ctx.tokens, from, 60, true);
    const toks = collectLabeled(ctx.tokens, from, to, 2, true);
    if (toks.length >= 1) {
      return mkField(tokensToValue(ctx, toks), 'medium', 'context');
    }
  }

  // 3) أول مقطع نضيف — جملة قصيرة حروف بس = اسم غالباً
  const segs = segmentList(s);
  for (let i = 0; i < segs.length; i++) {
    const seg = segs[i];
    const run = collectRun(spanTokens(ctx, seg.start, seg.end), seg.start, seg.end);
    if (run && run.length >= 2) {
      const confidence = i <= 1 ? 'medium' : 'low';
      return mkField(tokensToValue(ctx, run), confidence, 'context');
    }
  }

  return emptyField<string>('', 'regex');
}

import { segmentRanges } from '../tokens';
function segmentList(s: string) {
  return segmentRanges(s);
}
