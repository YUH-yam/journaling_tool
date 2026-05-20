import {
  APP_VERSION,
  GROUP_LABELS,
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

const STORAGE_KEY = "journaling-coach-state";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const todayFormatter = new Intl.DateTimeFormat("ja-JP", {
  month: "long",
  day: "numeric",
  weekday: "short"
});

const THEME_COLORS = {
  light: "#f4f6f4",
  dark: "#0d1110"
};

const systemThemeQuery = window.matchMedia?.("(prefers-color-scheme: dark)");

let state = loadState();
let selectedIssue = "start";
let selectedGroup = "all";
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
  if (themeMeta) {
    themeMeta.setAttribute("content", THEME_COLORS[resolvedTheme(safeTheme)]);
  }
}

function setView(viewName) {
  if (viewName === "review") viewName = "habit";
  if (!$(`#view-${viewName}`)) viewName = "today";
  $$(".view").forEach((view) => view.classList.toggle("active", view.id === `view-${viewName}`));
  $$(".nav-item").forEach((item) => {
    const isActive = item.dataset.view === viewName;
    item.classList.toggle("active", isActive);
    if (isActive) {
      item.setAttribute("aria-current", "page");
    } else {
      item.removeAttribute("aria-current");
    }
  });
  if (location.hash !== `#${viewName}`) {
    history.replaceState(null, "", `#${viewName}`);
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setMode(modeId, options = {}) {
  state.currentModeId = modeId;
  isRescue = Boolean(options.rescue);
  const mode = getMode(modeId);
  const minutes = options.minutes || Math.min(Number(state.settings.defaultMinutes || mode.duration), mode.duration);
  timer.duration = minutes * 60;
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
  if (timer.remaining > 0) {
    timer.remaining -= 1;
  }
  if (timer.remaining <= 0) {
    stopTimer();
    showToast("時間です。最後に一文だけ着地を書いて閉じます。");
  }
  renderTimer();
}

function renderTimer() {
  const minutes = Math.floor(timer.remaining / 60);
  const seconds = timer.remaining % 60;
  $("#timer-face").textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const progress = timer.duration ? 100 - Math.round((timer.remaining / timer.duration) * 100) : 0;
  $("#timer-progress").style.width = `${Math.max(0, Math.min(100, progress))}%`;
  $("#timer-toggle").textContent = timer.running ? "一時停止" : "開始";
}

function currentPageCode() {
  const today = isoDate();
  return makePageCode(today, entriesForDate(state.entries, today).length + 1);
}

function render() {
  const today = isoDate();
  const stats = calculateStats(state.entries, today);
  const step = starterStep(state.entries);
  const mode = getMode(state.currentModeId);
  const week = summarizeWeek(state.entries, today);

  $("#today-date").textContent = todayFormatter.format(new Date());
  $("#guard-detail").textContent = `${stats.guard.title}: ${stats.guard.detail}`;
  $("#rhythm-percent").textContent = `${stats.rhythmPercent}%`;
  $("#starter-title").textContent = `${step.dayNumber}日目: ${step.title.replace(/^[^:]+: /, "")}`;
  $("#starter-goal").textContent = step.goal;

  renderIssueChips();
  renderGroupFilters();
  renderPrompt(mode);
  renderTimer();
  renderTemplates();
  renderHabit(stats, step);
  renderReview(week);
  renderSettings();
}

function renderIssueChips() {
  const container = $("#issue-chips");
  container.innerHTML = ISSUE_OPTIONS.map((item) => (
    `<button class="chip ${item.id === selectedIssue ? "active" : ""}" type="button" data-issue="${item.id}" aria-pressed="${item.id === selectedIssue}">${item.label}</button>`
  )).join("");
}

function renderGroupFilters() {
  const container = $("#group-filters");
  container.innerHTML = Object.entries(GROUP_LABELS).map(([id, label]) => (
    `<button class="chip ${id === selectedGroup ? "active" : ""}" type="button" data-group="${id}" aria-pressed="${id === selectedGroup}">${label}</button>`
  )).join("");
}

function renderPrompt(mode) {
  $("#mode-title").textContent = mode.title;
  $("#mode-cue").textContent = mode.cue;
  $("#mode-fit").textContent = `${mode.bestFor}。この順番で紙に書きます。目安 ${Math.round(timer.duration / 60)}分。`;
  $("#prompt-list").innerHTML = mode.prompts.map((prompt) => `<li>${escapeHtml(prompt)}</li>`).join("");
  $("#page-code").textContent = currentPageCode();
  $("#close-note").textContent = `最後に: ${mode.close}`;
}

function renderTemplates() {
  const modes = selectedGroup === "all" ? MODES : MODES.filter((mode) => mode.group === selectedGroup);
  $("#template-list").innerHTML = modes.map((mode) => `
    <article class="template-card">
      <header>
        <strong>${escapeHtml(mode.title)}</strong>
        <span class="mode-tag">${escapeHtml(GROUP_LABELS[mode.group] || mode.group)}</span>
      </header>
      <p>${escapeHtml(mode.bestFor)}</p>
      <p>${escapeHtml(mode.cue)}</p>
      <button class="small-button" type="button" data-mode-id="${mode.id}">この型にする</button>
    </article>
  `).join("");
}

function renderHabit(stats, step) {
  $("#stat-days").textContent = stats.uniqueDays;
  $("#stat-last7").textContent = stats.last7Days;
  $("#stat-rescue").textContent = stats.rescueCount;
  $("#ifthen-plan").textContent = buildIfThenPlan(state.settings.trigger, state.settings.action);

  const doneDays = Math.min(uniqueDates(state.entries).length, 14);
  $("#starter-track").innerHTML = Array.from({ length: 14 }, (_, index) => {
    const day = index + 1;
    const className = day <= doneDays ? "done" : day === step.dayNumber ? "current" : "";
    return `<span class="progress-dot ${className}" aria-label="${day}日目">${day}</span>`;
  }).join("");

  const recent = [...state.entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);
  $("#history-list").innerHTML = recent.length
    ? recent.map((entry) => {
      const mode = getMode(entry.modeId);
      return `
        <article class="history-item">
          <header>
            <strong>${escapeHtml(entry.date)} ${escapeHtml(mode.shortTitle)}</strong>
            <span class="mode-tag">${escapeHtml(entry.pageCode || "")}</span>
          </header>
          <p>${entry.minutes}分${entry.rescue ? " / 1分だけ" : ""}</p>
          ${entry.note ? `<p>${escapeHtml(entry.note)}</p>` : ""}
        </article>
      `;
    }).join("")
    : `<p class="empty-state">まだ記録はありません。今日画面の1番上から始めます。</p>`;
}

function renderReview(week) {
  $("#top-mode").textContent = week.topMode ? week.topMode.title : "なし";
  $("#mood-delta").textContent = week.recent.length;
  $("#weekly-prompts").innerHTML = getMode("weekly").prompts.map((prompt) => `<li>${escapeHtml(prompt)}</li>`).join("");
}

function renderSettings() {
  $("#setting-notebook").value = state.settings.notebookName;
  $("#setting-trigger").value = state.settings.trigger;
  $("#setting-action").value = state.settings.action;
  $("#setting-minutes").value = String(state.settings.defaultMinutes);
  $$('input[name="setting-theme"]').forEach((input) => {
    input.checked = input.value === state.settings.theme;
  });
  $("#setting-privacy").checked = state.settings.privacyMode;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function copyPrompt() {
  const mode = getMode(state.currentModeId);
  const text = [
    `${mode.title} ${currentPageCode()}`,
    ...mode.prompts,
    `終わりの一言: ${mode.close}`
  ].join("\n");

  try {
    await navigator.clipboard.writeText(text);
    showToast("コピーしました。紙にそのまま写せます。");
  } catch {
    showToast(text);
  }
}

function completeSession() {
  const today = isoDate();
  const entry = createEntry({
    date: today,
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
  saveState();
  render();
  showToast("記録しました。紙の本文は保存していません。");
}

function updateSettingsFromInputs({ rerender = true } = {}) {
  state.settings.notebookName = $("#setting-notebook").value.trim() || "紙のノート";
  state.settings.trigger = $("#setting-trigger").value.trim() || "夜の歯磨きが終わったら";
  state.settings.action = $("#setting-action").value.trim() || "ノートを開いて3行だけ書く";
  state.settings.defaultMinutes = Number($("#setting-minutes").value || 3);
  state.settings.theme = $('input[name="setting-theme"]:checked')?.value || "system";
  state.settings.privacyMode = $("#setting-privacy").checked;
  applyTheme(state.settings.theme);
  saveState();
  if (rerender) {
    render();
  } else {
    $("#ifthen-plan").textContent = buildIfThenPlan(state.settings.trigger, state.settings.action);
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
      showToast("記録をインポートしました。");
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
  showToast("ローカル記録を削除しました。");
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
  $(".bottom-nav").addEventListener("click", (event) => {
    const button = event.target.closest("[data-view]");
    if (button) setView(button.dataset.view);
  });

  $("#issue-chips").addEventListener("click", (event) => {
    const button = event.target.closest("[data-issue]");
    if (!button) return;
    selectedIssue = button.dataset.issue;
    const modeId = recommendMode({
      issue: selectedIssue,
      energy: 3,
      minutes: state.settings.defaultMinutes
    });
    setMode(modeId);
  });

  $("#group-filters").addEventListener("click", (event) => {
    const button = event.target.closest("[data-group]");
    if (!button) return;
    selectedGroup = button.dataset.group;
    render();
  });

  $("#template-list").addEventListener("click", (event) => {
    const button = event.target.closest("[data-mode-id]");
    if (!button) return;
    setMode(button.dataset.modeId);
    setView("today");
  });

  $$("[data-mode-shortcut]").forEach((button) => {
    button.addEventListener("click", () => {
      setMode(button.dataset.modeShortcut);
      setView("today");
    });
  });

  $("#starter-mode-button").addEventListener("click", () => {
    setMode(starterStep(state.entries).modeId);
  });

  $(".rescue-button").addEventListener("click", () => {
    setMode("quick3", { rescue: true, minutes: 1 });
    showToast("1分レスキューに切り替えました。1行でも記録できます。");
  });

  $("#copy-prompt").addEventListener("click", copyPrompt);

  $("#shuffle-mode").addEventListener("click", () => {
    const currentIndex = MODES.findIndex((mode) => mode.id === state.currentModeId);
    setMode(MODES[(currentIndex + 1) % MODES.length].id);
  });

  $("#timer-toggle").addEventListener("click", () => {
    if (timer.running) {
      stopTimer();
    } else {
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

  ["#setting-notebook", "#setting-trigger", "#setting-action", "#setting-minutes", "#setting-privacy"].forEach((selector) => {
    $(selector).addEventListener("change", updateSettingsFromInputs);
  });
  $$('input[name="setting-theme"]').forEach((input) => {
    input.addEventListener("change", updateSettingsFromInputs);
  });
  $("#setting-trigger").addEventListener("input", () => updateSettingsFromInputs({ rerender: false }));
  $("#setting-action").addEventListener("input", () => updateSettingsFromInputs({ rerender: false }));

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

  window.addEventListener("hashchange", () => {
    const viewName = location.hash.replace("#", "") || "today";
    setView(viewName);
  });
}

function boot() {
  systemThemeQuery?.addEventListener?.("change", () => {
    if (state.settings.theme === "system") applyTheme("system");
  });
  timer.duration = state.settings.defaultMinutes * 60;
  timer.remaining = timer.duration;
  bindEvents();
  render();
  const initialView = location.hash.replace("#", "") || "today";
  setView(initialView);

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // The app still works as a static page without offline caching.
    });
  }
}

boot();
