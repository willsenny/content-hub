import Link from "next/link";

import { Card } from "@/components/ui/card";
import type { NovelListItem } from "@/lib/novels";

const STATUS_LABEL: Record<string, string> = {
  ONGOING: "连载中",
  COMPLETED: "已完结",
  DRAFT: "草稿",
};

export function NovelCard({ novel }: { novel: NovelListItem }) {
  return (
    <Link href={`/novels/${novel.id}`} className="block">
      <Card className="h-full transition hover:border-blue-400 hover:shadow-md">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-blue-600">
            {STATUS_LABEL[novel.status]}
          </span>
          <span className="text-xs text-gray-400">
            {novel.publishedChapters} 章
          </span>
        </div>
        <h2 className="mb-1 truncate text-lg font-semibold">{novel.title}</h2>
        <p className="mb-3 line-clamp-3 text-sm text-gray-600">
          {novel.synopsis || "暂无简介"}
        </p>
        <p className="text-xs text-gray-400">{novel.author?.name ?? "佚名"}</p>
      </Card>
    </Link>
  );
}
