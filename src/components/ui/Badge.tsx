import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type BadgeVariant = "neutral" | "success" | "danger";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
    variant?: BadgeVariant;
};

const variants: Record<BadgeVariant, string> = {
    neutral:
        "border border-[rgb(var(--border))] bg-[rgba(var(--fg),0.03)] text-[rgb(var(--fg))]",
    success: "bg-[rgba(var(--success),0.15)] text-[rgb(var(--success))]",
    danger: "bg-[rgba(var(--danger),0.15)] text-[rgb(var(--danger))]",
};

export function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
    return (
        <span
            className={cn(
                "inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium",
                variants[variant],
                className
            )}
            {...props}
        />
    );
}

