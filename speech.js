// OpenAI Text-to-Speech Demo - JavaScript
// This script handles text-to-speech conversion using the OpenAI API

/**
 * Show an error message
 */
function showError(message) {
  const errorSection = document.getElementById("errorSection");
  errorSection.textContent = message;
  errorSection.style.display = "block";
}

/**
 * Hide the error message
 */
function hideError() {
  const errorSection = document.getElementById("errorSection");
  errorSection.style.display = "none";
}

/**
 * Show the audio player and set up download
 */
function showAudio(audioBlob, format) {
  const audioSection = document.getElementById("audioSection");
  const audioPlayer = document.getElementById("audioPlayer");
  const downloadBtn = document.getElementById("downloadBtn");

  // Create object URL for the audio blob
  const audioUrl = URL.createObjectURL(audioBlob);
  audioPlayer.src = audioUrl;
  audioSection.style.display = "block";

  // Set up download button
  downloadBtn.onclick = () => {
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = `speech.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
}

/**
 * Set loading state of the generate button
 */
function setLoading(isLoading) {
  const button = document.querySelector('button[type="submit"]');
  const spinner = button.querySelector(".loading-spinner");

  button.disabled = isLoading;
  spinner.style.display = isLoading ? "block" : "none";
}

/**
 * Generate speech using the OpenAI API
 */
async function generateSpeech(text, model, voice, instructions, format) {
  const apiKey = localStorage.getItem("openai_api_key");
  if (!apiKey) {
    throw new Error(
      "No API key found! Please go back to the main page and set your API key."
    );
  }

  // Create request body
  const requestBody = {
    model: model,
    voice: voice,
    input: text,
    response_format: format,
  };

  if (instructions) {
    requestBody.instructions = instructions;
  }

  // Log request details
  console.log("Speech Generation Request Details:");
  console.log("URL:", "https://api.openai.com/v1/audio/speech");
  console.log("Headers:", {
    Authorization: "Bearer " + apiKey.substring(0, 10) + "...",
  });
  console.log("Request body:", requestBody);

  try {
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    // Log response details
    console.log("API Response:", {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Failed to generate speech");
    }

    // Get audio blob from response
    const audioBlob = await response.blob();
    console.log("Received audio blob:", {
      type: audioBlob.type,
      size: Math.round(audioBlob.size / 1024) + " KB",
    });

    return audioBlob;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}

/**
 * Main function to set up the page
 */
function main() {
  const speechForm = document.getElementById("speechForm");

  // Set up form submission
  speechForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideError();
    setLoading(true);

    try {
      const text = document.getElementById("text").value.trim();
      const model = document.getElementById("model").value;
      const voice = document.querySelector('input[name="voice"]:checked').value;
      const instructions = document.getElementById("instructions").value.trim();
      const format = document.getElementById("format").value;

      const audioBlob = await generateSpeech(
        text,
        model,
        voice,
        instructions,
        format
      );
      showAudio(audioBlob, format);
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  });
}

// Run main() when the page is loaded
window.addEventListener("DOMContentLoaded", main);
