/* Grab key elements from the page */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const latestQuestionCard = document.getElementById("latestQuestionCard");
const latestQuestionText = document.getElementById("latestQuestionText");

/* Class Cloudflare Worker URL for chatbot requests */
const WORKER_URL = "https://late-shape-cd78.david-negrete.workers.dev";

/* Keep the full conversation so the assistant can answer follow-up questions. */
const conversationHistory = [
  {
    role: "system",
    content:
      "You are a L'Oreal beauty assistant. Only answer questions about L'Oreal products, beauty routines, skincare, makeup, haircare, fragrance, and product recommendations. Assume the user is in the United States unless they say otherwise, and give location-sensitive advice using U.S. products, stores, and conventions. If a question is unrelated, politely refuse and redirect the user to L'Oreal or beauty topics. Remember useful details the user shares so you can respond naturally across multiple turns.",
  },
];

/* Add one message bubble to the chat window */
function addMessage(role, text) {
  const messageRow = document.createElement("div");
  messageRow.classList.add("msg", role);

  const label = document.createElement("p");
  label.classList.add("msg-label");
  label.textContent = role === "user" ? "You" : "Beauty Advisor";

  const bubble = document.createElement("p");
  bubble.classList.add("msg-bubble");
  bubble.textContent = text;

  messageRow.appendChild(label);
  messageRow.appendChild(bubble);
  chatWindow.appendChild(messageRow);

  // Keep newest message visible
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* Show the newest user question above the reply area. */
function updateLatestQuestion(question) {
  latestQuestionText.textContent = question;
  latestQuestionCard.hidden = false;
}

/* Show the first assistant greeting */
addMessage("ai", "Hello! Ask me about products or beauty routines.");

/* Send message to the class Cloudflare Worker */
async function fetchAssistantReply(messages) {
  const response = await fetch(WORKER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages,
    }),
  });

  const responseText = await response.text();
  let data;

  try {
    data = JSON.parse(responseText);
  } catch (error) {
    throw new Error("The Worker returned an invalid response.");
  }

  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }

  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error("The assistant response was incomplete.");
  }

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
  updateLatestQuestion(message);
  userInput.value = "";
  conversationHistory.push({
    role: "user",
    content: message,
  });

  try {
    const assistantReply = await fetchAssistantReply(conversationHistory);
    conversationHistory.push({
      role: "assistant",
      content: assistantReply,
    });
    addMessage("ai", assistantReply);
  } catch (error) {
    // Remove the latest user turn if the Worker could not answer it.
    conversationHistory.pop();

    // Show the Worker error so it is easier to debug deployment problems.
    addMessage(
      "ai",
      error.message ||
        "I could not reach the assistant right now. Please try again in a moment.",
    );
  }
});
