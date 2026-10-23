'use client';

/**
 * قايمة الشحنات — M2 + M3.
 * M2: قراءة لحظية من IndexedDB + كارت قابل للتعديل + تأكيد بشري إلزامي للحقول low.
 * M3: بحث عربي مطبَّع + طباعة A6 بباركود (فردية وجماعية) + حجب الطباعة للحقول غير المؤكدة
 *     + حالة «مطبوعة» وعدّاد طباعة.
 * المظهر: هوية «وصلّي» — كروت بيضا بظل ناعم على ورق دافي، شارات حالة بألوان الهوية.
 */

import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { GOVERNORATES } from 'waslfy-parser';
import {
  Archive,
  ArchiveRestore,
  CheckCircle2,
  Layers,
  Pencil,
  Printer,
  Search,
  ShieldAlert,
  Trash2,
  X,
  PackageOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  blockingIssues,
  db,
  markPrinted,
  normalizeUserPhone,
  patchShipment,
  printableIssues,
  removeShipment,
  userField,
  type ShipmentRecord,
  type StoredField,
} from '@/lib/waslfy/db';
import { CONFIDENCE_META } from './field-card';
import { PrintSheet } from './print-label';
import { PrintPreviewDialog } from './print-dialog';
import { ExportButton } from './export-dialog';

const STATUS_META: Record<string, { label: string; cls: string }> = {
  draft: { label: 'مسودة', cls: 'bg-[#eeece3] text-[#6f7a70] border-[#dcd8ca]' },
  confirmed: { label: 'مؤكدة', cls: 'bg-[#e5efe7] text-[#0c5c42] border-[#bcd8c6]' },
  printed: { label: 'مطبوعة', cls: 'bg-[#dff0ea] text-[#11554a] border-[#b3d9cd]' },
  archived: { label: 'أرشيف', cls: 'bg-[#f7ecd7] text-[#8a5a0a] border-[#e4cda2]' },
};

function fmtDate(ts: number): string {
  try {
    return new Intl.DateTimeFormat('ar-EG', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(ts);
  } catch {
    return '';
  }
}

/** تطبيع خفيف للبحث العربي: تشكيل، همزات، ة/ه، ى/ي، أرقام هندية، حالة حروف. */
const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
function normForSearch(s: string): string {
  return s
    .replace(/[\u064B-\u0652\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)))
    .toLowerCase();
}

function recordHaystack(r: ShipmentRecord): string {
  return [
    r.name.value ?? '',
    ...(r.phones.value ?? []),
    r.governorate.value?.name ?? '',
    r.address.value ?? '',
    r.amount.value != null ? String(r.amount.value) : '',
    r.rawText,
  ].join(' ');
}

/** الشحنة تقدر تتطبع/تتصدّر فقط لو: كل الحقول الإجبارية مؤكدة + حالتها مؤكدة أو مطبوعة قبل كده. */

function FieldLine({
  label,
  field,
  children,
  onConfirm,
}: {
  label: string;
  field: StoredField<unknown>;
  children: React.ReactNode;
  onConfirm?: () => void;
}) {
  const meta = CONFIDENCE_META[field.confidence] ?? CONFIDENCE_META.empty;
  const needsReview =
    (field.confidence === 'low' || field.confidence === 'empty') && !field.confirmed;

  return (
    <div className="flex flex-wrap items-start gap-x-2.5 gap-y-1.5 text-sm">
      <span className="w-16 shrink-0 pt-0.5 text-[11px] font-semibold text-[#a09c8d]">
        {label}
      </span>
      <span className="min-w-0 flex-1 font-semibold text-[#17251f] break-words">
        {children ?? <span className="font-normal text-[#c5c2b4]">—</span>}
      </span>
      <span
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${meta.badge}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
        {meta.label}
      </span>
      {needsReview && onConfirm && (
        <Button
          size="sm"
          variant="outline"
          className="h-6 rounded-full border-[#bcd8c6] bg-[#e5efe7] px-2.5 text-[10px] font-bold text-[#0c5c42] hover:bg-[#dcebe0]"
          onClick={onConfirm}
        >
          <CheckCircle2 className="h-3 w-3" />
          راجعته — ثبّته
        </Button>
      )}
    </div>
  );
}

