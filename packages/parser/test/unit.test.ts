import { describe, it, expect } from 'vitest';
import {
  extractShipment,
  extractPhones,
  extractAmount,
  extractGovernorate,
  prepare,
  toLatinDigits,
  normalizeArabicLetters,
  loose
} from '../src/index';

describe('normalize', () => {
  it('converts Arabic-Indic digits', () => {
    expect(toLatinDigits('٠١٢٣٤٥٦٧٨٩')).toBe('0123456789');
  });

  it('unifies hamza/alef/taa-marbouta', () => {
    expect(normalizeArabicLetters('أحمد إسلام آية')).toBe('احمد اسلام ايه');
  });

  it('strips bidi/zero-width control marks', () => {
    expect(normalizeArabicLetters('ا\u200fح\u200bمد')).toBe('احمد');
  });

  it('prepare is idempotent and keeps newlines', () => {
    const out = prepare('السـلام ٥٤\nعليكم');
    expect(prepare(out)).toBe(out);
    expect(out).toContain('\n');
    expect(out).toContain('54');
  });
});

describe('phones', () => {
  it('extracts a plain local number', () => {
    expect(extractPhones('كلمني على 01012345678')?.value).toEqual(['01012345678']);
  });

  it('normalizes +20 and 0020 formats', () => {
    expect(extractPhones('+20 101 234 5678')?.value).toEqual(['01012345678']);
    expect(extractPhones('00201012345678')?.value).toEqual(['01012345678']);
  });

  it('collects multiple numbers with alternatives', () => {
    const f = extractPhones('رقمي 01122334455 أو 01099887744');
    expect(f.value).toEqual(['01122334455', '01099887744']);
    expect(f.alternatives).toEqual(['01099887744']);
  });

  it('rejects non-Egyptian or incomplete numbers', () => {
    expect(extractPhones('رقم 01312345678')?.value).toBeNull();
    expect(extractPhones('رقم 0101234567')?.value).toBeNull();
  });
});

describe('amount', () => {
  it('parses currency-mark after number', () => {
    expect(extractAmount('اجمالي الطلب 350 جنيه')?.value).toBe(350);
  });

  it('parses currency-mark before number (dialect)', () => {
    expect(extractAmount('يبقى حسابك ج 145')?.value).toBe(145);
  });

  it('parses COD anchor (english)', () => {
    expect(extractAmount('cod: 500')?.value).toBe(500);
  });

  it('never guesses from a bare number', () => {
    expect(extractAmount('مقاس 42 متوفر')?.value).toBeNull();
  });
});

describe('governorate', () => {
  it('maps city to governorate (people write cities, not governorates)', () => {
    expect(extractGovernorate('المنصورة الدقهلية')?.value?.id).toBe('dakahlia');
    expect(extractGovernorate('مدينة نصر')?.value?.id).toBe('cairo');
    expect(extractGovernorate('الهرم')?.value?.id).toBe('giza');
  });

  it('matches latin aliases', () => {
    expect(extractGovernorate('nasr city cairo')?.value?.id).toBe('cairo');
  });

  it('suggests alternatives on failure instead of guessing', () => {
    const f = extractGovernorate('انا في مكان تاني خالص');
    expect(f.value).toBeNull();
    expect(f.confidence).toBe('empty');
  });
});

describe('extractShipment (end to end)', () => {
  it('produces a full draft from a realistic message', () => {
    const d = extractShipment(
      'الاسم: محمود السيد\nالعنوان: 15 شارع البحر دمنهور البحيرة\nالهاتف: 01012345678\nالمبلغ 350 جنيه كاش'
    );
    expect(d.name.value).toBe('محمود السيد');
    expect(d.phones.value).toEqual(['01012345678']);
    expect(d.governorate.value?.id).toBe('beheira');
    expect(d.amount.value).toBe(350);
    expect(loose(d.address.value ?? '')).toContain('شارع البحر');
  });

  it('never fills silent defaults on an empty message', () => {
    const d = extractShipment('');
    expect(d.name.value).toBeNull();
    expect(d.phones.value).toBeNull();
    expect(d.governorate.value).toBeNull();
    expect(d.address.value).toBeNull();
    expect(d.amount.value).toBeNull();
  });
});
