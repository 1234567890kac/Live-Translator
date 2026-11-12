import test from "node:test";
import assert from "node:assert/strict";
import { translateText, languageCodeForSpeech } from "../src/translator.js";

test("translates text through MyMemory and decodes returned HTML entities", async () => {
  let requestedUrl;
  const result = await translateText("  Good morning  ", "en-US", "fr-FR", async (url) => {
    requestedUrl = new URL(url);
    return {
      ok: true,
      json: async () => ({
        responseStatus: 200,
        responseData: { translatedText: "Bonjour &amp; bienvenue" },
      }),
    };
  });

  assert.equal(result, "Bonjour & bienvenue");
  assert.equal(requestedUrl.searchParams.get("q"), "Good morning");
  assert.equal(requestedUrl.searchParams.get("langpair"), "en|fr");
});

test("returns the original phrase when source and target languages match", async () => {
  const result = await translateText("hello", "en-US", "en-US", () => {
    assert.fail("same-language translations should not call the service");
  });

  assert.equal(result, "hello");
});

test("rejects text beyond the provider's per-request limit", async () => {
  await assert.rejects(
    translateText("a".repeat(501), "en-US", "fr-FR"),
    /under 500 characters/,
  );
});

test("surfaces translation service errors", async () => {
  await assert.rejects(
    translateText("hello", "en-US", "fr-FR", async () => ({ ok: false })),
    /service is unavailable/,
  );
});

test("maps supported locales for speech input", () => {
  assert.equal(languageCodeForSpeech("ja-JP"), "ja-JP");
  assert.equal(languageCodeForSpeech("xx-XX"), null);
});
