// ファビコン・OGP画像を生成する（node scripts/gen-assets.mjs）
// 出力: public/favicon.svg, public/apple-touch-icon.png, public/favicon-32.png, public/og.png
import sharp from "sharp";
import { writeFileSync } from "node:fs";

const rnd = (a, b) => a + Math.random() * (b - a);

// ── リアルな花火バースト ──
// 微粒子が放射状に飛び、外側ほど明るい光点＋内側に尾を引く光跡、中心にコア発光。
// palette: 主色の配列（先端の光点や粒に使う）。core: 中心発光色。
function firework(cx, cy, R, palette, {
  rays = 90,      // 放射する筋の数
  trail = 8,      // 各筋の尾を構成する粒の数
  droop = 0.18,   // 重力で下に垂れる度合い（しだれ花火感）
  spark = 60,     // 周囲に散る細かい火の粉
  core = "#fff6d8",
  seedGlow = true,
} = {}) {
  const pick = () => palette[(Math.random() * palette.length) | 0];
  let s = "";
  // 1) 外側のぼんやりした光（アンビエントグロー）
  if (seedGlow) {
    s += `<circle cx="${cx}" cy="${cy}" r="${(R * 1.15).toFixed(1)}" fill="${palette[0]}" opacity="0.10" filter="url(#soft)"/>`;
  }
  // 2) 放射する筋（尾→先端）
  for (let i = 0; i < rays; i++) {
    const a = (Math.PI * 2 * i) / rays + rnd(-0.02, 0.02);
    const len = R * rnd(0.72, 1.0);
    const col = pick();
    const dch = a > 0 ? droop * len : droop * len; // 下側ほど垂れる
    for (let k = 1; k <= trail; k++) {
      const t = k / trail;                       // 0→1（内→外）
      const rr = len * (0.34 + 0.66 * t);
      let x = cx + Math.cos(a) * rr;
      let y = cy + Math.sin(a) * rr + dch * t * t; // 外側ほど重力で下降
      const sz = (0.5 + 2.0 * t).toFixed(2);       // 先端ほど大きい
      const op = (0.12 + 0.75 * t * t).toFixed(2); // 先端ほど明るい
      s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${sz}" fill="${col}" opacity="${op}"/>`;
    }
    // 先端の明るい光点（白コア＋色）
    const ex = cx + Math.cos(a) * len, ey = cy + Math.sin(a) * len + dch;
    s += `<circle cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="${(R * 0.03 + 1.6).toFixed(1)}" fill="${col}" filter="url(#soft)" opacity="0.9"/>`;
    s += `<circle cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="1.3" fill="#ffffff" opacity="0.95"/>`;
  }
  // 3) 周囲の火の粉
  for (let i = 0; i < spark; i++) {
    const a = rnd(0, Math.PI * 2), rr = R * rnd(0.5, 1.25);
    const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr + rnd(0, R * 0.2);
    s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rnd(0.4, 1.3).toFixed(2)}" fill="${pick()}" opacity="${rnd(0.15, 0.7).toFixed(2)}"/>`;
  }
  // 4) 中心のフラッシュ
  s += `<circle cx="${cx}" cy="${cy}" r="${(R * 0.16).toFixed(1)}" fill="${core}" opacity="0.5" filter="url(#soft)"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="${(R * 0.06).toFixed(1)}" fill="#ffffff" opacity="0.95"/>`;
  return s;
}

const DEFS = `<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0.3" y2="1">
    <stop offset="0%" stop-color="#070b1c"/><stop offset="55%" stop-color="#0e1730"/><stop offset="100%" stop-color="#16213f"/>
  </linearGradient>
  <filter id="soft" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="3.2"/></filter>
  <filter id="bokeh" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="7"/></filter>
</defs>`;

const GOLD = ["#fff2c8", "#ffd27a", "#ffb347", "#ff9e3d"];
const PINK = ["#ffd0dd", "#ff7ab8", "#ff4d6d", "#ff9ec4"];
const CYAN = ["#e6fbff", "#7df9ff", "#3dd6f5", "#9fe0ff"];
const MIX = ["#c77dff", "#8aff80", "#ffd27a", "#7df9ff"];

// ── OGP 画像（1200x630・PNG） ──
const W = 1200, H = 630;
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  ${DEFS}
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  <!-- 遠景のボケ花火（奥行き） -->
  <g filter="url(#bokeh)" opacity="0.5">
    ${firework(1000, 470, 55, PINK, { rays: 40, trail: 5, spark: 20, seedGlow: false })}
    ${firework(1150, 250, 42, CYAN, { rays: 36, trail: 5, spark: 16, seedGlow: false })}
  </g>
  <!-- 主役の花火 -->
  ${firework(905, 165, 132, GOLD, { rays: 110, trail: 9, droop: 0.22, spark: 80 })}
  ${firework(1075, 360, 82, PINK, { rays: 80, trail: 8, droop: 0.16, spark: 50 })}
  ${firework(770, 95, 60, CYAN, { rays: 60, trail: 7, droop: 0.12, spark: 30 })}
  ${firework(1045, 545, 52, MIX, { rays: 54, trail: 7, droop: 0.14, spark: 26 })}
  <!-- テキスト -->
  <text x="80" y="250" font-size="30" letter-spacing="8" fill="#ffb347" font-family="'Helvetica Neue',Arial,sans-serif" font-weight="700">TOKAI HANABI 2026</text>
  <rect x="82" y="270" width="70" height="4" rx="2" fill="#ffb347"/>
  <text x="76" y="372" font-size="78" fill="#f4f7ff" font-family="'Hiragino Mincho ProN',serif" font-weight="700">東海4県 花火大会マップ</text>
  <text x="80" y="446" font-size="31" fill="#c7d1ec" font-family="'Hiragino Kaku Gothic ProN',sans-serif">30の花火大会を、日程・規模・チケット状況でマップに。</text>
  <text x="80" y="560" font-size="26" fill="#9fb0d8" font-family="'Helvetica Neue',Arial,sans-serif" letter-spacing="1">tokai-hanabi.lifeshift-group.com</text>
</svg>`;
await sharp(Buffer.from(og)).png().toFile("public/og.png");

// ── ファビコン（小サイズでも読める密度の花火） ──
const fav = (S) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}">
  ${DEFS}
  <rect width="${S}" height="${S}" rx="${S * 0.22}" fill="#0b1226"/>
  ${firework(S * 0.5, S * 0.46, S * 0.4, [...GOLD, "#ff7ab8", "#7df9ff", "#c77dff"], { rays: 40, trail: 5, droop: 0.14, spark: 22 })}
</svg>`;
writeFileSync("public/favicon.svg", fav(64));
await sharp(Buffer.from(fav(180))).png().resize(180, 180).toFile("public/apple-touch-icon.png");
await sharp(Buffer.from(fav(64))).png().resize(32, 32).toFile("public/favicon-32.png");

console.log("generated: favicon.svg / apple-touch-icon.png / favicon-32.png / og.png");
