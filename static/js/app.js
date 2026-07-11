// History is stored in the browser's localStorage (per device/browser),
// since Vercel's serverless backend has no persistent filesystem.
const HISTORY_KEY = "aiImageEditorHistory";

const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("file-input");
const previewBox = document.getElementById("preview-box");
const resultBox = document.getElementById("result-box");
const applyBtn = document.getElementById("apply-btn");
const downloadBtn = document.getElementById("download-btn");
const filterOptions = document.querySelectorAll('input[name="filter"]');
const brightnessSlider = document.getElementById("brightness-slider");
const contrastSlider = document.getElementById("contrast-slider");
const brightnessVal = document.getElementById("brightness-val");
const contrastVal = document.getElementById("contrast-val");
const historyGrid = document.getElementById("history-grid");
const historyEmpty = document.getElementById("history-empty");

let selectedFile = null;
let selectedFilter = "grayscale";
let resultDataUrl = null;

dropzone.addEventListener("click", () => fileInput.click());
dropzone.addEventListener("dragover", (e) => { e.preventDefault(); dropzone.classList.add("dragover"); });
dropzone.addEventListener("dragleave", () => dropzone.classList.remove("dragover"));
dropzone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropzone.classList.remove("dragover");
  if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener("change", () => {
  if (fileInput.files.length) handleFile(fileInput.files[0]);
});

function handleFile(file) {
  if (!file.type.startsWith("image/")) { showToast("Please choose an image file.", "error"); return; }
  selectedFile = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    previewBox.querySelector(".frame-inner").innerHTML = `<img src="${e.target.result}" alt="Preview">`;
  };
  reader.readAsDataURL(file);
  applyBtn.disabled = false;
}

filterOptions.forEach((input) => {
  input.addEventListener("change", () => {
    selectedFilter = input.value;
    document.querySelectorAll(".filter-option").forEach((el) => el.classList.remove("selected"));
    input.closest(".filter-option").classList.add("selected");
  });
});

brightnessSlider.addEventListener("input", () => brightnessVal.textContent = brightnessSlider.value);
contrastSlider.addEventListener("input", () => contrastVal.textContent = contrastSlider.value);

applyBtn.addEventListener("click", async () => {
  if (!selectedFile) { showToast("Choose an image first.", "error"); return; }

  applyBtn.disabled = true;
  applyBtn.textContent = "Processing...";
  resultBox.querySelector(".frame-inner").innerHTML = `<div class="spinner"></div>`;

  const formData = new FormData();
  formData.append("image", selectedFile);
  formData.append("filter", selectedFilter);
  formData.append("brightness", brightnessSlider.value);
  formData.append("contrast", contrastSlider.value);

  try {
    const response = await fetch("/apply", { method: "POST", body: formData });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Server responded ${response.status}`);
    }
    const blob = await response.blob();
    resultDataUrl = await blobToDataUrl(blob);
    resultBox.querySelector(".frame-inner").innerHTML = `<img src="${resultDataUrl}" alt="Edited result">`;
    downloadBtn.disabled = false;
    showToast("Filter applied.", "success");
    addToHistory(resultDataUrl, selectedFilter);
  } catch (err) {
    resultBox.querySelector(".frame-inner").innerHTML = `<p class="preview-placeholder">Something went wrong. Try again.</p>`;
    showToast(err.message || "Couldn't process that image.", "error");
  } finally {
    applyBtn.disabled = false;
    applyBtn.textContent = "Apply";
  }
});

downloadBtn.addEventListener("click", () => {
  if (!resultDataUrl) return;
  const a = document.createElement("a");
  a.href = resultDataUrl;
  a.download = `edited-${selectedFilter}-${Date.now()}.png`;
  a.click();
});

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/* ---------- localStorage-backed history ---------- */
function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch {
    return [];
  }
}

function addToHistory(dataUrl, filterName) {
  const items = getHistory();
  items.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    dataUrl,
    filter: filterName,
    date: new Date().toLocaleString()
  });
  // Keep localStorage from growing unbounded (images are base64, so they're large)
  const trimmed = items.slice(0, 20);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
  } catch (e) {
    // Storage quota exceeded — drop the oldest half and retry once
    const smaller = trimmed.slice(0, 10);
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(smaller)); } catch {}
  }
  renderHistory();
}

function deleteFromHistory(id) {
  const items = getHistory().filter((item) => item.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
  renderHistory();
}

function renderHistory() {
  const items = getHistory();

  if (!items.length) {
    historyGrid.style.display = "none";
    historyEmpty.style.display = "block";
    return;
  }

  historyGrid.style.display = "grid";
  historyEmpty.style.display = "none";
  historyGrid.innerHTML = "";

  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "history-card";
    card.innerHTML = `
      <div class="thumb"><img src="${item.dataUrl}" alt="${item.filter}" loading="lazy"></div>
      <div class="meta">
        <span class="filter-tag mono">${item.filter}</span>
        <span class="date">${item.date}</span>
      </div>
      <div class="actions">
        <button class="download-item">Download</button>
        <button class="delete">Delete</button>
      </div>
    `;
    card.querySelector(".download-item").addEventListener("click", () => {
      const a = document.createElement("a");
      a.href = item.dataUrl;
      a.download = `${item.filter}-${item.id}.png`;
      a.click();
    });
    card.querySelector(".delete").addEventListener("click", () => {
      if (!confirm("Delete this edited image?")) return;
      deleteFromHistory(item.id);
    });
    historyGrid.appendChild(card);
  });
}

function showToast(message, type = "success") {
  const stack = document.getElementById("toast-stack");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  stack.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

renderHistory();
