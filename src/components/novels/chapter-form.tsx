"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { api } from "@/lib/api-client";

interface ChapterFormProps {
  novelId: string;
  initialChapterNumber: number;
  chapterId?: string;
  initial?: {
    chapterNumber: number;
    title: string;
    content: string;
    status: string;
  };
}

export function ChapterForm({
  novelId,
  initialChapterNumber,
  chapterId,
  initial,
}: ChapterFormProps) {
  const router = useRouter();
  const [chapterNumber, setChapterNumber] = useState(
    initial?.chapterNumber ?? initialChapterNumber,
  );
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [status, setStatus] = useState(initial?.status ?? "DRAFT");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const body = { chapterNumber, title, content, status };
    try {
      const url = chapterId
        ? `/api/novels/${novelId}/chapters/${chapterId}`
        : `/api/novels/${novelId}/chapters`;
      const method = chapterId ? api.patch : api.post;
      await method<{ id: string }>(url, body);
      router.push(`/novels/${novelId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-4">
      <div className="flex gap-4">
        <label className="flex w-32 flex-col gap-1 text-sm">
          章节号
          <Input
            type="number"
            min={1}
            value={chapterNumber}
            onChange={(e) => setChapterNumber(Number(e.target.value))}
            required
          />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-sm">
          章节标题 <span className="text-red-500">*</span>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="章节标题"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        正文
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={16}
          required
          placeholder="在这里写正文…"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        状态
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="DRAFT">草稿</option>
          <option value="PUBLISHED">已发布</option>
        </select>
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={loading}>
        {loading ? "保存中…" : "保存章节"}
      </Button>
    </form>
  );
}
