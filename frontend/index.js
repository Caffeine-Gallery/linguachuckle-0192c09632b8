import { backend } from "declarations/backend";

const TRANSLATE_API = "https://api.mymemory.translated.net/get";

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
    if (!text) {
        translatedText.value = "Please enter some text to translate";
        return;
    }

    translateBtn.disabled = true;
    translatedText.value = "Translating...";

    try {
        const langPair = `en|${targetLang.value}`;
        const url = `${TRANSLATE_API}?q=${encodeURIComponent(text)}&langpair=${langPair}`;
        
        const response = await fetch(url);
        const data = await response.json();

        if (data.responseStatus === 200 && data.responseData) {
            const translatedResult = data.responseData.translatedText;
            translatedText.value = translatedResult;
            speakBtn.disabled = false;

            // Store in backend
            await backend.addTranslation(text, targetLang.value, translatedResult);
            await updateHistory();
        } else {
            throw new Error(data.responseDetails || "Translation failed");
        }
    } catch (error) {
        console.error("Translation error:", error);
        translatedText.value = `Translation error: ${error.message || "Please try again"}`;
        speakBtn.disabled = true;
    } finally {
        translateBtn.disabled = false;
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
    try {
        const history = await backend.getHistory();
        historyList.innerHTML = history.reverse().slice(0, 5).map(([source, target, translation]) => `
            <div class="history-item">
                <strong>${source}</strong> → ${translation} (${target})
            </div>
        `).join("");
    } catch (error) {
        console.error("Error loading history:", error);
        historyList.innerHTML = "<div class='error'>Failed to load translation history</div>";
    }
}

// Event listeners
translateBtn.addEventListener("click", translateText);
speakBtn.addEventListener("click", speakText);

// Initial history load
updateHistory();

// Add input listener to enable/disable translate button
sourceText.addEventListener("input", () => {
    translateBtn.disabled = !sourceText.value.trim();
});
