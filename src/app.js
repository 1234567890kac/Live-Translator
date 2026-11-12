import { languageCodeForSpeech, translateText } from "./translator.js";
import "./style.css";

const sourceLanguage = document.querySelector("#source-language");
const targetLanguage = document.querySelector("#target-language");
const sourceText = document.querySelector("#source-text");
const translatedText = document.querySelector("#translated-text");
const resultStatus = document.querySelector("#result-status");
const resultError = document.querySelector("#result-error");
const charCount = document.querySelector("#char-count");
const microphone = document.querySelector("#microphone");
const micLabel = document.querySelector("#mic-label");
const listeningIndicator = document.querySelector("#listening-indicator");
const copyButton = document.querySelector("#copy-result");
const speakButton = document.querySelector("#speak-result");
const recognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;

let recognition = null;
let translationTimer = null;
let translationSequence = 0;
let isListening = false;
let currentTranslation = "";
let recognizedBase = "";

if (recognitionConstructor) {
  recognition = new recognitionConstructor();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.onresult = handleRecognitionResult;
  recognition.onerror = (event) => {
    stopListening();
    showError(event.error === "not-allowed"
      ? "Allow microphone access in your browser to use voice input."
      : "Voice input stopped. You can continue by typing.");
  };
  recognition.onend = () => {
    if (isListening) {
      recognizedBase = sourceText.value.trimEnd();
      try {
        recognition.start();
      } catch {
        stopListening();
      }
    }
  };
} else {
  microphone.disabled = true;
  micLabel.textContent = "Unavailable";
  microphone.setAttribute("aria-label", "Voice input is not supported in this browser");
  document.querySelector("#support-note").textContent =
    "Voice input is not supported here. Type your text to translate.";
}

sourceText.addEventListener("input", () => {
  charCount.textContent = `${sourceText.value.length} / 500`;
  scheduleTranslation();
});

sourceLanguage.addEventListener("change", () => {
  if (recognition) recognition.lang = sourceLanguage.value;
  scheduleTranslation(0);
});
targetLanguage.addEventListener("change", () => scheduleTranslation(0));

document.querySelector("#swap-languages").addEventListener("click", () => {
  const source = sourceLanguage.value;
  sourceLanguage.value = targetLanguage.value;
  targetLanguage.value = source;
  if (recognition) recognition.lang = sourceLanguage.value;
  scheduleTranslation(0);
});

microphone.addEventListener("click", () => {
  if (!recognition) return;
  if (isListening) {
    stopListening();
  } else {
    recognition.lang = sourceLanguage.value;
    recognizedBase = sourceText.value.trimEnd();
    try {
      recognition.start();
      isListening = true;
      updateListeningState();
      sourceText.focus();
    } catch {
      showError("Voice input could not start. Please try again.");
    }
  }
});

copyButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(currentTranslation);
    resultStatus.textContent = "Copied";
    window.setTimeout(() => {
      if (resultStatus.textContent === "Copied") resultStatus.textContent = "Translation ready";
    }, 1400);
  } catch {
    showError("Clipboard access is unavailable in this browser.");
  }
});

speakButton.addEventListener("click", () => {
  if (!currentTranslation || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(currentTranslation);
  utterance.lang = targetLanguage.value;
  window.speechSynthesis.speak(utterance);
});

function handleRecognitionResult(event) {
  let finalText = "";
  let interimText = "";
  for (let index = 0; index < event.results.length; index += 1) {
    const result = event.results[index];
    if (result.isFinal) finalText += result[0].transcript;
    else interimText += result[0].transcript;
  }

  const separator = recognizedBase && (finalText || interimText) ? " " : "";
  sourceText.value = `${recognizedBase}${separator}${finalText}${interimText}`.slice(0, 500);
  charCount.textContent = `${sourceText.value.length} / 500`;
  if (finalText) scheduleTranslation();
}

function stopListening() {
  isListening = false;
  recognition?.stop();
  updateListeningState();
}

function updateListeningState() {
  microphone.classList.toggle("is-listening", isListening);
  microphone.setAttribute("aria-label", isListening ? "Stop speaking" : "Start speaking");
  micLabel.textContent = isListening ? "Stop" : "Speak";
  listeningIndicator.hidden = !isListening;
}

function scheduleTranslation(delay = 450) {
  window.clearTimeout(translationTimer);
  const sequence = ++translationSequence;
  resultError.textContent = "";
  const phrase = sourceText.value.trim();
  if (!phrase) {
    clearTranslation();
    return;
  }
  if (phrase.length > 500) {
    showError("Please keep text under 500 characters.");
    return;
  }
  resultStatus.textContent = "Waiting…";
  translationTimer = window.setTimeout(() => runTranslation(phrase, sequence), delay);
}

async function runTranslation(phrase, sequence) {
  resultStatus.textContent = "Translating…";
  try {
    const result = await translateText(phrase, sourceLanguage.value, targetLanguage.value);
    if (sequence !== translationSequence) return;
    currentTranslation = result;
    translatedText.textContent = result;
    translatedText.classList.toggle("is-empty", !result);
    copyButton.disabled = !result;
    speakButton.disabled = !result || !window.speechSynthesis;
    resultStatus.textContent = "Translation ready";
  } catch (error) {
    if (sequence !== translationSequence) return;
    showError(error.message);
    resultStatus.textContent = "Translation failed";
  }
}

function clearTranslation() {
  translationSequence += 1;
  currentTranslation = "";
  translatedText.innerHTML = '<span class="placeholder-text">Your translation will appear here.</span>';
  copyButton.disabled = true;
  speakButton.disabled = true;
  resultError.textContent = "";
  resultStatus.textContent = "Ready when you are";
}

function showError(message) {
  resultError.textContent = message;
}
