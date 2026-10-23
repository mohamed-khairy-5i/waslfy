# دليل نشر Waslfy — صفر تكلفة

الدليل ده بياخدك من الكود المحلي لحد **ريبو عام على GitHub + حزمة npm منشورة + تطبيق لايف** — كل حاجة ببلاش بالظبط. الترتيب مقصود: الريبو الأول، بعدين npm، بعدين اللايف.

---

## 1) ارفعه على GitHub

```bash
cd waslfy

# اعمل repo جديد على حسابك (مثال: waslfy/waslfy) — من غير README حيولّد لأنه موجود
# بعدين:
git remote add origin https://github.com/<username>/waslfy.git
git branch -M main
git push -u origin main
```

بعد أول push، افتح تبويب **Actions** وتأكد إن الـ CI أخضر (7 اختبارات على الـ corpus).

> **ملحوظة على الروابط:** ملفات `packages/parser/package.json` وREADME فيها روابط باسم `waslfy/waslfy` — لو اسم حسابك أو الريبو مختلف، بدّلها بـ `<username>/<repo>`.

## 2) انشر waslfy-parser على npm

الحزمة unscoped باسم `waslfy-parser` — لو الاسم متاخد، بدّل `name` في `packages/parser/package.json` (مثلًا `waslfy-parser-core`) وحدّث أي إشارة ليها.

```bash
# مرة واحدة: حساب على npmjs.org ثم
npm login

cd packages/parser
npm publish
```

> **بديل احترافي (CI publishing):** اعمل [npm access token](https://www.npmjs.com/settings/<user>/tokens) نوع *Automation*، وحطه في GitHub → Settings → Secrets → `NPM_TOKEN`. ملف `.github/workflows/publish.yml` المرفق بينشر الحزمة تلقائيًا لما تعمل release/tag `v*`.

## 3)deployment لايف على Cloudflare Pages (ببلاش)

الويب أب local-first — السيرفر بيوصل ملفات ثابتة بس، فالـ free tier كفاية تمامًا.

### الطريقة الأسهل (Git integration):
1. [dash.cloudflare.com](https://dash.cloudflare.com) → Workers & Pages → Create → **Pages** → Connect to Git → اختار ريبو `waslfy`.
2. الإعدادات:
   - **Root directory:** `apps/web`
   - **Build command:** `cd ../.. && npm install && npm run build -w waslfy-parser` ثم `npm run build` (أو ضع الاثنين مفصولين بـ `&&` في خانة واحدة)
   - **Build output directory:** `.next`
   - Framework preset: **Next.js** (استخدم Workers builds لو طلب Next.js server-side — Pages static preview مش هيكفي لأن الأب Client-side بالكامل لكن next build بيريد runtime للـ SSR pages)
3. اضغط Deploy — وهتاخد رابط `*.pages.dev` لايف فورًا.

> **ملاحظة مهمة:** الأب كله `'use client'` ومفيش API routes، فلو حبيت تستخدم `next export`/static adapter هيشتغل من غير مشاكل. لو Pages اشتكى من ملفات SSR، فعّل **Next.js via Workers** (الزرار بيظهر في نفس الشاشة) — برضه ببلاش في الحدود المجانية.

### بديل: Vercel (أسهل لـ Next.js)
1. [vercel.com](https://vercel.com) → Add New Project → Import `waslfy`.
2. Root Directory: `apps/web` — الإعدادات بتتكشف تلقائيًا (Next.js).
3. Deploy. خلاص.

## 4) أوامر سريعة للمراجعة قبل النشر

```bash
npm install        # ينبّه لو حاجة في الـ workspaces ناقصة
npm test           # لازم يفضل أخضر — 7/7
npm run build      # يبني الحزمة (dist/ ESM+CJS+types)
npm pack --dry-run # في packages/parser — شوف الحجم والمحتويات قبل النشر
npm run web:build  # تأكد إن الويب أب بيبني نضيف
```

## 5) بعد النشر — دقيقتين من التسويق المجاني

- ضيف **Topics** للريبو: `egypt`, `arabic-nlp`, `shipping`, `cod`, `whatsapp`, `local-first`, `privacy`, `nextjs`, `typescript`.
- اعمل لقطة شاشة/GIF من الأب وضيفها في أول تعليق على [Product Hunt](https://producthunt.com) أو [r/egypt_dev](https://reddit.com/r/egypt_dev) — القصة بتبص: «بنيت أداة بتقرأ رسائل واتساب الطلبات المصرية، كل حاجة على جهاز التاجر».
- **anchor للسمعة:** نزّل حزمة الـ npm — أي حد يدور على "egyptian arabic parser" هيلاقيها، وكل تحميل عدّاد يتحسب ليك.
