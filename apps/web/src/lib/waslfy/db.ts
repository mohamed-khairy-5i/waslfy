/**
 * قاعدة البيانات المحلية — IndexedDB عبر Dexie.
 * جهاز المستخدم هو السيرفر: مفيش أي بيانات بتسيب المتصفح أصلًا.
 * كل حقل متخزّن بنفس StoredField pattern من الـ Blueprint:
 *   { value, confidence, source, confirmed }
 * عشان قاعدة «ممنوع القيم الصامتة» تتفرض على الحفظ والتأكيد مش على العرض بس.
 */
import Dexie, { type EntityTable } from 'dexie';
import type { ShipmentFields } from 'waslfy-parser';

export type FieldStatus = 'high' | 'medium' | 'low' | 'empty';
export type FieldOrigin = 'regex' | 'dictionary' | 'context' | 'user' | 'smart-ai';

export interface StoredField<T> {
  value: T;
  confidence: FieldStatus;
  source: FieldOrigin;
  confirmed: boolean;
}

export type ShipmentStatus = 'draft' | 'confirmed' | 'printed' | 'archived';
/**
 * M4: التصدير مش حالة منفصلة — الشحنة المتصدّرة غالبًا متطبوعة برضه،
 * فالتتبع بيحصل بـ batchId (رقم دفعة التصدير) + exportCount،
 * والسجلات القديمة من M2/M3 بتشتغل من غير أي migration (الحقول optional).
 */
export interface GovernorateValue {
  id: string;
  name: string;
}

export interface ShipmentRecord {
  id: string;
  createdAt: number;
  updatedAt: number;
  rawText: string;
  name: StoredField<string | null>;
  phones: StoredField<string[]>;
  governorate: StoredField<GovernorateValue | null>;
  address: StoredField<string | null>;
  amount: StoredField<number | null>;
  status: ShipmentStatus;
  /** عدد مرات الطباعة — M3 */
  printCount: number;
  /** آخر دفعة تصدير Excel — M4 */
  batchId?: string;
  /** عدد مرات التصدير — M4 */
  exportCount?: number;
  notes: string;
}

/** إعدادات التطبيق — M4: lastBackupAt وأي تفضيلات جاية (أعمدة التصدير المخصصة…). */
export interface SettingRecord {
  key: string;
  value: unknown;
}

export const db = new Dexie('waslfy') as Dexie & {
  shipments: EntityTable<ShipmentRecord, 'id'>;
  settings: EntityTable<SettingRecord, 'key'>;
};

db.version(2).stores({
  // index على status وcreatedAt عشان القايمة والفلاتر — باقي الحقول جوه السجل نفسه
  shipments: 'id, status, createdAt',
  // جدول إعدادات key/value — M4
  settings: 'key',
});

export async function getSetting<T>(key: string): Promise<T | undefined> {
  const rec = await db.settings.get(key);
  return rec?.value as T | undefined;
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  await db.settings.put({ key, value });
}

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function stored<T>(
  value: T,
  confidence: FieldStatus,
  source: FieldOrigin,
  confirmed = false
): StoredField<T> {
  return { value, confidence, source, confirmed };
}

/** نسخة حافظة من الاستخراج اللحظي — كل حقل بيتخزن بثقته ومصدره زي ما هو. */
export function snapshotFromDraft(rawText: string, d: ShipmentFields): ShipmentRecord {
  const now = Date.now();
  return {
    id: newId(),
    createdAt: now,
    updatedAt: now,
    rawText,
    name: stored(d.name.value ?? null, d.name.confidence, d.name.source),
    phones: stored([...(d.phones.value ?? [])], d.phones.confidence, d.phones.source),
    governorate: d.governorate.value
      ? stored(
          { id: d.governorate.value.id, name: d.governorate.value.name },
          d.governorate.confidence,
          d.governorate.source
        )
      : stored(null, 'empty', 'dictionary'),
    address: stored(d.address.value ?? null, d.address.confidence, d.address.source),
    amount: stored(d.amount.value ?? null, d.amount.confidence, d.amount.source),
    status: 'draft',
    printCount: 0,
    notes: '',
  };
}

