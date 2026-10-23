/**
 * أنواع الواجهة العامة لـ waslfy-parser.
 * كل حقل بيرجع Field<T> — القيمة + درجة الثقة + مصدر الاستخراج.
 * قاعدة ذهبية: مفيش قيم صامتة — confidence 'empty' يعني "اسأل التاجر، متخمنش".
 */

export type Confidence = 'high' | 'medium' | 'low' | 'empty';
export type Source = 'regex' | 'dictionary' | 'context' | 'user' | 'smart-ai';

export interface Field<T> {
  value: T;
  confidence: Confidence;
  source: Source;
  alternatives?: T;
  confirmed: boolean;
}

export interface GovResult {
  id: string;
  name: string;
}

export interface ShipmentFields {
  name: Field<string>;
  phones: Field<string[]>;
  governorate: Field<GovResult | null>;
  address: Field<string>;
  amount: Field<number | null>;
}

/** ترتيب الثقة — بيستخدم في حجب الطباعة لو في حقول ناقصة. */
export const CONFIDENCE_ORDER: Record<Confidence, number> = {
  empty: 0,
  low: 1,
  medium: 2,
  high: 3,
};

export function mkField<T>(
  value: T,
  confidence: Confidence,
  source: Source,
  alternatives?: T
): Field<T> {
  const f: Field<T> = { value, confidence, source, confirmed: false };
  if (alternatives !== undefined) f.alternatives = alternatives;
  return f;
}

export function emptyField<T>(fallback: T, source: Source = 'regex'): Field<T> {
  return { value: fallback, confidence: 'empty', source, confirmed: false };
}
