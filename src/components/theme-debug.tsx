"use client";

import { useTheme } from "@/components/theme-provider";
import { useEffect, useState } from "react";

export function ThemeDebug() {
  const { theme } = useTheme();
  const [systemTheme, setSystemTheme] = useState<string>("unknown");
  const [matchMediaSupported, setMatchMediaSupported] = useState(false);
  const [currentClass, setCurrentClass] = useState<string>("");

  useEffect(() => {
    // Check if matchMedia is supported
    const supported = typeof window.matchMedia === "function";
    setMatchMediaSupported(supported);

    if (supported) {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      setSystemTheme(mediaQuery.matches ? "dark" : "light");

      const handleChange = (e: MediaQueryListEvent) => {
        setSystemTheme(e.matches ? "dark" : "light");
      };

      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
      } else if (mediaQuery.addListener) {
        mediaQuery.addListener(handleChange);
        return () => mediaQuery.removeListener(handleChange);
      }
    }
  }, []);

  useEffect(() => {
    // Check current HTML class
    const htmlClasses = document.documentElement.className;
    setCurrentClass(htmlClasses);
  }, [theme]);

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-card border rounded-lg shadow-lg text-xs max-w-xs z-50">
      <h3 className="font-bold mb-2">Theme Debug</h3>
      <div className="space-y-1">
        <div>Current theme: <strong>{theme}</strong></div>
        <div>System theme: <strong>{systemTheme}</strong></div>
        <div>matchMedia supported: <strong>{matchMediaSupported ? "Yes" : "No"}</strong></div>
        <div>HTML classes: <strong>{currentClass || "none"}</strong></div>
        <div>User agent: <strong>{navigator.userAgent.includes("Mobile") ? "Mobile" : "Desktop"}</strong></div>
      </div>
    </div>
  );
}