function EditForm({
  record,
  onDone,
  onCancel,
}: {
  record: ShipmentRecord;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(record.name.value ?? '');
  const [phone, setPhone] = useState(record.phones.value?.[0] ?? '');
  const [govId, setGovId] = useState<string>(record.governorate.value?.id ?? '');
  const [address, setAddress] = useState(record.address.value ?? '');
  const [amount, setAmount] = useState<string>(
    record.amount.value != null ? String(record.amount.value) : ''
  );
  const [error, setError] = useState<string | null>(null);

  async function save() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('الاسم مينفعش يبقى فاضي');
      return;
    }
    const cleanedPhone = phone.trim() ? normalizeUserPhone(phone) : null;
    if (phone.trim() && !cleanedPhone) {
      setError('الرقم مش رقم موبايل مصري صالح (01xxxxxxxxx)');
      return;
    }
    const gov = GOVERNORATES.find((g) => g.id === govId);
    if (!gov) {
      setError('اختار المحافظة');
      return;
    }
    const parsedAmount = amount.trim() ? Number(amount.replace(/,/g, '')) : null;
    if (parsedAmount != null && (!isFinite(parsedAmount) || parsedAmount < 0)) {
      setError('المبلغ مش رقم صحيح');
      return;
    }

    await patchShipment(record.id, {
      name: userField(trimmedName),
      phones: userField(cleanedPhone ? [cleanedPhone] : record.phones.value),
      governorate: userField({ id: gov.id, name: gov.name }),
      address: userField(address.trim()),
      amount: parsedAmount != null ? userField(parsedAmount) : record.amount,
    });
    onDone();
  }

  return (
    <div className="space-y-3 rounded-2xl border border-[#e2ded1] bg-[#fbfaf6] p-4" dir="rtl">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-[11px] font-semibold text-[#6f7a70]">الاسم *</span>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            dir="auto"
            className="rounded-xl border-[#dcd8ca] bg-white focus-visible:ring-[#0c5c42]/30"
          />
        </label>
        <label className="space-y-1">
          <span className="text-[11px] font-semibold text-[#6f7a70]">رقم الموبايل *</span>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            dir="ltr"
            placeholder="01xxxxxxxxx"
            inputMode="tel"
            className="rounded-xl border-[#dcd8ca] bg-white focus-visible:ring-[#0c5c42]/30"
          />
        </label>
        <label className="space-y-1">
          <span className="text-[11px] font-semibold text-[#6f7a70]">المحافظة *</span>
          <select
            value={govId}
            onChange={(e) => setGovId(e.target.value)}
            className="h-9 w-full rounded-xl border border-[#dcd8ca] bg-white px-2.5 text-sm text-[#17251f] focus:outline-none focus:ring-2 focus:ring-[#0c5c42]/30"
          >
            <option value="" disabled>
              اختار المحافظة…
            </option>
            {GOVERNORATES.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-[11px] font-semibold text-[#6f7a70]">
            المبلغ (كاش عند الاستلام)
          </span>
          <Input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            dir="ltr"
            inputMode="numeric"
            placeholder="450"
            className="rounded-xl border-[#dcd8ca] bg-white focus-visible:ring-[#0c5c42]/30"
          />
        </label>
      </div>
      <label className="block space-y-1">
        <span className="text-[11px] font-semibold text-[#6f7a70]">العنوان *</span>
        <Input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          dir="auto"
          placeholder="المنطقة - الشارع - علامة مميزة"
          className="rounded-xl border-[#dcd8ca] bg-white focus-visible:ring-[#0c5c42]/30"
        />
      </label>
      {error && (
        <p className="flex items-center gap-1.5 rounded-xl bg-[#fbeae5] px-3 py-2 text-xs font-medium text-[#b3402a]">
          <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={save}
          className="rounded-full bg-[#0c5c42] text-white hover:bg-[#0a4d37]"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          حفظ التعديلات
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          className="rounded-full text-[#6f7a70] hover:text-[#17251f]"
        >
          <X className="h-3.5 w-3.5" />
          إلغاء
        </Button>
      </div>
    </div>
  );
}

function ShipmentCard({
  record,
  onPrintPreview,
}: {
  record: ShipmentRecord;
  onPrintPreview: (r: ShipmentRecord) => void;
}) {
  const [editing, setEditing] = useState(false);
  const issues = blockingIssues(record);
  const printIssues = printableIssues(record);
  const status = STATUS_META[record.status] ?? STATUS_META.draft;
  const initial = (record.name.value || '؟').trim().charAt(0);

  async function confirmField(
    key: 'name' | 'phones' | 'governorate' | 'address' | 'amount'
  ) {
    const f = record[key] as StoredField<unknown>;
    await patchShipment(record.id, {
      [key]: { ...f, confidence: f.confidence === 'empty' ? 'medium' : f.confidence, confirmed: true },
    });
  }

  async function confirmShipment() {
    await patchShipment(record.id, { status: 'confirmed' });
  }

  return (
    <div
      className={`card-lift flex flex-col rounded-3xl border bg-white p-4 transition-shadow hover:shadow-[0_2px_4px_rgba(23,37,31,0.05),0_16px_40px_-16px_rgba(12,60,45,0.25)] ${
        record.status === 'archived' ? 'border-[#e4cda2] opacity-80' : 'border-[#e2ded1]'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base font-bold ${
              record.status === 'archived'
                ? 'bg-[#f7ecd7] text-[#8a5a0a]'
                : 'bg-gradient-to-br from-[#e5efe7] to-[#d5e8db] text-[#0c5c42]'
            }`}
          >
            {initial}
          </span>
          <div className="min-w-0">
            <h3 className="truncate font-bold text-[#17251f]" dir="auto">
              {record.name.value || '(من غير اسم)'}
            </h3>
            <p className="text-[11px] text-[#a09c8d]">
              {fmtDate(record.createdAt)}
              {(record.printCount ?? 0) > 0 &&
                ` — اتطاعت ${record.printCount} ${
                  record.printCount === 1 ? 'مرة' : 'مرتين'
                }`}
              {(record.exportCount ?? 0) > 0 &&
                ` — اتصدرت ${record.exportCount} ${
                  record.exportCount === 1 ? 'مرة' : 'مرات'
                }`}
            </p>
          </div>
        </div>
        <span
          className={`rounded-full border px-2.5 py-0.5 text-[10.5px] font-bold ${status.cls}`}
        >
          {status.label}
        </span>
      </div>

      {editing ? (
        <div className="mt-3">
          <EditForm record={record} onDone={() => setEditing(false)} onCancel={() => setEditing(false)} />
        </div>
      ) : (
        <>
          <div className="mt-3 space-y-2.5 rounded-2xl bg-[#fbfaf6] p-3.5">
            <FieldLine label="التليفون" field={record.phones}>
              {record.phones.value?.length ? (
                <span dir="ltr" className="flex flex-wrap gap-1.5">
                  {record.phones.value.map((p) => (
                    <span
                      key={p}
                      className="tracking-code rounded-md border border-[#e2ded1] bg-white px-2 py-0.5 text-[13px] font-semibold"
                    >
                      {p}
                    </span>
                  ))}
                </span>
              ) : null}
            </FieldLine>
            <FieldLine
              label="المحافظة"
              field={record.governorate}
              onConfirm={record.status !== 'archived' ? () => confirmField('governorate') : undefined}
            >
              {record.governorate.value?.name ?? null}
            </FieldLine>
            <FieldLine
              label="العنوان"
              field={record.address}
              onConfirm={record.status !== 'archived' ? () => confirmField('address') : undefined}
            >
              {record.address.value ?? null}
            </FieldLine>
            <FieldLine
              label="المبلغ"
              field={record.amount}
              onConfirm={record.status !== 'archived' ? () => confirmField('amount') : undefined}
            >
              {record.amount.value != null ? (
                <span className="tabular-nums">
                  {record.amount.value} <span className="text-[11px] text-[#6f7a70]">ج.م</span>
                </span>
              ) : null}
            </FieldLine>
          </div>

          {issues.length > 0 && record.status !== 'archived' && (
            <p className="mt-3 flex items-start gap-1.5 rounded-xl border border-[#ecd0bd] bg-[#fae8dd] px-2.5 py-2 text-xs leading-5 text-[#9a4a1c]">
              <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                ممنوع التأكيد والطباعة دلوقتي — ناقص أو محتاج تأكيد:{' '}
                <b>{issues.join('، ')}</b>
              </span>
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-dashed border-[#e2ded1] pt-3">
            {record.status === 'draft' ? (
              <Button
                size="sm"
                className="h-8 rounded-full bg-[#0c5c42] text-xs font-bold text-white shadow-[0_6px_16px_-8px_rgba(12,92,66,0.6)] hover:bg-[#0a4d37]"
                disabled={issues.length > 0}
                onClick={confirmShipment}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                تأكيد الشحنة
              </Button>
            ) : (
              <Button
                size="sm"
                className="h-8 rounded-full bg-[#11554a] text-xs font-bold text-white hover:bg-[#0d453d]"
                disabled={printIssues.length > 0}
                onClick={() => onPrintPreview(record)}
              >
                <Printer className="h-3.5 w-3.5" />
                {record.status === 'printed' ? 'اطبع تاني' : 'اطبع A6'}
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="h-8 rounded-full border-[#dcd8ca] bg-white text-xs text-[#4b564e] hover:border-[#0c5c42]/40 hover:text-[#0c5c42]"
              onClick={() => setEditing(true)}
            >
              <Pencil className="h-3 w-3" />
              تعديل
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 rounded-full border-[#dcd8ca] bg-white text-xs text-[#4b564e] hover:border-[#0c5c42]/40 hover:text-[#0c5c42]"
              onClick={() =>
                patchShipment(record.id, {
                  status: record.status === 'archived' ? 'draft' : 'archived',
                })
              }
            >
              {record.status === 'archived' ? (
                <>
                  <ArchiveRestore className="h-3 w-3" />
                  رجّعها
                </>
              ) : (
                <>
                  <Archive className="h-3 w-3" />
                  أرشفة
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 rounded-full text-xs text-[#b3402a] hover:bg-[#fbeae5] hover:text-[#8f2f1c]"
              onClick={() => removeShipment(record.id)}
            >
              <Trash2 className="h-3 w-3" />
              حذف
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

type Filter = 'active' | 'confirmed' | 'printed' | 'archived';

const TABS: Array<[Filter, string]> = [
  ['active', 'الشغالة'],
  ['confirmed', 'المؤكدة'],
  ['printed', 'المطبوعة'],
  ['archived', 'الأرشيف'],
];

export function ShipmentList() {
  const records = useLiveQuery(() => db.shipments.orderBy('createdAt').reverse().toArray(), []);
  const [filter, setFilter] = useState<Filter>('active');
  const [query, setQuery] = useState('');
  const [printRecord, setPrintRecord] = useState<ShipmentRecord | null>(null);
  const [printTargets, setPrintTargets] = useState<ShipmentRecord[] | null>(null);
  const [batchNote, setBatchNote] = useState<string | null>(null);

  const all = records ?? [];
  const counts = {
    active: all.filter((r) => r.status === 'draft' || r.status === 'confirmed').length,
    confirmed: all.filter((r) => r.status === 'confirmed').length,
    printed: all.filter((r) => r.status === 'printed').length,
    archived: all.filter((r) => r.status === 'archived').length,
  };

  const baseVisible = all.filter((r) =>
    filter === 'active'
      ? r.status === 'draft' || r.status === 'confirmed'
      : r.status === filter
  );
  const q = normForSearch(query.trim());
  // البحث بيدوّر في كل الشحنات بكل الحالات (أرشيف بحث حقيقي) — من غير بحث بنعرض التبويب الحالي
  const visible = q
    ? all.filter((r) => normForSearch(recordHaystack(r)).includes(q))
    : baseVisible;

  // طباعة جماعية: كل الشحنات اللي عدّت البوابة (مؤكدة أو مطبوعة من غير إشكالات)
  const batchPrintable = all.filter((r) => printableIssues(r).length === 0);

  function startBatchPrint() {
    const targets = batchPrintable;
    if (targets.length === 0) return;
    const blocked = counts.confirmed - targets.filter((r) => r.status === 'confirmed').length;
    setBatchNote(
      blocked > 0
        ? `بندور على نافذة الطباعة — ${targets.length} شحنة. اتحجب ${blocked} شحنة عندها حقول ناقصة.`
        : `بندور على نافذة الطباعة — ${targets.length} شحنة جاهزة.`
    );
    setPrintTargets(targets);
  }

  // لما الـ print-root يترسم بنطلب الطباعة — وبعدها بنعلم الشحنات ونبعت التقرير
  useEffect(() => {
    if (!printTargets || printTargets.length === 0) return;
    const targets = printTargets;
    const t = window.setTimeout(() => {
      try {
        window.print();
      } catch {
        // بعض البيئات headless مش بتدعم window.print — بنكمل تعليم الشحنات عادي
      }
      targets.forEach((r) => void markPrinted(r.id));
      setPrintTargets(null);
    }, 120);
    return () => window.clearTimeout(t);
  }, [printTargets]);

  return (
    <section className="card-lift rounded-3xl border border-[#e2ded1] bg-white">
      <div className="space-y-4 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="tracking-code text-[10px] font-semibold text-[#c97b10]">
              LOCAL FIRST — INDEXEDDB
            </span>
            <h2 className="text-lg font-bold tracking-tight text-[#17251f]">
              شحناتي{' '}
              <span className="text-xs font-normal text-[#a09c8d]">
                محفوظة على جهازك — اعمل refresh وهتفضل مكانها
              </span>
            </h2>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <ExportButton records={all} />
            <Button
              size="sm"
              className="h-8 rounded-full bg-[#11554a] text-xs font-bold text-white hover:bg-[#0d453d]"
              disabled={batchPrintable.length === 0}
              onClick={startBatchPrint}
            >
              <Layers className="h-3.5 w-3.5" />
              اطبع المؤكدة كلها ({batchPrintable.length})
            </Button>
          </div>
        </div>

        {/* التابات + البحث */}
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="flex w-fit rounded-full border border-[#e2ded1] bg-[#f4f2ea] p-1">
            {TABS.map(([key, label]) => (
              <button
                key={key}
                className={`h-7 rounded-full px-3 text-xs font-bold transition-all ${
                  filter === key
                    ? 'bg-[#0c5c42] text-white shadow-[0_4px_10px_-4px_rgba(12,92,66,0.5)]'
                    : 'text-[#6f7a70] hover:text-[#17251f]'
                }`}
                onClick={() => setFilter(key)}
              >
                {label}
                <span className={`ms-1 tabular-nums ${filter === key ? 'text-[#a7e3c3]' : 'text-[#a09c8d]'}`}>
                  {counts[key]}
                </span>
              </button>
            ))}
          </div>
          <div className="relative flex-1">
            <Search className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-[#a09c8d]" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث في كل الشحنات: اسم، رقم، محافظة، عنوان، مبلغ…"
              className="h-9 rounded-full border-[#dcd8ca] bg-[#fbfaf6] pr-9 focus-visible:ring-[#0c5c42]/30"
              dir="rtl"
            />
          </div>
        </div>

        {batchNote && (
          <p className="rounded-xl border border-[#b3d9cd] bg-[#dff0ea] px-3 py-2 text-xs leading-5 text-[#11554a]">
            {batchNote}
          </p>
        )}

        {visible.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-[#e2ded1] bg-[#fbfaf6] p-8 text-center">
            <PackageOpen className="mx-auto h-8 w-8 text-[#c5c2b4]" />
            <p className="mt-2 text-sm font-medium text-[#6f7a70]">
              {all.length === 0
                ? 'لسه مفيش شحنات محفوظة — استخرج بيانات من رسالة واضغط «احفظ الشحنة»'
                : query
                  ? 'مفيش نتيجة للبحث ده في كل الشحنات — جرب اسم أو رقم تاني'
                  : 'مفيش حاجة في الفلتر ده'}
            </p>
          </div>
        ) : (
          <div className="grid items-start gap-4 md:grid-cols-2">
            {visible.map((r) => (
              <ShipmentCard key={r.id} record={r} onPrintPreview={setPrintRecord} />
            ))}
          </div>
        )}
      </div>

      {/* ديالوج المعاينة للطباعة الفردية */}
      <PrintPreviewDialog
        record={printRecord}
        open={printRecord !== null}
        onOpenChange={(open) => {
          if (!open) setPrintRecord(null);
        }}
        onPrinted={(r) => void markPrinted(r.id)}
      />

      {/* شيت الطباعة — مخفي على الشاشة، بيتطبع A6 لكل شحنة */}
      {printTargets && <PrintSheet records={printTargets} />}
    </section>
  );
}
