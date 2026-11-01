import { Button, Tooltip } from "@heroui/react";
import { useTheme } from "../lib/theme";
import { MoonIcon, SunIcon } from "./Icons";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const next = theme === "dark" ? "light" : "dark";
  return (
    <Tooltip content={`Switch to ${next} theme`} delay={400}>
      <Button isIconOnly size="sm" variant="light" radius="full" aria-label={`Switch to ${next} theme`} onPress={toggle}>
        {theme === "dark" ? <SunIcon /> : <MoonIcon />}
      </Button>
    </Tooltip>
  );
}
