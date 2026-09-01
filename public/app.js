const promptEl = document.getElementById("prompt");
const generateBtn = document.getElementById("generate");
const errorEl = document.getElementById("error");
const resultEl = document.getElementById("result");
const emptyStateEl = document.getElementById("empty-state");
const previewEl = document.getElementById("preview");
const codeViewEl = document.getElementById("code-view");
const codeTextEl = document.getElementById("code-text");
const downloadBtn = document.getElementById("download");
const loadingEl = document.getElementById("loading");
const loadingTextEl = document.getElementById("loading-text");
const refineBox = document.getElementById("refine-box");
const refineInput = document.getElementById("refine");
const refineBtn = document.getElementById("refine-btn");
const examplesEl = document.getElementById("examples");
const tabs = document.querySelectorAll(".tab");

let currentCode = "";

function setLoading(isLoading, text) {
  loadingEl.hidden = !isLoading;
  loadingTextEl.textContent = text || "Kova is building it…";
  generateBtn.disabled = isLoading;
  refineBtn.disabled = isLoading;
}

function showError(message) {
  errorEl.textContent = message;
  errorEl.hidden = false;
}

function clearError() {
  errorEl.hidden = true;
  errorEl.textContent = "";
}

function renderCode(code) {
  currentCode = code;
  previewEl.srcdoc = code;
  codeTextEl.textContent = code;
  resultEl.hidden = false;
  emptyStateEl.hidden = true;
  refineBox.hidden = false;
}

async function generate({ prompt, previousCode }) {
  clearError();
  setLoading(true, previousCode ? "Kova is updating it…" : "Kova is building it…");
  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, previousCode }),
    });
    const data = await res.json();
    if (!res.ok) {
      showError(data.error || "Something went wrong.");
      return;
    }
    renderCode(data.code);
  } catch (err) {
    showError("Couldn't reach the server. Check your connection and try again.");
  } finally {
    setLoading(false);
  }
}

generateBtn.addEventListener("click", () => {
  const prompt = promptEl.value.trim();
  if (!prompt) {
    showError("Describe what you want to make first.");
    return;
  }
  generate({ prompt });
});

refineBtn.addEventListener("click", () => {
  const prompt = refineInput.value.trim();
  if (!prompt) {
    showError("Describe the change you want first.");
    return;
  }
  generate({ prompt, previousCode: currentCode }).then(() => {
    refineInput.value = "";
  });
});

promptEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
    generateBtn.click();
  }
});

refineInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    refineBtn.click();
  }
});

examplesEl.addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  promptEl.value = chip.textContent;
  promptEl.focus();
});

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    const isCode = tab.dataset.tab === "code";
    codeViewEl.hidden = !isCode;
    previewEl.hidden = isCode;
  });
});

downloadBtn.addEventListener("click", () => {
  if (!currentCode) return;
  const blob = new Blob([currentCode], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "kova-app.html";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});
