'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { extractShipment } from 'waslfy-parser';
import {
  ShieldCheck,
  EyeOff,
  FlaskConical,
  AlertTriangle,
  Timer,
  Save,
  Check,
  MessageSquareText,
  Lock,
  Banknote,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { FieldCard, CONFIDENCE_META, SOURCE_LABELS } from '@/components/waslfy/field-card';
import { ShipmentList } from '@/components/waslfy/shipment-list';
import { BackupCard } from '@/components/waslfy/backup-card';
import { addShipment, snapshotFromDraft, db } from '@/lib/waslfy/db';
import { CORPUS, evaluateCorpus, overallAccuracy } from '@/lib/waslfy/accuracy';

const SAMPLES: { label: string; text: string }[] = [
  {
    label: 'رسالة أساسية',
    text: 'السلام عليكم عايز أطلب\nالاسم: محمود السيد\nالعنوان: 15 شارع البحر دمنهور البحيرة\nالهاتف: 01012345678\nالمبلغ 350 جنيه كاش',
  },
  {
    label: 'عامية مصرية',
    text: 'أهلاً أنا نورهان عايزة طلبي يوصل بسرعة\nعنواني في مدينة نصر القاهرة 12 شارع عباس العقاد\nدا رقمي 01012349876\nالطلب هيبقى كاش 320 ج',
  },
  {
    label: 'إنجليزي',
    text: 'Name: Mohamed Ali\nAddress: Nasr City, Cairo - 9 Mostafa El Nahhas\nPhone: 01022334455\nCOD: 500 EGP',
  },
  {
    label: 'أرقام هندية ٠١٢٣',
    text: 'الاسم: وليد سمير\nالعنوان: أسيوط شارع الهلالي عمارة ٣\nالموبايل: ٠١٠١٢٣٤٥٦٧٨\nالمطلوب ٤٥٠ جنيه',
  },
  {
    label: 'سطر واحد',
    text: 'الاسم: محمود علي - التليفون: 01001234567 - الجيزة - 12 شارع جامعة الدول العربية المهندسين - كود 450 جنيه',
  },
  {
    label: 'من غير مبلغ',
    text: 'السلام عليكم\nالاسم: هدى سمير\nدا رقمي 01066554433\nالمعادي القاهرة شارع 9',
  },
];

export default function Home() {
  const [text, setText] = useState(SAMPLES[0].text);
  const [ms, setMs] = useState<number | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  const draft = useMemo(() => (text.trim() ? extractShipment(text) : null), [text]);
  const accuracy = useMemo(() => evaluateCorpus(), []);
  const overall = useMemo(() => overallAccuracy(accuracy), [accuracy]);
  const savedCount = useLiveQuery(() => db.shipments.count(), []);

  async function saveDraft() {
    if (!text.trim() || !draft) return;
    await addShipment(snapshotFromDraft(text, draft));
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2500);
  }

  useEffect(() => {
    const t0 = performance.now();
    if (text.trim()) extractShipment(text);
    const elapsed = performance.now() - t0;
    const raf = requestAnimationFrame(() => setMs(elapsed));
    return () => cancelAnimationFrame(raf);
  }, [text]);

  return (
    <div className="paper-bg flex min-h-screen flex-col">
      {/* ===== النافبار الغامق ===== */}
      <header className="pine-bar sticky top-0 z-40 border-b border-white/10 shadow-[0_8px_24px_-12px_rgba(12,59,46,0.5)]">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2c9c6e] to-[#0c5c42] text-xl font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_4px_12px_-2px_rgba(0,0,0,0.4)]">
              و
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[17px] font-bold tracking-tight text-white">وصلّي</h1>
                <span className="tracking-code text-[10px] font-medium text-[#8fd4b1]">WASLFY</span>
              </div>
              <p className="text-[11px] leading-4 text-[#9dbcae]">
                من رسالة واتساب لإيصال شحن — على جهازك بس
              </p>
            </div>
          </div>

          <div className="ms-auto flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 backdrop-blur-sm">
              <span className="text-[15px] font-bold tabular-nums text-[#7fe0ae]">
                {Math.round(overall.pct * 100)}%
              </span>
              <span className="text-[11px] text-[#c3d8cb]">دقة الاستخراج</span>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 backdrop-blur-sm sm:flex">
              <span className="text-[15px] font-bold tabular-nums text-white">{savedCount ?? 0}</span>
              <span className="text-[11px] text-[#c3d8cb]">شحنة محفوظة</span>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 backdrop-blur-sm md:flex">
              <span className="text-[15px] font-bold tabular-nums text-white">{CORPUS.length}</span>
              <span className="text-[11px] text-[#c3d8cb]">رسالة اختبار</span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 sm:px-6">
        {/* ===== الهيرو + صندوق اللصق ===== */}
        <section className="pt-10 pb-8 sm:pt-14">
          <div className="rise-in flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#dcd8ca] bg-white/70 px-3 py-1 text-[11px] font-semibold text-[#0c5c42]">
              <Lock className="h-3 w-3" />
              مفتوح المصدر — بياناتك عمرها ما بتسيب الجهاز
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e4cda2] bg-[#f7ecd7] px-3 py-1 text-[11px] font-semibold text-[#8a5a0a]">
              <Sparkles className="h-3 w-3" />
              الاستخراج لحظي — بلا سيرفر
            </span>
          </div>

          <h2 className="rise-in mt-4 max-w-2xl text-3xl font-bold leading-[1.25] tracking-tight text-[#17251f] sm:text-[40px] sm:leading-[1.2]">
            الصق رسالة العميل…
            <br />
            وخُد <span className="relative inline-block text-[#0c5c42]">بيانات الشحنة<svg className="absolute -bottom-1.5 right-0 w-full" height="6" viewBox="0 0 200 6" preserveAspectRatio="none"><path d="M0 4 Q 50 0 100 3 T 200 2" stroke="#c97b10" strokeWidth="3" fill="none" strokeLinecap="round"/></svg></span> جاهزة للطباعة.
          </h2>
          <p className="rise-in mt-3 max-w-xl text-[15px] leading-7 text-[#6f7a70]">
            المحرك بيقرأ الاسم والتليفون والمحافظة والعنوان والمبلغ من رسالة عامية مصرية عادية،
            وبوثّق مصدر كل حقل ودرجة ثقته — وأي حقل ناقص بيحجب الطباعة لحد ما تراجعه بإيدك.
          </p>

          {/* صندوق اللصق — نجم الصفحة */}
          <div className="rise-in-late card-lift mt-7 rounded-3xl border border-[#e2ded1] bg-white">
            <div className="flex items-center justify-between gap-2 border-b border-[#eeece3] px-5 py-3 sm:px-6">
              <div className="flex items-center gap-2 text-sm font-bold text-[#17251f]">
                <MessageSquareText className="h-4 w-4 text-[#0c5c42]" />
                رسالة العميل
              </div>
              <span className="text-[11px] text-[#a09c8d]">
                الاستخراج بيحصل في متصفحك — مفيش أي حاجة بتتبعت لسيرفر
              </span>
            </div>
            <div className="space-y-3 p-4 sm:p-5">
              <Textarea
                dir="auto"
                rows={6}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="الصق رسالة واتساب من عميل فيها اسمه ورقمه وعنوانه والمبلغ…"
                className="resize-y rounded-2xl border-[#e2ded1] bg-[#fbfaf6] text-[15px] leading-7 focus-visible:ring-[#0c5c42]/30"
              />
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="me-1 text-[11px] font-semibold text-[#a09c8d]">جرّب أمثلة:</span>
                {SAMPLES.map((s) => (
                  <Button
                    key={s.label}
                    size="sm"
                    variant={text === s.text ? 'default' : 'outline'}
                    className={`h-7 rounded-full px-3 text-[12px] ${
                      text === s.text
                        ? 'border-transparent bg-[#0c5c42] text-white shadow-none hover:bg-[#0a4d37]'
                        : 'border-[#dcd8ca] bg-white text-[#4b564e] hover:border-[#0c5c42]/40 hover:text-[#0c5c42]'
                    }`}
                    onClick={() => setText(s.text)}
                  >
                    {s.label}
                  </Button>
                ))}
                {text && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 rounded-full px-3 text-[12px] text-[#a09c8d] hover:text-[#b3402a]"
                    onClick={() => setText('')}
                  >
                    فضّي الخانة
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ===== تذكرة الاستخراج ===== */}
        {draft ? (
          <section className="space-y-4 pb-10">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <span className="tracking-code text-[10px] font-semibold text-[#c97b10]">
                  EXTRACTION TICKET
                </span>
                <h2 className="text-xl font-bold tracking-tight text-[#17251f]">
                  إيصال الاستخراج
                </h2>
              </div>
              <span className="flex items-center gap-1.5 rounded-full border border-[#e2ded1] bg-white px-3 py-1 text-[11px] font-medium text-[#6f7a70]">
                <Timer className="h-3.5 w-3.5 text-[#0c5c42]" />
                استخراج في {ms === null ? '…' : ms.toFixed(1)} مللي ثانية
              </span>
            </div>

            <div className="rise-in card-lift ticket rounded-3xl border border-[#e2ded1] bg-white">
              {/* شريط رأس التذكرة */}
              <div className="pine-bar flex flex-wrap items-center justify-between gap-2 rounded-t-3xl px-5 py-3.5 sm:px-7">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15 text-sm font-bold text-white">
                    و
                  </span>
                  <span className="text-sm font-bold text-white">وصلّي — إيصال استخراج</span>
                </div>
                <span className="tracking-code text-[11px] font-semibold text-[#8fd4b1]">
                  WSLFY-LIVE-{new Date().getFullYear()}
                </span>
              </div>

              {/* صفوف الحقول */}
              <div className="divide-y divide-dashed divide-[#e2ded1]">
                <FieldCard title="الاسم" field={draft.name}>
                  {draft.name.value ?? null}
                </FieldCard>

                <FieldCard
                  title="الهاتف"
                  field={draft.phones}
                  note={
                    draft.phones.alternatives?.length
                      ? `مرشحين إضافيين: ${draft.phones.alternatives.join(' • ')}`
                      : undefined
                  }
                >
                  {draft.phones.value?.length ? (
                    <span dir="ltr" className="flex flex-wrap gap-1.5">
                      {draft.phones.value.map((p) => (
                        <span
                          key={p}
                          className="tracking-code rounded-lg border border-[#e2ded1] bg-[#fbfaf6] px-2.5 py-1 text-[15px] font-semibold"
                        >
                          {p}
                        </span>
                      ))}
                    </span>
                  ) : null}
                </FieldCard>

                <FieldCard
                  title="المحافظة"
                  field={draft.governorate}
                  note={
                    draft.governorate.value
                      ? `طريقة الاستخراج: ${SOURCE_LABELS[draft.governorate.source] ?? draft.governorate.source}`
                      : 'اكتب المحافظة أو منطقة معروفة زي المنصورة أو المهندسين'
                  }
                >
                  {draft.governorate.value ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="gov-swatch inline-block h-6 w-6 rounded-lg border border-[#bcd8c6]" />
                      {draft.governorate.value.name}
                    </span>
                  ) : null}
                </FieldCard>

                <FieldCard
                  title="العنوان"
                  field={draft.address}
                  note="العنوان دايمًا تقديري (best-effort) — لازم مراجعة بشرية قبل الشحن"
                >
                  {draft.address.value ?? null}
                </FieldCard>
              </div>

              {/* الفاصل المنقّط — سنون التذكرة على الجنبين */}
              <div className="flex items-center gap-2 px-4 py-1.5 sm:px-6" aria-hidden={true}>
                <span className="punch-hole" />
                <div className="ticket-dash" />
                <span className="punch-hole" />
              </div>

              {/* قسم الفلوس — أهم حتة زي الليبل المطبوع بالظبط */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-7">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#e4cda2] bg-[#f7ecd7]">
                    <Banknote className="h-5 w-5 text-[#c97b10]" />
                  </span>
                  <div>
                    <p className="text-[11px] font-bold tracking-wide text-[#8a5a0a]">
                      كاش عند الاستلام
                    </p>
                    {draft.amount.value != null ? (
                      <p className="text-2xl font-bold tabular-nums text-[#17251f]">
                        {draft.amount.value}
                        <span className="ms-1.5 text-sm font-semibold text-[#6f7a70]">ج.م</span>
                      </p>
                    ) : (
                      <p className="flex items-center gap-1.5 text-sm font-medium text-[#9a4a1c]">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        مفيش مبلغ واضح — اسأل العميل قبل الشحن
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  {draft.amount.confidence === 'low' || draft.amount.confidence === 'empty' ? (
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10.5px] font-semibold ${
                        (CONFIDENCE_META[draft.amount.confidence] ?? CONFIDENCE_META.empty).badge
                      }`}
                    >
                      راجع المبلغ قبل الحفظ
                    </span>
                  ) : null}
                  <Button
                    className={`h-10 rounded-full px-5 text-sm font-bold shadow-[0_8px_20px_-8px_rgba(12,92,66,0.6)] transition-all ${
                      justSaved
                        ? 'bg-[#c97b10] hover:bg-[#b36c0c]'
                        : 'bg-[#0c5c42] hover:bg-[#0a4d37]'
                    }`}
                    onClick={saveDraft}
                    disabled={!draft}
                  >
                    {justSaved ? (
                      <>
                        <Check className="h-4 w-4" />
                        اتحفظت على جهازك
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        احفظ الشحنة
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <p className="flex items-start gap-2 text-xs leading-5 text-[#8a9188]">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#c97b10]" />
              القاعدة الأساسية مفعّلة فعلًا: ممنوع القيم الصامتة — أي حقل فاضي أو منخفض الثقة مش
              مؤكد بيعطّل الطباعة والتصدير لحد ما تراجعه بإيدك.
            </p>
          </section>
        ) : (
          <section className="pb-10">
            <div className="rounded-3xl border-2 border-dashed border-[#dcd8ca] bg-white/50 p-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[#e2ded1] bg-white">
                <MessageSquareText className="h-5 w-5 text-[#a09c8d]" />
              </div>
              <p className="mt-3 text-sm font-medium text-[#6f7a70]">
                اكتب أو الصق رسالة فوق — أو اختار واحد من الأمثلة — والتذكرة هتتعمل هنا فورًا
              </p>
            </div>
          </section>
        )}

        {/* ===== شحناتي ===== */}
        <div className="space-y-6">
          <ShipmentList />

          <BackupCard />

          {/* ===== تقرير الدقة ===== */}
          <section className="card-lift rounded-3xl border border-[#e2ded1] bg-white">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#eeece3] px-5 py-4 sm:px-7">
              <div>
                <span className="tracking-code text-[10px] font-semibold text-[#c97b10]">
                  LIVE ACCURACY
                </span>
                <h2 className="text-lg font-bold tracking-tight text-[#17251f]">
                  تقرير الدقة الحيّ
                </h2>
              </div>
              <span className="rounded-full border border-[#bcd8c6] bg-[#e5efe7] px-3 py-1 text-[11px] font-semibold text-[#0c5c42]">
                بيتحسب فعلًا في متصفحك دلوقتي
              </span>
            </div>
            <div className="space-y-5 px-5 py-5 sm:px-7">
              {accuracy.map((f) => {
                const pct = f.total === 0 ? 0 : f.correct / f.total;
                return (
                  <div key={f.key} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-[#17251f]">{f.label}</span>
                      <span className="tracking-code text-[11px] text-[#6f7a70]">
                        {f.correct}/{f.total} — {Math.round(pct * 100)}%
                      </span>
                    </div>
                    <Progress
                      value={pct * 100}
                      className="h-2.5 rounded-full bg-[#eceadf] [&>div]:rounded-full [&>div]:bg-gradient-to-l [&>div]:from-[#0c8a5f] [&>div]:to-[#0c5c42]"
                    />
                  </div>
                );
              })}
              <p className="border-t border-dashed border-[#e2ded1] pt-4 text-xs leading-6 text-[#8a9188]">
                القياس على corpus عام من {CORPUS.length} رسالة مصرية واقعية (فصحى، عامية، إنجليزي،
                أرقام هندية) — نفس الـ corpus اللي شغّال في الـ CI. الاستخراج الفاضي بيحسب غلطة مش
                نجاح، عشان التقرير يفضل صادق.
              </p>
            </div>
          </section>

          {/* ===== الوعود الثلاثة ===== */}
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: ShieldCheck,
                title: 'خصوصية مطلقة',
                body: 'المحرك شغّال جوه المتصفح — بيانات عملائك مش بتسيب الجهاز أصلًا. من غير سيرفر، من غير حساب، من غير تتبع.',
                tint: 'bg-[#e5efe7] text-[#0c5c42] border-[#bcd8c6]',
              },
              {
                icon: EyeOff,
                title: 'ممنوع القيم الصامتة',
                body: 'الحقل مش هيتعبّى قيمة متخمّنة. لو المحرك مش متأكد بيطلّع «فاضي» أو «منخفضة» وبيحجب الطباعة لحد ما تراجعه.',
                tint: 'bg-[#f7ecd7] text-[#8a5a0a] border-[#e4cda2]',
              },
              {
                icon: FlaskConical,
                title: 'بيئة اختبار مستمرة',
                body: 'كل رسالة بتقعد في الـ corpus والاختبارات بتشتغل على كل تعديل — تعديل يبوّظ الدقة بيتكشف فورًا في الـ CI.',
                tint: 'bg-[#fae8dd] text-[#9a4a1c] border-[#ecd0bd]',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="card-lift rounded-3xl border border-[#e2ded1] bg-white p-5 transition-transform duration-200 hover:-translate-y-0.5"
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${f.tint}`}
                >
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-3 text-[15px] font-bold text-[#17251f]">{f.title}</h3>
                <p className="mt-1.5 text-xs leading-6 text-[#6f7a70]">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* ===== الفوتر ===== */}
      <footer className="pine-bar mt-auto border-t border-white/10">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-5 text-xs text-[#9dbcae] sm:px-6">
          <span className="tracking-code text-[10.5px] font-semibold text-[#c3d8cb]">
            waslfy-parser v0.1.0 — صفر dependencies
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-[#7fe0ae]" />
            الجاي: M5 Offline PWA ← M6 Smart Mode ← M7 npm publish
          </span>
        </div>
      </footer>
    </div>
  );
}

