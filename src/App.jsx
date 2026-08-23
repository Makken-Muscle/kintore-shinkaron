import { useState, useEffect, useMemo, useRef } from "react";

// ============ 定数 ============
const STORAGE_KEY = "kintore-shinkaron:data";
const TRUCK_KG = 700; // 軽トラ1台の最大積載量の目安

const STAGES = [
  { days: 0, name: { ja: "ガリガリ", en: "Skinny" }, desc: { ja: "風で飛ばされそう…", en: "Might blow away in the wind…" } },
  { days: 3, name: { ja: "もやし卒業", en: "Beansprout No More" }, desc: { ja: "何かが変わり始めた", en: "Something's starting to change" } },
  { days: 7, name: { ja: "一般人", en: "Regular Person" }, desc: { ja: "普通って素晴らしい", en: "Average is beautiful" } },
  { days: 12, name: { ja: "引き締まりボディ", en: "Toned Body" }, desc: { ja: "服の上からでも分かる", en: "Visible even through clothes" } },
  { days: 20, name: { ja: "細マッチョ", en: "Lean & Ripped" }, desc: { ja: "海に行きたくなってきた", en: "Feeling like hitting the beach" } },
  { days: 30, name: { ja: "マッチョ", en: "Muscular" }, desc: { ja: "ドアを横向きで通り始めた", en: "Turning sideways through doorways" } },
  { days: 45, name: { ja: "ゴリマッチョ伝説", en: "Legendary Beast" }, desc: { ja: "もはや歩く重機", en: "Basically walking heavy machinery" } },
];

// 掛け声称号（獲得時はjaを正準として保存し、表示はindex対応で言語切替）
const SHOUT_TITLES = {
  ja: [
    "肩にちっちゃい重機乗せてんのかい！",
    "キレてる！キレてるよ！",
    "背中に鬼が宿ってる！",
    "腹筋6LDKかい！",
    "大胸筋が歩いてる！",
    "冷蔵庫かと思ったら大胸筋！",
    "そこで会ったが百年目、ナイスバルク！",
    "ケツがデカすぎて日陰ができてるよ！",
    "土台が違う、土台が！",
    "仕上がってるよ！仕上がってる！",
    "腕が太すぎて空気も逃げ出す！",
    "デカイよ！他が見えない！",
    "筋肉のカーテンコールだ！",
    "背中でクリスマスツリー育ててんのかい！",
    "二頭筋が自慢の腕時計だ！",
    "三角筋が尖りすぎて危ない！",
    "脚が太すぎてジーンズが泣いてる！",
    "広背筋が翼みたいだ！",
    "腹斜筋が迷路になってる！",
    "僧帽筋がマウント富士だ！",
    "前腕が太すぎて握手できない！",
    "ラットがV字すぎて羨ましい！",
    "スクワットの賜物、最高だ！",
    "ベンチプレスの化身が来た！",
    "デッドリフトで地面が震えた！",
    "プロテインより筋肉が濃い！",
    "鏡に映るのは筋肉だけ！",
    "限界突破の形が見える！",
    "筋肉が筋肉を呼んでる！",
  ],
  en: [
    "Are those tiny bulldozers on your shoulders?!",
    "You're shredded! So shredded!",
    "There's a demon living in your back!",
    "Those abs have six spacious rooms!",
    "Your pecs are walking on their own!",
    "Thought it was a fridge—turns out it's your chest!",
    "Caught you at last—nice bulk!",
    "Your glutes are casting a shadow!",
    "The foundation is different—the foundation!",
    "You're peaked! Absolutely peaked!",
    "Arms so huge the air runs away!",
    "So big I can't see anything else!",
    "It's a curtain call of muscle!",
    "Growing a Christmas tree on your back?!",
    "Your biceps are the finest wristwatch!",
    "Those delts are dangerously sharp!",
    "Legs so thick your jeans are crying!",
    "Your lats are like wings!",
    "Your obliques are a maze!",
    "Your traps are Mount Fuji!",
    "Forearms too thick to shake hands!",
    "That V-taper is enviable!",
    "A gift of the squat—magnificent!",
    "The incarnation of the bench press has arrived!",
    "The ground shook from your deadlift!",
    "Denser than protein itself!",
    "All the mirror shows is muscle!",
    "I can see you breaking your limits!",
    "Muscle is calling to muscle!",
  ],
};

// 種目プリセット（keyを正準値としてログに保存、表示ラベルのみ言語切替）
const EXERCISE_PRESETS = [
  { key: "ベンチプレス", ja: "ベンチプレス", en: "Bench Press" },
  { key: "スクワット", ja: "スクワット", en: "Squat" },
  { key: "デッドリフト", ja: "デッドリフト", en: "Deadlift" },
  { key: "ショルダープレス", ja: "ショルダープレス", en: "Shoulder Press" },
  { key: "ラットプルダウン", ja: "ラットプルダウン", en: "Lat Pulldown" },
  { key: "アームカール", ja: "アームカール", en: "Arm Curl" },
  { key: "レッグプレス", ja: "レッグプレス", en: "Leg Press" },
  { key: "懸垂", ja: "懸垂", en: "Pull-up" },
  { key: "腹筋", ja: "腹筋", en: "Ab Crunch" },
];

const HELI_KG = 2000; // ヘリコプター1機の重量目安（2t）

// HPS 6週間プログラム（月:H 筋肥大 / 水:P パワー / 金:S 筋力）
const DAY_TYPES = {
  H: { key: "H", name: { ja: "筋肥大", en: "Hypertrophy" }, color: "#F05C3D", tip: { ja: "重量より「効かせる」意識。ネガティブ動作をゆっくり。", en: "Focus on feeling the muscle over lifting heavy. Lower slowly on the negative." } },
  P: { key: "P", name: { ja: "パワー", en: "Power" }, color: "#3DC98B", tip: { ja: "全力スピードで爆発的に挙げる。潰れる手前で必ず止める。", en: "Lift explosively at full speed. Always stop just before failure." } },
  S: { key: "S", name: { ja: "筋力", en: "Strength" }, color: "#5B9BFF", tip: { ja: "高重量ゾーン。ウォームアップとセーフティバーを忘れずに。", en: "Heavy-weight zone. Don't skip warm-ups and safety bars." } },
};
const HPS_PROGRAM = [
  { week: 1, days: [
    { day: "月曜日", type: "H", pct: 0.75, reps: "8回", sets: 5, interval: "5分" },
    { day: "水曜日", type: "P", pct: 0.80, reps: "1回", sets: 5, interval: "爆発的挙上・3分" },
    { day: "金曜日", type: "S", pct: 0.85, reps: "限界まで", sets: 3, interval: "5分" },
  ]},
  { week: 2, days: [
    { day: "月曜日", type: "H", pct: 0.75, reps: "8回", sets: 5, interval: "5分" },
    { day: "水曜日", type: "P", pct: 0.80, reps: "1回", sets: 5, interval: "爆発的挙上・3分" },
    { day: "金曜日", type: "S", pct: 0.875, reps: "限界まで", sets: 3, interval: "5分" },
  ]},
  { week: 3, days: [
    { day: "月曜日", type: "H", pct: 0.75, reps: "8回", sets: 5, interval: "5分" },
    { day: "水曜日", type: "P", pct: 0.85, reps: "1回", sets: 4, interval: "爆発的挙上・3分" },
    { day: "金曜日", type: "S", pct: 0.90, reps: "限界まで", sets: 3, interval: "5分" },
  ]},
  { week: 4, days: [
    { day: "月曜日", type: "H", pct: 0.75, reps: "8回", sets: 5, interval: "5分" },
    { day: "水曜日", type: "P", pct: 0.85, reps: "1回", sets: 4, interval: "爆発的挙上・3分" },
    { day: "金曜日", type: "S", pct: 0.90, reps: "限界まで", sets: 3, interval: "5分" },
  ]},
  { week: 5, days: [
    { day: "月曜日", type: "H", pct: 0.75, reps: "8回", sets: 5, interval: "5分" },
    { day: "水曜日", type: "P", pct: 0.90, reps: "1回", sets: 4, interval: "爆発的挙上・3分" },
    { day: "金曜日", type: "S", pct: 0.925, reps: "限界まで", sets: 3, interval: "5分" },
  ]},
  { week: 6, days: [
    { day: "月曜日", type: "H", pct: 0.75, reps: "8回", sets: 5, interval: "5分" },
    { day: "水曜日", type: "P", pct: 0.90, reps: "1回", sets: 5, interval: "爆発的挙上・3分" },
    { day: "金曜日", type: "S", pct: 0.95, reps: "限界まで", sets: 3, interval: "5分" },
  ]},
];

// キャラのひとことセリフ
const CHARA_QUOTES = {
  ja: [
    "ナイスバルク！！！", "イエス筋肉！！！", "キレてる！キレてる！",
    "パワーーーー！！", "筋肉は裏切らない！", "今日も追い込むぞ！",
    "プロテインの時間だ！", "デカくなってる実感ある…！", "ハッ！（ポージング）",
    "僧帽筋が喜んでる！", "超回復こそ正義！", "限界の1歩先へ！",
  ],
  en: [
    "Nice bulk!!!", "Yes, muscle!!!", "Shredded! Shredded!",
    "Powerrrr!!", "Muscle never betrays you!", "Let's crush it again today!",
    "Protein time!", "I can feel myself getting bigger…!", "Hah! (posing)",
    "My traps are happy!", "Supercompensation is justice!", "One step past the limit!",
  ],
};

// コラム一覧（本体は public/ 内の静的HTML。ここはアプリ内の導線用）
const ARTICLES = [
  { href: "/guide.html", tag: { ja: "アプリの使い方", en: "How to use" }, title: { ja: "筋トレ進化論の使い方ガイド", en: "Muscle Evolution — User Guide" }, summary: { ja: "記録・進化・軽トラ換算・HPS計画まで全機能を解説。", en: "A full walkthrough of every feature of the app." } },
  { href: "/hps-method.html", tag: { ja: "トレーニング理論", en: "Training theory" }, title: { ja: "HPS法とは — 筋肥大・パワー・筋力の6週間プログラム", en: "What is the HPS method? A 6-week program" }, summary: { ja: "H/P/Sの3刺激を1週間で回す6週間プログラムを解説。", en: "Cycle hypertrophy, power and strength within one week." } },
  { href: "/big3-basics.html", tag: { ja: "初心者向け", en: "For beginners" }, title: { ja: "初心者のためのBIG3入門", en: "BIG3 basics for beginners" }, summary: { ja: "ベンチ・スクワット・デッドの基本フォームと重量設定。", en: "Form and starting weights for the big three lifts." } },
  { href: "/protein-nutrition.html", tag: { ja: "栄養・食事", en: "Nutrition" }, title: { ja: "タンパク質・食事の基本", en: "Protein & nutrition basics" }, summary: { ja: "1日の摂取量の目安、PFCバランス、食事タイミングを解説。", en: "Daily protein targets, PFC balance and meal timing." } },
  { href: "/recovery-sleep.html", tag: { ja: "休養・回復", en: "Recovery" }, title: { ja: "超回復と休養・睡眠の科学", en: "Recovery, rest & sleep" }, summary: { ja: "筋肉は休養中に育つ。回復日数と睡眠の重要性を解説。", en: "Muscle grows during rest — recovery times and sleep." } },
  { href: "/progressive-overload.html", tag: { ja: "トレーニング理論", en: "Training theory" }, title: { ja: "停滞期の抜け方 — 漸進性過負荷", en: "Breaking plateaus — progressive overload" }, summary: { ja: "成長が止まる原因と、負荷を高める7つの方法。", en: "Why progress stalls and 7 ways to add load." } },
  { href: "/bodyweight-training.html", tag: { ja: "初心者向け", en: "For beginners" }, title: { ja: "自宅でできる自重トレ入門", en: "Home bodyweight training" }, summary: { ja: "器具なしの基本4種目と初心者向け週間メニュー。", en: "Four no-equipment basics and a weekly menu." } },
];

// ============ デザイントークン（重厚版：金属背景 ＋ 落下の衝撃） ============
const T = {
  bg: "#07080A",
  // クロスハッチの金属テクスチャ背景（トップ光沢＋斜め45°ヘアライン×2＋ベース放射グラデ）
  pageGrad: "radial-gradient(110% 50% at 50% -6%, rgba(255,255,255,.09) 0%, rgba(255,255,255,0) 60%), repeating-linear-gradient(45deg, rgba(255,255,255,.05) 0 2px, rgba(0,0,0,.30) 2px 4px, rgba(255,255,255,0) 4px 26px), repeating-linear-gradient(-45deg, rgba(255,255,255,.045) 0 2px, rgba(0,0,0,.30) 2px 4px, rgba(255,255,255,0) 4px 26px), radial-gradient(120% 70% at 50% 0%, #24282E 0%, #14171C 52%, #08090B 100%)",
  surface: "#15171B",
  // ヘアライン金属パネル（走る光沢と組み合わせて使用）
  panel: "linear-gradient(160deg,#23262B 0%,#15171B 42%,#0D0F12 100%)",
  surface2: "#1A1D21",
  surface3: "#22262B",
  line: "#2E3238",
  line2: "#3A3F46",
  ink: "#F4F4F2",
  sub: "#9AA1AA",
  sub2: "#6E757E",
  red: "#E4482A",
  redBright: "#F05C3D",
  redDeep: "#B9331A",
  redContainer: "rgba(228,72,42,0.16)",
  yellow: "#E8C33A",
  yellowBright: "#FFDD6B",
  green: "#3DC98B",
  blue: "#5B9BFF",
  body: "'Zen Kaku Gothic New', 'Hiragino Sans', sans-serif",
  display: "'Dela Gothic One', 'Zen Kaku Gothic New', 'Hiragino Sans', sans-serif",
  num: "'Anton', 'Zen Kaku Gothic New', sans-serif",
  cond: "'Barlow Condensed', sans-serif",
  // 金属に彫り込んだ見出しの影
  emboss: "0 2px 0 #0A0B0D, 0 3px 6px rgba(0,0,0,.6), 0 -1px 0 rgba(255,255,255,.1)",
  // 凹んだトラック（バーの溝）
  groove: "inset 0 1px 3px rgba(0,0,0,.8)",
};

