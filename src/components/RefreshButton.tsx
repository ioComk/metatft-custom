"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function RefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [lastRefreshed, setLastRefreshed] = useState<string | null>(null);

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
      setLastRefreshed(
        new Date().toLocaleTimeString("ja-JP", { timeZone: "Asia/Tokyo" }),
      );
    });
  };

  return (
    <div className="flex items-center gap-3">
      {lastRefreshed && (
        <span className="text-xs text-neutral-500">
          更新: {lastRefreshed}
        </span>
      )}
      <button
        onClick={handleRefresh}
        disabled={isPending}
        className="flex items-center gap-1.5 rounded-lg border border-surface-border/80 bg-surface-elevated/80 px-3 py-1.5 text-xs font-medium text-neutral-300 transition hover:border-neutral-500 hover:text-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <svg
          className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
        </svg>
        {isPending ? "更新中…" : "手動更新"}
      </button>
    </div>
  );
}
