import { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

export default function Modal({ title, onClose, children }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKey);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-1000 flex items-center justify-center p-4 backdrop-blur-md"
      style={{ background: "rgba(0, 0, 0, 0.55)" }}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl animate-in fade-in zoom-in-95 duration-200"
        style={{
          background: "var(--panel-bg)",
          border: "1px solid var(--panel-border)",
          boxShadow: "var(--dropdown-shadow)",
        }}
      >
        <div
          className="flex items-center justify-between px-6 py-3"
          style={{ borderBottom: "1px solid var(--panel-border)" }}
        >
          <h2 className="text-base font-semibold" style={{ color: "var(--text-main)" }}>
            {title}
          </h2>

          <button onClick={onClose} className="btn-ghost" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-4" style={{ color: "var(--text-main)" }}>
          {children}
        </div>
      </div>
    </div>
  );
}