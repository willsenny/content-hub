import type { NovelStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export interface NovelListItem {
  id: string;
  title: string;
  synopsis: string | null;
  coverImage: string | null;
  status: NovelStatus;
  totalChapters: number;
  updatedAt: Date;
  author: { name: string | null } | null;
  publishedChapters: number;
}

export async function listPublicNovels(page = 1, pageSize = 20) {
  const skip = (page - 1) * pageSize;
  const where = {
    status: { in: ["ONGOING", "COMPLETED"] as NovelStatus[] },
  };

  const [items, total] = await Promise.all([
    prisma.novel.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        synopsis: true,
        coverImage: true,
        status: true,
        totalChapters: true,
        updatedAt: true,
        author: { select: { name: true } },
        chapters: {
          where: { status: "PUBLISHED" },
          select: { id: true },
        },
      },
    }),
    prisma.novel.count({ where }),
  ]);

  const mapped: NovelListItem[] = items.map((n) => ({
    id: n.id,
    title: n.title,
    synopsis: n.synopsis,
    coverImage: n.coverImage,
    status: n.status,
    totalChapters: n.totalChapters,
    updatedAt: n.updatedAt,
    author: n.author,
    publishedChapters: n.chapters.length,
  }));

  return { items: mapped, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}
