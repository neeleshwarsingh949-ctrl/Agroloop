import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./i18n";
// @ts-ignore: side-effect CSS import handled by Vite/PostCSS/Tailwind
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);