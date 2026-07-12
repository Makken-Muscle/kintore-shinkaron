import { useState, useEffect, useMemo, useRef } from "react";

// ============ 定数 ============
const STORAGE_KEY = "kintore-shinkaron:data";
const TRUCK_KG = 700; // 軽トラ1台の最大積載量の目安

const STAGES = [
  { days: 0, name: "ガリガリ", desc: "風で飛ばされそう…" },
  { days: 3, name: "もやし卒業", desc: "何かが変わり始めた" },
  { days: 7, name: "一般人", desc: "普通って素晴らしい" },
  { days: 12, name: "引き締まりボディ", desc: "服の上からでも分かる" },
  { days: 20, name: "細マッチョ", desc: "海に行きたくなってきた" },
  { days: 30, name: "マッチョ", desc: "ドアを横向きで通り始めた" },
  { days: 45, name: "ゴリマッチョ伝説", desc: "もはや歩く重機" },
];

const SHOUT_TITLES = [
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
];

const EXERCISE_PRESETS = [
  "ベンチプレス", "スクワット", "デッドリフト", "ショルダープレス",
  "ラットプルダウン", "アームカール", "レッグプレス", "懸垂", "腹筋",
];

const HELI_KG = 2000; // ヘリコプター1機の重量目安（2t）

// HPS 6週間プログラム（月:H 筋肥大 / 水:P パワー / 金:S 筋力）
const DAY_TYPES = {
  H: { key: "H", name: "筋肥大", color: "#FF5A3C", tip: "重量より「効かせる」意識。ネガティブ動作をゆっくり。" },
  P: { key: "P", name: "パワー", color: "#3DDC97", tip: "全力スピードで爆発的に挙げる。潰れる手前で必ず止める。" },
  S: { key: "S", name: "筋力", color: "#5B9BFF", tip: "高重量ゾーン。ウォームアップとセーフティバーを忘れずに。" },
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
const CHARA_QUOTES = [
  "ナイスバルク！！！", "イエス筋肉！！！", "キレてる！キレてる！",
  "パワーーーー！！", "筋肉は裏切らない！", "今日も追い込むぞ！",
  "プロテインの時間だ！", "デカくなってる実感ある…！", "ハッ！（ポージング）",
  "僧帽筋が喜んでる！", "超回復こそ正義！", "限界の1歩先へ！",
];

// ============ デザイントークン ============
const T = {
  bg: "#12141A",
  surface: "#1C1F27",
  surface2: "#242834",
  line: "#2E3341",
  ink: "#EDEFF3",
  sub: "#9AA3B5",
  red: "#FF5A3C",
  yellow: "#FFC93C",
  green: "#3DDC97",
  blue: "#5B9BFF",
  body: "'Zen Kaku Gothic New', 'Hiragino Sans', sans-serif",
  num: "'Anton', 'Zen Kaku Gothic New', sans-serif",
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
const PART_LABELS = { chest: "胸", shoulder: "肩", arm: "腕", back: "背中", leg: "脚", abs: "腹筋" };
const PART_COLORS = { chest: "#FF5A3C", shoulder: "#FFC93C", arm: "#C77DFF", back: "#5B9BFF", leg: "#3DDC97", abs: "#7FE3F0" };
const PART_RULES = [
  { re: /デッド/, parts: [["back", 0.5], ["leg", 0.5]] },
  { re: /腹|クランチ|プランク|アブ|レッグレイズ/, parts: [["abs", 1]] },
  { re: /ベンチ|チェスト|フライ|腕立て|プッシュアップ|胸/, parts: [["chest", 1]] },
  { re: /ラット|プル|懸垂|チンニング|ロウ|背/, parts: [["back", 1]] },
  { re: /ショルダー|レイズ|オーバーヘッド|肩/, parts: [["shoulder", 1]] },
  { re: /スクワット|レッグ|ランジ|カーフ|脚|尻|ヒップ/, parts: [["leg", 1]] },
  { re: /カール|二頭|三頭|トライセ|ディップ|プレスダウン|腕/, parts: [["arm", 1]] },
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
          <stop offset="0%" stopColor="#3A4152" />
          <stop offset="100%" stopColor="#1C1F27" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="200" height="240" rx="16" fill="url(#spot)" />
      <polygon points="70,0 130,0 168,215 32,215" fill="#FFC93C" opacity="0.07" />
      <rect x="14" y="212" width="172" height="4" rx="2" fill="#0D0F13" />
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
      <path d={`M ${cx - hipW / 2} 137 Q ${cx} 141 ${cx + hipW / 2} 137 L ${cx + hipW / 2 + 2} 160 Q ${cx + hipW * 0.25} 164 ${cx + 3} 161 L ${cx} 153 L ${cx - 3} 161 Q ${cx - hipW * 0.25} 164 ${cx - hipW / 2 - 2} 160 Z`} fill="#FF5A3C" />

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
        <g fill="#FFC93C">
          <path d="M 30 60 l 3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 Z" />
          <path d="M 168 90 l 2.5 6 6 2.5 -6 2.5 -2.5 6 -2.5 -6 -6 -2.5 6 -2.5 Z" />
        </g>
      )}
    </svg>
  );
}

// ============ 軽トラSVG ============
const RARE_TRUCK_COLORS = ["#FF5A3C", "#FFC93C", "#3DDC97", "#5B9BFF", "#C77DFF", "#FF7BAC", "#7FE3F0"];
// 台ごとに固定の疑似乱数で、約10台に1台だけレアカラーに
const truckColor = (i) => {
  const h = ((i + 1) * 92821 + 4271) % 997;
  if (h % 10 !== 0) return "#F2F4F7";
  return RARE_TRUCK_COLORS[Math.floor(h / 10) % RARE_TRUCK_COLORS.length];
};

function KeiTruck({ size = 56, color = "#F2F4F7" }) {
  return (
    <svg viewBox="0 0 64 38" width={size} height={(size * 38) / 64} style={{ display: "block" }}>
      {/* 荷台 */}
      <rect x="2" y="13" width="38" height="12" rx="1.5" fill={color} />
      <rect x="2" y="13" width="38" height="3" fill="rgba(0,0,0,0.22)" />
      {/* キャビン */}
      <path d="M 40 25 L 40 8 Q 40 6 42 6 L 54 6 Q 56 6 57 8 L 61 15 Q 62 16.5 62 18 L 62 25 Z" fill={color} />
      <path d="M 43 9 L 53 9 L 57 15 L 43 15 Z" fill="#5B9BFF" opacity="0.85" />
      {/* シャーシ */}
      <rect x="2" y="25" width="60" height="4" rx="1" fill="#3A4152" />
      {/* タイヤ */}
      <circle cx="14" cy="30" r="6" fill="#0D0F13" />
      <circle cx="14" cy="30" r="2.4" fill="#9AA3B5" />
      <circle cx="50" cy="30" r="6" fill="#0D0F13" />
      <circle cx="50" cy="30" r="2.4" fill="#9AA3B5" />
      {/* ライト */}
      <rect x="60" y="19" width="2.5" height="3.5" rx="1" fill="#FFC93C" />
    </svg>
  );
}

