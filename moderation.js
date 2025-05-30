// OpenAI Moderation Demo - JavaScript
// This script handles content moderation using the OpenAI API

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
 * Show validation message
 */
function showValidation(message) {
  const validationMessage = document.getElementById("validationMessage");
  validationMessage.textContent = message;
  validationMessage.style.display = "block";
}

/**
 * Hide validation message
 */
function hideValidation() {
  const validationMessage = document.getElementById("validationMessage");
  validationMessage.style.display = "none";
}

/**
 * Show the moderation results
 */
function showResults(response) {
  const resultSection = document.getElementById("resultSection");
  const flaggedStatus = document.getElementById("flaggedStatus");
  const categoriesGrid = document.getElementById("categoriesGrid");
  const scoresGrid = document.getElementById("scoresGrid");

  // Clear previous results
  categoriesGrid.innerHTML = "";
  scoresGrid.innerHTML = "";

  const result = response.results[0];

  // Update flagged status
  flaggedStatus.textContent = result.flagged ? "Flagged" : "Safe";
  flaggedStatus.className = `status-value ${
    result.flagged ? "flagged" : "safe"
  }`;

  // Display categories
  for (const [category, value] of Object.entries(result.categories)) {
    const categoryItem = document.createElement("div");
    categoryItem.className = "category-item";
    categoryItem.innerHTML = `
      <div class="category-name">${formatCategoryName(category)}</div>
      <div class="category-value ${value}">${value}</div>
    `;
    categoriesGrid.appendChild(categoryItem);
  }

  // Display scores
  for (const [category, score] of Object.entries(result.category_scores)) {
    const scoreItem = document.createElement("div");
    scoreItem.className = "score-item";
    scoreItem.innerHTML = `
      <div class="score-name">${formatCategoryName(category)}</div>
      <div class="score-value">${(score * 100).toFixed(1)}%</div>
      <div class="score-bar">
        <div class="score-fill" style="width: ${score * 100}%"></div>
      </div>
    `;
    scoresGrid.appendChild(scoreItem);
  }

  resultSection.style.display = "block";
}

/**
 * Format category name for display
 */
function formatCategoryName(category) {
  return category
    .split("/")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" / ");
}

/**
 * Set loading state of the submit button
 */
function setLoading(isLoading) {
  const button = document.querySelector('button[type="submit"]');
  const spinner = button.querySelector(".loading-spinner");

  button.disabled = isLoading;
  spinner.style.display = isLoading ? "block" : "none";
}

/**
 * Convert image file to base64
 */
function imageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Check content using the OpenAI Moderation API
 */
async function checkContent(text, imageFile, model) {
  const apiKey = localStorage.getItem("openai_api_key");
  if (!apiKey) {
    throw new Error(
      "No API key found! Please go back to the main page and set your API key."
    );
  }

  // Create input array for the API
  const input = [];

  // Add text input if provided
  if (text) {
    input.push({
      type: "text",
      text: text,
    });
  }

  // Add image input if provided
  if (imageFile) {
    const base64Image = await imageToBase64(imageFile);
    input.push({
      type: "image_url",
      image_url: {
        url: base64Image,
      },
    });
  }

  // Create request body
  const requestBody = {
    model: model,
    input: input,
  };

  // Log request details
  console.log("Moderation Request Details:");
  console.log("URL:", "https://api.openai.com/v1/moderations");
  console.log("Headers:", {
    Authorization: "Bearer " + apiKey.substring(0, 10) + "...",
    "Content-Type": "application/json",
  });
  console.log("Request body:", requestBody);

  try {
    const response = await fetch("https://api.openai.com/v1/moderations", {
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
      throw new Error(error.error?.message || "Failed to check content");
    }

    const result = await response.json();
    console.log("Moderation result:", result);

    return result;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}

/**
 * Handle image preview
 */
function setupImagePreview() {
  const imageInput = document.getElementById("image");
  const imagePreview = document.getElementById("imagePreview");
  const previewImg = document.getElementById("previewImg");
  const removeButton = document.getElementById("removeImage");

  imageInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        previewImg.src = e.target.result;
        imagePreview.style.display = "block";
      };
      reader.readAsDataURL(file);
    }
  });

  removeButton.addEventListener("click", () => {
    imageInput.value = "";
    previewImg.src = "";
    imagePreview.style.display = "none";
  });
}

/**
 * Main function to set up the page
 */
function main() {
  const moderationForm = document.getElementById("moderationForm");
  setupImagePreview();

  // Set up form submission
  moderationForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideError();
    hideValidation();

    const text = document.getElementById("text").value.trim();
    const imageFile = document.getElementById("image").files[0];
    const model = document.getElementById("model").value;

    // Validate that at least one input is provided
    if (!text && !imageFile) {
      showValidation(
        "Please provide either text or an image (or both) to analyze."
      );
      return;
    }

    // Validate image input for text-moderation-latest model
    if (model === "text-moderation-latest" && imageFile) {
      showValidation(
        "The Text Moderation model only supports text input. Please switch to Omni Moderation model for image analysis."
      );
      return;
    }

    setLoading(true);

    try {
      const result = await checkContent(text, imageFile, model);
      showResults(result);
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  });
}

// Run main() when the page is loaded
window.addEventListener("DOMContentLoaded", main);
