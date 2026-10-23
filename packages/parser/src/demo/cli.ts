#!/usr/bin/env node
/**
 * waslfy-parser CLI — عرض حي:
 *   npm run demo -- "الاسم: أحمد ..."   → استخراج مباشر لرسالة
 *   npm run demo                        → تقرير الدقة على الـ corpus كله
 */
import { extractShipment } from '../extract';
import { evaluateEntry, CorpusEntry, FieldKey } from '../eval';
import basicRaw from '../data/corpus/basic.json';
import dialectRaw from '../data/corpus/dialect.json';
import mixedRaw from '../data/corpus/mixed-lang.json';
import numeralsRaw from '../data/corpus/arabic-numerals.json';
import multilineRaw from '../data/corpus/multiline.json';

const CORPUS: CorpusEntry[] = [
  ...(basicRaw as CorpusEntry[]),
  ...(dialectRaw as CorpusEntry[]),
  ...(mixedRaw as CorpusEntry[]),
  ...(numeralsRaw as CorpusEntry[]),
  ...(multilineRaw as CorpusEntry[]),
];

const LABELS: Record<FieldKey, string> = {
  name: 'الاسم',
  phones: 'الهاتف',
  governorate: 'المحافظة',
  address: 'العنوان',
  amount: 'المبلغ',
};

function pad(s: string, w: number): string {
  let out = s;
  let len = 0;
  for (const ch of s) len += 1;
  while (len < w) {
    out += ' ';
    len += 1;
  }
  return out;
}

function badge(conf: string): string {
  switch (conf) {
    case 'high': return 'high   ';
    case 'medium': return 'medium ';
    case 'low': return 'low    ';
    default: return 'empty  ';
  }
}

function printExtraction(text: string): void {
  const r = extractShipment(text);
  console.log('==============================================');
  console.log('  waslfy-parser v0.1 — استخراج مباشر');
  console.log('==============================================');
  console.log('');
  console.log('النص:');
  console.log('  "' + text + '"');
  console.log('');
  console.log(pad('الحقل', 12) + pad('الثقة', 12) + 'القيمة');
  console.log('-'.repeat(72));

  const rows: Array<[string, string, string]> = [
    ['الاسم', r.name.value === '' ? '(فاضي — محتاج سؤال)' : r.name.value, badge(r.name.confidence) + pad(r.name.source, 12)],
    ['الهاتف', r.phones.value.length === 0 ? '(فاضي)' : r.phones.value.join(' / '), badge(r.phones.confidence) + pad(r.phones.source, 12)],
    ['المحافظة', r.governorate.value ? r.governorate.value.name + ' (' + r.governorate.value.id + ')' : '(فاضي)', badge(r.governorate.confidence) + pad(r.governorate.source, 12)],
    ['العنوان', r.address.value === '' ? '(فاضي — محتاج سؤال)' : r.address.value, badge(r.address.confidence) + pad(r.address.source, 12)],
    ['المبلغ', r.amount.value == null ? '(فاضي)' : r.amount.value + ' جنيه', badge(r.amount.confidence) + pad(r.amount.source, 12)],
  ];
  for (const [label, value, conf] of rows) {
    console.log(pad(label, 12) + conf + value);
  }
  console.log('');
  const needsReview = [r.name, r.address].filter((f) => f.confidence === 'low' || f.confidence === 'empty').length;
  const altCount = r.phones.alternatives?.length ?? 0;
  if (needsReview > 0) console.log('⚠ ' + needsReview + ' حقل محتاج مراجعة بشرية قبل الطباعة (low/empty).');
  else console.log('كل الحقول جاهزة للتأكيد.');
  if (altCount > 0) console.log('ℹ في ' + altCount + ' رقم موبايل بديل متخزن كـ alternatives.');
  console.log('');
}

function printReport(): void {
  const fields: FieldKey[] = ['name', 'phones', 'governorate', 'amount', 'address'];
  const hits: Record<FieldKey, number> = { name: 0, phones: 0, governorate: 0, amount: 0, address: 0 };
  const failures: Array<{ id: string; field: FieldKey }> = [];

  for (const entry of CORPUS) {
    const r = extractShipment(entry.text);
    const res = evaluateEntry(entry, r);
    for (const f of fields) {
      if (res[f]) hits[f]++;
      else failures.push({ id: entry.id, field: f });
    }
  }

  const total = CORPUS.length;
  const targets: Partial<Record<FieldKey, number>> = {
    phones: 0.98,
    governorate: 0.95,
    amount: 0.90,
    name: 0.85,
  };

  console.log('==================================================');
  console.log('  waslfy-parser — تقرير الدقة على ' + total + ' رسالة اختبارية');
  console.log('==================================================');
  console.log('');
  console.log(pad('الحقل', 12) + pad('النتيجة', 10) + pad('الدقة', 10) + pad('الهدف', 15) + 'الحالة');
  console.log('-'.repeat(56));

  const status: Record<FieldKey, string> = { name: '', phones: '', governorate: '', amount: '', address: '' };
  for (const f of fields) {
    const pct = hits[f] / total;
    const target = targets[f];
    let state: string;
    if (target != null) {
      state = pct >= target ? 'PASS' : 'FAIL';
    } else {
      state = pct >= 0.8 ? 'INFO' : 'INFO';
    }
    status[f] = state;
    const pctStr = (pct * 100).toFixed(1) + '%';
    const targetStr = target != null ? '>= ' + (target * 100).toFixed(0) + '%' : 'low-by-design';
    console.log(pad(LABELS[f], 12) + pad(hits[f] + '/' + total, 10) + pad(pctStr, 10) + pad(targetStr, 12) + state);
  }

  if (failures.length > 0) {
    console.log('');
    console.log('حالات فشل:');
    for (const fail of failures) {
      const entry = CORPUS.find((e) => e.id === fail.id);
      if (!entry) continue;
      const r = extractShipment(entry.text);
      console.log('  - ' + fail.id + ' / ' + LABELS[fail.field] + ' → متوقع: ' + JSON.stringify(entry.expected[fail.field === 'address' ? 'addressContains' : fail.field]) + ' | طلع: ' + JSON.stringify(r[fail.field === 'name' ? 'name' : fail.field].value));
    }
  }
  console.log('');
}

const args = process.argv.slice(2);
if (args.length === 0) {
  printReport();
} else {
  printExtraction(args.join(' '));
}
