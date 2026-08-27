"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api-client";
import type { NovelListItem } from "@/lib/novels";

const STATUS_LABEL: Record<string, string> = {
  ONGOING: "连载中",
  COMPLETED: "已完结",
  DRAFT: "草稿",
};

const STATUS_BADGE: Record<string, string> = {
  ONGOING: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
  DRAFT: "bg-gray-100 text-gray-600",
};

const COVER_GRADIENTS = [
  "from-indigo-500 via-blue-500 to-sky-400",
  "from-rose-500 via-pink-500 to-fuchsia-500",
  "from-amber-500 via-orange-500 to-red-400",
  "from-emerald-500 via-teal-500 to-cyan-400",
  "from-violet-500 via-purple-500 to-indigo-400",
];

function coverGradient(title: string) {
  const sum = title.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return COVER_GRADIENTS[sum % COVER_GRADIENTS.length];
}

function CoverPlaceholder({
  title,
  gradient,
}: {
  title: string;
  gradient: string;
}) {
  return (
    <div
      className={cn(
        "flex h-28 w-20 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-2xl font-bold text-white shadow-sm",
        gradient,
      )}
    >
      <span>{title.charAt(0)}</span>
    </div>
  );
}

interface NovelCardProps {
  novel: NovelListItem;
  canDelete: boolean;
}

export function NovelCard({ novel, canDelete }: NovelCardProps) {
  const router = useRouter();
  const gradient = coverGradient(novel.title);

  async function handleDelete() {
    if (
      !window.confirm(
        `确定删除《${novel.title}》及所有章节？此操作不可恢复`,
      )
    ) {
      return;
    }
    try {
      await api.delete(`/api/novels/${novel.id}`);
      router.refresh();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "删除失败");
    }
  }

  return (
    <Link href={`/novels/${novel.id}`} className="group block h-full">
      <Card className="flex h-full gap-4 transition hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md">
        {novel.coverImage ? (
          <img
            src={novel.coverImage}
            alt={novel.title}
            className="h-28 w-20 shrink-0 rounded-lg object-cover shadow-sm"
          />
        ) : (
          <CoverPlaceholder title={novel.title} gradient={gradient} />
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium",
                STATUS_BADGE[novel.status] ?? STATUS_BADGE.DRAFT,
              )}
            >
              {STATUS_LABEL[novel.status] ?? novel.status}
            </span>
            <span className="flex shrink-0 items-center gap-1">
              <span className="text-xs text-gray-400">
                {novel.publishedChapters} 章
              </span>
              {canDelete && (
                <button
                  type="button"
                  aria-label="删除小说"
                  title="删除小说"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDelete();
                  }}
                  className="rounded px-1 text-base leading-none text-gray-300 transition hover:bg-red-50 hover:text-red-600"
                >
                  ×
                </button>
              )}
            </span>
          </div>

          <h2 className="mb-1 truncate text-lg font-semibold text-gray-900 group-hover:text-blue-600">
            {novel.title}
          </h2>

          <p className="mb-3 line-clamp-3 text-sm leading-relaxed text-gray-600">
            {novel.synopsis || "暂无简介"}
          </p>

          <p className="mt-auto truncate text-xs text-gray-400">
            {novel.author?.name ?? "佚名"}
          </p>
        </div>
      </Card>
    </Link>
  );
}
