import { notFound, redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { NovelForm } from "@/components/novels/novel-form";

interface PageProps {
  params: { id: string };
}

export default async function EditNovelPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (
    !session?.user ||
    (session.user.role !== Role.AUTHOR && session.user.role !== Role.ADMIN)
  ) {
    redirect("/novels");
  }

  const novel = await prisma.novel.findUnique({ where: { id: params.id } });
  if (!novel) notFound();
  if (
    session.user.role !== Role.ADMIN &&
    novel.authorId !== session.user.id
  ) {
    redirect(`/novels/${novel.id}`);
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">编辑小说</h1>
      <NovelForm
        mode="edit"
        novelId={novel.id}
        initial={{
          title: novel.title,
          synopsis: novel.synopsis ?? "",
          coverImage: novel.coverImage ?? "",
          status: novel.status,
        }}
      />
    </main>
  );
}
