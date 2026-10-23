/**
 * خريطة مدينة/منطقة → محافظة (مفاتيح بالرسم المُطبّع).
 * منطقة جوه محافظة معينة بتحدد المحافظة لو الاسم الرسمي ممنكتبش.
 */
import { GOVERNORATES } from './governorates';

export const CITY_TO_GOV: Record<string, string> = {
  // الدقهلية
  'المنصوره': 'dakahlia', 'ميت غمر': 'dakahlia', 'دكرنس': 'dakahlia',
  'نبروه': 'dakahlia', 'بلقاس': 'dakahlia', 'السنبلاوين': 'dakahlia', 'طلخا': 'dakahlia',
  'mansoura': 'dakahlia',
  // الغربية
  'طنطا': 'gharbia', 'طنطه': 'gharbia', 'المحله الكبرى': 'gharbia', 'المحله الكبري': 'gharbia',
  'كفر الزيات': 'gharbia', 'زفتى': 'gharbia', 'زفتي': 'gharbia', 'السنطه': 'gharbia',
  'tanta': 'gharbia',
  // الشرقية
  'الزقازيق': 'sharqia', 'العاشر من رمضان': 'sharqia', 'بلبيس': 'sharqia', 'ابو حماد': 'sharqia',
  'zagazig': 'sharqia', '10th of ramadan': 'sharqia',
  // الجيزة
  'المهندسين': 'giza', 'الدقي': 'giza', 'الهرم': 'giza', 'فيصل': 'giza',
  '6 اكتوبر': 'giza', 'السادس من اكتوبر': 'giza', 'دريم بارك': 'giza', 'الشيخ زايد': 'giza',
  'الوراق': 'giza', 'امبابه': 'giza', 'كرداسه': 'giza',
  '6th of october': 'giza',
  // القاهرة
  'مدينه نصر': 'cairo', 'المعادي': 'cairo', 'وسط البلد': 'cairo', 'حلوان': 'cairo',
  'مصر الجديده': 'cairo', 'الزمالك': 'cairo', 'العبور': 'cairo', 'القاهره الجديده': 'cairo',
  'المرج': 'cairo', 'شبرا مصر': 'cairo',
  'nasr city': 'cairo', 'maadi': 'cairo', 'heliopolis': 'cairo',
  // القليوبية
  'شبرا الخيمه': 'qalyubia', 'بنها': 'qalyubia', 'الخانكه': 'qalyubia', 'قليوب': 'qalyubia',
  // المنوفية
  'شبين الكوم': 'monufia', 'منوف': 'monufia', 'قويسنا': 'monufia', 'السادات': 'monufia', 'اشمون': 'monufia',
  // البحيرة
  'دمنهور': 'beheira', 'كفر الدوار': 'beheira', 'ايتاي البارود': 'beheira', 'ادكو': 'beheira',
  'وادي النطرون': 'beheira', 'رشيد': 'beheira',
  // كفر الشيخ
  'دسوق': 'kaftelsheikh', 'مطوبس': 'kaftelsheikh', 'بلطيم': 'kaftelsheikh', 'الحامول': 'kaftelsheikh',
  'بولين': 'kaftelsheikh',
  // الإسكندرية
  'سموحه': 'alexandria', 'ميامي': 'alexandria', 'العجمي': 'alexandria', 'سيدي بشر': 'alexandria',
  'المندره': 'alexandria', 'باكوس': 'alexandria', 'محرم بك': 'alexandria',
  'miami': 'alexandria', 'smouha': 'alexandria',
  // دمياط
  'راس البر': 'damietta', 'فرن': 'damietta',
  // بورسعيد
  'بورفواد': 'portsaid',
  // السويس والإسماعيلية
  'الاربعين': 'suez', 'الفايد': 'ismailia', 'القنطره': 'ismailia',
  // الفيوم
  'سنورس': 'fayoum', 'طاميه': 'fayoum', 'اطسا': 'fayoum', 'ابشواي': 'fayoum',
  // بني سويف
  'ببا': 'benisuef', 'الواسطى': 'benisuef', 'الواسطي': 'benisuef', 'سمسطا': 'benisuef',
  // المنيا
  'ملوي': 'minya', 'بني مزار': 'minya', 'مغاغه': 'minya', 'مطاي': 'minya', 'سمالوط': 'minya', 'دير مواس': 'minya',
  // أسيوط
  'ديروط': 'asyut', 'القوصيه': 'asyut', 'ابوتيج': 'asyut', 'منفلوط': 'asyut', 'ابنوب': 'asyut',
  // سوهاج
  'طهطا': 'sohag', 'اخميم': 'sohag', 'البلينه': 'sohag', 'دار السلام': 'sohag',
  // قنا
  'نجع حمادي': 'qena', 'قفط': 'qena', 'فرشوط': 'qena', 'دشنا': 'qena', 'ابو تشت': 'qena',
  // الأقصر
  'اسنا': 'luxor', 'ارمنت': 'luxor', 'القرنه': 'luxor', 'الكرنك': 'luxor', 'الطود': 'luxor',
  // أسوان
  'كوم امبو': 'aswan', 'ادفو': 'aswan', 'دراو': 'aswan',
  // البحر الأحمر
  'الغردقه': 'redsea', 'مرسى علم': 'redsea', 'سفاجا': 'redsea', 'الجونه': 'redsea',
  // الوادي الجديد
  'الخارجه': 'newvalley', 'الداخله': 'newvalley',
  // مطروح
  'سيوه': 'matrouh', 'مرسى مطروح': 'matrouh',
  // سيناء
  'العريش': 'northsinai', 'الشيخ زويد': 'northsinai', 'رفح': 'northsinai', 'بير العبد': 'northsinai',
  'شرم الشيخ': 'southsinai', 'دهب': 'southsinai', 'نويبع': 'southsinai', 'طابا': 'southsinai',
};

/** كل كلمات المحافظات والمدن — ممنوع تُحسب جزء من اسم شخص.
 *  المفتاح متعدد الكلمات: بنحجب أول كلمة بس (عشان "محمد رمضان" ميتمنعش بسبب "العاشر من رمضان"). */
export function buildNameBlockSet(): Set<string> {
  const blocked = new Set<string>();
  const addWord = (w: string): void => {
    blocked.add(w);
    if (w.startsWith('ال') && w.length >= 5) blocked.add(w.slice(2));
  };
  for (const g of GOVERNORATES) {
    for (const alias of g.aliases) {
      const words = alias.split(/\s+/);
      addWord(words[0]);
    }
  }
  for (const city of Object.keys(CITY_TO_GOV)) {
    const words = city.split(/\s+/);
    addWord(words[0]);
  }
  return blocked;
}
