'use client';

/**
 * معاينة الطباعة — M3.
 * القاعدة الأساسية: لو في حقل إجباري فاضي أو low/empty من غير تأكيد بشري،
 * زرار الطباعة مقفول والسبب ظاهر — «ممنوع القيم الصامتة» مفروضة على الطباعة نفسها.
 */

import { useEffect, useRef } from 'react';
import { Printer, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { blockingIssues, type ShipmentRecord } from '@/lib/waslfy/db';
import { PrintLabel } from './print-label';

interface PrintPreviewDialogProps {
  record: ShipmentRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPrinted: (record: ShipmentRecord) => void;
}

export function PrintPreviewDialog({
  record,
  open,
  onOpenChange,
  onPrinted,
}: PrintPreviewDialogProps) {
  const issues = record ? blockingIssues(record) : [];
  const printedRef = useRef(false);

  // بتعلم الشحنة كمطبوعة مرة واحدة لكل فتح للديالوج
  useEffect(() => {
    if (open) printedRef.current = false;
  }, [open, record?.id]);

  function handlePrint() {
    if (!record || issues.length > 0 || printedRef.current) return;
    printedRef.current = true;
    // window.print بيستنى لحد ما دايالوج الطباعة يقفل في المتصفحات الكبيرة،
    // وبعدها بنعمل fallback تأخير بسيط للتعليم — الحاجة المهمة إن الطباعة فعلاً اترفدت.
    window.print();
    window.setTimeout(() => onPrinted(record), 600);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl border-[#e2ded1] sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Printer className="h-4 w-4 text-[#0c5c42]" />
            معاينة الطباعة — A6
          </DialogTitle>
        </DialogHeader>

        {record && (
          <div className="space-y-3">
            <div className="mx-auto w-fit overflow-hidden rounded-xl border border-[#e2ded1] shadow-[0_12px_32px_-16px_rgba(12,60,45,0.25)]">
              <PrintLabel record={record} />
            </div>

            {issues.length > 0 ? (
              <p className="flex items-start gap-1.5 rounded-xl border border-[#ecd0bd] bg-[#fae8dd] px-3 py-2 text-xs leading-5 text-[#9a4a1c]">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  الطباعة محجوبة — ناقص أو محتاج تأكيد: <b>{issues.join('، ')}</b>. راجع الشحنة من
                  كارتها تحت وأكّد الحقول الأول.
                </span>
              </p>
            ) : (
              <p className="rounded-xl border border-[#bcd8c6] bg-[#e5efe7] px-3 py-2 text-xs leading-5 text-[#0c5c42]">
                الشحنة جاهزة للطباعة — كل الحقول الإجبارية مؤكدة. هيطلع إيصال A6 بباركود الكود بتاع
                الشحنة.
              </p>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full text-[#6f7a70]"
                onClick={() => onOpenChange(false)}
              >
                إلغاء
              </Button>
              <Button
                size="sm"
                className="rounded-full bg-[#0c5c42] font-bold text-white hover:bg-[#0a4d37]"
                disabled={issues.length > 0}
                onClick={handlePrint}
              >
                <Printer className="h-4 w-4" />
                اطبع دلوقتي
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
