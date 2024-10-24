import { backend } from "declarations/backend";

const LIBRE_TRANSLATE_API = "https://libretranslate.de/translate";

// DOM Elements
const sourceText = document.getElementById("sourceText");
const targetLang = document.getElementById("targetLang");
const translateBtn = document.getElementById("translateBtn");
const translatedText = document.getElementById("translatedText");
const speakBtn = document.getElementById("speakBtn");
const historyList = document.getElementById("historyList");

// Speech synthesis setup
const speechSynthesis = window.speechSynthesis;
let voices = [];

// Get available voices
function loadVoices() {
    voices = speechSynthesis.getVoices();
}

// Load voices when they're ready
speechSynthesis.onvoiceschanged = loadVoices;
loadVoices();

// Translation function
async function translateText() {
    const text = sourceText.value.trim();
    if (!text) return;

    try {
        const response = await fetch(LIBRE_TRANSLATE_API, {
            method: "POST",
            body: JSON.stringify({
                q: text,
                source: "en",
                target: targetLang.value,
            }),
            headers: { "Content-Type": "application/json" }
        });

        const data = await response.json();
        translatedText.value = data.translatedText;
        speakBtn.disabled = false;

        // Store in backend
        await backend.addTranslation(text, targetLang.value, data.translatedText);
        await updateHistory();
    } catch (error) {
        console.error("Translation error:", error);
        translatedText.value = "Translation error occurred. Please try again.";
    }
}

// Speak function with funny voice effect
function speakText() {
    if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(translatedText.value);
    
    // Find a voice for the selected language
    const targetVoice = voices.find(voice => 
        voice.lang.startsWith(targetLang.value)
    );
    
    if (targetVoice) {
        utterance.voice = targetVoice;
    }

    // Funny voice effects
    utterance.pitch = 1.5; // Higher pitch
    utterance.rate = 0.8;  // Slower rate
    
    speechSynthesis.speak(utterance);
}

// Update history display
async function updateHistory() {
    const history = await backend.getHistory();
    historyList.innerHTML = history.reverse().slice(0, 5).map(([source, target, translation]) => `
        <div class="history-item">
            <strong>${source}</strong> → ${translation} (${target})
        </div>
    `).join("");
}

// Event listeners
translateBtn.addEventListener("click", translateText);
speakBtn.addEventListener("click", speakText);

// Initial history load
updateHistory();
