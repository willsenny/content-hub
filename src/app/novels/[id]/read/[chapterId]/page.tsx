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
    className={`rounded px-3 py-1 text-sm transition-colors ${
      disabled
        ? "pointer-events-none text-[#a09d96] opacity-50"
        : "text-[#555555] hover:text-[#222222] hover:bg-[#ebe7df]"
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
            ? "inline-flex items-center justify-center rounded-lg px-8 py-3 text-base font-medium text-[#555555] hover:text-[#222222] hover:bg-[#ebe7df] transition-colors"
            : "inline-flex items-center justify-center rounded-lg border border-[#e2ddc8] px-8 py-3 text-base font-medium text-[#555555] hover:text-[#222222] hover:border-[#d5d0ba] hover:bg-[#ebe7df] transition-colors"
        }
      >
        {label}
      </Link>
    );

  return (
    <main className="reader-body mx-auto max-w-3xl px-6 py-8 relative z-10">
      {chapter.status === "DRAFT" && (
        <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          ⚠️ 当前章节为草稿，内容可能随时变动
        </div>
      )}

      <div className="reader-nav sticky top-0 z-10 -mx-6 mb-6 flex items-center justify-between gap-2 px-6 py-3">
        <Link
          href={`/novels/${novel.id}`}
          className="shrink-0 text-sm"
        >
          ← 返回小说详情
        </Link>
        <span className="truncate px-2 text-sm">
          {novel.title} · 第{chapter.chapterNumber}章
        </span>
        <div className="flex shrink-0 gap-2">
          {prev ? (
            topLink(`/novels/${novel.id}/read/${prev.id}`, "← 上一章", false)
          ) : (
            <span className="rounded px-3 py-1 text-sm">
              ← 上一章
            </span>
          )}
          {next ? (
            topLink(`/novels/${novel.id}/read/${next.id}`, "下一章 →", false)
          ) : (
            <span className="rounded px-3 py-1 text-sm">
              下一章 →
            </span>
          )}
        </div>
      </div>

      <h1 className="reader-title mb-4 text-center text-3xl font-bold tracking-wide">
        {chapter.title}
      </h1>

      <p className="reader-meta mb-6 text-center text-sm">
        {chapter.wordCount} 字 ·{" "}
        {new Date(chapter.updatedAt).toLocaleDateString("zh-CN")}
      </p>

      <article>
        {paragraphs.map((p, i) => (
          <p key={i} className="reader-paragraph" >
            {p}
          </p>
        ))}
      </article>

      <div className="reader-footer mt-12 flex justify-center gap-4 pt-8">
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
