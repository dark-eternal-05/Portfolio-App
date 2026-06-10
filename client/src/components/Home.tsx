import React, { useState, useEffect } from "react";
import Header from "./Header";
import DisclaimerFooter from "./DisclaimerFooter";
import Sidebar from "./Sidebar";
import Carousel from "./Carousel";
import FloralBackground from "./FloralBackground";
import VideoSection from "./VideoSection";
import WhatsNew from "./WhatsNew";
// prarambh
export default function Home(): React.JSX.Element {
  const [mounted, setMounted] = useState(false);

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") ?? "dark";
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isDark = theme === "dark";

  useEffect(() => {
    document.title = "DAX3 Portfolio";

    const timer = setTimeout(() => setMounted(true), 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
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
              color: "#00D4FF",
              opacity: 0.4,
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
      if (
        (window as any).pJSDom &&
        (window as any).pJSDom.length
      ) {
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
      className={`relative min-h-screen overflow-x-hidden bg-fixed transition-colors duration-300 ${
        isDark ? "theme-dark" : "theme-light"
      }`}
      style={{
        background: "var(--bg-main)",
        color: "var(--text-main)",
        paddingTop: "var(--header-height)",
        paddingBottom: "var(--footer-height)",
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
        onToggleTheme={() =>
          setTheme(isDark ? "light" : "dark")
        }
      />

      <Sidebar
        open={sidebarOpen}
        setOpen={setSidebarOpen}
      />

      {/* Blur Overlay */}
      <div
        className={`fixed inset-0 z-580 transition-all duration-300 ${
          sidebarOpen
            ? "pointer-events-auto opacity-100 backdrop-blur-sm bg-black/20"
            : "pointer-events-none opacity-0"
        }`}
      />

      {/* Main Content */}
      <main
        className={`relative z-10 min-h-[calc(100vh-var(--header-height)-var(--footer-height))] px-4 pt-4 pb-8 pl-[calc(var(--sidebar-width)+1rem)] md:px-8 md:pt-0 md:pl-[calc(var(--sidebar-width)+2rem)] transition-all duration-300 ${
          sidebarOpen ? "scale-[0.995]" : "scale-100"
        }`}
      >
        <div
          className={`flex w-full flex-col items-center justify-start ${
            mounted
              ? "opacity-100 animate-[fadeUp_0.8s_ease_forwards]"
              : "opacity-0"
          }`}
        >
          <section className="m-0 flex w-full flex-col justify-start p-0 max-[1100px]:w-[min(650px,100%)]">
            <VideoSection />
            <WhatsNew />
          </section>

          <section
            id="applications"
            className="mt-6 w-full max-w-400"
          >
            <Carousel theme={theme} />
          </section>
        </div>
      </main>

      <DisclaimerFooter />
    </div>
  );
}