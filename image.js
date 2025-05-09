// OpenAI Image Generation Demo - JavaScript
// This script handles image generation using the OpenAI API

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
 * Show the result section with the generated image
 */
function showResult(imageUrl, format = "png") {
  const resultSection = document.getElementById("resultSection");
  const imageResult = document.getElementById("imageResult");
  const downloadBtn = document.getElementById("downloadBtn");

  // Create image element
  const img = document.createElement("img");
  img.src = imageUrl;
  imageResult.innerHTML = "";
  imageResult.appendChild(img);

  // Set up download button
  downloadBtn.onclick = () => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `generated-image.${format}`;
    link.click();
  };

  resultSection.style.display = "block";
}

/**
 * Generate an image using the OpenAI API
 */
async function generateImage(
  prompt,
  model,
  size,
  quality,
  format,
  transparent
) {
  const apiKey = localStorage.getItem("openai_api_key");
  if (!apiKey) {
    throw new Error(
      "No API key found! Please go back to the main page and set your API key."
    );
  }

  // Create request body with only supported parameters
  const requestBody = {
    model,
    prompt,
    n: 1,
    size,
    ...(quality === "high" && { quality: "hd" }), // Only send if high quality is selected
  };

  // Log request details
  console.log("API Request Details:");
  console.log("URL:", "https://api.openai.com/v1/images/generations");
  console.log("Headers:", {
    "Content-Type": "application/json",
    Authorization: "Bearer " + apiKey.substring(0, 10) + "...",
  });
  console.log("Request Body:", requestBody);

  try {
    const response = await fetch(
      "https://api.openai.com/v1/images/generations",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
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
      throw new Error(data.error?.message || "Failed to generate image");
    }

    return data.data[0].url;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
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
 * Main function to set up the page
 */
function main() {
  // Set up generate form
  const generateForm = document.getElementById("generateForm");
  generateForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideError();
    setLoading(true);

    try {
      const prompt = document.getElementById("genPrompt").value;
      const model = document.getElementById("genModel").value;
      const size = document.getElementById("size").value;
      const quality = document.getElementById("quality").value;
      const format = document.getElementById("format").value;
      const transparent = document.getElementById("transparent").checked;

      const imageUrl = await generateImage(
        prompt,
        model,
        size,
        quality,
        format,
        transparent
      );
      showResult(imageUrl, format);
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  });
}

// Run main() when the page is loaded
window.addEventListener("DOMContentLoaded", main);
