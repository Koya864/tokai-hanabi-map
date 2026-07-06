// tokai.geojson → src/mapData.js（App.jsxと同一の線形投影でSVGパス化）
import { readFileSync, writeFileSync } from "node:fs";

const MW = 460, MH = 440;
const LON0 = 135.55, LON1 = 139.5, LAT0 = 33.35, LAT1 = 36.75;
const px = (lon) => ((lon - LON0) / (LON1 - LON0)) * MW;
const py = (lat) => ((LAT1 - lat) / (LAT1 - LAT0)) * MH;

const gj = JSON.parse(readFileSync(process.argv[2], "utf8"));
const TOKAI_IDS = { 23: "愛知", 21: "岐阜", 24: "三重", 22: "静岡" };

function ringToPath(ring) {
  return "M" + ring.map(([lo, la]) => `${px(lo).toFixed(1)} ${py(la).toFixed(1)}`).join("L") + "Z";
}
function geomToPath(geom) {
  const polys = geom.type === "MultiPolygon" ? geom.coordinates : [geom.coordinates];
  let d = "", area = 0;
  for (const poly of polys) {
    for (const ring of poly) {
      // 面積2px未満の島は捨てる（描画ノイズ削減）
      let a = 0;
      for (let i = 0; i < ring.length - 1; i++) {
        a += px(ring[i][0]) * py(ring[i + 1][1]) - px(ring[i + 1][0]) * py(ring[i][1]);
      }
      a = Math.abs(a / 2);
      if (a < 2) continue;
      d += ringToPath(ring);
      area += a;
    }
  }
  return { d, area };
}
function bbox(geom) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  const polys = geom.type === "MultiPolygon" ? geom.coordinates : [geom.coordinates];
  for (const poly of polys) for (const ring of poly) for (const [lo, la] of ring) {
    const x = px(lo), y = py(la);
    if (x < x0) x0 = x; if (x > x1) x1 = x;
    if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  return [x0, y0, x1 - x0, y1 - y0].map((v) => +v.toFixed(1));
}

const tokai = {}, tokaiBBox = {}, others = [];
for (const f of gj.features) {
  const { d, area } = geomToPath(f.geometry);
  if (!d) continue;
  const name = TOKAI_IDS[f.properties.id];
  if (name) {
    tokai[name] = d;
    tokaiBBox[name] = bbox(f.geometry);
  } else if (area > 4) {
    others.push(d);
  }
}
console.log("tokai:", Object.keys(tokai), "others:", others.length);

const out = `// 自動生成: 実際の都道府県境界（dataofjapan/land を簡略化）から変換
// 投影: 経度${LON0}〜${LON1} 緯度${LAT0}〜${LAT1} → ${MW}x${MH}
export const TOKAI_PATHS = ${JSON.stringify(tokai, null, 0)};
export const TOKAI_BBOX = ${JSON.stringify(tokaiBBox)};
export const OTHER_LAND = ${JSON.stringify(others)};
`;
writeFileSync(process.argv[3], out);
console.log("written:", process.argv[3], out.length, "chars");
