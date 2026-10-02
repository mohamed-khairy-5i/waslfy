/**
 * Egypt's 27 governorates with matching aliases + a city/district → governorate map.
 * People write the CITY or DISTRICT (المنصورة، الهرم، مدينة نصر) — not the governorate.
 *
 * IMPORTANT: stored forms are pre-normalized (normalizeArabicLetters conventions:
 *   أإآ→ا، ى→ي، ة→ه، ؤ→و، ئ→ي). Match time normalizes both sides anyway.
 */

export interface Governorate {
  id: string;
  nameAr: string;
  aliases: string[];
}

export const GOVERNORATES: Governorate[] = [
  { id: 'cairo',       nameAr: 'القاهرة',    aliases: ['القاهره', 'cairo', 'قلب مصر'] },
  { id: 'giza',        nameAr: 'الجيزة',     aliases: ['الجيزه', 'جيزه', 'giza'] },
  { id: 'alexandria',  nameAr: 'الإسكندرية', aliases: ['الاسكندريه', 'اسكندريه', 'سكندريه', 'alexandria', 'alex'] },
  { id: 'qalyubia',    nameAr: 'القليوبية',  aliases: ['القليوبيه', 'قليوبيه'] },
  { id: 'dakahlia',    nameAr: 'الدقهلية',   aliases: ['الدقهليه', 'دقهليه'] },
  { id: 'sharqia',     nameAr: 'الشرقية',    aliases: ['الشرقيه', 'شرقيه'] },
  { id: 'gharbia',     nameAr: 'الغربية',    aliases: ['الغربيه', 'غربيه'] },
  { id: 'menufia',     nameAr: 'المنوفية',   aliases: ['المنوفيه', 'منوفيه'] },
  { id: 'beheira',     nameAr: 'البحيرة',    aliases: ['البحيره', 'بحيره'] },
  { id: 'kafr-sheikh', nameAr: 'كفر الشيخ',  aliases: ['كفر الشيخ', 'كفرشيخ'] },
  { id: 'damietta',    nameAr: 'دمياط',      aliases: ['دمياط', 'damietta'] },
  { id: 'port-said',   nameAr: 'بورسعيد',    aliases: ['بورسعيد', 'بور سعيد', 'portsaid'] },
  { id: 'ismailia',    nameAr: 'الإسماعيلية', aliases: ['الاسماعيليه', 'اسماعيليه'] },
  { id: 'suez',        nameAr: 'السويس',     aliases: ['السويس', 'suez'] },
  { id: 'fayoum',      nameAr: 'الفيوم',     aliases: ['الفيوم', 'فيوم', 'fayoum'] },
  { id: 'beni-suef',   nameAr: 'بني سويف',   aliases: ['بني سويف', 'بني سويف'] },
  { id: 'minya',       nameAr: 'المنيا',     aliases: ['المنيا', 'منيا'] },
  { id: 'assiut',      nameAr: 'أسيوط',      aliases: ['اسيوط', 'assiut', 'assuit'] },
  { id: 'sohag',       nameAr: 'سوهاج',      aliases: ['سوهاج', 'sohag'] },
  { id: 'qena',        nameAr: 'قنا',        aliases: ['قنا'] },
  { id: 'luxor',       nameAr: 'الأقصر',     aliases: ['الاقصر', 'اقصر', 'luxor'] },
  { id: 'aswan',       nameAr: 'أسوان',      aliases: ['اسوان', 'aswan'] },
  { id: 'red-sea',     nameAr: 'البحر الأحمر', aliases: ['البحر الاحمر', 'بحر احمر', 'الغردقه', 'غردقه', 'مرسي علم', 'سفاجا'] },
  { id: 'matrouh',     nameAr: 'مطروح',      aliases: ['مطروح', 'مرسى مطروح', 'السلوم', 'سيدي براني', 'العلمين'] },
  { id: 'north-sinai', nameAr: 'شمال سيناء', aliases: ['شمال سيناء', 'العريش', 'بير العبد', 'الشيخ زويد'] },
  { id: 'south-sinai', nameAr: 'جنوب سيناء', aliases: ['جنوب سيناء', 'شرم الشيخ', 'شرم', 'دهب', 'نويبع', 'طور سيناء'] },
  { id: 'new-valley',  nameAr: 'الوادي الجديد', aliases: ['الوادي الجديد', 'الخارجه', 'الداخله'] }
];

