import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateStats,
  createEntry,
  diffDays,
  getMode,
  isoDate,
  makePageCode,
  recommendMode,
  sanitizeState,
  starterStep,
  summarizeWeek
} from "../js/core.js";
import { QUOTE_POOL, quoteForDate } from "../js/quotes.js";

test("isoDate and diffDays use local date fields and stable day math", () => {
  assert.equal(isoDate(new Date(2026, 4, 20)), "2026-05-20");
  assert.equal(diffDays("2026-05-19", "2026-05-20"), 1);
  assert.equal(diffDays("2026-05-20", "2026-05-19"), -1);
});

test("recommendMode keeps heavy topics out of late night sessions", () => {
  assert.equal(recommendMode({ issue: "anxiety", energy: 5, minutes: 8, hour: 22 }), "nightClose");
  assert.equal(recommendMode({ issue: "anxiety", energy: 5, minutes: 8, hour: 14 }), "cbtLight");
  assert.equal(recommendMode({ issue: "work", energy: 1, minutes: 8, hour: 14 }), "quick3");
});

test("calculateStats protects the two-day rule without resetting progress", () => {
  const entries = [
    createEntry({ date: "2026-05-18", modeId: "quick3", moodBefore: 40, moodAfter: 45 }),
    createEntry({ date: "2026-05-19", modeId: "gratitude", moodBefore: 50, moodAfter: 58, rescue: true })
  ];

  const stats = calculateStats(entries, "2026-05-20");
  assert.equal(stats.uniqueDays, 2);
  assert.equal(stats.last7Days, 2);
  assert.equal(stats.guard.status, "protect");
  assert.equal(stats.rescueCount, 1);
});

test("starterStep advances by unique journaling days", () => {
  const entries = [
    createEntry({ date: "2026-05-18", modeId: "quick3", moodBefore: 40, moodAfter: 45 }),
    createEntry({ date: "2026-05-18", modeId: "gratitude", moodBefore: 50, moodAfter: 58 }),
    createEntry({ date: "2026-05-19", modeId: "gratitude", moodBefore: 50, moodAfter: 58 })
  ];

  const step = starterStep(entries);
  assert.equal(step.dayNumber, 3);
  assert.equal(step.modeId, "quick3");
});

test("summarizeWeek returns the top mode and average mood delta", () => {
  const entries = [
    createEntry({ date: "2026-05-18", modeId: "quick3", moodBefore: 40, moodAfter: 45 }),
    createEntry({ date: "2026-05-19", modeId: "quick3", moodBefore: 50, moodAfter: 60 }),
    createEntry({ date: "2026-05-20", modeId: "gratitude", moodBefore: 40, moodAfter: 44 })
  ];

  const week = summarizeWeek(entries, "2026-05-20");
  assert.equal(week.topMode.id, "quick3");
  assert.equal(week.averageMoodDelta, 6.3);
});

test("sanitizeState keeps defaults and rejects malformed entries", () => {
  const state = sanitizeState({ settings: { defaultMinutes: "5" }, entries: "bad" });
  assert.equal(state.settings.defaultMinutes, 5);
  assert.deepEqual(state.entries, []);
  assert.equal(getMode("unknown").id, "quick3");
  assert.equal(makePageCode("2026-05-20", 2), "J-0520-02");
});

test("quote pool has about 400 sourced quotes and avoids repeats within a year", () => {
  assert.equal(QUOTE_POOL.length, 400);
  assert.ok(QUOTE_POOL.filter((quote) => quote.language === "ja").length >= 250);
  const seen = new Set();
  for (let day = 0; day < 365; day += 1) {
    const date = new Date(2026, 0, 1 + day);
    const iso = isoDate(date);
    const quote = quoteForDate(iso);
    assert.ok(quote.text);
    assert.ok(quote.author);
    assert.ok(quote.sourceUrl);
    assert.equal(seen.has(quote.id), false);
    seen.add(quote.id);
  }
});
