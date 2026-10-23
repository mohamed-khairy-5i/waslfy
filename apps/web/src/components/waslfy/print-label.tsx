'use client';

/**
 * ليبل طباعة A6 (105×148mm) — M3.
 * ده packing slip مش بوليصة رسمية: اللي بيتطبع ملخص تسليم للمندوب.
 * نفس المكوّن بيشتغل في المعاينة جوه الديالوج وفي شيت الطباعة الفعلي.
 */

import { ShipmentBarcode } from './barcode';
import { labelCode } from '@/lib/waslfy/barcode';
import type { ShipmentRecord } from '@/lib/waslfy/db';

function fmtDate(ts: number): string {
  try {
    return new Intl.DateTimeFormat('ar-EG', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    }).format(ts);
  } catch {
    return '';
  }
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'baseline' }}>
      <span style={{ width: '58px', flexShrink: 0, fontSize: '8.5pt', color: '#777' }}>
        {label}
      </span>
      <span style={{ minWidth: 0, flex: 1 }}>{children}</span>
    </div>
  );
}

export function PrintLabel({ record }: { record: ShipmentRecord }) {
  const code = labelCode(record.id);
  const phone = record.phones.value?.[0] ?? '';
  const phone2 = record.phones.value?.[1] ?? '';

  return (
    <div
      className="print-label"
      dir="rtl"
      style={{
        width: '105mm',
        minHeight: '148mm',
        background: '#ffffff',
        color: '#111',
        padding: '7mm',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: '4mm',
        fontFamily: 'inherit',
        border: '1.5px dashed #999',
        printColorAdjust: 'exact',
        WebkitPrintColorAdjust: 'exact',
      }}
    >
      {/* الهيدر */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '2px solid #0c5c42',
          paddingBottom: '2.5mm',
          printColorAdjust: 'exact',
          WebkitPrintColorAdjust: 'exact',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '2.5mm' }}>
          <span
            style={{
              display: 'inline-flex',
              width: '9mm',
              height: '9mm',
              borderRadius: '2mm',
              background: '#0c5c42',
              color: '#fff',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '13pt',
              printColorAdjust: 'exact',
              WebkitPrintColorAdjust: 'exact',
            }}
          >
            و
          </span>
          <span style={{ fontWeight: 700, fontSize: '12pt' }}>وصلّي — إيصال تسليم</span>
        </div>
        <span style={{ fontSize: '8pt', color: '#666' }}>{fmtDate(record.createdAt)}</span>
      </div>

      {/* الكود + الباركود */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'monospace', fontSize: '10pt', letterSpacing: '1px', color: '#333' }}>
          {code}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2mm' }}>
          <ShipmentBarcode value={code} moduleWidth={1.6} height={44} />
        </div>
      </div>

      {/* بيانات العميل */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2.8mm', fontSize: '10pt' }}>
        <Row label="الاسم">
          <b style={{ fontSize: '13pt' }}>{record.name.value || '—'}</b>
        </Row>
        <Row label="الموبايل">
          <b dir="ltr" style={{ fontFamily: 'monospace', fontSize: '12pt' }}>
            {phone || '—'}
          </b>
          {phone2 && (
            <span dir="ltr" style={{ fontFamily: 'monospace', fontSize: '10pt', color: '#555' }}>
              {' / '}
              {phone2}
            </span>
          )}
        </Row>
        <Row label="المحافظة">
          <b>{record.governorate.value?.name || '—'}</b>
        </Row>
        <Row label="العنوان">
          <span style={{ lineHeight: 1.5 }}>{record.address.value || '—'}</span>
        </Row>
      </div>

      {/* الكود المالي — أهم حتة للمندوب */}
      <div
        style={{
          marginTop: 'auto',
          border: '2px solid #0c5c42',
          borderRadius: '2mm',
          padding: '3mm 4mm',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          printColorAdjust: 'exact',
          WebkitPrintColorAdjust: 'exact',
        }}
      >
        <span style={{ fontSize: '9pt', color: '#555' }}>كاش عند الاستلام</span>
        <span style={{ fontWeight: 800, fontSize: '16pt' }}>
          {record.amount.value != null ? `${record.amount.value} ج.م` : '—'}
        </span>
      </div>

      {/* الفوتر */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '7.5pt',
          color: '#888',
          borderTop: '1px solid #ddd',
          paddingTop: '2mm',
        }}
      >
        <span>بياناتك محلية 100% — وصلّي</span>
        <span>
          طباعة #{record.printCount ?? 0} — {fmtDate(Date.now())}
        </span>
      </div>
    </div>
  );
}

/** شيت الطباعة الفعلي — بيتخفي على الشاشة ويظهر بس في الطباعة (صفحة A6 لكل شحنة). */
export function PrintSheet({ records }: { records: ShipmentRecord[] }) {
  return (
    <div className="print-root" aria-hidden={true}>
      {records.map((r) => (
        <div key={r.id} className="print-page">
          <PrintLabel record={r} />
        </div>
      ))}
    </div>
  );
}
