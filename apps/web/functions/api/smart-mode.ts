/**
 * Smart Mode — POST /api/smart-mode
 * ===================================
 * مساعد اختياري للرسائل الصعبة: بياخد نص الرسالة ويرجّع اقتراحات استخراج.
 *
 * الوعود (نفس عقد المشروع):
 * - صفر تخزين: مفيش KV/D1/R2 — الطلب stateless وبيموت مع الـ response.
 * - صفر تسجيل للنص: مفيش console.log للـ body.
 * - الاقتراحات بترجع من غير confidence نهائي — العميل بيحطها 'medium' كحد أقصى
 *   وبـ source 'smart-ai'، وبتحتاج تأكيد بشري زي أي قيمة مش متأكدنة.
 * - الحد الأقصى 2000 حرف — الرسايل الحقيقية أقصر بكتير.
 */

interface Env {
  /** Workers AI binding — بيتفعّل من إعدادات المشروع على Cloudflare */
  AI?: {
    run: (model: string, input: unknown) => Promise<unknown>;
  };
}

const MAX_LEN = 2000;
const MODEL = '@cf/meta/llama-3.1-8b-instruct';

const SYSTEM_PROMPT = `You extract shipping-order data from a single customer message written in Egyptian Arabic dialect (sometimes MSA, English, or Arabic-Indic digits). Return ONLY a JSON object — no markdown fences, no commentary — with exactly these keys:
"name": customer name as written or null
"phone": best phone number as western digits (11 digits starting with 01) or null
"governorate": an Egyptian governorate name in Arabic (e.g. القاهرة، الجيزة، البحيرة) inferred from the governorate OR a well-known city/area, or null
"address": the street address portion as written or null
"amount": the cash-on-delivery amount as a plain number (convert Arabic-Indic digits like ٤٥٠ to 450) or null
"note": one short Arabic sentence warning about anything ambiguous, or null
Rules: use null for anything not clearly present. Never invent values. Never output anything except the JSON object.`;

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

/** تشد أول JSON object من نص الموديل — الموديل أحيانًا بيحط كلام قبل/بعد */
function extractJsonObject(raw: string): Record<string, unknown> | null {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(raw.slice(start, end + 1));
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function cleanStr(v: unknown, max = 200): string | null {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  return s.length > 0 ? s.slice(0, max) : null;
}

function cleanPhone(v: unknown): string | null {
  const s = cleanStr(v, 20);
  if (!s) return null;
  // حوّل الأرقام الهندية وشيل أي حاجة غير أرقام
  const western = s.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) & 0xf));
  const digits = western.replace(/\D/g, '');
  return /^01\d{9}$/.test(digits) ? digits : null;
}

function cleanAmount(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) {
    return v > 0 && v <= 1_000_000 ? Math.round(v) : null;
  }
  if (typeof v === 'string') {
    const western = v.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) & 0xf));
    const n = parseFloat(western.replace(/[^\d.]/g, ''));
    return Number.isFinite(n) && n > 0 && n <= 1_000_000 ? Math.round(n) : null;
  }
  return null;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.AI) {
    return json({ error: 'smart mode is not configured on this deployment', code: 'NO_AI' }, 501);
  }

  let body: { text?: unknown };
  try {
    body = (await request.json()) as { text?: unknown };
  } catch {
    return json({ error: 'invalid JSON body' }, 400);
  }

  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if (!text) return json({ error: 'text is required' }, 400);
  if (text.length > MAX_LEN) return json({ error: `text too long (max ${MAX_LEN} chars)` }, 413);

  let raw = '';
  try {
    const res = (await env.AI.run(MODEL, {
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: text },
      ],
      max_tokens: 320,
      temperature: 0.1,
    })) as { response?: string } | string;
    raw = typeof res === 'string' ? res : (res?.response ?? '');
  } catch {
    return json({ error: 'ai service failed, try again', code: 'AI_FAILED' }, 502);
  }

  const obj = extractJsonObject(raw);
  if (!obj) return json({ error: 'ai returned unparseable output', code: 'AI_BAD_OUTPUT' }, 502);

  return json({
    name: cleanStr(obj.name, 80),
    phone: cleanPhone(obj.phone),
    governorate: cleanStr(obj.governorate, 40),
    address: cleanStr(obj.address, 300),
    amount: cleanAmount(obj.amount),
    note: cleanStr(obj.note, 200),
  });
};

// ممنوع أي method تاني — المسار ده POST بس
export const onRequest: PagesFunction = async () => json({ error: 'method not allowed' }, 405);
