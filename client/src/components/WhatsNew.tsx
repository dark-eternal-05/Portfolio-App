import React, { useEffect, useMemo, useRef, useState } from "react";
import { fetchWhatsNew } from "../hooks/api";
import { WhatsNewItem } from "../types";

function WhatsNew(): React.JSX.Element {
  const [items, setItems] = useState<WhatsNewItem[]>([]);
  const [shouldScroll, setShouldScroll] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchWhatsNew();
        setItems(data);
      } catch (err) {
        console.error("Failed to load What's New items", err);
      }
    };

    void load();
  }, []);

  const marqueeItems = useMemo(
    () =>
      items.length > 0
        ? items.map((item) => item.title)
        : ["No updates available"],
    [items],
  );

  useEffect(() => {
    const checkWidth = () => {
      const container = containerRef.current;
      const content = contentRef.current;

      if (!container || !content) return;

      const containerWidth = container.offsetWidth;
      const contentWidth = content.scrollWidth;

      setShouldScroll(contentWidth >= containerWidth * 0.8);
    };

    requestAnimationFrame(checkWidth);

    window.addEventListener("resize", checkWidth);

    return () => {
      window.removeEventListener("resize", checkWidth);
    };
  }, [marqueeItems]);

  const renderItems = (copyKey: string) =>
    marqueeItems.map((item, index) => (
      <div
        key={`${copyKey}-${index}`}
        className="flex shrink-0 items-center gap-3 text-xs font-bold uppercase"
        style={{
          color: "var(--text-main)",
          opacity: 0.85,
        }}
      >
        <span style={{ color: "var(--accent)" }}>✦</span>
        <span>{item}</span>
      </div>
    ));

  return (
    <div
      className="relative z-50 mt-3 flex w-full items-center overflow-hidden rounded-2xl backdrop-blur-xl"
      style={{
        height: "var(--marquee-height)",
        background: "var(--panel-bg)",
        border: "1px solid var(--panel-border)",
        boxShadow: "var(--card-shadow)",
      }}
    >
      <div
        className="flex h-full shrink-0 items-center border-r px-5 text-xs font-extrabold uppercase"
        style={{
          borderColor: "var(--panel-border)",
          background: "rgba(0,212,255,0.08)",
          color: "var(--accent)",
        }}
      >
        WHAT'S NEW
      </div>

      <div ref={containerRef} className="flex-1 overflow-hidden">
        {shouldScroll ? (
          <div
            className="flex w-max items-center gap-12 whitespace-nowrap py-2.5 will-change-transform hover:[animation-play-state:paused]"
            style={{
              animation: "marqueeScroll 28s linear infinite",
            }}
          >
            <div className="flex shrink-0 items-center gap-12">
              {renderItems("first")}
            </div>

            <div className="flex shrink-0 items-center gap-12">
              {renderItems("second")}
            </div>
          </div>
        ) : (
          <div
            ref={contentRef}
            className="flex w-max items-center gap-12 whitespace-nowrap py-2.5"
          >
            {renderItems("single")}
          </div>
        )}

        <div
          ref={contentRef}
          className="pointer-events-none invisible absolute flex w-max items-center gap-12 whitespace-nowrap"
        >
          {renderItems("measure")}
        </div>
      </div>
    </div>
  );
}

export default WhatsNew;