/**
 * waslfy-parser — محرك استخراج بيانات الشحن المصرية من رسائل واتساب.
 * صفر dependencies • TypeScript • دقة مقاسة على corpus منشور.
 *
 * كل حقل بيرجع { value, confidence, source, confirmed } —
 * confidence 'empty' معناه: اسأل التاجر، متخمنش أبداً.
 */

export type { Field, Confidence, Source, GovResult, ShipmentFields } from './types';
export { mkField, emptyField, CONFIDENCE_ORDER } from './types';

export { extractShipment } from './extract';
export { evaluateEntry } from './eval';
export type { CorpusEntry, CorpusExpected, FieldKey } from './eval';
export { PUBLIC_CORPUS } from './data/corpus';
export { extractPhonesCore as extractPhonesInternal } from './fields/phones';
export { extractGovernorateCore as extractGovernorateInternal } from './fields/governorate';
export { extractAmountCore as extractAmountInternal } from './fields/amount';
export { extractNameCore as extractNameInternal } from './fields/name';
export { extractAddressCore as extractAddressInternal } from './fields/address';

export { normalizeText, normalizeSimple, originalSpan } from './normalize';
export { levenshtein } from './levenshtein';
export { GOVERNORATES, GOV_BY_ID } from './data/governorates';
export { CITY_TO_GOV } from './data/cities';

import { buildContext } from './context';
import { extractPhonesCore } from './fields/phones';
import { extractGovernorateCore } from './fields/governorate';
import { extractAmountCore } from './fields/amount';
import { extractNameCore } from './fields/name';
import { extractAddressCore } from './fields/address';
import { Field, GovResult } from './types';

/** استخراج حقل واحد لوحده (من غير تجهيز الرسالة كلها). */
export function extractName(text: string): Field<string> {
  const ctx = buildContext(text);
  return extractNameCore(ctx);
}

export function extractPhones(text: string): Field<string[]> {
  const ctx = buildContext(text);
  return extractPhonesCore(ctx.n).field;
}

export function extractGovernorate(text: string): Field<GovResult | null> {
  const ctx = buildContext(text);
  return extractGovernorateCore(ctx);
}

export function extractAddress(text: string): Field<string> {
  const ctx = buildContext(text);
  return extractAddressCore(ctx);
}

export function extractAmount(text: string): Field<number | null> {
  const ctx = buildContext(text);
  return extractAmountCore(ctx.n, ctx.phones);
}
