/**
 * waslfy-parser — extraction engine for Egyptian e-commerce order messages.
 *
 * Every field returns { value, confidence, source, alternatives? }.
 * A null value with confidence 'empty' means: ask the seller, never guess.
 */

import type { Field, GovResult, ShipmentDraft } from './types';
export type { Field, Confidence, GovResult, ShipmentDraft } from './types';

import { prepare, toLatinDigits, normalizeArabicLetters, loose } from './normalize';
import { extractPhones, maskPhones } from './fields/phones';
import { extractGovernorate, govNameById } from './fields/governorate';
import { extractAmount } from './fields/amount';
import { extractName } from './fields/name';
import { extractAddress } from './fields/address';

export { extractPhones, maskPhones };
export { extractGovernorate, govNameById };
export { extractAmount };
export { extractName };
export { extractAddress };
export { prepare, toLatinDigits, normalizeArabicLetters, loose };
export { levenshtein } from './levenshtein';
export { GOVERNORATES, CITY_TO_GOV } from './data/governorates';

export function extractShipment(rawText: string): ShipmentDraft {
  const prepared = prepare(rawText ?? '');
  const phones = extractPhones(prepared);
  const masked = maskPhones(prepared);

  return {
    name: extractName(masked),
    phones,
    governorate: extractGovernorate(prepared),
    address: extractAddress(masked),
    amount: extractAmount(masked)
  };
}
