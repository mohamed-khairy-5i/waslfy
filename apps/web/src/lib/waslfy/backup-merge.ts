/**
 * منطق دمج النسخة الاحتياطية — pure 100% (من غير IndexedDB)
 * عشان يبقى قابل للاختبار مباشرة في bun من غير أي بيئة متصفح.
 */

import type { ShipmentRecord } from './db';

export interface ImportReport {
  added: number;
  updated: number;
  /** سجلات اتجاهلت: مكررة أحدث محليًا أو تالفة. */
  skipped: number;
}

export interface MergeResult {
  puts: ShipmentRecord[];
  report: ImportReport;
}

/**
 * دمج pure قابل للاختبار من غير IndexedDB:
 * جديد → add | الملف أحدث → update | المحلي أحدث → تجاهل.
 */
export function mergeShipments(
  existing: ShipmentRecord[],
  incoming: ShipmentRecord[]
): MergeResult {
  const byId = new Map(existing.map((r) => [r.id, r]));
  const puts: ShipmentRecord[] = [];
  const report: ImportReport = { added: 0, updated: 0, skipped: 0 };
  for (const inc of incoming) {
    if (!inc || typeof inc.id !== 'string' || !inc.id) {
      report.skipped++;
      continue;
    }
    const cur = byId.get(inc.id);
    const incomingAt = typeof inc.updatedAt === 'number' ? inc.updatedAt : 0;
    if (!cur) {
      puts.push(inc);
      report.added++;
    } else if (incomingAt > cur.updatedAt) {
      puts.push(inc);
      report.updated++;
    } else {
      report.skipped++;
    }
  }
  return { puts, report };
}
