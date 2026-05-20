export const APP_VERSION = "1.0.0";

export const MODES = [
  {
    id: "quick3",
    title: "3行だけ",
    shortTitle: "3行",
    duration: 3,
    group: "starter",
    bestFor: "疲れている日、途切れそうな日",
    cue: "継続を守る最小単位",
    prompts: [
      "今日あったこと：",
      "今の気分：",
      "明日の自分に一言："
    ],
    close: "書けたら十分。続いた事実だけを残す。",
    source: "添付資料: 初心者向け3行ジャーナル"
  },
  {
    id: "fiveMinute",
    title: "5分ジャーナリング",
    shortTitle: "5分",
    duration: 5,
    group: "starter",
    bestFor: "何から書けばいいか迷う日",
    cue: "事実、感情、考えを分ける",
    prompts: [
      "今日・今、何があった？",
      "それに対して、どんな感情がある？",
      "身体にはどんな反応がある？",
      "頭の中で、どんな考えが回っている？",
      "本当はどうしたい？",
      "次にできる小さな一手は？"
    ],
    close: "最後は小さな一手で着地する。",
    source: "添付資料: 5分ジャーナリング"
  },
  {
    id: "morning",
    title: "朝の設計",
    shortTitle: "朝",
    duration: 5,
    group: "morning",
    bestFor: "出社前、今日の軸を決めたい時",
    cue: "朝は設計、夜は回収",
    prompts: [
      "今朝の体調：",
      "今朝の気分：",
      "今日の最重要タスク：",
      "今日やりすぎないこと：",
      "今日の自分への一言："
    ],
    close: "今日の勝ち筋を一つに絞る。",
    source: "添付資料: 朝テンプレート"
  },
  {
    id: "noonReset",
    title: "昼のリセット",
    shortTitle: "昼",
    duration: 4,
    group: "reset",
    bestFor: "仕事中に気持ちが乱れた時",
    cue: "感情を処理して午後へ戻る",
    prompts: [
      "今、何が起きている？",
      "どんな感情がある？",
      "本当は何を守りたい？",
      "今すぐできる一手は？",
      "これ以上考えないために何をする？"
    ],
    close: "考える範囲を今日の行動まで戻す。",
    source: "添付資料: 昼テンプレート"
  },
  {
    id: "nightClose",
    title: "夜の店じまい",
    shortTitle: "夜",
    duration: 4,
    group: "night",
    bestFor: "寝る前、考え続けるのを止めたい時",
    cue: "問題解決ではなく、明日へ預ける",
    prompts: [
      "今日できたこと：",
      "今日しんどかったこと：",
      "明日に回すこと：",
      "今夜は考えないこと：",
      "自分に一言："
    ],
    close: "重いテーマはここで閉じる。",
    source: "添付資料: 夜テンプレート"
  },
  {
    id: "gratitude",
    title: "感謝ジャーナル",
    shortTitle: "感謝",
    duration: 3,
    group: "positive",
    bestFor: "気分を少し持ち上げたい時",
    cue: "小さな良かったことを拾う",
    prompts: [
      "今日ありがたかったことを一つ：",
      "それが自分にとって助けになった理由：",
      "その余韻を一言で書くと："
    ],
    close: "無理にポジティブを作らない。小さな事実だけでよい。",
    source: "Emmons & McCullough 2003 / PAJ研究"
  },
  {
    id: "workFog",
    title: "仕事のもやもや整理",
    shortTitle: "仕事",
    duration: 7,
    group: "work",
    bestFor: "職場の違和感、会議後の引っかかり",
    cue: "事実と解釈を分離する",
    prompts: [
      "出来事：",
      "自分が引っかかった点：",
      "事実：",
      "解釈：",
      "相手に確認すべきこと：",
      "自分でコントロールできること：",
      "コントロールできないこと：",
      "次の一手："
    ],
    close: "確認することと、手放すことを分ける。",
    source: "添付資料: 仕事のもやもや整理"
  },
  {
    id: "cbtLight",
    title: "CBT思考記録",
    shortTitle: "CBT",
    duration: 8,
    group: "anxiety",
    bestFor: "不安、自己否定、極端な考え",
    cue: "考えを証拠で点検する",
    prompts: [
      "状況：何が起きた？",
      "感情：何を感じた？ 強さは0〜100で？",
      "自動思考：瞬間的に何を考えた？",
      "その考えを支持する証拠は？",
      "その考えと矛盾する証拠は？",
      "よりバランスの取れた見方は？",
      "感情の強さはどう変わった？"
    ],
    close: "ポジティブ変換ではなく、極端な解釈を中和する。",
    source: "NHS Thought record"
  },
  {
    id: "anxiety",
    title: "不安の見取り図",
    shortTitle: "不安",
    duration: 6,
    group: "anxiety",
    bestFor: "心配が連鎖している時",
    cue: "確率、対処、保留を分ける",
    prompts: [
      "何が不安？",
      "最悪の想定は？",
      "それが起きる確率は？",
      "起きた場合の対処策は？",
      "今できる予防策は？",
      "今考えても仕方ないことは？"
    ],
    close: "最後に、今日やる一つだけを選ぶ。",
    source: "添付資料: 不安テンプレート"
  },
  {
    id: "decision",
    title: "意思決定",
    shortTitle: "決める",
    duration: 8,
    group: "work",
    bestFor: "選択肢で迷っている時",
    cue: "決めることと保留することを分ける",
    prompts: [
      "迷っていること：",
      "選択肢A：",
      "選択肢B：",
      "それぞれのメリット：",
      "それぞれのリスク：",
      "自分が本当に避けたいこと：",
      "自分が本当に得たいこと：",
      "今すぐ決めるべきこと：",
      "まだ決めなくていいこと："
    ],
    close: "決断の締切を一つだけ置く。",
    source: "添付資料: 意思決定ジャーナル"
  },
  {
    id: "anger",
    title: "怒りの境界線",
    shortTitle: "怒り",
    duration: 6,
    group: "reset",
    bestFor: "怒りや悔しさが強い時",
    cue: "怒りの奥にある大事なものを見る",
    prompts: [
      "何に怒っている？",
      "本当は何を大事にされたかった？",
      "相手に期待していたことは？",
      "自分の境界線はどこか？",
      "言うべきことはあるか？",
      "言わずに手放すことは何か？"
    ],
    close: "送る前提の文章にしない。まず紙の中で完結させる。",
    source: "添付資料: 怒りのジャーナル"
  },
  {
    id: "selfCompassion",
    title: "自分責めを止める",
    shortTitle: "自分責め",
    duration: 6,
    group: "safety",
    bestFor: "自己肯定感が落ちている日",
    cue: "友人に向ける言葉へ戻す",
    prompts: [
      "今、自分にどんな厳しい言葉を向けている？",
      "その言葉を大切な友人に言うか？",
      "友人に言うなら、どう言い換えるか？",
      "今日できた最低限のことは？",
      "今の自分に必要な扱いは？"
    ],
    close: "判決ではなく、扱い方を決める。",
    source: "添付資料: セルフコンパッション"
  },
  {
    id: "weekly",
    title: "週次レビュー",
    shortTitle: "週次",
    duration: 10,
    group: "review",
    bestFor: "週末、パターンを見つける時",
    cue: "日次は書くだけ、週次だけ見返す",
    prompts: [
      "今週しんどかったこと：",
      "今週助けになったこと：",
      "来週減らしたいこと：",
      "来週増やしたいこと："
    ],
    close: "続ける型を一つ、減らす負荷を一つ決める。",
    source: "添付資料: 週次レビュー"
  }
];

