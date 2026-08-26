import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { ChapterForm } from "@/components/novels/chapter-form";

interface PageProps {
  params: { id: string; chapterId: string };
}

export default async function EditChapterPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (
    !session?.user ||
    (session.user.role !== Role.AUTHOR && session.user.role !== Role.ADMIN)
  ) {
    redirect("/novels");
  }

  const novel = await prisma.novel.findUnique({ where: { id: params.id } });
  if (!novel) notFound();
  if (session.user.role !== Role.ADMIN && novel.authorId !== session.user.id) {
    redirect(`/novels/${novel.id}`);
  }

  const chapter = await prisma.novelChapter.findUnique({
    where: { id: params.chapterId },
  });
  if (!chapter || chapter.novelId !== novel.id) notFound();

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href={`/novels/${novel.id}`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← 返回小说详情
        </Link>
        <span className="text-sm text-gray-400">
          {novel.title}
          <span className="mx-1">·</span>
          <span className="font-semibold text-gray-800">编辑章节</span>
        </span>
      </div>
      <ChapterForm
        novelId={novel.id}
        mode="edit"
        initialChapterNumber={novel.totalChapters + 1}
        chapterId={chapter.id}
        initial={{
          chapterNumber: chapter.chapterNumber,
          title: chapter.title,
          content: chapter.content,
          status: chapter.status,
        }}
      />
    </main>
  );
}
