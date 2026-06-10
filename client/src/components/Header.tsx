import React from "react";

interface HeaderProps {
  theme: string;
  onToggleTheme: () => void;
}

export default function Header({
  theme,
  onToggleTheme,
}: HeaderProps): React.JSX.Element {
  const isDark = theme === "dark";

  return (
    <header
      className="fixed inset-x-0 top-0 z-600 flex items-center justify-between px-4 pl-18 backdrop-blur-xl md:px-10 md:pl-20"
      style={{
        height: "var(--header-height)",
        background: "var(--panel-bg)",
        borderBottom: "1px solid var(--panel-border)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
      }}
    >
      {/* Logo Placeholder */}
      <div
        className="flex h-8.5 w-30 items-center justify-center rounded-lg border border-dashed text-[11px]"
        style={{
          borderColor: "var(--panel-border)",
          color: "var(--text-secondary)",
          background: "rgba(255,255,255,0.05)",
        }}
      >
        LOGO
      </div>

      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label="Toggle theme"
          title={
            isDark
              ? "Switch to light mode"
              : "Switch to dark mode"
          }
          className="relative flex h-8 w-16 cursor-pointer items-center justify-between rounded-full border p-0.5 transition-all duration-300"
          style={{
            borderColor: isDark
              ? "rgba(0,212,255,0.25)"
              : "rgba(15,23,42,0.12)",
            background: isDark
              ? "rgba(0,212,255,0.10)"
              : "rgba(15,23,42,0.06)",
          }}
        >
          {/* Sun */}
          <span
            className="relative z-10 flex h-5.5 w-5.5 items-center justify-center"
            style={{
              color: isDark
                ? "rgba(255,255,255,0.55)"
                : "#f59e0b",
            }}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5 fill-none stroke-current stroke-2"
            >
              <path d="M12 4V2M12 22v-2M4 12H2M22 12h-2M5.64 5.64 4.22 4.22M19.78 19.78l-1.42-1.42M18.36 5.64l1.42-1.42M4.22 19.78l1.42-1.42" />
              <circle cx="12" cy="12" r="4" />
            </svg>
          </span>

          {/* Moon */}
          <span
            className="relative z-10 flex h-5.5 w-5.5 items-center justify-center"
            style={{
              color: isDark
                ? "#0D1F3C"
                : "var(--text-secondary)",
            }}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5 fill-none stroke-current stroke-2"
            >
              <path d="M21 14.8A8.5 8.5 0 0 1 9.2 3a7 7 0 1 0 11.8 11.8Z" />
            </svg>
          </span>

          {/* Slider */}
          <span
            className="absolute top-1 left-1 z-5 h-5.5 w-5.5 rounded-full transition-all duration-300"
            style={{
              transform: isDark
                ? "translateX(32px)"
                : "translateX(0px)",
              background: isDark
                ? "var(--accent)"
                : "#ffffff",
              boxShadow:
                "0 3px 12px rgba(15,23,42,0.25)",
            }}
          />
        </button>

        {/* Avatar Placeholder */}
        <div
          className="flex h-8.5 w-8.5 items-center justify-center rounded-full border border-dashed text-[11px]"
          style={{
            borderColor: "var(--panel-border)",
            color: "var(--text-secondary)",
            background: "rgba(255,255,255,0.05)",
          }}
        >
          DB
        </div>

        {/* Department Placeholder */}
        <span
          className="hidden text-[13px] md:inline"
          style={{
            color: "var(--text-secondary)",
          }}
        >
          Digital Department
        </span>
      </div>
    </header>
  );
}