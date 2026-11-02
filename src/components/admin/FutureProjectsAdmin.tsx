"use client";
import { useEffect, useMemo, useState } from "react";
import { ImagePlus, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { FutureProjectEditor } from "@/components/admin/FutureProjectEditor";
import { PageHeader, Panel } from "@/components/admin/AdminShell";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  emptyFutureProject,
  formatBudget,
  formatDeadline,
  normalizeLegacyProjects,
  type FutureProject,
  type FutureProjectDraft,
} from "@/lib/future-projects";
import { useAdmin } from "@/lib/admin-store";

const LEGACY_KEY = "najm-future-projects-v1";
const IMPORTED_KEY = "najm-future-projects-db-imported-v1";
type ProjectApiError = {
  error?: string;
  issues?: {
    formErrors?: string[];
    fieldErrors?: Record<string, string[] | undefined>;
  };
};

export default function FutureProjectsAdmin() {
  const { can } = useAdmin();
  const [projects, setProjects] = useState<FutureProject[]>([]);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [visibility, setVisibility] = useState("all");
  const [editing, setEditing] = useState<FutureProjectDraft | null>(null);
  const [pendingDelete, setPendingDelete] = useState<FutureProject | null>(null);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        if (!localStorage.getItem(IMPORTED_KEY)) {
          const legacyData = localStorage.getItem(LEGACY_KEY);
          if (legacyData) {
            const legacyProjects = normalizeLegacyProjects(JSON.parse(legacyData));
            for (const project of legacyProjects ?? []) {
              if (
                !project.name.trim() ||
                !project.region.trim() ||
                !project.text.trim() ||
                !project.image.trim()
              )
                continue;
              const response = await fetch("/api/admin/future-projects", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(project),
              });
              if (!response.ok) throw new Error("Could not import previously saved projects.");
            }
          }
          localStorage.setItem(IMPORTED_KEY, "true");
        }
        const response = await fetch("/api/admin/future-projects", {
          credentials: "include",
          cache: "no-store",
        });
        const data = (await response.json()) as FutureProject[] | { error?: string };
        if (!response.ok || !Array.isArray(data)) {
          throw new Error(!Array.isArray(data) ? data.error : "Could not load projects.");
        }
        if (!cancelled) setProjects(data);
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Could not load projects.";
          setLoadError(message);
          toast.error(message);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleProjects = useMemo(
    () =>
      [...projects]
        .sort((a, b) => a.order - b.order)
        .filter((project) => {
          const matchesQuery = `${project.name} ${project.region} ${project.status}`
            .toLowerCase()
            .includes(query.toLowerCase());
          const matchesVisibility =
            visibility === "all" ||
            (visibility === "published" ? project.published : !project.published);
          return matchesQuery && matchesVisibility;
        }),
    [projects, query, visibility],
  );

  const save = async (project: FutureProjectDraft) => {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/future-projects", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(project),
      });
      const result = (await response.json()) as FutureProject | ProjectApiError;
      if (!response.ok || !("id" in result)) {
        const apiError = result as ProjectApiError;
        const fieldErrors = Object.entries(apiError.issues?.fieldErrors ?? {}).flatMap(
          ([field, messages]) => (messages ?? []).map((message) => `${field}: ${message}`),
        );
        const messages = [...(apiError.issues?.formErrors ?? []), ...fieldErrors];
        throw new Error(messages.join(" ") || apiError.error || "Could not save project.");
      }
      setProjects((current) =>
        current.some((item) => item.id === result.id)
          ? current.map((item) => (item.id === result.id ? result : item))
          : [...current, result],
      );
      setEditing(null);
      toast.success(project.id ? "Project updated" : "Project added");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save project.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (project: FutureProject) => {
    if (!can.delete) return;
    try {
      const response = await fetch(`/api/admin/future-projects/${encodeURIComponent(project.id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        throw new Error(result.error ?? "Could not delete project.");
      }
      setProjects((current) => current.filter((item) => item.id !== project.id));
      toast.success("Project deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete project.");
    }
  };

  const addProject = () => {
    setEditing(emptyFutureProject(Math.max(0, ...projects.map((project) => project.order)) + 1));
  };

  return (
    <div>
      <PageHeader
        title="Future Projects"
        sub={
          ready
            ? `${projects.length} projects · ${projects.filter((project) => project.published).length} published`
            : "Loading projects…"
        }
        action={
          can.edit && (
            <button
              type="button"
              onClick={addProject}
              className="flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-primary-foreground hover:bg-ink"
            >
              <Plus className="h-4 w-4" />
              Add project
            </button>
          )
        }
      />
      <p className="-mt-5 mb-6 text-sm text-muted-foreground">
        Published projects appear on the homepage. Drafts remain in the admin only.
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        <label className="relative w-full sm:w-80">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search projects"
            className="field !bg-background pl-10"
          />
        </label>
        <select
          value={visibility}
          onChange={(event) => setVisibility(event.target.value)}
          className="field !w-auto !bg-background"
          aria-label="Filter projects by visibility"
        >
          <option value="all">All projects</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
        </select>
      </div>

      {!ready ? (
        <Panel>Loading projects…</Panel>
      ) : loadError ? (
        <Panel>{loadError}</Panel>
      ) : visibleProjects.length === 0 ? (
        <Panel>No projects match these filters.</Panel>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleProjects.map((project) => (
            <Panel key={project.id} className="!p-3">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[1.25rem] bg-cream">
                {project.image ? (
                  <img
                    src={project.image}
                    alt={project.imageAlt || project.name}
                    loading="lazy"
                    className={`h-full w-full object-cover ${project.published ? "" : "opacity-50 grayscale"}`}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <ImagePlus className="h-8 w-8" />
                  </div>
                )}
                <span className="absolute left-3 top-3 rounded-full bg-background px-3 py-1 text-xs font-medium">
                  {String(project.order).padStart(2, "0")}
                </span>
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs ${project.published ? "bg-primary text-primary-foreground" : "bg-cream text-muted-foreground"}`}
                  >
                    {project.published ? "Published" : "Draft"}
                  </span>
                  <span className="truncate text-sm text-muted-foreground">{project.status}</span>
                </div>
                <h2 className="mt-3 truncate text-xl font-medium">
                  {project.name || "Untitled project"}
                </h2>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {project.region} · {formatDeadline(project)}
                </p>
                <p className="mt-3 line-clamp-2 min-h-10 text-sm text-muted-foreground">
                  {project.text}
                </p>
                <div className="mt-4 flex items-center justify-between gap-2 border-t border-cream pt-3">
                  <p className="truncate text-sm font-medium">{formatBudget(project.budget)}</p>
                  <div className="flex shrink-0 gap-2">
                    {can.edit && (
                      <button
                        type="button"
                        onClick={() => setEditing(project)}
                        aria-label={`Edit ${project.name}`}
                        className="rounded-full bg-cream p-2.5 hover:bg-primary hover:text-primary-foreground"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                    {can.delete && (
                      <button
                        type="button"
                        onClick={() => setPendingDelete(project)}
                        aria-label={`Delete ${project.name}`}
                        className="rounded-full bg-cream p-2.5 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent className="rounded-[1.25rem]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete future project?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? `“${pendingDelete.name}” will be removed from the database and homepage.`
                : "This project will be removed."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDelete) void remove(pendingDelete);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {editing && (
        <FutureProjectEditor
          key={editing.id ?? "new-project"}
          project={editing}
          busy={busy}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
    </div>
  );
}
