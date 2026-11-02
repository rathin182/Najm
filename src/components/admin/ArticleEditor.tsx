
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink, ImagePlus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel } from "@/components/admin/AdminShell";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { ARTICLE_CATEGORIES, type ArticleDTO } from "@/lib/articles";

type Form = {
  title: string;
  excerpt: string;
  category: string;
  customCategory: string;
  coverImage: string;
  content: string;
  status: "DRAFT" | "PUBLISHED";
};

const EMPTY: Form = {
  title: "",
  excerpt: "",
  category: "REAL_ESTATE",
  customCategory: "",
  coverImage: "",
  content: "",
  status: "DRAFT",
};

const CATEGORY_LABELS: Record<string, string> = {
  REAL_ESTATE: "Real Estate",
  INVESTMENT: "Investment",
  MARKET_REPORT: "Market Report",
  BUYER_GUIDE: "Buyer Guide",
  SELLER_GUIDE: "Seller Guide",
  FINANCING: "Financing",
  NEIGHBOURHOODS: "Neighbourhoods",
  LIFESTYLE: "Lifestyle",
  LEGAL_GUIDANCE: "Legal Guidance",
};

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function ArticleEditor({ id }: { id?: string }) {
  const router = useRouter();

  const [form, setForm] = useState<Form>(EMPTY);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    if (!id) return;

    fetch(`/api/admin/articles/${id}`, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Could not load article.");
        }
        return response.json();
      })
      .then((article: ArticleDTO) => {
        setForm({
          title: article.title,
          excerpt: article.excerpt ?? "",
          category: article.category ?? "",
          customCategory: article.customCategory ?? "",
          coverImage: article.coverImage ?? "",
          content: article.content ?? "",
          status: article.status,
        });
      })
      .catch((error) => {
        toast.error(
          error instanceof Error ? error.message : "Could not load article."
        );
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function save(status: Form["status"]) {
    if (!form.title.trim()) {
      toast.error("Add a title first.");
      return;
    }

    if (!form.category && !form.customCategory.trim()) {
      toast.error("Select or enter a category.");
      return;
    }

    if (form.category && form.customCategory.trim()) {
      toast.error("Choose either a predefined or custom category.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        id ? `/api/admin/articles/${id}` : "/api/admin/articles",
        {
          method: id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: form.title,
            excerpt: form.excerpt || null,
            category: form.category || null,
            customCategory: form.customCategory || null,
            coverImage: form.coverImage || null,
            content: form.content,
            status,
          }),
        }
      );

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(body?.error ?? "Could not save article.");
      }

      toast.success(
        status === "PUBLISHED"
          ? "Published to the Knowledge Hub"
          : "Saved as draft"
      );

      if (!id) {
        const articleId = body?.article?.id ?? body?.id;

        if (articleId) {
          router.replace(`/admin/blog/${articleId}`);
        } else {
          router.replace("/admin/blog");
        }
      } else {
        setForm((current) => ({ ...current, status }));
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save."
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!id || !window.confirm("Delete this article permanently?")) return;

    const response = await fetch(`/api/admin/articles/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      toast.error("Could not delete.");
      return;
    }

    toast.success("Article deleted");
    router.replace("/admin/blog");
  }

  async function uploadCover(file: File) {
    setUploading(true);

    try {
      const formData = new FormData();
      formData.set("file", file);

      const response = await fetch("/api/admin/uploads", {
        method: "POST",
        body: formData,
      });

      const body = await response.json();

      if (!response.ok || body.kind !== "image") {
        throw new Error(body.error ?? "Upload failed.");
      }

      set("coverImage", body.url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <div className="h-96 animate-pulse rounded-[1.75rem] bg-background" />
    );
  }

  const live = form.status === "PUBLISHED";

  return (
    <div>
      <PageHeader
        title={id ? "Edit article" : "New article"}
        sub={live ? "Live on the Knowledge Hub." : "Draft — not visible on the site."}
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/blog"
              className="flex items-center gap-2 rounded-full bg-background px-5 py-3"
            >
              <ArrowLeft className="h-4 w-4" />
              All articles
            </Link>

            {live && id && (
              <a
                href={`/knowledge/${id}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-full bg-background px-5 py-3"
              >
                <ExternalLink className="h-4 w-4" />
                View
              </a>
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Panel className="grid content-start gap-5">
          <Field label="Title">
            <input
              className="field !text-xl"
              value={form.title}
              onChange={(event) => set("title", event.target.value)}
              placeholder="How foreigners can buy property in Saudi Arabia"
              maxLength={200}
            />
          </Field>

          <Field label="Content">
            <RichTextEditor
              value={form.content}
              onChange={(html) => set("content", html)}
            />
          </Field>
        </Panel>

        <div className="grid content-start gap-6">
          <Panel className="grid gap-3">
            <h2 className="text-xl font-medium">Publish</h2>

            <button
              type="button"
              disabled={saving}
              onClick={() => save("PUBLISHED")}
              className="flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-primary-foreground disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving…" : live ? "Update article" : "Publish"}
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => save("DRAFT")}
              className="rounded-full bg-cream px-6 py-3.5 disabled:opacity-60"
            >
              {live ? "Unpublish (save as draft)" : "Save draft"}
            </button>

            {id && (
              <button
                type="button"
                onClick={remove}
                className="flex items-center justify-center gap-2 rounded-full px-6 py-3 text-destructive hover:bg-cream"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            )}
          </Panel>

          <Panel className="grid gap-4">
            <h2 className="text-xl font-medium">Details</h2>

            <Field label="Predefined category">
              <select
                className="field"
                value={form.category}
                onChange={(event) => {
                  set("category", event.target.value);
                  set("customCategory", "");
                }}
              >
                <option value="">Choose a category</option>
                {ARTICLE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {CATEGORY_LABELS[category] ?? category}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Or enter a custom category">
              <input
                className="field"
                value={form.customCategory}
                onChange={(event) => {
                  set("customCategory", event.target.value);
                  set("category", "");
                }}
                placeholder="e.g. Property Technology"
                maxLength={80}
              />
            </Field>

            <Field
              label="Summary"
              hint={`${form.excerpt.length}/500 — shown on the Knowledge Hub card.`}
            >
              <textarea
                className="field min-h-24"
                maxLength={500}
                value={form.excerpt}
                onChange={(event) => set("excerpt", event.target.value)}
              />
            </Field>
          </Panel>

          <Panel className="grid gap-3">
            <h2 className="text-xl font-medium">Cover image</h2>

            {form.coverImage ? (
              <img
                src={form.coverImage}
                alt=""
                className="aspect-[4/3] w-full rounded-2xl object-cover"
              />
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-cream text-sm text-muted-foreground">
                No cover image
              </div>
            )}

            <div className="flex gap-2">
              <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-cream px-4 py-3 text-sm">
                <ImagePlus className="h-4 w-4" />
                {uploading ? "Uploading…" : "Upload"}

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  hidden
                  disabled={uploading}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadCover(file);
                    event.target.value = "";
                  }}
                />
              </label>

              {form.coverImage && (
                <button
                  type="button"
                  onClick={() => set("coverImage", "")}
                  className="rounded-full px-4 py-3 text-sm text-destructive hover:bg-cream"
                >
                  Remove
                </button>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
