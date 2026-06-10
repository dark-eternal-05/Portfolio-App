import React from "react";
import { House, UserStar } from "lucide-react";
import { Link } from "react-router-dom";

interface SidebarProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Sidebar({
  open,
  setOpen,
}: SidebarProps): React.JSX.Element {
  return (
    <aside
      className="fixed left-0 z-[590] overflow-hidden pt-4 backdrop-blur-xl transition-all duration-300"
      style={{
        top: "var(--header-height)",
        bottom: "var(--footer-height)",
        width: open ? "180px" : "var(--sidebar-width)",
        background: "var(--panel-bg)",
        borderRight: "1px solid var(--panel-border)",
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {/* Home */}
      <Link
        to="/"
        className="mx-2 flex h-12 items-center gap-3 rounded-xl px-3 font-semibold no-underline transition-all duration-200"
        style={{
          background: "var(--home-bg)",
          color: "var(--home-color)",
          boxShadow: open
            ? "0 0 24px rgba(0,212,255,0.25)"
            : "0 0 18px rgba(0,212,255,0.18)",
        }}
        aria-label="Home"
      >
        <House size={20} className="shrink-0" />

        <span
          className={`whitespace-nowrap transition-all duration-200 ${
            open
              ? "opacity-100 translate-x-0"
              : "opacity-0 -translate-x-2"
          }`}
        >
          Home
        </span>
      </Link>

      {/* Admin */}
      <Link
        to="/admin"
        className="mx-2 mt-2 flex h-12 items-center gap-3 rounded-xl px-3 font-semibold no-underline transition-all duration-200"
        style={{
          background: "var(--home-bg)",
          color: "var(--home-color)",
          boxShadow: open
            ? "0 0 24px rgba(0,212,255,0.25)"
            : "0 0 18px rgba(0,212,255,0.18)",
        }}
        aria-label="Admin"
      >
        <UserStar size={20} className="shrink-0" />

        <span
          className={`whitespace-nowrap transition-all duration-200 ${
            open
              ? "opacity-100 translate-x-0"
              : "opacity-0 -translate-x-2"
          }`}
        >
          Admin
        </span>
      </Link>
    </aside>
  );
}