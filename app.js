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
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// DOM Elements
const chatbox = document.getElementById("chatbox");
const userInput = document.getElementById("userInput");
const sendButton = document.getElementById("sendButton");
const moodButtons = document.querySelectorAll(".mood-btn");
const currentMoodDisplay = document.getElementById("current-mood");
const moodColorIndicator = document.querySelector(".mood-color");
const breathingCircle = document.querySelector(".breathing-circle");
const stopBreathingBtn = document.getElementById("stop-breathing");

// OpenAI API Key (replace with yours)
const OPENAI_API_KEY =
  "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";
let conversationHistory = [];
let currentMood = "neutral";

// Initialize app
auth
  .signInAnonymously()
  .then(() => {
    loadChatHistory();
    initEventListeners();
  })
  .catch((error) => {
    console.error("Authentication error:", error);
    showSystemMessage("Connection error. Using offline mode.");
  });

// ======================
// CORE FUNCTIONALITY
// ======================

function initEventListeners() {
  // Mood selection
  moodButtons.forEach((btn) => {
    btn.addEventListener("click", () => handleMoodSelection(btn));
  });

  // Message sending
  sendButton.addEventListener("click", sendMessage);
  userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  // Breathing exercise
  stopBreathingBtn.addEventListener("click", stopBreathingExercise);
}

function handleMoodSelection(button) {
  const mood = button.dataset.mood;
  currentMood = mood;

  // Update UI
  currentMoodDisplay.textContent = mood.charAt(0).toUpperCase() + mood.slice(1);
  moodColorIndicator.style.backgroundColor =
    window.getComputedStyle(button).backgroundColor;

  // Add to chat
  addMessageToChat(`I'm feeling ${mood}.`, "user");
  generateAIResponse(`The user reported feeling ${mood}.`);

  // Save mood to history
  saveMoodToHistory(mood);
}

async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  // Add to chat
  addMessageToChat(message, "user");
  userInput.value = "";

  // Generate AI response
  await generateAIResponse(message);

  // Save to history
  saveMessageToHistory(message, "user");
}

async function generateAIResponse(userMessage) {
  showTypingIndicator();

  try {
    // For demo purposes - replace with actual OpenAI API call
    const response = await simulateAIResponse(userMessage);

    addMessageToChat(response, "bot");
    saveMessageToHistory(response, "bot");
  } catch (error) {
    console.error("AI Error:", error);
    addMessageToChat(
      "I'm having trouble connecting. Please try again later.",
      "bot"
    );
  } finally {
    hideTypingIndicator();
  }
}

// ======================
// AI INTEGRATION
// ======================

async function simulateAIResponse(message) {
  // This is a simulation - replace with actual OpenAI API call
  const responses = {
    stress:
      "Stress can feel overwhelming. Let's break things down into smaller steps. What's one small thing you can do right now?",
    anxious:
      "Anxiety often comes from uncertainty. Try this: name 3 things you can see, 2 you can touch, and 1 you can hear.",
    sad: "I'm sorry you're feeling this way. Sadness needs space to be felt. Would writing about it help?",
    default: "I hear you. Tell me more about what's on your mind.",
  };

  const lowerMsg = message.toLowerCase();

  if (lowerMsg.includes("stress")) return responses.stress;
  if (lowerMsg.includes("anxious")) return responses.anxious;
  if (lowerMsg.includes("sad")) return responses.sad;

  return responses.default;
}

async function callOpenAI(message) {
  // REAL OpenAI implementation (uncomment to use)

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
          content: `You are a compassionate mental health assistant. Respond to the user who is currently feeling ${currentMood}. 
                      Keep responses under 2 sentences. Offer coping strategies when appropriate.`,
        },
        ...conversationHistory,
        { role: "user", content: message },
      ],
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

function showSystemMessage(text) {
  const sysMsg = document.createElement("div");
  sysMsg.className = "system-message";
  sysMsg.textContent = text;
  chatbox.appendChild(sysMsg);
}

// ======================
// BREATHING EXERCISE
// ======================

function startBreathingExercise() {
  breathingCircle.style.animation = "pulse 8s infinite ease-in-out";
}

function stopBreathingExercise() {
  breathingCircle.style.animation = "none";
  addMessageToChat(
    "Great job completing the breathing exercise! How do you feel now?",
    "bot"
  );
}

// ======================
// DATA PERSISTENCE
// ======================

function loadChatHistory() {
  const savedHistory = localStorage.getItem("mindEaseChatHistory");
  if (savedHistory) {
    const history = JSON.parse(savedHistory);
    history.forEach((msg) => {
      addMessageToChat(msg.text, msg.sender);
    });
  } else {
    addMessageToChat(
      "Hello! I'm here to listen. How are you feeling today?",
      "bot"
    );
  }
}

function saveMessageToHistory(message, sender) {
  conversationHistory.push({
    text: message,
    sender: sender,
    timestamp: new Date().toISOString(),
  });

  // Keep only last 50 messages
  if (conversationHistory.length > 50) {
    conversationHistory.shift();
  }

  localStorage.setItem(
    "mindEaseChatHistory",
    JSON.stringify(conversationHistory)
  );
}

function saveMoodToHistory(mood) {
  const moodHistory = JSON.parse(
    localStorage.getItem("mindEaseMoodHistory") || []
  );
  moodHistory.push({
    mood: mood,
    date: new Date().toISOString(),
  });
  localStorage.setItem("mindEaseMoodHistory", JSON.stringify(moodHistory));
}

// Initialize
startBreathingExercise();
