import Link from "next/link";
import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";

import { NovelList } from "@/components/novels/novel-list";
import { authOptions } from "@/lib/auth";
import { listPublicNovels } from "@/lib/novels";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: { page?: string };
}

export default async function NovelsPage({ searchParams }: PageProps) {
  const page = Math.max(1, Number(searchParams.page) || 1);
  const data = await listPublicNovels(page, 20);

  const session = await getServerSession(authOptions);
  const canCreate =
    session?.user?.role === Role.AUTHOR || session?.user?.role === Role.ADMIN;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">小说</h1>
        {canCreate && (
          <Link
            href="/novels/create"
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            新建小说
          </Link>
        )}
      </div>
      <NovelList
        items={data.items}
        basePath="/novels"
        page={data.page}
        totalPages={data.totalPages}
      />
    </main>
  );
}
