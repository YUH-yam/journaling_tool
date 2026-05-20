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
  await mobile.waitForSelector("#mode-title");
  await mobile.evaluate(() => navigator.serviceWorker?.ready);
  await mobile.reload({ waitUntil: "networkidle" });
  await mobile.waitForSelector("#mode-title");

  const initial = await mobile.locator("#mode-title").textContent();
  const promptCount = await mobile.locator("#prompt-list li").count();
  const manifest = await mobile.evaluate(async () => {
    const response = await fetch("manifest.webmanifest");
    return response.json();
  });
  const iconStatus = await mobile.evaluate(async () => {
    const icons = ["assets/icon-180.png", "assets/icon-192.png", "assets/icon-512.png", "assets/icon-maskable-512.png"];
    const responses = await Promise.all(icons.map(async (icon) => {
      const response = await fetch(icon);
      return { icon, ok: response.ok, contentType: response.headers.get("content-type") };
    }));
    return responses;
  });
  await mobile.getByRole("button", { name: "不安" }).click();
  const afterIssue = await mobile.locator("#mode-title").textContent();
  await mobile.getByRole("button", { name: "30秒" }).click();
  const rescueTitle = await mobile.locator("#mode-title").textContent();
  const timerText = await mobile.locator("#timer-face").textContent();

  await mobile.locator("#mood-before").evaluate((el) => {
    el.value = 35;
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await mobile.locator("#mood-after").evaluate((el) => {
    el.value = 48;
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await mobile.locator("#page-note").fill("p.1");
  await mobile.getByRole("button", { name: "記録する" }).click();
  await mobile.getByRole("button", { name: "習慣" }).click();

  const days = await mobile.locator("#stat-days").textContent();
  const rescue = await mobile.locator("#stat-rescue").textContent();
  const stored = await mobile.evaluate(() => JSON.parse(localStorage.getItem("journaling-coach-state")));
  const mobileViews = ["今日", "型", "習慣", "設定"];
  const mobileOverflow = [];
  const touchIssues = [];
  for (const name of mobileViews) {
    await mobile.getByRole("button", { name, exact: true }).click();
    if (await hasHorizontalOverflow(mobile)) mobileOverflow.push(name);
    touchIssues.push(...await smallTapTargets(mobile));
  }
  await mobile.goto(`${baseUrl}#review`, { waitUntil: "networkidle" });
  const hashReviewTitle = await mobile.locator("#habit-title").textContent();
  await mobile.context().setOffline(true);
  await mobile.goto(`${baseUrl}#templates`, { waitUntil: "domcontentloaded" });
  await mobile.waitForSelector("#templates-title");
  const offlineTitle = await mobile.locator("#templates-title").textContent();
  await mobile.context().setOffline(false);
  await mobile.screenshot({ path: "/private/tmp/journaling-mobile.png", fullPage: false });

  const desktop = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  desktop.on("console", (msg) => messages.push(`desktop:${msg.type()}:${msg.text()}`));
  desktop.on("pageerror", (error) => messages.push(`desktop-error:${error.message}`));
  await desktop.goto(baseUrl, { waitUntil: "networkidle" });
  await desktop.getByRole("button", { name: "型", exact: true }).click();
  const templateCards = await desktop.locator(".template-card").count();
  const desktopOverflow = await hasHorizontalOverflow(desktop);
  await desktop.screenshot({ path: "/private/tmp/journaling-desktop.png", fullPage: false });

  const result = {
    initial,
    promptCount,
    afterIssue,
    rescueTitle,
    timerText,
    days,
    rescue,
    entries: stored.entries.length,
    templateCards,
    manifestDisplay: manifest.display,
    manifestIconCount: manifest.icons.length,
    manifestShortcutCount: manifest.shortcuts.length,
    iconStatus,
    hashReviewTitle,
    offlineTitle,
    mobileOverflow,
    touchIssues,
    desktopOverflow,
    messages
  };

  if (promptCount < 3) throw new Error("Prompt list did not render");
  if (rescueTitle !== "3行だけ") throw new Error("Rescue mode did not switch to quick3");
  if (timerText !== "01:00") throw new Error("Rescue timer did not set to 1 minute");
  if (days !== "1") throw new Error("Completion did not update habit stats");
  if (rescue !== "1") throw new Error("Rescue completion was not counted");
  if (stored.entries.length !== 1) throw new Error("Local entry was not saved");
  if (templateCards < 10) throw new Error("Template list did not render");
  if (manifest.display !== "standalone") throw new Error("Manifest display is not standalone");
  if (!manifest.icons.some((icon) => icon.purpose === "maskable")) throw new Error("Maskable icon is missing");
  if (manifest.shortcuts.length < 3) throw new Error("Manifest shortcuts are missing");
  if (iconStatus.some((item) => !item.ok || !item.contentType?.includes("image/png"))) {
    throw new Error(`PWA PNG icon check failed: ${JSON.stringify(iconStatus)}`);
  }
  if (hashReviewTitle !== "習慣") throw new Error("Legacy review hash did not open habit view");
  if (offlineTitle !== "型") throw new Error("Offline fallback did not serve app shell");
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
