# Lingua — Live Translator

A lightweight browser app for translating typed text or speech recognition results. It supports English, French, Spanish, German, Italian, Portuguese, Japanese, Chinese, Arabic, Russian, and Dutch.

## Run locally

1. Install Node.js 20.19+ or 22.12+.
2. Run `npm install`.
3. Run `npm run dev` and open the local URL printed by Vite.

Run `npm test` for the translation-module tests and `npm run build` to create the production bundle in `dist/`.

## Translation and browser support

Translations use the public MyMemory endpoint (`api.mymemory.translated.net`); no API key or account is required. The endpoint currently limits each request to 500 characters and applies its own fair-use limits. The browser sends the text you enter or dictate to this service over HTTPS. Do not submit sensitive content.

Voice input uses the browser Web Speech API and requires microphone permission; it is best supported in Chrome and Edge. Voice output uses the browser's speech synthesis voices. Typed translation remains available in browsers without speech support. For local microphone access, use `localhost`; deployed sites must use HTTPS.
