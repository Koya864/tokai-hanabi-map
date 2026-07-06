import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

// artifact環境のwindow.storage APIをlocalStorageで代替
if (!window.storage) {
  window.storage = {
    async get(key) {
      const value = localStorage.getItem(key);
      return value == null ? null : { value };
    },
    async set(key, value) {
      localStorage.setItem(key, value);
    },
  };
}

createRoot(document.getElementById("root")).render(<App />);
