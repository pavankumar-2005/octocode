import type { User } from "./collab";

const COLORS = ["#f97316", "#22c55e", "#3b82f6", "#eab308", "#ec4899", "#14b8a6", "#a855f7"];

// Guest users: just a name + color, remembered in this browser. No passwords (see decisions D5).
export function loadUser(): User | null {
  const name = localStorage.getItem("octocode-name");
  if (!name) return null;
  let color = localStorage.getItem("octocode-color");
  if (!color) {
    color = COLORS[Math.floor(Math.random() * COLORS.length)];
    localStorage.setItem("octocode-color", color);
  }
  return { name, color };
}

export function saveName(name: string): User {
  localStorage.setItem("octocode-name", name.trim());
  return loadUser()!;
}
