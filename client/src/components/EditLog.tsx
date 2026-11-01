import { useEffect, useState } from "react";
import type * as Y from "yjs";
import { getEditLog, type EditEntry } from "../lib/editLog";
import { ClockIcon } from "./Icons";

type Props = { ydoc: Y.Doc; onJump: (line: number) => void };

// "10:42 AM" for today, "Nov 1, 10:42 AM" for older changes.
function formatTime(ms: number) {
  const d = new Date(ms);
  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return d.toDateString() === new Date().toDateString()
    ? time
    : `${d.toLocaleDateString([], { month: "short", day: "numeric" })}, ${time}`;
}

// Small panel under the editor: who changed which line, and when. Newest first.
// Clicking a row jumps to that line in the editor.
export default function EditLog({ ydoc, onJump }: Props) {
  const [entries, setEntries] = useState<EditEntry[]>([]);

  useEffect(() => {
    const log = getEditLog(ydoc);
    // Runs whenever anyone (me or a teammate) adds an entry, because the log is shared.
    const update = () => setEntries(log.toArray().reverse());
    log.observe(update);
    update();
    return () => log.unobserve(update);
  }, [ydoc]);

  return (
    <section className="flex h-32 shrink-0 flex-col overflow-hidden rounded-xl border border-divider bg-content1">
      <div className="flex h-8 shrink-0 items-center gap-2 border-b border-divider px-3 text-xs font-medium">
        <ClockIcon size={13} className="text-default-500" />
        Edit log
        <span className="ml-auto font-normal text-default-400">{entries.length} changes</span>
      </div>
      <div className="flex-1 overflow-y-auto py-1 font-mono text-[11px]">
        {entries.length === 0 && <p className="px-3 py-2 font-sans text-default-400">Edits appear here as your team types.</p>}
        {entries.map((e, i) => (
          <button
            key={`${e.by}-${e.time}-${i}`}
            onClick={() => onJump(e.from)}
            className="flex w-full items-center gap-2 px-3 py-0.5 text-left hover:bg-default-100"
            title={`Go to line ${e.from}`}
          >
            <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: e.color }} />
            <span className="max-w-[10rem] truncate font-sans font-medium">{e.name}</span>
            <span className="text-default-500">{e.from === e.to ? `line ${e.from}` : `lines ${e.from}–${e.to}`}</span>
            <span className="ml-auto shrink-0 text-default-400">{formatTime(e.time)}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
