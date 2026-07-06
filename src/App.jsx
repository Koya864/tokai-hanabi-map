import React, { useState, useEffect, useRef, useMemo } from "react";
import { TOKAI_PATHS, TOKAI_BBOX, OTHER_LAND } from "./mapData.js";

// ═════════════════════════════════════════════════════════════
// ■ 大会データの編集方法（このファイルの管理者のみ）
//
// 下の FESTIVALS 配列に1ブロックをコピペして書き換え、
// `npm run deploy` で公開サイトに反映します。
// （閲覧者が画面から編集することはできません）
//
// ── コピペ用テンプレート ──────────────────────────
// { id:"unique-id",                  // 半角英数のユニークな名前
//   name:"◯◯花火大会", pref:"愛知",  // 愛知/岐阜/三重/静岡/番外
//   date:"2026-08-01",               // 開催日 (YYYY-MM-DD)
//   dateLabel:"8/1(土) 19:00〜",     // 画面に出す日付の文字
//   verified:true,                   // 日程を公式で確認済みなら true
//   shells:10000,                    // 打ち上げ数
//   shellsLabel:"約10,000発",
//   durationMin:90,                  // 打ち上げ時間(分)
//   lat:35.0, lon:137.0,             // 緯度・経度（Googleマップで右クリック→コピー）
//   place:"◯◯市 ◯◯河畔",
//   venue:"river",                   // river / sea / lake / park
//   venueLabel:"◯◯川の河畔",
//   maxLabel:"尺玉", maxDiaM:320,    // 名物の玉と開花直径(m)
//   access:"名古屋から:◯◯で約◯分",
//   tickets:[                        // チケット受付期間（自動でステータス判定）
//     { label:"有料席（先着）", type:"sale",    start:"2026-06-13", end:null },
//     { label:"カメラ席（抽選）", type:"lottery", start:"2026-07-07", end:"2026-07-17" },
//   ],                               // start/end 不明なら null（開催日まで受付扱い）
//   ticketNote:"補足メモ",
//   url:"https://...",               // 公式サイト
//   note:"見どころの説明" },
// ─────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════
const FESTIVALS = [
  { id:"toyohashi", name:"豊橋祇園祭 打上花火", pref:"愛知",
    date:"2026-07-18", dateLabel:"7/17(金)手筒・7/18(土)打上", verified:true,
    shells:12000, shellsLabel:"約12,000発（例年）", durationMin:110,
    lat:34.78, lon:137.39, place:"豊橋市 豊川河畔・吉田神社",
    venue:"river", venueLabel:"豊川の河畔", maxLabel:"手筒花火＋尺玉", maxDiaM:300,
    access:"名古屋から:名鉄特急で約50分",
    tickets:[], statusOverride:{kind:"soldout", label:"完売"},
    ticketNote:"桟敷席（6,000円）は完売（公式発表）。入手はチケット流通センター等の二次流通のみ",
    url:"https://www.toyohashigion.org/",
    note:"手筒花火発祥の地。初日は境内で手筒、2日目に河畔で打上。" },
  { id:"minato", name:"海の日名古屋みなと祭花火大会", pref:"愛知",
    date:"2026-07-20", dateLabel:"7/20(月・祝 海の日)", verified:true,
    shells:3000, shellsLabel:"約3,000発（例年）", durationMin:35,
    lat:35.09, lon:136.88, place:"名古屋市 名古屋港ガーデンふ頭",
    venue:"sea", venueLabel:"名古屋港の海上台船", maxLabel:"海上打上の尺玉", maxDiaM:320,
    access:"名古屋から:地下鉄名古屋港駅すぐ（市内で最も気軽）",
    tickets:[{label:"有料協賛席", type:"sale", start:null, end:null}],
    ticketNote:"販売状況は公式発表を確認",
    url:"https://hanabi-navi.info/tokai-region/pref-aichi/",
    note:"発数は少なめでも、海上台船からの尺玉とメロディー花火の質が高い都市型花火。" },
  { id:"kuwana", name:"桑名水郷花火大会", pref:"三重",
    date:"2026-07-25", dateLabel:"7/25(土) 19:30〜21:00", verified:true,
    shells:10000, shellsLabel:"約10,000発", durationMin:90,
    lat:35.07, lon:136.69, place:"桑名市 揖斐川河畔(鍋屋堤)",
    venue:"river", venueLabel:"揖斐川の川面", maxLabel:"東海最大級の二尺玉", maxDiaM:600,
    access:"名古屋から:近鉄特急で約20分（桑名駅から徒歩20分）",
    tickets:[], statusOverride:{kind:"soldout", label:"公式販売終了（完売）"},
    ticketNote:"楽天チケットの公式販売は終了（完売とみられる）。例年は当日券エリアの設定例あり。2026年は三重初のドローンショーも",
    url:"https://kuwana-hanabi.com/",
    note:"1934年から続く水郷の花火。直径約600mの二尺玉が名物。" },
  { id:"fukuroi", name:"ふくろい遠州の花火", pref:"静岡",
    date:"2026-07-25", dateLabel:"7/25(土) 19:20〜21:00", verified:true,
    shells:25000, shellsLabel:"約25,000発（例年）", durationMin:100,
    lat:34.75, lon:137.92, place:"袋井市 原野谷川親水公園",
    venue:"river", venueLabel:"原野谷川の河畔", maxLabel:"尺玉・空中ナイアガラ", maxDiaM:320,
    access:"名古屋から:新幹線+JRで約80分（愛野駅・袋井駅から徒歩20分）",
    tickets:[{label:"有料席 約3.1万席（ブロック席5,500円〜）", type:"sale", start:"2026-06-13", end:null}],
    statusOverride:{kind:"sale", label:"販売中（一部完売）"},
    ticketNote:"イス席A〜D(7,500円)・ブロック席(5,500円)は販売中。ペアイス席・カメラ席は完売、ファミリー席は残少（6/29時点）",
    url:"https://www.fukuroi-hanabi.jp/",
    note:"全国の花火名人による選抜競技大会。日本十大花火のひとつ。" },
  { id:"ise", name:"伊勢神宮奉納全国花火大会", pref:"三重",
    date:"2026-07-18", dateLabel:"7/18(土) 19:20〜21:00", verified:true,
    shells:8400, shellsLabel:"約8,400発", durationMin:100,
    lat:34.49, lon:136.7, place:"伊勢市 宮川河畔(度会橋上流)",
    venue:"river", venueLabel:"宮川の河畔", maxLabel:"全国競技会の芸術玉", maxDiaM:280,
    access:"名古屋から:近鉄特急で約85分",
    tickets:[
      {label:"有料観覧席 市民先行（先着）", type:"sale", start:"2026-05-08", end:"2026-05-08"},
      {label:"有料観覧席 一般販売（先着・売切次第終了）", type:"sale", start:"2026-05-09", end:null}],
    ticketNote:"先着順（抽選なし）。個人自由席3,000円〜、指定席(6人)18,000〜21,000円。チケットぴあ・コンビニで販売",
    url:"https://www.city.ise.mie.jp/hanabi/osirase/index.html",
    note:"第74回。日本三大競技花火のひとつ。全国の花火師が神宮に奉納する芸術花火。荒天時は9/5(土)に延期。" },
  { id:"oiden", name:"豊田おいでんまつり花火大会", pref:"愛知",
    date:"2026-07-26", dateLabel:"7/26(日) 19:00〜20:40", verified:true,
    shells:13000, shellsLabel:"約13,000発（例年）", durationMin:100,
    lat:35.08, lon:137.16, place:"豊田市 白浜公園一帯(矢作川)",
    venue:"river", venueLabel:"矢作川の河川敷", maxLabel:"メロディ花火・大ナイアガラ", maxDiaM:300,
    access:"名古屋から:名鉄で約60分（豊田市駅から徒歩10分）",
    tickets:[{label:"個人協賛席 先着受付", type:"sale", start:"2026-07-04", end:null}],
    ticketNote:"抽選受付は終了。残席分の先着受付が7/4開始・販売中（チケットぴあ）。※夏開催は2026年が最後、2027年から秋開催へ変更",
    url:"https://www.oidenmaturi.com/",
    note:"メロディ花火・大手筒・ナイアガラ。中部有数の規模で約35万人が来場。" },
  { id:"gamagori", name:"蒲郡まつり納涼花火大会", pref:"愛知",
    date:"2026-07-26", dateLabel:"7/26(日) 19:30〜21:00（祭は25・26日）", verified:true,
    shells:5000, shellsLabel:"約5,000発（例年）", durationMin:90,
    lat:34.82, lon:137.22, place:"蒲郡市 竹島ふ頭周辺(三河湾)",
    venue:"sea", venueLabel:"三河湾の海上", maxLabel:"正三尺玉×3発（太平洋岸最大級）", maxDiaM:650,
    access:"名古屋から:JR・名鉄で約50分（蒲郡駅から徒歩3分）",
    tickets:[{label:"特別観覧エリア（シングル6,000円〜）", type:"sale", start:"2026-05-27", end:null}],
    ticketNote:"5/27から先着募集中（今年は販売数増）。完売告知なし",
    url:"https://hanabi.walkerplus.com/detail/ar0623e00800/",
    note:"直径約650mに開く正三尺玉が3発。全国でも数えるほどの大玉が海上に咲く。" },
  { id:"okazaki", name:"岡崎城下家康公夏まつり 第78回花火大会", pref:"愛知",
    date:"2026-08-01", dateLabel:"8/1(土) 19:00〜20:30 ※順延なし", verified:true,
    shells:20000, shellsLabel:"約20,000発（例年）", durationMin:90,
    lat:34.95, lon:137.17, place:"岡崎市 乙川・矢作川河畔",
    venue:"river", venueLabel:"乙川河畔・岡崎城を背景に", maxLabel:"三河花火・金魚花火・仕掛花火", maxDiaM:320,
    access:"名古屋から:名鉄で約30分（東岡崎駅・岡崎公園前駅から徒歩10分）",
    tickets:[
      {label:"市民先行販売（抽選）", type:"lottery", start:"2026-06-12", end:"2026-06-29"},
      {label:"一般販売（先着）", type:"sale", start:"2026-07-11", end:null}],
    ticketNote:"市民先行・ふるさと納税枠は受付終了。一般販売は7/11(土)10:00開始（先着・売切次第終了）。打上会場近くに無料観覧エリアなし（チケット必須）",
    url:"https://okazaki-kanko.jp/feature/hanabitaikai/hanabitokusyu",
    note:"三河花火発祥の地・家康公生誕の地の伝統花火。お城×花火の構図は全国的にも希少。" },
  { id:"nagaragawa", name:"ぎふ長良川花火大会", pref:"岐阜",
    date:"2026-08-08", dateLabel:"8/8(土) 19:30〜20:40頃（荒天時8/22延期）", verified:true,
    shells:10000, shellsLabel:"非公表（1万発規模と推定）", durationMin:70,
    lat:35.44, lon:136.77, place:"岐阜市 長良川河畔(長良橋〜金華橋)",
    venue:"river", venueLabel:"長良川・金華山を背景に", maxLabel:"尺玉・ワイドスターマイン", maxDiaM:320,
    access:"名古屋から:JRで約20分+バス（岐阜駅からバス15分）",
    tickets:[{label:"有料観覧席 一般販売（先着）", type:"sale", start:"2026-07-08", end:"2026-08-08"}],
    ticketNote:"市民先行・EX会員先行は終了。一般販売は7/8(水)10:00開始（ネット・セブンイレブン、予定席数に達し次第終了）",
    url:"https://nagara-hanabi.jp/",
    note:"旧「全国選抜長良川中日花火大会」と「全国花火大会」が2023年に統合して誕生した大会。" },
  { id:"tokai", name:"東海まつり花火大会", pref:"愛知",
    date:"2026-08-08", dateLabel:"8/8(土) 19:20〜20:30", verified:true,
    shells:4000, shellsLabel:"約4,000発", durationMin:70,
    lat:35.02, lon:136.9, place:"東海市 大池公園",
    venue:"park", venueLabel:"大池公園の池畔", maxLabel:"大スターマイン", maxDiaM:200,
    access:"名古屋から:名鉄で約25分（太田川駅から徒歩15分）",
    tickets:[{label:"有料観覧席", type:"sale", start:null, end:null}],
    ticketNote:"東海市観光協会サイト参照",
    url:"https://hanabi.walkerplus.com/detail/ar0623e00812/",
    note:"観覧席と打上場所が近く迫力大。大池に映る花火も見どころ。" },
  { id:"nagashima", name:"ナガシマスパーランド 花火大競演", pref:"三重",
    date:"2026-08-09", dateLabel:"8/9〜8/29の間の10日間開催", verified:true,
    shells:3000, shellsLabel:"1夜あたり数千発規模（推定）", durationMin:30,
    lat:35.03, lon:136.73, place:"桑名市 ナガシマスパーランド",
    venue:"park", venueLabel:"遊園地の敷地内", maxLabel:"至近距離のワイド演出", maxDiaM:250,
    access:"名古屋から:名鉄バスセンターから直通バス約50分",
    tickets:[{label:"遊園地入場券で観覧可", type:"sale", start:null, end:"2026-08-29"}],
    ticketNote:"開催日: 8/9,10,11,12,13,14,15,22,23,29",
    url:"https://www.enjoytokyo.jp/event/list/regn08/cat0906/",
    note:"日程の自由度が最大の選択肢。プールや乗り物とセットで楽しめる。" },
  { id:"anjin", name:"按針祭 海の花火大会（伊東）", pref:"静岡",
    date:"2026-08-10", dateLabel:"8/10(月)", verified:true,
    shells:20000, shellsLabel:"約20,000発", durationMin:60,
    lat:34.97, lon:139.09, place:"伊東市 伊東海岸一帯",
    venue:"sea", venueLabel:"伊東の海上ワイド", maxLabel:"海上ワイドスターマイン", maxDiaM:320,
    access:"名古屋から:新幹線+伊東線で約3時間（遠征向き・宿泊推奨）",
    tickets:[{label:"有料席", type:"sale", start:null, end:null}],
    ticketNote:"例年の人出約18万人。宿は早めに",
    url:"https://hanabi.walkerplus.com/launch/ar0600/",
    note:"海上ワイドスターマイン。東海エリア打上数トップクラス。" },
  { id:"bisai", name:"びさい夏まつり 花火大会", pref:"愛知",
    date:"2026-08-08", dateLabel:"8/8(土)", verified:true,
    shells:3000, shellsLabel:"数千発規模（推定）", durationMin:60,
    lat:35.31, lon:136.76, place:"一宮市 木曽川・尾西河川敷グラウンド",
    venue:"river", venueLabel:"木曽川の川面", maxLabel:"川面に上がる大玉", maxDiaM:280,
    access:"名古屋から:JR尾張一宮駅からバス（起方面）",
    tickets:[],
    ticketNote:"有料席情報は公式発表を確認",
    url:"https://www.138ss.com/event/detail/8/",
    note:"旧・濃尾大花火（2022年に廃止）の流れを汲む一宮市側の花火大会。木曽川の川面に大玉が上がる。" },
  { id:"kariya", name:"刈谷わんさか祭り 花火大会", pref:"愛知",
    date:"2026-08-15", dateLabel:"8/15(土) 19:30〜20:15（前夜祭8/14）", verified:true,
    shells:7000, shellsLabel:"約7,000発", durationMin:45,
    lat:35.02, lon:137.0, place:"刈谷市 総合運動公園",
    venue:"park", venueLabel:"総合運動公園の芝生広場", maxLabel:"スターライトシンフォニー＋ドローンショー", maxDiaM:220,
    access:"名古屋から:名鉄で約30分（富士松駅から徒歩圏）",
    tickets:[], statusOverride:{kind:"none", label:"一般有料席なし"},
    ticketNote:"協賛席のみ・一般販売なし。場所取りは前日朝から受付。市制75周年ドローンショーあり",
    url:"https://www.kariya-wansaka.jp/",
    note:"音楽シンクロの「スターライトシンフォニー」が名物。45分に7,000発の高密度打上。" },
  { id:"kumano", name:"熊野大花火大会", pref:"三重",
    date:"2026-08-17", dateLabel:"8/17(月) ※毎年17日固定", verified:true,
    shells:10000, shellsLabel:"約10,000発", durationMin:105,
    lat:33.9, lon:136.12, place:"熊野市 七里御浜海岸・鬼ヶ城",
    venue:"sea", venueLabel:"七里御浜の海上・鬼ヶ城", maxLabel:"三尺玉海上自爆・鬼ヶ城大仕掛け", maxDiaM:600,
    access:"名古屋から:特急南紀で約3時間／車で約2時間半（宿泊推奨）",
    tickets:[
      {label:"浜席 一般発売（先着）", type:"sale", start:"2026-07-01", end:"2026-08-16"},
      {label:"協賛観覧席・カメラ席（抽選）", type:"lottery", start:"2026-07-07", end:"2026-07-17"}],
    ticketNote:"浜席はチケットぴあで販売中（〜8/16 17:00）。堤防席限定抽選は受付終了。ふるさと納税枠もあり",
    url:"https://www.kumano-kankou.info/kumano-fireworks/",
    note:"世界遺産・鬼ヶ城の岩場で炸裂する大仕掛けは全身に響く迫力。" },
  { id:"kihoku", name:"きほく燈籠祭", pref:"三重",
    date:"2026-07-25", dateLabel:"7/25(土) 19:30〜20:30", verified:true,
    shells:3000, shellsLabel:"約3,000発", durationMin:60,
    lat:34.21, lon:136.34, place:"紀北町 長島港",
    venue:"sea", venueLabel:"長島港の海上", maxLabel:"彩雲孔雀（幅約450mの水中花火）", maxDiaM:450,
    access:"名古屋から:車で約2時間",
    tickets:[], statusOverride:{kind:"none", label:"有料席なし・無料観覧"},
    ticketNote:"有料観覧席なし。車いす専用観覧席の事前予約は受付終了",
    url:"https://touroumaturi.com/",
    note:"巨大燈籠と海上花火「彩雲孔雀」が名物。荒天時は翌7/26(日)に順延。" },
  { id:"abekawa", name:"安倍川花火大会", pref:"静岡",
    date:"2026-07-18", dateLabel:"7/18(土) 19:30〜21:00", verified:true,
    shells:15000, shellsLabel:"約10,000〜15,000発", durationMin:90,
    lat:34.96, lon:138.37, place:"静岡市 安倍川河畔",
    venue:"river", venueLabel:"安倍川の河川敷", maxLabel:"大スターマイン連発", maxDiaM:300,
    access:"名古屋から:新幹線で静岡駅約60分+バス",
    tickets:[], statusOverride:{kind:"none", label:"有料席なし・無料観覧"},
    ticketNote:"有料観覧席なし（全席無料で観覧可能）",
    url:"https://www.city.shizuoka.lg.jp/s9635/s006369.html",
    note:"第73回。静岡市最大の花火大会。広い河川敷でゆったり観覧しやすい。荒天中止（延期なし）。" },
  { id:"numazu", name:"沼津夏まつり・狩野川花火大会", pref:"静岡",
    date:"2026-07-25", dateLabel:"7/25(土)・26(日) 19:10〜20:10", verified:true,
    shells:12000, shellsLabel:"約12,000発（2日間計）", durationMin:60,
    lat:35.09, lon:138.86, place:"沼津市 狩野川河川敷",
    venue:"river", venueLabel:"市街地ど真ん中の狩野川", maxLabel:"市街地至近の大スターマイン", maxDiaM:250,
    access:"名古屋から:新幹線+東海道線で約100分",
    tickets:[
      {label:"マス席・プレミアム席（抽選先行）", type:"lottery", start:"2026-06-19", end:"2026-06-26"}],
    ticketNote:"抽選先行（楽天チケット）は受付終了。追加販売の有無は公式で要確認",
    url:"https://hanabi.walkerplus.com/detail/ar0622e00888/",
    note:"第79回。市街地の橋の間で上がるため、街と花火の距離が近い。会場はJR沼津駅南口から徒歩10分。" },
  { id:"atami", name:"熱海海上花火大会", pref:"静岡",
    date:"2026-07-20", dateLabel:"夏季は7/20・7/26・8/5・8/9・8/18・8/24開催 20:15〜20:40", verified:true,
    shells:5000, shellsLabel:"約5,000発／回（例年）", durationMin:25,
    lat:35.1, lon:139.07, place:"熱海市 熱海湾(サンビーチ〜熱海港)",
    venue:"sea", venueLabel:"三方を山に囲まれた熱海湾", maxLabel:"大空中ナイアガラ（フィナーレ）", maxDiaM:300,
    access:"名古屋から:新幹線ひかりで約80分",
    tickets:[], statusOverride:{kind:"none", label:"一般有料席なし"},
    ticketNote:"2026年は一般向け有料観覧席なし。参加宿泊施設の宿泊者専用観覧席あり（施設でレジャーシート配布）",
    url:"https://www.ataminews.gr.jp/event/8/",
    note:"すり鉢状の地形に音が反響する「花火のスタジアム」。夏季6日程で予定を合わせやすい。温泉宿泊とセットが定番。雨天決行。" },
  { id:"biwako", name:"びわ湖大花火大会（番外・滋賀）", pref:"番外",
    date:"2026-08-06", dateLabel:"8/6(木) 19:30〜20:30", verified:true,
    shells:12000, shellsLabel:"約12,000発（予定）", durationMin:60,
    lat:35.0, lon:135.87, place:"大津市 びわ湖畔(大津港沖)",
    venue:"lake", venueLabel:"びわ湖の湖上", maxLabel:"湖面を使った水中スターマイン", maxDiaM:300,
    access:"名古屋から:新幹線+在来線で約70分（京都経由・大津駅）",
    tickets:[
      {label:"有料観覧席 一般発売（先着）", type:"sale", start:"2026-05-23", end:null}],
    ticketNote:"第40回記念大会。イス席7,500円〜、台船正面席13,000円など。高額席を中心に完売進行中。抽選先行（4月）は終了",
    url:"https://www.biwako-visitors.jp/hanabi/outline/",
    note:"第40回記念大会。東海4県外だが名古屋から約70分。湖面反射の水中花火が名物。" },
];

