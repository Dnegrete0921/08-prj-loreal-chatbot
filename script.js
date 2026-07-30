/* Grab key elements from the page */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

/* Replace this with your class Cloudflare Worker URL from the README */
const WORKER_URL = "https://loreal-chatbot.your-subdomain.workers.dev/";

/* Add one message bubble to the chat window */
function addMessage(role, text) {
  const bubble = document.createElement("p");
  bubble.classList.add("msg", role);
  bubble.textContent = text;
  chatWindow.appendChild(bubble);

  // Keep newest message visible
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* Show the first assistant greeting */
addMessage("ai", "Hello! Ask me about products or beauty routines.");

/* Send message to the class Cloudflare Worker */
async function fetchAssistantReply(userMessage) {
  const response = await fetch(WORKER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: [
        {
          role: "user",
          content: userMessage,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error("Request failed");
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/* Handle form submit */
chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const message = userInput.value.trim();
  if (!message) {
    return;
  }

  // Show the student's message right away
  addMessage("user", message);
  userInput.value = "";

  try {
    const assistantReply = await fetchAssistantReply(message);
    addMessage("ai", assistantReply);
  } catch (error) {
    // Friendly fallback if URL is still placeholder or worker is offline
    addMessage(
      "ai",
      "I could not reach the assistant yet. Add your class Worker URL in script.js and try again.",
    );
  }
});
