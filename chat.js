// Chat Demo - Best Practices Version
// This file demonstrates clean JavaScript for interacting with the OpenAI Chat API

// Store the full chat history in a local variable
let messages = [];

/**
 * Render the entire chat history from the messages array.
 * This ensures the UI always matches the data sent to the API.
 */
function renderChat() {
  const chatMessages = document.getElementById("chatMessages");
  chatMessages.innerHTML = "";
  messages.forEach((msg) => {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${msg.role}-message`;
    messageDiv.textContent = msg.content;
    chatMessages.appendChild(messageDiv);
  });
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Handle sending a message: update history, call API, and update UI.
 */
async function sendMessage() {
  const userInput = document.getElementById("userInput");
  const message = userInput.value.trim();
  if (!message) return;

  // Get API key from localStorage
  const apiKey = localStorage.getItem("openai_api_key");
  if (!apiKey) {
    alert(
      "Please save your API key first! Go back to the main page to set it up."
    );
    return;
  }

  // Get selected model from dropdown
  let model = "gpt-4.1";
  const modelSelect = document.getElementById("modelSelect");
  if (modelSelect) {
    model = modelSelect.value;
  }

  // Add user message to history and re-render
  messages.push({ role: "user", content: message });
  renderChat();
  userInput.value = "";

  try {
    // Call the OpenAI API with the full message history
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
      }),
    });

    const data = await response.json();
    if (data.choices && data.choices[0]) {
      const assistantMessage = data.choices[0].message.content;
      messages.push({ role: "assistant", content: assistantMessage });
      renderChat();
    } else {
      throw new Error("Invalid response from API");
    }
  } catch (error) {
    console.error("Error:", error);
    const errorMsg =
      "Sorry, there was an error processing your request. Please check your API key and try again.";
    messages.push({ role: "assistant", content: errorMsg });
    renderChat();
  }
}

/**
 * Handle pressing Enter in the input field.
 * This is attached as an event listener, not inline in HTML.
 */
function handleKeyPress(event) {
  if (event.key === "Enter") {
    sendMessage();
  }
}

/**
 * Show a warning banner if no API key is found in localStorage.
 */
function checkApiKeyWarning() {
  const apiKey = localStorage.getItem("openai_api_key");
  const warningBanner = document.getElementById("apiKeyWarning");
  if (!apiKey && warningBanner) {
    warningBanner.style.display = "block";
  } else if (warningBanner) {
    warningBanner.style.display = "none";
  }
}

/**
 * Main function to set up event listeners and initialize the app.
 */
function main() {
  // Check for API key and show warning if needed
  checkApiKeyWarning();

  // Render chat history (empty at first)
  renderChat();

  // Set up event listeners (best practice: do not use inline handlers)
  const userInput = document.getElementById("userInput");
  if (userInput) {
    userInput.addEventListener("keypress", handleKeyPress);
  }
  const sendButton = document.querySelector(".input-container button");
  if (sendButton) {
    sendButton.addEventListener("click", sendMessage);
  }
}

// Run main() when the page is loaded
window.addEventListener("DOMContentLoaded", main);