const TODAY = (() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
})();

// ── チケット状況を日付から自動判定 ──
function ticketWindowStatus(w, festDate) {
  const s = w.start || "0000-00-00";
  const e = w.end || festDate;
  if (TODAY < s) return { phase:"upcoming", text:`${s.slice(5).replace("-","/")}から受付` };
  if (TODAY > e) return { phase:"closed", text:"受付終了" };
  return { phase:"open", text: w.type==="lottery" ? "抽選受付中" : "販売中" };
}
function festivalStatus(f) {
  if (f.date < TODAY) return { kind:"ended", label:"開催終了" };
  if (f.statusOverride) return f.statusOverride;
  const ws = (f.tickets||[]).map(w=>({w, st:ticketWindowStatus(w, f.date)}));
  if (!ws.length) return { kind:"check", label:"要確認" };
  const open = ws.find(x=>x.st.phase==="open");
  if (open) return { kind: open.w.type==="lottery"?"lottery":"sale",
    label: open.w.type==="lottery"?"抽選受付中":"チケット販売中" };
  const up = ws.filter(x=>x.st.phase==="upcoming")
    .sort((a,b)=>(a.w.start||"").localeCompare(b.w.start||""))[0];
  if (up) return { kind:"upcoming", label:up.st.text +
    (up.w.type==="lottery"?"（抽選）":"") };
  return { kind:"closed", label:"受付終了" };
}
const STATUS_STYLE = {
  sale:    { bg:"#1d4d3a", fg:"#7ce8b5" },
  soldout: { bg:"#4d1d2b", fg:"#ff9db4" },
  lottery: { bg:"#4d3a1d", fg:"#ffd97a" },
  upcoming:{ bg:"#1d3a4d", fg:"#7ad0ff" },
  closed:  { bg:"#3a2430", fg:"#d89aab" },
  ended:   { bg:"#22283a", fg:"#7d8db5" },
  none:    { bg:"#2a3350", fg:"#9fb0d8" },
  check:   { bg:"#2a3350", fg:"#9fb0d8" },
};

