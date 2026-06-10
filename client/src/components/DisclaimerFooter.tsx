import React from "react";

function DisclaimerFooter(): React.JSX.Element {
  return (
    <footer
      className="fixed inset-x-0 bottom-0 z-600 flex h-(--footer-height) items-center justify-center border-t backdrop-blur-xl"
      style={{
        background: "var(--panel-bg)",
        borderColor: "var(--panel-border)",
        color: "var(--text-secondary)",
        boxShadow: "0 -4px 20px rgba(0,0,0,0.08)",
      }}
    >
      <span className="text-[11px] uppercase tracking-wider">
        Disclaimer
      </span>
    </footer>
  );
}

export default DisclaimerFooter;