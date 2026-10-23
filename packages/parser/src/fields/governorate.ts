/**
 * استخراج المحافظة — ثلاث طبقات:
 * (1) مطابقة alias المحافظة نفسها → high
 * (2) مطابقة مدينة/منطقة → medium
 * (3) فازي-ماتش Levenshtein ≤ 1 → low (أخطاء كتابة)
 * ذكية بخصوص الشوارع: "ش بورسعيد" ده اسم شارع — مش محافظة بورسعيد.
 */
import { Field, GovResult, mkField, emptyField } from '../types';
import { Token, isLetters, STREET_MARKERS } from '../tokens';
import { levenshtein } from '../levenshtein';
import { GOVERNORATES, GOV_BY_ID, Governorate } from '../data/governorates';
import { CITY_TO_GOV, buildNameBlockSet } from '../data/cities';
import { ExtractContext } from '../context';

const WC = '[A-Za-z\\u0621-\\u064A0-9]';

interface CompiledAlias {
  re: RegExp;
  gov: Governorate;
}
interface CompiledCity {
  re: RegExp;
  govId: string;
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function compilePattern(pattern: string): RegExp {
  return new RegExp(`(?<!${WC})${pattern}(?!${WC})`, 'g');
}

function aliasPattern(alias: string): string {
  return alias.split(/\s+/).map(escapeRe).join('\\s*');
}

let govCache: CompiledAlias[] | null = null;
let cityCache: CompiledCity[] | null = null;
let aliasWords: Array<{ word: string; gov: Governorate }> | null = null;
let nameBlockSet: Set<string> | null = null;

function buildCaches(): void {
  if (govCache) return;
  govCache = [];
  cityCache = [];
  aliasWords = [];
  for (const gov of GOVERNORATES) {
    for (const alias of gov.aliases) {
      govCache.push({ re: compilePattern(aliasPattern(alias)), gov });
      for (const w of alias.split(/\s+/)) {
        aliasWords.push({ word: w, gov });
      }
    }
  }
  for (const [city, govId] of Object.entries(CITY_TO_GOV)) {
    cityCache.push({ re: compilePattern(aliasPattern(city)), govId });
  }
  nameBlockSet = buildNameBlockSet();
}

/** لو التوكِن اللي قبل المكان مباشرةً علامة شارع → دي شارع مش محافظة. */
function isStreetMarked(tokens: Token[], matchStart: number): boolean {
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.end >= matchStart) {
      if (i > 0) {
        const p = tokens[i - 1];
        if (matchStart - p.end <= 2 && STREET_MARKERS.has(p.text)) return true;
      }
      return false;
    }
  }
  return false;
}

function firstValidMatch(re: RegExp, s: string, tokens: Token[]): RegExpExecArray | null {
  re.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) {
    if (!isStreetMarked(tokens, m.index)) return m;
    if (m.index === re.lastIndex) re.lastIndex++;
  }
  return null;
}

function tryFuzzy(tokens: Token[]): Governorate | null {
  for (const t of tokens) {
    if (!isLetters(t.text) || t.text.length < 5) continue;
    const stripped =
      t.text.startsWith('ال') && t.text.length >= 6 ? t.text.slice(2) : t.text;
    for (const { word, gov } of aliasWords!) {
      if (word.length < 5) continue;
      if (levenshtein(stripped, word) <= 1) return gov;
      const wStrip =
        word.startsWith('ال') && word.length >= 6 ? word.slice(2) : word;
      if (wStrip.length >= 5 && levenshtein(stripped, wStrip) <= 1) return gov;
    }
  }
  return null;
}

export function extractGovernorateCore(ctx: ExtractContext): Field<GovResult | null> {
  buildCaches();
  const s = ctx.n.search;
  const tokens = ctx.tokens;

  // 1) المحافظة بالاسم المباشر
  for (const { re, gov } of govCache!) {
    if (firstValidMatch(re, s, tokens)) {
      return mkField({ id: gov.id, name: gov.name }, 'high', 'dictionary');
    }
  }

  // 2) مدينة/منطقة جوه محافظة
  for (const { re, govId } of cityCache!) {
    if (firstValidMatch(re, s, tokens)) {
      const gov = GOV_BY_ID[govId];
      if (gov) return mkField({ id: gov.id, name: gov.name }, 'medium', 'dictionary');
    }
  }

  // 3) فازي — خطأ كتابة بسيط
  const fz = tryFuzzy(tokens);
  if (fz) return mkField({ id: fz.id, name: fz.name }, 'low', 'dictionary');

  return emptyField<GovResult | null>(null, 'dictionary');
}

/** بتستخدم في name.ts — توكِنات أسماء الأماكن ممنوع تُحسب أسماء أشخاص. */
export function isNameBlockedToken(t: string): boolean {
  buildCaches();
  return nameBlockSet!.has(t);
}

export { GOVERNORATES, GOV_BY_ID, CITY_TO_GOV };
