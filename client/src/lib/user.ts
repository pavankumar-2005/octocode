import type { User } from "./collab";

const COLORS = ["#f97316", "#22c55e", "#3b82f6", "#eab308", "#ec4899", "#14b8a6", "#a855f7"];

// Your cursor color, picked once and remembered in this browser.
export function getColor(): string {
  let color = localStorage.getItem("octocode-color");
  if (!color) {
    color = COLORS[Math.floor(Math.random() * COLORS.length)];
    localStorage.setItem("octocode-color", color);
  }
  return color;
}

// Guest users (quick sessions): just a name + color, remembered in this browser. No password.
export function loadUser(): User | null {
  const name = localStorage.getItem("octocode-name");
  return name ? { name, color: getColor() } : null;
}

export function saveName(name: string): User {
  localStorage.setItem("octocode-name", name.trim());
  return loadUser()!;
}
