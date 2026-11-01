import * as Y from "yjs";
import type { Collab, User } from "./collab";

// One row of the edit log: who changed which lines, and when.
export type EditEntry = {
  name: string;
  color: string;
  from: number; // first changed line
  to: number; // last changed line (same as "from" for a one-line edit)
  time: number; // milliseconds since 1970 (Date.now())
  by: number; // the editor's Yjs clientID, used to group one person's typing
};

const MAX_ENTRIES = 200; // keep the shared document small
const GROUP_MS = 30_000; // one person's typing on nearby lines within 30 s counts as one change

// The log is a second shared type inside the room's Y.Doc, next to the code ("code" Y.Text).
// So it syncs to everyone, is saved in MongoDB with the code, and works offline, like the code.
export const getEditLog = (ydoc: Y.Doc) => ydoc.getArray<EditEntry>("editLog");

const lineAt = (text: string, index: number) => text.slice(0, index).split("\n").length;

// Watches the code and writes an entry for every change *this* user makes.
// Returns a function that stops watching.
export function trackEdits(collab: Collab, user: User) {
  const log = getEditLog(collab.ydoc);

  const onChange = (event: Y.YTextEvent) => {
    // "local" = typed in this browser. Changes from teammates arrive with local = false:
    // their own browser already logged them, so logging here too would duplicate them.
    if (!event.transaction.local) return;

    // The delta describes the change as steps: skip (retain) N characters, insert text, delete N.
    const text = collab.ytext.toString();
    let index = 0;
    let from = Infinity;
    let to = 0;
    for (const step of event.delta) {
      if (step.retain) {
        index += step.retain;
      } else if (typeof step.insert === "string") {
        const start = lineAt(text, index);
        const newLines = step.insert.split("\n").length - 1;
        from = Math.min(from, start);
        to = Math.max(to, start + newLines);
        index += step.insert.length;
      } else if (step.delete) {
        const line = lineAt(text, index);
        from = Math.min(from, line);
        to = Math.max(to, line);
      }
    }
    if (from === Infinity) return;

    const entry: EditEntry = { name: user.name, color: user.color, from, to, time: Date.now(), by: collab.ydoc.clientID };
    collab.ydoc.transact(() => {
      const last = log.length > 0 ? log.get(log.length - 1) : null;
      // Same person, still typing (within 30 s), on the same or a neighbouring line (e.g. pressed
      // Enter and kept going): grow their last entry instead of adding one row per keystroke.
      const sameBurst =
        last &&
        last.by === entry.by &&
        entry.time - last.time < GROUP_MS &&
        from <= last.to + 1 &&
        to >= last.from - 1;
      if (sameBurst) {
        entry.from = Math.min(from, last.from);
        entry.to = Math.max(to, last.to);
        log.delete(log.length - 1); // replace it with the grown entry
      }
      log.push([entry]);
      if (log.length > MAX_ENTRIES) log.delete(0, log.length - MAX_ENTRIES); // drop the oldest
    });
  };

  collab.ytext.observe(onChange);
  return () => collab.ytext.unobserve(onChange);
}
