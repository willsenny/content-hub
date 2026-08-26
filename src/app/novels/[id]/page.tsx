import Link from "next/link";
import { notFound } from "next/navigation";
import { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const CHAPTER_STATUS_LABEL: Record<string, string> = {
  DRAFT: "草稿",
  PUBLISHED: "已发布",
};

const CHAPTER_BADGE_CLASS: Record<string, string> = {
  DRAFT: "bg-yellow-100 text-yellow-800",
  PUBLISHED: "bg-green-100 text-green-800",
};

interface PageProps {
  params: { id: string };
}

export default async function NovelDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  const user = session?.user ?? null;

  const novel = await prisma.novel.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      title: true,
      synopsis: true,
      coverImage: true,
      status: true,
      totalChapters: true,
      authorId: true,
      author: { select: { name: true } },
    },
  });

  if (!novel) notFound();

  const canEdit =
    user?.role === Role.ADMIN || (user && novel.authorId === user.id);

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
      status: true,
      wordCount: true,
    },
  });

  const isDraft = novel.status === "DRAFT";

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{novel.title}</h1>
          <p className="mt-2 flex items-center gap-2 text-sm text-gray-500">
            <span>作者：{novel.author?.name ?? "佚名"}</span>
            <span
              className={
                isDraft
                  ? "rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                  : "rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800"
              }
            >
              {isDraft ? "草稿" : "已发布"}
            </span>
          </p>
        </div>
        {canEdit && (
          <div className="flex shrink-0 gap-2">
            <Link href={`/novels/${novel.id}/edit`}>
              <Button
                variant="ghost"
                size="sm"
                className="border border-blue-600"
              >
                编辑小说
              </Button>
            </Link>
            <Link href={`/novels/${novel.id}/chapters/new`}>
              <Button size="sm">添加章节</Button>
            </Link>
          </div>
        )}
      </div>

      <Card>
        <div className="flex flex-col gap-6 sm:flex-row">
          {novel.coverImage ? (
            <img
              src={novel.coverImage}
              alt={novel.title}
              className="h-[160px] w-[120px] shrink-0 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-[160px] w-[120px] shrink-0 items-center justify-center rounded-lg bg-gray-200">
              <span className="text-xs text-gray-400">暂无封面</span>
            </div>
          )}
          <div className="flex flex-1 flex-col">
            <p className="mb-2 text-xs text-gray-400">
              {novel.totalChapters} 章
            </p>
            <p className="whitespace-pre-wrap text-sm text-gray-700">
              {novel.synopsis || "暂无简介"}
            </p>
          </div>
        </div>
      </Card>

      <h2 className="mb-3 mt-8 text-xl font-semibold">目录</h2>
      {chapters.length === 0 ? (
        <p className="rounded-lg border border-gray-200 py-6 text-center text-gray-400">
          暂无章节，点击上方按钮添加
        </p>
      ) : (
        <div className="rounded-lg border border-gray-200">
          {chapters.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 border-b border-gray-100 py-2 last:border-b-0"
            >
              <span className="w-8 text-sm text-gray-500">
                {c.chapterNumber}
              </span>
              <Link
                href={`/novels/${novel.id}/read/${c.id}`}
                className="max-w-md truncate text-blue-600 hover:underline"
              >
                {c.title}
              </Link>
              <span
                className={
                  CHAPTER_BADGE_CLASS[c.status] ??
                  "bg-gray-100 text-gray-600"
                }
              >
                <span className="rounded-full px-2 py-0.5 text-xs">
                  {CHAPTER_STATUS_LABEL[c.status]}
                </span>
              </span>
              <span className="text-xs text-gray-400">{c.wordCount} 字</span>
              {canEdit && (
                <Link
                  href={`/novels/${novel.id}/chapters/${c.id}/edit`}
                  className="ml-auto"
                >
                  <Button variant="ghost" size="sm">
                    编辑
                  </Button>
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
