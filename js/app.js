import {
  APP_VERSION,
  ISSUE_OPTIONS,
  MODES,
  buildIfThenPlan,
  calculateStats,
  createEntry,
  entriesForDate,
  getMode,
  isoDate,
  makePageCode,
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
  check: '<path d="M20 6 9 17l-5-5"/>',
  bars: '<path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.4.2.8.5 1.1.8"/>',
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>'
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
let currentStep = "gate";
let introGate = sessionStorage.getItem("journaling-intro-seen") !== "1";
let promptIndex = 0;
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
  const safeStep = ["gate", "choose", "prompt", "timer", "complete"].includes(step) ? step : "gate";
  currentStep = safeStep;
  document.body.dataset.step = safeStep;
  document.body.dataset.introGate = String(introGate);
  $$(".today-step").forEach((section) => {
    section.classList.toggle("active", section.dataset.step === safeStep);
  });
  if (safeStep === "prompt") promptIndex = Math.min(promptIndex, getMode(state.currentModeId).prompts.length - 1);
  renderPrompt();
}

function setMode(modeId, options = {}) {
  const mode = getMode(modeId);
  state.currentModeId = mode.id;
  isRescue = Boolean(options.rescue);
  const minutes = Number(options.minutes || Math.min(state.settings.defaultMinutes || mode.duration, mode.duration));
  timer.duration = Math.max(1, minutes) * 60;
  timer.remaining = timer.duration;
  promptIndex = 0;
  stopTimer();
  saveState();
  render();
}

function markIntroSeen() {
  introGate = false;
  sessionStorage.setItem("journaling-intro-seen", "1");
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
    showToast("時間です。最後の一文で閉じます。");
  }
  renderTimer();
}

function currentPageCode() {
  const today = isoDate();
  return makePageCode(today, entriesForDate(state.entries, today).length + 1);
}

function dailyQuoteText(quote) {
  return `「${quote.text}」 ${quote.author} / ${quote.source}`;
}

function render() {
  const today = isoDate();
  const stats = calculateStats(state.entries, today);
  const step = starterStep(state.entries);
  const recommended = getMode(step.modeId);
  const quote = quoteForDate(today);

  $("#today-date").textContent = todayFormatter.format(new Date());
  $("#daily-hint").textContent = dailyQuoteText(quote);
  $("#recommended-title").textContent = recommended.title;
  $("#recommended-sub").textContent = `${step.dayNumber}日目。${step.goal}`;

  renderChoices();
  renderPrompt();
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

function renderPrompt() {
  const mode = getMode(state.currentModeId);
  const prompts = mode.prompts.length ? mode.prompts : ["今、紙に置きたいことを一つ。"];
  promptIndex = Math.max(0, Math.min(promptIndex, prompts.length - 1));
  $("#mode-kicker").textContent = `${mode.title} · ${Math.round(timer.duration / 60)}分`;
  $("#prompt-title").textContent = prompts[promptIndex];
  $("#prompt-helper").textContent = promptIndex === prompts.length - 1
    ? `最後に: ${mode.close}`
    : "この問いだけ紙に写します。";
  $("#prompt-count").textContent = `${promptIndex + 1} / ${prompts.length}`;
  $("#prompt-progress").style.width = `${Math.round(((promptIndex + 1) / prompts.length) * 100)}%`;
  $("#prompt-prev").disabled = promptIndex === 0;
  $("#prompt-next").textContent = promptIndex === prompts.length - 1 ? "タイマーへ" : "次へ";
  $("#timer-mode").textContent = mode.title;
  $("#complete-summary").textContent = `${mode.title} · ${Math.round(timer.duration / 60)}分 · ${currentPageCode()}`;
}

function renderTimer() {
  const minutes = Math.floor(timer.remaining / 60);
  const seconds = timer.remaining % 60;
  $("#timer-face").textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const progress = timer.duration ? Math.round((1 - timer.remaining / timer.duration) * 100) : 0;
  $("#timer-circle").style.setProperty("--timer-progress", `${Math.max(0, Math.min(100, progress))}%`);
  $("#timer-toggle").textContent = timer.running ? "一時停止" : "開始";
  $("#timer-caption").textContent = timer.running ? "書いています" : "準備OK";
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
  const weekly = getMode("weekly").prompts;
  $("#weekly-prompts").innerHTML = weekly.map((prompt) => `<li>${escapeHtml(prompt)}</li>`).join("");

  const recent = [...state.entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);
  $("#history-list").innerHTML = recent.length
    ? recent.map((entry) => {
      const mode = getMode(entry.modeId);
      return `
        <article class="history-item">
          <h4>${escapeHtml(entry.date)} ${escapeHtml(mode.shortTitle)}</h4>
          <p>${entry.minutes}分 · ${escapeHtml(entry.pageCode || "")}${entry.rescue ? " · 1分救済" : ""}</p>
        </article>
      `;
    }).join("")
    : `<p class="empty-state">まだ記録はありません。今日の画面から始めます。</p>`;

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
  const entry = createEntry({
    date: isoDate(),
    modeId: state.currentModeId,
    minutes: Math.max(1, Math.round(timer.duration / 60)),
    moodBefore: 50,
    moodAfter: 50,
    rescue: isRescue,
    pageCode: currentPageCode(),
    note: ""
  });
  state.entries.push(entry);
  isRescue = false;
  markIntroSeen();
  saveState();
  render();
  setTodayStep("gate");
  showToast("記録しました。本文は保存していません。");
}

async function copyPrompts() {
  const mode = getMode(state.currentModeId);
  const quote = quoteForDate(isoDate());
  const text = [
    `${mode.title} ${currentPageCode()}`,
    `今日の一言: ${quote.text} (${quote.author} / ${quote.source})`,
    ...mode.prompts,
    `最後: ${mode.close}`
  ].join("\n");
  try {
    await navigator.clipboard.writeText(text);
    showToast("紙に写す問いをコピーしました。");
  } catch {
    showToast("コピーできませんでした。画面の問いを紙に写してください。");
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
  setTodayStep("gate");
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
    if (actionButton.dataset.action === "open-today" || actionButton.dataset.action === "skip-gate") {
      markIntroSeen();
      setTodayStep("choose");
    }
    if (actionButton.dataset.action === "rescue") {
      markIntroSeen();
      setMode("quick3", { rescue: true, minutes: 1 });
      setTodayStep("prompt");
    }
    if (actionButton.dataset.action === "use-recommend") {
      markIntroSeen();
      setMode(starterStep(state.entries).modeId);
      setTodayStep("prompt");
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
    setTodayStep("prompt");
  });

  $("#prompt-prev").addEventListener("click", () => {
    promptIndex = Math.max(0, promptIndex - 1);
    renderPrompt();
  });

  $("#prompt-next").addEventListener("click", () => {
    const mode = getMode(state.currentModeId);
    if (promptIndex >= mode.prompts.length - 1) setTodayStep("timer");
    else {
      promptIndex += 1;
      renderPrompt();
    }
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
    setTodayStep("prompt");
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
  setTodayStep("gate");
  setView(location.hash.replace("#", "") || "today");

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // Static fallback still works without offline caching.
    });
  }
}

boot();