// ── 地図: 座標→SVG変換 ──
const MW = 460, MH = 440;
const LON0 = 135.55, LON1 = 139.5, LAT0 = 33.35, LAT1 = 36.75;
const px = (lon) => ((lon - LON0) / (LON1 - LON0)) * MW;
const py = (lat) => ((LAT1 - lat) / (LAT1 - LAT0)) * MH;
const path = (arr) => "M" + arr.map(([lo,la]) => `${px(lo).toFixed(1)} ${py(la).toFixed(1)}`).join(" L") + " Z";

const HAMANA = path([[137.53,34.7],[137.6,34.7],[137.63,34.76],[137.58,34.8],[137.52,34.77]]);
const BIWAKO = path([[135.98,35.0],[136.08,35.05],[136.18,35.18],[136.27,35.4],[136.16,35.44],[136.03,35.28],[135.92,35.1]]);
const PREF_LABEL = { 岐阜:[136.92,35.9], 愛知:[137.18,35.06], 三重:[136.3,34.6], 静岡:[138.35,35.08] };
const DEPTH = 8;

// ── 花火エンジン共通 ──
const VIVID = ["#ff4d6d","#ffd23f","#3dd6f5","#8aff80","#c77dff","#ff9e3d","#ff7ab8","#7df9ff"];
function makeSprite(color, size=28) {
  const c = document.createElement("canvas"); c.width = c.height = size;
  const g = c.getContext("2d");
  const gr = g.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);
  gr.addColorStop(0,"#fff"); gr.addColorStop(0.22,color); gr.addColorStop(1,"rgba(0,0,0,0)");
  g.fillStyle = gr; g.fillRect(0,0,size,size); return c;
}

