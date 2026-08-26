import { NextRequest } from "next/server";
import { ChapterStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { fail, getSessionUser, isAdmin, ok } from "@/lib/api";

interface Params {
  params: { id: string; chapterId: string };
}

function countWords(content: string): number {
  const zh = (content.match(/[\u4e00-\u9fa5]/g) || []).length;
  const en = (content.match(/[A-Za-z0-9]+/g) || []).length;
  return zh + en;
}

async function getChapter(
  ids: { novelId: string; chapterId: string },
  includePrivate: boolean,
) {
  const where: { novelId: string; id: string; status?: "PUBLISHED" } = {
    novelId: ids.novelId,
    id: ids.chapterId,
  };
  if (!includePrivate) where.status = "PUBLISHED";

  const chapter = await prisma.novelChapter.findFirst({
    where,
    select: {
      id: true,
      novelId: true,
      chapterNumber: true,
      title: true,
      content: true,
      wordCount: true,
      status: true,
      updatedAt: true,
      novel: { select: { title: true, authorId: true } },
    },
  });
  return chapter;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getSessionUser();
  const novel = await prisma.novel.findUnique({
    where: { id: params.id },
    select: { authorId: true },
  });
  const canEdit = isAdmin(user) || (user && novel?.authorId === user.id);

  const chapter = await getChapter(
    { novelId: params.id, chapterId: params.chapterId },
    !!canEdit,
  );
  if (!chapter) return fail("章节不存在", 404);
  return ok(chapter);
}

export async function PATCH(req: NextRequest, { params }: Params) {
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

  const existing = await prisma.novelChapter.findUnique({
    where: { id: params.chapterId },
  });
  if (!existing || existing.novelId !== novel.id) {
    return fail("章节不存在", 404);
  }

  const body = await req.json().catch(() => null);
  const data: {
    title?: string;
    content?: string;
    wordCount?: number;
    status?: ChapterStatus;
  } = {};

  if (typeof body?.title === "string") {
    const title = body.title.trim();
    if (!title) return fail("章节标题不能为空", 400);
    if (title.length > 200) return fail("章节标题过长", 400);
    data.title = title;
  }
  if (typeof body?.content === "string") {
    if (!body.content.trim()) return fail("章节内容不能为空", 400);
    data.content = body.content;
    data.wordCount = countWords(body.content);
  }
  if (
    body?.status === ChapterStatus.PUBLISHED ||
    body?.status === ChapterStatus.DRAFT
  ) {
    data.status = body.status as ChapterStatus;
  }

  const chapter = await prisma.novelChapter.update({
    where: { id: existing.id },
    data,
  });

  return ok(chapter);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
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

  const existing = await prisma.novelChapter.findUnique({
    where: { id: params.chapterId },
  });
  if (!existing || existing.novelId !== novel.id) {
    return fail("章节不存在", 404);
  }

  await prisma.novelChapter.delete({ where: { id: existing.id } });
  await prisma.novel.update({
    where: { id: novel.id },
    data: { totalChapters: { decrement: 1 } },
  });

  return ok({ id: existing.id });
}
