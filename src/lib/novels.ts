import type { Role, NovelStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export interface NovelListItem {
  id: string;
  title: string;
  synopsis: string | null;
  coverImage: string | null;
  status: NovelStatus;
  totalChapters: number;
  updatedAt: Date;
  authorId: string;
  author: { name: string | null } | null;
  publishedChapters: number;
}

const PUBLIC_STATUSES = ["ONGOING", "COMPLETED"] as NovelStatus[];

export async function listNovelsForUser(
  user: { id: string; role: Role } | null,
  page = 1,
  pageSize = 20,
) {
  const skip = (page - 1) * pageSize;

  let where: Prisma.NovelWhereInput = {};

  if (user?.role === "ADMIN") {
    where = {};
  } else if (user?.role === "AUTHOR") {
    where = {
      OR: [
        { status: { in: PUBLIC_STATUSES } },
        { authorId: user.id },
      ],
    };
  } else {
    where = { status: { in: PUBLIC_STATUSES } };
  }

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
        authorId: true,
        author: { select: { name: true } },
        _count: {
          select: { chapters: { where: { status: "PUBLISHED" } } },
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
    authorId: n.authorId,
    author: n.author,
    publishedChapters: n._count.chapters,
  }));

  return { items: mapped, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}
