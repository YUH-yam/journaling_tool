import {
  APP_VERSION,
  ISSUE_OPTIONS,
  MODES,
  buildIfThenPlan,
  calculateStats,
  createEntry,
  getMode,
  isoDate,
  recommendMode,
  sanitizeState,
  starterStep,
  summarizeWeek,
  uniqueDates
} from "./core.js";
import { QUOTE_POOL, quoteForDate } from "./quotes.js";

const STORAGE_KEY = "journaling-coach-state";
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const todayFormatter = new Intl.DateTimeFormat("ja-JP", {
  month: "long",
  day: "numeric",
  weekday: "short"
});

const logTimeFormatter = new Intl.DateTimeFormat("ja-JP", {
  month: "numeric",
  day: "numeric",
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit"
});

const THEME_COLORS = {
  light: "#f5f7f3",
  dark: "#111614"
};

const ICON_PATHS = {
  pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  leaf: '<path d="M5 21c8 0 14-6 14-14V3h-4C7 3 3 8 3 15c0 3 2 6 2 6Z"/><path d="M5 21c0-7 4-11 10-13"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>',
  moon: '<path d="M20 14.5A7.5 7.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 15-6.7"/><path d="M18 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7"/><path d="M6 21v-5h5"/>',
  briefcase: '<path d="M10 6V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1"/><path d="M4 7h16v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"/><path d="M4 12h16"/>',
  cloud: '<path d="M17.5 18H8a5 5 0 1 1 1.4-9.8A6 6 0 0 1 21 11.5 3.5 3.5 0 0 1 17.5 18Z"/>',
  flame: '<path d="M12 22c4 0 7-3 7-7 0-3-2-5-4-7 .2 2-1 3-2.5 3C11 11 10 9 11 6c-3 2-6 5-6 9 0 4 3 7 7 7Z"/>',
  scale: '<path d="M12 3v18"/><path d="M5 7h14"/><path d="m6 7-3 6h6Z"/><path d="m18 7-3 6h6Z"/>',
  heart: '<path d="M20.8 5.8a5.4 5.4 0 0 0-7.6 0L12 7l-1.2-1.2a5.4 5.4 0 1 0-7.6 7.6L12 22l8.8-8.6a5.4 5.4 0 0 0 0-7.6Z"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5Z"/>',
  dots: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
  bars: '<path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/>'
};

const ISSUE_ICONS = {
  start: "compass",
  tired: "leaf",
  scattered: "dots",
  work: "briefcase",
  anxiety: "cloud",
  anger: "flame",
  decision: "scale",
  selfCriticism: "heart",
  positive: "sun"
};

const MODE_ICONS = {
  quick3: "pen",
  fiveMinute: "compass",
  morning: "sun",
  noonReset: "refresh",
  nightClose: "moon",
  gratitude: "leaf",
  workFog: "briefcase",
  cbtLight: "cloud",
  anxiety: "cloud",
  decision: "scale",
  anger: "flame",
  selfCompassion: "heart",
  weekly: "bars"
};

const systemThemeQuery = window.matchMedia?.("(prefers-color-scheme: dark)");

let state = loadState();
let selectedIssue = "start";
let currentStep = "settle";
let sessionStartedAt = null;
let introGate = sessionStorage.getItem("journaling-intro-seen") !== "1";
let isRescue = false;
let installPrompt = null;
let timer = {
  duration: getMode(state.currentModeId).duration * 60,
  remaining: getMode(state.currentModeId).duration * 60,
  running: false,
  intervalId: null
};

applyTheme(state.settings.theme);

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return sanitizeState(raw ? JSON.parse(raw) : {});
  } catch {
    return sanitizeState({});
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, version: APP_VERSION }));
}

function resolvedTheme(theme = state.settings.theme) {
  if (theme === "dark" || theme === "light") return theme;
  return systemThemeQuery?.matches ? "dark" : "light";
}

