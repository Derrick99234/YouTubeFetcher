import type { SelectHTMLAttributes } from "react";
import { forwardRef } from "react";
import { cn } from "@/lib/cn";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

const base =
    "h-10 w-full rounded-[calc(var(--radius)-6px)] border border-[rgb(var(--border))] " +
    "bg-[rgb(var(--card))] px-3 text-sm text-[rgb(var(--fg))] shadow-sm " +
    "transition-[border-color,box-shadow,background-color,color] duration-150 ease-out " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] " +
    "focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--bg))] " +
    "disabled:pointer-events-none disabled:opacity-60";

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
    { className, ...props },
    ref
) {
    return <select ref={ref} className={cn(base, className)} {...props} />;
});

