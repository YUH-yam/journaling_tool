import { chromium } from "/Users/yuh_y/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const baseUrl = "http://127.0.0.1:4173/journaling-support-tool/";
const messages = [];

async function hasHorizontalOverflow(page) {
  return page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
}

async function smallTapTargets(page) {
  return page.evaluate(() => [...document.querySelectorAll("button, input, select, .chip")]
    .filter((element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44);
    })
    .map((element) => ({
      tag: element.tagName.toLowerCase(),
      text: element.textContent.trim(),
      aria: element.getAttribute("aria-label"),
      width: Math.round(element.getBoundingClientRect().width),
      height: Math.round(element.getBoundingClientRect().height)
    })));
}

const browser = await chromium.launch({
  headless: true,
  executablePath: chromePath,
  args: ["--no-sandbox"]
});

try {
  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true
  });
  mobile.on("console", (msg) => messages.push(`mobile:${msg.type()}:${msg.text()}`));
  mobile.on("pageerror", (error) => messages.push(`mobile-error:${error.message}`));

  await mobile.goto(baseUrl, { waitUntil: "networkidle" });
  await mobile.waitForSelector("#settle-title");
  await mobile.evaluate(() => navigator.serviceWorker?.ready);
  await mobile.reload({ waitUntil: "networkidle" });
  await mobile.waitForSelector("#settle-title");

  const settleTitle = await mobile.locator("#settle-title").textContent();
  const dailyQuote = await mobile.locator("#daily-quote").textContent();
  const dailySource = await mobile.locator("#daily-source").textContent();
  await mobile.getByRole("button", { name: "書き方を選ぶ" }).click();
  const recommended = await mobile.locator("#recommended-title").textContent();
  const choiceCount = await mobile.locator(".choice-card").count();

  const manifest = await mobile.evaluate(async () => {
    const response = await fetch("manifest.webmanifest");
    return response.json();
  });
  const iconStatus = await mobile.evaluate(async () => {
    const icons = ["assets/icon-180.png", "assets/icon-192.png", "assets/icon-512.png", "assets/icon-maskable-512.png"];
    return Promise.all(icons.map(async (icon) => {
      const response = await fetch(icon);
      return { icon, ok: response.ok, contentType: response.headers.get("content-type") };
    }));
  });

  await mobile.getByRole("button", { name: /不安/ }).click();
  const writeTitle = await mobile.locator("#write-title").textContent();
  const promptCount = await mobile.locator("#prompt-stack li").count();
  const writeQuote = await mobile.locator("#write-quote").textContent();
  await mobile.getByRole("button", { name: "整理する" }).click();
  const reflectQuote = await mobile.locator("#reflect-quote").textContent();
  const reflectTaskCount = await mobile.locator(".reflect-list li").count();

  await mobile.getByRole("button", { name: "書く画面へ" }).click();
  await mobile.getByRole("button", { name: "型を変える" }).click();
  await mobile.getByRole("button", { name: "1行だけ" }).click();
  const rescueTitle = await mobile.locator("#write-title").textContent();
  const timerText = await mobile.locator("#timer-face").textContent();
  await mobile.getByRole("button", { name: "整理する" }).click();
  await mobile.getByRole("button", { name: "紙に残した" }).click();
  await mobile.getByRole("button", { name: "書き方を選ぶ" }).click();
  await mobile.getByRole("button", { name: "記録", exact: true }).click();

  const days = await mobile.locator("#stat-days").textContent();
  const rescue = await mobile.locator("#stat-rescue").textContent();
  const quoteHistoryCount = await mobile.locator("#quote-history article").count();
  const historyText = await mobile.locator("#history-list").textContent();
  const stored = await mobile.evaluate(() => JSON.parse(localStorage.getItem("journaling-coach-state")));

  await mobile.getByRole("button", { name: "設定", exact: true }).click();
  await mobile.getByRole("radio", { name: "ダーク" }).check();
  const darkTheme = await mobile.evaluate(() => ({
    dataTheme: document.documentElement.dataset.theme,
    themeColor: document.querySelector('meta[name="theme-color"]')?.getAttribute("content"),
    storedTheme: JSON.parse(localStorage.getItem("journaling-coach-state")).settings.theme
  }));
  await mobile.reload({ waitUntil: "networkidle" });
  const persistedTheme = await mobile.evaluate(() => document.documentElement.dataset.theme);
  await mobile.getByRole("radio", { name: "システム" }).check();
  const systemTheme = await mobile.evaluate(() => ({
    dataTheme: document.documentElement.dataset.theme,
    storedTheme: JSON.parse(localStorage.getItem("journaling-coach-state")).settings.theme
  }));

  const mobileViews = ["今日", "型", "記録", "設定"];
  const mobileOverflow = [];
  const touchIssues = [];
  for (const name of mobileViews) {
    await mobile.getByRole("button", { name, exact: true }).click();
    if (await hasHorizontalOverflow(mobile)) mobileOverflow.push(name);
    touchIssues.push(...await smallTapTargets(mobile));
  }

  await mobile.goto(`${baseUrl}#review`, { waitUntil: "networkidle" });
  const hashReviewTitle = await mobile.locator("#rhythm-title").textContent();
  await mobile.context().setOffline(true);
  await mobile.goto(`${baseUrl}#templates`, { waitUntil: "domcontentloaded" });
  await mobile.waitForSelector("#methods-title");
  const offlineTitle = await mobile.locator("#methods-title").textContent();
  await mobile.context().setOffline(false);
  await mobile.screenshot({ path: "/private/tmp/journaling-mobile.png", fullPage: false });

  const desktop = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  desktop.on("console", (msg) => messages.push(`desktop:${msg.type()}:${msg.text()}`));
  desktop.on("pageerror", (error) => messages.push(`desktop-error:${error.message}`));
  await desktop.goto(baseUrl, { waitUntil: "networkidle" });
  await desktop.getByRole("button", { name: "書き方を選ぶ" }).click();
  await desktop.getByRole("button", { name: "型", exact: true }).click();
  const templateCards = await desktop.locator(".method-card").count();
  const desktopOverflow = await hasHorizontalOverflow(desktop);
  await desktop.screenshot({ path: "/private/tmp/journaling-desktop.png", fullPage: false });

  const result = {
    settleTitle,
    dailyQuote,
    dailySource,
    recommended,
    choiceCount,
    writeTitle,
    promptCount,
    writeQuote,
    reflectQuote,
    reflectTaskCount,
    rescueTitle,
    timerText,
    days,
    rescue,
    historyText,
    entries: stored.entries.length,
    storedQuoteId: stored.entries[0]?.quoteId,
    storedElapsedSeconds: stored.entries[0]?.elapsedSeconds,
    storedPageCode: stored.entries[0]?.pageCode,
    quoteHistoryCount,
    templateCards,
    manifestDisplay: manifest.display,
    manifestIconCount: manifest.icons.length,
    manifestShortcutCount: manifest.shortcuts.length,
    iconStatus,
    darkTheme,
    persistedTheme,
    systemTheme,
    hashReviewTitle,
    offlineTitle,
    mobileOverflow,
    touchIssues,
    desktopOverflow,
    messages
  };

  if (!settleTitle.includes("紙の横")) throw new Error("Settle screen did not render");
  if (!dailyQuote.includes("「") || !dailySource.includes("/")) throw new Error("Daily quote did not render with source");
  if (choiceCount < 8) throw new Error("Choice list did not render");
  if (!writeTitle || writeTitle === recommended) throw new Error("Issue choice did not open companion board");
  if (promptCount < 3) throw new Error("Prompt stack did not render");
  if (writeQuote !== reflectQuote) throw new Error("Quote was not carried into reflection");
  if (reflectTaskCount !== 3) throw new Error("Reflection tasks did not render");
  if (rescueTitle !== "3行だけ") throw new Error("Rescue mode did not switch to quick3");
  if (timerText !== "01:00") throw new Error("Rescue timer did not set to 1 minute");
  if (days !== "1") throw new Error("Completion did not update habit stats");
  if (rescue !== "1") throw new Error("Rescue completion was not counted");
  if (stored.entries.length !== 1 || !stored.entries[0]?.quoteId) throw new Error("Local entry or quote id was not saved");
  if (!Number.isFinite(stored.entries[0]?.elapsedSeconds)) throw new Error("Elapsed time was not saved");
  if (stored.entries[0]?.pageCode) throw new Error("Deprecated paper code was still saved");
  if (!historyText.includes("経過") || !historyText.includes("型") || historyText.includes("J-")) {
    throw new Error(`Log display is unclear: ${historyText}`);
  }
  if (quoteHistoryCount < 1) throw new Error("Quote history did not render");
  if (templateCards < 10) throw new Error("Template list did not render");
  if (manifest.display !== "standalone") throw new Error("Manifest display is not standalone");
  if (!manifest.icons.some((icon) => icon.purpose === "maskable")) throw new Error("Maskable icon is missing");
  if (manifest.shortcuts.length < 3) throw new Error("Manifest shortcuts are missing");
  if (darkTheme.dataTheme !== "dark" || darkTheme.storedTheme !== "dark" || darkTheme.themeColor !== "#111614") {
    throw new Error(`Dark theme did not apply: ${JSON.stringify(darkTheme)}`);
  }
  if (persistedTheme !== "dark") throw new Error("Dark theme did not persist after reload");
  if (systemTheme.dataTheme !== "system" || systemTheme.storedTheme !== "system") {
    throw new Error(`System theme did not apply: ${JSON.stringify(systemTheme)}`);
  }
  if (iconStatus.some((item) => !item.ok || !item.contentType?.includes("image/png"))) {
    throw new Error(`PWA PNG icon check failed: ${JSON.stringify(iconStatus)}`);
  }
  if (hashReviewTitle !== "紙に残した記録") throw new Error("Legacy review hash did not open rhythm view");
  if (offlineTitle !== "紙の横に置く型") throw new Error("Offline fallback did not serve app shell");
  if (mobileOverflow.length) throw new Error(`Mobile overflow in views: ${mobileOverflow.join(", ")}`);
  if (touchIssues.length) throw new Error(`Small tap targets found: ${JSON.stringify(touchIssues.slice(0, 8))}`);
  if (desktopOverflow) throw new Error("Desktop overflow found");
  if (messages.some((message) => message.includes("error"))) {
    throw new Error(`Browser errors found: ${messages.join("; ")}`);
  }

  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}
