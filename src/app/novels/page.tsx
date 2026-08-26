import { NovelList } from "@/components/novels/novel-list";
import { listPublicNovels } from "@/lib/novels";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: { page?: string };
}

export default async function NovelsPage({ searchParams }: PageProps) {
  const page = Math.max(1, Number(searchParams.page) || 1);
  const data = await listPublicNovels(page, 20);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">小说</h1>
      <NovelList
        items={data.items}
        basePath="/novels"
        page={data.page}
        totalPages={data.totalPages}
      />
    </main>
  );
}
