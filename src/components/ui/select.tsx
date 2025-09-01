import { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:border-transparent dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-100",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
