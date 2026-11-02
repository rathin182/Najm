import { prisma } from "@/lib/prisma";
import { toArticleDTO } from "@/lib/articles";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const article = await prisma.article.findFirst({
      where: {
        id,
        status: "PUBLISHED",
      },
    });

    if (!article) {
      return Response.json(
        { error: "Article not found." },
        { status: 404 },
      );
    }

    return Response.json(toArticleDTO(article), {
      headers: {
        "Cache-Control": "public, max-age=30, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("Article fetch failed:", error);

    return Response.json(
      { error: "Could not load article." },
      { status: 500 },
    );
  }
}