/** المستخدم عدّل حقل بإيده → القيمة بقت مؤكدة ومصدرها «user». */
export function userField<T>(value: T): StoredField<T> {
  return stored(value, 'high', 'user', true);
}

/** تطبيع رقم موبايل مصري مكتوب بإيد المستخدم — بيرجع null لو مش رقم صالح. */
export function normalizeUserPhone(input: string): string | null {
  let d = input.replace(/[\s\-().]/g, '');
  d = d.replace(/^\+?20/, '').replace(/^0020/, '');
  if (/^01[0125][0-9]{8}$/.test(d)) return d;
  if (/^1[0125][0-9]{8}$/.test(d)) return `0${d}`;
  return null;
}

/**
 * قاعدة «ممنوع القيم الصامتة» — بتمنع التأكيد لو:
 * (1) في حقل إجباري فاضي، أو
 * (2) في حقل ثقته low/empty ومتأكدش بإيد المستخدم.
 * العنوان low بالتصميم — فالتأكيد البشري عليه إلزامي قبل الحالة «مؤكدة».
 */
export function blockingIssues(s: ShipmentRecord): string[] {
  const checks: Array<[string, StoredField<unknown>]> = [
    ['الاسم', s.name],
    ['رقم التليفون', s.phones],
    ['المحافظة', s.governorate],
    ['العنوان', s.address],
    ['المبلغ', s.amount],
  ];
  const issues: string[] = [];
  for (const [label, f] of checks) {
    const v = f.value;
    const isEmpty =
      v == null ||
      (Array.isArray(v) && v.length === 0) ||
      (typeof v === 'string' && v.trim() === '');
    if (isEmpty) {
      issues.push(label);
      continue;
    }
    if ((f.confidence === 'low' || f.confidence === 'empty') && !f.confirmed) {
      issues.push(`${label} (محتاج تأكيد)`);
    }
  }
  return issues;
}

export async function addShipment(record: ShipmentRecord): Promise<void> {
  await db.shipments.add(record);
}

export async function patchShipment(
  id: string,
  patch: Partial<ShipmentRecord>
): Promise<void> {
  await db.shipments.update(id, { ...patch, updatedAt: Date.now() });
}

export async function removeShipment(id: string): Promise<void> {
  await db.shipments.delete(id);
}

/**
 * بعد ما الطباعة تتنفذ: الحالة بتبقى «مطبوعة» والعداد بيزيد.
 * السجلات القديمة اللي من M2 مش فيها printCount — بنعتبرها صفر من غير أي migration.
 */
export async function markPrinted(id: string): Promise<void> {
  const record = await db.shipments.get(id);
  await patchShipment(id, {
    status: 'printed',
    printCount: (record?.printCount ?? 0) + 1,
  });
}

/**
 * بعد ما تصدير Excel يتم: بنسجّل رقم الدفعة والعداد على كل شحنة اتصدرت.
 * transaction واحدة عشان الدفعة كلها تتسجل مع بعض أو تتراجع كلها.
 */
export async function markExported(ids: string[], batchId: string): Promise<void> {
  await db.transaction('rw', db.shipments, async () => {
    for (const id of ids) {
      const rec = await db.shipments.get(id);
      if (!rec) continue;
      await db.shipments.update(id, {
        batchId,
        exportCount: (rec.exportCount ?? 0) + 1,
        updatedAt: Date.now(),
      });
    }
  });
}

/**
 * بوابة الطباعة والتصدير (M3+M4 نفس القاعدة):
 * المسودة/الأرشيف محجوبة، وأي شحنة فيها حقل فاضي أو low غير مؤكد محجوبة برضه.
 */
export function printableIssues(r: ShipmentRecord): string[] {
  if (r.status === 'draft' || r.status === 'archived') return ['الشحنة لسه متأكدتش'];
  return blockingIssues(r);
}
