'use client';

/**
 * بطاقة النسخ الاحتياطي والاستيراد — M4 (إلزامي في الـ Blueprint).
 * «جهازك هو السيرفر» معناه إنك مسؤول عن النسخة الاحتياطية —
 * فبنخليها زرار واحد: تنزيل JSON بكل حاجة، واستيراد بدمج ذكي
 * (السجل الأحدث بيكسب) عشان الاستيراد ميبوّظش شغلك مرة واحدة.
 */

import { useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { CheckCircle2, HardDriveDownload, ShieldAlert, Upload, DatabaseBackup } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/waslfy/db';
import { downloadBackup, importBackupFile } from '@/lib/waslfy/backup';

function fmtWhen(ts: number | null): string {
  if (!ts) return '';
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

export function BackupCard() {
  const lastBackupAt = useLiveQuery(async () => db.settings.get('lastBackupAt'), []);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<'backup' | 'import' | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function doBackup() {
    setBusy('backup');
    setErr(null);
    try {
      const n = await downloadBackup();
      setMsg(`اتنزّلت نسخة احتياطية فيها ${n} شحنة — احتفظ بيها في مكان آمن (تليفون تاني أو Drive مثلًا).`);
    } catch (e) {
      setErr(String((e as Error).message ?? e));
    } finally {
      setBusy(null);
    }
  }

  async function onFile(f: File | undefined) {
    if (!f) return;
    setBusy('import');
    setErr(null);
    setMsg(null);
    try {
      const rep = await importBackupFile(f);
      setMsg(
        `الاستيراد خلص: ${rep.added} شحنة جديدة، ${rep.updated} اتحيّنت من الملف، ${rep.skipped} اتجاهلت (نسختك المحلية أحدث منها).`
      );
    } catch (e) {
      setErr(String((e as Error).message ?? e));
    } finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  const lastAt =
    lastBackupAt && typeof (lastBackupAt as { value?: unknown }).value === 'number'
      ? ((lastBackupAt as { value: number }).value)
      : null;

  return (
    <section className="card-lift rounded-3xl border border-[#e2ded1] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#eeece3] px-5 py-4 sm:px-7">
        <div>
          <span className="tracking-code text-[10px] font-semibold text-[#c97b10]">
            BACKUP &amp; RESTORE
          </span>
          <h2 className="text-lg font-bold tracking-tight text-[#17251f]">
            النسخة الاحتياطية{' '}
            <span className="text-xs font-normal text-[#a09c8d]">
              بياناتك على جهازك بس — النسخة هي شبكة الأمان بتاعتك
            </span>
          </h2>
        </div>
        {lastAt ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#bcd8c6] bg-[#e5efe7] px-3 py-1 text-[11px] font-semibold text-[#0c5c42]">
            <CheckCircle2 className="h-3 w-3" />
            آخر نسخة: {fmtWhen(lastAt)}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e4cda2] bg-[#f7ecd7] px-3 py-1 text-[11px] font-semibold text-[#8a5a0a]">
            <ShieldAlert className="h-3 w-3" />
            لسه مفيش نسخة احتياطية
          </span>
        )}
      </div>

      <div className="space-y-4 p-5 sm:p-7">
        <div className="grid gap-2.5 sm:grid-cols-2">
          <Button
            className="h-11 rounded-2xl bg-[#0c5c42] text-sm font-bold text-white shadow-[0_8px_20px_-8px_rgba(12,92,66,0.6)] hover:bg-[#0a4d37]"
            disabled={busy !== null}
            onClick={doBackup}
          >
            <HardDriveDownload className="h-4 w-4" />
            {busy === 'backup' ? 'جاري التحضير…' : 'نزّل نسخة احتياطية (JSON)'}
          </Button>

          <Button
            variant="outline"
            className="h-11 rounded-2xl border-[#dcd8ca] bg-white text-sm font-bold text-[#4b564e] hover:border-[#0c5c42]/40 hover:text-[#0c5c42]"
            disabled={busy !== null}
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            {busy === 'import' ? 'جاري الاستيراد…' : 'استيراد نسخة'}
          </Button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => void onFile(e.target.files?.[0])}
        />

        <p className="flex items-start gap-2 rounded-2xl bg-[#fbfaf6] px-3.5 py-3 text-xs leading-6 text-[#6f7a70]">
          <DatabaseBackup className="mt-0.5 h-4 w-4 shrink-0 text-[#0c5c42]" />
          الاستيراد بيدمج بذكاء: الشحنة الجديدة بتتضاف، ولو نفس الشحنة موجودة
          بيترجّح الأحدث (بتاريخ آخر تحديث) — فمستحيل يتراجع شغل جديد بسبب ملف قديم.
        </p>

        {msg && (
          <p className="flex items-start gap-1.5 rounded-xl border border-[#bcd8c6] bg-[#e5efe7] px-3 py-2.5 text-sm leading-6 text-[#0c5c42]">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            {msg}
          </p>
        )}
        {err && (
          <p className="flex items-center gap-1.5 rounded-xl border border-[#ecd0bd] bg-[#fae8dd] px-3 py-2 text-sm font-medium text-[#b3402a]">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            {err}
          </p>
        )}
      </div>
    </section>
  );
}
