# Waslfy — Technical Blueprint (Step 1)

> من رسالة شات لبوليصة جاهزة — PWA محلية بالكامل بتكلفة صفر جنيه
> الحالة: **بانتظار الموافقة — لا يوجد أي كود تنفيذي بعد**

---

## 0. قرارات المعمارية الأساسية (Architecture Decisions)

| القرار | الاختيار | ليه؟ |
|---|---|---|
| شكل الريبو | Monorepo بـ npm workspaces: `parser` + `web` + `worker` | المكتبة (parser) هي أصل السمعة — لازم تكون حزمة مستقلة نقية قابلة للنشر على npm واختبارها منفصل عن الواجهة |
| واجهة المستخدم | Vite + **React 18 + TypeScript** | السبب الموجب المطلوب في البرومبت: الواجهة مليئة بالحالات الشرطية (ألوان الثقة لكل حقل، حجب الطباعة، تأكيدات inline) — إدارتها بـ vanilla DOM هتبقى فوضى state. React كمان قيمة CV للطالب. الحجم مش مشكلة لأن الـ PWA بيعمل precache للأصول |
| التنسيق | Tailwind مُبنى محلياً (self-hosted build) | شرط offline-first صارم — ممنوع أي CDN في مسار التشغيل |
| التخزين | Dexie.js فوق IndexedDB | حفظ دائم، استعلامات live، بدون سيرفر |
| إدارة الحالة | `useLiveQuery` من dexie-react-hooks | قاعدة البيانات هي الـ state — يشيل الحاجة لـ Redux/Zustand كلياً |
| اللغة والاتجاه | عربي RTL أولاً، النصوص في ملف واحد | سرعة الشحن — إضافة English بعدين سهلة لأن السلاسل معزولة |
| المعرفات | `crypto.randomUUID()` | بدون مكتبات خارجية |
| الباركود | CODE128 عبر JsBarcode | يرمز للمرجع الداخلي للشحنة (مثال: WLF-XXXX) — للتغليف والتتبع الداخلي. **البوليصة الرسمية بتتولد من بوابة شركة الشحن** — أداةنا بتطلع packing slip + Excel جاهز للرفع الجماعي (تحديد توقعات صحيح للمنتج) |
| التصدير | SheetJS (xlsx) بالكامل في المتصفح | بدون سيرفر |
| الذكاء الاختياري | Cloudflare Worker وسيط + نفس شكل بيانات الـ parser | المفاتيح سرية، failover بين الحسابات، **والنتيجة تمر بنفس واجهة المراجعة والتأكيد — الذكاء الاصطناعي مش معفى من قاعدة "ممنوع القيم الصامتة"** |

---

## 1. هيكلة المجلدات (Monorepo)

```
waslfy/
├── package.json                  # npm workspaces
├── .github/workflows/ci.yml      # lint + test على كل push
├── packages/
│   ├── parser/                   # 📦 waslfy-parser — حزمة npm مستقلة (صفر dependencies)
│   │   ├── src/
│   │   │   ├── index.ts          # public API
│   │   │   ├── normalize.ts      # تطبيع النص العربي
│   │   │   ├── fields/
│   │   │   │   ├── name.ts
│   │   │   │   ├── phones.ts
│   │   │   │   ├── governorate.ts
│   │   │   │   ├── address.ts
│   │   │   │   └── amount.ts
│   │   │   ├── data/
│   │   │   │   ├── governorates.ts   # 27 محافظة + aliases
│   │   │   │   └── cities.ts         # خريطة مدينة → محافظة
│   │   │   └── types.ts
│   │   ├── test/
│   │   │   ├── corpus/           # رسائل حقيقية/مولّدة + النتائج المتوقعة
│   │   │   │   ├── basic.json
│   │   │   │   ├── dialect.json
│   │   │   │   ├── mixed-lang.json
│   │   │   │   └── arabic-numerals.json
│   │   │   └── accuracy.test.ts  # يطبع جدول دقة لكل حقل
│   │   ├── demo/cli.ts           # npm run demo -- "نص الرسالة"
│   │   └── package.json          # tsup build (ESM + CJS) + vitest
│   ├── web/                      # 🌐 الـ PWA
│   │   ├── src/
│   │   │   ├── main.tsx / App.tsx
│   │   │   ├── pages/            # Inbox / Archive / Settings / Print
│   │   │   ├── components/       # MessageInput, ShipmentCard, FieldRow,
│   │   │   │                     # ConfidenceBadge, PhonePicker, GovPicker,
│   │   │   │                     # PrintLabel, BackupCard, SmartModeButton
│   │   │   ├── db/               # dexie.ts + schema.ts
│   │   │   ├── lib/              # export.ts, label.ts, backup.ts
│   │   │   └── styles/tailwind.css
│   │   └── vite.config.ts        # + vite-plugin-pwa
│   └── worker/                   # ☁️ Cloudflare Worker (TS)
│       ├── src/index.ts          # POST /smart-extract
│       └── wrangler.toml
└── docs/BLUEPRINT.md
```

