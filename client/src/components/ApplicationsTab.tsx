import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import {
  fetchApplications,
  createApplication,
  updateApplication,
  deleteApplication,
} from "../hooks/api";
import { Application, ApplicationFormData } from "../types";
import Modal from "./Modal";
import ApplicationForm from "./ApplicationForm";
import ConfirmDialog from "./ConfirmDialog";

export default function ApplicationsTab() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Application | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Application | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setApps(await fetchApplications());
    } catch {
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async (data: ApplicationFormData) => {
    setSubmitting(true);

    try {
      const created = await createApplication(data);
      setApps((prev) => [created, ...prev]);
      setShowAddModal(false);
      toast.success("Application added");
    } catch {
      toast.error("Failed to add application");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (data: ApplicationFormData) => {
    if (!editTarget) return;

    setSubmitting(true);

    try {
      const updatedTable = await updateApplication(String(editTarget.id), data);
      setApps(updatedTable);
      setEditTarget(null);
      toast.success("Application updated");
    } catch {
      toast.error("Failed to update application");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setSubmitting(true);

    try {
      await deleteApplication(String(deleteTarget.id));
      setApps((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success("Application deleted");
    } catch {
      toast.error("Failed to delete application");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleVisibility = async (app: Application) => {
    try {
      const updatedTable = await updateApplication(String(app.id), {
        visibility: !app.visibility,
      });

      setApps(updatedTable);
    } catch {
      toast.error("Failed to update visibility");
    }
  };

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {apps?.length || 0} application
            {(apps?.length || 0) !== 1 ? "s" : ""} registered
          </p>
        </div>

        <button onClick={() => setShowAddModal(true)} className="btn-primary">
          <Plus className="h-4 w-4" />
          Add Application
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
            Loading…
          </div>
        ) : (apps?.length || 0) === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-sm font-medium" style={{ color: "var(--text-main)" }}>
              No applications yet
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
              Click "Add Application" to get started
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr
                className="text-left"
                style={{
                  borderBottom: "1px solid var(--panel-border)",
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                <th className="w-12 px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  #
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Name
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Category
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Link
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Description
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Visibility
                </th>
                <th className="w-[116px] min-w-[116px] px-2 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {apps.map((app, idx) => (
                <tr
                  key={app.id}
                  className="group transition-all duration-150"
                  style={{ borderBottom: "1px solid var(--panel-border)" }}
                >
                  <td className="px-4 py-3.5 text-slate-400 font-mono text-xs">
                    {idx + 1}
                  </td>

                  <td className="px-4 py-3.5" style={{ color: "var(--text-main)" }}>
                    <div className="font-medium">{app.title}</div>
                    <div className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                      {app.tagline}
                    </div>
                  </td>

                  <td className="px-4 py-3.5">
                    <span
                      className="rounded-full px-2 py-1 text-xs font-medium"
                      style={{
                        background: `${app.color || "var(--accent)"}20`,
                        color: app.color || "var(--accent)",
                        border: `1px solid ${app.color || "var(--accent)"}40`,
                      }}
                    >
                      {app.category}
                    </span>
                  </td>

                  <td className="px-4 py-3.5">
                    <span className="inline-block max-w-[220px] truncate rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-600">
                      {app.link}
                    </span>
                  </td>

                  <td
                    className="max-w-xs px-4 py-3.5 text-xs leading-relaxed"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <span className="line-clamp-2">{app.description}</span>
                  </td>

                  <td className="px-4 py-3.5">
                    {app.visibility ? (
                      <span className="badge-open">Open</span>
                    ) : (
                      <span className="badge-hidden">Hidden</span>
                    )}
                  </td>

                  <td className="w-[116px] min-w-[116px] px-2 py-3.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => toggleVisibility(app)}
                        className="btn-ghost"
                        title={app.visibility ? "Hide application" : "Show application"}
                      >
                        {app.visibility ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </button>

                      <button
                        onClick={() => setEditTarget(app)}
                        className="btn-ghost"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => setDeleteTarget(app)}
                        className="btn-danger-ghost"
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
        )}
      </div>

      {showAddModal && (
        <Modal title="Add Application" onClose={() => setShowAddModal(false)}>
          <ApplicationForm
            onSubmit={handleCreate}
            onCancel={() => setShowAddModal(false)}
            submitting={submitting}
          />
        </Modal>
      )}

      {editTarget && (
        <Modal title="Edit Application" onClose={() => setEditTarget(null)}>
          <ApplicationForm
            initial={editTarget}
            onSubmit={handleUpdate}
            onCancel={() => setEditTarget(null)}
            submitting={submitting}
          />
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          message={`"${deleteTarget.title}" will be permanently removed. This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={submitting}
        />
      )}
    </>
  );
}