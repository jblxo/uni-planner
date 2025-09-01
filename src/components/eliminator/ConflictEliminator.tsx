"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { setCourseArchivedAction } from "@/app/actions";
import { useRouter } from "next/navigation";

type Conflict = {
  date: string;
  start: string;
  end: string;
  a: { courseId: string; courseName: string; sessionId: string };
  b: { courseId: string; courseName: string; sessionId: string };
};

export function ConflictEliminator({ initial }: { initial: Conflict[] }) {
  const [conflicts, setConflicts] = useState<Conflict[]>(initial);
  const router = useRouter();

  const current = conflicts[0];
  const remaining = conflicts.length;
  const [choosing, setChoosing] = useState(false);

  async function choose(keepId: string, archiveId: string) {
    if (choosing) return;
    setChoosing(true);
    await setCourseArchivedAction(archiveId, true);
    // Remove all conflicts involving the archived course
    setConflicts((prev) => prev.filter((c) => c.a.courseId !== archiveId && c.b.courseId !== archiveId));
    router.refresh();
    setChoosing(false);
  }

  // If server refreshed and new "initial" arrives, sync (protect local progress)
  useEffect(() => {
    // Merge-dedupe by pair key, but keep already removed ones removed
    setConflicts((prev) => {
      const removedPairs = new Set<string>();
      // Compute existing set for quick compare
      const prevKeys = new Set(prev.map((c) => [c.a.courseId, c.b.courseId].sort().join("::")));
      const merged: Conflict[] = [];
      const added = new Set<string>();
      for (const c of initial) {
        const k = [c.a.courseId, c.b.courseId].sort().join("::");
        if (added.has(k)) continue;
        added.add(k);
        merged.push(c);
      }
      return merged;
    });
  }, [initial]);

  return (
    <div className="mx-auto max-w-[900px] space-y-6">
      <h1 className="text-2xl font-semibold">Conflict Eliminator</h1>
      <div className="text-sm text-neutral-600 dark:text-neutral-300">
        Resolve time collisions by choosing which course to keep. The unselected course gets archived and can be reactivated later on the Archive page.
      </div>

      {remaining === 0 && (
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-6 text-center text-sm">
          No conflicts to resolve. 🎉
        </div>
      )}

      {current && (
        <div className="space-y-4">
          <div className="text-sm">{new Date(current.date).toLocaleDateString()} • {current.start}–{current.end}</div>
          <div className="grid sm:grid-cols-2 gap-4">
            <SwipeCard
              side="left"
              title={current.a.courseName}
              onSwipeOut={() => choose(current.a.courseId, current.b.courseId)}
              onClick={() => choose(current.a.courseId, current.b.courseId)}
              disabled={choosing}
            />
            <SwipeCard
              side="right"
              title={current.b.courseName}
              onSwipeOut={() => choose(current.b.courseId, current.a.courseId)}
              onClick={() => choose(current.b.courseId, current.a.courseId)}
              disabled={choosing}
            />
          </div>
          <div className="text-xs text-neutral-500">Remaining conflicts: {remaining}</div>
        </div>
      )}
    </div>
  );
}

function SwipeCard({ side, title, onSwipeOut, onClick, disabled }: { side: "left" | "right"; title: string; onSwipeOut: () => void; onClick: () => void; disabled?: boolean }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const startX = useRef<number | null>(null);
  const dx = useRef(0);
  const isPointer = useRef(false);

  const threshold = 80; // px

  function onPointerDown(e: React.PointerEvent) {
    if (disabled) return;
    isPointer.current = true;
    startX.current = e.clientX;
    (e.target as Element).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (disabled || !isPointer.current || startX.current == null) return;
    dx.current = e.clientX - startX.current;
    if (ref.current) {
      ref.current.style.transform = `translateX(${dx.current}px) rotate(${dx.current / 20}deg)`;
      ref.current.style.transition = "transform 0s";
    }
  }
  function reset() {
    if (ref.current) {
      ref.current.style.transform = "translateX(0px) rotate(0deg)";
      ref.current.style.transition = "transform 150ms ease-out";
    }
    startX.current = null;
    dx.current = 0;
    isPointer.current = false;
  }
  function onPointerUp(e: React.PointerEvent) {
    if (disabled || !isPointer.current) return;
    const delta = dx.current;
    const valid = side === "left" ? delta < -threshold : delta > threshold;
    if (valid) {
      if (ref.current) {
        const out = side === "left" ? -window.innerWidth : window.innerWidth;
        ref.current.style.transform = `translateX(${out}px) rotate(${delta / 20}deg)`;
        ref.current.style.transition = "transform 220ms ease-in";
      }
      setTimeout(onSwipeOut, 180);
    } else {
      reset();
    }
  }

  return (
    <div
      ref={ref}
      className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 flex flex-col gap-3 select-none touch-pan-y"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={reset}
    >
      <div className="font-medium truncate" title={title}>{title}</div>
      <div className="text-sm text-neutral-600 dark:text-neutral-300">Swipe {side === 'left' ? 'left' : 'right'} to keep</div>
      <div>
        <Button className="w-full" onClick={onClick}>Choose</Button>
      </div>
    </div>
  );
}
