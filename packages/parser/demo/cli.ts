/**
 * Demo CLI — paste a message, see the extracted draft as JSON.
 * Usage: npm run demo -- "نص الرسالة هنا"
 */
import { extractShipment } from '../src/index';

const input =
  process.argv.slice(2).join(' ') ||
  'السلام عليكم عايز أطلب\nالاسم: محمود السيد\nالعنوان: 15 شارع البحر دمنهور البحيرة\nالهاتف: 01012345678\nالمبلغ 350 جنيه كاش';

const draft = extractShipment(input);

console.log('\n=== Waslfy Parser Demo ===\n');
console.log('Input:\n' + input + '\n');
console.log('Extracted draft:\n');
console.log(JSON.stringify(draft, null, 2));
