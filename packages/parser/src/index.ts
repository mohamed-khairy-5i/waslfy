/**
 * waslfy-parser — extraction engine for Egyptian e-commerce order messages.
 *
 * Every field returns { value, confidence, source, alternatives? }.
 * A null value with confidence 'empty' means: ask the seller, never guess.
 */

import type { Field, GovResult, ShipmentDraft } from './types';
export type { Field, Confidence, GovResult, ShipmentDraft } from './types';

import { prepare, toLatinDigits, normalizeArabicLetters, loose, restoreCase } from './normalize';
import { extractPhones, maskPhones, maskPhonesKeepCase } from './fields/phones';
import { extractGovernorate, govNameById } from './fields/governorate';
import { extractAmount } from './fields/amount';
import { extractName } from './fields/name';
import { extractAddress } from './fields/address';

export { extractPhones, maskPhones, maskPhonesKeepCase };
export { extractGovernorate, govNameById };
export { extractAmount };
export { extractName };
export { extractAddress };
export { prepare, toLatinDigits, normalizeArabicLetters, loose, restoreCase };
export { levenshtein } from './levenshtein';
export { GOVERNORATES, CITY_TO_GOV } from './data/governorates';

export function extractShipment(rawText: string): ShipmentDraft {
  const original = rawText ?? '';
  const prepared = prepare(original);
  const phones = extractPhones(prepared);
  const masked = maskPhones(prepared);
  // name/address work on the case-preserved original (phones blanked), so
  // Latin names keep their casing via restoreCase(); amount stays on prepared.
  const maskedOriginal = maskPhonesKeepCase(original);

  return {
    name: extractName(maskedOriginal),
    phones,
    governorate: extractGovernorate(prepared),
    address: extractAddress(maskedOriginal),
    amount: extractAmount(masked)
  };
}
