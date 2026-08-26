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
    select: { authorId: true },
  });
  const canEdit =
    user?.role === Role.ADMIN || (user && novel?.authorId === user.id);

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
      novel: { select: { title: true } },
    },
  });

  if (!chapter) notFound();

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <nav className="mb-6 text-sm text-gray-400">
        <Link href={`/novels/${params.id}`} className="hover:text-blue-600">
          {chapter.novel.title}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-600">第 {chapter.chapterNumber} 章</span>
      </nav>

      <h1 className="mb-8 text-center text-2xl font-bold">{chapter.title}</h1>

      <article className="whitespace-pre-wrap leading-8 text-gray-800">
        {chapter.content}
      </article>

      <Reader novelId={params.id} chapterId={chapter.id} />
    </main>
  );
}
