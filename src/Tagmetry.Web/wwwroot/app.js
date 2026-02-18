(() => {
  const STRINGS = {
    missingUi: "The web UI failed to initialize because required elements are missing.",
    idle: "Idle",
    starting: "Starting...",
    inputRequired: "Input directory is required.",
    runRequestFailed: "Run request failed",
    statusErrorPrefix: "Connection error",
    retryIn: "retry in",
    runningState: "running",
    completedState: "completed",
    failedState: "failed"
  };

  const POLL_RUNNING_MS = 1000;
  const POLL_IDLE_MS = 5000;
  const POLL_HIDDEN_MS = 10000;
  const BACKOFF_INITIAL_MS = 2000;
  const BACKOFF_MAX_MS = 30000;
  const REQUEST_TIMEOUT_MS = 8000;
  const LOG_LINES = 200;

  let jobId = null;
  let inFlight = false;
  let backoffMs = 0;
  let lastKnownState = STRINGS.idle.toLowerCase();

  const elements = {
    status: document.getElementById("status"),
    inputDir: document.getElementById("inputDir"),
    runBtn: document.getElementById("runBtn"),
    log: document.getElementById("log"),
    liveLogToggle: document.getElementById("liveLogToggle"),
    themeToggle: document.getElementById("themeToggle")
  };

  const requiredIds = ["status", "inputDir", "runBtn", "log"];
  const missingIds = requiredIds.filter((key) => !elements[key]);

  if (missingIds.length > 0) {
    const body = document.body || document.documentElement;
    const message = `${STRINGS.missingUi} Missing: ${missingIds.join(", ")}.`;
    if (body) {
      const warning = document.createElement("pre");
      warning.textContent = message;
      warning.style.color = "#b00020";
      warning.style.padding = "1rem";
      body.prepend(warning);
    }
    console.error(message);
    return;
  }

  const themeStorageKey = "tagmetry.theme";

  function applySavedTheme() {
    if (!elements.themeToggle) return;
    const savedTheme = localStorage.getItem(themeStorageKey);
    if (savedTheme) {
      document.documentElement.setAttribute("data-theme", savedTheme);
    }

    elements.themeToggle.addEventListener("click", () => {
      const current = document.documentElement.getAttribute("data-theme");
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem(themeStorageKey, next);
    });
  }

  async function api(path, options) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(path, { ...options, signal: controller.signal });
      if (!response.ok) {
        throw new Error(await response.text());
      }
      return await response.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  function setStatusText(text) {
    elements.status.textContent = text;
  }

  function formatStatus(statusResponse) {
    const state = statusResponse.state || STRINGS.idle.toLowerCase();
    const hasPercent = Number.isFinite(statusResponse.percent);
    const percentText = hasPercent ? ` ${statusResponse.percent}%` : "";
    const messageText = statusResponse.message ? ` - ${statusResponse.message}` : "";
    return `${state}${percentText}${messageText}`;
  }

  function shouldFetchLog() {
    const forcedOn = !!elements.liveLogToggle?.checked;
    return lastKnownState === STRINGS.runningState || forcedOn;
  }

  function setLiveLogDefaultFromState(state) {
    if (!elements.liveLogToggle) return;
    elements.liveLogToggle.checked = state === STRINGS.runningState;
  }

  function calcNextInterval() {
    if (document.hidden) return POLL_HIDDEN_MS;
    if (backoffMs > 0) return backoffMs;
    if (lastKnownState === STRINGS.runningState) return POLL_RUNNING_MS;
    return POLL_IDLE_MS;
  }

  async function refreshStatus() {
    if (!jobId) {
      lastKnownState = STRINGS.idle.toLowerCase();
      setStatusText(STRINGS.idle);
      setLiveLogDefaultFromState(lastKnownState);
      return;
    }

    const status = await api(`/api/status?jobId=${encodeURIComponent(jobId)}`);
    lastKnownState = status.state || STRINGS.idle.toLowerCase();
    setStatusText(formatStatus(status));

    if (
      lastKnownState === STRINGS.completedState ||
      lastKnownState === STRINGS.failedState
    ) {
      jobId = null;
      setLiveLogDefaultFromState(STRINGS.idle.toLowerCase());
    } else {
      setLiveLogDefaultFromState(lastKnownState);
    }
  }

  async function refreshLog() {
    if (!shouldFetchLog()) return;
    const log = await api(`/api/log?lines=${LOG_LINES}`);
    elements.log.textContent = (log.lines || []).join("\n");
  }

  async function tick() {
    if (inFlight) {
      setTimeout(tick, 250);
      return;
    }

    inFlight = true;

    try {
      await refreshStatus();
      await refreshLog();
      backoffMs = 0;
    } catch (error) {
      backoffMs = backoffMs
        ? Math.min(BACKOFF_MAX_MS, backoffMs * 2)
        : BACKOFF_INITIAL_MS;
      const retrySeconds = Math.round(backoffMs / 1000);
      setStatusText(`${STRINGS.statusErrorPrefix} (${STRINGS.retryIn} ${retrySeconds}s)`);
      console.warn(error);
    } finally {
      inFlight = false;
      setTimeout(tick, calcNextInterval());
    }
  }

  async function runJob() {
    const inputDir = elements.inputDir.value.trim();
    if (!inputDir) {
      alert(STRINGS.inputRequired);
      return;
    }

    try {
      setStatusText(STRINGS.starting);
      const result = await api("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputDir })
      });

      jobId = result.jobId || null;
      lastKnownState = STRINGS.runningState;
      setLiveLogDefaultFromState(lastKnownState);
      backoffMs = 0;
      tick();
    } catch (error) {
      alert(`${STRINGS.runRequestFailed}: ${String(error)}`);
    }
  }

  elements.runBtn.addEventListener("click", runJob);

  elements.liveLogToggle?.addEventListener("change", () => {
    if (elements.liveLogToggle.checked) {
      tick();
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      backoffMs = 0;
      tick();
    }
  });

  setLiveLogDefaultFromState(lastKnownState);
  applySavedTheme();
  tick();
})();
