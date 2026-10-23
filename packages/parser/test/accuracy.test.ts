/**
 * accuracy.test — قلب أداة السمعة:
 * الدقة بتتقاس على corpus منشور، والأهداف دي عهود معلنة في الـ README.
 *   هاتف >= 98% — محافظة >= 95% — مبلغ >= 90% — اسم >= 85%
 * العنوان low بالتصميم (محتاج مراجعة بشرية) — بنقيس بس مش بنتعهد.
 */
import { describe, it, expect } from 'vitest';
import { extractShipment } from '../src/extract';
import { evaluateEntry, CorpusEntry, FieldKey } from '../src/eval';
import { PUBLIC_CORPUS } from '../src/data/corpus';

const CORPUS: CorpusEntry[] = PUBLIC_CORPUS;

const THRESHOLDS: Partial<Record<FieldKey, number>> = {
  phones: 0.98,
  governorate: 0.95,
  amount: 0.9,
  name: 0.85,
};

function rate(field: FieldKey): { hits: number; total: number; pct: number; failures: string[] } {
  let hits = 0;
  const failures: string[] = [];
  for (const entry of CORPUS) {
    const r = extractShipment(entry.text);
    if (evaluateEntry(entry, r)[field]) hits++;
    else failures.push(entry.id);
  }
  return { hits, total: CORPUS.length, pct: hits / CORPUS.length, failures };
}

describe('accuracy on public corpus (' + CORPUS.length + ' messages)', () => {
  it('phones >= 98%', () => {
    const r = rate('phones');
    console.log(`phones: ${r.hits}/${r.total} = ${(r.pct * 100).toFixed(1)}% ${r.failures.join(',')}`);
    expect(r.pct).toBeGreaterThanOrEqual(THRESHOLDS.phones!);
  });

  it('governorate >= 95%', () => {
    const r = rate('governorate');
    console.log(`governorate: ${r.hits}/${r.total} = ${(r.pct * 100).toFixed(1)}% ${r.failures.join(',')}`);
    expect(r.pct).toBeGreaterThanOrEqual(THRESHOLDS.governorate!);
  });

  it('amount >= 90%', () => {
    const r = rate('amount');
    console.log(`amount: ${r.hits}/${r.total} = ${(r.pct * 100).toFixed(1)}% ${r.failures.join(',')}`);
    expect(r.pct).toBeGreaterThanOrEqual(THRESHOLDS.amount!);
  });

  it('name >= 85%', () => {
    const r = rate('name');
    console.log(`name: ${r.hits}/${r.total} = ${(r.pct * 100).toFixed(1)}% ${r.failures.join(',')}`);
    expect(r.pct).toBeGreaterThanOrEqual(THRESHOLDS.name!);
  });

  it('address (low-by-design, informational >= 80%)', () => {
    const r = rate('address');
    console.log(`address: ${r.hits}/${r.total} = ${(r.pct * 100).toFixed(1)}% ${r.failures.join(',')}`);
    expect(r.pct).toBeGreaterThanOrEqual(0.8);
  });
});

describe('extraction contract', () => {
  it('every field always returns the Field shape', () => {
    for (const entry of CORPUS) {
      const r = extractShipment(entry.text);
      expect(typeof r.name.value).toBe('string');
      expect(Array.isArray(r.phones.value)).toBe(true);
      expect(typeof r.address.value).toBe('string');
      expect(['high', 'medium', 'low', 'empty']).toContain(r.name.confidence);
      expect(r.name.confirmed).toBe(false);
    }
  });

  it('no silent guessing: empty message fields stay empty, not zero/guessed', () => {
    const r = extractShipment('السلام عليكم ورحمة الله');
    expect(r.phones.confidence).toBe('empty');
    expect(r.governorate.confidence).toBe('empty');
    expect(r.amount.confidence).toBe('empty');
  });
});
