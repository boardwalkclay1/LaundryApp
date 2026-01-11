// app.js

const LaundryApp = (() => {
  const views = {
    signup: document.getElementById("view-signup"),
    connect: document.getElementById("view-connect"),
    session: document.getElementById("view-session"),
  };

  const els = {
    signupForm: document.getElementById("signup-form"),
    roleSelect: document.getElementById("user-role"),
    nameInput: document.getElementById("user-name"),
    emailInput: document.getElementById("user-email"),
    phoneInput: document.getElementById("user-phone"),

    generateCodeBtn: document.getElementById("btn-generate-code"),
    localCodeSpan: document.getElementById("local-code"),
    sendEmailBtn: document.getElementById("btn-send-email"),
    sendSmsBtn: document.getElementById("btn-send-sms"),
    partnerCodeTextarea: document.getElementById("partner-code"),
    connectBtn: document.getElementById("btn-connect"),
    connectStatus: document.getElementById("connect-status"),

    sessionUserSummary: document.getElementById("session-user-summary"),
    sessionRoleSummary: document.getElementById("session-role-summary"),
    sessionCodeSummary: document.getElementById("session-code-summary"),
    resetBtn: document.getElementById("btn-reset"),
  };

  const SESSION_KEY = "lb-session";

  let session = {
    role: "washer",
    name: "",
    email: "",
    phone: "",
    localCode: "",
    connected: false,
  };

  // View switching

  function showView(name) {
    Object.values(views).forEach((v) => v.classList.remove("active"));
    const target = views[name];
    if (target) target.classList.add("active");
  }

  // Session persistence

  function saveSession() {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  function loadSession() {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    try {
      const data = JSON.parse(raw);
      if (!data || !data.email) return false;
      session = { ...session, ...data };
      return true;
    } catch {
      return false;
    }
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
    session = {
      role: "washer",
      name: "",
      email: "",
      phone: "",
      localCode: "",
      connected: false,
    };
  }

  // Utilities

  function generateConnectionCode() {
    // Short, human-pasteable code. This is NOT the full WebRTC SDP yet.
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const chunks = [];
    for (let i = 0; i < 4; i++) {
      let part = "";
      for (let j = 0; j < 4; j++) {
        const idx = Math.floor(Math.random() * alphabet.length);
        part += alphabet[idx];
      }
      chunks.push(part);
    }
    return chunks.join("-");
  }

  function encodeMailto(to, subject, body) {
    const s = encodeURIComponent(subject);
    const b = encodeURIComponent(body);
    return `mailto:${encodeURIComponent(to)}?subject=${s}&body=${b}`;
  }

  function encodeSms(to, body) {
    const b = encodeURIComponent(body);
    // Most platforms support sms:NUMBER?body=TEXT
    return `sms:${encodeURIComponent(to)}?body=${b}`;
  }

  function openLink(url) {
    window.location.href = url;
  }

  // UI updates

  function updateSessionSummary() {
    els.sessionUserSummary.textContent = session.name || "Unknown";
    els.sessionRoleSummary.textContent =
      session.role === "washer" ? "Washer" : "Client";
    els.sessionCodeSummary.textContent = session.localCode || "—";
  }

  function setStatus(message, type = "") {
    els.connectStatus.textContent = message || "";
    els.connectStatus.classList.remove("ok", "error");
    if (type) els.connectStatus.classList.add(type);
  }

  // Events

  function handleSignupSubmit(evt) {
    evt.preventDefault();

    session.role = els.roleSelect.value;
    session.name = els.nameInput.value.trim();
    session.email = els.emailInput.value.trim();
    session.phone = els.phoneInput.value.trim();
    session.connected = false;

    saveSession();
    showView("connect");
  }

  function handleGenerateCode() {
    const code = generateConnectionCode();
    session.localCode = code;
    saveSession();
    els.localCodeSpan.textContent = code;
    setStatus("Share this code with your partner, then paste theirs below.", "ok");
  }

  function handleSendEmail() {
    if (!session.localCode) {
      setStatus("Generate your code first.", "error");
      return;
    }

    const to = prompt(
      "Enter your partner's email address.\n(This is not stored anywhere – just used for this message.)"
    );
    if (!to) return;

    const subject = "Laundry Bubbles connection code";
    const body = `Here is my Laundry Bubbles connection code:\n\n${session.localCode}\n\nPaste this into your Laundry Bubbles app to connect.`;

    const url = encodeMailto(to, subject, body);
    openLink(url);
  }

  function handleSendSms() {
    if (!session.localCode) {
      setStatus("Generate your code first.", "error");
      return;
    }

    const to = prompt(
      "Enter your partner's phone number.\nYour SMS app will open with the code pre-filled."
    );
    if (!to) return;

    const body = `Laundry Bubbles code: ${session.localCode}\nPaste this into the app to connect.`;
    const url = encodeSms(to, body);
    openLink(url);
  }

  function handleConnect() {
    const partnerCode = els.partnerCodeTextarea.value.trim();
    if (!partnerCode) {
      setStatus("Paste your partner's code first.", "error");
      return;
    }

    if (!session.localCode) {
      setStatus("Generate your own code first.", "error");
      return;
    }

    // For now, we just treat this as "both sides agreed to connect".
    // Later you can replace this with real WebRTC handshake logic.
    session.connected = true;
    saveSession();
    updateSessionSummary();
    showView("session");
  }

  function handleReset() {
    clearSession();
    els.localCodeSpan.textContent = "—";
    els.partnerCodeTextarea.value = "";
    setStatus("");
    showView("signup");
  }

  // Map hook – you will own this.

  function initMapEngine(containerId) {
    // This is where you plug your custom map engine.
    // Example:
    //
    // const container = document.getElementById(containerId);
    // if (!container) return;
    //
    // initCosmicMap({
    //   container,
    //   role: session.role,
    //   userName: session.name,
    //   onLocationUpdate: (coords) => {
    //     // Later: send coords over WebRTC data channel
    //   },
    //   onPartnerLocation: (coords) => {
    //     // Later: update partner marker when data received
    //   },
    // });
    //
    // For now, we leave it as a placeholder.
  }

  // Init

  function init() {
    // Restore session if it exists
    if (loadSession()) {
      // Pre-fill signup fields for convenience
      els.roleSelect.value = session.role;
      els.nameInput.value = session.name;
      els.emailInput.value = session.email;
      els.phoneInput.value = session.phone;

      if (session.connected) {
        updateSessionSummary();
        showView("session");
        initMapEngine("map-container");
      } else {
        if (session.localCode) {
          els.localCodeSpan.textContent = session.localCode;
        }
        showView("connect");
      }
    } else {
      showView("signup");
    }

    // Wire events
    els.signupForm.addEventListener("submit", handleSignupSubmit);
    els.generateCodeBtn.addEventListener("click", handleGenerateCode);
    els.sendEmailBtn.addEventListener("click", handleSendEmail);
    els.sendSmsBtn.addEventListener("click", handleSendSms);
    els.connectBtn.addEventListener("click", handleConnect);
    els.resetBtn.addEventListener("click", handleReset);
  }

  return {
    init,
    initMapEngine, // exposed so you can call/extend if needed
  };
})();

document.addEventListener("DOMContentLoaded", () => {
  LaundryApp.init();
});
