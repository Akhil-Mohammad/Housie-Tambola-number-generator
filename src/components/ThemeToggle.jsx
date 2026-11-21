import React from "react";
import { useTheme } from "../context/ThemeContext";
export default function ThemeToggle() {
  const { themeMode, toggleTheme } = useTheme();
  return <button className="global-theme-toggle" type="button" onClick={toggleTheme} aria-label={`Switch to ${themeMode === "dark" ? "light" : "dark"} mode`} title={`Switch to ${themeMode === "dark" ? "light" : "dark"} mode`}>
    <span aria-hidden="true">{themeMode === "dark" ? "☀️" : "🌙"}</span> {themeMode === "dark" ? "Light" : "Dark"}
  </button>;
}
