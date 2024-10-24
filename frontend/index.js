import { backend } from "declarations/backend";

const TRANSLATE_API = "https://api.mymemory.translated.net/get";

// DOM Elements
const sourceText = document.getElementById("sourceText");
const targetLang = document.getElementById("targetLang");
const translateBtn = document.getElementById("translateBtn");
const translatedText = document.getElementById("translatedText");
const speakBtn = document.getElementById("speakBtn");
const voiceStyle = document.getElementById("voiceStyle");
const volumeWarning = document.getElementById("volumeWarning");
const historyList = document.getElementById("historyList");

// Speech synthesis setup
const speechSynthesis = window.speechSynthesis;
let voices = [];

// Voice styles configurations
const voiceStyles = {
    chipmunk: { pitch: 2.0, rate: 1.5 },
    robot: { pitch: 0.5, rate: 0.7 },
    giant: { pitch: 0.3, rate: 0.6 },
    monkey: { pitch: 2.5, rate: 1.2 },
    random: () => ({
        pitch: 0.1 + Math.random() * 2.9,
        rate: 0.1 + Math.random() * 2.9
    })
};

// Get available voices
function loadVoices() {
    voices = speechSynthesis.getVoices();
}

// Load voices when they're ready
speechSynthesis.onvoiceschanged = loadVoices;
loadVoices();

// Show/hide volume warning
voiceStyle.addEventListener('change', (e) => {
    volumeWarning.style.display = e.target.value === 'monkey' ? 'block' : 'none';
});

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

// Create monkey screech effect
function createMonkeyScreech(text) {
    const words = text.split(' ');
    let delay = 0;
    
    words.forEach((word) => {
        // Create multiple utterances for each word to simulate screeching
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const utterance = new SpeechSynthesisUtterance(word);
                utterance.pitch = 2.5 + (Math.random() * 0.5);
                utterance.rate = 1.2 + (Math.random() * 0.4);
                utterance.volume = 0.7 + (Math.random() * 0.3);
                
                // Add random pitch variations
                utterance.onboundary = (event) => {
                    if (event.name === 'word') {
                        utterance.pitch = 2.5 + (Math.sin(Date.now() * 0.01) * 0.5);
                    }
                };
                
                speechSynthesis.speak(utterance);
            }, delay);
            delay += 200;
        }
        delay += 500;
    });
}

// Speak function with funny voice effect
function speakText() {
    if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
    }

    const style = voiceStyle.value;
    
    // Special handling for monkey voice
    if (style === 'monkey') {
        createMonkeyScreech(translatedText.value);
        return;
    }

    const utterance = new SpeechSynthesisUtterance(translatedText.value);
    
    // Find a voice for the selected language
    const targetVoice = voices.find(voice => 
        voice.lang.startsWith(targetLang.value)
    );
    
    if (targetVoice) {
        utterance.voice = targetVoice;
    }

    // Apply voice style
    const voiceEffect = style === 'random' 
        ? voiceStyles.random()
        : voiceStyles[style];

    utterance.pitch = voiceEffect.pitch;
    utterance.rate = voiceEffect.rate;

    // Add wobble effect for robot voice
    if (style === 'robot') {
        const text = translatedText.value;
        const chunks = text.split(' ');
        let delay = 0;
        
        chunks.forEach((chunk) => {
            setTimeout(() => {
                const chunkUtterance = new SpeechSynthesisUtterance(chunk);
                chunkUtterance.pitch = voiceEffect.pitch + (Math.random() * 0.4 - 0.2);
                chunkUtterance.rate = voiceEffect.rate;
                speechSynthesis.speak(chunkUtterance);
            }, delay);
            delay += 500;
        });
        return;
    }

    // Visual feedback
    speakBtn.textContent = "🔊 Speaking...";
    speakBtn.classList.add("speaking");

    utterance.onend = () => {
        speakBtn.textContent = "🔊 Speak It Funny!";
        speakBtn.classList.remove("speaking");
    };
    
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
sourceText.addEventListener("input", () => {
    translateBtn.disabled = !sourceText.value.trim();
});

// Initial history load
updateHistory();
