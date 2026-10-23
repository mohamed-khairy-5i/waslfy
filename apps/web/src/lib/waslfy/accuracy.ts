/**
 * تقرير الدقة الحيّ — نفس منطق accuracy.test.ts لكن شغّال في المتصفح.
 * الأرقام بتتحسب فعليًا على الـ corpus دلوقتي، مش أرقام منسوخة من README.
 * الـ corpus بيتستورد من حزمة waslfy-parser نفسها — نفس البيانات اللي شغالة في الـ CI.
 */
import {
  extractShipment,
  evaluateEntry,
  PUBLIC_CORPUS,
  type CorpusEntry,
  type FieldKey,
} from 'waslfy-parser';

export const CORPUS: CorpusEntry[] = PUBLIC_CORPUS;

export interface FieldStat {
  key: string;
  label: string;
  correct: number;
  total: number;
}

const FIELDS: { key: FieldKey; label: string }[] = [
  { key: 'name', label: 'الاسم' },
  { key: 'phones', label: 'الهاتف' },
  { key: 'governorate', label: 'المحافظة' },
  { key: 'amount', label: 'المبلغ' },
  { key: 'address', label: 'العنوان' },
];

/** نفس قواعد المقارنة الصادقة في accuracy.test.ts — الاستخراج الفاضي دايمًا غلطة. */
export function evaluateCorpus(entries: CorpusEntry[] = CORPUS): FieldStat[] {
  const stats = new Map<FieldKey, FieldStat>();
  for (const f of FIELDS) stats.set(f.key, { ...f, correct: 0, total: 0 });

  for (const entry of entries) {
    const result = extractShipment(entry.text);
    const res = evaluateEntry(entry, result);
    for (const f of FIELDS) {
      stats.get(f.key)!.total++;
      if (res[f.key]) stats.get(f.key)!.correct++;
    }
  }

  return FIELDS.map((f) => stats.get(f.key)!);
}

export function overallAccuracy(stats: FieldStat[]): { correct: number; total: number; pct: number } {
  const correct = stats.reduce((s, f) => s + f.correct, 0);
  const total = stats.reduce((s, f) => s + f.total, 0);
  return { correct, total, pct: total === 0 ? 0 : correct / total };
}
