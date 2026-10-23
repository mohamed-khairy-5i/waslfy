/** سياق الاستخراج المشترك — بيتبني مرة واحدة لكل رسالة. */
import { NormalizedText } from './normalize';
import { Token } from './tokens';
import { PhoneCore } from './fields/phones';

export interface ExtractContext {
  n: NormalizedText;
  tokens: Token[];
  /** النص الأصلي بأرقام الموبايل متشالة (spaces) — للأسماء والعناوين */
  masked: string;
  phones: PhoneCore;
}

export function buildContext(text: string): ExtractContext {
  const n = normalize(text);
  const tokens = tokenize(n.search);
  const phones = extractPhonesCore(n);
  // نسخة من الأصل بأرقام التليفون متشالة
  const chars = Array.from(n.original);
  for (const r of phones.ranges) {
    const a = n.map[r.start];
    const b = n.map[r.end - 1];
    if (a === undefined || b === undefined) continue;
    for (let i = a; i <= b; i++) chars[i] = ' ';
  }
  const masked = chars.join('');
  return { n, tokens, masked, phones };
}

import { normalizeText as normalize } from './normalize';
import { tokenize } from './tokens';
import { extractPhonesCore } from './fields/phones';
