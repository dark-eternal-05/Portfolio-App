import { useState } from "react";
import { WhatsNewItem, WhatsNewFormData } from "../types";

interface Props {
  initial?: WhatsNewItem;
  onSubmit: (data: WhatsNewFormData) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
}

export default function WhatsNewForm({
  initial,
  onSubmit,
  onCancel,
  submitting,
}: Props) {
  const [form, setForm] = useState<WhatsNewFormData>({
    title: initial?.title ?? "",
    link: initial?.link ?? "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (
    e: React.FormEvent,
  ) => {
    e.preventDefault();

    await onSubmit({
      ...form,
      link: form.link || undefined,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      {/* Title */}
      <div>
        <label
          className="mb-1.5 block text-sm font-medium"
          style={{
            color: "var(--text-main)",
          }}
        >
          Title{" "}
          <span
            style={{
              color: "var(--danger)",
            }}
          >
            *
          </span>
        </label>

        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          required
          placeholder="e.g. Improved voice recognition accuracy"
          className="input-field"
        />
      </div>

      {/* Link */}
      <div>
        <label
          className="mb-1.5 block text-sm font-medium"
          style={{
            color: "var(--text-main)",
          }}
        >
          Link{" "}
          <span
            className="font-normal"
            style={{
              color: "var(--text-muted)",
            }}
          >
            (optional)
          </span>
        </label>

        <input
          name="link"
          value={form.link ?? ""}
          onChange={handleChange}
          placeholder="https://docs.example.com/changelog"
          className="input-field"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary"
        >
          {submitting
            ? "Saving..."
            : initial
              ? "Save Changes"
              : "Add Item"}
        </button>
      </div>
    </form>
  );
}