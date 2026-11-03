"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel } from "@/components/admin/AdminShell";
import { fmtDate } from "@/lib/admin-store";

type Subscriber = { id: string; email: string; createdAt: string };

const PAGE_SIZE = 25;

function Subscribers() {
  const [q, setQ] = useState("");
  const [query, setQuery] = useState(""); // debounced search term
  const [items, setItems] = useState<Subscriber[] | null>(null);
  const [total, setTotal] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [failed, setFailed] = useState(false);

  const loadingRef = useRef(false);
  const generation = useRef(0); // bumped on every new search to drop stale responses
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Debounce the search box
  useEffect(() => {
    const t = setTimeout(() => setQuery(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const loadPage = useCallback(async (cursor: string | null, search: string) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    const gen = generation.current;
    setLoadingMore(true);
    setFailed(false);

    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
      if (cursor) params.set("cursor", cursor);
      if (search) params.set("q", search);

      const res = await fetch(`/api/admin/subscribers?${params}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Could not load subscribers.");

      const data = await res.json();
      if (!Array.isArray(data.subscribers)) throw new Error("Invalid subscribers response.");
      if (gen !== generation.current) return;

      setItems((prev) => {
        const existing = prev ?? [];
        const seen = new Set(existing.map((s) => s.id));
        return [...existing, ...(data.subscribers as Subscriber[]).filter((s) => !seen.has(s.id))];
      });
      setTotal(typeof data.total === "number" ? data.total : 0);
      setNextCursor(data.nextCursor ?? null);
    } catch (e) {
      if (gen !== generation.current) return;
      toast.error(e instanceof Error ? e.message : "Could not load subscribers.");
      setFailed(true);
      setItems((prev) => prev ?? []);
    } finally {
      if (gen === generation.current) {
        loadingRef.current = false;
        setLoadingMore(false);
      }
    }
  }, []);

  // First page — and again whenever the search term changes
  useEffect(() => {
    generation.current += 1;
    loadingRef.current = false;
    setItems(null);
    setNextCursor(null);
    setFailed(false);
    void loadPage(null, query);
  }, [query, loadPage]);

  // Load the next page when the sentinel nears the viewport
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !nextCursor || failed) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadPage(nextCursor, query);
      },
      { rootMargin: "300px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [nextCursor, failed, items, query, loadPage]);

  async function remove(s: Subscriber) {
    if (!window.confirm(`Remove ${s.email} from subscribers?`)) return;

    const res = await fetch(`/api/admin/subscribers/${s.id}`, { method: "DELETE" });

    if (!res.ok && res.status !== 404) {
      toast.error("Could not remove subscriber.");
      return;
    }

    setItems((prev) => (prev ?? []).filter((x) => x.id !== s.id));
    setTotal((t) => Math.max(0, t - 1));
    toast.success("Subscriber removed");
  }

  const exportCsv = () => {
    window.location.href = `/api/admin/subscribers/export${query ? `?q=${encodeURIComponent(query)}` : ""}`;
  };

  return (
    <div>
      <PageHeader
        title="Subscribers"
        sub={
          items === null
            ? "People who signed up for private listings on the website."
            : `${total.toLocaleString()} ${total === 1 ? "subscriber" : "subscribers"}${query ? " matching your search" : ""}`
        }
        action={
          <button
            type="button"
            onClick={exportCsv}
            className="flex items-center gap-2 rounded-full bg-background px-5 py-3"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        }
      />

      <div className="relative mb-4 max-w-md">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          className="field !bg-background !pl-11"
          placeholder="Search by email"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search subscribers by email"
        />
      </div>

      {items === null ? (
        <div className="h-40 animate-pulse rounded-[1.75rem] bg-background" />
      ) : items.length === 0 ? (
        <Panel>
          {failed ? (
            <button
              type="button"
              onClick={() => { generation.current += 1; loadingRef.current = false; void loadPage(null, query); }}
              className="rounded-full bg-cream px-5 py-2.5"
            >
              Couldn&apos;t load subscribers — retry
            </button>
          ) : (
            <p className="text-muted-foreground">
              {query
                ? "No subscribers match your search."
                : "No subscribers yet. Sign-ups from the website appear here."}
            </p>
          )}
        </Panel>
      ) : (
        <Panel className="!p-2 md:!p-3">
          <ul className="divide-y">
            {items.map((s) => (
              <li key={s.id} className="flex items-center gap-4 px-3 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{s.email}</p>
                </div>
                <p className="shrink-0 text-sm text-muted-foreground">{fmtDate(s.createdAt)}</p>
                <button
                  type="button"
                  onClick={() => remove(s)}
                  aria-label={`Remove ${s.email}`}
                  className="shrink-0 rounded-full p-2.5 text-muted-foreground transition-colors hover:bg-cream hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>

          {/* Infinite-scroll sentinel */}
          <div ref={sentinelRef} className="px-3 py-3 text-center text-sm text-muted-foreground">
            {loadingMore ? (
              <div className="h-12 animate-pulse rounded-2xl bg-cream" />
            ) : failed ? (
              <button
                type="button"
                onClick={() => nextCursor && void loadPage(nextCursor, query)}
                className="rounded-full bg-cream px-5 py-2.5 text-foreground"
              >
                Couldn&apos;t load more — retry
              </button>
            ) : !nextCursor && items.length > PAGE_SIZE ? (
              "You've reached the end"
            ) : null}
          </div>
        </Panel>
      )}
    </div>
  );
}

export default Subscribers;