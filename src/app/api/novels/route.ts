import { NextRequest } from "next/server";
import { NovelStatus, Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { fail, getSessionUser, isAdmin, ok, parsePagination } from "@/lib/api";

const STATUSES: NovelStatus[] = [
  NovelStatus.DRAFT,
  NovelStatus.ONGOING,
  NovelStatus.COMPLETED,
];

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const user = await getSessionUser();
  const { page, pageSize, skip } = parsePagination(searchParams);

  const mine = searchParams.get("mine") === "1";
  const statusParam = searchParams.get("status");
  const status = STATUSES.includes(statusParam as NovelStatus)
    ? (statusParam as NovelStatus)
    : undefined;

  const where = {
    ...(mine && user ? { authorId: user.id } : {}),
    ...(!mine ? { status: { in: [NovelStatus.ONGOING, NovelStatus.COMPLETED] } } : {}),
    ...(status && mine ? { status } : {}),
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

  return ok({ items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return fail("未登录", 401);
  if (user.role !== Role.AUTHOR && user.role !== Role.ADMIN) {
    return fail("权限不足", 403);
  }

  const body = await req.json().catch(() => null);
  const title =
    typeof body?.title === "string" ? body.title.trim() : "";

  if (!title) return fail("标题不能为空", 400);
  if (title.length > 200) return fail("标题过长", 400);

  const synopsis =
    typeof body?.synopsis === "string" ? body.synopsis.trim().slice(0, 2000) : null;
  const coverImage =
    typeof body?.coverImage === "string" ? body.coverImage.trim().slice(0, 1000) : null;
  const status = STATUSES.includes(body?.status)
    ? (body.status as NovelStatus)
    : NovelStatus.DRAFT;

  const novel = await prisma.novel.create({
    data: {
      title,
      synopsis: synopsis || null,
      coverImage: coverImage || null,
      status,
      authorId: user.id,
    },
  });

  return ok(novel);
}
