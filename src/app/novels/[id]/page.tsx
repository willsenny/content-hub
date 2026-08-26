import Link from "next/link";
import { notFound } from "next/navigation";
import { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const STATUS_LABEL: Record<string, string> = {
  ONGOING: "连载中",
  COMPLETED: "已完结",
  DRAFT: "草稿",
};

const CHAPTER_STATUS_LABEL: Record<string, string> = {
  DRAFT: "草稿",
  PUBLISHED: "已发布",
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

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row">
          {novel.coverImage ? (
            <img
              src={novel.coverImage}
              alt={novel.title}
              className="h-48 w-36 shrink-0 rounded object-cover"
            />
          ) : (
            <div className="flex h-48 w-36 shrink-0 items-center justify-center rounded bg-gray-100 text-gray-400">
              无封面
            </div>
          )}
          <div className="flex flex-1 flex-col">
            <div className="mb-2 flex items-center gap-3">
              <span className="text-xs font-medium text-blue-600">
                {STATUS_LABEL[novel.status]}
              </span>
              <span className="text-xs text-gray-400">{novel.totalChapters} 章</span>
            </div>
            <h1 className="mb-2 text-2xl font-bold">{novel.title}</h1>
            <p className="mb-2 text-sm text-gray-500">
              作者：{novel.author?.name ?? "佚名"}
            </p>
            <p className="whitespace-pre-wrap text-sm text-gray-700">
              {novel.synopsis || "暂无简介"}
            </p>
            {canEdit && (
              <div className="mt-4 flex gap-2">
                <Link href={`/novels/${novel.id}/edit`}>
                  <Button variant="secondary" size="sm">编辑</Button>
                </Link>
                <Link href={`/novels/${novel.id}/chapters/new`}>
                  <Button size="sm">新建章节</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </Card>

      <h2 className="mb-3 mt-8 text-xl font-semibold">目录</h2>
      {chapters.length === 0 ? (
        <p className="text-gray-400">暂无章节</p>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
          {chapters.map((c) => (
            <li key={c.id}>
              <Link
                href={`/novels/${novel.id}/read/${c.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
              >
                <span className="text-sm">
                  <span className="mr-2 text-gray-400">{c.chapterNumber}</span>
                  {c.title}
                </span>
                <span className="flex items-center gap-3 text-xs text-gray-400">
                  {canEdit && (
                    <>
                      <span
                        className={
                          c.status === "PUBLISHED"
                            ? "text-green-600"
                            : "text-amber-600"
                        }
                      >
                        {CHAPTER_STATUS_LABEL[c.status]}
                      </span>
                      <Link
                        href={`/novels/${novel.id}/chapters/${c.id}/edit`}
                        className="text-blue-600 hover:underline"
                      >
                        编辑
                      </Link>
                    </>
                  )}
                  <span>{c.wordCount} 字</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