// ── オープニング ──
function Intro({ onDone }) {
  const ref = useRef(null);
  const [fading, setFading] = useState(false);
  const doneRef = useRef(false);
  const finish = () => { if (doneRef.current) return; doneRef.current = true;
    setFading(true); setTimeout(onDone, 900); };
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { onDone(); return; }
    const cv = ref.current; const ctx = cv.getContext("2d");
    const W = cv.width = window.innerWidth, H = cv.height = window.innerHeight;
    const sprites = {}; [...VIVID,"#ffe08a","#fff"].forEach(c=>sprites[c]=makeSprite(c,32));
    let rockets=[], parts=[], raf, last=performance.now(), t0=last, nextSmall=0.6;
    let planned = [ {t:0.35,x:0.5,c:"#ffd23f"}, {t:1.5,x:0.28,c:"#ff4d6d"},
      {t:2.3,x:0.72,c:"#3dd6f5"}, {t:3.2,x:0.5,c:"#c77dff"} ];
    ctx.fillStyle="#04060f"; ctx.fillRect(0,0,W,H);
    function launch(xr, big, color) {
      rockets.push({ x:W*xr+(Math.random()-0.5)*30, y:H+10, vx:(Math.random()-0.5)*30,
        vy:-(H*0.62+Math.random()*H*0.12)/1.35, big,
        ty:H*(big?0.26:0.3)+Math.random()*H*0.16,
        c: color || VIVID[(Math.random()*VIVID.length)|0] });
    }
    function burst(r) {
      const n = r.big ? 170 : 60;
      const kamuro = r.big && Math.random()<0.6;
      for (let i=0;i<n;i++){
        const a = Math.random()*Math.PI*2, sp = (r.big? 210:130)*(0.35+Math.random()*0.65);
        parts.push({ x:r.x, y:r.y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp,
          life:1, decay: kamuro? 0.28+Math.random()*0.12 : 0.5+Math.random()*0.3,
          c: kamuro? "#ffe08a" : (Math.random()<0.75? r.c : "#fff"),
          tw: Math.random()<0.35, big:r.big });
      }
    }
    function frame(t) {
      const dt = Math.min((t-last)/1000, 0.05); last = t;
      const el = (t-t0)/1000;
      ctx.globalCompositeOperation="source-over";
      ctx.fillStyle="rgba(4,6,15,0.22)"; ctx.fillRect(0,0,W,H);
      planned = planned.filter(p=>{ if (el>=p.t){ launch(p.x,true,p.c); return false;} return true; });
      nextSmall -= dt; if (nextSmall<=0 && el>0.8){ launch(0.15+Math.random()*0.7,false); nextSmall=0.35+Math.random()*0.4; }
      ctx.globalCompositeOperation="lighter";
      rockets = rockets.filter(r=>{
        r.x += r.vx*dt; r.y += r.vy*dt; r.vy += 160*dt;
        ctx.globalAlpha=0.9; ctx.drawImage(sprites["#ffe08a"], r.x-4, r.y-4, 8, 8);
        parts.push({ x:r.x, y:r.y+6, vx:(Math.random()-0.5)*20, vy:40+Math.random()*30,
          life:0.5, decay:2.2, c:"#ffd23f", tw:false, big:false });
        if (r.vy > -60 || r.y<=r.ty){ burst(r); return false; } return true; });
      parts = parts.filter(p=>{
        p.x += p.vx*dt; p.y += p.vy*dt;
        p.vy += 55*dt; p.vx *= (1-0.6*dt); p.vy *= (1-0.25*dt);
        p.life -= dt*p.decay;
        if (p.life<=0) return false;
        const a = p.tw ? (Math.random()<0.55? p.life : p.life*0.15) : p.life;
        const s = p.big? 7.5 : 5;
        ctx.globalAlpha = Math.max(a,0);
        ctx.drawImage(sprites[p.c]||sprites["#fff"], p.x-s/2, p.y-s/2, s, s);
        return true; });
      ctx.globalAlpha=1; ctx.globalCompositeOperation="source-over";
      if (parts.length>3200) parts.splice(0, parts.length-3200);
      if (el>5.2) finish(); else raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div onClick={finish}
      style={{position:"fixed",inset:0,zIndex:60,background:"#04060f",cursor:"pointer",
        opacity:fading?0:1,transition:"opacity 0.9s ease",pointerEvents:fading?"none":"auto"}}>
      <canvas ref={ref} style={{position:"absolute",inset:0,width:"100%",height:"100%"}}/>
      <style>{`
        @keyframes introTitle { 0%{opacity:0; letter-spacing:14px; transform:translateY(10px);}
          100%{opacity:1; letter-spacing:6px; transform:translateY(0);} }
        @keyframes introSub { 0%,40%{opacity:0;} 100%{opacity:1;} }
      `}</style>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",
        alignItems:"center",justifyContent:"center",pointerEvents:"none"}}>
        <div style={{fontSize:11,color:"#ffb347",letterSpacing:5,
          animation:"introSub 2.6s ease forwards",opacity:0}}>TOKAI HANABI 2026</div>
        <div style={{fontFamily:"'Hiragino Mincho ProN',serif",fontSize:34,fontWeight:700,
          color:"#f4f7ff",textShadow:"0 0 30px rgba(255,180,90,0.45)",margin:"8px 0 4px",
          animation:"introTitle 2.2s cubic-bezier(0.2,0.7,0.2,1) 0.6s forwards",opacity:0}}>
          夏 の 夜 空 へ
        </div>
        <div style={{fontSize:13,color:"#c7d1ec",animation:"introSub 3.4s ease forwards",opacity:0}}>
          東海4県 花火大会マップ
        </div>
      </div>
      <div style={{position:"absolute",bottom:26,width:"100%",textAlign:"center",
        fontSize:11,color:"#7d8db5",animation:"introSub 3s ease forwards",opacity:0}}>タップでスキップ</div>
    </div>
  );
}

