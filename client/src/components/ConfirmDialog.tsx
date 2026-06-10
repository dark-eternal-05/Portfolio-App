import { AlertTriangle } from "lucide-react";

interface Props {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
  loading,
}: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md"
      style={{
        background: "rgba(0, 0, 0, 0.45)",
      }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6"
        style={{
          background: "var(--panel-bg)",
          border: "1px solid var(--panel-border)",
          boxShadow: "var(--dropdown-shadow)",
        }}
      >
        <div className="flex items-start gap-4">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
            style={{
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.2)",
            }}
          >
            <AlertTriangle
              className="h-5 w-5"
              style={{
                color: "var(--danger)",
              }}
            />
          </span>

          <div>
            <p
              className="text-sm font-semibold"
              style={{
                color: "var(--text-main)",
              }}
            >
              Confirm Deletion
            </p>

            <p
              className="mt-2 text-sm leading-relaxed"
              style={{
                color: "var(--text-secondary)",
              }}
            >
              {message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all duration-150 active:scale-95 disabled:opacity-50"
            style={{
              background: "var(--danger)",
            }}
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}