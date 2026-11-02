
import { z } from "zod";
import { ARTICLE_CATEGORIES } from "@/lib/articles";

const optionalTrimmedString = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .nullable()
    .optional()
    .transform((value) => value || null);

export const articleSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "Title must be at least 3 characters long.")
      .max(200, "Title cannot exceed 200 characters."),

    excerpt: optionalTrimmedString(500),

    category: z
      .enum(ARTICLE_CATEGORIES)
      .nullable()
      .optional(),

    customCategory: optionalTrimmedString(80),

    coverImage: optionalTrimmedString(2000),

    content: z.string().optional().default(""),

    status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  })
  .superRefine((data, ctx) => {
    const hasCategory = Boolean(data.category);
    const hasCustomCategory = Boolean(data.customCategory);

    if (hasCategory === hasCustomCategory) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select a predefined category or enter a custom category, not both.",
        path: ["category"],
      });
    }

    if (
      data.status === "PUBLISHED" &&
      !data.content.replace(/<[^>]*>/g, "").trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Published articles must contain content.",
        path: ["content"],
      });
    }
  });

export type ArticleInput = z.infer<typeof articleSchema>;
