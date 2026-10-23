'use client';

/**
 * دايلوج تصدير Excel — M4.
 * نفس بوابة «ممنوع القيم الصامتة» بتاعة الطباعة هي اللي بتحجب التصدير:
 * الشحنة بتتصدّر بس لو مؤكدة/مطبوعة وكل حقولها مراجعة.
 * القوالب الجاهزة + أعمدة مخصصة — وكل حاجة بتتبني في المتصفح.
 */

import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { CheckCircle2, FileSpreadsheet, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  db,
  markExported,
  printableIssues,
  type ShipmentRecord,
} from '@/lib/waslfy/db';
import {
  ALL_COLUMNS,
  TEMPLATES,
  exportShipmentsToExcel,
  type ColumnKey,
} from '@/lib/waslfy/excel-export';

export function ExportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const records = useLiveQuery(
    () => db.shipments.orderBy('createdAt').reverse().toArray(),
    []
  );
  const [templateId, setTemplateId] = useState('waslfy');
  const [customMode, setCustomMode] = useState(false);
  const [customKeys, setCustomKeys] = useState<ColumnKey[]>([
    'reference',
    'date',
    'name',
    'phone',
    'governorate',
    'address',
    'amount',
    'notes',
  ]);
  const [done, setDone] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const all = records ?? [];
  const exportable = useMemo(
    () => all.filter((r) => printableIssues(r).length === 0),
    [all]
  );
  const blocked = all.length - exportable.length;

  const template = TEMPLATES.find((t) => t.id === templateId) ?? TEMPLATES[0];
  const columns = customMode
    ? ALL_COLUMNS.filter((c) => customKeys.includes(c.key))
    : template.cols;

  function toggleKey(key: ColumnKey, checked: boolean) {
    setCustomKeys((prev) =>
      checked ? [...prev, key] : prev.filter((k) => k !== key)
    );
  }

  async function doExport() {
    if (exportable.length === 0 || columns.length === 0) return;
    setErr(null);
    try {
      const batchId = `exp-${Date.now().toString(36)}`;
      const fileName = exportShipmentsToExcel(exportable, columns, {
        rtl: template.rtl,
        fileName: template.fileName,
      });
      await markExported(
        exportable.map((r) => r.id),
        batchId
      );
      setDone(
        `اتنزّل ${fileName} — فيه ${exportable.length} شحنة. عداد التصدير اتحدّث على كل واحدة.`
      );
    } catch (e) {
      setErr(String((e as Error).message ?? e));
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) {
          setDone(null);
          setErr(null);
        }
      }}
    >
      <DialogContent dir="rtl" className="max-h-[85vh] overflow-y-auto rounded-3xl border-[#e2ded1] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <FileSpreadsheet className="h-4 w-4 text-[#0c5c42]" />
            صدّر شحناتك لملف Excel
          </DialogTitle>
          <DialogDescription>
            نفس بوابة الطباعة: بيتصدّر بس اللي مراجع ومؤكد — عشان ماتبعتش
            بيانات ناقصة لشركة الشحن.
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="space-y-3">
            <p className="flex items-start gap-2 rounded-xl border border-[#bcd8c6] bg-[#e5efe7] px-3 py-2.5 text-sm leading-6 text-[#0c5c42]">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              {done}
            </p>
            <Button className="w-full rounded-full" onClick={() => onOpenChange(false)}>
              تمام
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-[#e2ded1] bg-[#fbfaf6] px-3 py-2.5 text-xs leading-6">
              <span className="font-bold text-[#0c5c42]">
                {exportable.length} شحنة جاهزة للتصدير
              </span>
              {blocked > 0 && (
                <span className="text-[#8a5a0a]"> — اتحجبت {blocked} عندها حقول ناقصة أو غير مؤكدة</span>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[#6f7a70]">قالب الملف</Label>
              <RadioGroup
                value={templateId}
                onValueChange={setTemplateId}
                className="grid grid-cols-2 gap-2"
              >
                {TEMPLATES.map((t) => (
                  <Label
                    key={t.id}
                    htmlFor={`tpl-${t.id}`}
                    className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-normal transition-colors ${
                      templateId === t.id
                        ? 'border-[#0c5c42] bg-[#e5efe7] font-bold text-[#0c5c42]'
                        : 'border-[#e2ded1] text-[#4b564e] hover:bg-[#fbfaf6]'
                    }`}
                  >
                    <RadioGroupItem value={t.id} id={`tpl-${t.id}`} className="sr-only" />
                    {t.label}
                  </Label>
                ))}
              </RadioGroup>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-[#e2ded1] px-3 py-2.5">
              <div>
                <p className="text-sm font-semibold text-[#17251f]">فصّل الأعمدة يدويًا</p>
                <p className="text-xs text-[#a09c8d]">اختار أي تركيبة أعمدة بدل القالب الجاهز</p>
              </div>
              <Switch checked={customMode} onCheckedChange={setCustomMode} />
            </div>

            {customMode && (
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 rounded-xl border border-[#e2ded1] p-3">
                {ALL_COLUMNS.map((c) => (
                  <Label
                    key={c.key}
                    className="flex cursor-pointer items-center gap-2 py-1 text-sm font-normal text-[#4b564e]"
                  >
                    <Checkbox
                      checked={customKeys.includes(c.key)}
                      onCheckedChange={(v) => toggleKey(c.key, v === true)}
                    />
                    {c.label}
                  </Label>
                ))}
              </div>
            )}

            <Separator />

            <p className="text-xs leading-5 text-[#a09c8d]">
              الأعمدة دلوقتي: {columns.length ? columns.map((c) => c.header).join(' • ') : '— اختار عمود واحد على الأقل —'}
            </p>

            {err && (
              <p className="flex items-center gap-1.5 rounded-xl border border-[#ecd0bd] bg-[#fae8dd] px-3 py-2 text-xs font-medium text-[#b3402a]">
                <ShieldAlert className="h-3.5 w-3.5" />
                {err}
              </p>
            )}

            <Button
              className="w-full rounded-full bg-[#0c5c42] font-bold text-white hover:bg-[#0a4d37]"
              disabled={exportable.length === 0 || columns.length === 0}
              onClick={doExport}
            >
              <FileSpreadsheet className="h-4 w-4" />
              صدّر {exportable.length} شحنة لملف Excel
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** زرار التصدير المستقل — عشان يتعرض في أي حتة مع عدد الشحنات الجاهزة. */
export function ExportButton({ records }: { records: ShipmentRecord[] }) {
  const [open, setOpen] = useState(false);
  const ready = records.filter((r) => printableIssues(r).length === 0).length;
  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="h-8 rounded-full border-[#dcd8ca] bg-white text-xs font-bold text-[#4b564e] hover:border-[#0c5c42]/40 hover:text-[#0c5c42]"
        disabled={ready === 0}
        onClick={() => setOpen(true)}
      >
        <FileSpreadsheet className="h-3.5 w-3.5 text-[#0c5c42]" />
        صدّر Excel ({ready})
      </Button>
      <ExportDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
