"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api-client";

type SaveState = "idle" | "saving" | "success" | "error";

interface ChapterFormProps {
  novelId: string;
  initialChapterNumber: number;
  chapterId?: string;
  mode?: "create" | "edit";
  initial?: {
    chapterNumber: number;
    title: string;
    content: string;
    status: string;
    revisionNote?: string | null;
    aiPromptLog?: string | null;
  };
}

export function ChapterForm({
  novelId,
  initialChapterNumber,
  chapterId,
  mode = "create",
  initial,
}: ChapterFormProps) {
  const router = useRouter();
  const [chapterNumber, setChapterNumber] = useState(
    initial?.chapterNumber ?? initialChapterNumber,
  );
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [status, setStatus] = useState(initial?.status ?? "DRAFT");
  const [revisionNote, setRevisionNote] = useState(
    initial?.revisionNote ?? "",
  );
  const [aiPromptLog, setAiPromptLog] = useState(initial?.aiPromptLog ?? "");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaveState("saving");

    const body = {
      chapterNumber,
      title,
      content,
      status,
      revisionNote,
      aiPromptLog,
    };
    try {
      const url = chapterId
        ? `/api/novels/${novelId}/chapters/${chapterId}`
        : `/api/novels/${novelId}/chapters`;
      const method = chapterId ? api.patch : api.post;
      await method<{ id: string }>(url, body);
      router.refresh();

      if (mode === "create") {
        setSaveState("success");
        timerRef.current = setTimeout(() => {
          router.push(`/novels/${novelId}`);
        }, 500);
      } else {
        setSaveState("success");
        timerRef.current = setTimeout(() => setSaveState("idle"), 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
      setSaveState("error");
    }
  }

  async function handleDeleteChapter() {
    if (!chapterId) return;
    if (!window.confirm("确定删除本章？此操作不可恢复")) return;
    try {
      await api.delete(`/api/novels/${novelId}/chapters/${chapterId}`);
      router.push(`/novels/${novelId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败");
      setSaveState("error");
    }
  }

  const buttonClass =
    saveState === "success"
      ? "bg-green-600 text-white hover:bg-green-700"
      : saveState === "error"
        ? "bg-red-600 text-white hover:bg-red-700"
        : "";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Card className="flex flex-col gap-4">
        <div className="flex gap-4">
          <label className="flex flex-col gap-1 text-sm">
            章节号
            <Input
              type="number"
              min={1}
              value={chapterNumber}
              onChange={(e) => setChapterNumber(Number(e.target.value))}
              className="w-20"
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
              title={title}
              className="truncate"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          正文
          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              placeholder="在这里写正文…"
              className="min-h-[560px] w-full resize-y rounded-lg border border-gray-300 p-4 pb-8 font-mono text-sm leading-relaxed outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <span className="pointer-events-none absolute bottom-2 right-3 text-xs text-gray-400">
              已输入 {content.length} 字
            </span>
          </div>
        </label>

        <div>
          <span className="mb-1 block text-sm">状态</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="DRAFT">草稿</option>
            <option value="PUBLISHED">已发布</option>
          </select>
        </div>
      </Card>

      <div className="sticky bottom-4 flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
        <div className="flex flex-1 flex-col items-end gap-1">
          <label className="flex w-full flex-col gap-1">
            <span className="text-xs font-medium text-gray-500">
              创作过程记录
            </span>
            <textarea
              value={aiPromptLog}
              onChange={(e) => setAiPromptLog(e.target.value)}
              placeholder="（选填）创作过程记录，如：先扩写 X 千字，再砍掉支线"
              rows={2}
              className="w-full rounded border border-gray-200 bg-white/95 p-2 text-xs"
            />
          </label>
          <label className="flex w-full flex-col gap-1">
            <span className="text-xs font-medium text-gray-500">
              编辑结论
            </span>
            <textarea
              value={revisionNote}
              onChange={(e) => setRevisionNote(e.target.value)}
              placeholder="（选填）终稿结论，如：觉醒段落重写完成，逻辑闭环"
              rows={2}
              className="w-full rounded border border-gray-200 bg-white/95 p-2 text-xs"
            />
          </label>
          <div className="flex items-center gap-3">
            <Link href={`/novels/${novelId}`}>
              <Button type="button" variant="secondary">
                取消
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={saveState === "saving"}
              className={buttonClass}
            >
              {saveState === "saving"
                ? "保存中…"
                : saveState === "success"
                  ? "✓ 已保存"
                  : "保存章节"}
            </Button>
            {mode === "edit" && chapterId && (
              <Button
                type="button"
                variant="ghost"
                disabled={saveState === "saving"}
                onClick={handleDeleteChapter}
                className="text-gray-400 transition hover:bg-red-50 hover:text-red-600"
              >
                删除本章
              </Button>
            )}
          </div>
        </div>
      </div>

      {saveState === "error" && error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </form>
  );
}