// ============ ユーティリティ ============
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const fmtDate = (s) => {
  const [, m, d] = s.split("-");
  return `${Number(m)}/${Number(d)}`;
};
const addDays = (dateStr, n) => {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const roundPlate = (kg) => Math.max(2.5, Math.round(kg / 2.5) * 2.5);

// ============ ストレージ（Claude内でも公開Webでも動く二段構え） ============
// ・Claudeのアーティファクト内 → window.storage
// ・WebアプリとしてVercel等に公開 → 各ユーザーのブラウザのlocalStorage（端末内に個人ごと保存）
const hasClaudeStorage = () =>
  typeof window !== "undefined" && window.storage && typeof window.storage.get === "function";

async function storageGet(key) {
  if (hasClaudeStorage()) {
    try {
      const r = await window.storage.get(key);
      return r?.value ?? null;
    } catch { return null; } // 未保存キー
  }
  try { return window.localStorage.getItem(key); } catch { return null; }
}

async function storageSet(key, value) {
  if (hasClaudeStorage()) {
    try { await window.storage.set(key, value); return; }
    catch (e) { console.error("保存に失敗しました", e); return; }
  }
  try { window.localStorage.setItem(key, value); }
  catch (e) { console.error("保存に失敗しました", e); }
}

// ============ 部位判定 ============
const ALL_PARTS = ["chest", "shoulder", "arm", "back", "leg", "abs"];
const PART_LABELS = {
  ja: { chest: "胸", shoulder: "肩", arm: "腕", back: "背中", leg: "脚", abs: "腹筋" },
  en: { chest: "Chest", shoulder: "Shoulders", arm: "Arms", back: "Back", leg: "Legs", abs: "Abs" },
};
const PART_COLORS = { chest: "#F05C3D", shoulder: "#E8C33A", arm: "#B478E6", back: "#5B9BFF", leg: "#3DC98B", abs: "#6FCEDC" };
// 日本語・英語どちらの種目名でも部位を判定できるよう英語キーワードも追加（iフラグ）
const PART_RULES = [
  { re: /デッド|deadlift/i, parts: [["back", 0.5], ["leg", 0.5]] },
  { re: /腹|クランチ|プランク|アブ|レッグレイズ|ab\s*crunch|crunch|plank|sit-?up|leg\s*raise/i, parts: [["abs", 1]] },
  { re: /ベンチ|チェスト|フライ|腕立て|プッシュアップ|胸|bench|chest|fly|push-?up/i, parts: [["chest", 1]] },
  { re: /ラット|プル|懸垂|チンニング|ロウ|背|lat|pulldown|pull-?up|chin-?up|row/i, parts: [["back", 1]] },
  { re: /ショルダー|レイズ|オーバーヘッド|肩|shoulder|overhead|lateral\s*raise|delt/i, parts: [["shoulder", 1]] },
  { re: /スクワット|レッグ|ランジ|カーフ|脚|尻|ヒップ|squat|leg\s*press|lunge|calf|glute|hip/i, parts: [["leg", 1]] },
  { re: /カール|二頭|三頭|トライセ|ディップ|プレスダウン|腕|curl|bicep|tricep|dip|pushdown|arm/i, parts: [["arm", 1]] },
];
function classifyExercise(name) {
  for (const r of PART_RULES) if (r.re.test(name)) return r.parts;
  return ALL_PARTS.map((p) => [p, 1 / 6]); // 不明な種目は全身に少しずつ
}
// 記録に部位情報があればそれを優先（マイ種目は選んだ部位に均等配分）
function partsOfLog(log) {
  if (Array.isArray(log.parts) && log.parts.length > 0) {
    return log.parts.map((p) => [p, 1 / log.parts.length]);
  }
  return classifyExercise(log.exercise);
}

// ============ 多言語（i18n） ============
const LANGS = ["ja", "en"];
const detectLang = () => {
  try { return (navigator.language || "").toLowerCase().startsWith("ja") ? "ja" : "en"; }
  catch { return "ja"; }
};
// プリセット種目の表示名（保存値keyは日本語のまま。表示のみ言語切替）
const exName = (name, lang) => {
  const p = EXERCISE_PRESETS.find((e) => e.key === name);
  return p ? p[lang] : name; // マイ種目はユーザー入力のまま
};
// 称号（保存はja正準。表示のみ対応indexで切替、無ければ原文）
const shoutText = (title, lang) => {
  const i = SHOUT_TITLES.ja.indexOf(title);
  return i >= 0 ? SHOUT_TITLES[lang][i] : title;
};
// HPSプログラムの曜日・回数・インターバル表示（保存値は日本語正準のまま）
const DAY_NAME = { "月曜日": "Monday", "水曜日": "Wednesday", "金曜日": "Friday" };
const hpsDay = (d, lang) => (lang === "en" ? (DAY_NAME[d] || d) : d);
const hpsReps = (r, lang) => {
  if (lang !== "en") return r;
  if (r === "限界まで") return "To failure";
  const m = r.match(/^(\d+)回$/);
  if (m) return `${m[1]} ${m[1] === "1" ? "rep" : "reps"}`;
  return r;
};
const hpsInterval = (v, lang) => {
  if (lang !== "en") return v;
  if (v === "爆発的挙上・3分") return "Explosive · 3 min";
  const m = v.match(/^(\d+)分$/);
  if (m) return `${m[1]} min`;
  return v;
};
const isFailureDay = (r) => r === "限界まで";

const TXT = {
  ja: {
    loading: "読み込み中…💪",
    tabLog: "記録", tabChara: "進化", tabTruck: "軽トラ", tabHeli: "ヘリ", tabPlan: "計画", tabGoal: "目標", tabColumns: "コラム", tabSettings: "設定",
    colHeading: "コラム", colIntro: "トレーニングに役立つ読み物", readArticle: "読む →",
    goalCardLabel: "目標", tapToSetGoal: "タップで目標を設定", goalOpenAria: "目標を開く",
    langLabel: "言語 / Language",
    // 記録
    streak: "ストリーク", streakUnit: "回連続", streakNote: "中2日以内なら継続",
    thisWeek: "今週", dayUnit: "日", weekNote: "月曜はじまり",
    intervalTimer: "インターバルタイマー", pause: "⏸ 一時停止", resume: "▶ 再開", reset: "↺ リセット",
    timerHint: "HPSの目安: 筋肥大60〜90秒 ／ パワー3分（爆発的挙上）／ 筋力5分",
    recordTitle: "今日のトレーニングを記録",
    grpBasic: "基本種目", grpCustom: "マイ種目", addNewEx: "＋ 新しい種目を追加",
    exNamePlaceholder: "種目名（例: インクラインベンチ）",
    targetParts: "効かせる部位（複数選択できます）",
    exDup: "同じ名前の種目がすでにあります",
    addToMyEx: "この種目をマイ種目に追加",
    addExNote: "追加した種目はこの端末だけに保存され、選んだ部位の成長に反映されます。",
    fWeight: "重量", fReps: "レップ", fSets: "セット", phKg: "kg", phReps: "回", phSets: "セット",
    recordBtn: "記録する",
    myExTitle: "💪 マイ種目", myExNote: "削除しても、過去の記録とキャラの成長はそのまま残ります。",
    emptyLogs1: "まだ記録がありません。", emptyLogs2: "最初の1セットが進化の始まりです。",
    uKg: "kg", uReps: "回", uSets: "セット", delAria: "削除", delMyExAria: "マイ種目を削除",
    // 進化
    tapToSpeak: "👆 タップすると喋ります",
    trainingDays: "トレーニング日数",
    growthTitle: "部位別の成長度",
    growthNote: "記録した種目の部位だけが育ちます。偏るとキャラも偏った体型に…！",
    titlesTitle: "獲得した称号（掛け声コレクション）",
    noTitles: "まだ称号がありません。「目標」タブで2週間目標を達成すると、大会の掛け声がもらえます！",
    // 軽トラ
    upBanner1: "軽トラ100台を制覇！", upBanner2: "次のステージ「ヘリコプター（2t/機）」に挑戦できます。",
    change: "変更する",
    volTruck: "総挙上量", volHeli: "ヘリ換算の挙上量",
    vNameTruck: "軽トラ", vNameHeli: "ヘリコプター", vUnitTruck: "台", vUnitHeli: "機",
    vSpecTruck: `最大積載${TRUCK_KG}kg`, vSpecHeli: `${HELI_KG / 1000}t/機`,
    nextTruck: "次の1台まで", nextHeli: "次の1機まで",
    pileTruck: "積み上げた軽トラの山", pileHeli: "積み上げたヘリの山",
    // 計画
    planTitle: "HPS 6週間プログラム",
    rmBench: "ベンチ", rmSquat: "スクワット", rmDead: "デッド", rm1: "1RM",
    makePlan: "6週間の計画を作る", remakePlan: "計画を作り直す",
    weightTapHint: "👆 重量をタップすると、その場で実績を記録できます",
    planFootnote: "※ 週が進むほど水曜・金曜の強度が上がります。体調に合わせて重量は無理なく調整し、フォームが崩れたらその日は終了してください。",
    setsUnit: "セット",
    // 目標
    setGoalTitle: "2週間目標を立てる",
    goalStart: "目標スタート", activeGoal: "挑戦中の目標",
    finishGoal: "この期間を締めて、次の目標へ", pastGoals: "過去の挑戦",
    achievedTag: "達成 🏆", failedTag: "未達",
    // 設定
    backupTitle: "データのバックアップ",
    backupIntro1: "記録はこの端末のブラウザ内だけに保存されています。機種変更やブラウザのデータ消去で消えるため、",
    backupIntro2: "ときどき書き出して保管", backupIntro3: "しておくと安心です。別の端末へ引き継ぐときもこのファイルを使います。",
    exportBtn: "⬇ バックアップを書き出す（JSON）", importBtn: "⬆ バックアップから復元する",
    ioExportOk: "バックアップを書き出しました。", ioExportErr: "書き出しに失敗しました。",
    ioImportErr: "読み込めませんでした。正しいバックアップファイルか確認してください。",
    ioReadErr: "ファイルの読み込みに失敗しました。", ioRestored: "データを復元しました。",
    currentData: "現在のデータ",
    dLogs: "記録件数", dDays: "トレーニング日数", dMyEx: "マイ種目", dTitles: "獲得した称号", dGoals: "過去の目標挑戦",
    uItems: "件", uCount: "個", uTimes: "回",
    restoreWarn1: "※ 復元すると今の記録はファイルの内容で", restoreWarn2: "すべて置き換わります", restoreWarn3: "。大事な記録がある場合は、先にバックアップを書き出しておくことをおすすめします。",
    // フッター
    fGuide: "使い方ガイド", fColumns: "コラム", fContact: "お問い合わせ", fPrivacy: "プライバシーポリシー",
    // ダイアログ／トースト
    prTitle: "自己ベスト更新！！", tapClose: "タップして閉じる",
    timerDone: "🔔 インターバル終了！次のセット！",
    upTitle: "🚁 ヘリコプターに変更しますか？", cancel: "キャンセル",
    importTitle: "このデータで復元しますか？",
    iRecords: "記録件数", iTitles: "称号", iGoals: "目標履歴", restoreBtn: "復元する",
    delTitle: "この記録を削除しますか？", delIrreversible: "削除すると元に戻せません。", delBtn: "削除する",
    planSavedToast: "✅ 記録しました！「記録」タブで確認できます",
    delExTitle: "このマイ種目を削除しますか？",
    delExNote: "種目の選択肢から消えるだけで、この種目で記録したトレーニングとキャラの成長は残ります。",
    celebTitle: "🏆 目標達成！称号獲得 🏆",
  },
  en: {
    loading: "Loading…💪",
    tabLog: "Record", tabChara: "Evolve", tabTruck: "Trucks", tabHeli: "Heli", tabPlan: "Plan", tabGoal: "Goal", tabColumns: "Columns", tabSettings: "Settings",
    colHeading: "Columns", colIntro: "Reading to help your training", readArticle: "Read →",
    goalCardLabel: "Goal", tapToSetGoal: "Tap to set a goal", goalOpenAria: "Open goal",
    langLabel: "言語 / Language",
    streak: "Streak", streakUnit: "in a row", streakNote: "Continues within a 3-day gap",
    thisWeek: "This Week", dayUnit: "days", weekNote: "Starts Monday",
    intervalTimer: "Interval Timer", pause: "⏸ Pause", resume: "▶ Resume", reset: "↺ Reset",
    timerHint: "HPS guide: Hypertrophy 60–90s / Power 3 min (explosive) / Strength 5 min",
    recordTitle: "Log today's workout",
    grpBasic: "Basic exercises", grpCustom: "My exercises", addNewEx: "＋ Add a new exercise",
    exNamePlaceholder: "Exercise name (e.g. Incline Bench)",
    targetParts: "Target muscles (select multiple)",
    exDup: "An exercise with that name already exists",
    addToMyEx: "Add to My Exercises",
    addExNote: "Added exercises are saved on this device only and count toward the selected muscles' growth.",
    fWeight: "Weight", fReps: "Reps", fSets: "Sets", phKg: "kg", phReps: "reps", phSets: "sets",
    recordBtn: "Record",
    myExTitle: "💪 My Exercises", myExNote: "Deleting one keeps your past logs and character growth intact.",
    emptyLogs1: "No logs yet.", emptyLogs2: "Your first set is the start of your evolution.",
    uKg: "kg", uReps: " reps", uSets: " sets", delAria: "Delete", delMyExAria: "Delete my exercise",
    tapToSpeak: "👆 Tap to make it speak",
    trainingDays: "Training days",
    growthTitle: "Muscle growth by area",
    growthNote: "Only the muscles you train grow. Skew your training and your character gets lopsided…!",
    titlesTitle: "Titles earned (cheer collection)",
    noTitles: "No titles yet. Clear a 2-week goal in the Goal tab to earn a contest cheer!",
    upBanner1: "100 kei trucks conquered!", upBanner2: "Unlock the next stage: Helicopter (2t each).",
    change: "Upgrade",
    volTruck: "TOTAL LIFTED VOLUME", volHeli: "HELI-CONVERTED VOLUME",
    vNameTruck: "kei truck", vNameHeli: "helicopter", vUnitTruck: "", vUnitHeli: "",
    vSpecTruck: `max load ${TRUCK_KG}kg`, vSpecHeli: `${HELI_KG / 1000}t each`,
    nextTruck: "To next truck", nextHeli: "To next chopper",
    pileTruck: "Your tower of kei trucks", pileHeli: "Your fleet of helicopters",
    planTitle: "HPS 6-Week Program",
    rmBench: "Bench", rmSquat: "Squat", rmDead: "Deadlift", rm1: "1RM",
    makePlan: "Create 6-week plan", remakePlan: "Rebuild plan",
    weightTapHint: "👆 Tap a weight to log your actual set on the spot",
    planFootnote: "* Wednesday and Friday intensity rises as the weeks progress. Adjust weights to how you feel, and stop for the day if your form breaks down.",
    setsUnit: "sets",
    setGoalTitle: "Set a 2-week goal",
    goalStart: "Start goal", activeGoal: "Active goal",
    finishGoal: "Close this period and start the next goal", pastGoals: "Past challenges",
    achievedTag: "Achieved 🏆", failedTag: "Missed",
    backupTitle: "Data backup",
    backupIntro1: "Your logs are stored only in this device's browser. They can be lost when you change devices or clear browser data, so ",
    backupIntro2: "export and keep a copy now and then", backupIntro3: ". Use this file to move your data to another device too.",
    exportBtn: "⬇ Export backup (JSON)", importBtn: "⬆ Restore from backup",
    ioExportOk: "Backup exported.", ioExportErr: "Export failed.",
    ioImportErr: "Couldn't read the file. Please make sure it's a valid backup.",
    ioReadErr: "Failed to read the file.", ioRestored: "Data restored.",
    currentData: "Current data",
    dLogs: "Logs", dDays: "Training days", dMyEx: "My exercises", dTitles: "Titles earned", dGoals: "Past goal attempts",
    uItems: "", uCount: "", uTimes: "",
    restoreWarn1: "* Restoring will ", restoreWarn2: "replace all your current logs", restoreWarn3: " with the file's contents. If you have important logs, export a backup first.",
    fGuide: "Guide", fColumns: "Columns", fContact: "Contact", fPrivacy: "Privacy Policy",
    prTitle: "New personal best!!", tapClose: "Tap to close",
    timerDone: "🔔 Rest over! Next set!",
    upTitle: "🚁 Upgrade to a helicopter?", cancel: "Cancel",
    importTitle: "Restore with this data?",
    iRecords: "Logs", iTitles: "Titles", iGoals: "Goal history", restoreBtn: "Restore",
    delTitle: "Delete this log?", delIrreversible: "This can't be undone.", delBtn: "Delete",
    planSavedToast: "✅ Logged! Check it in the Record tab.",
    delExTitle: "Delete this exercise?",
    delExNote: "It's only removed from the picker—the workouts you logged with it and your character growth remain.",
    celebTitle: "🏆 Goal cleared! Title earned 🏆",
  },
};

// ============ キャラクターSVG（部位別成長・自然な筋肥大） ============
const midPt = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
function smoothClosedPath(pts) {
  const n = pts.length;
  let m = midPt(pts[0], pts[1]);
  let d = `M ${m[0].toFixed(1)} ${m[1].toFixed(1)}`;
  for (let i = 1; i <= n; i++) {
    const p = pts[i % n];
    const m2 = midPt(p, pts[(i + 1) % n]);
    d += ` Q ${p[0].toFixed(1)} ${p[1].toFixed(1)} ${m2[0].toFixed(1)} ${m2[1].toFixed(1)}`;
  }
  return d + " Z";
}
// 中心線(points)と各点の太さ(widths)から、筋肉のふくらみを持つ四肢シルエットを生成
function limbPath(points, widths) {
  const L = [], R = [];
  for (let i = 0; i < points.length; i++) {
    const prev = points[Math.max(0, i - 1)];
    const next = points[Math.min(points.length - 1, i + 1)];
    const dx = next[0] - prev[0], dy = next[1] - prev[1];
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    const w = widths[i] / 2;
    L.push([points[i][0] + nx * w, points[i][1] + ny * w]);
    R.push([points[i][0] - nx * w, points[i][1] - ny * w]);
  }
  return smoothClosedPath([...L, ...R.reverse()]);
}

function MuscleCharacter({ levels }) {
  const { chest, shoulder, arm, back, leg, abs } = levels;
  const mAvg = (chest + shoulder + arm + back + leg + abs) / 6;
  const skin = "#F1C27D";
  const skinDark = "#C98E4B";
  const cx = 100;
  const shoulderY = 82;

  const shX = Math.max((44 + shoulder * 52 + back * 14) / 2, 23);
  const torsoTop = Math.min(shX - 2, 20 + back * 20 + chest * 8);
  const waistW = 27 + abs * 7 + back * 3;
  const hipW = waistW + 7 + leg * 6;
  const neckW = 10 + back * 6 + shoulder * 4;
  const deltR = 6 + shoulder * 12;

  // --- 腕（ダブルバイセップス）: 二頭筋の山→肘で絞る→前腕のふくらみ→手首 ---
  const elbow = [shX + 17 + arm * 11, shoulderY - 8 - arm * 9];
  const wrist = [shX + 5 + arm * 5, 45 - arm * 7];
  const upperMid = [(shX + elbow[0]) / 2, (shoulderY + elbow[1]) / 2 - (2 + arm * 5)];
  const foreMid = [(elbow[0] + wrist[0]) / 2 + (1 + arm * 2), (elbow[1] + wrist[1]) / 2];
  const armPts = (s) => [
    [cx + s * shX, shoulderY],
    [cx + s * upperMid[0], upperMid[1]],
    [cx + s * elbow[0], elbow[1]],
    [cx + s * foreMid[0], foreMid[1]],
    [cx + s * wrist[0], wrist[1]],
  ];
  const armWidths = [10 + arm * 9, 11 + arm * 21, 8 + arm * 7, 8 + arm * 12, 5.5 + arm * 3];

  // --- 脚: 大腿のふくらみ→膝で絞る→ふくらはぎ→足首 ---
  const legTop = 146;
  const legPts = (s) => {
    const hx = cx + s * hipW * 0.3;
    const lean = s * (2 + leg * 5);
    return [[hx, legTop], [hx + lean * 0.9, 165], [hx + lean, 183], [hx + lean, 194], [hx + lean, 207]];
  };
  const legWidths = [13 + leg * 13, 12 + leg * 17, 8.5 + leg * 6, 8 + leg * 12, 6 + leg * 3];
  const footX = (s) => legPts(s)[4][0] + s * 3;

  return (
    <svg viewBox="0 0 200 240" style={{ width: "100%", maxWidth: 230, display: "block", margin: "0 auto" }}>
      <defs>
        <radialGradient id="spot" cx="50%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#262A30" />
          <stop offset="55%" stopColor="#121417" />
          <stop offset="100%" stopColor="#0A0B0D" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="200" height="240" fill="url(#spot)" />
      <polygon points="70,0 130,0 168,215 32,215" fill="#E8C33A" opacity="0.06" />
      <rect x="14" y="212" width="172" height="4" fill="#08090A" />
      <ellipse cx="100" cy="216" rx={40 + (shoulder + leg) * 14} ry="7" fill="rgba(0,0,0,0.5)" />

      {/* 脚（大腿→膝→ふくらはぎの自然なライン） */}
      {[-1, 1].map((s) => <path key={s} d={limbPath(legPts(s), legWidths)} fill={skin} />)}
      {/* 内もものライン */}
      {leg > 0.35 && [-1, 1].map((s) => (
        <path key={s} d={`M ${cx + s * hipW * 0.16} 152 Q ${cx + s * hipW * 0.2} 168 ${cx + s * (hipW * 0.3 + 2)} 180`}
          stroke={skinDark} strokeWidth="1.5" fill="none" opacity={leg * 0.5} />
      ))}
      {/* ふくらはぎの影 */}
      {leg > 0.4 && [-1, 1].map((s) => (
        <path key={s} d={`M ${legPts(s)[3][0] - s * 3} 189 Q ${legPts(s)[3][0] - s * 5} 195 ${legPts(s)[4][0] - s * 2} 202`}
          stroke={skinDark} strokeWidth="1.5" fill="none" opacity={leg * 0.5} />
      ))}
      {/* 足 */}
      {[-1, 1].map((s) => <ellipse key={s} cx={footX(s)} cy="209" rx={7 + leg * 2} ry="4" fill={skinDark} />)}

      {/* 僧帽筋（首→肩のなだらかな盛り上がり） */}
      <path d={`M ${cx - shX * 0.85} ${shoulderY - 4} Q ${cx} ${58 - back * 7 - shoulder * 3} ${cx + shX * 0.85} ${shoulderY - 4} Z`} fill={skin} />

      {/* 胴体（広背筋のカーブで逆三角形に） */}
      <path
        d={`M ${cx - torsoTop} ${shoulderY - 6}
            Q ${cx} ${shoulderY - 12 - back * 4} ${cx + torsoTop} ${shoulderY - 6}
            Q ${cx + torsoTop + back * 10} 104 ${cx + waistW / 2} 138
            Q ${cx + hipW / 2} 146 ${cx + hipW * 0.42} 152
            Q ${cx} 158 ${cx - hipW * 0.42} 152
            Q ${cx - hipW / 2} 146 ${cx - waistW / 2} 138
            Q ${cx - torsoTop - back * 10} 104 ${cx - torsoTop} ${shoulderY - 6} Z`}
        fill={skin}
      />

      {/* 短パン */}
      <path d={`M ${cx - hipW / 2} 137 Q ${cx} 141 ${cx + hipW / 2} 137 L ${cx + hipW / 2 + 2} 160 Q ${cx + hipW * 0.25} 164 ${cx + 3} 161 L ${cx} 153 L ${cx - 3} 161 Q ${cx - hipW * 0.25} 164 ${cx - hipW / 2 - 2} 160 Z`} fill="#E4482A" />

      {/* 大胸筋（下縁の影つき） */}
      {chest > 0.15 && (
        <g>
          {[-1, 1].map((s) => (
            <g key={s}>
              <ellipse cx={cx + s * torsoTop * 0.45} cy={shoulderY + 15} rx={torsoTop * 0.44} ry={5 + chest * 11} fill={skinDark} opacity={0.2 + chest * 0.25} />
              <path d={`M ${cx + s * torsoTop * 0.08} ${shoulderY + 20 + chest * 7} Q ${cx + s * torsoTop * 0.5} ${shoulderY + 25 + chest * 9} ${cx + s * torsoTop * 0.85} ${shoulderY + 17 + chest * 5}`}
                stroke={skinDark} strokeWidth="1.6" fill="none" opacity={0.3 + chest * 0.4} />
            </g>
          ))}
        </g>
      )}
      {/* 腹筋 */}
      {abs > 0.2 && (
        <g>
          <line x1={cx} y1="106" x2={cx} y2={134 + abs * 4} stroke={skinDark} strokeWidth="1.4" opacity={abs * 0.6} />
          {[0, 1, 2].map((r) =>
            [-1, 1].map((s) => (
              <ellipse key={`${r}${s}`} cx={cx + s * 5.5} cy={111 + r * 10} rx="5" ry="4" fill={skinDark} opacity={0.15 + abs * 0.3} />
            ))
          )}
        </g>
      )}

      {/* 腕（力こぶの盛り上がったシルエット） */}
      {[-1, 1].map((s) => (
        <g key={s}>
          <path d={limbPath(armPts(s), armWidths)} fill={skin} />
          {/* 二頭筋のピークの影 */}
          {arm > 0.35 && (
            <path d={`M ${cx + s * (upperMid[0] - 4)} ${upperMid[1] + 4} Q ${cx + s * upperMid[0]} ${upperMid[1] - armWidths[1] * 0.25} ${cx + s * (upperMid[0] + 5)} ${upperMid[1] + 2}`}
              stroke={skinDark} strokeWidth="1.6" fill="none" opacity={arm * 0.6} />
          )}
          {/* こぶし */}
          <circle cx={cx + s * wrist[0]} cy={wrist[1]} r={4.5 + arm * 2.5} fill={skinDark} />
        </g>
      ))}
      {/* 三角筋（肩のキャップ） */}
      {[-1, 1].map((s) => (
        <circle key={s} cx={cx + s * shX} cy={shoulderY - 1} r={deltR} fill={skin} stroke={skinDark} strokeWidth={shoulder > 0.4 ? 1.5 : 0} />
      ))}

      {/* 首と頭 */}
      <path d={`M ${cx - neckW / 2} 58 L ${cx + neckW / 2} 58 L ${cx + neckW / 2 + back * 3} 74 L ${cx - neckW / 2 - back * 3} 74 Z`} fill={skin} />
      <circle cx={cx} cy="44" r="20" fill={skin} />
      <path d={`M ${cx - 19} 40 Q ${cx - 16} 22 ${cx} 23 Q ${cx + 16} 22 ${cx + 19} 40 Q ${cx + 12} 30 ${cx} 30 Q ${cx - 12} 30 ${cx - 19} 40 Z`} fill="#2B2323" />
      {mAvg >= 0.85 ? (
        <rect x={cx - 14} y="40" width="28" height="7" rx="3" fill="#0D0F13" />
      ) : (
        <g>
          <circle cx={cx - 7} cy="43" r="2.2" fill="#17181C" />
          <circle cx={cx + 7} cy="43" r="2.2" fill="#17181C" />
        </g>
      )}
      <path d={`M ${cx - 4 - mAvg * 3} ${52 + (1 - mAvg) * 2} Q ${cx} ${55 + mAvg * 3} ${cx + 4 + mAvg * 3} ${52 + (1 - mAvg) * 2}`} stroke="#17181C" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      {mAvg > 0.65 && (
        <g fill="#E8C33A">
          <path d="M 30 60 l 3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 Z" />
          <path d="M 168 90 l 2.5 6 6 2.5 -6 2.5 -2.5 6 -2.5 -6 -6 -2.5 6 -2.5 Z" />
        </g>
      )}
    </svg>
  );
}

// ============ 軽トラSVG ============
const RARE_TRUCK_COLORS = ["#E4482A", "#E8C33A", "#3DC98B", "#4E8CE8", "#B478E6", "#E87BA0", "#6FCEDC"];
// 台ごとに固定の疑似乱数で、約10台に1台だけレアカラーに
const truckColor = (i) => {
  const h = ((i + 1) * 92821 + 4271) % 997;
  if (h % 10 !== 0) return "#D9DCE0";
  return RARE_TRUCK_COLORS[Math.floor(h / 10) % RARE_TRUCK_COLORS.length];
};

function KeiTruck({ size = 56, color = "#D9DCE0" }) {
  return (
    <svg viewBox="0 0 64 38" width={size} height={(size * 38) / 64} style={{ display: "block", filter: "drop-shadow(0 3px 4px rgba(0,0,0,.7))" }}>
      {/* 荷台 */}
      <rect x="2" y="13" width="38" height="12" rx="1" fill={color} />
      <rect x="2" y="13" width="38" height="3.5" fill="rgba(0,0,0,0.28)" />
      {/* キャビン */}
      <path d="M 40 25 L 40 8 Q 40 6 42 6 L 54 6 Q 56 6 57 8 L 61 15 Q 62 16.5 62 18 L 62 25 Z" fill={color} />
      <path d="M 43 9 L 53 9 L 57 15 L 43 15 Z" fill="#39404A" opacity="0.92" />
      {/* シャーシ */}
      <rect x="2" y="25" width="60" height="4" rx="1" fill="#2C3036" />
      {/* タイヤ */}
      <circle cx="14" cy="30" r="6" fill="#08090A" />
      <circle cx="14" cy="30" r="2.4" fill="#7C838C" />
      <circle cx="50" cy="30" r="6" fill="#08090A" />
      <circle cx="50" cy="30" r="2.4" fill="#7C838C" />
      {/* ライト */}
      <rect x="60" y="19" width="2.5" height="3.5" rx="1" fill="#E8C33A" />
    </svg>
  );
}

function Heli({ size = 56, color = "#D9DCE0" }) {
  return (
    <svg viewBox="0 0 64 38" width={size} height={(size * 38) / 64} style={{ display: "block", filter: "drop-shadow(0 3px 4px rgba(0,0,0,.7))" }}>
      {/* メインローター */}
      <line x1="3" y1="5" x2="51" y2="5" stroke="#7C838C" strokeWidth="2" strokeLinecap="round" />
      <rect x="25" y="5" width="4" height="5" rx="1" fill="#2C3036" />
      {/* テールブーム */}
      <path d="M 38 16 L 58 14.5 L 58 18.5 L 38 21 Z" fill={color} />
      <rect x="56.5" y="7" width="2.5" height="9" rx="1" fill="#7C838C" />
      {/* 機体 */}
      <ellipse cx="26" cy="18.5" rx="15" ry="8.5" fill={color} />
      <path d="M 32 12 Q 39.5 13.5 40.5 18.5 L 32 18.5 Z" fill="#39404A" opacity="0.92" />
      {/* スキッド */}
      <line x1="15" y1="26" x2="17" y2="31" stroke="#2C3036" strokeWidth="2" />
      <line x1="34" y1="26" x2="36" y2="31" stroke="#2C3036" strokeWidth="2" />
      <line x1="12" y1="31.5" x2="41" y2="31.5" stroke="#2C3036" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
// ============ 共通スタイル（重厚メタル） ============
// 四隅のリベット（背景レイヤーとして描画）
const RIVET = "#AEB5BE 0%, #5C626A 45%, #20242A 60%, transparent 63%";
const cardStyle = {
  borderRadius: 3, padding: 18,
  border: "1px solid #3E434A",
  backgroundColor: "#15181C",
  backgroundImage: [
    `radial-gradient(circle 5px at 11px 11px, ${RIVET})`,
    `radial-gradient(circle 5px at calc(100% - 11px) 11px, ${RIVET})`,
    `radial-gradient(circle 5px at 11px calc(100% - 11px), ${RIVET})`,
    `radial-gradient(circle 5px at calc(100% - 11px) calc(100% - 11px), ${RIVET})`,
    "linear-gradient(180deg, rgba(255,255,255,.10) 0 1px, rgba(255,255,255,0) 1px)",
    "linear-gradient(160deg,#2B2F35 0%,#1A1D22 44%,#0E1013 100%)",
  ].join(", "),
  boxShadow: "inset 0 1px 0 rgba(255,255,255,.13), 0 3px 0 #0A0B0D, 0 14px 30px rgba(0,0,0,.55)",
};
const inputStyle = {
  width: "100%", padding: "14px 14px", borderRadius: 4,
  border: `1px solid ${T.line2}`, fontSize: 16, fontFamily: T.body,
  background: T.surface2, color: T.ink, boxSizing: "border-box", outline: "none",
  boxShadow: T.groove,
  transition: "border-color 0.15s ease, box-shadow 0.15s ease",
};
// 見出し（金属に彫り込んだ表示フォント）
const h2Style = { fontFamily: T.display, fontSize: 15, fontWeight: 400, margin: 0, letterSpacing: 0.8, color: T.ink };
// 一次アクション（赤の3Dプレートボタン）
const primaryBtn = (disabled) => ({
  padding: "15px 24px", borderRadius: 4, border: "none",
  borderBottom: disabled ? "3px solid #202226" : `3px solid ${T.redDeep}`,
  background: disabled ? "#22252A" : `linear-gradient(180deg, ${T.redBright}, ${T.redDeep})`,
  color: disabled ? "#6A6F79" : "#fff", fontFamily: T.display, fontWeight: 400, fontSize: 14.5,
  letterSpacing: 1.5, boxShadow: disabled ? "none" : "0 4px 14px rgba(240,92,61,0.34)",
});

// ============ メイン ============
export default function App() {
  const [tab, setTab] = useState("log");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ logs: [], goal: null, titles: [], goalHistory: [], plan: null, vehicle: { type: "truck", resetBase: 0 }, customExercises: [], lang: detectLang() });
  const [celebration, setCelebration] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [ioMsg, setIoMsg] = useState(null); // { type: "ok"|"err", text }
  const [importPreview, setImportPreview] = useState(null); // インポート確認用

  const [exercise, setExercise] = useState("ベンチプレス");
  const [customEx, setCustomEx] = useState(""); // 新しいマイ種目の名前
  const [newExParts, setNewExParts] = useState([]); // 新しいマイ種目の対象部位
  const [exMsg, setExMsg] = useState(null); // マイ種目追加時のエラー表示
  const [deleteExTarget, setDeleteExTarget] = useState(null); // マイ種目の削除確認
  const [planRecord, setPlanRecord] = useState(null); // 計画タブからのクイック記録フォーム
  const [planSavedMsg, setPlanSavedMsg] = useState(false); // 記録完了トースト
  const planToastTimer = useRef(null);
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [sets, setSets] = useState("");
  const [rm, setRm] = useState({ bench: "", squat: "", dead: "" });
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [bubble, setBubble] = useState(null);
  const bubbleTimer = useRef(null);
  const quakeRef = useRef({ last: 0, timer: null }); // 着地の衝撃で画面全体を揺らす
  const shakeRef = useRef(null); // 揺らす対象（固定ナビは含めない＝ナビがずれないように）
  const [upgradeConfirm, setUpgradeConfirm] = useState(false);
  const [prCelebration, setPrCelebration] = useState(null); // { exercise, from, to }
  const [timer, setTimer] = useState({ total: 180, left: 180, running: false, endAt: null });
  const [timerDone, setTimerDone] = useState(false);
  const [goalTarget, setGoalTarget] = useState(6);
  const [goalModal, setGoalModal] = useState(false); // 目標の作成・進捗・履歴ポップアップ

  useEffect(() => {
    (async () => {
      const raw = await storageGet(STORAGE_KEY);
      if (raw) {
        try {
          const d = JSON.parse(raw);
          setData({
            logs: d.logs || [], goal: d.goal ?? null,
            titles: d.titles || [], goalHistory: d.goalHistory || [],
            plan: d.plan ?? null,
            vehicle: d.vehicle || { type: "truck", resetBase: 0 },
            customExercises: d.customExercises || [],
            lang: LANGS.includes(d.lang) ? d.lang : detectLang(),
          });
          if (d.plan) setRm({ bench: String(d.plan.bench || ""), squat: String(d.plan.squat || ""), dead: String(d.plan.dead || "") });
        } catch (e) { console.error("データの読み込みに失敗", e); }
      }
      setLoading(false);
    })();
  }, []);

  const save = async (next) => {
    setData(next);
    await storageSet(STORAGE_KEY, JSON.stringify(next));
  };

  // ---- JSONエクスポート ----
  const exportData = () => {
    try {
      const payload = {
        app: "kintore-shinkaron",
        version: 1,
        exportedAt: new Date().toISOString(),
        data,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const d = new Date();
      const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
      a.href = url;
      a.download = `kintore-shinkaron-backup-${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setIoMsg({ type: "ok", key: "ioExportOk" });
    } catch (e) {
      setIoMsg({ type: "err", key: "ioExportErr" });
    }
  };

  // ---- インポート（ファイル選択→中身を検証してプレビュー）----
  const handleFile = (e) => {
    setIoMsg(null);
    const file = e.target.files?.[0];
    e.target.value = ""; // 同じファイルを再選択できるようにリセット
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const d = parsed && parsed.data ? parsed.data : parsed; // 素のdataでも許容
        if (!d || !Array.isArray(d.logs)) throw new Error("形式が不正です");
        const clean = {
          logs: Array.isArray(d.logs) ? d.logs : [],
          goal: d.goal ?? null,
          titles: Array.isArray(d.titles) ? d.titles : [],
          goalHistory: Array.isArray(d.goalHistory) ? d.goalHistory : [],
          plan: d.plan ?? null,
          vehicle: d.vehicle || { type: "truck", resetBase: 0 },
          customExercises: Array.isArray(d.customExercises) ? d.customExercises : [],
          lang: LANGS.includes(d.lang) ? d.lang : (data.lang || "ja"),
        };
        setImportPreview(clean);
      } catch (err) {
        setIoMsg({ type: "err", key: "ioImportErr" });
      }
    };
    reader.onerror = () => setIoMsg({ type: "err", key: "ioReadErr" });
    reader.readAsText(file);
  };

  const confirmImport = async () => {
    await save(importPreview);
    if (importPreview.plan) {
      setRm({
        bench: String(importPreview.plan.bench || ""),
        squat: String(importPreview.plan.squat || ""),
        dead: String(importPreview.plan.dead || ""),
      });
    }
    setImportPreview(null);
    setIoMsg({ type: "ok", key: "ioRestored" });
  };

  const uniqueDays = useMemo(() => new Set(data.logs.map((l) => l.date)).size, [data.logs]);
  const stageIdx = useMemo(() => {
    let idx = 0;
    STAGES.forEach((s, i) => { if (uniqueDays >= s.days) idx = i; });
    return idx;
  }, [uniqueDays]);
  const nextStage = STAGES[stageIdx + 1];
  const totalVolume = useMemo(() => data.logs.reduce((a, l) => a + l.weight * l.reps * l.sets, 0), [data.logs]);
  const partLevels = useMemo(() => {
    const sc = { chest: 0, shoulder: 0, arm: 0, back: 0, leg: 0, abs: 0 };
    data.logs.forEach((l) => {
      partsOfLog(l).forEach(([p, w]) => { sc[p] += (l.sets || 1) * w; });
    });
    const lv = {};
    ALL_PARTS.forEach((p) => { lv[p] = sc[p] / (sc[p] + 18); }); // セット数が増えるほど1に近づく
    return lv;
  }, [data.logs]);
  // ---- ストリーク（中2日以内=間隔3日以内でトレーニングを続けた連続回数） ----
  const streak = useMemo(() => {
    const days = [...new Set(data.logs.map((l) => l.date))].sort().reverse();
    if (!days.length) return 0;
    const diff = (a, b) => Math.round((new Date(a + "T00:00:00") - new Date(b + "T00:00:00")) / 86400000);
    if (diff(todayStr(), days[0]) > 3) return 0; // 3日を超えて空くと途切れる
    let s = 1;
    for (let i = 0; i < days.length - 1; i++) {
      if (diff(days[i], days[i + 1]) <= 3) s++;
      else break;
    }
    return s;
  }, [data.logs]);

  // ---- 今週（月曜はじまり）のトレーニング日数 ----
  const weekCount = useMemo(() => {
    const now = new Date(todayStr() + "T00:00:00");
    const dow = (now.getDay() + 6) % 7; // 月=0
    const monday = new Date(now); monday.setDate(now.getDate() - dow);
    const mStr = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;
    return new Set(data.logs.filter((l) => l.date >= mStr).map((l) => l.date)).size;
  }, [data.logs]);

  const vehicle = data.vehicle || { type: "truck", resetBase: 0 };
  const isHeli = vehicle.type === "heli";
  const unitKg = isHeli ? HELI_KG : TRUCK_KG;
  const vehicleVolume = Math.max(0, totalVolume - (vehicle.resetBase || 0));
  const truckCount = Math.floor(vehicleVolume / unitKg);
  const truckRemainder = vehicleVolume % unitKg;
  const canUpgrade = !isHeli && truckCount >= 100;

  const goalDaysCount = useMemo(() => {
    if (!data.goal) return 0;
    return new Set(
      data.logs.filter((l) => l.date >= data.goal.start && l.date < data.goal.end).map((l) => l.date)
    ).size;
  }, [data.logs, data.goal]);

  useEffect(() => {
    if (loading || !data.goal || data.goal.rewarded) return;
    if (goalDaysCount >= data.goal.target) {
      const owned = new Set(data.titles);
      const pool = SHOUT_TITLES.ja.filter((t) => !owned.has(t)); // 保存は日本語を正準に
      const title = pool.length ? pool[Math.floor(Math.random() * pool.length)] : SHOUT_TITLES.ja[Math.floor(Math.random() * SHOUT_TITLES.ja.length)];
      save({
        ...data,
        titles: owned.has(title) ? data.titles : [...data.titles, title],
        goal: { ...data.goal, rewarded: true, title },
      });
      setCelebration(title);
    }
  }, [goalDaysCount, data.goal, loading]); // eslint-disable-line

  // 記録タブ・計画タブ共通の記録処理
  const recordLog = (ex, w, r, s) => {
    const log = { id: Date.now(), date: todayStr(), exercise: ex, weight: Number(w), reps: Number(r), sets: Number(s) };
    // マイ種目なら、選んだ部位を記録自体に持たせる（種目を後で削除しても成長が崩れない）
    const custom = data.customExercises.find((c) => c.name === ex);
    if (custom) log.parts = [...custom.parts];
    // 自己ベスト判定（同じ種目の過去最高重量を超えたか）
    const prevBest = data.logs
      .filter((x) => x.exercise === ex)
      .reduce((m, x) => Math.max(m, x.weight), 0);
    if (prevBest > 0 && log.weight > prevBest) {
      log.pr = true;
      setPrCelebration({ exercise: ex, from: prevBest, to: log.weight });
    }
    save({ ...data, logs: [log, ...data.logs] });
  };

  const addLog = () => {
    if (!exercise || exercise === "__add__" || !weight || !reps || !sets) return;
    recordLog(exercise, weight, reps, sets);
    setWeight(""); setReps(""); setSets("");
  };

  // ---- 計画タブからのクイック記録 ----
  const savePlanRecord = () => {
    if (!planRecord || !planRecord.weight || !planRecord.reps || !planRecord.sets) return;
    recordLog(planRecord.exercise, planRecord.weight, planRecord.reps, planRecord.sets);
    setPlanRecord(null);
    setPlanSavedMsg(true);
    if (planToastTimer.current) clearTimeout(planToastTimer.current);
    planToastTimer.current = setTimeout(() => setPlanSavedMsg(false), 2500);
  };

  // ---- インターバルタイマー ----
  const startTimer = (sec) => {
    setTimerDone(false);
    setTimer({ total: sec, left: sec, running: true, endAt: Date.now() + sec * 1000 });
  };
  const pauseTimer = () => setTimer((t) => ({ ...t, running: false }));
  const resumeTimer = () => setTimer((t) => (t.left > 0 ? { ...t, running: true, endAt: Date.now() + t.left * 1000 } : t));
  const resetTimer = () => { setTimerDone(false); setTimer((t) => ({ ...t, left: t.total, running: false, endAt: null })); };
  const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  useEffect(() => {
    if (!timer.running) return;
    const id = setInterval(() => {
      const left = Math.max(0, Math.round((timer.endAt - Date.now()) / 1000));
      if (left <= 0) {
        setTimer((t) => ({ ...t, left: 0, running: false }));
        setTimerDone(true);
        try { if (navigator.vibrate) navigator.vibrate([300, 120, 300]); } catch (e) { /* 非対応端末 */ }
        setTimeout(() => setTimerDone(false), 3000);
      } else {
        setTimer((t) => ({ ...t, left }));
      }
    }, 250);
    return () => clearInterval(id);
  }, [timer.running, timer.endAt]);

  const deleteLog = (id) => save({ ...data, logs: data.logs.filter((l) => l.id !== id) });

  // ---- マイ種目の追加・削除 ----
  const addCustomExercise = () => {
    const name = customEx.trim();
    if (!name || newExParts.length === 0) return;
    if (EXERCISE_PRESETS.some((e) => e.key === name) || data.customExercises.some((c) => c.name === name)) {
      setExMsg(true);
      return;
    }
    // 部位バーの表示順で保存
    const parts = ALL_PARTS.filter((p) => newExParts.includes(p));
    save({ ...data, customExercises: [...data.customExercises, { id: Date.now(), name, parts }] });
    setExercise(name); // 追加した種目をそのまま選択状態に
    setCustomEx(""); setNewExParts([]); setExMsg(null);
  };

  const deleteCustomExercise = (id) => {
    const target = data.customExercises.find((c) => c.id === id);
    save({ ...data, customExercises: data.customExercises.filter((c) => c.id !== id) });
    if (target && exercise === target.name) setExercise(EXERCISE_PRESETS[0].key);
  };

  const startGoal = () => {
    const start = todayStr();
    save({ ...data, goal: { start, end: addDays(start, 14), target: goalTarget, rewarded: false } });
  };

  const finishGoal = () => {
    const g = data.goal;
    save({
      ...data, goal: null,
      goalHistory: [{ ...g, achieved: g.rewarded, count: goalDaysCount, finished: todayStr() }, ...data.goalHistory],
    });
  };

  const generatePlan = () => {
    save({
      ...data,
      plan: {
        bench: Number(rm.bench) || 0,
        squat: Number(rm.squat) || 0,
        dead: Number(rm.dead) || 0,
        createdAt: todayStr(),
      },
    });
    setSelectedWeek(0);
  };

  // ---- キャラのひとこと ----
  const speak = () => {
    const arr = CHARA_QUOTES[data.lang] || CHARA_QUOTES.ja;
    const q = arr[Math.floor(Math.random() * arr.length)];
    setBubble(q);
    if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    bubbleTimer.current = setTimeout(() => setBubble(null), 2000);
  };

  // ---- 言語切替 ----
  const changeLang = (next) => { if (LANGS.includes(next)) save({ ...data, lang: next }); };

  // ---- 乗り物をヘリコプターへアップグレード ----
  const upgradeToHeli = () => {
    save({ ...data, vehicle: { type: "heli", resetBase: totalVolume } });
    setUpgradeConfirm(false);
  };

  const grouped = useMemo(() => {
    const map = {};
    data.logs.forEach((l) => { (map[l.date] = map[l.date] || []).push(l); });
    return Object.entries(map).sort((a, b) => (a[0] < b[0] ? 1 : -1)).slice(0, 14);
  }, [data.logs]);

  const goalExpired = data.goal && todayStr() >= data.goal.end;

  // 軽トラの山（下段5台で積み上げ）
  const truckPile = useMemo(() => {
    const PER_ROW = 5, MAX_SHOW = 100;
    const shown = Math.min(truckCount, MAX_SHOW);
    const rows = [];
    let remain = shown;
    while (remain > 0) {
      const n = Math.min(PER_ROW, remain);
      rows.unshift(n); // 下から積む → 上の行を先頭に
      remain -= n;
    }
    return { rows, overflow: truckCount - shown };
  }, [truckCount]);

  // ---- 軽トラ着地の衝撃で画面を揺らす（固定ナビを含まないラッパーを揺らす） ----
  const screenQuake = () => {
    const b = shakeRef.current;
    if (!b) return;
    const now = Date.now();
    if (now - quakeRef.current.last < 130) return; // 連続着地はスロットル
    quakeRef.current.last = now;
    b.style.animation = "none";
    void b.offsetHeight; // リフローで確実に再生させる
    b.style.willChange = "transform";
    b.style.animation = "quake .45s cubic-bezier(.2,.8,.3,1) both";
    clearTimeout(quakeRef.current.timer);
    quakeRef.current.timer = setTimeout(() => { b.style.animation = ""; b.style.willChange = ""; }, 520);
  };

  // 軽トラ／ヘリタブを開くたび、各台の着地の瞬間に画面を揺らす（落下アニメの遅延と同期）
  useEffect(() => {
    if (tab !== "truck") return;
    const shown = Math.min(truckCount, 100);
    if (shown === 0) return;
    const q = quakeRef.current;
    const timers = [];
    for (let i = 0; i < shown; i++) {
      const delay = Math.min(i, 40) * 0.07; // 落下の stagger と一致
      timers.push(setTimeout(screenQuake, (delay + 0.66) * 1000)); // 着地の瞬間
    }
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(q.timer);
      if (shakeRef.current) { shakeRef.current.style.animation = ""; shakeRef.current.style.willChange = ""; }
    };
  }, [tab, truckCount]); // eslint-disable-line

  const lang = data.lang || "ja";
  const tx = TXT[lang];

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: T.pageGrad, color: T.sub, fontFamily: T.body }}>
        <p>{tx.loading}</p>
      </div>
    );
  }

  const tabs = [
    { id: "log", label: tx.tabLog, icon: "edit_note" },
    { id: "chara", label: tx.tabChara, icon: "exercise" },
    { id: "truck", label: isHeli ? tx.tabHeli : tx.tabTruck, icon: isHeli ? "helicopter" : "local_shipping" },
    { id: "plan", label: tx.tabPlan, icon: "calendar_month" },
    { id: "columns", label: tx.tabColumns, icon: "menu_book" },
    { id: "settings", label: tx.tabSettings, icon: "settings" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: T.pageGrad, fontFamily: T.body, color: T.ink, paddingBottom: 92 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=Barlow+Condensed:wght@600;700&family=Dela+Gothic+One&family=Zen+Kaku+Gothic+New:wght@500;700;900&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,500,0..1,0&icon_names=calendar_month,date_range,edit_note,exercise,fitness_center,helicopter,local_fire_department,local_shipping,menu_book,settings,timer,trophy&display=block');
        /* Viteテンプレートやブラウザ標準の余白・背景を打ち消す（スマホの白枠対策） */
        html, body { margin: 0 !important; padding: 0 !important; background: #07080A !important; }
        body { overflow-x: hidden; }
        #root { max-width: none !important; margin: 0 !important; padding: 0 !important; text-align: initial !important; }
        .msym { font-family: 'Material Symbols Outlined'; font-weight: normal; font-style: normal; line-height: 1; letter-spacing: normal; text-transform: none; display: inline-block; white-space: nowrap; direction: ltr; -webkit-font-smoothing: antialiased; font-variation-settings: 'FILL' 0, 'wght' 500, 'GRAD' 0, 'opsz' 24; }
        .msym.on { font-variation-settings: 'FILL' 1, 'wght' 600, 'GRAD' 0, 'opsz' 24; }
        @keyframes popIn { 0% { transform: scale(0.3) rotate(-8deg); opacity: 0; } 70% { transform: scale(1.1) rotate(2deg); } 100% { transform: scale(1) rotate(0); opacity: 1; } }
        @keyframes shake { 0%,100% { transform: rotate(0); } 25% { transform: rotate(-2.5deg); } 75% { transform: rotate(2.5deg); } }
        @keyframes fadeUp { 0% { opacity: 0; transform: translateY(14px); } 100% { opacity: 1; transform: translateY(0); } }
        /* 軽トラ落下（重厚な着地＋潰れ／土埃／砂利／画面全体の揺れ） */
        @keyframes fallHeavy { 0% { transform: translateY(-420px) scaleY(1.14) scaleX(.9); opacity: 0; } 10% { opacity: 1; } 58% { transform: translateY(0) scaleY(1.1) scaleX(.94); animation-timing-function: cubic-bezier(.2,0,.5,1); } 64% { transform: translateY(2px) scaleY(.74) scaleX(1.16); } 72% { transform: translateY(-7px) scaleY(1.06) scaleX(.97); } 80% { transform: translateY(0) scaleY(.9) scaleX(1.06); } 88% { transform: translateY(-2px) scaleY(1.02); } 100% { transform: translateY(0) scale(1); } }
        @keyframes thud { 0%,54% { transform: translate(0,0); } 58% { transform: translate(1.5px,3px); } 62% { transform: translate(-1.5px,-1px); } 66% { transform: translate(1px,1.5px); } 72% { transform: translate(0,0); } 100% { transform: translate(0,0); } }
        @keyframes dustPuff { 0%,55% { opacity: 0; transform: translateX(0) scale(.3); } 60% { opacity: .75; } 100% { opacity: 0; transform: translateX(var(--dx,14px)) translateY(-7px) scale(2.5); } }
        @keyframes grit { 0%,56% { opacity: 0; transform: translate(0,0) scale(1); } 60% { opacity: .9; } 100% { opacity: 0; transform: translate(var(--dx,16px), -18px) scale(.5); } }
        @keyframes quake { 0% { transform: translate(0,0); } 12% { transform: translate(-3px,4px) rotate(-.18deg); } 26% { transform: translate(4px,-3px) rotate(.18deg); } 40% { transform: translate(-3px,2px); } 55% { transform: translate(2.5px,-2px) rotate(-.1deg); } 70% { transform: translate(-1.5px,1.5px); } 85% { transform: translate(1px,-1px); } 100% { transform: translate(0,0); } }
        /* 成長バー・掛け声ティッカー */
        @keyframes barFill { from { width: 0; } }
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        button { cursor: pointer; }
        input:focus, select:focus { border-color: #E4482A !important; box-shadow: inset 0 1px 3px rgba(0,0,0,.8), 0 0 0 2px rgba(228,72,42,.25) !important; }
        select option { background: #1A1D21; color: #F4F4F2; }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
      `}</style>

      {/* 揺らす対象（固定ナビ・モーダルは外に置く＝ナビがずれないように） */}
      <div ref={shakeRef}>

      {/* ヘッダー（スタンプ調：傾いた赤ロゴ＋金バッジ＋掛け声ティッカー） */}
      <header style={{ position: "sticky", top: 0, zIndex: 30, background: T.bg, borderBottom: `2px solid ${T.line}` }}>
        <div style={{ maxWidth: 520, margin: "0 auto", padding: "12px 16px 10px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          {/* 左：ロゴ＋タイトル */}
          <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
            <div style={{
              width: 38, height: 38, flex: "none",
              background: T.red, display: "flex", alignItems: "center", justifyContent: "center",
              transform: "rotate(-4deg)", boxShadow: "3px 3px 0 #000",
            }}>
              <span style={{ fontFamily: T.num, fontSize: 22, color: "#fff", lineHeight: 1, letterSpacing: -1 }}>筋</span>
            </div>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ margin: 0, fontFamily: T.display, fontWeight: 400, fontSize: 19, lineHeight: 1.1, letterSpacing: 0.5, color: T.ink }}>筋トレ進化論</h1>
              <p style={{ margin: "2px 0 0", fontFamily: T.num, fontSize: 10, letterSpacing: 3.5, color: T.sub2, lineHeight: 1 }}>MUSCLE EVOLUTION</p>
            </div>
          </div>
          {/* 右：言語トグル＋ステージバッジ（傾いた金スタンプ） */}
          <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => changeLang(lang === "ja" ? "en" : "ja")}
              aria-label={lang === "ja" ? "Switch to English" : "日本語に切り替え"}
              style={{
                flex: "none", border: `1px solid ${T.line2}`, background: T.surface2, color: T.ink,
                fontFamily: T.cond, fontWeight: 700, fontSize: 11, letterSpacing: 1,
                padding: "6px 9px", borderRadius: 4, whiteSpace: "nowrap", lineHeight: 1,
                display: "flex", alignItems: "center", gap: 4,
              }}>
              <span style={{ fontSize: 12 }}>🌐</span>{lang === "ja" ? "EN" : "日本語"}
            </button>
            <span style={{
              flex: "none", fontFamily: T.display, fontWeight: 400, fontSize: 11,
              padding: "7px 10px", background: T.yellow, color: "#17140A",
              transform: "rotate(2deg)", boxShadow: "2px 2px 0 #000", whiteSpace: "nowrap",
            }}>{STAGES[stageIdx].name[lang]}</span>
          </div>
        </div>
        {/* 掛け声ティッカー（獲得した称号だけが流れる。増えるほど賑やかに） */}
        {data.titles.length > 0 && (
          <div style={{ overflow: "hidden", background: "#000", borderTop: `2px solid ${T.red}`, padding: "5px 0" }}>
            <div style={{ display: "flex", width: "max-content", animation: `marquee ${Math.max(14, data.titles.length * 4)}s linear infinite` }}>
              {[0, 1].map((k) => (
                <span key={k} aria-hidden={k === 1}
                  style={{ fontFamily: T.num, fontSize: 12, letterSpacing: 2.5, color: "#FFF2E0", whiteSpace: "nowrap", paddingRight: 24 }}>
                  {data.titles.map((s) => `★ ${shoutText(s, lang)} `).join("")}
                </span>
              ))}
            </div>
          </div>
        )}
      </header>

      <main style={{ maxWidth: 520, margin: "0 auto", padding: 16 }}>
        {/* ===== 記録 ===== */}
        {tab === "log" && (
          <div style={{ display: "grid", gap: 14 }}>
            {/* ストリーク＆今週 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <section style={{ ...cardStyle, padding: "12px 14px", textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 11, color: T.sub, fontWeight: 700, letterSpacing: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}><span className="msym" style={{ fontSize: 15, color: T.red }}>local_fire_department</span>{tx.streak}</p>
                <p style={{ margin: "2px 0 0" }}>
                  <span style={{ fontFamily: T.num, fontSize: 30, color: streak > 0 ? T.yellow : T.sub }}>{streak}</span>
                  <span style={{ fontSize: 13, marginLeft: 3 }}>{tx.streakUnit}</span>
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 10, color: T.sub }}>{tx.streakNote}</p>
              </section>
              {/* 目標統合カード（通常は今週の日数、目標設定中は進捗。タップで目標ポップアップ） */}
              <section onClick={() => setGoalModal(true)} role="button" aria-label={tx.goalOpenAria}
                style={{ ...cardStyle, padding: "12px 14px", textAlign: "center", cursor: "pointer", position: "relative", borderTop: data.goal ? `2px solid ${data.goal.rewarded ? T.green : T.red}` : undefined }}>
                {data.goal ? (
                  <>
                    <p style={{ margin: 0, fontSize: 11, color: T.sub, fontWeight: 700, letterSpacing: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}><span className="msym" style={{ fontSize: 15, color: T.yellow }}>trophy</span>{tx.goalCardLabel}</p>
                    <p style={{ margin: "2px 0 0" }}>
                      <span style={{ fontFamily: T.num, fontSize: 30, color: data.goal.rewarded ? T.green : T.ink }}>{goalDaysCount}</span>
                      <span style={{ fontSize: 13, color: T.sub }}> / {data.goal.target}{lang === "ja" ? "日" : ""}</span>
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: 10, color: T.sub }}>
                      {data.goal.rewarded
                        ? (lang === "ja" ? "達成 🏆" : "Achieved 🏆")
                        : (() => {
                            const dl = Math.max(0, Math.ceil((new Date(data.goal.end + "T00:00:00") - new Date(todayStr() + "T00:00:00")) / 86400000));
                            return lang === "ja" ? `あと${dl}日` : `${dl} days left`;
                          })()}
                    </p>
                  </>
                ) : (
                  <>
                    <p style={{ margin: 0, fontSize: 11, color: T.sub, fontWeight: 700, letterSpacing: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}><span className="msym" style={{ fontSize: 15, color: T.blue }}>date_range</span>{tx.thisWeek}</p>
                    <p style={{ margin: "2px 0 0" }}>
                      <span style={{ fontFamily: T.num, fontSize: 30 }}>{weekCount}</span>
                      <span style={{ fontSize: 13, marginLeft: 3 }}>{tx.dayUnit}</span>
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: 10, color: T.red, fontWeight: 700 }}>{tx.tapToSetGoal}</p>
                  </>
                )}
              </section>
            </div>

            {/* インターバルタイマー */}
            <section style={{ ...cardStyle, borderLeft: timer.running ? `5px solid ${T.green}` : `5px solid ${T.line}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ ...h2Style, fontSize: 15, display: "flex", alignItems: "center", gap: 6 }}><span className="msym" style={{ fontSize: 19, color: T.green }}>timer</span>{tx.intervalTimer}</h3>
                <span style={{
                  fontFamily: T.num, fontSize: 34, letterSpacing: 1,
                  color: timer.running ? T.green : timer.left === 0 ? T.red : T.ink,
                }}>
                  {fmtTime(timer.left)}
                </span>
              </div>
              <div style={{ height: 8, background: T.surface2, borderRadius: 999, overflow: "hidden", boxShadow: T.groove, margin: "10px 0" }}>
                <div style={{
                  height: "100%", borderRadius: 999, transition: "width 0.25s linear",
                  background: `linear-gradient(90deg, ${T.green}, ${T.blue})`,
                  width: `${timer.total ? (timer.left / timer.total) * 100 : 0}%`,
                }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
                {[
                  { sec: 60, label: "1:00" },
                  { sec: 90, label: "1:30" },
                  { sec: 180, label: "3:00" },
                  { sec: 300, label: "5:00" },
                ].map((p) => (
                  <button key={p.sec} onClick={() => startTimer(p.sec)}
                    style={{
                      padding: "10px 0", borderRadius: 10, fontFamily: T.num, fontSize: 15,
                      border: `1.5px solid ${timer.total === p.sec ? T.green : T.line}`,
                      background: T.surface2, color: timer.total === p.sec ? T.green : T.ink,
                    }}>
                    {p.label}
                  </button>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
                {timer.running ? (
                  <button onClick={pauseTimer}
                    style={{ padding: "11px", borderRadius: 10, border: "none", background: T.surface2, color: T.ink, fontWeight: 800, fontFamily: T.body, fontSize: 14 }}>
                    {tx.pause}
                  </button>
                ) : (
                  <button onClick={resumeTimer} disabled={timer.left === 0 || timer.left === timer.total}
                    style={{
                      padding: "11px", borderRadius: 10, border: "none", fontWeight: 800, fontFamily: T.body, fontSize: 14,
                      background: T.surface2, color: timer.left === 0 || timer.left === timer.total ? "#555C6E" : T.green,
                    }}>
                    {tx.resume}
                  </button>
                )}
                <button onClick={resetTimer}
                  style={{ padding: "11px", borderRadius: 10, border: "none", background: T.surface2, color: T.sub, fontWeight: 800, fontFamily: T.body, fontSize: 14 }}>
                  {tx.reset}
                </button>
              </div>
              <p style={{ margin: "10px 0 0", fontSize: 11, color: T.sub }}>
                {tx.timerHint}
              </p>
            </section>

            <section style={cardStyle}>
              <h2 style={{ ...h2Style, display: "flex", alignItems: "center", gap: 8 }}><span className="msym" style={{ fontSize: 20, color: T.red }}>fitness_center</span>{tx.recordTitle}</h2>
              <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                <select value={exercise} onChange={(e) => { setExercise(e.target.value); setExMsg(null); }} style={inputStyle}>
                  <optgroup label={tx.grpBasic}>
                    {EXERCISE_PRESETS.map((e) => <option key={e.key} value={e.key}>{e[lang]}</option>)}
                  </optgroup>
                  {data.customExercises.length > 0 && (
                    <optgroup label={tx.grpCustom}>
                      {data.customExercises.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </optgroup>
                  )}
                  <option value="__add__">{tx.addNewEx}</option>
                </select>
                {exercise === "__add__" && (
                  <div style={{ background: T.surface2, borderRadius: 12, padding: 12, display: "grid", gap: 10, border: `1.5px dashed ${T.line}` }}>
                    <input style={{ ...inputStyle, background: T.surface }} placeholder={tx.exNamePlaceholder}
                      value={customEx} onChange={(e) => { setCustomEx(e.target.value); setExMsg(null); }} />
                    <div>
                      <p style={{ margin: "0 0 7px", fontSize: 12, fontWeight: 700, color: T.sub }}>{tx.targetParts}</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {ALL_PARTS.map((p) => {
                          const on = newExParts.includes(p);
                          return (
                            <button key={p}
                              onClick={() => setNewExParts((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p])}
                              style={{
                                padding: "8px 15px", borderRadius: 999, fontSize: 13, fontWeight: 800, fontFamily: T.body,
                                border: `1.5px solid ${on ? PART_COLORS[p] : T.line}`,
                                background: on ? PART_COLORS[p] : T.surface,
                                color: on ? "#17181C" : T.sub,
                              }}>
                              {on ? "✓ " : ""}{PART_LABELS[lang][p]}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    {exMsg && <p style={{ margin: 0, fontSize: 12, color: T.red, fontWeight: 700 }}>⚠ {tx.exDup}</p>}
                    <button onClick={addCustomExercise}
                      disabled={!customEx.trim() || newExParts.length === 0}
                      style={{
                        padding: "12px", borderRadius: 10, border: "none", fontFamily: T.body, fontWeight: 800, fontSize: 14,
                        background: !customEx.trim() || newExParts.length === 0 ? "#3A3F4C" : T.green,
                        color: !customEx.trim() || newExParts.length === 0 ? "#777E8F" : "#0D0F13",
                      }}>
                      {tx.addToMyEx}
                    </button>
                    <p style={{ margin: 0, fontSize: 11, color: T.sub, lineHeight: 1.6 }}>
                      {tx.addExNote}
                    </p>
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  {[
                    { v: weight, set: setWeight, ph: tx.phKg, label: tx.fWeight },
                    { v: reps, set: setReps, ph: tx.phReps, label: tx.fReps },
                    { v: sets, set: setSets, ph: tx.phSets, label: tx.fSets },
                  ].map((f) => (
                    <div key={f.label}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: T.sub, letterSpacing: 1 }}>{f.label}</label>
                      <input type="number" inputMode="decimal" min="0" style={inputStyle} placeholder={f.ph} value={f.v} onChange={(e) => f.set(e.target.value)} />
                    </div>
                  ))}
                </div>
                <button onClick={addLog}
                  disabled={!weight || !reps || !sets || exercise === "__add__"}
                  style={primaryBtn(!weight || !reps || !sets || exercise === "__add__")}>
                  {tx.recordBtn}
                </button>
              </div>
            </section>

            {/* マイ種目の管理 */}
            {data.customExercises.length > 0 && (
              <section style={cardStyle}>
                <h3 style={{ ...h2Style, fontSize: 15 }}>{tx.myExTitle}</h3>
                <p style={{ fontSize: 12, color: T.sub, margin: "6px 0 4px" }}>
                  {tx.myExNote}
                </p>
                {data.customExercises.map((c) => (
                  <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: `1px solid ${T.line}`, marginTop: 8 }}>
                    <div>
                      <strong style={{ fontWeight: 700 }}>{c.name}</strong>
                      <div style={{ display: "flex", gap: 5, marginTop: 5, flexWrap: "wrap" }}>
                        {c.parts.map((p) => (
                          <span key={p} style={{
                            fontSize: 10, fontWeight: 800, padding: "2px 9px", borderRadius: 999,
                            border: `1px solid ${PART_COLORS[p]}`, color: PART_COLORS[p],
                          }}>{PART_LABELS[lang][p]}</span>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => setDeleteExTarget(c)} aria-label={tx.delMyExAria}
                      style={{ border: "none", background: "none", color: "#555C6E", fontSize: 18, padding: 4 }}>✕</button>
                  </div>
                ))}
              </section>
            )}

            {grouped.length === 0 ? (
              <section style={{ ...cardStyle, textAlign: "center", color: T.sub }}>
                {tx.emptyLogs1}<br />{tx.emptyLogs2}
              </section>
            ) : (
              grouped.map(([date, logs]) => (
                <section key={date} style={cardStyle}>
                  <h3 style={{ margin: "0 0 6px", fontSize: 13, color: date === todayStr() ? T.red : T.sub, fontWeight: 800, letterSpacing: 1 }}>
                    {date === todayStr() ? `TODAY ${fmtDate(date)}` : fmtDate(date)}
                  </h3>
                  {logs.map((l) => (
                    <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderTop: `1px solid ${T.line}` }}>
                      <div>
                        <strong style={{ fontWeight: 700 }}>{exName(l.exercise, lang)}</strong>
                        {l.pr && (
                          <span style={{
                            marginLeft: 6, fontSize: 10, fontWeight: 900, color: "#17181C",
                            background: T.yellow, borderRadius: 6, padding: "2px 6px", verticalAlign: "middle",
                          }}>PR</span>
                        )}
                        <div style={{ color: T.sub, fontSize: 13, marginTop: 2 }}>
                          <span style={{ fontFamily: T.num, color: T.ink, fontSize: 15, letterSpacing: 0.5 }}>{l.weight}</span>{tx.uKg} ×{" "}
                          <span style={{ fontFamily: T.num, color: T.ink, fontSize: 15 }}>{l.reps}</span>{tx.uReps} ×{" "}
                          <span style={{ fontFamily: T.num, color: T.ink, fontSize: 15 }}>{l.sets}</span>{tx.uSets}
                        </div>
                      </div>
                      <button onClick={() => setDeleteTarget(l)} aria-label={tx.delAria}
                        style={{ border: "none", background: "none", color: "#555C6E", fontSize: 18, padding: 4 }}>✕</button>
                    </div>
                  ))}
                </section>
              ))
            )}
          </div>
        )}

        {/* ===== 進化 ===== */}
        {tab === "chara" && (
          <div style={{ display: "grid", gap: 14 }}>
            <section onClick={speak}
              style={{ ...cardStyle, padding: 0, overflow: "hidden", position: "relative", cursor: "pointer", userSelect: "none" }}>
              {bubble && (
                <div style={{
                  position: "absolute", top: 12, right: 10, zIndex: 5, maxWidth: "58%",
                  animation: "popIn 0.25s ease-out", pointerEvents: "none",
                }}>
                  <div style={{
                    background: "#fff", color: "#17181C", fontWeight: 900, fontSize: 14,
                    padding: "9px 14px", borderRadius: 14, lineHeight: 1.5, textAlign: "center",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.4)",
                  }}>
                    {bubble}
                  </div>
                  {/* しっぽ（左下・キャラの顔の方向を指す） */}
                  <div style={{
                    width: 12, height: 12, background: "#fff", margin: "-7px 0 0 14px",
                    transform: "rotate(45deg)", borderRadius: 2,
                  }} />
                </div>
              )}
              {/* 背景の巨大アウトライン文字 */}
              <p style={{ position: "absolute", top: 14, left: 0, right: 0, margin: 0, textAlign: "center", fontFamily: T.num, fontSize: 76, lineHeight: 1, color: "transparent", WebkitTextStroke: "1px #343940", letterSpacing: 3, pointerEvents: "none" }}>MACHO</p>
              <div style={{ position: "relative" }}><MuscleCharacter levels={partLevels} /></div>
              <div style={{ textAlign: "center", padding: "12px 16px 16px" }}>
                <h2 style={{ fontFamily: T.display, fontSize: 26, fontWeight: 400, margin: 0, letterSpacing: 1, color: T.ink, textShadow: T.emboss }}>{STAGES[stageIdx].name[lang]}</h2>
                <p style={{ margin: "6px 0 0", fontSize: 13, color: T.sub }}>{STAGES[stageIdx].desc[lang]}</p>
                <p style={{ margin: "8px 0 0", fontSize: 11, color: T.sub2 }}>{tx.tapToSpeak}</p>
              </div>
            </section>

            <section style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: T.sub, fontWeight: 700 }}>
                  {tx.trainingDays} <span style={{ fontFamily: T.num, fontSize: 20, color: T.ink, marginLeft: 4 }}>{uniqueDays}</span>{lang === "ja" ? "日" : " " + tx.dayUnit}
                </span>
                {nextStage && <span style={{ fontSize: 12, color: T.red, fontWeight: 800 }}>{lang === "ja" ? `進化まであと${nextStage.days - uniqueDays}日` : `${nextStage.days - uniqueDays} days to evolve`}</span>}
              </div>
              <div style={{ height: 12, background: T.surface2, borderRadius: 999, overflow: "hidden", boxShadow: T.groove }}>
                <div style={{
                  height: "100%", borderRadius: 999,
                  background: `linear-gradient(90deg, ${T.red}, ${T.yellow})`, transition: "width 0.6s",
                  width: nextStage
                    ? `${Math.min(100, ((uniqueDays - STAGES[stageIdx].days) / (nextStage.days - STAGES[stageIdx].days)) * 100)}%`
                    : "100%",
                }} />
              </div>
            </section>

            <section style={cardStyle}>
              <h3 style={{ ...h2Style, fontSize: 15, marginBottom: 10 }}>{tx.growthTitle}</h3>
              <p style={{ fontSize: 12, color: T.sub, margin: "0 0 12px" }}>
                {tx.growthNote}
              </p>
              <div style={{ display: "grid", gap: 11 }}>
                {ALL_PARTS.map((p, i) => (
                  <div key={p} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: lang === "ja" ? 38 : 70, fontFamily: T.display, fontSize: lang === "ja" ? 13 : 11, fontWeight: 400, color: T.ink }}>{PART_LABELS[lang][p]}</span>
                    <div style={{ flex: 1, height: 13, background: T.surface2, borderRadius: 2, overflow: "hidden", boxShadow: T.groove }}>
                      <div style={{ height: "100%", background: PART_COLORS[p], width: `${Math.round(partLevels[p] * 100)}%`, boxShadow: `0 0 12px ${PART_COLORS[p]}66`, transition: "width 0.6s", animation: "barFill 1s cubic-bezier(.2,.8,.2,1) both", animationDelay: `${i * 0.08}s` }} />
                    </div>
                    <span style={{ width: 34, textAlign: "right", fontFamily: T.num, fontSize: 16, color: T.ink }}>{Math.round(partLevels[p] * 100)}</span>
                  </div>
                ))}
              </div>
            </section>

            <section style={cardStyle}>
              <h3 style={{ ...h2Style, fontSize: 15 }}>{tx.titlesTitle}</h3>
              {data.titles.length === 0 ? (
                <p style={{ color: T.sub, fontSize: 13, margin: "10px 0 0" }}>
                  {tx.noTitles}
                </p>
              ) : (
                <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                  {data.titles.map((t, i) => (
                    <div key={t} style={{
                      display: "flex", alignItems: "center", gap: 12,
                      background: "linear-gradient(180deg,#1A1D21,#121417)",
                      border: `1px solid ${T.line}`, borderLeft: `4px solid ${T.red}`,
                      padding: 12, borderRadius: 2,
                    }}>
                      <span style={{ fontFamily: T.num, fontSize: 17, color: T.sub2 }}>{String(i + 1).padStart(2, "0")}</span>
                      <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 900, color: T.yellow, lineHeight: 1.6 }}>{shoutText(t, lang)}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ===== 軽トラ / ヘリ ===== */}
        {tab === "truck" && (() => {
          const Vehicle = isHeli ? Heli : KeiTruck;
          const vName = isHeli ? tx.vNameHeli : tx.vNameTruck;
          const vUnit = isHeli ? tx.vUnitHeli : tx.vUnitTruck; // EN では空文字
          const vUnitJa = isHeli ? "機" : "台";
          const vSpec = isHeli ? tx.vSpecHeli : tx.vSpecTruck;
          return (
            <div style={{ display: "grid", gap: 14 }}>
              {canUpgrade && (
                <section style={{
                  ...cardStyle, borderLeft: `5px solid ${T.yellow}`,
                  display: "flex", alignItems: "center", gap: 12,
                }}>
                  <span style={{ fontSize: 28 }}>🚁</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: 14 }}>{tx.upBanner1}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: T.sub }}>{tx.upBanner2}</p>
                  </div>
                  <button onClick={() => setUpgradeConfirm(true)}
                    style={{ padding: "10px 14px", borderRadius: 10, border: "none", background: T.yellow, color: "#17181C", fontWeight: 900, fontFamily: T.body, fontSize: 13, whiteSpace: "nowrap" }}>
                    {tx.change}
                  </button>
                </section>
              )}

              <section style={{ ...cardStyle, textAlign: "center" }}>
                <p style={{ margin: 0, fontFamily: T.cond, fontWeight: 700, fontSize: 11, color: T.sub, letterSpacing: 4 }}>
                  {isHeli ? tx.volHeli : tx.volTruck}
                </p>
                <p style={{ fontFamily: T.num, fontSize: 54, margin: "4px 0 0", lineHeight: 1, color: T.ink, textShadow: "0 4px 0 #0A0B0D,0 6px 18px rgba(0,0,0,.8)" }}>
                  {vehicleVolume.toLocaleString()}<span style={{ fontFamily: T.cond, fontWeight: 700, fontSize: 18, letterSpacing: 2, color: T.sub, marginLeft: 6 }}>KG</span>
                </p>
                <div style={{ marginTop: 14, display: "inline-flex", alignItems: "center", gap: 10, background: "linear-gradient(180deg,#2A2E34,#15181C)", border: `1px solid ${T.line2}`, padding: "10px 15px", borderRadius: 3, boxShadow: "inset 0 1px 0 rgba(255,255,255,.16),0 4px 12px rgba(0,0,0,.6)" }}>
                  <span style={{ fontFamily: T.display, fontSize: 12, color: T.sub }}>{vName}（{vSpec}）×</span>
                  <span style={{ fontFamily: T.num, fontSize: 34, lineHeight: 0.85, color: T.yellow, textShadow: "0 0 18px rgba(232,195,58,.45)" }}>{truckCount}</span>
                  {vUnit && <span style={{ fontFamily: T.display, fontSize: 12, color: T.sub }}>{vUnit}</span>}
                </div>
                {isHeli && (
                  <p style={{ margin: "8px 0 0", fontSize: 11, color: T.sub }}>
                    {lang === "ja" ? `🛻 軽トラ時代を含む累計：${totalVolume.toLocaleString()}kg` : `🛻 Cumulative incl. truck era: ${totalVolume.toLocaleString()}kg`}
                  </p>
                )}
              </section>

              <section style={cardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.sub, fontWeight: 700, marginBottom: 6 }}>
                  <span>{isHeli ? tx.nextHeli : tx.nextTruck}</span>
                  <span style={{ color: T.ink }}>{lang === "ja"
                    ? <>あと <span style={{ fontFamily: T.num, fontSize: 15, color: T.green }}>{(unitKg - truckRemainder).toLocaleString()}</span> kg</>
                    : <><span style={{ fontFamily: T.num, fontSize: 15, color: T.green }}>{(unitKg - truckRemainder).toLocaleString()}</span> kg to go</>}</span>
                </div>
                <div style={{ height: 12, background: T.surface2, borderRadius: 999, overflow: "hidden", boxShadow: T.groove }}>
                  <div style={{ height: "100%", width: `${(truckRemainder / unitKg) * 100}%`, background: `linear-gradient(90deg, ${T.green}, ${T.blue})`, borderRadius: 999, transition: "width 0.6s" }} />
                </div>
              </section>

              <section style={cardStyle}>
                <h3 style={{ ...h2Style, fontSize: 15, marginBottom: 4 }}>{isHeli ? tx.pileHeli : tx.pileTruck}</h3>
                {truckCount === 0 ? (
                  <div style={{ textAlign: "center", padding: "26px 0", color: T.sub, fontSize: 13 }}>
                    <div style={{ opacity: 0.35, display: "inline-block" }}><Vehicle size={64} /></div>
                    <p style={{ margin: "10px 0 0" }}>
                      {lang === "ja"
                        ? (isHeli
                            ? `ここから第2章。合計${HELI_KG.toLocaleString()}kg挙げると最初の1機が並びます！`
                            : `まだ0台。合計${TRUCK_KG}kg挙げると最初の1台が積まれます！`)
                        : (isHeli
                            ? `Chapter 2 starts here. Lift ${HELI_KG.toLocaleString()}kg total to line up your first chopper!`
                            : `0 so far. Lift ${TRUCK_KG}kg total to stack your first truck!`)}
                    </p>
                  </div>
                ) : (
                  <div style={{ paddingTop: 8 }}>
                    {truckPile.overflow > 0 && (
                      <p style={{ textAlign: "center", fontSize: 12, color: T.sub, margin: "0 0 4px" }}>
                        {lang === "ja"
                          ? <>…ほか <strong style={{ color: T.yellow }}>{truckPile.overflow}{vUnitJa}</strong>（表示は100{vUnitJa}まで）</>
                          : <>…and <strong style={{ color: T.yellow }}>{truckPile.overflow} more</strong> (showing up to 100)</>}
                      </p>
                    )}
                    {truckPile.rows.map((n, i) => {
                      const below = truckPile.rows.slice(i + 1).reduce((a, b) => a + b, 0);
                      return (
                        <div key={i} style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: i === 0 ? 0 : -6 }}>
                          {Array.from({ length: n }).map((_, j) => {
                            const globalIdx = below + j;
                            const delay = `${Math.min(globalIdx, 40) * 0.07}s`;
                            return (
                              <div key={j} style={{
                                position: "relative", transformOrigin: "50% 100%",
                                animation: "fallHeavy 1.15s cubic-bezier(.55,0,.85,.25) both",
                                animationDelay: delay,
                              }}>
                                {/* 着地の土埃・砂利 */}
                                <div style={{ position: "absolute", left: -14, right: -14, bottom: -2, height: 22, pointerEvents: "none", overflow: "visible" }}>
                                  <div style={{ position: "absolute", left: 2, bottom: 0, width: 20, height: 20, borderRadius: "50%", background: "radial-gradient(circle at 60% 70%, rgba(190,168,130,.55), rgba(190,168,130,0) 70%)", "--dx": "-16px", animation: "dustPuff 1.15s ease-out both", animationDelay: delay }} />
                                  <div style={{ position: "absolute", right: 2, bottom: 0, width: 22, height: 22, borderRadius: "50%", background: "radial-gradient(circle at 40% 70%, rgba(190,168,130,.5), rgba(190,168,130,0) 70%)", "--dx": "18px", animation: "dustPuff 1.15s ease-out both", animationDelay: delay }} />
                                  <div style={{ position: "absolute", left: "50%", bottom: 1, width: 26, height: 14, marginLeft: -13, borderRadius: "50%", background: "radial-gradient(circle at 50% 80%, rgba(210,190,150,.45), rgba(210,190,150,0) 72%)", "--dx": "0px", animation: "dustPuff 1.15s ease-out both", animationDelay: delay }} />
                                  <div style={{ position: "absolute", left: 8, bottom: 2, width: 2.5, height: 2.5, background: "rgba(206,186,148,.9)", "--dx": "-20px", animation: "grit 1.15s ease-out both", animationDelay: delay }} />
                                  <div style={{ position: "absolute", right: 10, bottom: 3, width: 2, height: 2, background: "rgba(206,186,148,.85)", "--dx": "22px", animation: "grit 1.15s ease-out both", animationDelay: delay }} />
                                  <div style={{ position: "absolute", left: "50%", bottom: 4, width: 2, height: 2, background: "rgba(206,186,148,.8)", "--dx": "6px", animation: "grit 1.15s ease-out both", animationDelay: delay }} />
                                </div>
                                {/* 着地の揺れ戻り */}
                                <div style={{ animation: "thud 1.15s linear both", animationDelay: delay }}>
                                  <Vehicle size={52} color={truckColor(globalIdx + truckPile.overflow)} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                    <div style={{ height: 9, margin: "2px 8px 0", background: "repeating-linear-gradient(135deg,#E8C33A 0 9px,#0A0B0D 9px 18px)", opacity: 0.5 }} />
                    <p style={{ textAlign: "center", fontSize: 12, color: T.sub, margin: "10px 0 0" }}>
                      {lang === "ja"
                        ? (isHeli
                            ? `あなたはヘリコプター${truckCount}機分の鉄を持ち上げました 🚁`
                            : `あなたはこれまでに軽トラ${truckCount}台分の鉄を持ち上げました 🛻`)
                        : (isHeli
                            ? `You've lifted the equivalent of ${truckCount} helicopters 🚁`
                            : `You've lifted the equivalent of ${truckCount} kei trucks 🛻`)}
                    </p>
                  </div>
                )}
              </section>
            </div>
          );
        })()}

        {/* ===== 計画 ===== */}
        {tab === "plan" && (
          <div style={{ display: "grid", gap: 14 }}>
            <section style={cardStyle}>
              <h2 style={h2Style}>{tx.planTitle}</h2>
              <p style={{ fontSize: 13, color: T.sub, margin: "8px 0 12px", lineHeight: 1.7 }}>
                {lang === "ja" ? (
                  <>月曜<strong style={{ color: DAY_TYPES.H.color }}>筋肥大（H）</strong>・水曜<strong style={{ color: DAY_TYPES.P.color }}>パワー（P）</strong>・金曜<strong style={{ color: DAY_TYPES.S.color }}>筋力（S）</strong>を6週間かけて漸進させる計画。BIG3の1RM（1回だけ挙げられる最大重量）を入れると各週の推奨重量を計算します。</>
                ) : (
                  <>A 6-week plan that progresses Mon <strong style={{ color: DAY_TYPES.H.color }}>Hypertrophy (H)</strong>, Wed <strong style={{ color: DAY_TYPES.P.color }}>Power (P)</strong>, Fri <strong style={{ color: DAY_TYPES.S.color }}>Strength (S)</strong>. Enter your BIG3 1RM (the max you can lift once) and it calculates the recommended weights for each week.</>
                )}
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {[
                  { k: "bench", label: tx.rmBench },
                  { k: "squat", label: tx.rmSquat },
                  { k: "dead", label: tx.rmDead },
                ].map((f) => (
                  <div key={f.k}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: T.sub, letterSpacing: 1 }}>{f.label} {tx.rm1}</label>
                    <input type="number" inputMode="decimal" min="0" style={inputStyle} placeholder="kg"
                      value={rm[f.k]} onChange={(e) => setRm({ ...rm, [f.k]: e.target.value })} />
                  </div>
                ))}
              </div>
              <button onClick={generatePlan} style={{ ...primaryBtn(false), width: "100%", marginTop: 10 }}>
                {data.plan ? tx.remakePlan : tx.makePlan}
              </button>
              {data.plan && (
                <p style={{ margin: "10px 0 0", fontSize: 11, color: T.sub, textAlign: "center" }}>
                  {lang === "ja"
                    ? `✓ 保存済み（${fmtDate(data.plan.createdAt)}作成）— アプリを閉じても消えません`
                    : `✓ Saved (created ${fmtDate(data.plan.createdAt)}) — persists after you close the app`}
                </p>
              )}
            </section>

            {data.plan && (
              <>
                {/* 週セレクタ */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6 }}>
                  {HPS_PROGRAM.map((w, i) => (
                    <button key={w.week} onClick={() => setSelectedWeek(i)}
                      style={{
                        padding: "9px 0", borderRadius: 10, fontFamily: T.body, fontWeight: 900, fontSize: 12,
                        border: `1.5px solid ${selectedWeek === i ? T.red : T.line}`,
                        background: selectedWeek === i ? T.red : T.surface,
                        color: selectedWeek === i ? "#fff" : T.sub,
                      }}>
                      W{w.week}
                    </button>
                  ))}
                </div>

                {HPS_PROGRAM[selectedWeek].days.map((d, i) => {
                  const t = DAY_TYPES[d.type];
                  return (
                    <section key={`${selectedWeek}-${d.day}`}
                      style={{
                        ...cardStyle, borderLeft: `5px solid ${t.color}`,
                        animation: "fadeUp 0.45s ease-out both",
                        animationDelay: `${i * 0.1}s`,
                      }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <h3 style={{ fontSize: 16, fontWeight: 900, margin: 0, letterSpacing: 1 }}>
                          {hpsDay(d.day, lang)}{lang === "ja" ? "　" : " "}<span style={{ color: t.color }}>{d.type}{lang === "ja" ? "：" : ": "}{t.name[lang]}</span>
                        </h3>
                        <span style={{ fontFamily: T.num, fontSize: 14, color: T.sub }}>{(d.pct * 100).toFixed(1)}%</span>
                      </div>
                      <div style={{ display: "flex", gap: 14, margin: "10px 0 0", fontSize: 13 }}>
                        <span><strong style={{ fontFamily: T.num, fontSize: 17 }}>{hpsReps(d.reps, lang)}</strong></span>
                        <span>× <strong style={{ fontFamily: T.num, fontSize: 17 }}>{d.sets}</strong> {tx.setsUnit}</span>
                        <span style={{ color: d.interval.includes("爆発") ? t.color : T.sub, fontWeight: 700 }}>{hpsInterval(d.interval, lang)}</span>
                      </div>
                      {(data.plan.bench > 0 || data.plan.squat > 0 || data.plan.dead > 0) && (
                        <>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "10px 0 0" }}>
                            {[[tx.rmBench, "ベンチプレス", data.plan.bench], [tx.rmSquat, "スクワット", data.plan.squat], [tx.rmDead, "デッドリフト", data.plan.dead]]
                              .filter(([, , v]) => v > 0).map(([n, full, v]) => {
                                const kg = roundPlate(v * d.pct);
                                const repsNum = parseInt(d.reps, 10);
                                return (
                                  <button key={full}
                                    onClick={() => setPlanRecord({
                                      exercise: full, weight: String(kg),
                                      reps: Number.isNaN(repsNum) ? "" : String(repsNum),
                                      sets: String(d.sets),
                                      day: hpsDay(d.day, lang), typeName: t.name[lang], color: t.color,
                                      menu: lang === "ja" ? `${d.reps} × ${d.sets}セット` : `${hpsReps(d.reps, "en")} × ${d.sets} sets`,
                                      failure: isFailureDay(d.reps),
                                    })}
                                    style={{
                                      background: T.surface2, border: `1px solid ${T.line}`, borderRadius: 8,
                                      padding: "6px 10px", fontSize: 13, fontWeight: 700, fontFamily: T.body, color: T.ink,
                                    }}>
                                    {n} <span style={{ fontFamily: T.num, fontSize: 15, color: t.color }}>{kg}</span>kg
                                    <span style={{ fontSize: 12, marginLeft: 4 }}>📝</span>
                                  </button>
                                );
                              })}
                          </div>
                          <p style={{ margin: "8px 0 0", fontSize: 11, color: T.sub }}>
                            {tx.weightTapHint}
                          </p>
                        </>
                      )}
                      <p style={{ margin: "10px 0 0", fontSize: 12, background: T.surface2, padding: "8px 11px", borderRadius: 8, color: T.sub }}>💡 {t.tip[lang]}</p>
                    </section>
                  );
                })}
                <p style={{ fontSize: 12, color: T.sub, margin: 0, padding: "0 4px", lineHeight: 1.7 }}>
                  {tx.planFootnote}
                </p>
              </>
            )}
          </div>
        )}

        {/* ===== コラム ===== */}
        {tab === "columns" && (
          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <h2 style={{ ...h2Style, fontSize: 18 }}>{tx.colHeading}</h2>
              <p style={{ fontSize: 12, color: T.sub, margin: "6px 0 2px" }}>{tx.colIntro}</p>
            </div>
            {ARTICLES.map((a) => (
              <a key={a.href} href={a.href}
                style={{ ...cardStyle, display: "block", textDecoration: "none", color: T.ink }}>
                <span style={{ display: "inline-block", fontFamily: T.cond, fontWeight: 700, fontSize: 11, letterSpacing: 1, color: T.yellow, border: `1px solid ${T.line2}`, background: T.surface2, borderRadius: 999, padding: "2px 10px" }}>{a.tag[lang]}</span>
                <h3 style={{ margin: "9px 0 5px", fontFamily: T.display, fontWeight: 400, fontSize: 15, lineHeight: 1.5, color: T.ink }}>{a.title[lang]}</h3>
                <p style={{ margin: 0, fontSize: 13, color: T.sub, lineHeight: 1.7 }}>{a.summary[lang]}</p>
                <span style={{ display: "inline-block", marginTop: 9, fontSize: 12, fontWeight: 800, color: T.red }}>{tx.readArticle}</span>
              </a>
            ))}
          </div>
        )}

        {/* ===== 設定 ===== */}
        {tab === "settings" && (
          <div style={{ display: "grid", gap: 14 }}>
            {/* 言語 / Language */}
            <section style={cardStyle}>
              <h2 style={h2Style}>{tx.langLabel}</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
                {[{ id: "ja", label: "日本語" }, { id: "en", label: "English" }].map((o) => {
                  const on = lang === o.id;
                  return (
                    <button key={o.id} onClick={() => changeLang(o.id)}
                      style={{
                        padding: "13px", borderRadius: 4, fontFamily: T.body, fontWeight: 800, fontSize: 15,
                        border: `1.5px solid ${on ? T.red : T.line2}`,
                        background: on ? T.redContainer : T.surface2,
                        color: on ? T.red : T.ink,
                        boxShadow: on ? "none" : T.groove,
                      }}>
                      {on ? "✓ " : ""}{o.label}
                    </button>
                  );
                })}
              </div>
            </section>

            <section style={cardStyle}>
              <h2 style={h2Style}>{tx.backupTitle}</h2>
              <p style={{ fontSize: 13, color: T.sub, margin: "8px 0 14px", lineHeight: 1.7 }}>
                {tx.backupIntro1}<strong style={{ color: T.ink }}>{tx.backupIntro2}</strong>{tx.backupIntro3}
              </p>

              <div style={{ display: "grid", gap: 10 }}>
                <button onClick={exportData} style={{ ...primaryBtn(false), width: "100%" }}>
                  {tx.exportBtn}
                </button>
                <label style={{
                  display: "block", textAlign: "center", padding: "13px", borderRadius: 12,
                  border: `1.5px solid ${T.line}`, background: T.surface2, color: T.ink,
                  fontWeight: 800, fontSize: 15, cursor: "pointer",
                }}>
                  {tx.importBtn}
                  <input type="file" accept="application/json,.json" onChange={handleFile} style={{ display: "none" }} />
                </label>
              </div>

              {ioMsg && (
                <p style={{
                  margin: "12px 0 0", fontSize: 13, fontWeight: 700, textAlign: "center",
                  color: ioMsg.type === "ok" ? T.green : T.red,
                }}>
                  {ioMsg.type === "ok" ? "✓ " : "⚠ "}{tx[ioMsg.key]}
                </p>
              )}
            </section>

            <section style={cardStyle}>
              <h3 style={{ ...h2Style, fontSize: 15, marginBottom: 8 }}>{tx.currentData}</h3>
              <div style={{ display: "grid", gap: 6, fontSize: 13 }}>
                {[
                  [tx.dLogs, `${data.logs.length} ${tx.uItems}`],
                  [tx.dDays, `${uniqueDays} ${tx.dayUnit}`],
                  [tx.dMyEx, `${data.customExercises.length} ${tx.uCount}`],
                  [tx.dTitles, `${data.titles.length} ${tx.uCount}`],
                  [tx.dGoals, `${data.goalHistory.length} ${tx.uTimes}`],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: `1px solid ${T.line}` }}>
                    <span style={{ color: T.sub }}>{k}</span>
                    <span style={{ fontWeight: 800 }}>{v}</span>
                  </div>
                ))}
              </div>
            </section>

            <p style={{ fontSize: 11, color: T.sub, padding: "0 4px", lineHeight: 1.7 }}>
              {tx.restoreWarn1}<strong style={{ color: T.ink }}>{tx.restoreWarn2}</strong>{tx.restoreWarn3}
            </p>
          </div>
        )}
      </main>

      {/* フッター */}
      <footer style={{ maxWidth: 520, margin: "0 auto", padding: "4px 16px 20px", textAlign: "center" }}>
        <p style={{ margin: "0 0 6px", fontSize: 11, color: "#6B7386" }}>
          {[
            { href: "/guide.html", label: tx.fGuide },
            { href: "/articles.html", label: tx.fColumns },
            { href: "/contact.html", label: tx.fContact },
            { href: "/privacy.html", label: tx.fPrivacy },
          ].map((l, i) => (
            <span key={l.href}>
              {i > 0 && "・"}
              <a href={l.href} style={{ color: "#6B7386", textDecoration: "underline" }}>{l.label}</a>
            </span>
          ))}
        </p>
        <p style={{ margin: 0, fontSize: 11, color: "#6B7386" }}>© 2026 筋トレ進化論</p>
      </footer>
      </div>{/* /揺らす対象 */}

      {/* 自己ベスト更新の祝福 */}
      {prCelebration && (
        <div onClick={() => setPrCelebration(null)} role="dialog" aria-label="自己ベスト更新"
          style={{
            position: "fixed", inset: 0, background: "rgba(10,11,15,0.92)", zIndex: 55,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
          }}>
          <div style={{ textAlign: "center", animation: "popIn 0.5s ease-out" }}>
            <p style={{ fontSize: 44, margin: 0, animation: "shake 0.6s ease-in-out 0.4s 2" }}>🏋️</p>
            <p style={{ color: T.yellow, fontWeight: 900, fontSize: 22, letterSpacing: 2, margin: "8px 0 4px" }}>
              {tx.prTitle}
            </p>
            <p style={{ color: "#fff", fontWeight: 900, fontSize: 19, margin: "0 0 10px" }}>{exName(prCelebration.exercise, lang)}</p>
            <p style={{ margin: 0 }}>
              <span style={{ fontFamily: T.num, fontSize: 26, color: T.sub, textDecoration: "line-through" }}>{prCelebration.from}kg</span>
              <span style={{ color: T.sub, fontSize: 20, margin: "0 10px" }}>→</span>
              <span style={{ fontFamily: T.num, fontSize: 44, color: T.yellow, textShadow: `0 0 24px rgba(255,201,60,0.5)` }}>{prCelebration.to}kg</span>
            </p>
            <p style={{ color: "#fff", fontWeight: 800, fontSize: 15, marginTop: 14 }}>
              「{(CHARA_QUOTES[lang] || CHARA_QUOTES.ja)[Math.floor(Math.random() * CHARA_QUOTES[lang].length)]}」
            </p>
            <p style={{ color: T.sub, fontSize: 13, marginTop: 18 }}>{tx.tapClose}</p>
          </div>
        </div>
      )}

      {/* インターバル終了トースト */}
      {timerDone && (
        <div style={{
          position: "fixed", top: 80, left: "50%", transform: "translateX(-50%)",
          zIndex: 55, animation: "popIn 0.3s ease-out",
          background: T.green, color: "#0D0F13", fontWeight: 900, fontSize: 15,
          padding: "13px 22px", borderRadius: 14, boxShadow: "0 6px 20px rgba(61,220,151,0.4)",
          whiteSpace: "nowrap",
        }}>
          {tx.timerDone}
        </div>
      )}

      {/* ヘリ変更の確認 */}
      {upgradeConfirm && (
        <div onClick={() => setUpgradeConfirm(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(10,11,15,0.75)", zIndex: 60,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
          }}>
          <div role="dialog" aria-label="乗り物変更の確認" onClick={(e) => e.stopPropagation()}
            style={{ ...cardStyle, width: "100%", maxWidth: 340, animation: "popIn 0.25s ease-out" }}>
            <h3 style={{ ...h2Style, fontSize: 16 }}>{tx.upTitle}</h3>
            {lang === "ja" ? (
              <>
                <p style={{ fontSize: 13, color: T.sub, margin: "10px 0", lineHeight: 1.8 }}>
                  次のステージは <strong style={{ color: T.ink }}>ヘリコプター（1機 = 2,000kg）</strong>。
                  変更するとカウントが<strong style={{ color: T.red }}>リセットされ、1機目からのスタート</strong>になります。
                </p>
                <p style={{ fontSize: 12, color: T.sub, margin: "0 0 14px" }}>
                  ※ トレーニング記録・キャラの成長・累計挙上量は消えません。一度変更すると軽トラには戻れません。
                </p>
              </>
            ) : (
              <>
                <p style={{ fontSize: 13, color: T.sub, margin: "10px 0", lineHeight: 1.8 }}>
                  The next stage is a <strong style={{ color: T.ink }}>helicopter (1 = 2,000kg)</strong>.
                  Upgrading <strong style={{ color: T.red }}>resets the count and starts you from your first chopper</strong>.
                </p>
                <p style={{ fontSize: 12, color: T.sub, margin: "0 0 14px" }}>
                  * Your logs, character growth, and cumulative volume are kept. You can't go back to trucks once you upgrade.
                </p>
              </>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button onClick={() => setUpgradeConfirm(false)}
                style={{ padding: "12px", borderRadius: 10, border: `1.5px solid ${T.line}`, background: T.surface2, color: T.ink, fontWeight: 800, fontFamily: T.body, fontSize: 14 }}>
                {tx.cancel}
              </button>
              <button onClick={upgradeToHeli}
                style={{ padding: "12px", borderRadius: 10, border: "none", background: T.yellow, color: "#17181C", fontWeight: 900, fontFamily: T.body, fontSize: 14 }}>
                {tx.change}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* インポート確認 */}
      {importPreview && (
        <div onClick={() => setImportPreview(null)}
          style={{
            position: "fixed", inset: 0, background: "rgba(10,11,15,0.75)", zIndex: 60,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
          }}>
          <div role="dialog" aria-label="復元の確認" onClick={(e) => e.stopPropagation()}
            style={{ ...cardStyle, width: "100%", maxWidth: 340, animation: "popIn 0.25s ease-out" }}>
            <h3 style={{ ...h2Style, fontSize: 16 }}>{tx.importTitle}</h3>
            <div style={{ background: T.surface2, borderRadius: 10, padding: "10px 12px", margin: "12px 0", fontSize: 13, display: "grid", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: T.sub }}>{tx.iRecords}</span><strong>{importPreview.logs.length} {tx.uItems}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: T.sub }}>{tx.iTitles}</span><strong>{importPreview.titles.length} {tx.uCount}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: T.sub }}>{tx.iGoals}</span><strong>{importPreview.goalHistory.length} {tx.uTimes}</strong>
              </div>
            </div>
            <p style={{ fontSize: 12, color: T.red, margin: "0 0 14px", fontWeight: 700 }}>
              {lang === "ja"
                ? `⚠ 今この端末にある記録（${data.logs.length}件）はすべて上書きされます。`
                : `⚠ All logs currently on this device (${data.logs.length}) will be overwritten.`}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button onClick={() => setImportPreview(null)}
                style={{ padding: "12px", borderRadius: 10, border: `1.5px solid ${T.line}`, background: T.surface2, color: T.ink, fontWeight: 800, fontFamily: T.body, fontSize: 14 }}>
                {tx.cancel}
              </button>
              <button onClick={confirmImport}
                style={{ padding: "12px", borderRadius: 10, border: "none", background: T.red, color: "#fff", fontWeight: 800, fontFamily: T.body, fontSize: 14 }}>
                {tx.restoreBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 削除確認 */}
      {deleteTarget && (
        <div onClick={() => setDeleteTarget(null)}
          style={{
            position: "fixed", inset: 0, background: "rgba(10,11,15,0.75)", zIndex: 60,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
          }}>
          <div role="dialog" aria-label="削除の確認" onClick={(e) => e.stopPropagation()}
            style={{ ...cardStyle, width: "100%", maxWidth: 340, animation: "popIn 0.25s ease-out" }}>
            <h3 style={{ ...h2Style, fontSize: 16 }}>{tx.delTitle}</h3>
            <div style={{ background: T.surface2, borderRadius: 10, padding: "10px 12px", margin: "12px 0" }}>
              <strong style={{ fontWeight: 800 }}>{exName(deleteTarget.exercise, lang)}</strong>
              <div style={{ fontSize: 13, color: T.sub, marginTop: 2 }}>
                {fmtDate(deleteTarget.date)}　{deleteTarget.weight}{tx.uKg} × {deleteTarget.reps}{tx.uReps} × {deleteTarget.sets}{tx.uSets}
              </div>
            </div>
            <p style={{ fontSize: 12, color: T.sub, margin: "0 0 14px" }}>{tx.delIrreversible}</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button onClick={() => setDeleteTarget(null)}
                style={{ padding: "12px", borderRadius: 10, border: `1.5px solid ${T.line}`, background: T.surface2, color: T.ink, fontWeight: 800, fontFamily: T.body, fontSize: 14 }}>
                {tx.cancel}
              </button>
              <button onClick={() => { deleteLog(deleteTarget.id); setDeleteTarget(null); }}
                style={{ padding: "12px", borderRadius: 10, border: "none", background: T.red, color: "#fff", fontWeight: 800, fontFamily: T.body, fontSize: 14 }}>
                {tx.delBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 計画タブからのクイック記録フォーム */}
      {planRecord && (
        <div onClick={() => setPlanRecord(null)}
          style={{
            position: "fixed", inset: 0, background: "rgba(10,11,15,0.75)", zIndex: 60,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
          }}>
          <div role="dialog" aria-label="実績の記録" onClick={(e) => e.stopPropagation()}
            style={{ ...cardStyle, width: "100%", maxWidth: 340, animation: "popIn 0.25s ease-out", borderLeft: `5px solid ${planRecord.color}` }}>
            <h3 style={{ ...h2Style, fontSize: 16 }}>{lang === "ja" ? `📝 ${exName(planRecord.exercise, lang)} を記録` : `📝 Log ${exName(planRecord.exercise, lang)}`}</h3>
            <p style={{ fontSize: 12, color: T.sub, margin: "8px 0 12px" }}>
              {lang === "ja"
                ? <>{planRecord.day}（{planRecord.typeName}）のメニュー：<strong style={{ color: planRecord.color }}>{planRecord.menu}</strong></>
                : <>{planRecord.day} ({planRecord.typeName}) plan: <strong style={{ color: planRecord.color }}>{planRecord.menu}</strong></>}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {[
                { k: "weight", ph: tx.phKg, label: tx.fWeight },
                { k: "reps", ph: tx.phReps, label: tx.fReps },
                { k: "sets", ph: tx.phSets, label: tx.fSets },
              ].map((f) => (
                <div key={f.k}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: T.sub, letterSpacing: 1 }}>{f.label}</label>
                  <input type="number" inputMode="decimal" min="0" style={inputStyle} placeholder={f.ph}
                    value={planRecord[f.k]} onChange={(e) => setPlanRecord({ ...planRecord, [f.k]: e.target.value })} />
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: T.sub, margin: "10px 0 0", lineHeight: 1.6 }}>
              {planRecord.failure
                ? (lang === "ja" ? "「限界まで」の日は、実際にこなせた回数をレップに入力してください。" : "On a \"to failure\" day, enter the number of reps you actually managed.")
                : (lang === "ja" ? "計画の推奨値を入れてあります。実際の重量・回数に合わせて調整してください。" : "The plan's recommended values are pre-filled. Adjust them to your actual weight and reps.")}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
              <button onClick={() => setPlanRecord(null)}
                style={{ padding: "12px", borderRadius: 10, border: `1.5px solid ${T.line}`, background: T.surface2, color: T.ink, fontWeight: 800, fontFamily: T.body, fontSize: 14 }}>
                {tx.cancel}
              </button>
              <button onClick={savePlanRecord}
                disabled={!planRecord.weight || !planRecord.reps || !planRecord.sets}
                style={{ ...primaryBtn(!planRecord.weight || !planRecord.reps || !planRecord.sets), padding: "12px", fontSize: 14, borderRadius: 10 }}>
                {tx.recordBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 計画からの記録完了トースト */}
      {planSavedMsg && (
        <div style={{
          position: "fixed", top: 80, left: "50%", transform: "translateX(-50%)",
          zIndex: 55, animation: "popIn 0.3s ease-out",
          background: T.green, color: "#0D0F13", fontWeight: 900, fontSize: 14,
          padding: "13px 22px", borderRadius: 14, boxShadow: "0 6px 20px rgba(61,220,151,0.4)",
          whiteSpace: "nowrap",
        }}>
          {tx.planSavedToast}
        </div>
      )}

      {/* マイ種目の削除確認 */}
      {deleteExTarget && (
        <div onClick={() => setDeleteExTarget(null)}
          style={{
            position: "fixed", inset: 0, background: "rgba(10,11,15,0.75)", zIndex: 60,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
          }}>
          <div role="dialog" aria-label="マイ種目削除の確認" onClick={(e) => e.stopPropagation()}
            style={{ ...cardStyle, width: "100%", maxWidth: 340, animation: "popIn 0.25s ease-out" }}>
            <h3 style={{ ...h2Style, fontSize: 16 }}>{tx.delExTitle}</h3>
            <div style={{ background: T.surface2, borderRadius: 10, padding: "10px 12px", margin: "12px 0" }}>
              <strong style={{ fontWeight: 800 }}>{deleteExTarget.name}</strong>
              <div style={{ display: "flex", gap: 5, marginTop: 6, flexWrap: "wrap" }}>
                {deleteExTarget.parts.map((p) => (
                  <span key={p} style={{
                    fontSize: 10, fontWeight: 800, padding: "2px 9px", borderRadius: 999,
                    border: `1px solid ${PART_COLORS[p]}`, color: PART_COLORS[p],
                  }}>{PART_LABELS[lang][p]}</span>
                ))}
              </div>
            </div>
            <p style={{ fontSize: 12, color: T.sub, margin: "0 0 14px", lineHeight: 1.7 }}>
              {tx.delExNote}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button onClick={() => setDeleteExTarget(null)}
                style={{ padding: "12px", borderRadius: 10, border: `1.5px solid ${T.line}`, background: T.surface2, color: T.ink, fontWeight: 800, fontFamily: T.body, fontSize: 14 }}>
                {tx.cancel}
              </button>
              <button onClick={() => { deleteCustomExercise(deleteExTarget.id); setDeleteExTarget(null); }}
                style={{ padding: "12px", borderRadius: 10, border: "none", background: T.red, color: "#fff", fontWeight: 800, fontFamily: T.body, fontSize: 14 }}>
                {tx.delBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 称号獲得の演出 */}
      {celebration && (
        <div onClick={() => setCelebration(null)} role="dialog" aria-label="称号獲得"
          style={{
            position: "fixed", inset: 0, background: "rgba(10,11,15,0.92)", zIndex: 50,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
          }}>
          <div style={{ textAlign: "center", animation: "popIn 0.5s ease-out" }}>
            <p style={{ color: T.yellow, fontWeight: 900, fontSize: 16, letterSpacing: 2, margin: "0 0 10px" }}>{tx.celebTitle}</p>
            <p style={{
              color: "#fff", fontWeight: 900, fontSize: 28, lineHeight: 1.6, margin: 0,
              textShadow: `0 0 24px rgba(255,90,60,0.6), 3px 3px 0 ${T.red}`,
              animation: "shake 0.6s ease-in-out 0.5s 2",
            }}>
              「{shoutText(celebration, lang)}」
            </p>
            <p style={{ color: T.sub, fontSize: 13, marginTop: 22 }}>{tx.tapClose}</p>
          </div>
        </div>
      )}

      {/* 目標ポップアップ（記録タブのカードから開く） */}
      {goalModal && (
        <div onClick={() => setGoalModal(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(10,11,15,0.75)", zIndex: 60,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
          }}>
          <div role="dialog" aria-label={tx.goalCardLabel} onClick={(e) => e.stopPropagation()}
            style={{ ...cardStyle, width: "100%", maxWidth: 360, maxHeight: "85vh", overflowY: "auto", animation: "popIn 0.25s ease-out", display: "grid", gap: 14 }}>
            {!data.goal ? (
              <section>
                <h2 style={h2Style}>{tx.setGoalTitle}</h2>
                <p style={{ fontSize: 13, color: T.sub, margin: "8px 0 14px", lineHeight: 1.7 }}>
                  {lang === "ja"
                    ? <>今日から14日間で何日トレーニングするか決めましょう。達成すると<strong style={{ color: T.yellow }}>ボディビル大会の掛け声称号</strong>を獲得！</>
                    : <>Decide how many days you'll train over the next 14 days. Clear it to earn a <strong style={{ color: T.yellow }}>bodybuilding contest cheer title</strong>!</>}
                </p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, marginBottom: 16 }}>
                  <button onClick={() => setGoalTarget(Math.max(1, goalTarget - 1))}
                    style={{ width: 46, height: 46, borderRadius: 999, border: `1.5px solid ${T.line}`, background: T.surface2, color: T.ink, fontSize: 22 }}>−</button>
                  <div style={{ textAlign: "center" }}>
                    <span style={{ fontFamily: T.num, fontSize: 52, lineHeight: 1 }}>{goalTarget}</span>
                    <span style={{ fontSize: 15, marginLeft: 4, color: T.sub }}>{tx.dayUnit}</span>
                  </div>
                  <button onClick={() => setGoalTarget(Math.min(14, goalTarget + 1))}
                    style={{ width: 46, height: 46, borderRadius: 999, border: `1.5px solid ${T.line}`, background: T.surface2, color: T.ink, fontSize: 22 }}>＋</button>
                </div>
                <button onClick={startGoal} style={{ ...primaryBtn(false), width: "100%" }}>{tx.goalStart}</button>
              </section>
            ) : (
              <section style={{ borderLeft: `5px solid ${data.goal.rewarded ? T.green : T.red}`, paddingLeft: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <h2 style={h2Style}>{tx.activeGoal}</h2>
                  <span style={{ fontSize: 11, color: T.sub }}>{fmtDate(data.goal.start)} 〜 {fmtDate(addDays(data.goal.end, -1))}</span>
                </div>
                <p style={{ textAlign: "center", margin: "16px 0 8px" }}>
                  <span style={{ fontFamily: T.num, fontSize: 46 }}>{goalDaysCount}</span>
                  <span style={{ fontSize: 16, color: T.sub }}> / {data.goal.target}{lang === "ja" ? "日" : " " + tx.dayUnit}</span>
                </p>
                <div style={{ height: 14, background: T.surface2, borderRadius: 999, overflow: "hidden", boxShadow: T.groove }}>
                  <div style={{
                    height: "100%", borderRadius: 999, transition: "width 0.6s",
                    background: data.goal.rewarded ? T.green : `linear-gradient(90deg, ${T.red}, ${T.yellow})`,
                    width: `${Math.min(100, (goalDaysCount / data.goal.target) * 100)}%`,
                  }} />
                </div>
                {data.goal.rewarded ? (
                  <p style={{ textAlign: "center", margin: "14px 0 0", fontWeight: 800, color: T.green }}>
                    {lang === "ja"
                      ? `🎉 達成！称号「${shoutText(data.goal.title, lang)}」を獲得しました`
                      : `🎉 Achieved! You earned the title "${shoutText(data.goal.title, lang)}"`}
                  </p>
                ) : (
                  <p style={{ textAlign: "center", margin: "14px 0 0", fontSize: 13, color: T.sub }}>
                    {(() => {
                      const daysLeft = Math.max(0, Math.ceil((new Date(data.goal.end + "T00:00:00") - new Date(todayStr() + "T00:00:00")) / 86400000));
                      return lang === "ja" ? `期限まであと${daysLeft}日。今日の1回が未来のバルク。` : `${daysLeft} days left. Today's rep is tomorrow's bulk.`;
                    })()}
                  </p>
                )}
                {(goalExpired || data.goal.rewarded) && (
                  <button onClick={finishGoal} style={{
                    marginTop: 14, width: "100%", padding: "12px", borderRadius: 12,
                    border: `1.5px solid ${T.line}`, background: T.surface2, color: T.ink,
                    fontWeight: 800, fontSize: 14, fontFamily: T.body,
                  }}>{tx.finishGoal}</button>
                )}
              </section>
            )}

            {data.goalHistory.length > 0 && (
              <section>
                <h3 style={{ ...h2Style, fontSize: 15, marginBottom: 8 }}>{tx.pastGoals}</h3>
                {data.goalHistory.map((g, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderTop: `1px solid ${T.line}`, fontSize: 13 }}>
                    <span style={{ color: T.sub }}>{fmtDate(g.start)}〜　<span style={{ color: T.ink, fontFamily: T.num, fontSize: 14 }}>{g.count}/{g.target}</span>{lang === "ja" ? "日" : " " + tx.dayUnit}</span>
                    <span style={{ fontWeight: 800, color: g.achieved ? T.green : "#5A6172" }}>
                      {g.achieved ? tx.achievedTag : tx.failedTag}
                    </span>
                  </div>
                ))}
              </section>
            )}

            <button onClick={() => setGoalModal(false)}
              style={{ padding: "12px", borderRadius: 10, border: `1.5px solid ${T.line}`, background: T.surface2, color: T.ink, fontWeight: 800, fontFamily: T.body, fontSize: 14 }}>
              {lang === "ja" ? "閉じる" : "Close"}
            </button>
          </div>
        </div>
      )}

      {/* ボトムナビ（重厚メタル＋LEDインジケータ） */}
      <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40,
        background: "linear-gradient(180deg,#3A3F46 0%,#22262B 42%,#121417 100%)",
        borderTop: `1px solid ${T.line2}`,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,.22), inset 0 -8px 18px rgba(0,0,0,.6)",
      }}>
        <div style={{ maxWidth: 520, margin: "0 auto", display: "flex", padding: "0 0 env(safe-area-inset-bottom, 0px)" }}>
          {tabs.map((t, i) => {
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{
                  position: "relative", flex: 1, border: "none",
                  borderLeft: i === 0 ? "none" : "1px solid rgba(255,255,255,.05)",
                  borderRight: i === tabs.length - 1 ? "none" : "1px solid rgba(0,0,0,.5)",
                  background: active ? "linear-gradient(180deg,#4A5057 0%,#2A2E34 45%,#171A1E 100%)" : "transparent",
                  boxShadow: active
                    ? "inset 0 1px 0 rgba(255,255,255,.3), inset 0 -10px 16px rgba(0,0,0,.55), 0 0 18px rgba(240,92,61,.16)"
                    : "inset 0 6px 12px rgba(0,0,0,.4)",
                  padding: "9px 0 10px", display: "flex", flexDirection: "column",
                  alignItems: "center", gap: 4,
                  fontFamily: T.body, fontWeight: 900, fontSize: 10.5, letterSpacing: 0.3,
                  color: active ? "#FFF3EE" : "#8A9199",
                  transition: "color 0.2s ease",
                }}>
                {/* 上端のLED */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: T.redBright, boxShadow: "0 0 12px rgba(240,92,61,.85)", display: active ? "block" : "none" }} />
                <span className={active ? "msym on" : "msym"}
                  style={{ fontSize: 22, color: active ? "#FFF3EE" : "#8A9199", textShadow: "0 1px 0 rgba(0,0,0,.8)", transition: "color 0.2s ease" }}>
                  {t.icon}
                </span>
                <span style={{ textShadow: "0 1px 0 rgba(0,0,0,.8)" }}>{t.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
