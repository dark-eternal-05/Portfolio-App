import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  fetchWhatsNew,
  createWhatsNew,
  updateWhatsNew,
  deleteWhatsNew,
} from "../hooks/api";
import { WhatsNewItem, WhatsNewFormData } from "../types";
import Modal from "./Modal";
import WhatsNewForm from "./WhatsNewForm";
import ConfirmDialog from "./ConfirmDialog";

export default function WhatsNewTab() {
  const [items, setItems] = useState<WhatsNewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTarget, setEditTarget] = useState<WhatsNewItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WhatsNewItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setItems(await fetchWhatsNew());
    } catch {
      toast.error("Failed to load What's New items");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async (data: WhatsNewFormData) => {
    setSubmitting(true);

    try {
      const updatedTable = await createWhatsNew(data);
      setItems(updatedTable);
      setShowAddModal(false);
      toast.success("Item added");
    } catch {
      toast.error("Failed to add item");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (data: WhatsNewFormData) => {
    if (!editTarget) return;

    setSubmitting(true);

    try {
      const updatedTable = await updateWhatsNew(
  String(editTarget.id ?? editTarget._id),
  data,
);
      setItems(updatedTable);
      setEditTarget(null);
      toast.success("Item updated");
    } catch {
      toast.error("Failed to update item");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setSubmitting(true);

    try {
      const updatedTable = await deleteWhatsNew(String(deleteTarget.id ?? deleteTarget._id));
      setItems(updatedTable);
      setDeleteTarget(null);
      toast.success("Item deleted");
    } catch {
      toast.error("Failed to delete item");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (iso?: string) => {
    if (!iso) return "—";

    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {items?.length || 0} update
          {(items?.length || 0) !== 1 ? "s" : ""} posted
        </p>

        <button onClick={() => setShowAddModal(true)} className="btn-primary">
          <Plus className="h-4 w-4" />
          Add Update
        </button>
      </div>

      <div
        className="overflow-hidden rounded-2xl"
        style={{
          background: "var(--panel-bg)",
          border: "1px solid var(--panel-border)",
          boxShadow: "var(--card-shadow)",
        }}
      >
        {loading ? (
          <div
            className="flex items-center justify-center py-24 text-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            Loading...
          </div>
        ) : (items?.length || 0) === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p
              className="text-sm font-medium"
              style={{ color: "var(--text-main)" }}
            >
              No updates posted yet
            </p>

            <p
              className="mt-1 text-xs"
              style={{ color: "var(--text-secondary)" }}
            >
              Click "Add Update" to post something new
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid var(--panel-border)",
                    background: "rgba(255,255,255,0.03)",
                  }}
                >
                  <th
                    className="w-12 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "var(--text-muted)" }}
                  >
                    #
                  </th>

                  <th
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Title
                  </th>

                  <th
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Link
                  </th>

                  <th
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Added
                  </th>

                  <th
                    className="w-[84px] min-w-[84px] px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {items.map((item, idx) => (
                  <tr
                    key={item._id}
                    className="transition-all duration-150"
                    style={{ borderBottom: "1px solid var(--panel-border)" }}
                  >
                    <td
                      className="px-4 py-4 text-xs font-mono"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {idx + 1}
                    </td>

                    <td
                      className="px-4 py-4 font-medium"
                      style={{ color: "var(--text-main)" }}
                    >
                      {item.title}
                    </td>

                    <td
                      className="px-4 py-4"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {item.link ? (
                        <span className="break-all text-xs">
                          {item.link}
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>—</span>
                      )}
                    </td>

                    <td
                      className="px-4 py-4 text-xs"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {formatDate(item.createdAt)}
                    </td>

                    <td className="w-[84px] min-w-[84px] px-2 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEditTarget(item)}
                          className="btn-icon"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteTarget(item)}
                          className="btn-icon-danger"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddModal && (
        <Modal title="Add Update" onClose={() => setShowAddModal(false)}>
          <WhatsNewForm
            onSubmit={handleCreate}
            onCancel={() => setShowAddModal(false)}
            submitting={submitting}
          />
        </Modal>
      )}

      {editTarget && (
        <Modal title="Edit Update" onClose={() => setEditTarget(null)}>
          <WhatsNewForm
            initial={editTarget}
            onSubmit={handleUpdate}
            onCancel={() => setEditTarget(null)}
            submitting={submitting}
          />
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          message={`Delete "${deleteTarget.title}"? This action cannot be undone.`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          loading={submitting}
        />
      )}
    </>
  );
}