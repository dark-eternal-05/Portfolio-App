import React from "react";
import videoFile from "../assets/11218535-hd_1920_1080_30fps.mp4";

export default function VideoSection(): React.JSX.Element {
  const scrollToApplications = () => {
    document.getElementById("applications")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div
      className="relative h-115 w-full overflow-hidden rounded-3xl"
      style={{
        border: "1px solid var(--panel-border)",
        boxShadow: "var(--card-shadow)",
      }}
    >
      {/* Background Video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute right-0 top-0 h-full w-[72%] object-cover"
        style={{
          filter: "brightness(0.9) contrast(1.05)",
        }}
      >
        <source src={videoFile} type="video/mp4" />
      </video>

      {/* Dark Overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: `
        linear-gradient(
          90deg,
          rgba(4,12,25,1) 0%,
          rgba(4,12,25,0.95) 25%,
          rgba(4,12,25,0.75) 40%,
          rgba(4,12,25,0.25) 55%,
          rgba(4,12,25,0) 70%
      )
      `,
        }}
      />
      <div
        className="absolute left-[25%] top-0 h-full w-40"
        style={{
          background:
            "linear-gradient(90deg, rgba(4,12,25,1) 0%, rgba(4,12,25,0) 100%)",
          backdropFilter: "blur(12px)",
        }}
      />
      {/* Accent Glow */}
      <div
        className="absolute -left-20 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full blur-3xl"
        style={{
          background: "rgba(0,212,255,0.12)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex h-full items-center px-8 md:px-14">
        <div className="w-[38%] min-w-[420px]">
          <div
            className="mb-4 inline-flex items-center rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em]"
            style={{
              background: "rgba(0,212,255,0.12)",
              color: "var(--accent)",
              border: "1px solid rgba(0,212,255,0.18)",
            }}
          >
            Internal Project Portal
          </div>

          <h1
            className="text-4xl font-bold leading-tight md:text-6xl"
            style={{
              color: "#ffffff",
            }}
          >
            DAX3 Portfolio
          </h1>

          <p
            className="mt-5 max-w-xl text-base leading-relaxed md:text-lg"
            style={{
              color: "rgba(255,255,255,0.82)",
            }}
          >
            Explore applications, digital solutions, and innovative products
            developed by the DAX3 Department.
          </p>

          <div className="mt-8">
            <button
              onClick={scrollToApplications}
              className="rounded-xl px-6 py-3 text-sm font-semibold transition-all duration-300 hover:scale-105"
              style={{
                background: "var(--accent)",
                color: "#071426",
                boxShadow: "0 12px 30px rgba(0,212,255,0.25)",
              }}
            >
              Explore Applications
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
