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
// INITIALIZATION
// ======================
// Firebase Config (replace with yours)
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

// Initialize event listeners
function initEventListeners() {
  // Mood selection
  moodButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      currentMood = btn.dataset.mood;
      currentMoodDisplay.textContent = btn.dataset.mood;
      addMessageToChat(`I'm feeling ${currentMood}`, "user");
      generateAIResponse(`User reports feeling ${currentMood}`);
    });
  });

  // Message sending
  sendButton.addEventListener("click", sendMessage);
  userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });
}

// Send user message to AI
async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  addMessageToChat(message, "user");
  userInput.value = "";

  try {
    await generateAIResponse(message);
  } catch (error) {
    console.error("Error:", error);
    addMessageToChat(
      "I'm having trouble connecting. Please try again later.",
      "bot"
    );
  }
}

// Generate AI response
async function generateAIResponse(userMessage) {
  showTypingIndicator();

  try {
    const response = await callOpenAI(userMessage);
    addMessageToChat(response, "bot");
  } catch (error) {
    console.error("API Error:", error);
    addMessageToChat(
      "I'm having technical difficulties. Maybe try rephrasing?",
      "bot"
    );
  } finally {
    hideTypingIndicator();
  }
}

// Call OpenAI API
async function callOpenAI(userMessage) {
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
          content: `You are a compassionate mental health assistant. The user currently feels ${currentMood}. 
                      Respond with:
                      1. Emotion validation (1 sentence)
                      2. One relevant coping strategy
                      3. An open-ended question
                      Keep responses under 3 sentences. Never suggest medical advice.`,
        },
        ...conversationHistory,
        { role: "user", content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 150,
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content;
}

// ======================
// UI HELPERS
// ======================

function addMessageToChat(message, sender) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${sender}-message`;
  messageDiv.innerHTML = `<p>${message}</p>`;
  chatbox.appendChild(messageDiv);
  chatbox.scrollTop = chatbox.scrollHeight;

  // Save to conversation history
  conversationHistory.push({
    role: sender === "user" ? "user" : "assistant",
    content: message,
  });
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
// INITIALIZE APP
// ======================
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
    console.error("Auth error:", error);
    addMessageToChat("Welcome! Let's talk about how you're feeling.", "bot");
  });