function applyTheme(theme = "system") {
  const safeTheme = ["light", "dark", "system"].includes(theme) ? theme : "system";
  document.documentElement.dataset.theme = safeTheme;
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) themeMeta.setAttribute("content", THEME_COLORS[resolvedTheme(safeTheme)]);
}

function normalizeView(viewName) {
  if (viewName === "templates") return "methods";
  if (viewName === "habit" || viewName === "review") return "rhythm";
  return ["today", "methods", "rhythm", "settings"].includes(viewName) ? viewName : "today";
}

function setView(viewName) {
  const safeView = normalizeView(viewName);
  document.body.dataset.view = safeView;
  $$(".view").forEach((view) => view.classList.toggle("active", view.id === `view-${safeView}`));
  $$(".tab").forEach((tab) => {
    const isActive = tab.dataset.view === safeView;
    tab.classList.toggle("active", isActive);
    if (isActive) tab.setAttribute("aria-current", "page");
    else tab.removeAttribute("aria-current");
  });
  if (location.hash !== `#${safeView}`) history.replaceState(null, "", `#${safeView}`);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setTodayStep(step) {
  const safeStep = ["settle", "choose", "write", "reflect"].includes(step) ? step : "settle";
  const previousStep = currentStep;
  currentStep = safeStep;
  if (safeStep === "write" && !["write", "reflect"].includes(previousStep)) {
    sessionStartedAt = new Date().toISOString();
  }
  if (safeStep === "settle" || safeStep === "choose") {
    sessionStartedAt = null;
  }
  document.body.dataset.step = safeStep;
  document.body.dataset.introGate = String(introGate);
  $$(".today-step").forEach((section) => {
    section.classList.toggle("active", section.dataset.step === safeStep);
  });
  renderCompanion();
  window.scrollTo({ top: 0, behavior: "auto" });
}

function markIntroSeen() {
  introGate = false;
  sessionStorage.setItem("journaling-intro-seen", "1");
}

function setMode(modeId, options = {}) {
  const mode = getMode(modeId);
  state.currentModeId = mode.id;
  isRescue = Boolean(options.rescue);
  const minutes = Number(options.minutes || Math.min(state.settings.defaultMinutes || mode.duration, mode.duration));
  timer.duration = Math.max(1, minutes) * 60;
  timer.remaining = timer.duration;
  stopTimer();
  saveState();
  render();
}

function stopTimer() {
  if (timer.intervalId) {
    clearInterval(timer.intervalId);
    timer.intervalId = null;
  }
  timer.running = false;
}

function tickTimer() {
  if (timer.remaining > 0) timer.remaining -= 1;
  if (timer.remaining <= 0) {
    stopTimer();
    showToast("時間です。整理画面で紙を見返します。");
  }
  renderTimer();
}

function currentQuote() {
  return quoteForDate(isoDate());
}

function setQuoteTargets(prefix, quote = currentQuote()) {
  $(`#${prefix}-quote`).textContent = `「${quote.text}」`;
  $(`#${prefix}-source`).textContent = `${quote.author} / ${quote.source}`;
}

function render() {
  const today = isoDate();
  const stats = calculateStats(state.entries, today);
  const step = starterStep(state.entries);
  const recommended = getMode(step.modeId);

  $("#today-date").textContent = todayFormatter.format(new Date());
  setQuoteTargets("daily");
  $("#recommended-title").textContent = recommended.title;
  $("#recommended-sub").textContent = `${step.dayNumber}日目。${step.goal}`;

  renderChoices();
  renderCompanion();
  renderTimer();
  renderMethods();
  renderRhythm(stats, step);
  renderSettings();
}

function renderChoices() {
  $("#issue-list").innerHTML = ISSUE_OPTIONS.map((item) => {
    const mode = getMode(item.modeId);
    return `
      <button class="choice-card" type="button" data-issue="${item.id}">
        <span class="choice-icon" aria-hidden="true">${svgIcon(ISSUE_ICONS[item.id] || "pen")}</span>
        <span>
          <span class="choice-title">${escapeHtml(item.label)}</span>
          <span class="choice-sub">${escapeHtml(mode.title)} · ${mode.duration}分</span>
        </span>
      </button>
    `;
  }).join("");
}

function renderCompanion() {
  const mode = getMode(state.currentModeId);
  $("#write-kicker").textContent = `紙の横に置く · ${Math.round(timer.duration / 60)}分`;
  $("#write-title").textContent = mode.title;
  $("#write-cue").textContent = mode.cue;
  $("#prompt-stack").innerHTML = mode.prompts.map((prompt) => `<li>${escapeHtml(prompt)}</li>`).join("");
  setQuoteTargets("write");
  setQuoteTargets("reflect");
}

function renderTimer() {
  const minutes = Math.floor(timer.remaining / 60);
  const seconds = timer.remaining % 60;
  $("#timer-face").textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  $("#timer-toggle").textContent = timer.running ? "一時停止" : "開始";
  $("#timer-caption").textContent = timer.running ? "紙に書いています" : "画面を横に置いて開始";
}

function renderMethods() {
  $("#method-list").innerHTML = MODES.map((mode) => `
    <button class="method-card" type="button" data-mode-id="${mode.id}">
      <span class="method-icon" aria-hidden="true">${svgIcon(MODE_ICONS[mode.id] || "pen")}</span>
      <span>
        <span class="method-title">${escapeHtml(mode.title)}</span>
        <span class="method-sub">${escapeHtml(mode.bestFor)}</span>
      </span>
      <span class="method-time">${mode.duration}分</span>
    </button>
  `).join("");
}

function renderRhythm(stats, step) {
  $("#stat-days").textContent = stats.uniqueDays;
  $("#stat-last7").textContent = stats.last7Days;
  $("#stat-rescue").textContent = stats.rescueCount;
  $("#guard-title").textContent = stats.guard.title;
  $("#guard-detail").textContent = stats.guard.detail;
  $("#starter-title").textContent = `${step.dayNumber}日目: ${step.title.replace(/^[^:]+: /, "")}`;
  $("#starter-goal").textContent = step.goal;

  const doneDays = Math.min(uniqueDates(state.entries).length, 14);
  $("#starter-track").innerHTML = Array.from({ length: 14 }, (_, index) => {
    const day = index + 1;
    const className = day <= doneDays ? "done" : day === step.dayNumber ? "current" : "";
    return `<span class="day-dot ${className}" aria-label="${day}日目">${day}</span>`;
  }).join("");

  const week = summarizeWeek(state.entries, isoDate());
  $("#weekly-prompts").innerHTML = getMode("weekly").prompts.map((prompt) => `<li>${escapeHtml(prompt)}</li>`).join("");

  const recent = [...state.entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);
  $("#history-list").innerHTML = recent.length
    ? recent.map((entry) => {
      const mode = getMode(entry.modeId);
      return `
        <article class="history-item">
          <h4>${escapeHtml(formatLogDateTime(entry))}</h4>
          <dl class="log-details">
            <div>
              <dt>経過</dt>
              <dd>${escapeHtml(formatElapsed(entry))}</dd>
            </div>
            <div>
              <dt>型</dt>
              <dd>${escapeHtml(mode.title)}</dd>
            </div>
          </dl>
          ${entry.rescue ? `<p class="rescue-label">1分救済</p>` : ""}
        </article>
      `;
    }).join("")
    : `<p class="empty-state">まだ記録はありません。今日の画面から始めます。</p>`;

  $("#quote-history").innerHTML = recent.length
    ? recent.map((entry) => {
      const quote = QUOTE_POOL.find((item) => item.id === entry.quoteId) || null;
      if (!quote) return "";
      return `
        <article>
          <h4>${escapeHtml(formatLogDateTime(entry))}</h4>
          <p>「${escapeHtml(quote.text)}」</p>
          <p>${escapeHtml(quote.author)} / ${escapeHtml(quote.source)}</p>
        </article>
      `;
    }).join("") || `<p class="empty-state">次回から、整理で見た一言が残ります。</p>`
    : `<p class="empty-state">整理まで進むと、今日の一言もここに残ります。</p>`;

  if (week.topMode) {
    $("#guard-detail").textContent = `${stats.guard.detail} 今週多い型は「${week.topMode.title}」です。`;
  }
}

function renderSettings() {
  $("#setting-trigger").value = state.settings.trigger;
  $("#setting-action").value = state.settings.action;
  $("#setting-minutes").value = String(state.settings.defaultMinutes);
  $("#setting-privacy").checked = state.settings.privacyMode;
  $("#ifthen-plan").textContent = buildIfThenPlan(state.settings.trigger, state.settings.action);
  $$('input[name="setting-theme"]').forEach((input) => {
    input.checked = input.value === state.settings.theme;
  });
}

function updateSettingsFromInputs({ rerender = true } = {}) {
  state.settings.trigger = $("#setting-trigger").value.trim() || "夜の歯磨きが終わったら";
  state.settings.action = $("#setting-action").value.trim() || "ノートを開いて3行だけ書く";
  state.settings.defaultMinutes = Number($("#setting-minutes").value || 3);
  state.settings.theme = $('input[name="setting-theme"]:checked')?.value || "system";
  state.settings.privacyMode = $("#setting-privacy").checked;
  applyTheme(state.settings.theme);
  saveState();
  if (rerender) render();
  else $("#ifthen-plan").textContent = buildIfThenPlan(state.settings.trigger, state.settings.action);
}

function completeSession() {
  const quote = currentQuote();
  const completedAt = new Date();
  const startedAt = sessionStartedAt || completedAt.toISOString();
  const elapsedSeconds = Math.max(0, Math.round((completedAt.getTime() - new Date(startedAt).getTime()) / 1000));
  const entry = createEntry({
    date: isoDate(),
    modeId: state.currentModeId,
    minutes: Math.max(1, Math.ceil(elapsedSeconds / 60)),
    moodBefore: 50,
    moodAfter: 50,
    rescue: isRescue,
    startedAt,
    completedAt: completedAt.toISOString(),
    elapsedSeconds,
    quoteId: quote.id,
    note: ""
  });
  state.entries.push(entry);
  isRescue = false;
  sessionStartedAt = null;
  markIntroSeen();
  saveState();
  render();
  setTodayStep("settle");
  showToast("記録しました。本文は紙の中だけです。");
}

async function copyPrompts() {
  const mode = getMode(state.currentModeId);
  const quote = currentQuote();
  const text = [
    `${mode.title}`,
    `今日の一言: ${quote.text} (${quote.author} / ${quote.source})`,
    ...mode.prompts,
    `整理: 今日の一言と近い行に線を引く`,
    `最後: ${mode.close}`
  ].join("\n");
  try {
    await navigator.clipboard.writeText(text);
    showToast("問いと一言をコピーしました。");
  } catch {
    showToast("コピーできませんでした。画面を見ながら紙に書いてください。");
  }
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `journaling-coach-${isoDate()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function importData(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      state = sanitizeState(JSON.parse(String(reader.result)));
      saveState();
      render();
      showToast("読み込みました。");
    } catch {
      showToast("読み込めないJSONです。");
    }
  });
  reader.readAsText(file);
}

function clearData() {
  const confirmed = window.confirm("この端末のローカル記録を削除します。紙ノートの内容は影響を受けません。");
  if (!confirmed) return;
  state = sanitizeState({});
  saveState();
  setMode("quick3", { minutes: 3 });
  setTodayStep("settle");
  showToast("ローカル記録を削除しました。");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatLogDateTime(entry) {
  const value = entry.startedAt || entry.completedAt || entry.createdAt || `${entry.date}T00:00:00`;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return entry.date || "";
  return logTimeFormatter.format(date);
}

function formatElapsed(entry) {
  const seconds = Number(entry.elapsedSeconds);
  if (Number.isFinite(seconds)) {
    if (seconds < 60) return "1分未満";
    return `${Math.round(seconds / 60)}分`;
  }
  return `${Number(entry.minutes || 1)}分`;
}

function svgIcon(name) {
  const path = ICON_PATHS[name] || ICON_PATHS.pen;
  return `<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${path}</svg>`;
}

let toastTimeout = null;
function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("show"), 2600);
}

function bindEvents() {
  $(".tabbar").addEventListener("click", (event) => {
    const button = event.target.closest("[data-view]");
    if (button) setView(button.dataset.view);
  });

  $("#view-today").addEventListener("click", (event) => {
    const stepButton = event.target.closest("[data-step-target]");
    if (stepButton) setTodayStep(stepButton.dataset.stepTarget);

    const actionButton = event.target.closest("[data-action]");
    if (!actionButton) return;
    if (actionButton.dataset.action === "choose-mode") {
      markIntroSeen();
      setTodayStep("choose");
    }
    if (actionButton.dataset.action === "rescue") {
      markIntroSeen();
      setMode("quick3", { rescue: true, minutes: 1 });
      setTodayStep("write");
    }
    if (actionButton.dataset.action === "use-recommend") {
      markIntroSeen();
      setMode(starterStep(state.entries).modeId);
      setTodayStep("write");
    }
  });

  $("#issue-list").addEventListener("click", (event) => {
    const button = event.target.closest("[data-issue]");
    if (!button) return;
    selectedIssue = button.dataset.issue;
    const modeId = recommendMode({
      issue: selectedIssue,
      energy: 3,
      minutes: state.settings.defaultMinutes
    });
    setMode(modeId);
    setTodayStep("write");
  });

  $("#copy-prompts").addEventListener("click", copyPrompts);

  $("#timer-toggle").addEventListener("click", () => {
    if (timer.running) stopTimer();
    else {
      timer.running = true;
      timer.intervalId = setInterval(tickTimer, 1000);
    }
    renderTimer();
  });

  $("#timer-reset").addEventListener("click", () => {
    stopTimer();
    timer.remaining = timer.duration;
    renderTimer();
  });

  $("#complete-session").addEventListener("click", completeSession);

  $("#method-list").addEventListener("click", (event) => {
    const button = event.target.closest("[data-mode-id]");
    if (!button) return;
    setMode(button.dataset.modeId);
    markIntroSeen();
    setTodayStep("write");
    setView("today");
  });

  ["#setting-trigger", "#setting-action"].forEach((selector) => {
    $(selector).addEventListener("input", () => updateSettingsFromInputs({ rerender: false }));
    $(selector).addEventListener("change", updateSettingsFromInputs);
  });
  ["#setting-minutes", "#setting-privacy"].forEach((selector) => {
    $(selector).addEventListener("change", updateSettingsFromInputs);
  });
  $$('input[name="setting-theme"]').forEach((input) => {
    input.addEventListener("change", updateSettingsFromInputs);
  });

  $("#export-data").addEventListener("click", exportData);
  $("#import-data").addEventListener("change", importData);
  $("#clear-data").addEventListener("click", clearData);

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event;
    $(".install-button").classList.remove("hidden");
  });

  $(".install-button").addEventListener("click", async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    $(".install-button").classList.add("hidden");
  });

  window.addEventListener("hashchange", () => setView(location.hash.replace("#", "") || "today"));
}

function boot() {
  systemThemeQuery?.addEventListener?.("change", () => {
    if (state.settings.theme === "system") applyTheme("system");
  });
  if (!QUOTE_POOL.length) showToast("一言データを読み込めませんでした。");
  timer.duration = state.settings.defaultMinutes * 60;
  timer.remaining = timer.duration;
  bindEvents();
  render();
  setTodayStep("settle");
  setView(location.hash.replace("#", "") || "today");

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // Static fallback still works without offline caching.
    });
  }
}

boot();
