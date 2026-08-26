import Link from "next/link";
import { notFound } from "next/navigation";
import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { Reader } from "@/components/novels/reader";

interface PageProps {
  params: { id: string; chapterId: string };
}

export default async function ReaderPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  const user = session?.user ?? null;

  const novel = await prisma.novel.findUnique({
    where: { id: params.id },
    select: { id: true, title: true, authorId: true },
  });
  if (!novel) notFound();

  const canEdit =
    user?.role === Role.ADMIN || (user && novel.authorId === user.id);

  const chapter = await prisma.novelChapter.findFirst({
    where: {
      id: params.chapterId,
      novelId: params.id,
      ...(!canEdit ? { status: "PUBLISHED" } : {}),
    },
    select: {
      id: true,
      chapterNumber: true,
      title: true,
      content: true,
      status: true,
      wordCount: true,
      updatedAt: true,
    },
  });
  if (!chapter) notFound();

  const chapters = await prisma.novelChapter.findMany({
    where: {
      novelId: params.id,
      ...(!canEdit ? { status: "PUBLISHED" } : {}),
    },
    orderBy: { chapterNumber: "asc" },
    select: { id: true, chapterNumber: true },
  });
  const idx = chapters.findIndex((c) => c.id === chapter.id);
  const prev = idx > 0 ? chapters[idx - 1] : null;
  const next = idx >= 0 && idx < chapters.length - 1 ? chapters[idx + 1] : null;

  const paragraphs = chapter.content
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const topLink = (to: string, label: string, disabled: boolean) => (
    <Link
      href={to}
      aria-disabled={disabled}
      className={`rounded border px-3 py-1 text-sm ${
        disabled
          ? "pointer-events-none text-gray-300"
          : "hover:bg-gray-50 dark:hover:bg-gray-800"
      }`}
    >
      {label}
    </Link>
  );

  const bottomLink = (
    to: string,
    label: string,
    primary: boolean,
    disabled: boolean
  ) =>
    disabled ? (
      <span />
    ) : (
      <Link
        href={to}
        className={
          primary
            ? "rounded bg-blue-600 px-5 py-2 text-sm text-white hover:bg-blue-700"
            : "rounded border px-5 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:text-gray-300"
        }
      >
        {label}
      </Link>
    );

  return (
    <main className="reader-body mx-auto max-w-3xl px-6 py-8">
      {chapter.status === "DRAFT" && (
        <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          ⚠️ 当前章节为草稿，内容可能随时变动
        </div>
      )}

      <div className="mb-6 flex items-center justify-between gap-2 border-b border-gray-200 pb-3">
        <Link
          href={`/novels/${novel.id}`}
          className="text-sm text-blue-600 hover:underline"
        >
          ← 返回小说详情
        </Link>
        <span className="truncate px-4 text-sm text-gray-500">
          {novel.title} · 第{chapter.chapterNumber}章
        </span>
        <div className="flex gap-2">
          {prev ? (
            topLink(`/novels/${novel.id}/read/${prev.id}`, "← 上一章", false)
          ) : (
            <span className="rounded border px-3 py-1 text-sm text-gray-300">
              ← 上一章
            </span>
          )}
          {next ? (
            topLink(`/novels/${novel.id}/read/${next.id}`, "下一章 →", false)
          ) : (
            <span className="rounded border px-3 py-1 text-sm text-gray-300">
              下一章 →
            </span>
          )}
        </div>
      </div>

      <h1 className="mb-4 text-center text-3xl font-bold tracking-wide">
        {chapter.title}
      </h1>

      <p className="mb-6 text-center text-sm text-gray-400">
        {chapter.wordCount} 字 ·{" "}
        {new Date(chapter.updatedAt).toLocaleDateString("zh-CN")}
      </p>

      <article>
        {paragraphs.map((p, i) => (
          <p key={i} className="reader-paragraph">
            {p}
          </p>
        ))}
      </article>

      <div className="mt-12 flex justify-center gap-4 border-t border-gray-200 pt-6">
        {prev
          ? bottomLink(
              `/novels/${novel.id}/read/${prev.id}`,
              "← 上一章",
              true,
              false
            )
          : bottomLink("", "", true, true)}
        {bottomLink(`/novels/${novel.id}`, "返回目录", false, false)}
        {next
          ? bottomLink(
              `/novels/${novel.id}/read/${next.id}`,
              "下一章 →",
              true,
              false
            )
          : bottomLink("", "", true, true)}
      </div>

      <Reader novelId={novel.id} chapterId={chapter.id} />
    </main>
  );
}
