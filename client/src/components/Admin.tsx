import React, { useState, useEffect } from "react";
import Header from "./Header";
import DisclaimerFooter from "./DisclaimerFooter";
import Sidebar from "./Sidebar";
import FloralBackground from "./FloralBackground";
import { LayoutGrid, Sparkles } from "lucide-react";
import { ActiveTab } from "../types/index";
import ApplicationsTab from "./ApplicationsTab";
import WhatsNewTab from "./WhatsNewTab";

export default function Admin(): React.JSX.Element {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [activeTab, setActiveTab] = useState<ActiveTab>("applications");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isDark = theme === "dark";

  useEffect(() => {
    document.title = "DAX3 Portfolio";

    const timer = setTimeout(() => setMounted(true), 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!mounted || !isDark) return;

    const script = document.createElement("script");

    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/particles.js/2.0.0/particles.min.js";

    script.onload = () => {
      if ((window as any).particlesJS) {
        (window as any).particlesJS("particles-js", {
          particles: {
            number: {
              value: 100,
              density: {
                enable: true,
                value_area: 900,
              },
            },
            color: {
              value: "#ffffff",
            },
            shape: {
              type: "circle",
            },
            opacity: {
              value: 0.65,
              random: true,
            },
            size: {
              value: 2.2,
              random: true,
            },
            line_linked: {
              enable: true,
              distance: 220,
              color: "#00d4ff",
              opacity: 0.45,
              width: 1.4,
            },
            move: {
              enable: true,
              speed: 0.8,
              direction: "none",
              random: true,
              straight: false,
              out_mode: "out",
            },
          },
          interactivity: {
            detect_on: "window",
            events: {
              onhover: {
                enable: true,
                mode: "grab",
              },
              onclick: {
                enable: false,
              },
              resize: true,
            },
            modes: {
              grab: {
                distance: 200,
                line_linked: {
                  opacity: 0.75,
                },
              },
            },
          },
          retina_detect: true,
        });
      }
    };

    document.body.appendChild(script);

    return () => {
      if ((window as any).pJSDom && (window as any).pJSDom.length) {
        (window as any).pJSDom.forEach((p: any) =>
          p.pJS?.fn?.vendors?.destroypJS?.(),
        );

        (window as any).pJSDom = [];
      }

      script.remove();
    };
  }, [isDark, mounted]);

  if (!mounted) return null;

  return (
    <div
      className={`relative min-h-screen overflow-x-hidden bg-fixed pt-[var(--header-height)] pb-[var(--footer-height)] transition-colors duration-300 ${
        isDark ? "theme-dark" : "theme-light"
      }`}
      style={{
        background: "var(--bg-main)",
        color: "var(--text-main)",
      }}
    >
      {isDark ? (
        <div
          id="particles-js"
          className="pointer-events-none fixed inset-0 z-0"
        />
      ) : (
        <FloralBackground />
      )}

      <Header
        theme={theme}
        onToggleTheme={() => setTheme(isDark ? "light" : "dark")}
      />

      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      {/* Blur Overlay */}
      <div
        className={`fixed inset-0 z-580 transition-all duration-300 ${
          sidebarOpen
            ? "pointer-events-auto opacity-100 backdrop-blur-md bg-black/25"
            : "pointer-events-none opacity-0"
        }`}
      />
      <main
        className={`relative z-10 min-h-[calc(100vh-var(--header-height)-var(--footer-height))] px-4 py-10 pl-[calc(var(--sidebar-width)+1rem)] md:px-8 md:pl-[calc(var(--sidebar-width)+2rem)] transition-all duration-300 ${
          sidebarOpen ? "scale-[0.995]" : "scale-100"
        }`}
      >
        <div className="mx-auto mb-8 max-w-7xl">
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{
              color: "var(--text-main)",
            }}
          >
            Management Dashboard
          </h1>

          <p
            className="mt-2 text-sm"
            style={{
              color: "var(--text-secondary)",
            }}
          >
            Manage applications and site updates
          </p>
        </div>

        <div
          className="mx-auto mb-8 flex w-fit max-w-7xl items-center gap-1 rounded-xl p-1 backdrop-blur-md"
          style={{
            background: "var(--panel-bg)",
            border: "1px solid var(--panel-border)",
            boxShadow: "var(--card-shadow)",
          }}
        >
          <TabButton
            active={activeTab === "applications"}
            onClick={() => setActiveTab("applications")}
            icon={<LayoutGrid className="h-4 w-4" />}
            label="Applications"
          />

          <TabButton
            active={activeTab === "whats-new"}
            onClick={() => setActiveTab("whats-new")}
            icon={<Sparkles className="h-4 w-4" />}
            label="What's New"
          />
        </div>

        <div className="mx-auto max-w-7xl">
          {activeTab === "applications" ? <ApplicationsTab /> : <WhatsNewTab />}
        </div>
      </main>

      <DisclaimerFooter />
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function TabButton({ active, onClick, icon, label }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200"
      style={
        active
          ? {
              background: "var(--accent)",
              color: "#0D1F3C",
              boxShadow: "0 4px 20px rgba(0,212,255,0.25)",
            }
          : {
              color: "var(--text-secondary)",
            }
      }
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = "var(--panel-bg)";
          e.currentTarget.style.color = "var(--text-main)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "var(--text-secondary)";
        }
      }}
    >
      {icon}
      {label}
    </button>
  );
}
