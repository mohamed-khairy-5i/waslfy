/**
 * تصدير Excel — M4.
 * قوالب جاهزة لأكتر من شركة شحن + أعمدة مخصصة بأي تركيبة.
 * الملف بيتبني كله في المتصفح (SheetJS community من cdn.sheetjs.com — مجاني)
 * ومفيش أي بيانات بتتسرفر — نفس وعد الخصوصية بتاع المشروع كله.
 * ملاحظة تقنية: الهواتف بتنزل نصوص (مش أرقام) عشان Excel ميعملهاش 1.2E+10.
 */
import * as XLSX from 'xlsx';
import { labelCode } from './barcode';
import type { ShipmentRecord, ShipmentStatus } from './db';

export type ColumnKey =
  | 'reference'
  | 'date'
  | 'name'
  | 'phone'
  | 'governorate'
  | 'address'
  | 'amount'
  | 'currency'
  | 'notes'
  | 'status'
  | 'printCount'
  | 'exportCount';

/** كل الأعمدة الممكنة — القوالب بتختار منها، والمستخدم يقدر يفصّل بنفسه. */
export const ALL_COLUMNS: Array<{ key: ColumnKey; label: string }> = [
  { key: 'reference', label: 'الكود الداخلي' },
  { key: 'date', label: 'تاريخ الطلب' },
  { key: 'name', label: 'اسم المستلم' },
  { key: 'phone', label: 'رقم الموبايل' },
  { key: 'governorate', label: 'المحافظة' },
  { key: 'address', label: 'العنوان' },
  { key: 'amount', label: 'مبلغ التحصيل' },
  { key: 'currency', label: 'العملة' },
  { key: 'notes', label: 'ملاحظات' },
  { key: 'status', label: 'الحالة' },
  { key: 'printCount', label: 'مرات الطباعة' },
  { key: 'exportCount', label: 'مرات التصدير' },
];

export interface TemplateCol {
  key: ColumnKey;
  header: string;
}

export interface ExportTemplate {
  id: string;
  label: string;
  /** القوالب العربية بتتفتح RTL جوه Excel نفسها. */
  rtl: boolean;
  fileName: string;
  cols: TemplateCol[];
}

export const TEMPLATES: ExportTemplate[] = [
  {
    id: 'waslfy',
    label: 'عام — كل التفاصيل',
    rtl: true,
    fileName: 'waslfy-shipments',
    cols: [
      { key: 'reference', header: 'الكود الداخلي' },
      { key: 'date', header: 'تاريخ الطلب' },
      { key: 'name', header: 'اسم المستلم' },
      { key: 'phone', header: 'رقم الموبايل' },
      { key: 'governorate', header: 'المحافظة' },
      { key: 'address', header: 'العنوان بالتفصيل' },
      { key: 'amount', header: 'مبلغ التحصيل (ج.م)' },
      { key: 'notes', header: 'ملاحظات' },
      { key: 'status', header: 'الحالة' },
      { key: 'printCount', header: 'مرات الطباعة' },
    ],
  },
  {
    id: 'bosta',
    label: 'بوسطة مصر',
    rtl: true,
    fileName: 'bosta-shipments',
    cols: [
      { key: 'name', header: 'اسم المستلم' },
      { key: 'phone', header: 'رقم الهاتف' },
      { key: 'governorate', header: 'المحافظة' },
      { key: 'address', header: 'العنوان بالتفصيل' },
      { key: 'amount', header: 'مبلغ التحصيل (جنيه)' },
      { key: 'notes', header: 'محتوى الشحنة / ملاحظات' },
    ],
  },
  {
    id: 'aramex',
    label: 'أرامكس Aramex',
    rtl: false,
    fileName: 'aramex-shipments',
    cols: [
      { key: 'reference', header: 'Reference' },
      { key: 'name', header: 'Customer Name' },
      { key: 'phone', header: 'Mobile Number' },
      { key: 'governorate', header: 'City / State' },
      { key: 'address', header: 'Address' },
      { key: 'amount', header: 'COD Amount' },
      { key: 'currency', header: 'Currency' },
      { key: 'notes', header: 'Description' },
    ],
  },
  {
    id: 'mylerz',
    label: 'mylerz',
    rtl: false,
    fileName: 'mylerz-shipments',
    cols: [
      { key: 'name', header: 'Recipient Name' },
      { key: 'phone', header: 'Phone' },
      { key: 'governorate', header: 'Governorate' },
      { key: 'address', header: 'Address' },
      { key: 'amount', header: 'COD Amount' },
      { key: 'reference', header: 'Reference' },
    ],
  },
];

const STATUS_AR: Record<ShipmentStatus, string> = {
  draft: 'مسودة',
  confirmed: 'مؤكدة',
  printed: 'مطبوعة',
  archived: 'أرشيف',
};

function fmtDateTime(ts: number): string {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function cell(r: ShipmentRecord, key: ColumnKey): string | number {
  switch (key) {
    case 'reference':
      return labelCode(r.id);
    case 'date':
      return fmtDateTime(r.createdAt);
    case 'name':
      return r.name.value ?? '';
    case 'phone':
      return (r.phones.value ?? []).join(' / ');
    case 'governorate':
      return r.governorate.value?.name ?? '';
    case 'address':
      return r.address.value ?? '';
    case 'amount':
      return r.amount.value ?? '';
    case 'currency':
      return r.amount.value != null ? 'EGP' : '';
    case 'notes':
      return r.notes ?? '';
    case 'status':
      return STATUS_AR[r.status] ?? r.status;
    case 'printCount':
      return r.printCount ?? 0;
    case 'exportCount':
      return r.exportCount ?? 0;
  }
}

export interface BuiltSheet {
  headers: string[];
  rows: Array<Array<string | number>>;
}

export function buildSheetData(
  records: ShipmentRecord[],
  columns: Array<{ key: ColumnKey; header: string }>
): BuiltSheet {
  return {
    headers: columns.map((c) => c.header),
    rows: records.map((r) => columns.map((c) => cell(r, c.key))),
  };
}

/** بناء xlsx كـ base64 — مع دعم RTL للقوالب العربية. */
export function buildXlsxBase64(sheet: BuiltSheet, opts: { rtl: boolean }): string {
  const wb = XLSX.utils.book_new();
  wb.Workbook = { Views: [{ RTL: opts.rtl }] };
  const ws = XLSX.utils.aoa_to_sheet([sheet.headers, ...sheet.rows]);
  ws['!cols'] = sheet.headers.map((h, i) => ({
    wch: Math.max(
      h.length + 4,
      ...sheet.rows.map((row) => String(row[i] ?? '').length + 2)
    ),
  }));
  XLSX.utils.book_append_sheet(wb, ws, 'الشحنات');
  return XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** توليد وتنزيل ملف Excel للشحنات المحددة — بيرجع اسم الملف. */
export function exportShipmentsToExcel(
  records: ShipmentRecord[],
  columns: Array<{ key: ColumnKey; header: string }>,
  opts: { rtl: boolean; fileName: string }
): string {
  const sheet = buildSheetData(records, columns);
  const b64 = buildXlsxBase64(sheet, { rtl: opts.rtl });
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const fileName = `${opts.fileName}-${new Date().toISOString().slice(0, 10)}.xlsx`;
  downloadBlob(new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), fileName);
  return fileName;
}
