import { useState } from "react";
import { Form } from "./components/form/Form";
import { Preview } from "./components/Preview";
import { Toolbar } from "./components/Toolbar";

export function App() {
  const [tab, setTab] = useState<"edit" | "sheet">("edit");
  return (
    <div className="app" data-tab={tab}>
      <Toolbar />
      <div className="tabs" role="tablist" aria-label="View">
        <button role="tab" aria-selected={tab === "edit"} onClick={() => setTab("edit")}>
          Edit
        </button>
        <button role="tab" aria-selected={tab === "sheet"} onClick={() => setTab("sheet")}>
          Sheet
        </button>
      </div>
      <main className="panes">
        <div className="pane pane-form" aria-label="Character form">
          <Form />
        </div>
        <div className="pane pane-sheet" aria-label="Sheet preview">
          <Preview />
        </div>
      </main>
    </div>
  );
}
