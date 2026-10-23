/**
 * مولّد باركود Code128-B — صفر dependencies.
 * كل رمز في Code128 بيتكون من 6 عناصر (خط/فراغ بالتناوب) مجموعها 11 وحدة،
 * والـ STOP 7 عناصر مجموعها 13. الجدول ده هو الجدول القياسي المعروف،
 * وعندنا فحص هيكلية بيصرخ لو أي صف مجموعه مش 11 (بيكشف أي غلطة كتابة).
 */

// القيم 0..105 — كل نص = عروض العناصر بالتناوب (خط/فراغ) بدءًا بالخط
export const CODE128_PATTERNS: string[] = [
  '212222', // 0
  '222122', // 1
  '222221', // 2
  '121223', // 3
  '121322', // 4
  '131222', // 5
  '122213', // 6
  '122312', // 7
  '132212', // 8
  '221213', // 9
  '221312', // 10
  '231212', // 11
  '112232', // 12
  '122132', // 13
  '122231', // 14
  '113222', // 15
  '123122', // 16
  '123221', // 17
  '223211', // 18
  '221132', // 19
  '221231', // 20
  '213212', // 21
  '223112', // 22
  '312131', // 23
  '311222', // 24
  '321122', // 25
  '321221', // 26
  '312212', // 27
  '322112', // 28
  '322211', // 29
  '212123', // 30
  '212321', // 31
  '232121', // 32
  '111323', // 33
  '131123', // 34
  '131321', // 35
  '112313', // 36
  '132113', // 37
  '132311', // 38
  '211313', // 39
  '231113', // 40
  '231311', // 41
  '112133', // 42
  '112331', // 43
  '132131', // 44
  '113123', // 45
  '113321', // 46
  '133121', // 47
  '313121', // 48
  '211331', // 49
  '231131', // 50
  '213113', // 51
  '213311', // 52
  '213131', // 53
  '311123', // 54
  '311321', // 55
  '331121', // 56
  '312113', // 57
  '312311', // 58
  '332111', // 59
  '314111', // 60
  '221411', // 61
  '431111', // 62
  '111224', // 63
  '111422', // 64
  '121124', // 65
  '121421', // 66
  '141122', // 67
  '141221', // 68
  '112214', // 69
  '112412', // 70
  '122114', // 71
  '122411', // 72
  '142112', // 73
  '142211', // 74
  '241211', // 75
  '221114', // 76
  '413111', // 77
  '241112', // 78
  '134111', // 79
  '111242', // 80
  '121142', // 81
  '121241', // 82
  '114212', // 83
  '124112', // 84
  '124211', // 85
  '411212', // 86
  '421112', // 87
  '421211', // 88
  '212141', // 89
  '214121', // 90
  '412121', // 91
  '111143', // 92
  '111341', // 93
  '131141', // 94
  '114113', // 95
  '114311', // 96
  '411113', // 97
  '411311', // 98
  '113141', // 99
  '114131', // 100
  '311141', // 101
  '411131', // 102
  '211412', // 103 = START A
  '211214', // 104 = START B
  '211232', // 105 = START C
];

const STOP_PATTERN = '2331112';
const START_B = 104;

export interface BarcodeBar {
  x: number;
  w: number;
}

/** فحص هيكلية للجدول — بيشتغل مرة واحدة في dev وبيكشف أي غلطة كتابة. */
export function validateCode128Table(): string[] {
  const errors: string[] = [];
  CODE128_PATTERNS.forEach((p, v) => {
    const sum = [...p].reduce((a, c) => a + Number(c), 0);
    if (p.length !== 6) errors.push(`الرمز ${v}: عدد العناصر ${p.length} مش 6`);
    if (sum !== 11) errors.push(`الرمز ${v}: مجموع العروض ${sum} مش 11`);
  });
  const stopSum = [...STOP_PATTERN].reduce((a, c) => a + Number(c), 0);
  if (STOP_PATTERN.length !== 7 || stopSum !== 13) {
    errors.push(`STOP: طول ${STOP_PATTERN.length} ومجموع ${stopSum} — المفروض 7 و 13`);
  }
  return errors;
}

/** Code128-B: ASCII من 32 لـ 126 → القيمة = code − 32. */
export function encodeCode128B(text: string): number[] | null {
  const vals: number[] = [];
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (code < 32 || code > 126) return null;
    vals.push(code - 32);
  }
  if (vals.length === 0 || vals.length > 48) return null;

  let sum = START_B;
  vals.forEach((v, i) => {
    sum += v * (i + 1);
  });
  const checksum = sum % 103;
  return [START_B, ...vals, checksum];
}

/** تسلسل العناصر الكامل (خط/فراغ) — بدون moduleWidth. */
function symbolPattern(text: string): string | null {
  const seq = encodeCode128B(text);
  if (!seq) return null;
  return [...seq.map((v) => CODE128_PATTERNS[v]), STOP_PATTERN].join('');
}

/** مواقع وعروض الخطوط السوداء جاهزة للرسم في SVG. */
export function code128Bars(text: string, moduleWidth = 2): BarcodeBar[] {
  const pattern = symbolPattern(text);
  if (!pattern) return [];
  const bars: BarcodeBar[] = [];
  let x = 0;
  for (let i = 0; i < pattern.length; i++) {
    const w = Number(pattern[i]) * moduleWidth;
    if (i % 2 === 0) bars.push({ x, w });
    x += w;
  }
  return bars;
}

/** العرض الكلي للباركود بالبكسل. */
export function code128Width(text: string, moduleWidth = 2): number {
  const pattern = symbolPattern(text);
  if (!pattern) return 0;
  return [...pattern].reduce((a, c) => a + Number(c), 0) * moduleWidth;
}

/** كود الشحنة المطبوع على الليبل — ثابت لكل شحنة. */
export function labelCode(id: string): string {
  return `WSL-${id.toUpperCase()}`;
}
