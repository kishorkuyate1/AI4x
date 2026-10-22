const $ = (sel) => document.querySelector(sel);

const fields = {
  jira_domain: $("#jira_domain"),
  jira_email: $("#jira_email"),
  jira_api_token: $("#jira_api_token"),
  groq_api_key: $("#groq_api_key"),
  groq_model: $("#groq_model"),
  default_jira_key: $("#default_jira_key"),
};

const jiraStatus = $("#jira-status");
const groqStatus = $("#groq-status");
const saveStatus = $("#save-status");

function setPill(el, text, kind) {
  el.textContent = text;
  el.className = `status-pill ${kind}`;
  if (!text) el.classList.add("hidden");
  else el.classList.remove("hidden");
}

async function loadSettings() {
  try {
    const r = await fetch("/api/settings");
    const j = await r.json();
    fields.jira_domain.value = j.jira_domain || "";
    fields.jira_email.value = j.jira_email || "";
    fields.groq_model.value = j.groq_model || "openai/gpt-oss-120b";
    fields.default_jira_key.value = j.default_jira_key || "";
    // tokens are write-only; show placeholder if set
    fields.jira_api_token.placeholder = j.jira_api_token_set ? "(set — leave blank to keep)" : "••••••••";
    fields.groq_api_key.placeholder = j.groq_api_key_set ? "(set — leave blank to keep)" : "••••••••";
  } catch (e) {
    console.error(e);
  }
}

async function saveSettings() {
  setPill(saveStatus, "Saving…", "info");
  const payload = {
    schema_version: "1.0.0",
    jira_domain: fields.jira_domain.value.trim() || null,
    jira_email: fields.jira_email.value.trim() || null,
    jira_api_token: fields.jira_api_token.value || null,
    groq_api_key: fields.groq_api_key.value || null,
    groq_model: fields.groq_model.value.trim() || null,
    default_jira_key: fields.default_jira_key.value.trim() || null,
  };
  try {
    const r = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const j = await r.json();
    if (!r.ok || !j.ok) {
      setPill(saveStatus, `❌ ${j.message || "save failed"}`, "error");
      return;
    }
    setPill(saveStatus, "✓ Saved.", "success");
    // clear token fields to avoid accidental overwrites next time
    fields.jira_api_token.value = "";
    fields.groq_api_key.value = "";
    await loadSettings();
  } catch (e) {
    setPill(saveStatus, `❌ ${e}`, "error");
  }
}

async function testJira() {
  setPill(jiraStatus, "Testing…", "info");
  try {
    const r = await fetch("/api/test-connection/jira", { method: "POST" });
    const j = await r.json();
    setPill(jiraStatus, j.ok ? `✓ ${j.message}` : `❌ ${j.message}`, j.ok ? "success" : "error");
  } catch (e) {
    setPill(jiraStatus, `❌ ${e}`, "error");
  }
}

async function testGroq() {
  setPill(groqStatus, "Testing…", "info");
  try {
    const r = await fetch("/api/test-connection/groq", { method: "POST" });
    const j = await r.json();
    setPill(groqStatus, j.ok ? `✓ ${j.message}` : `❌ ${j.message}`, j.ok ? "success" : "error");
  } catch (e) {
    setPill(groqStatus, `❌ ${e}`, "error");
  }
}

$("#save-btn").addEventListener("click", saveSettings);
$("#test-jira").addEventListener("click", testJira);
$("#test-groq").addEventListener("click", testGroq);

loadSettings();