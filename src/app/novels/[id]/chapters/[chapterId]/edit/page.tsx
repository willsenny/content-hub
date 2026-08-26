import { notFound, redirect } from "next/navigation";
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
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">
        编辑章节 — {novel.title}
      </h1>
      <ChapterForm
        novelId={novel.id}
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
