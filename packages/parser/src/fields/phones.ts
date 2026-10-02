/**
 * Egyptian mobile phone extraction.
 * Accepts: 01XXXXXXXXX, +201XXXXXXXXX, 00201XXXXXXXXX, with spaces/dashes/dots as separators,
 * and Arabic-Indic digits (handled upstream by prepare()).
 */
import type { Field } from '../types';
import { prepare, buildCaseMap } from '../normalize';

const PHONE_SPAN = /(?:\+?20|0020)?[\s.\-]*0?1[0125](?:[\s.\-]*\d){8}/g;

export const phoneSpanRegex = (): RegExp =>
  new RegExp(PHONE_SPAN.source, 'g');

export function extractPhones(raw: string): Field<string[]> {
  const text = prepare(raw);
  const found: string[] = [];
  const re = phoneSpanRegex();
  for (const m of text.matchAll(re)) {
    let digits = (m[0] ?? '').replace(/\D/g, '');
    if (digits.startsWith('0020')) digits = digits.slice(4);
    else if (digits.startsWith('20')) digits = digits.slice(2);
    if (digits.length === 10 && digits.startsWith('1')) digits = '0' + digits;
    if (/^01[0125]\d{8}$/.test(digits) && !found.includes(digits)) found.push(digits);
  }
  if (found.length === 0) {
    return { value: null, confidence: 'empty', source: 'regex' };
  }
  const [primary, ...rest] = found;
  const f: Field<string[]> = {
    value: [primary as string, ...rest],
    confidence: 'high',
    source: 'regex'
  };
  if (rest.length > 0) f.alternatives = rest;
  return f;
}

/** Replace every phone span with spaces so downstream fields don't digest phone digits. */
export function maskPhones(text: string): string {
  return text.replace(phoneSpanRegex(), (m) => ' '.repeat(m.length));
}

/**
 * Same masking as maskPhones() but applied to the ORIGINAL text (original
 * casing preserved). Phone spans are located on the prepared form, then mapped
 * back through the case map and blanked with spaces in the original.
 * Used so name/address extractors can work on case-preserved input.
 */
export function maskPhonesKeepCase(raw: string): string {
  const { prepared, map } = buildCaseMap(raw ?? '');
  let out = '';
  let pos = 0;
  for (const m of prepared.matchAll(phoneSpanRegex())) {
    const start = m.index ?? 0;
    const end = start + m[0].length;
    if (end - 1 >= map.length) continue;
    const rawStart = map[start];
    const rawEnd = map[end - 1] + 1;
    out += (raw ?? '').slice(pos, rawStart) + ' '.repeat(rawEnd - rawStart);
    pos = rawEnd;
  }
  return out + (raw ?? '').slice(pos);
}
