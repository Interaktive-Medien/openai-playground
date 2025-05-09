// OpenAI Transcription Demo - JavaScript
// This script handles audio transcription using the OpenAI API

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
 * Show the transcription result
 */
function showResult(text) {
  const resultSection = document.getElementById("resultSection");
  const transcriptionResult = document.getElementById("transcriptionResult");

  transcriptionResult.textContent = text;
  resultSection.style.display = "block";

  // Set up copy button
  const copyBtn = document.getElementById("copyBtn");
  copyBtn.onclick = () => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = "Copied!";
        setTimeout(() => {
          copyBtn.textContent = originalText;
        }, 2000);
      })
      .catch((err) => {
        console.error("Failed to copy:", err);
        showError("Failed to copy to clipboard");
      });
  };
}

/**
 * Set loading state of the transcribe button
 */
function setLoading(isLoading) {
  const button = document.querySelector('button[type="submit"]');
  const spinner = button.querySelector(".loading-spinner");

  button.disabled = isLoading;
  spinner.style.display = isLoading ? "block" : "none";
}

/**
 * Transcribe audio using the OpenAI API
 */
async function transcribeAudio(file, model, prompt, includeTimestamps) {
  const apiKey = localStorage.getItem("openai_api_key");
  if (!apiKey) {
    throw new Error(
      "No API key found! Please go back to the main page and set your API key."
    );
  }

  // Create form data
  const formData = new FormData();
  formData.append("file", file);
  formData.append("model", model);

  if (prompt) {
    formData.append("prompt", prompt);
  }

  // Add response format and timestamps for Whisper-1
  if (model === "whisper-1" && includeTimestamps) {
    formData.append("response_format", "verbose_json");
    formData.append("timestamp_granularities[]", "word");
  }

  // Log request details (excluding file contents for brevity)
  console.log("Transcription Request Details:");
  console.log("URL:", "https://api.openai.com/v1/audio/transcriptions");
  console.log("Headers:", {
    Authorization: "Bearer " + apiKey.substring(0, 10) + "...",
  });
  console.log("FormData keys:", Array.from(formData.keys()));
  console.log("File details:", {
    name: file.name,
    type: file.type,
    size: Math.round(file.size / 1024) + " KB",
  });

  try {
    const response = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: formData,
      }
    );

    const data = await response.json();

    // Log response details
    console.log("API Response:", {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      data: data,
    });

    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to transcribe audio");
    }

    // Handle different response formats
    if (model === "whisper-1" && includeTimestamps) {
      // Format timestamped result
      const words = data.words.map(
        (w) => `[${formatTime(w.start)} -> ${formatTime(w.end)}] ${w.word}`
      );
      return words.join("\n");
    } else {
      return data.text;
    }
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}

/**
 * Format time in seconds to MM:SS.mmm
 */
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${remainingSeconds
    .toFixed(3)
    .padStart(6, "0")}`;
}

let mediaRecorder = null;
let recordedChunks = [];
let recordingStartTime = null;
let recordingTimer = null;

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;
}

function updateRecordingTime() {
  if (!recordingStartTime) return;
  const duration = Date.now() - recordingStartTime;
  document.getElementById("recordingTime").textContent =
    formatDuration(duration);
}

function startRecording() {
  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((stream) => {
      mediaRecorder = new MediaRecorder(stream);
      recordedChunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: "audio/webm" });
        const audioUrl = URL.createObjectURL(blob);

        // Show audio preview
        const audioPreview = document.querySelector(".audio-preview");
        audioPreview.style.display = "block";
        const audio = audioPreview.querySelector("audio");
        audio.src = audioUrl;

        // Clean up stream tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      // Start recording
      mediaRecorder.start();
      recordingStartTime = Date.now();
      recordingTimer = setInterval(updateRecordingTime, 1000);

      // Update UI
      const recordButton = document.querySelector(".record-button");
      recordButton.classList.add("recording");
      recordButton.innerHTML =
        '<span class="record-icon"></span>Stop Recording';

      document.querySelector(".recording-status").style.display = "flex";
    })
    .catch((error) => {
      console.error("Error accessing microphone:", error);
      showError(
        "Could not access microphone. Please ensure you have granted permission."
      );
    });
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
    clearInterval(recordingTimer);
    recordingStartTime = null;

    // Update UI
    const recordButton = document.querySelector(".record-button");
    recordButton.classList.remove("recording");
    recordButton.innerHTML = '<span class="record-icon"></span>Record Audio';

    document.querySelector(".recording-status").style.display = "none";
  }
}

function useRecording() {
  const blob = new Blob(recordedChunks, { type: "audio/webm" });
  const file = new File([blob], "recording.webm", { type: "audio/webm" });

  // Create a new FileList containing the recorded file
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);

  // Update the file input
  const fileInput = document.querySelector('input[type="file"]');
  fileInput.files = dataTransfer.files;

  // Hide the preview
  document.querySelector(".audio-preview").style.display = "none";

  // Clear recorded chunks
  recordedChunks = [];
}

function discardRecording() {
  // Clear recorded data
  recordedChunks = [];

  // Hide the preview
  document.querySelector(".audio-preview").style.display = "none";
}

/**
 * Main function to set up the page
 */
function main() {
  const transcribeForm = document.getElementById("transcribeForm");
  const modelSelect = document.getElementById("model");
  const timestampsCheckbox = document.getElementById("timestamps");

  // Enable/disable timestamps checkbox based on model
  modelSelect.addEventListener("change", () => {
    const isWhisper = modelSelect.value === "whisper-1";
    timestampsCheckbox.disabled = !isWhisper;
    if (!isWhisper) {
      timestampsCheckbox.checked = false;
    }
  });

  // Set up form submission
  transcribeForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideError();
    setLoading(true);

    try {
      const file = document.getElementById("audioFile").files[0];
      const model = document.getElementById("model").value;
      const prompt = document.getElementById("prompt").value.trim();
      const includeTimestamps = document.getElementById("timestamps").checked;

      // Validate file size (25MB limit)
      const maxSize = 25 * 1024 * 1024; // 25MB in bytes
      if (file.size > maxSize) {
        throw new Error("File size exceeds 25MB limit");
      }

      const text = await transcribeAudio(
        file,
        model,
        prompt,
        includeTimestamps
      );
      showResult(text);
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  });

  // Add event listeners for recording
  const recordButton = document.querySelector(".record-button");
  recordButton.addEventListener("click", () => {
    if (!mediaRecorder || mediaRecorder.state === "inactive") {
      startRecording();
    } else {
      stopRecording();
    }
  });

  // Add event listeners for the preview buttons
  document
    .querySelector(".use-recording-button")
    .addEventListener("click", useRecording);
  document
    .querySelector(".discard-recording-button")
    .addEventListener("click", discardRecording);

  // Hide audio preview initially
  document.querySelector(".audio-preview").style.display = "none";
  document.querySelector(".recording-status").style.display = "none";
}

// Run main() when the page is loaded
window.addEventListener("DOMContentLoaded", main);
