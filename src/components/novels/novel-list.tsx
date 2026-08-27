import Link from "next/link";

import { NovelCard } from "@/components/novels/novel-card";
import type { NovelListItem } from "@/lib/novels";

interface NovelListProps {
  items: NovelListItem[];
  basePath: string;
  page: number;
  totalPages: number;
  currentUserId: string | null;
  isAdmin: boolean;
}

export function NovelList({
  items,
  basePath,
  page,
  totalPages,
  currentUserId,
  isAdmin,
}: NovelListProps) {
  if (items.length === 0) {
    return <p className="py-16 text-center text-gray-400">暂无小说</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((novel) => (
          <NovelCard
            key={novel.id}
            novel={novel}
            canDelete={isAdmin || currentUserId === novel.authorId}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={`${basePath}?page=${page - 1}`}
              className="rounded border border-gray-300 px-3 py-1 text-sm"
            >
              上一页
            </Link>
          )}
          <span className="text-sm text-gray-500">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`${basePath}?page=${page + 1}`}
              className="rounded border border-gray-300 px-3 py-1 text-sm"
            >
              下一页
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
