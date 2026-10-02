/**
 * Core types of the extraction engine.
 * Every field returns { value, confidence, source, alternatives? } — never a silent guess.
 */

export type Confidence = 'high' | 'medium' | 'low' | 'empty';

/** For collection fields (phones: string[]), alternatives are single elements (string). */
export type ElementOf<T> = T extends Array<infer U> ? U : T;

export interface Field<T> {
  /** Extracted value, or null when nothing reliable was found. */
  value: T | null;
  confidence: Confidence;
  /** How the value was found: regex | dictionary | city-map | fuzzy | pattern | context | user | smart-ai */
  source: string;
  /** Other plausible candidates at element level (e.g. secondary phone numbers). */
  alternatives?: ElementOf<T>[];
}

export interface GovResult {
  /** Governorate id, e.g. "cairo", "dakahlia". */
  id: string;
  /** Official Arabic name, e.g. "الدقهلية". */
  nameAr: string;
  /** Which mechanism matched: alias | city | fuzzy */
  matchedBy: 'alias' | 'city' | 'fuzzy';
}

export interface ShipmentDraft {
  name: Field<string>;
  phones: Field<string[]>;
  governorate: Field<GovResult>;
  address: Field<string>;
  amount: Field<number>;
}

export function emptyField<T>(source: string, alternatives?: ElementOf<T>[]): Field<T> {
  const f: Field<T> = { value: null, confidence: 'empty', source };
  if (alternatives && alternatives.length > 0) f.alternatives = alternatives;
  return f;
}
