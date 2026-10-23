/**
 * استخراج أرقام الموبايل المصرية.
 * الصيغ المدعومة: 01XXXXXXXXX (محلي) — +20/0020/20 + 1XXXXXXXXX (دولي).
 * القيمة المُرجَّعة دايماً بالصيغة المحلية 01XXXXXXXXX.
 */
import { NormalizedText } from '../normalize';
import { Field, mkField, emptyField } from '../types';

export const PHONE_RE =
  /(?<![0-9])(?:\+?20|0020)?(1[0125][0-9]{8}|01[0125][0-9]{8})(?![0-9])/g;

export interface PhoneCore {
  field: Field<string[]>;
  ranges: Array<{ start: number; end: number }>;
}

export function extractPhonesCore(n: NormalizedText): PhoneCore {
  const s = n.search;
  const values: string[] = [];
  const ranges: Array<{ start: number; end: number }> = [];
  PHONE_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = PHONE_RE.exec(s))) {
    const local = m[1];
    const canonical = local.startsWith('0') ? local : '0' + local;
    if (!values.includes(canonical)) values.push(canonical);
    ranges.push({ start: m.index, end: m.index + m[0].length });
    if (m.index === PHONE_RE.lastIndex) PHONE_RE.lastIndex++;
  }
  // الصيغ المتفرقة "0100 123 4567" — بنشغّل على نسخة متصلة
  // (من غير ما نأثر على ranges الأصلية — دمج قيم بس)
  const joined = s.replace(/(?<=[0-9])[ .\-]+(?=[0-9])/g, '');
  if (joined !== s) {
    PHONE_RE.lastIndex = 0;
    while ((m = PHONE_RE.exec(joined))) {
      const local = m[1];
      const canonical = local.startsWith('0') ? local : '0' + local;
      if (!values.includes(canonical)) values.push(canonical);
    }
  }

  if (values.length === 0) {
    return { field: emptyField<string[]>([], 'regex'), ranges };
  }
  const primary = values[0];
  const alts = values.slice(1);
  return {
    field: alts.length > 0
      ? mkField(values, 'high', 'regex', alts)
      : mkField(values, 'high', 'regex'),
    ranges,
  };
}
