// ファビコン・OGP画像を生成する（node scripts/gen-assets.mjs）
// 出力: public/favicon.svg, public/apple-touch-icon.png, public/favicon-32.png, public/og.png
import sharp from "sharp";
import { writeFileSync } from "node:fs";

const GOLD = "#ffb347", GOLDL = "#ffe08a";
const VIVID = ["#ff4d6d", "#ffd23f", "#3dd6f5", "#8aff80", "#c77dff", "#ff9e3d", "#7df9ff"];

// 花火バースト（放射状の線＋先端の光点）を SVG 文字列で返す
function burst(cx, cy, R, colors, n = 16, inner = 0.28, sw = 3) {
  let s = "";
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n;
    const x0 = cx + Math.cos(a) * R * inner, y0 = cy + Math.sin(a) * R * inner;
    const x1 = cx + Math.cos(a) * R, y1 = cy + Math.sin(a) * R;
    const c = colors[i % colors.length];
    s += `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="${c}" stroke-width="${sw}" stroke-linecap="round" opacity="0.92"/>`;
    s += `<circle cx="${x1.toFixed(1)}" cy="${y1.toFixed(1)}" r="${(sw * 0.9).toFixed(1)}" fill="${c}"/>`;
  }
  s += `<circle cx="${cx}" cy="${cy}" r="${(R * inner * 0.7).toFixed(1)}" fill="#fff" opacity="0.95"/>`;
  return s;
}

// ── ファビコン（64x64・SVG） ──
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs><radialGradient id="bg" cx="50%" cy="42%" r="70%">
    <stop offset="0%" stop-color="#16213f"/><stop offset="100%" stop-color="#0b1226"/></radialGradient></defs>
  <rect width="64" height="64" rx="14" fill="url(#bg)"/>
  ${burst(32, 30, 22, [GOLD, GOLDL, "#ff7ab8", "#7df9ff", GOLD, GOLDL, "#c77dff", "#8aff80"], 16, 0.2, 3)}
</svg>`;
writeFileSync("public/favicon.svg", favicon);

// apple-touch-icon 用（角丸なし・余白付き 180x180）
const iconLarge = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180">
  <rect width="180" height="180" fill="#0b1226"/>
  ${burst(90, 84, 62, [GOLD, GOLDL, "#ff7ab8", "#7df9ff", GOLD, GOLDL, "#c77dff", "#8aff80"], 18, 0.2, 7)}
</svg>`;
await sharp(Buffer.from(iconLarge)).png().resize(180, 180).toFile("public/apple-touch-icon.png");
await sharp(Buffer.from(favicon)).png().resize(32, 32).toFile("public/favicon-32.png");

// ── OGP 画像（1200x630・PNG） ──
const W = 1200, H = 630;
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0%" stop-color="#0b1226"/><stop offset="60%" stop-color="#111a36"/><stop offset="100%" stop-color="#16213f"/>
    </linearGradient>
    <radialGradient id="glow" cx="72%" cy="30%" r="55%">
      <stop offset="0%" stop-color="#ffb34733"/><stop offset="100%" stop-color="#ffb34700"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  ${burst(900, 150, 120, [GOLD, GOLDL, "#ffd23f", "#ff9e3d"], 20, 0.24, 4)}
  ${burst(1070, 330, 78, ["#ff4d6d", "#ff7ab8", GOLDL], 16, 0.26, 3)}
  ${burst(770, 95, 66, ["#3dd6f5", "#7df9ff", "#fff"], 16, 0.26, 3)}
  ${burst(1030, 520, 60, ["#c77dff", "#8aff80", GOLDL], 14, 0.26, 3)}
  <text x="80" y="250" font-size="30" letter-spacing="8" fill="${GOLD}" font-family="'Helvetica Neue',Arial,sans-serif" font-weight="700">TOKAI HANABI 2026</text>
  <rect x="82" y="270" width="70" height="4" rx="2" fill="${GOLD}"/>
  <text x="76" y="372" font-size="78" fill="#f4f7ff" font-family="'Hiragino Mincho ProN',serif" font-weight="700">東海4県 花火大会マップ</text>
  <text x="80" y="446" font-size="31" fill="#c7d1ec" font-family="'Hiragino Kaku Gothic ProN',sans-serif">30の花火大会を、日程・規模・チケット状況でマップに。</text>
  <text x="80" y="560" font-size="26" fill="#9fb0d8" font-family="'Helvetica Neue',Arial,sans-serif" letter-spacing="1">tokai-hanabi.lifeshift-group.com</text>
</svg>`;
await sharp(Buffer.from(og)).png().toFile("public/og.png");

console.log("generated: public/favicon.svg, apple-touch-icon.png, favicon-32.png, og.png");
