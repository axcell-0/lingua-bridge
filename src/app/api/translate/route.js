import { getSessionUser } from '@/lib/auth';
import { rateLimit } from '@/lib/rateLimit';

// MyMemory's language codes — mostly standard, a couple of small adjustments
const MYMEMORY_CODES = {
  en: 'en', fr: 'fr', es: 'es', de: 'de',
  pt: 'pt', zh: 'zh-CN', ar: 'ar', ja: 'ja', ru: 'ru',
};

export async function POST(request) {
  const session = getSessionUser(request);
  if (!session) {
    return Response.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const { allowed } = rateLimit(`translate:${session.userId}`, 20, 60_000);
  if (!allowed) {
    return Response.json({ error: 'Too many request. Please slow down.'}, { status: 429 });
  }

  const { text, sourceLang, targetLang } = await request.json();

  if (!text || !sourceLang || !targetLang) {
    return Response.json({ error: 'Missing fields.' }, { status: 400 });
  }
  if (text.length > 500) {
    return Response.json({ error: 'Text is too long.' }, { status: 400 });
  }
  if (sourceLang === targetLang) {
  return Response.json({ translated: text }); // no translation needed
}

  const src = MYMEMORY_CODES[sourceLang] || sourceLang;
  const tgt = MYMEMORY_CODES[targetLang] || targetLang;

  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${src}|${tgt}`;
    const response = await fetch(url);
    const data = await response.json();
    const translated = data?.responseData?.translatedText || text;

    return Response.json({ translated });
  } catch (error) {
    console.error('Translation error:', error);
    return Response.json({ error: 'Translation failed.' }, { status: 500 });
  }
}