import { NextRequest } from "next/server";
import { NovelStatus, Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { fail, getSessionUser, isAdmin, ok } from "@/lib/api";

const STATUSES: NovelStatus[] = [
  NovelStatus.DRAFT,
  NovelStatus.ONGOING,
  NovelStatus.COMPLETED,
];

interface Params {
  params: { id: string };
}

export async function GET(_req: NextRequest, { params }: Params) {
  const user = await getSessionUser();

  const novel = await prisma.novel.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      title: true,
      synopsis: true,
      coverImage: true,
      status: true,
      totalChapters: true,
      createdAt: true,
      updatedAt: true,
      authorId: true,
      author: { select: { name: true } },
    },
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
      updatedAt: true,
    },
  });

  return ok({ ...novel, chapters });
}

async function assertOwner(novelId: string) {
  const user = await getSessionUser();
  if (!user) return { user, novel: null, error: fail("未登录", 401) as Response };
  const novel = await prisma.novel.findUnique({ where: { id: novelId } });
  if (!novel) return { user, novel: null, error: fail("小说不存在", 404) };
  if (!isAdmin(user) && novel.authorId !== user.id) {
    return { user, novel, error: fail("权限不足", 403) };
  }
  return { user, novel, error: null as Response | null };
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { error } = await assertOwner(params.id);
  if (error) return error;

  const body = await req.json().catch(() => null);

  const data: {
    title?: string;
    synopsis?: string | null;
    coverImage?: string | null;
    status?: NovelStatus;
  } = {};

  if (typeof body?.title === "string") {
    const title = body.title.trim();
    if (!title) return fail("标题不能为空", 400);
    if (title.length > 200) return fail("标题过长", 400);
    data.title = title;
  }
  if (body?.synopsis !== undefined) {
    data.synopsis =
      typeof body.synopsis === "string"
        ? body.synopsis.trim().slice(0, 2000) || null
        : null;
  }
  if (body?.coverImage !== undefined) {
    data.coverImage =
      typeof body.coverImage === "string"
        ? body.coverImage.trim().slice(0, 1000) || null
        : null;
  }
  if (STATUSES.includes(body?.status)) {
    data.status = body.status as NovelStatus;
  }

  const novel = await prisma.novel.update({
    where: { id: params.id },
    data,
  });

  return ok(novel);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { error } = await assertOwner(params.id);
  if (error) return error;

  await prisma.novel.delete({ where: { id: params.id } });
  return ok({ id: params.id });
}
