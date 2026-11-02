import { prisma } from "@/lib/prisma";
import { toArticleListDTO } from "@/lib/articles";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const articles = await prisma.article.findMany({
      where: {
        status: "PUBLISHED",
      },
      orderBy: {
        publishedAt: "desc",
      },
    });

    return Response.json(
      articles.map(toArticleListDTO),
      {
        headers: {
          "Cache-Control": "public, max-age=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (error) {
    console.error("Knowledge Hub fetch failed:", error);

    return Response.json(
      { error: "Articles are temporarily unavailable." },
      { status: 503 }
    );
  }
}