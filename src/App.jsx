import { useState, useEffect, useMemo } from "react";

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

const HPS_DAYS = {
  H: {
    label: "H — 筋肥大の日", color: "#FF5A3C",
    scheme: "メイン種目 8〜12回 × 4セット", pct: 0.7, pctLabel: "1RMの65〜75%",
    rest: "セット間 60〜90秒",
    tips: "重量より「効かせる」意識。ネガティブ動作をゆっくり。",
    sub: ["補助種目を2〜3種目（10〜15回×3セット）", "同部位を別角度から攻める", "最後は追い込みでパンプさせる"],
  },
  P: {
    label: "P — パワーの日", color: "#3DDC97",
    scheme: "メイン種目 3〜5回 × 5セット", pct: 0.65, pctLabel: "1RMの60〜70%",
    rest: "セット間 2〜3分",
    tips: "軽めの重量を全力スピードで挙げる。爆発的に！",
    sub: ["1回1回を丁寧に、疲労を残さない", "潰れる手前で必ず止める", "フォームが崩れたら即終了"],
  },
  S: {
    label: "S — 筋力の日", color: "#5B9BFF",
    scheme: "メイン種目 2〜5回 × 5セット", pct: 0.875, pctLabel: "1RMの85〜92%",
    rest: "セット間 3〜5分",
    tips: "高重量・低回数。休憩はしっかり長めに取る。",
    sub: ["ウォームアップを念入りに", "補助は最小限（1〜2種目）", "無理せずセーフティバー必須"],
  },
};

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
  const [data, setData] = useState({ logs: [], goal: null, titles: [], goalHistory: [] });
  const [celebration, setCelebration] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [exercise, setExercise] = useState("ベンチプレス");
  const [customEx, setCustomEx] = useState("");
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [sets, setSets] = useState("");
  const [rm, setRm] = useState({ bench: "", squat: "", dead: "" });
  const [plan, setPlan] = useState(null);
  const [goalTarget, setGoalTarget] = useState(6);

  useEffect(() => {
    (async () => {
      const raw = await storageGet(STORAGE_KEY);
      if (raw) {
        try { setData(JSON.parse(raw)); } catch (e) { console.error("データの読み込みに失敗", e); }
      }
      setLoading(false);
    })();
  }, []);

  const save = async (next) => {
    setData(next);
    await storageSet(STORAGE_KEY, JSON.stringify(next));
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
      classifyExercise(l.exercise).forEach(([p, w]) => { sc[p] += (l.sets || 1) * w; });
    });
    const lv = {};
    ALL_PARTS.forEach((p) => { lv[p] = sc[p] / (sc[p] + 18); }); // セット数が増えるほど1に近づく
    return lv;
  }, [data.logs]);
  const truckCount = Math.floor(totalVolume / TRUCK_KG);
  const truckRemainder = totalVolume % TRUCK_KG;

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

  const addLog = () => {
    const ex = exercise === "__custom__" ? customEx.trim() : exercise;
    if (!ex || !weight || !reps || !sets) return;
    const log = { id: Date.now(), date: todayStr(), exercise: ex, weight: Number(weight), reps: Number(reps), sets: Number(sets) };
    save({ ...data, logs: [log, ...data.logs] });
    setWeight(""); setReps(""); setSets("");
  };

  const deleteLog = (id) => save({ ...data, logs: data.logs.filter((l) => l.id !== id) });

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
    setPlan({ bench: Number(rm.bench) || 0, squat: Number(rm.squat) || 0, dead: Number(rm.dead) || 0 });
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
    { id: "truck", label: "軽トラ", icon: "🛻" },
    { id: "plan", label: "計画", icon: "📋" },
    { id: "goal", label: "目標", icon: "🏆" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: T.body, color: T.ink, paddingBottom: 92 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=Zen+Kaku+Gothic+New:wght@500;700;900&display=swap');
        @keyframes popIn { 0% { transform: scale(0.3) rotate(-8deg); opacity: 0; } 70% { transform: scale(1.1) rotate(2deg); } 100% { transform: scale(1) rotate(0); opacity: 1; } }
        @keyframes shake { 0%,100% { transform: rotate(0); } 25% { transform: rotate(-2.5deg); } 75% { transform: rotate(2.5deg); } }
        @keyframes fallIn { 0% { transform: translateY(-340px); opacity: 0; } 12% { opacity: 1; } 68% { transform: translateY(0); } 80% { transform: translateY(-13px); } 90% { transform: translateY(0); } 95% { transform: translateY(-4px); } 100% { transform: translateY(0); opacity: 1; } }
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
            <section style={cardStyle}>
              <h2 style={h2Style}>今日のトレーニングを記録</h2>
              <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                <select value={exercise} onChange={(e) => setExercise(e.target.value)} style={inputStyle}>
                  {EXERCISE_PRESETS.map((e) => <option key={e} value={e}>{e}</option>)}
                  <option value="__custom__">その他（自由入力）</option>
                </select>
                {exercise === "__custom__" && (
                  <input style={inputStyle} placeholder="種目名を入力" value={customEx} onChange={(e) => setCustomEx(e.target.value)} />
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
                  disabled={!weight || !reps || !sets || (exercise === "__custom__" && !customEx.trim())}
                  style={primaryBtn(!weight || !reps || !sets || (exercise === "__custom__" && !customEx.trim()))}>
                  記録する
                </button>
              </div>
            </section>

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
            <section style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
              <MuscleCharacter levels={partLevels} />
              <div style={{ textAlign: "center", padding: "12px 16px 16px" }}>
                <h2 style={{ fontSize: 24, fontWeight: 900, margin: 0, letterSpacing: 2 }}>{STAGES[stageIdx].name}</h2>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: T.sub }}>{STAGES[stageIdx].desc}</p>
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

        {/* ===== 軽トラ ===== */}
        {tab === "truck" && (
          <div style={{ display: "grid", gap: 14 }}>
            <section style={{ ...cardStyle, textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: 12, color: T.sub, fontWeight: 700, letterSpacing: 2 }}>総挙上量</p>
              <p style={{ fontFamily: T.num, fontSize: 44, margin: "2px 0 0", letterSpacing: 1 }}>
                {totalVolume.toLocaleString()}<span style={{ fontSize: 18, marginLeft: 4 }}>kg</span>
              </p>
              <p style={{ margin: "6px 0 0", fontSize: 14, fontWeight: 700 }}>
                = 軽トラ（最大積載{TRUCK_KG}kg）<span style={{ fontFamily: T.num, fontSize: 26, color: T.yellow, margin: "0 4px" }}>{truckCount}</span>台分！
              </p>
            </section>

            <section style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.sub, fontWeight: 700, marginBottom: 6 }}>
                <span>次の1台まで</span>
                <span style={{ color: T.ink }}>あと <span style={{ fontFamily: T.num, fontSize: 15, color: T.green }}>{(TRUCK_KG - truckRemainder).toLocaleString()}</span> kg</span>
              </div>
              <div style={{ height: 12, background: T.surface2, borderRadius: 999, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(truckRemainder / TRUCK_KG) * 100}%`, background: `linear-gradient(90deg, ${T.green}, ${T.blue})`, borderRadius: 999, transition: "width 0.6s" }} />
              </div>
            </section>

            <section style={{ ...cardStyle, background: `linear-gradient(180deg, ${T.surface} 0%, #171A21 100%)` }}>
              <h3 style={{ ...h2Style, fontSize: 15, marginBottom: 4 }}>積み上げた軽トラの山</h3>
              {truckCount === 0 ? (
                <div style={{ textAlign: "center", padding: "26px 0", color: T.sub, fontSize: 13 }}>
                  <div style={{ opacity: 0.35, display: "inline-block" }}><KeiTruck size={64} /></div>
                  <p style={{ margin: "10px 0 0" }}>まだ0台。合計{TRUCK_KG}kg挙げると最初の1台が積まれます！</p>
                </div>
              ) : (
                <div style={{ paddingTop: 8 }}>
                  {truckPile.overflow > 0 && (
                    <p style={{ textAlign: "center", fontSize: 12, color: T.sub, margin: "0 0 4px" }}>
                      …ほか <strong style={{ color: T.yellow }}>{truckPile.overflow}台</strong>（表示は100台まで）
                    </p>
                  )}
                  {truckPile.rows.map((n, i) => {
                    // 下の段から順に着地させる（globalIdx = 下から数えた台番号）
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
                              <KeiTruck size={52} color={truckColor(globalIdx + truckPile.overflow)} />
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                  <div style={{ height: 5, background: "#0D0F13", borderRadius: 3, margin: "2px 8px 0" }} />
                  <p style={{ textAlign: "center", fontSize: 12, color: T.sub, margin: "10px 0 0" }}>
                    あなたはこれまでに軽トラ{truckCount}台分の鉄を持ち上げました 🛻
                  </p>
                </div>
              )}
            </section>
          </div>
        )}

        {/* ===== 計画 ===== */}
        {tab === "plan" && (
          <div style={{ display: "grid", gap: 14 }}>
            <section style={cardStyle}>
              <h2 style={h2Style}>HPSトレーニング計画</h2>
              <p style={{ fontSize: 13, color: T.sub, margin: "8px 0 12px", lineHeight: 1.7 }}>
                1週間で <strong style={{ color: T.ink }}>筋肥大（H）→ パワー（P）→ 筋力（S）</strong> を回す計画法。BIG3の1RM（1回だけ挙げられる最大重量）を入れると推奨重量を計算します。
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
                今週の計画を作る
              </button>
            </section>

            {plan && ["H", "P", "S"].map((key, i) => {
              const d = HPS_DAYS[key];
              const dayName = ["1日目（例：月）", "2日目（例：水）", "3日目（例：金）"][i];
              return (
                <section key={key} style={{ ...cardStyle, borderLeft: `5px solid ${d.color}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <h3 style={{ fontSize: 16, fontWeight: 900, margin: 0, color: d.color, letterSpacing: 1 }}>{d.label}</h3>
                    <span style={{ fontSize: 11, color: T.sub }}>{dayName}</span>
                  </div>
                  <p style={{ margin: "10px 0 2px", fontWeight: 800 }}>{d.scheme}</p>
                  <p style={{ margin: 0, fontSize: 13, color: T.sub }}>{d.pctLabel} ／ {d.rest}</p>
                  {(plan.bench > 0 || plan.squat > 0 || plan.dead > 0) && (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "10px 0 0" }}>
                      {[["ベンチ", plan.bench], ["スクワット", plan.squat], ["デッド", plan.dead]]
                        .filter(([, v]) => v > 0).map(([n, v]) => (
                          <span key={n} style={{ background: T.surface2, border: `1px solid ${T.line}`, borderRadius: 8, padding: "6px 10px", fontSize: 13, fontWeight: 700 }}>
                            {n} <span style={{ fontFamily: T.num, fontSize: 15, color: d.color }}>{roundPlate(v * d.pct)}</span>kg
                          </span>
                        ))}
                    </div>
                  )}
                  <p style={{ margin: "10px 0 6px", fontSize: 13, background: T.surface2, padding: "9px 11px", borderRadius: 8, color: T.ink }}>💡 {d.tips}</p>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: T.sub, lineHeight: 1.8 }}>
                    {d.sub.map((s) => <li key={s}>{s}</li>)}
                  </ul>
                </section>
              );
            })}
            {plan && (
              <p style={{ fontSize: 12, color: T.sub, margin: 0, padding: "0 4px" }}>
                ※ 各日の間に休息日を1日以上はさむのがおすすめ。体調に合わせて重量は無理なく調整してください。
              </p>
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
      </main>

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