// ── 実寸スケールの花火シーン ──
function FireworkScene({ shells, durationMin, maxDiaM, venue, venueLabel }) {
  const ref = useRef(null);
  const perSec = shells / (durationMin * 60);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const Wc = canvas.width, Hc = canvas.height;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const MAXM = 740, groundY = Hc - 44, topY = 12;
    const mpx = (groundY - topY) / MAXM;
    const ym = (m) => groundY - m * mpx;
    const water = venue !== "park";
    const sprites = {}; [...VIVID,"#ffe08a","#fff","#ffd97a"].forEach(c => sprites[c]=makeSprite(c));
    let rockets=[], parts=[], featured=null, featT=1.0, flash=0, acc=0, last=performance.now(), raf;
    const stars = Array.from({length:46},()=>({x:Math.random()*Wc,y:Math.random()*ym(120),a:0.15+Math.random()*0.5,tw:Math.random()*6}));
    const TYPES = ["peony","peony","chrys","willow","ring","crossette"];
    function launch(big) {
      const diaM = big ? maxDiaM : 120 + Math.random()*100;
      const altM = big ? Math.min(diaM*0.85+180, 650) : 190 + Math.random()*180;
      rockets.push({ x: big? Wc*0.66 : Wc*0.4+Math.random()*Wc*0.5, m:0, altM, diaM, big,
        type: big ? "grand" : TYPES[(Math.random()*TYPES.length)|0],
        c: big ? "#ffe08a" : VIVID[(Math.random()*VIVID.length)|0],
        c2: VIVID[(Math.random()*VIVID.length)|0], v: 300+Math.random()*90 });
    }
    function spawn(r, count, speedK, color, opt={}) {
      for (let i=0;i<count;i++){
        const a = (Math.PI*2*i)/count + Math.random()*0.12;
        parts.push({ x:r.x, m:r.altM, ax:Math.cos(a), ay:Math.sin(a),
          rM:0, maxR:(r.diaM/2)*speedK, life:1, decay:opt.decay||0.7,
          fall:opt.fall||20, big:r.big, c:color, strobe:opt.strobe||false,
          split:opt.split||false, trail:opt.trail||false });
      }
    }
    function burst(r) {
      flash = r.big ? 0.5 : 0.12;
      if (r.type==="grand"){
        spawn(r, 110, 1, "#ffe08a", {decay:0.34, fall:12, strobe:true, trail:true});
        spawn(r, 60, 0.55, r.c2, {decay:0.4, fall:14});
        featured = { x:r.x, m:r.altM, diaM:r.diaM, t:3.4 };
      } else if (r.type==="chrys"){ spawn(r, 46, 1, r.c, {decay:0.6, trail:true});
      } else if (r.type==="willow"){ spawn(r, 40, 0.9, "#ffd97a", {decay:0.3, fall:60, trail:true});
      } else if (r.type==="ring"){ spawn(r, 40, 1, r.c, {decay:0.65}); spawn(r, 24, 0.45, r.c2, {decay:0.7});
      } else if (r.type==="crossette"){ spawn(r, 18, 0.7, r.c, {decay:0.55, split:true});
      } else { spawn(r, 36, 1, r.c, {decay:0.7}); }
    }
    function drawStatic(t) {
      const g = ctx.createLinearGradient(0,0,0,groundY);
      g.addColorStop(0,"#060a1c"); g.addColorStop(1,"#121b3c");
      ctx.fillStyle=g; ctx.fillRect(0,0,Wc,groundY);
      ctx.fillStyle="#fff";
      stars.forEach(s=>{ ctx.globalAlpha=s.a*(0.6+0.4*Math.sin(t/700+s.tw)); ctx.fillRect(s.x,s.y,1.3,1.3); });
      ctx.globalAlpha=1;
      ctx.strokeStyle="#3a4a78"; ctx.fillStyle="#8fa2cf"; ctx.font="9px monospace"; ctx.lineWidth=1;
      for (let m=0;m<=700;m+=100){
        ctx.globalAlpha=0.5; ctx.beginPath(); ctx.moveTo(30,ym(m)); ctx.lineTo(36,ym(m)); ctx.stroke();
        if (m%200===0){ ctx.globalAlpha=0.9; ctx.fillText(m+"m",4,ym(m)+3); } }
      ctx.globalAlpha=1;
      const bx=52,bw=13,bh=247*mpx;
      ctx.fillStyle="#1c2748"; ctx.fillRect(bx,groundY-bh,bw,bh);
      ctx.fillStyle="#3a4a78";
      for(let fy=groundY-bh+5; fy<groundY-4; fy+=6) ctx.fillRect(bx+2,fy,bw-4,2);
      ctx.fillStyle="#8fa2cf"; ctx.font="9px sans-serif";
      ctx.fillText("超高層ビル",bx-8,groundY-bh-14); ctx.fillText("(247m)",bx-4,groundY-bh-4);
      const gg = ctx.createLinearGradient(0,groundY,0,Hc);
      if (venue==="sea"||venue==="lake"){ gg.addColorStop(0,"#0d2240"); gg.addColorStop(1,"#071322"); }
      else if (venue==="river"){ gg.addColorStop(0,"#122244"); gg.addColorStop(1,"#0a1226"); }
      else { gg.addColorStop(0,"#132720"); gg.addColorStop(1,"#0a140f"); }
      ctx.fillStyle=gg; ctx.fillRect(0,groundY,Wc,Hc-groundY);
      ctx.strokeStyle="rgba(140,170,230,0.12)";
      for(let i=0;i<7;i++){ const tt=i/6, yl=groundY+(Hc-groundY)*tt*tt;
        ctx.beginPath(); ctx.moveTo(0,yl); ctx.lineTo(Wc,yl); ctx.stroke(); }
      ctx.fillStyle="rgba(220,230,255,0.35)";
      for(let i=0;i<26;i++) ctx.fillRect((i*37)%Math.floor(Wc*0.32)+8, groundY+8+((i*53)%Math.floor(Hc-groundY-16)), 1.6, 3);
      ctx.fillStyle="#7d8db5"; ctx.font="9px sans-serif";
      ctx.fillText("観覧エリア",10,Hc-8); ctx.fillText(venueLabel,Wc*0.5,Hc-8);
    }
    function drawSprite(c,x,y,size,alpha){
      ctx.globalAlpha=Math.max(alpha,0); ctx.drawImage(sprites[c]||sprites["#fff"], x-size/2, y-size/2, size, size); ctx.globalAlpha=1;
    }
    function frame(t) {
      const dt = Math.min((t-last)/1000,0.05); last=t;
      acc += dt*Math.min(perSec,5); while(acc>=1){ launch(false); acc-=1; }
      if (perSec<0.7 && Math.random()<dt*Math.max(perSec,0.15)*3) launch(false);
      featT -= dt; if (featT<=0){ launch(true); featT = 8.5; }
      drawStatic(t);
      if (flash>0){ ctx.fillStyle=`rgba(255,240,210,${flash*0.25})`; ctx.fillRect(0,0,Wc,groundY); flash-=dt*1.5; }
      ctx.globalCompositeOperation="lighter";
      rockets = rockets.filter(r=>{ r.m += r.v*dt;
        drawSprite("#ffe08a", r.x, ym(r.m), r.big?10:6, 0.9);
        drawSprite("#fff", r.x, ym(r.m)+5, 3, 0.5);
        if (r.m>=r.altM){ burst(r); return false; } return true; });
      const born=[];
      parts = parts.filter(p=>{
        p.rM = Math.min(p.rM + p.maxR*dt*1.5, p.maxR);
        p.m -= p.fall*dt*(1-p.life)*3;
        p.life -= dt*p.decay;
        if (p.split && p.life<0.55){ p.split=false;
          for(let k=0;k<4;k++) born.push({x:p.x+p.ax*p.rM, m:p.m, ax:Math.cos(k*1.57+0.4), ay:Math.sin(k*1.57+0.4),
            rM:0, maxR:26, life:0.6, decay:1.1, fall:26, c:p.c, strobe:false, split:false, trail:false, big:false}); }
        if (p.life<=0) return false;
        const xx = p.x + p.ax*p.rM*mpx, yy = ym(p.m) + (-p.ay)*p.rM*mpx;
        const a = p.strobe ? (Math.random()<0.5?p.life:p.life*0.15) : p.life;
        const sz = p.big?9:6;
        drawSprite(p.c, xx, yy, sz, a);
        if (p.trail) drawSprite(p.c, xx-p.ax*4, yy+p.ay*4, sz*0.6, a*0.4);
        if (water && p.life>0.35) drawSprite(p.c, xx, groundY+(groundY-yy)*0.22, 4, a*0.22);
        return true; });
      parts.push(...born);
      if (parts.length>2200) parts.splice(0, parts.length-2200);
      ctx.globalCompositeOperation="source-over";
      if (featured){ featured.t -= dt;
        if (featured.t>0){
          const y0=ym(featured.m), r=(featured.diaM/2)*mpx;
          ctx.strokeStyle="rgba(255,217,122,0.75)"; ctx.setLineDash([4,4]); ctx.lineWidth=1;
          ctx.beginPath(); ctx.arc(featured.x,y0,r,0,Math.PI*2); ctx.stroke(); ctx.setLineDash([]);
          ctx.beginPath(); ctx.moveTo(featured.x-r,y0+r+8); ctx.lineTo(featured.x+r,y0+r+8); ctx.stroke();
          ctx.fillStyle="#ffd97a"; ctx.font="bold 10px sans-serif"; ctx.textAlign="center";
          ctx.fillText(`直径 約${featured.diaM}m`, featured.x, y0+r+20); ctx.textAlign="left";
        } else featured=null; }
      raf = requestAnimationFrame(frame);
    }
    drawStatic(0);
    if (!reduce) raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [shells, durationMin, maxDiaM, venue, venueLabel, perSec]);
  return (
    <div style={{position:"relative"}}>
      <canvas ref={ref} width={380} height={270}
        style={{width:"100%",borderRadius:12,display:"block",background:"#060a1c"}} />
      <div style={{position:"absolute",top:8,right:10,fontSize:10.5,color:"#cfd8ee",
        fontFamily:"monospace",background:"rgba(6,10,28,0.65)",padding:"2px 8px",borderRadius:6}}>
        実際のペース: 約{perSec>=1?perSec.toFixed(1):perSec.toFixed(2)}発/秒
      </div>
    </div>
  );
}