---

## 2. مخطط قاعدة البيانات (Dexie Schema v1)

### جدول `shipments`

```ts
interface Shipment {
  id: string;              // uuid
  createdAt: number;       // epoch ms
  updatedAt: number;
  rawText: string;         // الرسالة الأصلية كاملة — أهم حقل للمراجعة
  customerName: StoredField<string>;
  phones:      StoredField<string[]>;  // [رئيسي, ...بدائل]
  governorate: StoredField<string>;    // GovId من القاموس
  address:     StoredField<string>;
  codAmount:   StoredField<number>;    // بالجنيه
  status: 'draft' | 'confirmed' | 'printed' | 'exported';
  carrier?: 'bosta' | 'aramex' | 'mylerz' | 'other';
  batchId?: string;        // YYYY-MM-DD — دفعة التصدير
  printCount: number;
  notes?: string;
}

// حقل واحد داخل الشحنة — نفس شكل مخرجات الـ parser + تأكيد المستخدم
interface StoredField<T> {
  value: T | null;
  confidence: 'high' | 'medium' | 'low' | 'empty';
  source: string;          // regex | dictionary | context | user | smart-ai
  alternatives?: T[];      // مثلاً أرقام هاتف متعددة
  confirmed: boolean;      // وقفة المستخدم على القيمة
}
```

### جدول `settings` (keyPath: `key`)

```ts
{ key: 'app',
  defaultCarrier: 'bosta',
  exportColumns: string[],     // ترتيب وتخصيص أعمدة الإكسيل
  smartModeEnabled: boolean,   // افتراضياً false
  lastBackupAt: number | null }
```

**قاعدة الحجب (منع القيم الصامتة):** الطباعة والتصدير ممنوعين لو أي حقل إجباري (اسم/هاتف/محافظة/عنوان/مبلغ) حالته `low` أو `empty` و `confirmed === false`. الحقل بيتبّع بالتلوين: أخضر (high) / أصفر (medium) / أحمر (low أو فاضي).

---

## 3. حزمة الاستخراج — `waslfy-parser`

حزمة نقية: **صفر runtime dependencies**، TypeScript، بناء ESM+CJS بـ tsup، اختبارات vitest.

### التطبيع (`normalize.ts`)
- توحيد الهمزات والألف (أإآ → ا، ى → ي، ؤ→و...) لمقاصد المطابقة فقط
- إزالة التشكيل والمسافات الصفرية، توحيد علامات الترقيم
- تحويل الأرقام العربية-الهندية (٠١٢٣٤٥٦٧٨٩) إلى لاتينية

### التواقيع (Public API)

```ts
export type Confidence = 'high' | 'medium' | 'low' | 'empty';
export interface Field<T> {
  value: T | null;
  confidence: Confidence;
  source: string;
  alternatives?: T[];
}
export interface GovResult { id: string; nameAr: string; matchedBy: string; }

export function extractName(text: string): Field<string>;
export function extractPhones(text: string): Field<string[]>;
export function extractGovernorate(text: string): Field<GovResult>;
export function extractAddress(text: string): Field<string>;
export function extractAmount(text: string): Field<number>;
export function extractShipment(text: string): {
  name: Field<string>; phones: Field<string[]>;
  governorate: Field<GovResult>; address: Field<string>; amount: Field<number>;
};
```

### قواعد كل حقل

| الحقل | كيف يستخرج | مصدر الثقة |
|---|---|---|
| الهاتف | regex لموبايل مصري: `(\+?20\|0020)?01[0125]\d{8}` مع تسامح الفواصل والشرطات — يجمع **كل** الأرقام | high لو نمط كامل، medium لو 10 خانات ناقصة صفر |
| المحافظة | قاموس aliases (القاهرة/cairo، الجيزة/جيزة...) + **خريطة مدينة→محافظة** (منصورة→الدقهلية، طنطا→الغربية، بورسعيد...) + Levenshtein ≤ 2 للأخطاء الإملائية | high بقاموس، medium بتعديل مسافة |
| المبلغ | كلمات مرساة: جنيه/ج/ج.م/المطلوب/كاش/الإجمالي/تدفع + أرقام بأي صيغة | high بكلمة مرساة + رقم، medium لو رقم وحيد بسياق |
| الاسم | أنماط: "الاسم:" / "اسم العميل" / سطر بين هاتف وعنوان / كلمتين بأحرف عربية بعد التحية | medium افتراضياً — الاسم الأصعب في العامية |
| العنوان | كلمة مرساة (عنوان/الشارع/المنطقة/قدام/جنب/عمارة) وإلا نافذة سياق — **مقصود أن يكون low غالباً** | low by default — مراجعة بشرية دائماً في MVP |

