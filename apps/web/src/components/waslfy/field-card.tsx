'use client';

/**
 * حقول التذكرة — شكل صف جوه إيصال الاستخراج.
 * بنصدّر CONFIDENCE_META و SOURCE_LABELS زي ما هما (قايمة الشحنات بتستخدمهم).
 */

import type { ReactNode } from 'react';
import type { Field } from 'waslfy-parser';

export const CONFIDENCE_META: Record<
  string,
  { label: string; badge: string; dot: string }
> = {
  high: {
    label: 'ثقة عالية',
    badge: 'bg-[#e5efe7] text-[#0c5c42] border-[#bcd8c6]',
    dot: 'bg-[#0c8a5f]',
  },
  medium: {
    label: 'ثقة متوسطة',
    badge: 'bg-[#f7ecd7] text-[#8a5a0a] border-[#e4cda2]',
    dot: 'bg-[#c97b10]',
  },
  low: {
    label: 'ثقة منخفضة — راجعه',
    badge: 'bg-[#fae8dd] text-[#9a4a1c] border-[#ecd0bd]',
    dot: 'bg-[#c96a2a]',
  },
  empty: {
    label: 'فاضي — اسأل العميل',
    badge: 'bg-[#eeece3] text-[#6f7a70] border-[#dcd8ca]',
    dot: 'bg-[#9aa39a]',
  },
};

const SOURCE_LABELS: Record<string, string> = {
  regex: 'نمط رقمي/نصي',
  dictionary: 'قاموس محافظات ومدن',
  context: 'سياق الرسالة',
  user: 'تأكيد المستخدم',
  'smart-ai': 'ذكاء اصطناعي (Smart Mode)',
};

export { SOURCE_LABELS };

interface FieldCardProps {
  title: string;
  field: Field<unknown>;
  children?: ReactNode;
  note?: string;
}

export function FieldCard({ title, field, children, note }: FieldCardProps) {
  const meta = CONFIDENCE_META[field.confidence] ?? CONFIDENCE_META.empty;

  return (
    <div className="px-5 py-4 sm:px-7">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#6f7a70]">
          {title}
        </span>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10.5px] font-semibold ${meta.badge}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
          {meta.label}
        </span>
      </div>

      <div className="mt-1.5 min-h-7 text-[17px] leading-7 font-semibold text-[#17251f] break-words">
        {children ?? <span className="font-normal text-[#b3b0a3]">— فاضي —</span>}
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
        <span className="text-[11px] text-[#8a9188]">
          المصدر: {SOURCE_LABELS[field.source] ?? field.source}
        </span>
        {note && <span className="text-[11px] leading-5 text-[#a09c8d]">{note}</span>}
      </div>
    </div>
  );
}
