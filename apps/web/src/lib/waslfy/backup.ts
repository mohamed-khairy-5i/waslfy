/**
 * النسخ الاحتياطي والاستيراد — M4 (إلزامي في الـ Blueprint).
 * ملف JSON واحد فيه كل حاجة: الشحنات + الإعدادات — محلي بالكامل.
 * الاستيراد بيدمج بذكاء: السجل الأحدث (updatedAt) هو اللي بيكسب،
 * ولو نسختك المحلية أحدث بيتجاهل الملف — يعني الاستيراد ميبوّظش شغلك.
 */
import { db, setSetting, type ShipmentRecord, type SettingRecord } from './db';
import { downloadBlob } from './excel-export';

export { mergeShipments } from './backup-merge';
export type { ImportReport, MergeResult } from './backup-merge';
import { mergeShipments, type ImportReport } from './backup-merge';

export interface BackupFile {
  app: 'waslfy';
  version: 1;
  exportedAt: string;
  shipments: ShipmentRecord[];
  settings: SettingRecord[];
}

export async function createBackupObject(): Promise<BackupFile> {
  const [shipments, settings] = await Promise.all([
    db.shipments.toArray(),
    db.settings.toArray(),
  ]);
  return {
    app: 'waslfy',
    version: 1,
    exportedAt: new Date().toISOString(),
    shipments,
    settings,
  };
}

/** تنزيل نسخة احتياطية — بيرجع عدد الشحنات فيها. */
export async function downloadBackup(): Promise<number> {
  const data = await createBackupObject();
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  downloadBlob(
    blob,
    `waslfy-backup-${new Date().toISOString().slice(0, 10)}.json`
  );
  await setSetting('lastBackupAt', Date.now());
  return data.shipments.length;
}

function isValidRecord(r: unknown): r is ShipmentRecord {
  if (!r || typeof r !== 'object') return false;
  const rec = r as Record<string, unknown>;
  return typeof rec.id === 'string' && typeof rec.rawText === 'string';
}

export async function importBackupFile(file: File): Promise<ImportReport> {
  const text = await file.text();
  let data: BackupFile;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('الملف مش JSON صالح');
  }
  if (
    !data ||
    data.app !== 'waslfy' ||
    data.version !== 1 ||
    !Array.isArray(data.shipments)
  ) {
    throw new Error('الملف مش نسخة Waslfy — اختار ملف waslfy-backup');
  }

  const incoming = data.shipments.filter(isValidRecord);
  const report: ImportReport = {
    added: 0,
    updated: 0,
    skipped: data.shipments.length - incoming.length,
  };

  await db.transaction('rw', db.shipments, db.settings, async () => {
    const existing = await db.shipments.toArray();
    const { puts, report: merge } = mergeShipments(existing, incoming);
    report.added = merge.added;
    report.updated = merge.updated;
    report.skipped += merge.skipped;
    if (puts.length) await db.shipments.bulkPut(puts);

    if (Array.isArray(data.settings)) {
      for (const s of data.settings) {
        if (!s || typeof s.key !== 'string' || s.key === 'lastBackupAt') continue;
        await db.settings.put({ key: s.key, value: s.value });
      }
    }
  });

  return report;
}
