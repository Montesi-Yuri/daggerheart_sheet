import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/montserrat/latin-400.css";
import "@fontsource/montserrat/latin-600.css";
import "@fontsource/montserrat/latin-700.css";
import "@fontsource/open-sans/latin-400.css";
import "@fontsource/open-sans/latin-600.css";
import "@fontsource/open-sans/latin-700.css";
import "@fontsource/kalam/latin-400.css";
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
