
import sanitizeHtml from "sanitize-html";

export const ARTICLE_CATEGORIES = [
  "REAL_ESTATE",
  "INVESTMENT",
  "MARKET_REPORT",
  "BUYER_GUIDE",
  "SELLER_GUIDE",
  "FINANCING",
  "NEIGHBOURHOODS",
  "LIFESTYLE",
  "LEGAL_GUIDANCE",
] as const;

export type ArticleStatus = "DRAFT" | "PUBLISHED";

export type ArticleDTO = {
  id: string;
  title: string;
  excerpt: string | null;
  category: string | null;
  customCategory: string | null;
  categoryLabel: string;
  coverImage: string | null;
  content: string;
  readMinutes: number;
  status: ArticleStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ArticleListDTO = Omit<ArticleDTO, "content">;

export type AdminArticleListDTO = ArticleListDTO;

export function getArticleCategoryLabel(
  category: string | null,
  customCategory: string | null
) {
  if (customCategory?.trim()) {
    return customCategory.trim();
  }
  const labels: Record<string, string> = {
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
  return category ? labels[category] ?? category : "General";
}

export function sanitizeArticleHtml(html: string) {
  return sanitizeHtml(html, {
    allowedTags: [
      "h2", "h3", "h4", "p", "br", "strong", "em", "u", "s",
      "a", "ul", "ol", "li", "blockquote", "hr", "img", "code", "pre",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: {
      img: ["http", "https"],
    },
    allowProtocolRelative: false,
    transformTags: {
      a: sanitizeHtml.simpleTransform(
        "a",
        { rel: "noopener noreferrer", target: "_blank" },
        true
      ),
    },
  });
}

export function plainText(html: string) {
  return sanitizeHtml(html, {
    allowedTags: [],
    allowedAttributes: {},
  })
    .replace(/\s+/g, " ")
    .trim();
}

export function estimateReadMinutes(html: string) {
  const words = plainText(html).split(" ").filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function generateArticleExcerpt(
  excerpt: string | null | undefined,
  content: string,
  maxLength = 180
) {
  const suppliedExcerpt = excerpt?.trim();

  if (suppliedExcerpt) {
    return suppliedExcerpt;
  }

  const generated = plainText(content);

  if (generated.length <= maxLength) {
    return generated;
  }

  return `${generated.slice(0, maxLength).trimEnd()}...`;
}

type ArticleRow = {
  id: string;
  title: string;
  excerpt: string | null;
  category: string | null;
  customCategory: string | null;
  coverImage: string | null;
  content: string;
  readMinutes: number;
  status: ArticleStatus;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export const toArticleDTO = (r: ArticleRow): ArticleDTO => ({
  id: r.id,
  title: r.title,
  excerpt: r.excerpt,
  category: r.category,
  customCategory: r.customCategory,
  categoryLabel: getArticleCategoryLabel(r.category, r.customCategory),
  coverImage: r.coverImage,
  content: r.content,
  readMinutes: r.readMinutes,
  status: r.status,
  publishedAt: r.publishedAt?.toISOString() ?? null,
  createdAt: r.createdAt.toISOString(),
  updatedAt: r.updatedAt.toISOString(),
});

export const toArticleListDTO = (
  article: ArticleRow
): ArticleListDTO => {
  const { content, ...rest } = toArticleDTO(article);
  return {
    ...rest,
    excerpt: generateArticleExcerpt(article.excerpt, article.content),
  };
};
