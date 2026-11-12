const LANGUAGE_CODES = {
  "en-US": "en",
  "fr-FR": "fr",
  "es-ES": "es",
  "de-DE": "de",
  "it-IT": "it",
  "pt-PT": "pt",
  "ja-JP": "ja",
  "zh-CN": "zh-CN",
  "ar-SA": "ar",
  "ru-RU": "ru",
  "nl-NL": "nl",
};

const TRANSLATION_URL = "https://api.mymemory.translated.net/get";
const MAX_TRANSLATION_LENGTH = 500;

export async function translateText(text, sourceLanguage, targetLanguage, fetcher = fetch) {
  const phrase = text.trim();
  if (!phrase) return "";
  if (phrase.length > MAX_TRANSLATION_LENGTH) {
    throw new Error(`Please keep text under ${MAX_TRANSLATION_LENGTH} characters.`);
  }

  const sourceCode = LANGUAGE_CODES[sourceLanguage];
  const targetCode = LANGUAGE_CODES[targetLanguage];
  if (!sourceCode || !targetCode) throw new Error("Please choose supported languages.");
  if (sourceCode === targetCode) return phrase;

  const url = new URL(TRANSLATION_URL);
  url.searchParams.set("q", phrase);
  url.searchParams.set("langpair", `${sourceCode}|${targetCode}`);

  const response = await fetcher(url);
  if (!response.ok) throw new Error("Translation service is unavailable. Please try again.");

  const data = await response.json();
  if (data.responseStatus !== 200 || !data.responseData?.translatedText) {
    throw new Error(data.responseDetails || "No translation was returned. Please try again.");
  }

  return decodeHtmlEntities(data.responseData.translatedText);
}

function decodeHtmlEntities(text) {
  const namedEntities = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: "\u00a0",
  };
  return text.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (entity, code) => {
    if (code[0] !== "#") return namedEntities[code.toLowerCase()] ?? entity;
    const point = code[1].toLowerCase() === "x"
      ? Number.parseInt(code.slice(2), 16)
      : Number.parseInt(code.slice(1), 10);
    return point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : entity;
  });
}

export function languageCodeForSpeech(locale) {
  return LANGUAGE_CODES[locale] ? locale : null;
}
