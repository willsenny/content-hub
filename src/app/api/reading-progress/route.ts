import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { fail, getSessionUser, ok } from "@/lib/api";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return fail("未登录", 401);

  const items = await prisma.readingProgress.findMany({
    where: { userId: user.id },
    select: {
      novelId: true,
      chapterId: true,
      position: true,
      updatedAt: true,
      novel: { select: { title: true } },
    },
  });

  return ok(items);
}

export async function PUT(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return fail("未登录", 401);

  const body = await req.json().catch(() => null);
  const novelId = typeof body?.novelId === "string" ? body.novelId : "";
  const chapterId =
    typeof body?.chapterId === "string" ? body.chapterId : null;
  const position = Number(body?.position) || 0;

  if (!novelId) return fail("novelId 不能为空", 400);

  const novel = await prisma.novel.findUnique({
    where: { id: novelId },
    select: { id: true },
  });
  if (!novel) return fail("小说不存在", 404);

  if (chapterId) {
    const chapter = await prisma.novelChapter.findUnique({
      where: { id: chapterId },
      select: { id: true, novelId: true },
    });
    if (!chapter || chapter.novelId !== novelId) {
      return fail("章节不存在", 400);
    }
  }

  const progress = await prisma.readingProgress.upsert({
    where: { userId_novelId: { userId: user.id, novelId } },
    create: {
      userId: user.id,
      novelId,
      chapterId,
      position,
    },
    update: {
      chapterId,
      position,
    },
  });

  return ok(progress);
}
