/**
 * محافظات مصر الـ 27 + aliases مكتوبة بالرسم المُطبّع
 * (ة→ه، أ→ا، ئ→ي — و"ى" زي ما هي لأن التطبيع مش بيغيرها).
 * الاسم المعروض (name) بالرسم الصحيح الكامل.
 */

export interface Governorate {
  id: string;
  name: string;
  aliases: string[];
}

export const GOVERNORATES: Governorate[] = [
  { id: 'cairo', name: 'القاهرة', aliases: ['القاهره', 'قاهره', 'cairo'] },
  { id: 'giza', name: 'الجيزة', aliases: ['الجيزه', 'جيزه', 'giza'] },
  {
    id: 'alexandria',
    name: 'الإسكندرية',
    aliases: ['الاسكندريه', 'اسكندريه', 'سكندريه', 'الاسكندرانيه', 'اسكندرانيه', 'alexandria', 'alex'],
  },
  { id: 'qalyubia', name: 'القليوبية', aliases: ['القليوبيه', 'قليوبيه', 'qalyubia'] },
  {
    id: 'portsaid',
    name: 'بورسعيد',
    aliases: ['بورسعيد', 'بور سعيد', 'portsaid', 'port said'],
  },
  { id: 'suez', name: 'السويس', aliases: ['السويس', 'سويس', 'suez'] },
  {
    id: 'ismailia',
    name: 'الإسماعيلية',
    aliases: ['الاسماعيليه', 'اسماعيليه', 'ismailia'],
  },
  { id: 'damietta', name: 'دمياط', aliases: ['دمياط', 'damietta'] },
  { id: 'dakahlia', name: 'الدقهلية', aliases: ['الدقهليه', 'دقهليه', 'dakahlia'] },
  {
    id: 'sharqia',
    name: 'الشرقية',
    aliases: ['الشرقيه', 'شرقيه', 'sharqia', 'sharkia'],
  },
  { id: 'monufia', name: 'المنوفية', aliases: ['المنوفيه', 'منوفيه', 'monufia', 'menoufia'] },
  { id: 'gharbia', name: 'الغربية', aliases: ['الغربيه', 'غربيه', 'gharbia'] },
  { id: 'beheira', name: 'البحيرة', aliases: ['البحيره', 'بحيره', 'beheira'] },
  {
    id: 'kaftelsheikh',
    name: 'كفر الشيخ',
    aliases: ['كفر الشيخ', 'كفرالشيخ', 'kafr el sheikh', 'kafr elsheikh'],
  },
  { id: 'fayoum', name: 'الفيوم', aliases: ['الفيوم', 'فيوم', 'fayoum'] },
  {
    id: 'benisuef',
    name: 'بني سويف',
    aliases: ['بني سويف', 'بنى سويف', 'بنيسويف', 'beni suef', 'benisuef'],
  },
  { id: 'minya', name: 'المنيا', aliases: ['المنيا', 'منيا', 'minya', 'menia'] },
  { id: 'asyut', name: 'أسيوط', aliases: ['اسيوط', 'asyut', 'assiut'] },
  { id: 'sohag', name: 'سوهاج', aliases: ['سوهاج', 'sohag', 'souhag'] },
  { id: 'qena', name: 'قنا', aliases: ['قنا', 'qena'] },
  { id: 'luxor', name: 'الأقصر', aliases: ['الاقصر', 'اقصر', 'luxor'] },
  { id: 'aswan', name: 'أسوان', aliases: ['اسوان', 'aswan'] },
  {
    id: 'redsea',
    name: 'البحر الأحمر',
    aliases: ['البحر الاحمر', 'بحر احمر', 'البحرالاحمر', 'red sea', 'redsea'],
  },
  {
    id: 'newvalley',
    name: 'الوادي الجديد',
    aliases: ['الوادي الجديد', 'وادي جديد', 'new valley', 'newvalley'],
  },
  { id: 'matrouh', name: 'مطروح', aliases: ['مطروح', 'matrouh', 'matruh'] },
  { id: 'northsinai', name: 'شمال سيناء', aliases: ['شمال سيناء', 'north sinai'] },
  { id: 'southsinai', name: 'جنوب سيناء', aliases: ['جنوب سيناء', 'south sinai'] },
];

export const GOV_BY_ID: Record<string, Governorate> = Object.fromEntries(
  GOVERNORATES.map((g) => [g.id, g])
);
