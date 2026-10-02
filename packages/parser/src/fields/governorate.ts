/**
 * Governorate extraction: alias dictionary → city/district map → fuzzy token match.
 * Returns suggestions in `alternatives` even when the main match fails.
 */
import type { Field, GovResult } from '../types';
import { emptyField } from '../types';
import { GOVERNORATES, CITY_TO_GOV, type Governorate } from '../data/governorates';
import { levenshtein } from '../levenshtein';
import { AR_LETTER, prepare } from '../normalize';

interface PreparedAlias {
  alias: string;
  gov: Governorate;
  kind: 'alias' | 'city';
}

const byLengthDesc = (a: PreparedAlias, b: PreparedAlias) =>
  b.alias.length - a.alias.length;

const ALIAS_INDEX: PreparedAlias[] = (() => {
  const list: PreparedAlias[] = [];
  for (const gov of GOVERNORATES) {
    for (const a of [gov.nameAr.replace(/[أإآ]/g, 'ا'), ...gov.aliases]) {
      list.push({ alias: a, gov, kind: 'alias' });
    }
  }
  for (const [city, govId] of Object.entries(CITY_TO_GOV)) {
    const gov = GOVERNORATES.find((g) => g.id === govId);
    if (gov) list.push({ alias: city, gov, kind: 'city' });
  }
  return list.sort(byLengthDesc);
})();

const GOV_BY_ID = new Map(GOVERNORATES.map((g) => [g.id, g]));

function boundaryRegex(alias: string): RegExp {
  const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(
    `(?<!${AR_LETTER}|[a-z0-9])${escaped}(?!${AR_LETTER}|[a-z0-9])`
  );
}

export function extractGovernorate(raw: string): Field<GovResult> {
  const text = prepare(raw);
  // 1) exact alias / city hits (longest first)
  for (const { alias, gov, kind } of ALIAS_INDEX) {
    if (boundaryRegex(alias).test(text)) {
      return {
        value: { id: gov.id, nameAr: gov.nameAr, matchedBy: kind },
        confidence: 'high',
        source: kind === 'city' ? 'city-map' : 'dictionary'
      };
    }
  }

  // 2) fuzzy token match (typos) — only for aliases long enough to be safe
  const tokens = text.split(new RegExp(`[^\\u0621-\\u064Aa-z0-9]+`)).filter(Boolean);
  const fuzzyHits: Array<{ gov: Governorate; dist: number }> = [];
  for (const tok of tokens) {
    if (tok.length < 4) continue;
    for (const { alias, gov } of ALIAS_INDEX) {
      if (alias.length < 5 || /[a-z]/.test(alias)) continue;
      const dist = levenshtein(tok, alias);
      if (dist <= (alias.length >= 7 ? 2 : 1)) {
        fuzzyHits.push({ gov, dist });
      }
    }
  }
  fuzzyHits.sort((a, b) => a.dist - b.dist);
  const best = fuzzyHits[0];
  if (best) {
    const altGovs = fuzzyHits
      .slice(1, 4)
      .filter((h) => h.gov.id !== best.gov.id)
      .map((h) => ({ id: h.gov.id, nameAr: h.gov.nameAr, matchedBy: 'fuzzy' as const }));
    const f: Field<GovResult> = {
      value: { id: best.gov.id, nameAr: best.gov.nameAr, matchedBy: 'fuzzy' },
      confidence: 'medium',
      source: 'fuzzy'
    };
    if (altGovs.length > 0) f.alternatives = altGovs;
    return f;
  }

  // 3) nothing — but still offer the closest 3 as suggestions for the UI
  const suggestions: GovResult[] = [];
  for (const { alias, gov } of ALIAS_INDEX) {
    if (/[a-z]/.test(alias) || alias.length < 4) continue;
    for (const tok of tokens) {
      if (levenshtein(tok, alias) <= 3) {
        if (!suggestions.some((s) => s.id === gov.id)) {
          suggestions.push({ id: gov.id, nameAr: gov.nameAr, matchedBy: 'fuzzy' });
        }
        break;
      }
    }
    if (suggestions.length >= 3) break;
  }
  return emptyField<GovResult>('dictionary', suggestions);
}

export function govNameById(id: string): string | undefined {
  return GOV_BY_ID.get(id)?.nameAr;
}
