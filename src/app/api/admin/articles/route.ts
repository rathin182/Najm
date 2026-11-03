
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/admin-guard";
import {
  estimateReadMinutes,
  sanitizeArticleHtml,
  toArticleDTO,
  toArticleListDTO,
} from "@/lib/articles";
import { articleSchema } from "@/lib/article-validation";

export async function GET(request: NextRequest) {
  const { error } = await guard(["ADMIN"]);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      Math.max(Number(searchParams.get("limit")) || 10, 1),
      50
    );
    const cursor = searchParams.get("cursor");

    // Fetch one extra row to know whether another page exists.
    const rows = await prisma.article.findMany({
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;

    return NextResponse.json({
      articles: page.map(toArticleListDTO),
      nextCursor: hasMore ? page[page.length - 1].id : null,
    });
  } catch (error) {
    console.error("Admin articles GET error:", error);

    return NextResponse.json(
      { error: "Failed to fetch articles." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { error } = await guard(["ADMIN"]);
if (error) return error;
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

    const article = await prisma.article.create({
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
          data.status === "PUBLISHED" ? new Date() : null,
      },
    });

    return NextResponse.json(
      { article: toArticleDTO(article) },
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin articles POST error:", error);

    return NextResponse.json(
      { error: "Failed to create article." },
      { status: 500 }
    );
  }
}
