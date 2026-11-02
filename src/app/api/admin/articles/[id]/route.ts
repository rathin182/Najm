
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/admin-guard";
import {
  estimateReadMinutes,
  sanitizeArticleHtml,
  toArticleDTO,
} from "@/lib/articles";
import { articleSchema } from "@/lib/article-validation";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET: Fetch one article for editing
export async function GET(
  _request: Request,
  { params }: RouteContext
) {
  const { error } = await guard(["ADMIN"]);
  if (error) return error;

  const { id } = await params;

  try {
    const article = await prisma.article.findUnique({
      where: { id },
    });

    if (!article) {
      return NextResponse.json(
        { error: "Article not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      article: toArticleDTO(article),
    });
  } catch (cause) {
    console.error("Admin article GET error:", cause);

    return NextResponse.json(
      { error: "Failed to fetch article." },
      { status: 500 }
    );
  }
}

// PUT: Update an existing article
export async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  const { error } = await guard(["ADMIN"]);
  if (error) return error;

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = articleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid article data.",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const existingArticle = await prisma.article.findUnique({
      where: { id },
    });

    if (!existingArticle) {
      return NextResponse.json(
        { error: "Article not found." },
        { status: 404 }
      );
    }

    const data = parsed.data;
    const content = sanitizeArticleHtml(data.content);

    if (
      data.status === "PUBLISHED" &&
      !content.replace(/<[^>]*>/g, "").trim()
    ) {
      return NextResponse.json(
        { error: "Published articles must contain content." },
        { status: 400 }
      );
    }

    const article = await prisma.article.update({
      where: { id },
      data: {
        title: data.title,
        excerpt: data.excerpt,
        category: data.category ?? null,
        customCategory: data.customCategory,
        coverImage: data.coverImage, 
        content,
        readMinutes: estimateReadMinutes(content),
        status: data.status,
        publishedAt:
          data.status === "PUBLISHED"
            ? existingArticle.publishedAt ?? new Date()
            : null,
      },
    });

    return NextResponse.json({
      article: toArticleDTO(article),
    });
  } catch (cause) {
    console.error("Admin article PUT error:", cause);

    return NextResponse.json(
      { error: "Failed to update article." },
      { status: 500 }
    );
  }
}

// DELETE: Delete an article
export async function DELETE(
  _request: Request,
  { params }: RouteContext
) {
  const { error } = await guard(["ADMIN"]);
  if (error) return error;

  const { id } = await params;

  try {
    const result = await prisma.article.deleteMany({
      where: { id },
    });

    if (!result.count) {
      return NextResponse.json(
        { error: "Article not found." },
        { status: 404 }
      );
    }

    return new Response(null, { status: 204 });
  } catch (cause) {
    console.error("Article deletion failed:", cause);

    return NextResponse.json(
      { error: "Could not delete article." },
      { status: 500 }
    );
  }
}
