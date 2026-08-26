import Link from "next/link";
import { notFound } from "next/navigation";
import { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
    <main className="mx-auto max-w-6xl px-4 py-8">
      <Link
        href="/novels"
        className="mb-6 inline-block text-sm text-gray-500 hover:text-gray-700"
      >
        ← 返回小说列表
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        {/* 左栏：封面 + 元信息 + 操作 */}
        <aside className="flex flex-col gap-4">
          <Card className="flex flex-col gap-4">
            {novel.coverImage ? (
              <img
                src={novel.coverImage}
                alt={novel.title}
                className="aspect-[3/4] w-full rounded-lg object-cover shadow-sm"
              />
            ) : (
              <div
                className={cn(
                  "flex aspect-[3/4] w-full items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 via-blue-500 to-sky-400 text-6xl font-bold text-white",
                )}
              >
                <span>{novel.title.charAt(0)}</span>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium",
                  isDraft
                    ? "bg-gray-100 text-gray-600"
                    : "bg-blue-100 text-blue-700",
                )}
              >
                {isDraft ? "草稿" : "已发布"}
              </span>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                {novel.totalChapters} 章
              </span>
            </div>

            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">作者</dt>
                <dd className="text-gray-800">
                  {novel.author?.name ?? "佚名"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">最新章节</dt>
                <dd className="text-gray-800">
                  {chapters.length ? `第${chapters.length}章` : "暂无"}
                </dd>
              </div>
            </dl>

            {canEdit && (
              <div className="flex flex-col gap-2 border-t border-gray-100 pt-4">
                <Link href={`/novels/${novel.id}/edit`}>
                  <Button variant="secondary" className="w-full">
                    编辑小说
                  </Button>
                </Link>
                <Link href={`/novels/${novel.id}/chapters/new`}>
                  <Button className="w-full">添加章节</Button>
                </Link>
              </div>
            )}
          </Card>
        </aside>

        {/* 右栏：标题 + 简介 + 章节列表 */}
        <section className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{novel.title}</h1>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-600">
              {novel.synopsis || "暂无简介"}
            </p>
          </div>

          <div>
            <h2 className="mb-3 text-xl font-semibold">目录</h2>
            {chapters.length === 0 ? (
              <p className="rounded-lg border border-dashed border-gray-300 py-10 text-center text-gray-400">
                暂无章节，点击左侧按钮添加
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {chapters.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5 transition hover:border-blue-400 hover:bg-blue-50/50"
                  >
                    <span className="w-7 shrink-0 text-center text-sm text-gray-400">
                      {c.chapterNumber}
                    </span>
                    <Link
                      href={`/novels/${novel.id}/read/${c.id}`}
                      className="min-w-0 flex-1 truncate text-sm text-gray-800 hover:text-blue-600"
                    >
                      {c.title}
                    </Link>
                    <span className="shrink-0 text-xs text-gray-400">
                      {c.wordCount} 字
                    </span>
                    {canEdit && (
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-xs",
                          CHAPTER_BADGE_CLASS[c.status] ??
                            "bg-gray-100 text-gray-600",
                        )}
                      >
                        {CHAPTER_STATUS_LABEL[c.status]}
                      </span>
                    )}
                    {canEdit && (
                      <Link
                        href={`/novels/${novel.id}/chapters/${c.id}/edit`}
                        className="shrink-0 text-xs text-blue-600 hover:underline"
                      >
                        编辑
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
