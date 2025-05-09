// Check for saved API key on page load
window.onload = function () {
  const savedApiKey = localStorage.getItem("openai_api_key");
  if (savedApiKey) {
    document.getElementById("apiKey").value = savedApiKey;
    document.getElementById("apiKeyStatus").textContent =
      "API key loaded from storage";
  }
};

function saveApiKey() {
  const apiKey = document.getElementById("apiKey").value;
  if (apiKey) {
    localStorage.setItem("openai_api_key", apiKey);
    document.getElementById("apiKeyStatus").textContent =
      "API key saved successfully!";
  } else {
    document.getElementById("apiKeyStatus").textContent =
      "Please enter an API key";
  }
}
