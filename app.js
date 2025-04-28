// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDK9SyNVEshSwDsl_Y4hLfQJnCYgaec3Vw",
  authDomain: "mind-ease-ai.firebaseapp.com",
  projectId: "mind-ease-ai",
  storageBucket: "mind-ease-ai.firebasestorage.app",
  messagingSenderId: "766345986443",
  appId: "1:766345986443:web:3ee07ea6836fc13e6a6f8e",
  measurementId: "G-0K1MY9LM1F",
};
// ======================
// CONFIGURATION & INIT
// ======================
// Firebase Config (replace with your values)
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// DOM Elements
const chatbox = document.getElementById("chatbox");
const userInput = document.getElementById("userInput");
const sendButton = document.getElementById("sendButton");
const moodButtons = document.querySelectorAll(".mood-btn");
const currentMoodDisplay = document.getElementById("current-mood");

// App State
let currentMood = "neutral";
let conversationHistory = [];
const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // From .env file

// ======================
// CORE FUNCTIONS
// ======================

/**
 * Calls OpenAI API with the user's message
 * @param {string} userMessage
 * @returns {Promise<string>} AI response
 */
async function callOpenAI(userMessage) {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a compassionate mental health assistant. The user feels ${currentMood}.\n
                        Respond with:\n
                        1. Emotion validation (1 sentence)\n
                        2. One relevant coping strategy\n
                        3. An open-ended question\n
                        Keep responses under 3 sentences. Never suggest medical advice.`,
          },
          ...conversationHistory,
          { role: "user", content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("OpenAI Error:", error);
    return "I'm having trouble connecting. Would you like to try again?";
  }
}

/**
 * Generates AI response and displays it
 * @param {string} userMessage
 */
async function generateAIResponse(userMessage) {
  showTypingIndicator();

  try {
    const aiResponse = await callOpenAI(userMessage);
    addMessageToChat(aiResponse, "bot");
    conversationHistory.push(
      { role: "user", content: userMessage },
      { role: "assistant", content: aiResponse }
    );
  } catch (error) {
    console.error("Response Error:", error);
    addMessageToChat(
      "I'm having technical difficulties. Maybe try rephrasing?",
      "bot"
    );
  } finally {
    hideTypingIndicator();
  }
}

/**
 * Handles sending user messages
 */
async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  addMessageToChat(message, "user");
  userInput.value = "";
  await generateAIResponse(message);
}

// ======================
// UI FUNCTIONS
// ======================

/**
 * Adds a message to the chat UI
 * @param {string} message
 * @param {'user'|'bot'} sender
 */
function addMessageToChat(message, sender) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${sender}-message`;
  messageDiv.innerHTML = `<p>${message}</p>`;
  chatbox.appendChild(messageDiv);
  chatbox.scrollTop = chatbox.scrollHeight;
}

function showTypingIndicator() {
  const typingDiv = document.createElement("div");
  typingDiv.id = "typing-indicator";
  typingDiv.className = "message bot-message typing";
  typingDiv.innerHTML =
    '<div class="typing-dots"><span></span><span></span><span></span></div>';
  chatbox.appendChild(typingDiv);
  chatbox.scrollTop = chatbox.scrollHeight;
}

function hideTypingIndicator() {
  const typingIndicator = document.getElementById("typing-indicator");
  if (typingIndicator) typingIndicator.remove();
}

// ======================
// INITIALIZATION
// ======================

/**
 * Sets up event listeners
 */
function initEventListeners() {
  // Mood selection
  moodButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      currentMood = btn.dataset.mood;
      currentMoodDisplay.textContent = currentMood;
      addMessageToChat(`I'm feeling ${currentMood}`, "user");
      generateAIResponse(`I'm feeling ${currentMood}`);
    });
  });

  // Message sending
  sendButton.addEventListener("click", sendMessage);
  userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });
}

// Start the app
auth
  .signInAnonymously()
  .then(() => {
    initEventListeners();
    addMessageToChat(
      "Hello! I'm here to listen. How are you feeling today?",
      "bot"
    );
  })
  .catch((error) => {
    console.error("Auth Error:", error);
    addMessageToChat("Welcome! Let's talk about how you're feeling.", "bot");
  });
