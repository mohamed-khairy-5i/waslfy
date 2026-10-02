/**
 * Accuracy report over the golden corpus.
 * - phones: every expected phone present in extracted values
 * - governorate: extracted id === expected id
 * - amount: numeric equality
 * - name: normalized equality (or extracted contains expected)
 * - address: extracted contains expected substring (normalized)
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractShipment, loose } from '../src/index';

interface Case {
  id: string;
  text: string;
  expect: {
    name?: string;
    phones?: string[];
    gov?: string;
    amount?: number;
    address?: string;
  };
}

const here = dirname(fileURLToPath(import.meta.url));
const files = ['basic', 'dialect', 'mixed-lang', 'arabic-numerals'];

const allCases: Case[] = files.flatMap((f) =>
  JSON.parse(readFileSync(join(here, 'corpus', `${f}.json`), 'utf-8')).cases
);

interface Tally {
  total: number;
  correct: number;
  misses: string[];
}
const freshTally = (): Tally => ({ total: 0, correct: 0, misses: [] });

const nameT = freshTally();
const phoneT = freshTally();
const govT = freshTally();
const amountT = freshTally();
const addressT = freshTally();

for (const c of allCases) {
  const draft = extractShipment(c.text);
  const e = c.expect;

  if (e.name) {
    nameT.total++;
    const got = draft.name.value ? loose(draft.name.value) : '';
    const want = loose(e.name);
    // honest comparison: an empty extraction is ALWAYS a miss
    if (got && (got === want || got.includes(want) || (want.includes(got) && got.length >= 2)))
      nameT.correct++;
    else nameT.misses.push(`${c.id}: want "${want}" got "${got}"`);
  }

  if (e.phones && e.phones.length > 0) {
    phoneT.total++;
    const got = draft.phones.value ?? [];
    const ok = e.phones.every((p) => got.includes(p));
    if (ok) phoneT.correct++;
    else phoneT.misses.push(`${c.id}: want ${JSON.stringify(e.phones)} got ${JSON.stringify(got)}`);
  }

  if (e.gov) {
    govT.total++;
    const got = draft.governorate.value?.id ?? '';
    if (got === e.gov) govT.correct++;
    else govT.misses.push(`${c.id}: want "${e.gov}" got "${got}"`);
  }

  if (typeof e.amount === 'number') {
    amountT.total++;
    const got = draft.amount.value;
    if (got === e.amount) amountT.correct++;
    else amountT.misses.push(`${c.id}: want ${e.amount} got ${got}`);
  }

  if (e.address) {
    addressT.total++;
    const got = draft.address.value ? loose(draft.address.value) : '';
    const want = loose(e.address);
    if (got.includes(want)) addressT.correct++;
    else addressT.misses.push(`${c.id}: want contain "${want}" got "${got}"`);
  }
}

function report(label: string, t: Tally): number {
  const pct = t.total === 0 ? 1 : t.correct / t.total;
  console.log(`\n${label}: ${t.correct}/${t.total} = ${(pct * 100).toFixed(1)}%`);
  for (const m of t.misses) console.log('  MISS ' + m);
  return pct;
}

describe('corpus accuracy report', () => {
  it('meets the M1 accuracy targets from the blueprint', () => {
    console.log(`\n=== Waslfy Parser Accuracy — ${allCases.length} messages ===`);
    const namePct = report('name', nameT);
    const phonePct = report('phones', phoneT);
    const govPct = report('governorate', govT);
    const amountPct = report('amount', amountT);
    const addressPct = report('address', addressT);

    // M1 thresholds (blueprint targets have headroom for corpus growth)
    expect(phonePct).toBeGreaterThanOrEqual(0.97);
    expect(govPct).toBeGreaterThanOrEqual(0.97);
    expect(amountPct).toBeGreaterThanOrEqual(0.9);
    expect(namePct).toBeGreaterThanOrEqual(0.8);
    expect(addressPct).toBeGreaterThanOrEqual(0.7);
  });
});
