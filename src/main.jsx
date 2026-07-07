import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(<App />);

// クローラ向けに焼き込んだ本文(#__seo)と、起動前の目隠し(#__splash)を撤去。
// オープニング(不透明・全画面)が描画された次フレームで外すので、見た目のちらつきは出ない。
requestAnimationFrame(() => {
  document.getElementById("__seo")?.remove();
  document.getElementById("__splash")?.remove();
});
