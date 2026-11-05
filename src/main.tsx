import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./fonts.css";
import "./app.css";
import "./components/sheet/sheet.css";
import { App } from "./App";
import { startAutosave, useSheet } from "./state/store";
import { demoCharacter } from "./state/demo";

if (import.meta.env.DEV && location.search.includes("demo")) useSheet.getState().addCharacter(demoCharacter());
startAutosave();
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
