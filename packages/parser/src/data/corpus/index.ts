/**
 * الـ corpus العام — 40 رسالة مصرية واقعية (فصحى، عامية، إنجليزي، أرقام هندية، سطر واحد، حالات خاصة).
 * ده قلب أداة السمعة: نفس البيانات اللي بتتقاس عليها الدقة في الـ CI، متاحة لكل حد يستخدم الحزمة.
 *
 * الصيغة: CorpusEntry { text, expect: { ... } } — وشوف evaluateEntry لقواعد المقارنة الصادقة
 * (الاستخراج الفاضي بيحسب غلطة مش نجاح).
 */

import type { CorpusEntry } from '../../eval';

import basicRaw from './basic.json';
import dialectRaw from './dialect.json';
import mixedRaw from './mixed-lang.json';
import numeralsRaw from './arabic-numerals.json';
import multilineRaw from './multiline.json';
import liveRaw from './live.json';

export const PUBLIC_CORPUS: CorpusEntry[] = [
  ...(basicRaw as unknown as CorpusEntry[]),
  ...(dialectRaw as unknown as CorpusEntry[]),
  ...(mixedRaw as unknown as CorpusEntry[]),
  ...(numeralsRaw as unknown as CorpusEntry[]),
  ...(multilineRaw as unknown as CorpusEntry[]),
  ...(liveRaw as unknown as CorpusEntry[]),
];