export const STARTER_PLAN = [
  { from: 1, to: 3, title: "1〜3日目: 3行だけ", modeId: "quick3", goal: "ノートを開く動作を作る" },
  { from: 4, to: 6, title: "4〜6日目: 感情に名前をつける", modeId: "fiveMinute", goal: "感情と考えを分ける" },
  { from: 7, to: 7, title: "7日目: 週次レビュー", modeId: "weekly", goal: "自分に合う型を見つける" },
  { from: 8, to: 10, title: "8〜10日目: 事実と解釈", modeId: "workFog", goal: "出来事と解釈を分離する" },
  { from: 11, to: 13, title: "11〜13日目: 次の一手", modeId: "anxiety", goal: "行動へ小さく着地する" },
  { from: 14, to: 14, title: "14日目: 自分の取扱説明書", modeId: "selfCompassion", goal: "続け方を自分用に整える" }
];

export const ISSUE_OPTIONS = [
  { id: "start", label: "迷う", modeId: "quick3" },
  { id: "tired", label: "疲れた", modeId: "quick3" },
  { id: "scattered", label: "散らかる", modeId: "fiveMinute" },
  { id: "work", label: "仕事", modeId: "workFog" },
  { id: "anxiety", label: "不安", modeId: "cbtLight" },
  { id: "anger", label: "怒り", modeId: "anger" },
  { id: "decision", label: "迷い", modeId: "decision" },
  { id: "selfCriticism", label: "自分責め", modeId: "selfCompassion" },
  { id: "positive", label: "整える", modeId: "gratitude" }
];

export const GROUP_LABELS = {
  all: "すべて",
  starter: "初心者",
  morning: "朝",
  reset: "日中",
  night: "夜",
  positive: "回復",
  work: "仕事",
  anxiety: "不安",
  safety: "安全",
  review: "週次"
};

export function getMode(modeId) {
  return MODES.find((mode) => mode.id === modeId) || MODES[0];
}

export function pad(number) {
  return String(number).padStart(2, "0");
}

