"use client";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { sanitizeArticleHtml, type ArticleDTO } from "@/lib/articles";

function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [article, setArticle] = useState<ArticleDTO | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");

  useEffect(() => {
    fetch(`/api/articles/${encodeURIComponent(slug)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((a: ArticleDTO) => { setArticle(a); setState("ready"); document.title = `${a.title} — Najm Estate`; })
      .catch(() => setState("missing"));
  }, [slug]);

  return (
    <main className="px-4 pb-24 pt-32 md:px-6">
      <div className="mx-auto max-w-3xl">
        <Link href="/knowledge" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Knowledge Hub</Link>
        {state === "loading" && <div className="mt-10 h-96 animate-pulse rounded-[2rem] bg-cream" />}
        {state === "missing" && (
          <div className="mt-10">
            <h1 className="display-md">Article not found</h1>
            <p className="mt-4 text-muted-foreground">It may have been unpublished or moved.</p>
          </div>
        )}
        {state === "ready" && article && (
          <article className="mt-8">
            <p className="text-muted-foreground">{article.category} · {article.readMinutes} min read{article.publishedAt && <> · {new Date(article.publishedAt).toLocaleDateString("en", { year: "numeric", month: "long", day: "numeric" })}</>}</p>
            <h1 className="display-md mt-4">{article.title}</h1>
            {article.excerpt && <p className="mt-5 text-xl text-muted-foreground">{article.excerpt}</p>}
            {article.coverImage && <img src={article.coverImage} alt={article.title} className="mt-10 aspect-[16/9] w-full rounded-[2rem] object-cover" />}
            {/* Sanitized on save (admin API) and again by the public API + here. */}
            <div className="article-body mt-10" dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(article.content) }} />
          </article>
        )}
      </div>
    </main>
  );
}

export default ArticlePage;