function ScaleBar({ all, current }) {
  const max = Math.max(...all.map(f=>f.shells));
  const sorted = [...all].sort((a,b)=>b.shells-a.shells);
  return (
    <div>
      {sorted.map(f=>(
        <div key={f.id} style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,opacity:f.id===current?1:0.4}}>
          <div style={{width:104,fontSize:10,color:"#dfe6f7",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{f.name}</div>
          <div style={{flex:1,height:9,background:"#1b2544",borderRadius:5,overflow:"hidden"}}>
            <div style={{width:`${(f.shells/max)*100}%`,height:"100%",borderRadius:5,
              background:f.id===current?"linear-gradient(90deg,#ffb347,#ff4d6d)":"#3d4f7d"}} />
          </div>
          <div style={{width:48,fontSize:10,textAlign:"right",color:"#aab6d6",fontFamily:"monospace"}}>{(f.shells/10000).toFixed(1)}万</div>
        </div>
      ))}
    </div>
  );
}

const LinkIcon = ({size=15,color="#ffd97a"}) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M4.5 11.5 L11.5 4.5 M6 4.5 h5.5 v5.5" stroke={color} strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const PREF_FILTERS = ["すべて","愛知","岐阜","三重","静岡","番外"];

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [selected, setSelected] = useState(null);
  const [prefFilter, setPrefFilter] = useState("すべて");
  const detailRef = useRef(null);
  const svgRef = useRef(null);

  const ALL = FESTIVALS;
  const fest = ALL.find(f=>f.id===selected);
  const list = useMemo(()=>{
    const l = prefFilter==="すべて" ? ALL : ALL.filter(f=>f.pref===prefFilter);
    return [...l].sort((a,b)=>a.date.localeCompare(b.date));
  }, [prefFilter, ALL]);
  const daysUntil = (d) => Math.round((new Date(d)-new Date(TODAY))/86400000);

  useEffect(()=>{ if (selected && detailRef.current)
    setTimeout(()=>detailRef.current.scrollIntoView({behavior:"smooth",block:"start"}), 60);
  }, [selected]);

  // 県フィルタに応じた地図ズーム（viewBox座標系でのscale+translate）
  const zoom = useMemo(()=>{
    const bb = TOKAI_BBOX[prefFilter];
    if (!bb) return { k:1, x:0, y:0 };
    const MHD = MH + DEPTH, pad = 16;
    const k = Math.min(MW/(bb[2]+pad*2), MHD/(bb[3]+pad*2), 2.6);
    let x = bb[0]+bb[2]/2 - MW/(2*k), y = bb[1]+bb[3]/2 - MHD/(2*k);
    x = Math.max(0, Math.min(x, MW - MW/k));
    y = Math.max(0, Math.min(y, MHD - MHD/k));
    return { k:+k.toFixed(3), x:+x.toFixed(1), y:+y.toFixed(1) };
  }, [prefFilter]);

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(180deg,#0b1226 0%,#111a36 60%,#16213f 100%)",
      color:"#eef2fb",fontFamily:"'Hiragino Kaku Gothic ProN','Noto Sans JP',sans-serif",paddingBottom:40}}>
      {showIntro && <Intro onDone={()=>setShowIntro(false)} />}
      <div style={{maxWidth:520,margin:"0 auto",padding:"20px 16px 0"}}>

        <header style={{marginBottom:14}}>
          <div style={{fontSize:11,letterSpacing:3,color:"#ffb347"}}>TOKAI HANABI MAP 2026</div>
          <h1 style={{margin:"4px 0 2px",fontSize:24,fontWeight:800,fontFamily:"'Hiragino Mincho ProN',serif"}}>
            東海4県 花火大会マップ
          </h1>
          <div style={{fontSize:12,color:"#9fb0d8"}}>{ALL.length}大会を収録。チケット状況は本日({TODAY.slice(5).replace("-","/")})時点で自動判定。</div>
        </header>

        <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}>
          {PREF_FILTERS.map(p=>(
            <button key={p} onClick={()=>setPrefFilter(p)}
              style={{padding:"6px 13px",borderRadius:99,border:"1px solid",fontSize:12,cursor:"pointer",
                borderColor:prefFilter===p?"#ffb347":"#33456b",
                background:prefFilter===p?"#3a2c14":"transparent",
                color:prefFilter===p?"#ffd97a":"#aab6d6"}}>{p}</button>
          ))}
        </div>

        {/* 地図 */}
        <div style={{position:"relative",background:"#060c20",borderRadius:16,padding:6,border:"1px solid #223055",marginBottom:14}}>
          {fest && (
            <div style={{position:"absolute",top:10,left:10,right:10,zIndex:2,display:"flex",
              alignItems:"center",gap:8,background:"rgba(6,12,32,0.85)",border:"1px solid #ffb34766",
              borderRadius:10,padding:"6px 10px",backdropFilter:"blur(4px)"}}>
              <span style={{width:8,height:8,borderRadius:99,background:"#ffe08a",
                boxShadow:"0 0 8px #ffb347"}}/>
              <span style={{fontSize:11.5,color:"#ffe08a",fontWeight:700,flex:1,minWidth:0,
                whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>選択中: {fest.name}</span>
              <span style={{fontSize:10.5,color:"#8fa2cf"}}>↓ 詳細</span>
            </div>
          )}
          <svg ref={svgRef} viewBox={`0 0 ${MW} ${MH+DEPTH}`}
            style={{width:"100%",display:"block"}}
            role="img" aria-label="東海4県の花火大会マップ">
            <defs>
              <radialGradient id="sea" cx="55%" cy="72%" r="85%">
                <stop offset="0%" stopColor="#0e2142"/><stop offset="100%" stopColor="#060f24"/>
              </radialGradient>
              <linearGradient id="land" x1="0" y1="0" x2="0.4" y2="1">
                <stop offset="0%" stopColor="#35486f"/><stop offset="100%" stopColor="#25355a"/>
              </linearGradient>
              <filter id="glow" x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur stdDeviation="3" result="b"/>
                <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>
            <rect width={MW} height={MH+DEPTH} fill="url(#sea)" rx={12}/>
            <g style={{transform:`scale(${zoom.k}) translate(${-zoom.x}px, ${-zoom.y}px)`,
              transition:"transform 0.75s cubic-bezier(0.25,0.8,0.25,1)"}}>
            {[0.55,0.64,0.73,0.82,0.9].map((t,i)=>(
              <path key={i} d={`M0 ${MH*t} Q ${MW*0.25} ${MH*t-6}, ${MW*0.5} ${MH*t} T ${MW} ${MH*t}`}
                stroke="rgba(120,160,220,0.07)" fill="none" strokeWidth={1.4}/>
            ))}
            {OTHER_LAND.map((d,i)=>(
              <path key={i} d={d} fill="#141d38" fillRule="evenodd" stroke="#22305a"
                strokeWidth={0.6} vectorEffect="non-scaling-stroke" opacity={0.9}/>
            ))}
            <path d={BIWAKO} fill="#0e2142"/>
            <g opacity={zoom.k>1?0:1} style={{transition:"opacity 0.5s"}}>
              <text x={px(136.1)} y={py(35.24)} fontSize={8.5} fill="#4e6398" textAnchor="middle"
                style={{fontFamily:"serif",fontStyle:"italic"}}>琵琶湖</text>
              {[["伊勢湾",136.78,34.86],["三河湾",137.16,34.73],["遠州灘",137.95,34.44],["熊野灘",136.5,33.76],["駿河湾",138.56,34.78]].map(([n,lo,la])=>(
                <text key={n} x={px(lo)} y={py(la)} fontSize={9.5} fill="#4e6398" textAnchor="middle"
                  style={{fontFamily:"serif",fontStyle:"italic",letterSpacing:2}}>{n}</text>
              ))}
            </g>
            {["岐阜","静岡","三重","愛知"].map((name)=>{
              const d = TOKAI_PATHS[name];
              const active = prefFilter==="すべて"||prefFilter===name||prefFilter==="番外";
              return (
                <g key={name} opacity={active?1:0.35} style={{transition:"opacity 0.5s"}}>
                  <path d={d} fillRule="evenodd" transform={`translate(0,${DEPTH})`} fill="#0d1530" stroke="#0d1530" strokeWidth={1.5}/>
                  <path d={d} fillRule="evenodd" transform={`translate(0,${DEPTH/2})`} fill="#182346"/>
                  <path d={d} fillRule="evenodd" fill="url(#land)" stroke="#7288bd" strokeWidth={1.1}
                    strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>
                </g>
              );
            })}
            <path d={HAMANA} fill="#0e2142" opacity={0.95}/>
            {Object.entries(PREF_LABEL).map(([name,[lo,la]])=>(
              <g key={name} transform={`translate(${px(lo)} ${py(la)}) scale(${1/zoom.k})`}>
                <text fontSize={13} fill="#a3b4de" textAnchor="middle"
                  style={{fontFamily:"serif",letterSpacing:3}}>{name}</text>
              </g>
            ))}
            <g transform={`translate(${px(136.9)} ${py(35.17)}) scale(${1/zoom.k})`}>
              <circle r={3.2} fill="#fff"/>
              <circle r={6.5} fill="none" stroke="#fff" strokeWidth={0.7} opacity={0.5}/>
              <text x={8} y={3.5} fontSize={9.5} fill="#e6ecff">名古屋</text>
            </g>
            {list.map((f,i)=>{
              const r = 3.8 + Math.sqrt(f.shells)/26;
              const sel = f.id===selected;
              const dim = selected && !sel;
              const ended = f.date < TODAY;
              const dur = (1.4 + (i%5)*0.25).toFixed(2);
              return (
                <g key={f.id} transform={`translate(${px(f.lon)} ${py(f.lat)}) scale(${1/zoom.k})`}
                   onClick={(e)=>{ e.stopPropagation(); setSelected(f.id); }}
                   style={{cursor:"pointer"}} opacity={dim?0.35:(ended?0.5:1)}
                   tabIndex={0} onKeyDown={e=>e.key==="Enter"&&setSelected(f.id)}>
                  <circle r={r+6} fill="#ffb347" opacity={0.18} filter="url(#glow)">
                    <animate attributeName="opacity" values="0.1;0.32;0.1" dur={`${dur}s`} repeatCount="indefinite"/>
                  </circle>
                  <circle r={r}
                    fill={sel?"#ffe08a":"#ffb347"}
                    stroke={sel?"#fff":"#ffd97a"} strokeWidth={sel?2:0.8} filter="url(#glow)">
                    <animate attributeName="r" values={`${r};${r*1.25};${r}`} dur={`${dur}s`} repeatCount="indefinite"/>
                  </circle>
                  <g stroke={sel?"#fff":"#ffd97a"} strokeWidth={0.9} opacity={0.8}>
                    <line x1={-r-4} y1={0} x2={r+4} y2={0}>
                      <animate attributeName="opacity" values="0;0.9;0" dur={`${dur}s`} repeatCount="indefinite"/>
                    </line>
                    <line x1={0} y1={-r-4} x2={0} y2={r+4}>
                      <animate attributeName="opacity" values="0;0.9;0" dur={`${dur}s`} repeatCount="indefinite"/>
                    </line>
                  </g>
                  {sel && (
                    <>
                      <circle r={r+5} fill="none" stroke="#ffd97a" strokeWidth={1.5}>
                        <animate attributeName="r" values={`${r+3};${r+13};${r+3}`} dur="1.6s" repeatCount="indefinite"/>
                        <animate attributeName="opacity" values="0.9;0;0.9" dur="1.6s" repeatCount="indefinite"/>
                      </circle>
                      <text y={-r-9} fontSize={10.5} fill="#ffe08a" textAnchor="middle"
                        fontWeight="bold" style={{paintOrder:"stroke",stroke:"#060c20",strokeWidth:3}}>{f.name}</text>
                    </>
                  )}
                </g>
              );
            })}
            </g>
          </svg>
          <div style={{fontSize:10.5,color:"#7d8db5",padding:"2px 8px 4px"}}>
            光っている点が花火大会。大きさ = 打ち上げ数。</div>
        </div>

        {/* 詳細カード */}
        {fest && (()=>{ const st = festivalStatus(fest); const sty = STATUS_STYLE[st.kind];
          return (
          <div ref={detailRef} style={{scrollMarginTop:12,background:"#121c3a",border:"1px solid #4a5d8f",
            borderRadius:16,padding:16,marginBottom:16,boxShadow:"0 0 24px rgba(255,179,71,0.08)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
              <div>
                <div style={{fontSize:11,color:"#ffb347"}}>{fest.pref==="番外"?"滋賀県(番外)":fest.pref+"県"} ・ {fest.place}</div>
                <h2 style={{margin:"2px 0 6px",fontSize:18,fontFamily:"'Hiragino Mincho ProN',serif"}}>{fest.name}</h2>
              </div>
              <button onClick={()=>setSelected(null)} aria-label="閉じる"
                style={{background:"none",border:"1px solid #33456b",color:"#9fb0d8",borderRadius:8,padding:"2px 10px",cursor:"pointer"}}>✕</button>
            </div>

            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12,fontSize:12}}>
              <span style={{background:"#1b2544",borderRadius:8,padding:"4px 10px"}}>📅 {fest.dateLabel}</span>
              <span style={{background:"#1b2544",borderRadius:8,padding:"4px 10px"}}>🎆 {fest.shellsLabel}</span>
              {daysUntil(fest.date)>=0 && fest.verified &&
                <span style={{background:"#3a2c14",color:"#ffd97a",borderRadius:8,padding:"4px 10px"}}>あと{daysUntil(fest.date)}日</span>}
              {!fest.verified &&
                <span style={{background:"#2a3350",color:"#9fb0d8",borderRadius:8,padding:"4px 10px"}}>⚠ 2026年日程は要確認</span>}
            </div>

            {fest.note && <div style={{fontSize:12,color:"#c7d1ec",marginBottom:10}}>{fest.note}</div>}

            <div style={{fontSize:11,color:"#ffb347",letterSpacing:2,marginBottom:6}}>引きで見る、この大会の実寸スケール</div>
            <FireworkScene shells={fest.shells} durationMin={fest.durationMin}
              maxDiaM={fest.maxDiaM} venue={fest.venue} venueLabel={fest.venueLabel}/>
            <div style={{fontSize:11.5,color:"#aab6d6",margin:"8px 0 14px",lineHeight:1.8}}>
              左の目盛りは実際の高度、ビル(247m)が高さの基準です。
              名物の<b style={{color:"#ffd97a"}}>{fest.maxLabel}</b>は開花直径 約{fest.maxDiaM}m。
              打上ペースは <b style={{color:"#ffd97a"}}>1分あたり約{Math.round(fest.shells/fest.durationMin)}発</b>（実時間で再現）。
            </div>

            <div style={{fontSize:11,color:"#ffb347",letterSpacing:2,marginBottom:8}}>収録{ALL.length}大会での規模比較</div>
            <ScaleBar all={ALL} current={fest.id} />

            <div style={{marginTop:14,padding:12,background:"#0d1530",borderRadius:12}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <span style={{fontSize:11,letterSpacing:2,color:"#ffb347"}}>予約・チケット</span>
                <span style={{fontSize:10.5,padding:"2px 8px",borderRadius:99,background:sty.bg,color:sty.fg}}>{st.label}</span>
              </div>
              {(fest.tickets||[]).map((w,i)=>{ const ws = ticketWindowStatus(w, fest.date);
                const wsty = STATUS_STYLE[ws.phase==="open"?(w.type==="lottery"?"lottery":"sale"):ws.phase==="upcoming"?"upcoming":"closed"];
                return (
                  <div key={i} style={{display:"flex",alignItems:"center",gap:8,fontSize:12,marginBottom:6}}>
                    <span style={{flex:1,minWidth:0}}>{w.label}
                      {(w.start||w.end)&&<span style={{color:"#8fa2cf"}}>
                        {" "}({(w.start||"").slice(5).replace("-","/")||"〜"}〜{(w.end||"").slice(5).replace("-","/")||"開催日"})</span>}
                    </span>
                    <span style={{fontSize:10.5,padding:"2px 8px",borderRadius:99,whiteSpace:"nowrap",
                      background:wsty.bg,color:wsty.fg}}>{ws.text}</span>
                  </div>
                );})}
              {fest.ticketNote && <div style={{fontSize:12,lineHeight:1.7,color:"#c7d1ec",margin:"4px 0 10px"}}>{fest.ticketNote}</div>}
              <a href={fest.url} target="_blank" rel="noopener noreferrer"
                style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,
                  padding:"10px 12px",borderRadius:10,
                  background:"linear-gradient(90deg,#ffb347,#ff6b6b)",color:"#1a0f05",
                  fontWeight:700,fontSize:13,textDecoration:"none"}}>
                チケット・最新情報を公式で確認 <LinkIcon color="#1a0f05"/>
              </a>
            </div>

            <div style={{marginTop:10,fontSize:12,color:"#c7d1ec"}}>🚃 {fest.access}</div>
          </div>
        );})()}

        <div style={{fontSize:11,color:"#ffb347",letterSpacing:2,margin:"4px 0 8px"}}>開催日順リスト（{list.length}大会）</div>
        {list.map(f=>{ const st = festivalStatus(f); const sty = STATUS_STYLE[st.kind];
          const ended = f.date < TODAY;
          return (
          <div key={f.id} style={{display:"flex",gap:8,alignItems:"stretch",marginBottom:8,opacity:ended?0.55:1}}>
            <button onClick={()=>setSelected(f.id)}
              style={{display:"flex",flex:1,minWidth:0,textAlign:"left",gap:12,alignItems:"center",
                background:f.id===selected?"#1b2544":"#121c3a",
                border:`1px solid ${f.id===selected?"#ffb347":"#223055"}`,
                borderRadius:12,padding:"10px 12px",cursor:"pointer",color:"#eef2fb"}}>
              <div style={{fontFamily:"monospace",fontSize:13,color:"#ffd97a",minWidth:44}}>
                {f.date.slice(5).replace("-","/")}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:13,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{f.name}</div>
                <div style={{fontSize:11,color:"#8fa2cf"}}>{f.pref} ・ {f.shellsLabel}</div>
              </div>
              <span style={{fontSize:10,padding:"3px 8px",borderRadius:99,whiteSpace:"nowrap",
                background:sty.bg,color:sty.fg}}>{st.label}</span>
            </button>
            <a href={f.url} target="_blank" rel="noopener noreferrer" aria-label={`${f.name}の公式情報`}
              style={{display:"flex",alignItems:"center",justifyContent:"center",width:42,
                borderRadius:12,border:"1px solid #33456b",background:"#0d1530",textDecoration:"none"}}>
              <LinkIcon/>
            </a>
          </div>
        );})}

        <div style={{fontSize:10.5,color:"#6e7ea8",marginTop:14,lineHeight:1.7}}>
          ※ 2026年7月時点の公開情報をもとに作成。チケット状況は登録した受付期間から自動判定していますが、完売・変更の可能性があるため必ず公式サイトでご確認ください。
        </div>
      </div>
    </div>
  );
}
