"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { useReveal } from "@/components/site/motion";

type Article = {
  id: string;
  title: string;
  excerpt: string | null;
  categoryLabel: string;
  coverImage: string | null;
  readMinutes: number;
  publishedAt: string | null;
};

const FALLBACK_IMG = "/images/p1.jpg";

function Knowledge() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [cat, setCat] = useState("All");

  useEffect(() => {
    let active = true;

    async function fetchArticles() {
      try {
        const response = await fetch("/api/articles", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch articles.");
        }

        const rows: Article[] = await response.json();

        if (active) {
          setArticles(Array.isArray(rows) ? rows : []);
        }
      } catch (error) {
        console.error("Knowledge Hub fetch failed:", error);

        if (active) {
          setError(true);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchArticles();

    return () => {
      active = false;
    };
  }, []);

  const cats = [
    "All",
    ...Array.from(new Set(articles.map((article) => article.categoryLabel))),
  ];

  const filteredArticles = articles.filter(
    (article) => cat === "All" || article.categoryLabel === cat
  );

  // Only feature the first article when there are enough others to fill
  // the grid below it; with fewer, every article uses the same card size.
  const showLead = filteredArticles.length >= 4;
  const lead = showLead ? filteredArticles[0] : undefined;
  const rest = showLead ? filteredArticles.slice(1) : filteredArticles;

  const gridCols =
    rest.length === 1
      ? "max-w-md"
      : rest.length === 2
        ? "sm:grid-cols-2"
        : "sm:grid-cols-2 lg:grid-cols-3";

  useReveal([cat, articles]);

  return (
    <main className="px-4 pb-24 pt-32 md:px-6">
      <div className="mx-auto max-w-[1400px]">
        <h1 className="display-xl" data-reveal>
          <span className="fancy">Knowledge</span> Hub
        </h1>

        <p className="mt-6 max-w-2xl text-xl text-muted-foreground">
          Clear, practical insight on buying, investing and living in Saudi Arabia.
        </p>

        {!loading && articles.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-2">
            {cats.map((category) => (
              <button
                key={category}
                onClick={() => setCat(category)}
                className={`rounded-full px-5 py-2.5 transition-colors ${cat === category
                    ? "bg-primary text-primary-foreground"
                    : "bg-cream hover:bg-primary/10"
                  }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <p className="mt-12 text-muted-foreground">
            Loading articles...
          </p>
        )}

        {!loading && error && (
          <p className="mt-12 text-muted-foreground">
            Articles are temporarily unavailable. Please try again later.
          </p>
        )}

        {!loading && !error && articles.length === 0 && (
          <div className="mt-12 rounded-[2rem] bg-cream p-10">
            <h2 className="text-2xl font-medium">
              No articles published yet
            </h2>
            <p className="mt-3 text-muted-foreground">
              Our latest insights and guides will appear here once published.
            </p>
          </div>
        )}

        {!loading && !error && lead && (
          <Link
            href={`/knowledge/${lead.id}`}
            className="group mt-12 grid gap-8 rounded-[2.5rem] bg-cream p-3 md:grid-cols-2"
            data-reveal
          >
            <div className="aspect-[4/3] overflow-hidden rounded-[2rem]">
              <img
                src={lead.coverImage || FALLBACK_IMG}
                alt={lead.title}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>

            <div className="flex flex-col justify-center p-6">
              <p className="text-muted-foreground">
                {lead.categoryLabel} · {lead.readMinutes} min read
              </p>

              <h2 className="display-md mt-4">{lead.title}</h2>

              <p className="mt-4 text-lg text-muted-foreground">
                {lead.excerpt}
              </p>

              <span className="mt-8 flex items-center gap-2 text-lg text-primary">
                Read article
                <ArrowUpRight className="h-5 w-5" />
              </span>
            </div>
          </Link>
        )}

        {!loading && !error && filteredArticles.length > 0 && (
          <div className="mt-12 grid gap-8">
            {filteredArticles.map((article) => (
              <Link
                key={article.id}
                href={`/knowledge/${article.id}`}
                className="group grid gap-8 rounded-[2.5rem] bg-cream p-3 md:grid-cols-2"
                data-reveal
              >
                <div className="mx-auto w-full max-w-xs aspect-[4/3] overflow-hidden rounded-[2rem]">
                  <img
                    src={article.coverImage || FALLBACK_IMG}
                    alt={article.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>

                <div className="flex flex-col justify-center p-6">
                  <p className="text-muted-foreground">
                    {article.categoryLabel} · {article.readMinutes} min read
                  </p>

                  <h2 className="display-md mt-4">{article.title}</h2>

                  <p className="mt-4 text-lg text-muted-foreground">
                    {article.excerpt}
                  </p>

                  <span className="mt-8 flex items-center gap-2 text-lg text-primary">
                    Read article
                    <ArrowUpRight className="h-5 w-5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default Knowledge;