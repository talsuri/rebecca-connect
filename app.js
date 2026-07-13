// ─────────────────────────────────────────────────────────────────────────
// Configuration
// WEBHOOK_URL : the n8n production webhook for "SURI Connect — Summit Contact Capture".
// API_KEY     : shared secret the workflow checks (X-API-Key header).
//
// Note: this page is static, so API_KEY is visible to anyone who views source.
// It is light deterrence against random bots, not a true secret — the page URL
// is meant to be handed out at the summit. Rotate it in the workflow's
// "Validate Request" node + here if it ever gets abused.
// ─────────────────────────────────────────────────────────────────────────
const CONFIG = {
  WEBHOOK_URL: "https://trysuri.app.n8n.cloud/webhook/becca-connect",
  API_KEY: "df771f3787f9b6096f46edc3df8830d8fcdab8aef810574c"
};

const form = document.getElementById("capture-form");
const statusEl = document.getElementById("status");
const submitBtn = document.getElementById("submit-btn");

function setStatus(kind, message) {
  statusEl.className = "status " + kind;
  statusEl.textContent = message;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const hp = document.getElementById("website").value.trim(); // honeypot — real users leave this empty

  if (!isValidEmail(email)) return setStatus("error", "Please enter a valid email.");

  submitBtn.disabled = true;
  setStatus("pending", "Sending…");

  try {
    const res = await fetch(CONFIG.WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": CONFIG.API_KEY
      },
      body: JSON.stringify({ email, hp })
    });

    if (!res.ok) {
      let msg = "Something went wrong — please try again.";
      try {
        const payload = await res.json();
        if (payload && payload.error) msg = payload.error;
      } catch (_) { /* keep default */ }
      setStatus("error", msg);
      submitBtn.disabled = false;
      return;
    }

    showSuccess();
  } catch (err) {
    setStatus("error", "Network error — check your connection and try again.");
    submitBtn.disabled = false;
  }
});

// Replace the form block with a spare confirmation.
function showSuccess() {
  const section = form.closest(".block");
  section.classList.add("done");
  section.innerHTML = '<h2 class="headline">Thanks.</h2>';
}