export function isoDate(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function dateKey(iso) {
  const [year, month, day] = iso.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

export function diffDays(fromIso, toIso) {
  return Math.round((dateKey(toIso) - dateKey(fromIso)) / 86400000);
}

export function uniqueDates(entries) {
  return [...new Set(entries.map((entry) => entry.date))].sort();
}

export function entriesForDate(entries, dateIso) {
  return entries.filter((entry) => entry.date === dateIso);
}

export function calculateStats(entries, todayIso = isoDate()) {
  const dates = uniqueDates(entries);
  const lastDate = dates.at(-1) || null;
  const daysSinceLast = lastDate ? diffDays(lastDate, todayIso) : null;
  const last7Dates = dates.filter((date) => {
    const distance = diffDays(date, todayIso);
    return distance >= 0 && distance <= 6;
  });
  const last14Dates = dates.filter((date) => {
    const distance = diffDays(date, todayIso);
    return distance >= 0 && distance <= 13;
  });
  const todayCount = entriesForDate(entries, todayIso).length;
  const rescueCount = entries.filter((entry) => entry.rescue).length;
  const rhythmPercent = Math.min(100, Math.round((last7Dates.length / 4) * 100));

  let guard = {
    status: "start",
    title: "初回セットアップ",
    detail: "今日は1行だけで開始できます。"
  };

  if (daysSinceLast === 0) {
    guard = {
      status: "done",
      title: "今日は記録済み",
      detail: "追加で書くなら、短い型にしてください。"
    };
  } else if (daysSinceLast === 1) {
    guard = {
      status: "protect",
      title: "二日空けない日",
      detail: "30秒レスキューで十分です。連続記録を守るより、再開コストを下げます。"
    };
  } else if (daysSinceLast !== null && daysSinceLast >= 2) {
    guard = {
      status: "restart",
      title: "再開日",
      detail: "空白は失敗ではありません。今日は3行だけで戻します。"
    };
  }

  return {
    totalEntries: entries.length,
    uniqueDays: dates.length,
    todayCount,
    lastDate,
    daysSinceLast,
    last7Days: last7Dates.length,
    last14Days: last14Dates.length,
    rescueCount,
    rhythmPercent,
    guard
  };
}

export function starterStep(entries) {
  const dayNumber = Math.min(uniqueDates(entries).length + 1, 14);
  const step = STARTER_PLAN.find((item) => dayNumber >= item.from && dayNumber <= item.to) || STARTER_PLAN.at(-1);
  return { ...step, dayNumber };
}

export function recommendMode({ issue = "start", energy = 3, minutes = 3, hour = new Date().getHours() } = {}) {
  if (minutes <= 1 || energy <= 1) return "quick3";
  if (hour >= 21 && ["anxiety", "anger", "work", "decision"].includes(issue)) return "nightClose";
  const option = ISSUE_OPTIONS.find((item) => item.id === issue);
  if (option) return option.modeId;
  if (hour < 10) return "morning";
  if (hour >= 19) return "nightClose";
  return "fiveMinute";
}

export function buildIfThenPlan(trigger, action) {
  const normalizedTrigger = (trigger || "夜の歯磨きが終わったら").trim();
  const normalizedAction = (action || "ノートを開いて3行だけ書く").trim();
  return `もし${normalizedTrigger}、${normalizedAction}。`;
}

export function makePageCode(dateIso, index = 1) {
  const [, month, day] = dateIso.split("-");
  return `J-${month}${day}-${pad(index)}`;
}

export function createEntry({ date = isoDate(), modeId, minutes, moodBefore, moodAfter, rescue = false, pageCode, note = "" }) {
  const mode = getMode(modeId);
  return {
    id: `${date}-${Date.now()}`,
    date,
    modeId: mode.id,
    minutes: Number(minutes || mode.duration),
    moodBefore: Number(moodBefore),
    moodAfter: Number(moodAfter),
    rescue: Boolean(rescue),
    pageCode,
    note: note.trim(),
    createdAt: new Date().toISOString()
  };
}

export function summarizeWeek(entries, todayIso = isoDate()) {
  const recent = entries.filter((entry) => {
    const distance = diffDays(entry.date, todayIso);
    return distance >= 0 && distance <= 6;
  });
  const modeCounts = recent.reduce((acc, entry) => {
    acc[entry.modeId] = (acc[entry.modeId] || 0) + 1;
    return acc;
  }, {});
  const moodDeltas = recent
    .filter((entry) => Number.isFinite(entry.moodBefore) && Number.isFinite(entry.moodAfter))
    .map((entry) => entry.moodAfter - entry.moodBefore);
  const averageMoodDelta = moodDeltas.length
    ? Math.round((moodDeltas.reduce((sum, item) => sum + item, 0) / moodDeltas.length) * 10) / 10
    : 0;
  const topModeId = Object.entries(modeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  return {
    recent,
    modeCounts,
    averageMoodDelta,
    topMode: topModeId ? getMode(topModeId) : null
  };
}

export function sanitizeState(rawState) {
  return {
    version: APP_VERSION,
    currentModeId: rawState?.currentModeId || "quick3",
    settings: {
      notebookName: rawState?.settings?.notebookName || "紙のノート",
      trigger: rawState?.settings?.trigger || "夜の歯磨きが終わったら",
      action: rawState?.settings?.action || "ノートを開いて3行だけ書く",
      defaultMinutes: Number(rawState?.settings?.defaultMinutes || 3),
      privacyMode: rawState?.settings?.privacyMode !== false
    },
    entries: Array.isArray(rawState?.entries) ? rawState.entries : []
  };
}