function Heli({ size = 56, color = "#F2F4F7" }) {
  return (
    <svg viewBox="0 0 64 38" width={size} height={(size * 38) / 64} style={{ display: "block" }}>
      {/* メインローター */}
      <line x1="3" y1="5" x2="51" y2="5" stroke="#9AA3B5" strokeWidth="2" strokeLinecap="round" />
      <rect x="25" y="5" width="4" height="5" rx="1" fill="#3A4152" />
      {/* テールブーム */}
      <path d="M 38 16 L 58 14.5 L 58 18.5 L 38 21 Z" fill={color} />
      <rect x="56.5" y="7" width="2.5" height="9" rx="1" fill="#9AA3B5" />
      {/* 機体 */}
      <ellipse cx="26" cy="18.5" rx="15" ry="8.5" fill={color} />
      <path d="M 32 12 Q 39.5 13.5 40.5 18.5 L 32 18.5 Z" fill="#5B9BFF" opacity="0.85" />
      {/* スキッド */}
      <line x1="15" y1="26" x2="17" y2="31" stroke="#3A4152" strokeWidth="2" />
      <line x1="34" y1="26" x2="36" y2="31" stroke="#3A4152" strokeWidth="2" />
      <line x1="12" y1="31.5" x2="41" y2="31.5" stroke="#3A4152" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
// ============ 共通スタイル ============
const cardStyle = {
  background: T.surface, borderRadius: 16, padding: 16,
  border: `1px solid ${T.line}`,
};
const inputStyle = {
  width: "100%", padding: "11px 12px", borderRadius: 10,
  border: `1.5px solid ${T.line}`, fontSize: 16, fontFamily: T.body,
  background: T.surface2, color: T.ink, boxSizing: "border-box", outline: "none",
};
const h2Style = { fontSize: 17, fontWeight: 800, margin: 0, letterSpacing: 0.5, color: T.ink };
const primaryBtn = (disabled) => ({
  padding: "13px", borderRadius: 12, border: "none",
  background: disabled ? "#3A3F4C" : `linear-gradient(135deg, ${T.red}, #E03418)`,
  color: "#fff", fontFamily: T.body, fontWeight: 800, fontSize: 16,
  letterSpacing: 1, boxShadow: disabled ? "none" : "0 4px 14px rgba(255,90,60,0.35)",
});

// ============ メイン ============
export default function App() {
  const [tab, setTab] = useState("log");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ logs: [], goal: null, titles: [], goalHistory: [], plan: null, vehicle: { type: "truck", resetBase: 0 }, customExercises: [] });
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
  const [upgradeConfirm, setUpgradeConfirm] = useState(false);
  const [prCelebration, setPrCelebration] = useState(null); // { exercise, from, to }
  const [timer, setTimer] = useState({ total: 180, left: 180, running: false, endAt: null });
  const [timerDone, setTimerDone] = useState(false);
  const [goalTarget, setGoalTarget] = useState(6);

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
      setIoMsg({ type: "ok", text: "バックアップを書き出しました。" });
    } catch (e) {
      setIoMsg({ type: "err", text: "書き出しに失敗しました。" });
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
        };
        setImportPreview(clean);
      } catch (err) {
        setIoMsg({ type: "err", text: "読み込めませんでした。正しいバックアップファイルか確認してください。" });
      }
    };
    reader.onerror = () => setIoMsg({ type: "err", text: "ファイルの読み込みに失敗しました。" });
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
    setIoMsg({ type: "ok", text: "データを復元しました。" });
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
      const pool = SHOUT_TITLES.filter((t) => !owned.has(t));
      const title = pool.length ? pool[Math.floor(Math.random() * pool.length)] : SHOUT_TITLES[Math.floor(Math.random() * SHOUT_TITLES.length)];
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
    if (EXERCISE_PRESETS.includes(name) || data.customExercises.some((c) => c.name === name)) {
      setExMsg("同じ名前の種目がすでにあります");
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
    if (target && exercise === target.name) setExercise(EXERCISE_PRESETS[0]);
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
    const q = CHARA_QUOTES[Math.floor(Math.random() * CHARA_QUOTES.length)];
    setBubble(q);
    if (bubbleTimer.current) clearTimeout(bubbleTimer.current);
    bubbleTimer.current = setTimeout(() => setBubble(null), 2000);
  };

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

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: T.bg, color: T.sub, fontFamily: T.body }}>
        <p>読み込み中…💪</p>
      </div>
    );
  }

  const tabs = [
    { id: "log", label: "記録", icon: "📝" },
    { id: "chara", label: "進化", icon: "💪" },
    { id: "truck", label: isHeli ? "ヘリ" : "軽トラ", icon: isHeli ? "🚁" : "🛻" },
    { id: "plan", label: "計画", icon: "📋" },
    { id: "goal", label: "目標", icon: "🏆" },
    { id: "settings", label: "設定", icon: "⚙️" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: T.body, color: T.ink, paddingBottom: 92 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=Zen+Kaku+Gothic+New:wght@500;700;900&display=swap');
        /* Viteテンプレートやブラウザ標準の余白・背景を打ち消す（スマホの白枠対策） */
        html, body { margin: 0 !important; padding: 0 !important; background: #12141A !important; }
        #root { max-width: none !important; margin: 0 !important; padding: 0 !important; text-align: initial !important; }
        @keyframes popIn { 0% { transform: scale(0.3) rotate(-8deg); opacity: 0; } 70% { transform: scale(1.1) rotate(2deg); } 100% { transform: scale(1) rotate(0); opacity: 1; } }
        @keyframes shake { 0%,100% { transform: rotate(0); } 25% { transform: rotate(-2.5deg); } 75% { transform: rotate(2.5deg); } }
        @keyframes fallIn { 0% { transform: translateY(-340px); opacity: 0; } 12% { opacity: 1; } 68% { transform: translateY(0); } 80% { transform: translateY(-13px); } 90% { transform: translateY(0); } 95% { transform: translateY(-4px); } 100% { transform: translateY(0); opacity: 1; } }
        @keyframes fadeUp { 0% { opacity: 0; transform: translateY(14px); } 100% { opacity: 1; transform: translateY(0); } }
        button { cursor: pointer; }
        input:focus, select:focus { border-color: #FF5A3C !important; }
        select option { background: #242834; color: #EDEFF3; }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
      `}</style>

      {/* ヘッダー */}
      <header style={{
        background: `linear-gradient(180deg, #1C1F27, #16181F)`,
        padding: "16px 16px 12px", borderBottom: `1px solid ${T.line}`,
        position: "sticky", top: 0, zIndex: 30,
      }}>
        <div style={{ maxWidth: 520, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 8, height: 30, background: T.red, borderRadius: 3 }} />
            <div>
              <h1 style={{ fontSize: 19, fontWeight: 900, margin: 0, letterSpacing: 2 }}>筋トレ進化論</h1>
              <p style={{ margin: 0, fontSize: 10, color: T.sub, letterSpacing: 3 }}>MUSCLE EVOLUTION LOG</p>
            </div>
          </div>
          <span style={{
            background: T.surface2, color: T.yellow, border: `1px solid ${T.line}`,
            fontSize: 12, fontWeight: 800, padding: "5px 12px", borderRadius: 999,
          }}>
            {STAGES[stageIdx].name}
          </span>
        </div>
      </header>

      <main style={{ maxWidth: 520, margin: "0 auto", padding: 16 }}>
        {/* ===== 記録 ===== */}
        {tab === "log" && (
          <div style={{ display: "grid", gap: 14 }}>
            {/* ストリーク＆今週 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <section style={{ ...cardStyle, padding: "12px 14px", textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 11, color: T.sub, fontWeight: 700, letterSpacing: 1 }}>🔥 ストリーク</p>
                <p style={{ margin: "2px 0 0" }}>
                  <span style={{ fontFamily: T.num, fontSize: 30, color: streak > 0 ? T.yellow : T.sub }}>{streak}</span>
                  <span style={{ fontSize: 13, marginLeft: 3 }}>回連続</span>
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 10, color: T.sub }}>中2日以内なら継続</p>
              </section>
              <section style={{ ...cardStyle, padding: "12px 14px", textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 11, color: T.sub, fontWeight: 700, letterSpacing: 1 }}>📅 今週</p>
                <p style={{ margin: "2px 0 0" }}>
                  <span style={{ fontFamily: T.num, fontSize: 30 }}>{weekCount}</span>
                  <span style={{ fontSize: 13, marginLeft: 3 }}>日</span>
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 10, color: T.sub }}>月曜はじまり</p>
              </section>
            </div>

            {/* インターバルタイマー */}
            <section style={{ ...cardStyle, borderLeft: timer.running ? `5px solid ${T.green}` : `5px solid ${T.line}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ ...h2Style, fontSize: 15 }}>⏱ インターバルタイマー</h3>
                <span style={{
                  fontFamily: T.num, fontSize: 34, letterSpacing: 1,
                  color: timer.running ? T.green : timer.left === 0 ? T.red : T.ink,
                }}>
                  {fmtTime(timer.left)}
                </span>
              </div>
              <div style={{ height: 8, background: T.surface2, borderRadius: 999, overflow: "hidden", margin: "10px 0" }}>
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
                    ⏸ 一時停止
                  </button>
                ) : (
                  <button onClick={resumeTimer} disabled={timer.left === 0 || timer.left === timer.total}
                    style={{
                      padding: "11px", borderRadius: 10, border: "none", fontWeight: 800, fontFamily: T.body, fontSize: 14,
                      background: T.surface2, color: timer.left === 0 || timer.left === timer.total ? "#555C6E" : T.green,
                    }}>
                    ▶ 再開
                  </button>
                )}
                <button onClick={resetTimer}
                  style={{ padding: "11px", borderRadius: 10, border: "none", background: T.surface2, color: T.sub, fontWeight: 800, fontFamily: T.body, fontSize: 14 }}>
                  ↺ リセット
                </button>
              </div>
              <p style={{ margin: "10px 0 0", fontSize: 11, color: T.sub }}>
                HPSの目安: 筋肥大60〜90秒 ／ パワー3分（爆発的挙上）／ 筋力5分
              </p>
            </section>

            <section style={cardStyle}>
              <h2 style={h2Style}>今日のトレーニングを記録</h2>
              <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                <select value={exercise} onChange={(e) => { setExercise(e.target.value); setExMsg(null); }} style={inputStyle}>
                  <optgroup label="基本種目">
                    {EXERCISE_PRESETS.map((e) => <option key={e} value={e}>{e}</option>)}
                  </optgroup>
                  {data.customExercises.length > 0 && (
                    <optgroup label="マイ種目">
                      {data.customExercises.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </optgroup>
                  )}
                  <option value="__add__">＋ 新しい種目を追加</option>
                </select>
                {exercise === "__add__" && (
                  <div style={{ background: T.surface2, borderRadius: 12, padding: 12, display: "grid", gap: 10, border: `1.5px dashed ${T.line}` }}>
                    <input style={{ ...inputStyle, background: T.surface }} placeholder="種目名（例: インクラインベンチ）"
                      value={customEx} onChange={(e) => { setCustomEx(e.target.value); setExMsg(null); }} />
                    <div>
                      <p style={{ margin: "0 0 7px", fontSize: 12, fontWeight: 700, color: T.sub }}>効かせる部位（複数選択できます）</p>
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
                              {on ? "✓ " : ""}{PART_LABELS[p]}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    {exMsg && <p style={{ margin: 0, fontSize: 12, color: T.red, fontWeight: 700 }}>⚠ {exMsg}</p>}
                    <button onClick={addCustomExercise}
                      disabled={!customEx.trim() || newExParts.length === 0}
                      style={{
                        padding: "12px", borderRadius: 10, border: "none", fontFamily: T.body, fontWeight: 800, fontSize: 14,
                        background: !customEx.trim() || newExParts.length === 0 ? "#3A3F4C" : T.green,
                        color: !customEx.trim() || newExParts.length === 0 ? "#777E8F" : "#0D0F13",
                      }}>
                      この種目をマイ種目に追加
                    </button>
                    <p style={{ margin: 0, fontSize: 11, color: T.sub, lineHeight: 1.6 }}>
                      追加した種目はこの端末だけに保存され、選んだ部位の成長に反映されます。
                    </p>
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  {[
                    { v: weight, set: setWeight, ph: "kg", label: "重量" },
                    { v: reps, set: setReps, ph: "回", label: "レップ" },
                    { v: sets, set: setSets, ph: "セット", label: "セット" },
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
                  記録する
                </button>
              </div>
            </section>

            {/* マイ種目の管理 */}
            {data.customExercises.length > 0 && (
              <section style={cardStyle}>
                <h3 style={{ ...h2Style, fontSize: 15 }}>💪 マイ種目</h3>
                <p style={{ fontSize: 12, color: T.sub, margin: "6px 0 4px" }}>
                  削除しても、過去の記録とキャラの成長はそのまま残ります。
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
                          }}>{PART_LABELS[p]}</span>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => setDeleteExTarget(c)} aria-label="マイ種目を削除"
                      style={{ border: "none", background: "none", color: "#555C6E", fontSize: 18, padding: 4 }}>✕</button>
                  </div>
                ))}
              </section>
            )}

            {grouped.length === 0 ? (
              <section style={{ ...cardStyle, textAlign: "center", color: T.sub }}>
                まだ記録がありません。<br />最初の1セットが進化の始まりです。
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
                        <strong style={{ fontWeight: 700 }}>{l.exercise}</strong>
                        {l.pr && (
                          <span style={{
                            marginLeft: 6, fontSize: 10, fontWeight: 900, color: "#17181C",
                            background: T.yellow, borderRadius: 6, padding: "2px 6px", verticalAlign: "middle",
                          }}>PR</span>
                        )}
                        <div style={{ color: T.sub, fontSize: 13, marginTop: 2 }}>
                          <span style={{ fontFamily: T.num, color: T.ink, fontSize: 15, letterSpacing: 0.5 }}>{l.weight}</span>kg ×{" "}
                          <span style={{ fontFamily: T.num, color: T.ink, fontSize: 15 }}>{l.reps}</span>回 ×{" "}
                          <span style={{ fontFamily: T.num, color: T.ink, fontSize: 15 }}>{l.sets}</span>セット
                        </div>
                      </div>
                      <button onClick={() => setDeleteTarget(l)} aria-label="削除"
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
              <MuscleCharacter levels={partLevels} />
              <div style={{ textAlign: "center", padding: "12px 16px 16px" }}>
                <h2 style={{ fontSize: 24, fontWeight: 900, margin: 0, letterSpacing: 2 }}>{STAGES[stageIdx].name}</h2>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: T.sub }}>{STAGES[stageIdx].desc}</p>
                <p style={{ margin: "8px 0 0", fontSize: 11, color: "#555C6E" }}>👆 タップすると喋ります</p>
              </div>
            </section>

            <section style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: T.sub, fontWeight: 700 }}>
                  トレーニング日数 <span style={{ fontFamily: T.num, fontSize: 20, color: T.ink, marginLeft: 4 }}>{uniqueDays}</span>日
                </span>
                {nextStage && <span style={{ fontSize: 12, color: T.red, fontWeight: 800 }}>進化まであと{nextStage.days - uniqueDays}日</span>}
              </div>
              <div style={{ height: 12, background: T.surface2, borderRadius: 999, overflow: "hidden" }}>
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
              <h3 style={{ ...h2Style, fontSize: 15, marginBottom: 10 }}>部位別の成長度</h3>
              <p style={{ fontSize: 12, color: T.sub, margin: "0 0 12px" }}>
                記録した種目の部位だけが育ちます。偏るとキャラも偏った体型に…！
              </p>
              <div style={{ display: "grid", gap: 9 }}>
                {ALL_PARTS.map((p) => (
                  <div key={p} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 38, fontSize: 12, fontWeight: 800, color: T.ink }}>{PART_LABELS[p]}</span>
                    <div style={{ flex: 1, height: 9, background: T.surface2, borderRadius: 999, overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 999, background: PART_COLORS[p], width: `${Math.round(partLevels[p] * 100)}%`, transition: "width 0.6s" }} />
                    </div>
                    <span style={{ width: 38, textAlign: "right", fontFamily: T.num, fontSize: 13, color: T.sub }}>{Math.round(partLevels[p] * 100)}%</span>
                  </div>
                ))}
              </div>
            </section>

            <section style={cardStyle}>
              <h3 style={{ ...h2Style, fontSize: 15 }}>獲得した称号（掛け声コレクション）</h3>
              {data.titles.length === 0 ? (
                <p style={{ color: T.sub, fontSize: 13, margin: "10px 0 0" }}>
                  まだ称号がありません。「目標」タブで2週間目標を達成すると、大会の掛け声がもらえます！
                </p>
              ) : (
                <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                  {data.titles.map((t) => (
                    <div key={t} style={{
                      background: T.surface2, color: T.yellow, fontWeight: 800, fontSize: 14,
                      padding: "11px 14px", borderRadius: 10, borderLeft: `5px solid ${T.red}`,
                    }}>「{t}」</div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ===== 軽トラ / ヘリ ===== */}
        {tab === "truck" && (() => {
          const Vehicle = isHeli ? Heli : KeiTruck;
          const vName = isHeli ? "ヘリコプター" : "軽トラ";
          const vUnit = isHeli ? "機" : "台";
          const vSpec = isHeli ? `${HELI_KG / 1000}t/機` : `最大積載${TRUCK_KG}kg`;
          return (
            <div style={{ display: "grid", gap: 14 }}>
              {canUpgrade && (
                <section style={{
                  ...cardStyle, borderLeft: `5px solid ${T.yellow}`,
                  display: "flex", alignItems: "center", gap: 12,
                }}>
                  <span style={{ fontSize: 28 }}>🚁</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: 14 }}>軽トラ100台を制覇！</p>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: T.sub }}>次のステージ「ヘリコプター（2t/機）」に挑戦できます。</p>
                  </div>
                  <button onClick={() => setUpgradeConfirm(true)}
                    style={{ padding: "10px 14px", borderRadius: 10, border: "none", background: T.yellow, color: "#17181C", fontWeight: 900, fontFamily: T.body, fontSize: 13, whiteSpace: "nowrap" }}>
                    変更する
                  </button>
                </section>
              )}

              <section style={{ ...cardStyle, textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 12, color: T.sub, fontWeight: 700, letterSpacing: 2 }}>
                  {isHeli ? "ヘリ換算の挙上量" : "総挙上量"}
                </p>
                <p style={{ fontFamily: T.num, fontSize: 44, margin: "2px 0 0", letterSpacing: 1 }}>
                  {vehicleVolume.toLocaleString()}<span style={{ fontSize: 18, marginLeft: 4 }}>kg</span>
                </p>
                <p style={{ margin: "6px 0 0", fontSize: 14, fontWeight: 700 }}>
                  = {vName}（{vSpec}）<span style={{ fontFamily: T.num, fontSize: 26, color: T.yellow, margin: "0 4px" }}>{truckCount}</span>{vUnit}分！
                </p>
                {isHeli && (
                  <p style={{ margin: "8px 0 0", fontSize: 11, color: T.sub }}>
                    🛻 軽トラ時代を含む累計：{totalVolume.toLocaleString()}kg
                  </p>
                )}
              </section>

              <section style={cardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.sub, fontWeight: 700, marginBottom: 6 }}>
                  <span>次の1{vUnit}まで</span>
                  <span style={{ color: T.ink }}>あと <span style={{ fontFamily: T.num, fontSize: 15, color: T.green }}>{(unitKg - truckRemainder).toLocaleString()}</span> kg</span>
                </div>
                <div style={{ height: 12, background: T.surface2, borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(truckRemainder / unitKg) * 100}%`, background: `linear-gradient(90deg, ${T.green}, ${T.blue})`, borderRadius: 999, transition: "width 0.6s" }} />
                </div>
              </section>

              <section style={{ ...cardStyle, background: `linear-gradient(180deg, ${T.surface} 0%, #171A21 100%)` }}>
                <h3 style={{ ...h2Style, fontSize: 15, marginBottom: 4 }}>{isHeli ? "積み上げたヘリの山" : "積み上げた軽トラの山"}</h3>
                {truckCount === 0 ? (
                  <div style={{ textAlign: "center", padding: "26px 0", color: T.sub, fontSize: 13 }}>
                    <div style={{ opacity: 0.35, display: "inline-block" }}><Vehicle size={64} /></div>
                    <p style={{ margin: "10px 0 0" }}>
                      {isHeli
                        ? `ここから第2章。合計${HELI_KG.toLocaleString()}kg挙げると最初の1機が並びます！`
                        : `まだ0台。合計${TRUCK_KG}kg挙げると最初の1台が積まれます！`}
                    </p>
                  </div>
                ) : (
                  <div style={{ paddingTop: 8 }}>
                    {truckPile.overflow > 0 && (
                      <p style={{ textAlign: "center", fontSize: 12, color: T.sub, margin: "0 0 4px" }}>
                        …ほか <strong style={{ color: T.yellow }}>{truckPile.overflow}{vUnit}</strong>（表示は100{vUnit}まで）
                      </p>
                    )}
                    {truckPile.rows.map((n, i) => {
                      const below = truckPile.rows.slice(i + 1).reduce((a, b) => a + b, 0);
                      return (
                        <div key={i} style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: i === 0 ? 0 : -6 }}>
                          {Array.from({ length: n }).map((_, j) => {
                            const globalIdx = below + j;
                            return (
                              <div key={j} style={{
                                animation: "fallIn 0.6s cubic-bezier(0.5, 0, 0.7, 0.4) both",
                                animationDelay: `${Math.min(globalIdx, 40) * 0.07}s`,
                              }}>
                                <Vehicle size={52} color={truckColor(globalIdx + truckPile.overflow)} />
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                    <div style={{ height: 5, background: "#0D0F13", borderRadius: 3, margin: "2px 8px 0" }} />
                    <p style={{ textAlign: "center", fontSize: 12, color: T.sub, margin: "10px 0 0" }}>
                      {isHeli
                        ? `あなたはヘリコプター${truckCount}機分の鉄を持ち上げました 🚁`
                        : `あなたはこれまでに軽トラ${truckCount}台分の鉄を持ち上げました 🛻`}
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
              <h2 style={h2Style}>HPS 6週間プログラム</h2>
              <p style={{ fontSize: 13, color: T.sub, margin: "8px 0 12px", lineHeight: 1.7 }}>
                月曜<strong style={{ color: DAY_TYPES.H.color }}>筋肥大（H）</strong>・水曜<strong style={{ color: DAY_TYPES.P.color }}>パワー（P）</strong>・金曜<strong style={{ color: DAY_TYPES.S.color }}>筋力（S）</strong>を6週間かけて漸進させる計画。BIG3の1RM（1回だけ挙げられる最大重量）を入れると各週の推奨重量を計算します。
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {[
                  { k: "bench", label: "ベンチ" },
                  { k: "squat", label: "スクワット" },
                  { k: "dead", label: "デッド" },
                ].map((f) => (
                  <div key={f.k}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: T.sub, letterSpacing: 1 }}>{f.label} 1RM</label>
                    <input type="number" inputMode="decimal" min="0" style={inputStyle} placeholder="kg"
                      value={rm[f.k]} onChange={(e) => setRm({ ...rm, [f.k]: e.target.value })} />
                  </div>
                ))}
              </div>
              <button onClick={generatePlan} style={{ ...primaryBtn(false), width: "100%", marginTop: 10 }}>
                {data.plan ? "計画を作り直す" : "6週間の計画を作る"}
              </button>
              {data.plan && (
                <p style={{ margin: "10px 0 0", fontSize: 11, color: T.sub, textAlign: "center" }}>
                  ✓ 保存済み（{fmtDate(data.plan.createdAt)}作成）— アプリを閉じても消えません
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
                          {d.day}　<span style={{ color: t.color }}>{d.type}：{t.name}</span>
                        </h3>
                        <span style={{ fontFamily: T.num, fontSize: 14, color: T.sub }}>{(d.pct * 100).toFixed(1)}%</span>
                      </div>
                      <div style={{ display: "flex", gap: 14, margin: "10px 0 0", fontSize: 13 }}>
                        <span><strong style={{ fontFamily: T.num, fontSize: 17 }}>{d.reps}</strong></span>
                        <span>× <strong style={{ fontFamily: T.num, fontSize: 17 }}>{d.sets}</strong> セット</span>
                        <span style={{ color: d.interval.includes("爆発") ? t.color : T.sub, fontWeight: 700 }}>{d.interval}</span>
                      </div>
                      {(data.plan.bench > 0 || data.plan.squat > 0 || data.plan.dead > 0) && (
                        <>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "10px 0 0" }}>
                            {[["ベンチ", "ベンチプレス", data.plan.bench], ["スクワット", "スクワット", data.plan.squat], ["デッド", "デッドリフト", data.plan.dead]]
                              .filter(([, , v]) => v > 0).map(([n, full, v]) => {
                                const kg = roundPlate(v * d.pct);
                                const repsNum = parseInt(d.reps, 10);
                                return (
                                  <button key={n}
                                    onClick={() => setPlanRecord({
                                      exercise: full, weight: String(kg),
                                      reps: Number.isNaN(repsNum) ? "" : String(repsNum),
                                      sets: String(d.sets),
                                      day: d.day, typeName: t.name, color: t.color,
                                      menu: `${d.reps} × ${d.sets}セット`,
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
                            👆 重量をタップすると、その場で実績を記録できます
                          </p>
                        </>
                      )}
                      <p style={{ margin: "10px 0 0", fontSize: 12, background: T.surface2, padding: "8px 11px", borderRadius: 8, color: T.sub }}>💡 {t.tip}</p>
                    </section>
                  );
                })}
                <p style={{ fontSize: 12, color: T.sub, margin: 0, padding: "0 4px", lineHeight: 1.7 }}>
                  ※ 週が進むほど水曜・金曜の強度が上がります。体調に合わせて重量は無理なく調整し、フォームが崩れたらその日は終了してください。
                </p>
              </>
            )}
          </div>
        )}

        {/* ===== 目標 ===== */}
        {tab === "goal" && (
          <div style={{ display: "grid", gap: 14 }}>
            {!data.goal ? (
              <section style={cardStyle}>
                <h2 style={h2Style}>2週間目標を立てる</h2>
                <p style={{ fontSize: 13, color: T.sub, margin: "8px 0 14px", lineHeight: 1.7 }}>
                  今日から14日間で何日トレーニングするか決めましょう。達成すると<strong style={{ color: T.yellow }}>ボディビル大会の掛け声称号</strong>を獲得！
                </p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, marginBottom: 16 }}>
                  <button onClick={() => setGoalTarget(Math.max(1, goalTarget - 1))}
                    style={{ width: 46, height: 46, borderRadius: 999, border: `1.5px solid ${T.line}`, background: T.surface2, color: T.ink, fontSize: 22 }}>−</button>
                  <div style={{ textAlign: "center" }}>
                    <span style={{ fontFamily: T.num, fontSize: 52, lineHeight: 1 }}>{goalTarget}</span>
                    <span style={{ fontSize: 15, marginLeft: 4, color: T.sub }}>日</span>
                  </div>
                  <button onClick={() => setGoalTarget(Math.min(14, goalTarget + 1))}
                    style={{ width: 46, height: 46, borderRadius: 999, border: `1.5px solid ${T.line}`, background: T.surface2, color: T.ink, fontSize: 22 }}>＋</button>
                </div>
                <button onClick={startGoal} style={{ ...primaryBtn(false), width: "100%" }}>目標スタート</button>
              </section>
            ) : (
              <section style={{ ...cardStyle, borderLeft: `5px solid ${data.goal.rewarded ? T.green : T.red}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <h2 style={h2Style}>挑戦中の目標</h2>
                  <span style={{ fontSize: 11, color: T.sub }}>{fmtDate(data.goal.start)} 〜 {fmtDate(addDays(data.goal.end, -1))}</span>
                </div>
                <p style={{ textAlign: "center", margin: "16px 0 8px" }}>
                  <span style={{ fontFamily: T.num, fontSize: 46 }}>{goalDaysCount}</span>
                  <span style={{ fontSize: 16, color: T.sub }}> / {data.goal.target}日</span>
                </p>
                <div style={{ height: 14, background: T.surface2, borderRadius: 999, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 999, transition: "width 0.6s",
                    background: data.goal.rewarded ? T.green : `linear-gradient(90deg, ${T.red}, ${T.yellow})`,
                    width: `${Math.min(100, (goalDaysCount / data.goal.target) * 100)}%`,
                  }} />
                </div>
                {data.goal.rewarded ? (
                  <p style={{ textAlign: "center", margin: "14px 0 0", fontWeight: 800, color: T.green }}>
                    🎉 達成！称号「{data.goal.title}」を獲得しました
                  </p>
                ) : (
                  <p style={{ textAlign: "center", margin: "14px 0 0", fontSize: 13, color: T.sub }}>
                    期限まであと{Math.max(0, Math.ceil((new Date(data.goal.end + "T00:00:00") - new Date(todayStr() + "T00:00:00")) / 86400000))}日。今日の1回が未来のバルク。
                  </p>
                )}
                {(goalExpired || data.goal.rewarded) && (
                  <button onClick={finishGoal} style={{
                    marginTop: 14, width: "100%", padding: "12px", borderRadius: 12,
                    border: `1.5px solid ${T.line}`, background: T.surface2, color: T.ink,
                    fontWeight: 800, fontSize: 14, fontFamily: T.body,
                  }}>この期間を締めて、次の目標へ</button>
                )}
              </section>
            )}

            {data.goalHistory.length > 0 && (
              <section style={cardStyle}>
                <h3 style={{ ...h2Style, fontSize: 15, marginBottom: 8 }}>過去の挑戦</h3>
                {data.goalHistory.map((g, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderTop: `1px solid ${T.line}`, fontSize: 13 }}>
                    <span style={{ color: T.sub }}>{fmtDate(g.start)}〜　<span style={{ color: T.ink, fontFamily: T.num, fontSize: 14 }}>{g.count}/{g.target}</span>日</span>
                    <span style={{ fontWeight: 800, color: g.achieved ? T.green : "#5A6172" }}>
                      {g.achieved ? "達成 🏆" : "未達"}
                    </span>
                  </div>
                ))}
              </section>
            )}
          </div>
        )}

        {/* ===== 設定 ===== */}
        {tab === "settings" && (
          <div style={{ display: "grid", gap: 14 }}>
            <section style={cardStyle}>
              <h2 style={h2Style}>データのバックアップ</h2>
              <p style={{ fontSize: 13, color: T.sub, margin: "8px 0 14px", lineHeight: 1.7 }}>
                記録はこの端末のブラウザ内だけに保存されています。機種変更やブラウザのデータ消去で消えるため、
                <strong style={{ color: T.ink }}>ときどき書き出して保管</strong>しておくと安心です。別の端末へ引き継ぐときもこのファイルを使います。
              </p>

              <div style={{ display: "grid", gap: 10 }}>
                <button onClick={exportData} style={{ ...primaryBtn(false), width: "100%" }}>
                  ⬇ バックアップを書き出す（JSON）
                </button>
                <label style={{
                  display: "block", textAlign: "center", padding: "13px", borderRadius: 12,
                  border: `1.5px solid ${T.line}`, background: T.surface2, color: T.ink,
                  fontWeight: 800, fontSize: 15, cursor: "pointer",
                }}>
                  ⬆ バックアップから復元する
                  <input type="file" accept="application/json,.json" onChange={handleFile} style={{ display: "none" }} />
                </label>
              </div>

              {ioMsg && (
                <p style={{
                  margin: "12px 0 0", fontSize: 13, fontWeight: 700, textAlign: "center",
                  color: ioMsg.type === "ok" ? T.green : T.red,
                }}>
                  {ioMsg.type === "ok" ? "✓ " : "⚠ "}{ioMsg.text}
                </p>
              )}
            </section>

            <section style={cardStyle}>
              <h3 style={{ ...h2Style, fontSize: 15, marginBottom: 8 }}>現在のデータ</h3>
              <div style={{ display: "grid", gap: 6, fontSize: 13 }}>
                {[
                  ["記録件数", `${data.logs.length} 件`],
                  ["トレーニング日数", `${uniqueDays} 日`],
                  ["マイ種目", `${data.customExercises.length} 個`],
                  ["獲得した称号", `${data.titles.length} 個`],
                  ["過去の目標挑戦", `${data.goalHistory.length} 回`],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: `1px solid ${T.line}` }}>
                    <span style={{ color: T.sub }}>{k}</span>
                    <span style={{ fontWeight: 800 }}>{v}</span>
                  </div>
                ))}
              </div>
            </section>

            <p style={{ fontSize: 11, color: T.sub, padding: "0 4px", lineHeight: 1.7 }}>
              ※ 復元すると今の記録はファイルの内容で<strong style={{ color: T.ink }}>すべて置き換わります</strong>。
              大事な記録がある場合は、先にバックアップを書き出しておくことをおすすめします。
            </p>
          </div>
        )}
      </main>

      {/* フッター */}
      <footer style={{ maxWidth: 520, margin: "0 auto", padding: "4px 16px 20px", textAlign: "center" }}>
        <p style={{ margin: "0 0 6px", fontSize: 11, color: "#6B7386" }}>
          {[
            { href: "/guide.html", label: "使い方ガイド" },
            { href: "/articles.html", label: "コラム" },
            { href: "/contact.html", label: "お問い合わせ" },
            { href: "/privacy.html", label: "プライバシーポリシー" },
          ].map((l, i) => (
            <span key={l.href}>
              {i > 0 && "・"}
              <a href={l.href} style={{ color: "#6B7386", textDecoration: "underline" }}>{l.label}</a>
            </span>
          ))}
        </p>
        <p style={{ margin: 0, fontSize: 11, color: "#6B7386" }}>© 2026 筋トレ進化論</p>
      </footer>

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
              自己ベスト更新！！
            </p>
            <p style={{ color: "#fff", fontWeight: 900, fontSize: 19, margin: "0 0 10px" }}>{prCelebration.exercise}</p>
            <p style={{ margin: 0 }}>
              <span style={{ fontFamily: T.num, fontSize: 26, color: T.sub, textDecoration: "line-through" }}>{prCelebration.from}kg</span>
              <span style={{ color: T.sub, fontSize: 20, margin: "0 10px" }}>→</span>
              <span style={{ fontFamily: T.num, fontSize: 44, color: T.yellow, textShadow: `0 0 24px rgba(255,201,60,0.5)` }}>{prCelebration.to}kg</span>
            </p>
            <p style={{ color: "#fff", fontWeight: 800, fontSize: 15, marginTop: 14 }}>
              「{CHARA_QUOTES[Math.floor(Math.random() * CHARA_QUOTES.length)]}」
            </p>
            <p style={{ color: T.sub, fontSize: 13, marginTop: 18 }}>タップして閉じる</p>
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
          🔔 インターバル終了！次のセット！
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
            <h3 style={{ ...h2Style, fontSize: 16 }}>🚁 ヘリコプターに変更しますか？</h3>
            <p style={{ fontSize: 13, color: T.sub, margin: "10px 0", lineHeight: 1.8 }}>
              次のステージは <strong style={{ color: T.ink }}>ヘリコプター（1機 = 2,000kg）</strong>。
              変更するとカウントが<strong style={{ color: T.red }}>リセットされ、1機目からのスタート</strong>になります。
            </p>
            <p style={{ fontSize: 12, color: T.sub, margin: "0 0 14px" }}>
              ※ トレーニング記録・キャラの成長・累計挙上量は消えません。一度変更すると軽トラには戻れません。
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button onClick={() => setUpgradeConfirm(false)}
                style={{ padding: "12px", borderRadius: 10, border: `1.5px solid ${T.line}`, background: T.surface2, color: T.ink, fontWeight: 800, fontFamily: T.body, fontSize: 14 }}>
                キャンセル
              </button>
              <button onClick={upgradeToHeli}
                style={{ padding: "12px", borderRadius: 10, border: "none", background: T.yellow, color: "#17181C", fontWeight: 900, fontFamily: T.body, fontSize: 14 }}>
                変更する
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
            <h3 style={{ ...h2Style, fontSize: 16 }}>このデータで復元しますか？</h3>
            <div style={{ background: T.surface2, borderRadius: 10, padding: "10px 12px", margin: "12px 0", fontSize: 13, display: "grid", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: T.sub }}>記録件数</span><strong>{importPreview.logs.length} 件</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: T.sub }}>称号</span><strong>{importPreview.titles.length} 個</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: T.sub }}>目標履歴</span><strong>{importPreview.goalHistory.length} 回</strong>
              </div>
            </div>
            <p style={{ fontSize: 12, color: T.red, margin: "0 0 14px", fontWeight: 700 }}>
              ⚠ 今この端末にある記録（{data.logs.length}件）はすべて上書きされます。
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button onClick={() => setImportPreview(null)}
                style={{ padding: "12px", borderRadius: 10, border: `1.5px solid ${T.line}`, background: T.surface2, color: T.ink, fontWeight: 800, fontFamily: T.body, fontSize: 14 }}>
                キャンセル
              </button>
              <button onClick={confirmImport}
                style={{ padding: "12px", borderRadius: 10, border: "none", background: T.red, color: "#fff", fontWeight: 800, fontFamily: T.body, fontSize: 14 }}>
                復元する
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
            <h3 style={{ ...h2Style, fontSize: 16 }}>この記録を削除しますか？</h3>
            <div style={{ background: T.surface2, borderRadius: 10, padding: "10px 12px", margin: "12px 0" }}>
              <strong style={{ fontWeight: 800 }}>{deleteTarget.exercise}</strong>
              <div style={{ fontSize: 13, color: T.sub, marginTop: 2 }}>
                {fmtDate(deleteTarget.date)}　{deleteTarget.weight}kg × {deleteTarget.reps}回 × {deleteTarget.sets}セット
              </div>
            </div>
            <p style={{ fontSize: 12, color: T.sub, margin: "0 0 14px" }}>削除すると元に戻せません。</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button onClick={() => setDeleteTarget(null)}
                style={{ padding: "12px", borderRadius: 10, border: `1.5px solid ${T.line}`, background: T.surface2, color: T.ink, fontWeight: 800, fontFamily: T.body, fontSize: 14 }}>
                キャンセル
              </button>
              <button onClick={() => { deleteLog(deleteTarget.id); setDeleteTarget(null); }}
                style={{ padding: "12px", borderRadius: 10, border: "none", background: T.red, color: "#fff", fontWeight: 800, fontFamily: T.body, fontSize: 14 }}>
                削除する
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
            <h3 style={{ ...h2Style, fontSize: 16 }}>📝 {planRecord.exercise} を記録</h3>
            <p style={{ fontSize: 12, color: T.sub, margin: "8px 0 12px" }}>
              {planRecord.day}（{planRecord.typeName}）のメニュー：<strong style={{ color: planRecord.color }}>{planRecord.menu}</strong>
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {[
                { k: "weight", ph: "kg", label: "重量" },
                { k: "reps", ph: "回", label: "レップ" },
                { k: "sets", ph: "セット", label: "セット" },
              ].map((f) => (
                <div key={f.k}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: T.sub, letterSpacing: 1 }}>{f.label}</label>
                  <input type="number" inputMode="decimal" min="0" style={inputStyle} placeholder={f.ph}
                    value={planRecord[f.k]} onChange={(e) => setPlanRecord({ ...planRecord, [f.k]: e.target.value })} />
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: T.sub, margin: "10px 0 0", lineHeight: 1.6 }}>
              {planRecord.menu.includes("限界")
                ? "「限界まで」の日は、実際にこなせた回数をレップに入力してください。"
                : "計画の推奨値を入れてあります。実際の重量・回数に合わせて調整してください。"}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
              <button onClick={() => setPlanRecord(null)}
                style={{ padding: "12px", borderRadius: 10, border: `1.5px solid ${T.line}`, background: T.surface2, color: T.ink, fontWeight: 800, fontFamily: T.body, fontSize: 14 }}>
                キャンセル
              </button>
              <button onClick={savePlanRecord}
                disabled={!planRecord.weight || !planRecord.reps || !planRecord.sets}
                style={{ ...primaryBtn(!planRecord.weight || !planRecord.reps || !planRecord.sets), padding: "12px", fontSize: 14, borderRadius: 10 }}>
                記録する
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
          ✅ 記録しました！「記録」タブで確認できます
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
            <h3 style={{ ...h2Style, fontSize: 16 }}>このマイ種目を削除しますか？</h3>
            <div style={{ background: T.surface2, borderRadius: 10, padding: "10px 12px", margin: "12px 0" }}>
              <strong style={{ fontWeight: 800 }}>{deleteExTarget.name}</strong>
              <div style={{ display: "flex", gap: 5, marginTop: 6, flexWrap: "wrap" }}>
                {deleteExTarget.parts.map((p) => (
                  <span key={p} style={{
                    fontSize: 10, fontWeight: 800, padding: "2px 9px", borderRadius: 999,
                    border: `1px solid ${PART_COLORS[p]}`, color: PART_COLORS[p],
                  }}>{PART_LABELS[p]}</span>
                ))}
              </div>
            </div>
            <p style={{ fontSize: 12, color: T.sub, margin: "0 0 14px", lineHeight: 1.7 }}>
              種目の選択肢から消えるだけで、この種目で記録したトレーニングとキャラの成長は残ります。
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button onClick={() => setDeleteExTarget(null)}
                style={{ padding: "12px", borderRadius: 10, border: `1.5px solid ${T.line}`, background: T.surface2, color: T.ink, fontWeight: 800, fontFamily: T.body, fontSize: 14 }}>
                キャンセル
              </button>
              <button onClick={() => { deleteCustomExercise(deleteExTarget.id); setDeleteExTarget(null); }}
                style={{ padding: "12px", borderRadius: 10, border: "none", background: T.red, color: "#fff", fontWeight: 800, fontFamily: T.body, fontSize: 14 }}>
                削除する
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
            <p style={{ color: T.yellow, fontWeight: 900, fontSize: 16, letterSpacing: 2, margin: "0 0 10px" }}>🏆 目標達成！称号獲得 🏆</p>
            <p style={{
              color: "#fff", fontWeight: 900, fontSize: 28, lineHeight: 1.6, margin: 0,
              textShadow: `0 0 24px rgba(255,90,60,0.6), 3px 3px 0 ${T.red}`,
              animation: "shake 0.6s ease-in-out 0.5s 2",
            }}>
              「{celebration}」
            </p>
            <p style={{ color: T.sub, fontSize: 13, marginTop: 22 }}>タップして閉じる</p>
          </div>
        </div>
      )}

      {/* ボトムナビ */}
      <nav style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "rgba(22,24,31,0.96)", backdropFilter: "blur(8px)",
        borderTop: `1px solid ${T.line}`, display: "flex", justifyContent: "space-around",
        padding: "8px 0 12px", zIndex: 40,
      }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              border: "none", background: "none", display: "flex", flexDirection: "column",
              alignItems: "center", gap: 3, fontFamily: T.body, fontWeight: 800,
              fontSize: 11, color: tab === t.id ? T.red : "#6B7386", padding: "4px 10px",
              borderTop: tab === t.id ? `2px solid ${T.red}` : "2px solid transparent",
            }}>
            <span style={{ fontSize: 19, filter: tab === t.id ? "none" : "grayscale(1) opacity(0.6)" }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
