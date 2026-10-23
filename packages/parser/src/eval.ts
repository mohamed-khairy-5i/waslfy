/**
 * تقييم ناتج الاستخراج ضد القيم المتوقعة — مشترك بين الاختبارات وتقرير الـ CLI.
 */
import { ShipmentFields } from './types';
import { normalizeSimple } from './normalize';

export interface CorpusExpected {
  name?: string | null;
  phones?: string[] | null;
  governorate?: string | null;
  amount?: number | null;
  addressContains?: string | null;
}

export interface CorpusEntry {
  id: string;
  category: string;
  text: string;
  expected: CorpusExpected;
}

export type FieldKey = 'name' | 'phones' | 'governorate' | 'amount' | 'address';

export function evaluateEntry(entry: CorpusEntry, r: ShipmentFields): Record<FieldKey, boolean> {
  const e = entry.expected;
  return {
    name:
      e.name == null
        ? r.name.confidence === 'empty'
        : r.name.value === e.name,
    phones:
      e.phones == null
        ? r.phones.confidence === 'empty'
        : JSON.stringify([...r.phones.value].sort()) === JSON.stringify([...e.phones].sort()),
    governorate:
      e.governorate == null
        ? r.governorate.confidence === 'empty'
        : r.governorate.value?.id === e.governorate,
    amount:
      e.amount == null
        ? r.amount.confidence === 'empty'
        : r.amount.value === e.amount,
    address:
      e.addressContains == null
        ? r.address.confidence === 'empty'
        : normalizeSimple(r.address.value).includes(normalizeSimple(e.addressContains)),
  };
}
