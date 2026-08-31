(function () {
  const promptEl = document.getElementById("prompt");
  const buildBtn = document.getElementById("build");
  const errorEl = document.getElementById("error");
  const anvilEl = document.getElementById("anvil");
  const emptyEl = document.getElementById("empty");
  const previewEl = document.getElementById("preview");
  const codeViewEl = document.getElementById("code-view");
  const codeTextEl = document.getElementById("code-text");
  const downloadBtn = document.getElementById("download");
  const stockListEl = document.getElementById("stock-list");
  const tabs = document.querySelectorAll(".tab");

  let currentCode = "";

  function showError(message) {
    errorEl.textContent = message;
    errorEl.hidden = false;
  }
  function clearError() {
    errorEl.hidden = true;
    errorEl.textContent = "";
  }

  function setTab(name) {
    tabs.forEach((t) => t.classList.toggle("active", t.dataset.tab === name));
    const isCode = name === "code";
    codeViewEl.hidden = !isCode;
    previewEl.hidden = isCode;
  }
  tabs.forEach((t) => t.addEventListener("click", () => setTab(t.dataset.tab)));

  function renderCode(code) {
    currentCode = code;
    previewEl.srcdoc = code;
    codeTextEl.textContent = code;
    anvilEl.hidden = false;
    emptyEl.hidden = true;
    setTab("preview");
  }

  function build(promptText) {
    clearError();
    const recipe = matchRecipe(promptText);
    if (!recipe) {
      showError(
        "No blueprint matches that yet. Try one from the list below, or use words closer to those labels."
      );
      return;
    }
    const code = recipe.build(promptText);
    renderCode(code);
  }

  buildBtn.addEventListener("click", () => {
    const promptText = promptEl.value.trim();
    if (!promptText) {
      showError("Describe what you want made first.");
      return;
    }
    build(promptText);
  });

  promptEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) buildBtn.click();
  });

  function renderStockList() {
    stockListEl.innerHTML = "";
    RECIPES.forEach((recipe) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "stock";
      btn.innerHTML = '<span class="name">' + recipe.name + "</span> — " + recipe.blurb;
      btn.addEventListener("click", () => {
        promptEl.value = recipe.blurb;
        promptEl.focus();
        build(recipe.blurb);
      });
      stockListEl.appendChild(btn);
    });
  }
  renderStockList();

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
})();
