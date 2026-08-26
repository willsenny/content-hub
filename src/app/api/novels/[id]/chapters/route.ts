import { NextRequest } from "next/server";
import { ChapterStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { fail, getSessionUser, isAdmin, ok } from "@/lib/api";

interface Params {
  params: { id: string };
}

function countWords(content: string): number {
  const zh = (content.match(/[\u4e00-\u9fa5]/g) || []).length;
  const en = (content.match(/[A-Za-z0-9]+/g) || []).length;
  return zh + en;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getSessionUser();

  const novel = await prisma.novel.findUnique({
    where: { id: params.id },
    select: { id: true, authorId: true },
  });
  if (!novel) return fail("小说不存在", 404);

  const canEdit =
    isAdmin(user) || (user && novel.authorId === user.id);

  const chapters = await prisma.novelChapter.findMany({
    where: {
      novelId: novel.id,
      ...(!canEdit ? { status: "PUBLISHED" } : {}),
    },
    orderBy: { chapterNumber: "asc" },
    select: {
      id: true,
      chapterNumber: true,
      title: true,
      wordCount: true,
      status: true,
    },
  });

  return ok(chapters);
}

export async function POST(req: NextRequest, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return fail("未登录", 401);

  const novel = await prisma.novel.findUnique({
    where: { id: params.id },
    select: { id: true, authorId: true },
  });
  if (!novel) return fail("小说不存在", 404);
  if (!isAdmin(user) && novel.authorId !== user.id) {
    return fail("权限不足", 403);
  }

  const body = await req.json().catch(() => null);
  const chapterNumber = Number(body?.chapterNumber);
  const title =
    typeof body?.title === "string" ? body.title.trim() : "";
  const content =
    typeof body?.content === "string" ? body.content : "";

  if (!Number.isInteger(chapterNumber) || chapterNumber < 1) {
    return fail("章节号不合法", 400);
  }
  if (!title) return fail("章节标题不能为空", 400);
  if (title.length > 200) return fail("章节标题过长", 400);
  if (!content.trim()) return fail("章节内容不能为空", 400);

  const status =
    body?.status === ChapterStatus.PUBLISHED
      ? ChapterStatus.PUBLISHED
      : ChapterStatus.DRAFT;

  try {
    const chapter = await prisma.novelChapter.create({
      data: {
        novelId: novel.id,
        chapterNumber,
        title,
        content,
        wordCount: countWords(content),
        status,
      },
    });

    await prisma.novel.update({
      where: { id: novel.id },
      data: { totalChapters: { increment: 1 } },
    });

    return ok(chapter);
  } catch {
    return fail("章节号已存在", 409);
  }
}
