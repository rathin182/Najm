
"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel } from "@/components/admin/AdminShell";
import type { ArticleListDTO } from "@/lib/articles";

const PAGE_SIZE = 10;

function BlogAdmin() {
  const [items, setItems] = useState<ArticleListDTO[] | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [failed, setFailed] = useState(false);

  const loadingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadPage = useCallback(async (cursor: string | null) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoadingMore(true);
    setFailed(false);

    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
      if (cursor) params.set("cursor", cursor);

      const response = await fetch(`/api/admin/articles?${params}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Could not load articles.");
      }

      const data = await response.json();

      if (!Array.isArray(data.articles)) {
        throw new Error("Invalid articles API response.");
      }

      setItems((prev) => {
        const existing = prev ?? [];
        const seen = new Set(existing.map((a) => a.id));
        return [
          ...existing,
          ...(data.articles as ArticleListDTO[]).filter(
            (a) => !seen.has(a.id)
          ),
        ];
      });
      setNextCursor(data.nextCursor ?? null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load articles.");
      setFailed(true);
      setItems((prev) => prev ?? []);
    } finally {
      loadingRef.current = false;
      setLoadingMore(false);
    }
  }, []);

  // First page
  useEffect(() => {
    void loadPage(null);
  }, [loadPage]);

  // Load the next page when the sentinel scrolls near the viewport
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !nextCursor || failed) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadPage(nextCursor);
      },
      { rootMargin: "300px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
    // `items` is a dependency so the observer is recreated after each page;
    // if the sentinel is still visible (short page), it fires again.
  }, [nextCursor, failed, items, loadPage]);

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
          {failed ? (
            <button
              type="button"
              onClick={() => void loadPage(null)}
              className="rounded-full bg-cream px-5 py-2.5"
            >
              Couldn&apos;t load articles — retry
            </button>
          ) : (
            <p className="text-muted-foreground">
              No articles yet. Create your first one.
            </p>
          )}
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

          {/* Infinite-scroll sentinel */}
          <div ref={sentinelRef} className="py-4 text-center text-sm text-muted-foreground">
            {loadingMore ? (
              <div className="h-20 animate-pulse rounded-[1.75rem] bg-background" />
            ) : failed ? (
              <button
                type="button"
                onClick={() => nextCursor && void loadPage(nextCursor)}
                className="rounded-full bg-cream px-5 py-2.5 text-foreground"
              >
                Couldn&apos;t load more — retry
              </button>
            ) : nextCursor ? null : items.length > PAGE_SIZE ? (
              "You've reached the end"
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

export default BlogAdmin;
