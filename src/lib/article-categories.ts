
export const ARTICLE_CATEGORIES = [
  { value: "REAL_ESTATE", label: "Real Estate" },
  { value: "INVESTMENT", label: "Investment" },
  { value: "MARKET_REPORT", label: "Market Report" },
  { value: "BUYER_GUIDE", label: "Buyer Guide" },
  { value: "SELLER_GUIDE", label: "Seller Guide" },
  { value: "FINANCING", label: "Financing" },
  { value: "NEIGHBOURHOODS", label: "Neighbourhoods" },
  { value: "LIFESTYLE", label: "Lifestyle" },
  { value: "LEGAL_GUIDANCE", label: "Legal Guidance" },
] as const;

export type ArticleCategoryValue =
  (typeof ARTICLE_CATEGORIES)[number]["value"];

export function getArticleCategoryLabel(
  category: string | null,
  customCategory: string | null,
) {
  if (customCategory) return customCategory;

  return (
    ARTICLE_CATEGORIES.find((item) => item.value === category)?.label ??
    "Uncategorized"
  );
}
