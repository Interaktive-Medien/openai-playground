// Check for API key on page load
document.addEventListener("DOMContentLoaded", checkApiKey);

function checkApiKey() {
  const apiKey = localStorage.getItem("openai_api_key");
  const noKeyState = document.getElementById("noKeyState");
  const keyExistsState = document.getElementById("keyExistsState");
  const statusElement = document.getElementById("apiKeyStatus");

  if (apiKey) {
    noKeyState.style.display = "none";
    keyExistsState.style.display = "flex";
    statusElement.className = "status";
    statusElement.style.display = "none";
  } else {
    noKeyState.style.display = "flex";
    keyExistsState.style.display = "none";
    statusElement.className = "status";
    statusElement.style.display = "none";
  }
}

async function saveApiKey() {
  const apiKeyInput = document.getElementById("apiKey");
  const apiKey = apiKeyInput.value.trim();
  const statusElement = document.getElementById("apiKeyStatus");

  if (!apiKey) {
    showStatus("Please enter an API key", "error");
    return;
  }

  if (!apiKey.startsWith("sk-") || apiKey.length < 34) {
    showStatus(
      'Invalid API key format. It should start with "sk-" followed by at least 32 characters',
      "error"
    );
    return;
  }

  // Test the API key with a simple chat completion request
  try {
    showStatus("Testing API key...", "info");
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "Say 'API key is valid'" }],
        max_tokens: 10,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Invalid API key");
    }

    // If we get here, the API key is valid
    localStorage.setItem("openai_api_key", apiKey);
    apiKeyInput.value = "";
    showStatus("API key verified and saved successfully", "success");
    checkApiKey();
  } catch (error) {
    showStatus(`API key validation failed: ${error.message}`, "error");
  }
}

function deleteApiKey() {
  localStorage.removeItem("openai_api_key");
  showStatus("API key deleted", "success");
  checkApiKey();
}

function showStatus(message, type) {
  const statusElement = document.getElementById("apiKeyStatus");
  statusElement.textContent = message;
  statusElement.className = `status ${type}`;
  statusElement.style.display = "block";

  // Don't auto-hide error messages
  if (type !== "error") {
    setTimeout(() => {
      statusElement.style.display = "none";
    }, 3000);
  }
}
