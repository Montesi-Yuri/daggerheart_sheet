import { useRef, useState } from "react";
import { exportCharacter, exportFileName, parseImport } from "../state/io";
import { useCharacter, useSheet } from "../state/store";
import { ThemeSelect } from "./ThemeSelect";

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

interface Message {
  kind: "error" | "info";
  text: string;
}

export function Toolbar() {
  const c = useCharacter();
  const { characters, order, currentId, quarantined } = useSheet();
  const { newCharacter, switchTo, deleteCharacter, addCharacter, dismissQuarantine } = useSheet.getState();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const result = parseImport(await file.text());
    if (!result.ok) {
      setMessage({ kind: "error", text: result.error });
      return;
    }
    addCharacter(result.character);
    setMessage({ kind: "info", text: [`Imported “${result.character.name}”.`, ...result.warnings].join(" ") });
  };

  return (
    <>
      <header className="toolbar">
        <strong className="brand">Daggerheart Sheet</strong>
        <button type="button" className="btn" onClick={() => newCharacter()}>
          New character
        </button>
        <div className="menu">
          <button type="button" className="btn" aria-expanded={open} aria-haspopup="true" onClick={() => setOpen(!open)}>
            Characters ({order.length})
          </button>
          {open && (
            <div className="menu-panel" role="menu">
              <ul>
                {order.map((id) => {
                  const ch = characters[id]!;
                  return (
                    <li key={id} className={id === currentId ? "current" : ""}>
                      <button
                        type="button"
                        role="menuitem"
                        className="menu-pick"
                        aria-current={id === currentId}
                        onClick={() => {
                          switchTo(id);
                          setOpen(false);
                        }}
                      >
                        <strong>{ch.name || "Unnamed character"}</strong>
                        <span>
                          {ch.classNameSnapshot ?? ch.classId} · level {ch.level}
                        </span>
                      </button>
                      <button
                        type="button"
                        className="btn small"
                        aria-label={`Delete ${ch.name || "unnamed character"}`}
                        onClick={() => {
                          if (confirm(`Delete “${ch.name || "Unnamed character"}”? This can’t be undone.`)) deleteCharacter(id);
                        }}
                      >
                        Delete
                      </button>
                    </li>
                  );
                })}
              </ul>
              {quarantined.length > 0 && (
                <div className="quarantine">
                  <p>
                    <strong>Couldn’t load {quarantined.length} saved character(s).</strong> Their raw data is kept safe.
                  </p>
                  {quarantined.map((q) => (
                    <div key={q.id} className="q-row">
                      <span title={q.error}>{q.id.slice(0, 8)}: {q.error}</span>
                      <button type="button" className="btn small" onClick={() => download(`recovered-${q.id}.json`, q.raw)}>
                        Download raw
                      </button>
                      <button type="button" className="btn small" onClick={() => dismissQuarantine(q.id)}>
                        Dismiss
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <button type="button" className="btn" onClick={() => download(exportFileName(c), exportCharacter(c))}>
          Export JSON
        </button>
        <button type="button" className="btn" onClick={() => fileInput.current?.click()}>
          Import JSON
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            void onFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <button type="button" className="btn" onClick={() => window.print()}>
          Print / Save PDF
        </button>
        <span className="grow" />
        <ThemeSelect />
        <span className="who">{c.name || "Unnamed character"}</span>
      </header>
      {message && (
        <div className={`banner-msg ${message.kind}`} role={message.kind === "error" ? "alert" : "status"}>
          <span>{message.text}</span>
          <button type="button" onClick={() => setMessage(null)} aria-label="Dismiss message">
            ×
          </button>
        </div>
      )}
    </>
  );
}
