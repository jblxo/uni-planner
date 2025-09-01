import { forwardRef, InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export const Checkbox = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="checkbox"
        className={cn(
          "h-4 w-4 rounded border border-neutral-300 text-black focus:ring-2 focus:ring-neutral-400 dark:bg-neutral-900 dark:border-neutral-700",
          className
        )}
        {...props}
      />
    );
  }
);

Checkbox.displayName = "Checkbox";
