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

// OpenAI API Key (Get free credits: https://platform.openai.com/)
const OPENAI_API_KEY = "sk-your-openai-key"; // Replace with your key

// Chat function
async function sendMessage() {
  const userInput = document.getElementById("userInput").value;
  if (!userInput) return;

  // Add user message to chat
  document.getElementById(
    "chatbox"
  ).innerHTML += `<p class="userText">You: ${userInput}</p>`;
  document.getElementById("userInput").value = "";

  // Call OpenAI API
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
          content:
            "You are a supportive mental health assistant. Respond with empathy and suggest coping strategies.",
        },
        { role: "user", content: userInput },
      ],
    }),
  });

  const data = await response.json();
  const botReply = data.choices[0].message.content;

  // Add bot reply to chat
  document.getElementById(
    "chatbox"
  ).innerHTML += `<p class="botText">MindEase: ${botReply}</p>`;
}

// Event listener
document.getElementById("sendButton").addEventListener("click", sendMessage);
document.getElementById("userInput").addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

// Initialize anonymous auth
auth.signInAnonymously().catch(console.error);
