import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext(null);
export function ThemeProvider({ children }) {
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem("tambola-theme") || "dark");
  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
    localStorage.setItem("tambola-theme", themeMode);
  }, [themeMode]);
  const value = useMemo(() => ({ themeMode, setThemeMode, toggleTheme: () => setThemeMode(v => v === "dark" ? "light" : "dark") }), [themeMode]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used inside ThemeProvider");
  return value;
}
