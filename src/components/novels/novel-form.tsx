"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { api } from "@/lib/api-client";

interface NovelFormProps {
  mode: "create" | "edit";
  novelId?: string;
  initial?: {
    title: string;
    synopsis: string;
    coverImage: string;
    status: string;
  };
}

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "草稿" },
  { value: "ONGOING", label: "连载中" },
  { value: "COMPLETED", label: "已完结" },
];

export function NovelForm({ mode, novelId, initial }: NovelFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [synopsis, setSynopsis] = useState(initial?.synopsis ?? "");
  const [coverImage, setCoverImage] = useState(initial?.coverImage ?? "");
  const [status, setStatus] = useState(initial?.status ?? "DRAFT");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const url = mode === "create" ? "/api/novels" : `/api/novels/${novelId}`;
      const method = mode === "create" ? api.post : api.patch;
      const novel = await method<{ id: string }>(url, {
        title,
        synopsis,
        coverImage,
        status,
      });
      router.push(`/novels/${novel.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        标题 <span className="text-red-500">*</span>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="小说标题"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        简介
        <Textarea
          value={synopsis}
          onChange={(e) => setSynopsis(e.target.value)}
          rows={4}
          placeholder="一句话介绍这部小说"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        封面 URL
        <Input
          value={coverImage}
          onChange={(e) => setCoverImage(e.target.value)}
          placeholder="https://…"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        状态
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={loading}>
        {loading ? "保存中…" : mode === "create" ? "创建小说" : "保存修改"}
      </Button>
    </form>
  );
}
