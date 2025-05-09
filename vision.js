// OpenAI Vision Demo - JavaScript
// This script lets users upload an image and analyze it with OpenAI's vision models.
// It uses best practices and is well-commented for students.

/**
 * Utility function to convert an image file to a Base64 data URL.
 * Returns a Promise that resolves to the data URL string.
 */
function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Show an error message in the UI.
 */
function showError(message) {
  const errorSection = document.getElementById("errorSection");
  errorSection.textContent = message;
  errorSection.style.display = "block";
}

/**
 * Hide the error message.
 */
function hideError() {
  const errorSection = document.getElementById("errorSection");
  errorSection.style.display = "none";
}

/**
 * Show the analysis result and image preview.
 */
function showResult(imageDataUrl, resultText) {
  const resultSection = document.getElementById("resultSection");
  const imagePreview = document.getElementById("imagePreview");
  const analysisResult = document.getElementById("analysisResult");
  imagePreview.innerHTML = `<img src="${imageDataUrl}" alt="Uploaded image" style="max-width: 100%; max-height: 300px; border-radius: 8px;" />`;
  analysisResult.textContent = resultText;
  resultSection.style.display = "block";
}

/**
 * Hide the result section.
 */
function hideResult() {
  const resultSection = document.getElementById("resultSection");
  resultSection.style.display = "none";
}

/**
 * Main function to set up event listeners and handle the form.
 */
function main() {
  const form = document.getElementById("visionForm");
  const imageInput = document.getElementById("imageInput");
  const promptInput = document.getElementById("promptInput");
  const modelSelect = document.getElementById("modelSelect");

  // Hide result and error on page load
  hideResult();
  hideError();

  // Handle form submission
  form.addEventListener("submit", async (event) => {
    event.preventDefault(); // Prevent page reload
    hideResult();
    hideError();

    // Get the API key from localStorage
    const apiKey = localStorage.getItem("openai_api_key");
    if (!apiKey) {
      showError(
        "No API key found! Please go back to the main page and set your API key."
      );
      return;
    }

    // Get the selected model
    const model = modelSelect.value;

    // Get the uploaded file
    const file = imageInput.files[0];
    if (!file) {
      showError("Please upload an image file.");
      return;
    }

    // Convert the image to a Base64 data URL
    let dataUrl;
    try {
      dataUrl = await fileToDataURL(file);
    } catch (err) {
      showError("Failed to read the image file.");
      return;
    }

    // Extract the base64 part (remove the data:image/...;base64, prefix)
    const base64Image = dataUrl.split(",")[1];
    const mimeType = file.type;

    // Get the prompt (or use a default)
    const prompt = promptInput.value.trim() || "What is in this image?";

    // Build the API request body
    const requestBody = {
      model: model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
                detail: "high", // You can change to "low" for faster/cheaper analysis
              },
            },
          ],
        },
      ],
    };

    // Debug: Log the request details (without the full base64 string to keep console clean)
    console.log("Debugging API Request:");
    console.log("URL:", "https://api.openai.com/v1/chat/completions");
    console.log("Headers:", {
      "Content-Type": "application/json",
      Authorization: "Bearer sk-...." + apiKey.slice(-4),
    });
    console.log("Request Body:", {
      ...requestBody,
      messages: [
        {
          ...requestBody.messages[0],
          content: [
            requestBody.messages[0].content[0],
            {
              ...requestBody.messages[0].content[1],
              image_url: "(base64 data truncated)",
            },
          ],
        },
      ],
    });

    // Call the OpenAI API
    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      // Debug: Log the full response
      console.log("Response status:", response.status);
      console.log(
        "Response headers:",
        Object.fromEntries(response.headers.entries())
      );

      const data = await response.json();
      console.log("Response body:", data);

      if (data.choices && data.choices[0]) {
        const resultText = data.choices[0].message.content;
        showResult(dataUrl, resultText);
      } else {
        throw new Error(data.error?.message || "No result from API");
      }
    } catch (error) {
      console.error("Detailed error:", error);
      showError("Error calling the API: " + error.message);
    }
  });
}

// Run main() when the page is loaded
window.addEventListener("DOMContentLoaded", main);