### أهداف الدقة (تُقاس فعلياً على الـ corpus وتنشر في README)

| الحقل | هدف MVP |
|---|---|
| هاتف | ≥ 98% |
| محافظة | ≥ 95% |
| مبلغ | ≥ 90% |
| اسم | ≥ 85% |
| عنوان | best-effort + عل low دائماً |

---

## 4. عقد الـ Worker الذكي (Smart Mode)

```
POST /smart-extract
Body: { text: string }
200 → { fields: { name, phones, governorate, address, amount } }  // نفس شكل الـ parser
```

- المفاتيح `JEV_API_KEY_1..N` كـ secrets في الـ Worker — **ممنوع منعاً باتاً في كود المتصفح**
- Failover: عند 402 (رصيد) أو 429 (حد استخدام) → المفتاح التالي تلقائياً
- حماية: فحص Origin + rate limit بسيط لكل IP
- endpoint الـ Jev النهائي يتأكد من الـ docs وقت M6 قبل الربط
- النتيجة تدخل نفس StoredField وتمر بنفس شاشة التأكيد — **الذكاء الاصطناعي بيقترح، المستخدم بيأكد**

---

## 5. خطة الـ Milestones (كل مرحلة بينتهي ببرنامج شغال فعلاً)

| # | المدة | المخرجات | إثبات "شغال" |
|---|---|---|---|
| M0 | نص يوم | Scaffold الـ monorepo + CI (lint+test) | `npm test` أخضر في CI |
| M1 | أسبوع | الـ parser كامل + corpus 30 رسالة + تقرير دقة | `npm run demo -- "الاسم احمد..."` يطبع JSON مستخرج |
| M2 | أسبوع | PWA shell + كارت الشحنة القابل للتعديل + حفظ Dexie | **الاختبار: الصق رسالة → عدّل → اعمل refresh → البيانات موجودة** |
| M3 | أسبوع | طباعة A6 + باركود + حجب الحقول غير المؤكدة + أرشيف بحث | معاينة طباعة حقيقية من المتصفح |
| M4 | أسبوع | Excel بقوالب (عام/بوسطة/أرامكس) + أعمدة مخصصة + Backup/Import JSON | ملف xlsx يفتح صح + استعادة كاملة من JSON |
| M5 | 3-4 أيام | Offline كامل (manifest + SW precache، Tailwind والخطوط محلية) + RTL نهائي | قطع النت والتطبيق شغال 100% |
| M6 | أسبوع | Worker + Smart Mode + Deploy على Cloudflare Pages | رابط حي يعمل |
| M7 | 3-4 أيام | README ثنائي + GIF + أرقام الدقة + **نشر waslfy-parser على npm** + بوست الإطلاق | `npm i waslfy-parser` يعمل من أي مكان |

**ترتيب مقصود:** M1 قبل أي واجهة — لأن جودة الاستخراج هي المنتج، ولو الـ parser ضعيف مفيش واجهة هتصلحه.

---

## 6. تعديلات مقصودة على الخطة الأصلية (من مراجعتي)

1. **Backup/Import JSON صار مرحلة M4 إلزامية** — كان ناقصاً تماماً رغم أن البيانات هي أثمن ما عند التاجر (أسماء وأرقام عملائه)
2. **لا يوجد enforcement محلي للحد المجاني** — لأنه قابل للخرق بسهولة. المونتايزشن المستقبلي (لو حصل) هيكون مزامنة أجهزة/فرق عبر Supabase — قابل للفرض فعلاً
3. **العنوان low-confidence by default في MVP** — بصراحة بدلاً من ادعاء دقة زائفة
4. **تحديد توقعات البوليصة**: أداةنا بتطلع packing slip + Excel للرفع الجماعي — البوليصة الرسمية من بوابة شركة الشحن (ده الفرق بين أداة مفيدة وأداة بتوعد بحاجة مش معنية)
5. **الـ parser كحزمة منفصلة قابلة للنشر** — ده قرار السمعة: المكتبة هي الأصل الذي يُستشهد به، والتطبيق هو العرض عليه
