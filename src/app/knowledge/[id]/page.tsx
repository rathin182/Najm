"use client";
import Link from "next/link";
import { use, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowUpRight, Check, Link2 } from "lucide-react";
import { sanitizeArticleHtml, type ArticleDTO } from "@/lib/articles";

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [article, setArticle] = useState<ArticleDTO | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const articleRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let active = true;

    fetch(`/api/articles/${encodeURIComponent(id)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((a: ArticleDTO) => {
        if (!active) return;
        setArticle(a);
        setState("ready");
        document.title = `${a.title} — Najm Estate`;
      })
      .catch(() => active && setState("missing"));

    return () => {
      active = false;
    };
  }, [id]);

  // Reading progress bar
  useEffect(() => {
    if (state !== "ready") return;

    const onScroll = () => {
      const el = articleRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      setProgress(
        total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0
      );
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [state]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — ignore */
    }
  }

  const published = formatDate(article?.publishedAt ?? null);

  return (
    <main className="px-4 pb-24 pt-32 md:px-6">
      {state === "ready" && (
        <div className="fixed inset-x-0 top-0 z-[70] h-1">
          <div
            className="h-full origin-left bg-primary"
            style={{ transform: `scaleX(${progress})` }}
          />
        </div>
      )}

      <div className="mx-auto max-w-5xl">
        <Link
          href="/knowledge"
          className="inline-flex items-center gap-2 rounded-full bg-cream px-4 py-2 text-sm transition-colors hover:bg-primary/10"
        >
          <ArrowLeft className="h-4 w-4" />
          Knowledge Hub
        </Link>

        {state === "loading" && (
          <div className="mt-10 animate-pulse">
            <div className="mx-auto max-w-3xl space-y-4">
              <div className="h-7 w-40 rounded-full bg-cream" />
              <div className="h-14 w-full rounded-2xl bg-cream" />
              <div className="h-14 w-2/3 rounded-2xl bg-cream" />
            </div>
            <div className="mt-10 aspect-[16/9] rounded-[2.5rem] bg-cream" />
          </div>
        )}

        {state === "missing" && (
          <div className="mt-10 rounded-[2.5rem] bg-cream p-10 md:p-14">
            <h1 className="display-md">Article not found</h1>
            <p className="mt-4 max-w-md text-muted-foreground">
              It may have been unpublished or moved.
            </p>
            <Link
              href="/knowledge"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-primary-foreground"
            >
              Browse all articles
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {state === "ready" && article && (
          <article ref={articleRef} className="mt-10">
            {/* Header */}
            <header className="mx-auto max-w-3xl">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
                <span className="rounded-full bg-primary/10 px-3.5 py-1.5 font-medium text-primary">
                  {article.categoryLabel}
                </span>
                <span>{article.readMinutes} min read</span>
                {published && (
                  <>
                    <span aria-hidden>·</span>
                    <time dateTime={article.publishedAt ?? undefined}>
                      {published}
                    </time>
                  </>
                )}
              </div>

              <h1 className="display-lg mt-6">{article.title}</h1>

              {article.excerpt && (
                <p className="mt-6 text-xl leading-relaxed text-muted-foreground md:text-2xl">
                  {article.excerpt}
                </p>
              )}
            </header>

            {/* Cover */}
            {article.coverImage && (
              <div className="mt-12 overflow-hidden rounded-[2.5rem] bg-cream">
                <img
                  src={article.coverImage}
                  alt={article.title}
                  className="aspect-[16/9] w-full object-cover"
                />
              </div>
            )}

            {/* Body — sanitized on save (admin API) and again here */}
            <div
              className="article-body article-prose mx-auto mt-12 max-w-3xl"
              dangerouslySetInnerHTML={{
                __html: sanitizeArticleHtml(article.content),
              }}
            />

            {/* Footer */}
            <footer className="mx-auto mt-16 max-w-3xl border-t pt-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                  {published ? `Published ${published}` : "Najm Estate"}
                </p>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={copyLink}
                    className="inline-flex items-center gap-2 rounded-full bg-cream px-4 py-2 text-sm transition-colors hover:bg-primary/10"
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Link2 className="h-4 w-4" />
                    )}
                    {copied ? "Link copied" : "Copy link"}
                  </button>

                  <Link
                    href="/knowledge"
                    className="inline-flex items-center gap-2 rounded-full bg-cream px-4 py-2 text-sm transition-colors hover:bg-primary/10"
                  >
                    All articles
                  </Link>
                </div>
              </div>
            </footer>

            {/* Call to action */}
            <section className="mt-14 rounded-[2.5rem] bg-ink p-8 text-ink-foreground md:p-12">
              <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
                <div className="max-w-xl">
                  <h2 className="display-md">
                    Thinking about property in Saudi Arabia?
                  </h2>
                  <p className="mt-3 text-lg opacity-70">
                    Talk to our team about the right opportunity for you.
                  </p>
                </div>

                <Link
                  href="/contact"
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-background px-7 py-4 text-foreground transition-transform hover:scale-[1.03]"
                >
                  Get in touch
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </section>
          </article>
        )}
      </div>
    </main>
  );
}

export default ArticlePage;