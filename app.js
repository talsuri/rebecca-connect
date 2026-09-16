// ─────────────────────────────────────────────────────────────────────────
// Configuration
// WEBHOOK_URL : the n8n production webhook for "Becca Connect — Summit Contact Capture".
// API_KEY     : shared secret the workflow checks (X-API-Key header).
//
// Note: this page is static, so API_KEY is visible to anyone who views source.
// It is light deterrence against random bots, not a true secret. Rotate it in the
// workflow's "Validate Request" node + here if it ever gets abused.
// ─────────────────────────────────────────────────────────────────────────
const CONFIG = {
  WEBHOOK_URL: "https://trysuri.app.n8n.cloud/webhook/becca-connect",
  API_KEY: "df771f3787f9b6096f46edc3df8830d8fcdab8aef810574c"
};

const form = document.getElementById("capture-form");
const step2 = document.getElementById("step2");
const status1 = document.getElementById("status1");
const status2 = document.getElementById("status2");
const formBlock = document.getElementById("form-block");

let details = null; // holds step-1 answers until an option is picked in step 2

function setStatus(el, kind, message) {
  el.className = "status " + kind;
  el.textContent = message;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

// Step 1 → validate details, then reveal step 2 (nothing sent yet)
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const company = document.getElementById("company").value.trim();
  const hp = document.getElementById("website").value.trim(); // honeypot — real users leave empty

  if (!name) return setStatus(status1, "error", "Please add your name.");
  if (!isValidEmail(email)) return setStatus(status1, "error", "Please enter a valid email.");
  if (!company) return setStatus(status1, "error", "Please add your company.");

  details = { name, email, company, hp };
  form.hidden = true;
  step2.hidden = false;
});

// Step 2 → picking an option submits everything
step2.querySelectorAll(".btn-option").forEach((btn) => {
  btn.addEventListener("click", () => submitAll(btn.getAttribute("data-interest")));
});

async function submitAll(interest) {
  const opts = step2.querySelectorAll(".btn-option");
  opts.forEach((b) => (b.disabled = true));
  setStatus(status2, "pending", "Sending…");

  try {
    const res = await fetch(CONFIG.WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": CONFIG.API_KEY
      },
      body: JSON.stringify({ ...details, interest })
    });

    if (!res.ok) {
      let msg = "Something went wrong — please try again.";
      try {
        const payload = await res.json();
        if (payload && payload.error) msg = payload.error;
      } catch (_) { /* keep default */ }
      setStatus(status2, "error", msg);
      opts.forEach((b) => (b.disabled = false));
      return;
    }

    showSuccess();
  } catch (err) {
    setStatus(status2, "error", "Network error — check your connection and try again.");
    opts.forEach((b) => (b.disabled = false));
  }
}

// Replace the whole form block with a spare confirmation.
function showSuccess() {
  formBlock.classList.add("done");
  formBlock.innerHTML = '<h2 class="headline">Thanks.</h2>';
}
