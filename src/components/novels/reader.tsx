"use client";

import { useEffect } from "react";

interface ReaderProps {
  novelId: string;
  chapterId: string;
}

export function Reader({ novelId, chapterId }: ReaderProps) {
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/reading-progress", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ novelId, chapterId, position: 0 }),
      signal: controller.signal,
    }).catch(() => undefined);

    return () => controller.abort();
  }, [novelId, chapterId]);

  return null;
}
