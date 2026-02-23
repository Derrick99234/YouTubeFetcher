import type { InputHTMLAttributes } from "react";
import { forwardRef } from "react";
import { cn } from "@/lib/cn";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

const base =
    "h-10 w-full rounded-[calc(var(--radius)-6px)] border border-[rgb(var(--border))] " +
    "bg-[rgb(var(--card))] px-3 text-sm text-[rgb(var(--fg))] shadow-sm " +
    "placeholder:text-[rgb(var(--muted-2))] " +
    "transition-[border-color,box-shadow,background-color,color] duration-150 ease-out " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] " +
    "focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--bg))] " +
    "disabled:pointer-events-none disabled:opacity-60";

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
    { className, ...props },
    ref
) {
    return <input ref={ref} className={cn(base, className)} {...props} />;
});

