import { heroui } from "@heroui/react";

// OctoCode brand colors on top of HeroUI's light and dark themes.
// HeroUI switches between them with the "light" / "dark" class on <html> (see lib/theme.tsx).
export default heroui({
  themes: {
    light: {
      colors: {
        background: "#f7f7fb",
        content1: "#ffffff",
        primary: { DEFAULT: "#7c3aed", foreground: "#ffffff" },
        secondary: { DEFAULT: "#0891b2", foreground: "#ffffff" },
        focus: "#7c3aed",
      },
    },
    dark: {
      colors: {
        background: "#09090f",
        content1: "#12121c",
        primary: { DEFAULT: "#8b5cf6", foreground: "#ffffff" },
        secondary: { DEFAULT: "#06b6d4", foreground: "#ffffff" },
        focus: "#8b5cf6",
      },
    },
  },
});
