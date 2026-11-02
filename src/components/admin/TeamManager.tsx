"use client";
import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel } from "@/components/admin/AdminShell";
import { TeamMemberEditor } from "@/components/admin/TeamMemberEditor";
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
import type { TeamMember, TeamMemberDraft } from "@/lib/team";
import { useAdmin } from "@/lib/admin-store";

function emptyMember(order: number): TeamMemberDraft {
  return {
    name: "",
    role: "",
    bio: "",
    image: "",
    imageAlt: "",
    joinedAt: "",
    specialty: "",
    order,
  };
}

type ApiError = {
  error?: string;
  issues?: { fieldErrors?: Record<string, string[] | undefined>; formErrors?: string[] };
};

export default function TeamManager() {
  const { can } = useAdmin();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [editing, setEditing] = useState<TeamMemberDraft | null>(null);
  const [pendingDelete, setPendingDelete] = useState<TeamMember | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState("");

  const load = async () => {
    try {
      const response = await fetch("/api/admin/team", {
        credentials: "include",
        cache: "no-store",
      });
      const result = (await response.json()) as TeamMember[] | ApiError;
      if (!response.ok || !Array.isArray(result))
        throw new Error(!Array.isArray(result) ? result.error : "Could not load team.");
      setMembers(result);
      setLoadError("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not load team.";
      setLoadError(message);
      toast.error(message);
    } finally {
      setReady(true);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async (member: TeamMemberDraft) => {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/team", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(member),
      });
      const result = (await response.json()) as TeamMember | ApiError;
      if (!response.ok || !("id" in result)) {
        const apiError = result as ApiError;
        const fieldErrors = Object.entries(apiError.issues?.fieldErrors ?? {}).flatMap(
          ([field, messages]) => (messages ?? []).map((message) => `${field}: ${message}`),
        );
        throw new Error(
          [...(apiError.issues?.formErrors ?? []), ...fieldErrors].join(" ") ||
            apiError.error ||
            "Could not save team member.",
        );
      }
      setMembers((current) =>
        current.some((item) => item.id === result.id)
          ? current.map((item) => (item.id === result.id ? result : item))
          : [...current, result],
      );
      setEditing(null);
      toast.success(member.id ? "Team member updated" : "Team member added");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save team member.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (member: TeamMember) => {
    if (!can.delete) return;
    try {
      const response = await fetch(`/api/admin/team/${encodeURIComponent(member.id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const result = (await response.json()) as ApiError;
        throw new Error(result.error ?? "Could not remove team member.");
      }
      setMembers((current) => current.filter((item) => item.id !== member.id));
      toast.success("Team member removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove team member.");
    }
  };

  return (
    <div>
      <PageHeader
        title="About"
        sub={`${members.length} team members`}
        action={
          can.edit && (
            <button
              type="button"
              onClick={() =>
                setEditing(emptyMember(Math.max(0, ...members.map((member) => member.order)) + 1))
              }
              className="flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-primary-foreground hover:bg-ink"
            >
              <Plus className="h-4 w-4" />
              Add team member
            </button>
          )
        }
      />
      <section aria-labelledby="team-admin-title">
        <h2 id="team-admin-title" className="mb-1 text-2xl font-medium">
          Team
        </h2>
        <p className="mb-5 text-sm text-muted-foreground">
          Profiles appear on the About page and homepage. Changes are shared with site visitors.
        </p>
        {!ready ? (
          <Panel>Loading team…</Panel>
        ) : loadError ? (
          <Panel>
            {loadError}
            <button
              type="button"
              onClick={() => void load()}
              className="ml-3 text-primary underline"
            >
              Retry
            </button>
          </Panel>
        ) : members.length === 0 ? (
          <Panel>No team members yet.</Panel>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[...members]
              .sort((a, b) => a.order - b.order)
              .map((member) => (
                <Panel key={member.id} className="!p-3">
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[1.25rem] bg-cream">
                    <img
                      src={member.image}
                      alt={member.imageAlt || member.name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute left-3 top-3 rounded-full bg-background px-3 py-1 text-xs font-medium">
                      {String(member.order).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="p-3">
                    <h3 className="truncate text-lg font-medium">{member.name}</h3>
                    <p className="truncate text-sm text-primary">{member.role}</p>
                    <p className="mt-3 line-clamp-3 min-h-[4.5rem] text-sm text-muted-foreground">
                      {member.bio}
                    </p>
                    <div className="mt-4 flex justify-end gap-2 border-t border-cream pt-3">
                      {can.edit && (
                        <button
                          type="button"
                          onClick={() => setEditing(member)}
                          aria-label={`Edit ${member.name}`}
                          className="rounded-full bg-cream p-2.5 hover:bg-primary hover:text-primary-foreground"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      )}
                      {can.delete && (
                        <button
                          type="button"
                          onClick={() => setPendingDelete(member)}
                          aria-label={`Delete ${member.name}`}
                          className="rounded-full bg-cream p-2.5 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </Panel>
              ))}
          </div>
        )}
      </section>
      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent className="rounded-[1.25rem]">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove team member?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? `${pendingDelete.name} will be removed from the About page and homepage.`
                : "This team member will be removed from public profiles."}
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
              Remove member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {editing && (
        <TeamMemberEditor
          key={editing.id ?? "new-team-member"}
          member={editing}
          busy={busy}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
    </div>
  );
}