/**
 * City / district → governorate. The practical magic of this parser:
 * customers almost never write the governorate name — they write where they live.
 */
export const CITY_TO_GOV: Record<string, string> = {
  // القاهرة (districts)
  'مدينه نصر': 'cairo', 'مصر الجديده': 'cairo', 'المعادي': 'cairo', 'حلوان': 'cairo',
  'المقطم': 'cairo', 'التجمع': 'cairo', 'الرحاب': 'cairo', 'مدينتي': 'cairo', 'شبرا': 'cairo',
  'عين شمس': 'cairo', 'الزيتون': 'cairo', 'حلميه': 'cairo', 'الزمالك': 'cairo', 'وسط البلد': 'cairo',
  'المطرية': 'cairo', 'عابدين': 'cairo', 'السيده زينب': 'cairo', 'المعادي الجديده': 'cairo',
  // الجيزة (districts + 6 أكتوبر)
  'الهرم': 'giza', 'الدقي': 'giza', 'المهندسين': 'giza', 'العجوزا': 'giza', 'فيصل': 'giza',
  'الوراق': 'giza', 'الواحات': 'giza', 'البدرشين': 'giza', 'كرداسه': 'giza', '6 اكتوبر': 'giza',
  'اكتوبر': 'giza', 'الشيخ زايد': 'giza', 'حدائق الهرم': 'giza', 'الكيت كات': 'giza', 'امبابه': 'giza',
  // الإسكندرية (districts)
  'سيدي جابر': 'alexandria', 'سموحه': 'alexandria', 'العجمي': 'alexandria', 'برج العرب': 'alexandria',
  'العصافره': 'alexandria', 'فلمنج': 'alexandria', 'سبورتنج': 'alexandria', 'محرم بك': 'alexandria',
  'المنشيه': 'alexandria', 'بهي': 'alexandria', 'الدخيله': 'alexandria', 'المندره': 'alexandria',
  // القليوبية
  'بنها': 'qalyubia', 'شبرا الخيمه': 'qalyubia', 'قليوب': 'qalyubia', 'الخانكه': 'qalyubia',
  'الخصوص': 'qalyubia', 'قها': 'qalyubia', 'مسطرد': 'qalyubia',
  // الدقهلية
  'المنصوره': 'dakahlia', 'منصوره': 'dakahlia', 'ميت غمر': 'dakahlia', 'بلقاس': 'dakahlia',
  'نبروه': 'dakahlia', 'دكرنس': 'dakahlia', 'طلخا': 'dakahlia', 'السنبلاوين': 'dakahlia', 'ميت سلسيل': 'dakahlia',
  // الشرقية
  'الزقازيق': 'sharqia', 'زقازيق': 'sharqia', 'بلبيس': 'sharqia', 'العاشر من رمضان': 'sharqia',
  'ابو حماد': 'sharqia', 'مشتول السوق': 'sharqia', 'القرين': 'sharqia', 'فاقوس': 'sharqia', 'هيهيا': 'sharqia',
  // الغربية
  'طنطا': 'gharbia', 'كفر الزيات': 'gharbia', 'زفتي': 'gharbia', 'المحله الكبري': 'gharbia',
  'المحله': 'gharbia', 'السنطه': 'gharbia', 'قطور': 'gharbia', 'بسيون': 'gharbia',
  // المنوفية
  'شبين الكوم': 'menufia', 'منوف': 'menufia', 'السادات': 'menufia', 'قويسنا': 'menufia',
  'بره السبع': 'menufia', 'تلا': 'menufia', 'الشهداء': 'menufia', 'اشمون': 'menufia', 'سرس الليان': 'menufia',
  // البحيرة
  'دمنهور': 'beheira', 'كفر الدوار': 'beheira', 'ادكو': 'beheira', 'رشيد': 'beheira',
  'ايتاي البارود': 'beheira', 'كوم حماده': 'beheira', 'وادي النطرون': 'beheira', 'النوباريه': 'beheira', 'حوش عيسي': 'beheira',
  // كفر الشيخ
  'دسوق': 'kafr-sheikh', 'بلطيم': 'kafr-sheikh', 'الحامول': 'kafr-sheikh', 'مطوبس': 'kafr-sheikh', 'سيدي سالم': 'kafr-sheikh', 'الحسينيه': 'kafr-sheikh',
  // دمياط / بورسعيد / الإسماعيلية / السويس
  'راس البر': 'damietta', 'فارسكور': 'damietta', 'الزرقا': 'damietta',
  'بورفؤاد': 'port-said', 'المناخ': 'port-said', 'حي الشرق': 'port-said', 'حي الضوء': 'port-said', 'حي العرب': 'port-said', 'حي المناخ': 'port-said',
  'فايد': 'ismailia', 'القنطره': 'ismailia', 'ابو سلطان': 'ismailia', 'الطويله': 'ismailia',
  'الأربعين': 'suez', 'اربعين': 'suez', 'مغارس': 'suez', 'الجناين': 'suez', 'عتاقه': 'suez',
  // الفيوم / بني سويف / المنيا
  'سنورس': 'fayoum', 'طاميه': 'fayoum', 'إطسا': 'fayoum', 'يبسا': 'fayoum', 'الواسطي': 'fayoum', 'طاميا': 'fayoum',
  'ببا': 'beni-suef', 'اهناسيا': 'beni-suef', 'ناصر': 'beni-suef', 'الواسطى': 'beni-suef',
  'ملوي': 'minya', 'بني مزار': 'minya', 'مغاغه': 'minya', 'مطاي': 'minya', 'سمالوط': 'minya', 'ابو قرقاص': 'minya',
  // أسيوط / سوهاج / قنا / الأقصر / أسوان
  'ديروط': 'assiut', 'ابو تج': 'assiut', 'القوصيه': 'assiut', 'منفلوط': 'assiut', 'أبنوب': 'assiut', 'البداري': 'assiut', 'مدينه نصر الجديده': 'assiut',
  'اخميم': 'sohag', 'طهطا': 'sohag', 'جهينا': 'sohag', 'البلينا': 'sohag', 'المراغه': 'sohag', 'دار السلام': 'sohag',
  'نجع حمادي': 'qena', 'قفط': 'qena', 'دشنا': 'qena', 'فرشوط': 'qena', 'نقاده': 'qena', 'أبو تشت': 'qena', 'الوقف': 'qena',
  'اسنا': 'luxor', 'أرمنت': 'luxor', 'القرنه': 'luxor', 'الطود': 'luxor', 'إسنا': 'luxor',
  'كوم امبو': 'aswan', 'ادفو': 'aswan', 'إدفو': 'aswan', 'دراو': 'aswan', 'أبو سمبل': 'aswan', 'السباعيه': 'aswan', 'نصر النوبه': 'aswan',
  // البحر الأحمر / مطروح / سيناء / الوادي الجديد
  'الغردقه': 'red-sea', 'مرسي علم': 'red-sea', 'سفاجا': 'red-sea', 'القسير': 'red-sea', 'راس غارب': 'red-sea',
  'السلوم': 'matrouh', 'سيدي براني': 'matrouh', 'العلمين': 'matrouh', 'الضبعه': 'matrouh', 'النجيله': 'matrouh',
  'العريش': 'north-sinai', 'بير العبد': 'north-sinai', 'الشيخ زويد': 'north-sinai', 'رفح': 'north-sinai',
  'شرم الشيخ': 'south-sinai', 'دهب': 'south-sinai', 'نويبع': 'south-sinai', 'طور سيناء': 'south-sinai',
  'الخارجه': 'new-valley', 'الداخله': 'new-valley', 'باريس': 'new-valley', 'الفرافره': 'new-valley'
};
