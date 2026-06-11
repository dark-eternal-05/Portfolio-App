import { useState } from "react";
import { Application, ApplicationFormData } from "../types";
import toast from "react-hot-toast";

interface Props {
  initial?: Application;
  onSubmit: (data: ApplicationFormData) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
}

const DESCRIPTION_LIMIT = 150;

export default function ApplicationForm({
  initial,
  onSubmit,
  onCancel,
  submitting,
}: Props) {
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    tagline: initial?.tagline ?? "",
    categories: initial?.categories ?? [],
    description: initial?.description ?? "",
    link: initial?.link ?? "",
    visibility: initial?.visibility ?? true,
  });

  const [categoriesText, setCategoriesText] = useState(
    initial?.categories?.join(", ") ?? "",
  );

  const normalizeCategories = (value: string): string[] => {
    const seen = new Set<string>();

    return value
      .split(",")
      .map((categories) => categories.trim())
      .filter(Boolean)
      .filter((categories) => {
        const key = categories.toLowerCase();

        if (seen.has(key)) return false;

        seen.add(key);
        return true;
      });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;

    if (name === "description" && value.length > DESCRIPTION_LIMIT) {
      toast.error("Description cannot exceed 150 characters");
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : value,
    }));
  };

  const handleCategoriesChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = e.target.value;
    const categories = normalizeCategories(value);

    setCategoriesText(value);

    setForm((prev) => ({
      ...prev,
      categories,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const categories = normalizeCategories(categoriesText);

    if (categories.length === 0) {
      toast.error("At least one category is required");
      return;
    }

    await onSubmit({
      title: form.title.trim(),
      tagline: form.tagline.trim(),
      categories,
      description: form.description.trim(),
      link: form.link.trim(),
      visibility: form.visibility,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label
          className="mb-1 block text-sm font-medium"
          style={{ color: "var(--text-main)" }}
        >
          Application Title *
        </label>

        <input
          name="title"
          value={form.title}
          onChange={handleChange}
          required
          placeholder="e.g. TensAI"
          className="input-field"
        />
      </div>

      <div>
        <label
          className="mb-1 block text-sm font-medium"
          style={{ color: "var(--text-main)" }}
        >
          Tagline *
        </label>

        <input
          name="tagline"
          value={form.tagline}
          onChange={handleChange}
          required
          placeholder="e.g. Enterprise AI Platform"
          className="input-field"
        />
      </div>

      <div>
        <label
          className="mb-1 block text-sm font-medium"
          style={{ color: "var(--text-main)" }}
        >
          URL *
        </label>

        <input
          name="link"
          value={form.link}
          onChange={handleChange}
          required
          placeholder="https://example.com"
          className="input-field"
        />
      </div>

      <div>
        <label
          className="mb-1 block text-sm font-medium"
          style={{ color: "var(--text-main)" }}
        >
          Description *
        </label>

        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          required
          maxLength={DESCRIPTION_LIMIT}
          rows={2}
          placeholder="Brief description of the application"
          className="input-field resize-none"
        />

        <p
          className="mt-1 text-right text-xs"
          style={{
            color:
              form.description.length >= DESCRIPTION_LIMIT
                ? "var(--danger)"
                : "var(--text-muted)",
          }}
        >
          {form.description.length}/{DESCRIPTION_LIMIT}
        </p>
      </div>

      <div className="grid grid-cols-[1fr_auto] items-end gap-4">
        <div>
          <label
            className="mb-1 block text-sm font-medium"
            style={{ color: "var(--text-main)" }}
          >
            Categories *
          </label>

          <input
            name="categories"
            value={categoriesText}
            onChange={handleCategoriesChange}
            required
            placeholder="Separate with commas, e.g. AI, Productivity"
            className="input-field"
          />
        </div>

        <div
          className="flex h-[42px] min-w-[145px] items-center gap-3 rounded-xl px-4"
          style={{
            background: "var(--panel-bg)",
            border: "1px solid var(--panel-border)",
          }}
        >
          <input
            id="visibility"
            name="visibility"
            type="checkbox"
            checked={form.visibility}
            onChange={handleChange}
            className="h-4 w-4 cursor-pointer"
            style={{ accentColor: "var(--accent)" }}
          />

          <label
            htmlFor="visibility"
            className="cursor-pointer whitespace-nowrap text-sm font-medium"
            style={{ color: "var(--text-main)" }}
          >
            Visible
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-1">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>

        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting
            ? "Saving..."
            : initial
              ? "Save Changes"
              : "Add Application"}
        </button>
      </div>
    </form>
  );
}