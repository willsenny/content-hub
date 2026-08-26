import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { NovelForm } from "@/components/novels/novel-form";

export default async function CreateNovelPage() {
  const session = await getServerSession(authOptions);
  if (
    !session?.user ||
    (session.user.role !== Role.AUTHOR && session.user.role !== Role.ADMIN)
  ) {
    redirect("/novels");
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">新建小说</h1>
      <NovelForm mode="create" />
    </main>
  );
}
