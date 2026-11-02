
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel } from "@/components/admin/AdminShell";
import type { ArticleDTO } from "@/lib/articles";

function BlogAdmin() {
  const [items, setItems] = useState<ArticleDTO[] | null>(null);

  useEffect(() => {
    fetch("/api/admin/articles", { cache: "no-store" })
      .then((r) =>
        r.ok
          ? r.json()
          : Promise.reject(new Error("Could not load articles."))
      )
      .then((data) => {
        if (!Array.isArray(data.articles)) {
          throw new Error("Invalid articles API response.");
        }

        setItems(data.articles);
      })
      .catch((e) => {
        toast.error(
          e instanceof Error ? e.message : "Could not load articles."
        );
        setItems([]);
      });
  }, []);

  return (
    <div>
      <PageHeader
        title="Blog"
        sub="Write articles here — published ones appear in the public Knowledge Hub."
        action={
          <Link
            href="/admin/blog/new"
            className="flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-primary-foreground hover:bg-ink"
          >
            <Plus className="h-4 w-4" />
            New article
          </Link>
        }
      />

      {items === null ? (
        <div className="h-40 animate-pulse rounded-[1.75rem] bg-background" />
      ) : items.length === 0 ? (
        <Panel>
          <p className="text-muted-foreground">
            No articles yet. Create your first one.
          </p>
        </Panel>
      ) : (
        <div className="grid gap-3">
          {items.map((a) => (
            <Link
              key={a.id}
              href={`/admin/blog/${a.id}`}
              className="group"
            >
              <Panel className="flex items-center gap-4 !p-3">
                {a.coverImage ? (
                  <img
                    src={a.coverImage}
                    alt=""
                    className="h-20 w-28 shrink-0 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="h-20 w-28 shrink-0 rounded-2xl bg-cream" />
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-medium">{a.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {a.categoryLabel} · {a.readMinutes} min read · updated{" "}
                    {new Date(a.updatedAt).toLocaleDateString("en")}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-sm ${
                    a.status === "PUBLISHED"
                      ? "bg-primary text-primary-foreground"
                      : "bg-cream"
                  }`}
                >
                  {a.status === "PUBLISHED" ? "Live" : "Draft"}
                </span>

                <Pencil className="mr-2 h-4 w-4 text-muted-foreground group-hover:text-foreground" />
              </Panel>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default BlogAdmin;
