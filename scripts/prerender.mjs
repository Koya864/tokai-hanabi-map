// ビルド後に実行（node scripts/prerender.mjs）。
// クローラ向けの本文HTMLと構造化データ(JSON-LD)を dist/index.html に焼き込み、
// robots.txt / sitemap.xml を dist に出力する。※ 画面の見た目は変えない（本文は #__splash で隠れ、起動後に撤去）。
import { readFileSync, writeFileSync } from "node:fs";
import { FESTIVALS } from "../src/festivals.js";

const SITE = "https://tokai-hanabi.lifeshift-group.com";
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;")
  .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const prefLabel = (p) => (p === "番外" ? "滋賀県(番外)" : p + "県");

// 開催日順
const list = [...FESTIVALS].sort((a, b) => a.date.localeCompare(b.date));

// ── クローラ向け本文（意味のある見出し＋各大会の情報） ──
const items = list.map((f) => `
    <article>
      <h2>${esc(f.name)}</h2>
      <p>${esc(prefLabel(f.pref))}・${esc(f.place)}</p>
      <p>開催日: ${esc(f.dateLabel)}／打ち上げ数: ${esc(f.shellsLabel)}／名物: ${esc(f.maxLabel)}（開花直径 約${f.maxDiaM}m）</p>
      <p>${esc(f.note)}</p>
      <p>アクセス: ${esc(f.access)}</p>
      ${f.ticketNote ? `<p>チケット: ${esc(f.ticketNote)}</p>` : ""}
      <p><a href="${esc(f.url)}">${esc(f.name)}の公式・最新情報</a></p>
    </article>`).join("");

const seoBlock = `
  <div id="__seo">
    <h1>東海4県 花火大会マップ 2026</h1>
    <p>愛知・岐阜・三重・静岡の東海4県＋近郊で2026年夏に開催される花火大会${list.length}本を、開催日・打ち上げ数・会場・チケット状況つきでマップにまとめました。名古屋からのアクセスや尺玉などの名物、有料席の受付状況も掲載しています。</p>
    ${items}
    <p>presented by <a href="https://lifeshift-group.com/">Life Shift</a></p>
  </div>`;

// ── 構造化データ（花火＝Event を ItemList で） ──
const jsonld = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "東海4県 花火大会マップ 2026",
  itemListElement: list.map((f, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: {
      "@type": "Event",
      name: f.name,
      startDate: f.date,
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      eventStatus: "https://schema.org/EventScheduled",
      description: f.note || undefined,
      image: `${SITE}/og.png`,
      url: f.url,
      location: {
        "@type": "Place",
        name: f.place,
        address: { "@type": "PostalAddress", addressRegion: f.pref === "番外" ? "滋賀県" : f.pref + "県", addressCountry: "JP" },
        geo: { "@type": "GeoCoordinates", latitude: f.lat, longitude: f.lon },
      },
    },
  })),
};
const jsonldTag = `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>`;

// ── dist/index.html へ注入 ──
const idxPath = "dist/index.html";
let html = readFileSync(idxPath, "utf8");
// 本文は #root の直後（= #__splash の前）に入れる
html = html.replace('<div id="root"></div>', `<div id="root"></div>${seoBlock}`);
// JSON-LD は </head> 直前
html = html.replace("</head>", `    ${jsonldTag}\n  </head>`);
writeFileSync(idxPath, html);

// ── robots.txt ──
writeFileSync("dist/robots.txt", `User-agent: *
Allow: /

Sitemap: ${SITE}/sitemap.xml
`);

// ── sitemap.xml（現状は1ページ構成） ──
const today = new Date().toISOString().slice(0, 10);
writeFileSync("dist/sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`);

console.log(`prerender: 本文${list.length}件 + JSON-LD を index.html へ注入、robots.txt / sitemap.xml を出力`);
