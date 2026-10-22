const $ = (sel) => document.querySelector(sel);

const promptEl = $("#prompt");
const useGroqEl = $("#use-groq");
const runBtn = $("#run-btn");
const statusEl = $("#status");
const resultCard = $("#result");
const resultMd = $("#result-md");
const resultJson = $("#result-json");
const metaEl = $("#meta");
const downloadMd = $("#download-md");
const downloadJson = $("#download-json");
const groqModelLabel = $("#groq-model");

let currentResult = null;

function setStatus(msg, kind = "info") {
  statusEl.className = `status ${kind}`;
  statusEl.textContent = msg;
  statusEl.classList.remove("hidden");
}

function clearStatus() { statusEl.classList.add("hidden"); }

function setTab(name) {
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === name));
  resultMd.classList.toggle("hidden", name !== "md");
  resultJson.classList.toggle("hidden", name !== "json");
}

async function loadHealth() {
  try {
    const r = await fetch("/api/health");
    const j = await r.json();
    groqModelLabel.textContent = j.groq_model || "openai/gpt-oss-120b";
    if (!j.jira_configured) {
      setStatus("⚠ Jira is not configured yet. Open Settings to add credentials.", "warn");
    }
  } catch (e) {
    setStatus(`Health check failed: ${e}`, "error");
  }
}

async function runGenerate() {
  const prompt = promptEl.value.trim();
  if (!prompt) {
    setStatus("Please enter a prompt containing a Jira key (e.g. PROJ-123).", "warn");
    return;
  }
  runBtn.disabled = true;
  setStatus("Fetching Jira issue and generating Test Plan…", "info");

  try {
    const resp = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, use_groq: useGroqEl.checked }),
    });

    const body = await resp.json();
    if (!resp.ok) {
      setStatus(`❌ ${body.message || body.error_code || "Request failed"}`, "error");
      return;
    }

    currentResult = body;
    resultMd.textContent = body.markdown;
    resultJson.textContent = JSON.stringify(body.json, null, 2);
    setTab("md");
    resultCard.classList.remove("hidden");

    let meta = `Issue: <code>${body.issue_key}</code> · Markdown: <code>${body.markdown_path}</code> · JSON: <code>${body.json_path}</code>`;
    if (body.groq_used) meta += " · GROQ: ✓";
    if (body.groq_warning) meta += ` · ⚠ ${body.groq_warning}`;
    metaEl.innerHTML = meta;

    setStatus("✓ Test Plan generated.", "success");
  } catch (e) {
    setStatus(`Network error: ${e}`, "error");
  } finally {
    runBtn.disabled = false;
  }
}

function download(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

document.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => setTab(t.dataset.tab)));

runBtn.addEventListener("click", runGenerate);

downloadMd.addEventListener("click", () => {
  if (!currentResult) return;
  download(currentResult.markdown_path.split("/").pop(), currentResult.markdown, "text/markdown");
});

downloadJson.addEventListener("click", () => {
  if (!currentResult) return;
  const fn = currentResult.json_path.split("/").pop();
  download(fn, JSON.stringify(currentResult.json, null, 2), "application/json");
});

promptEl.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") runGenerate();
});

loadHealth();