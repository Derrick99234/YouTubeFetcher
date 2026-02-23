import type { ButtonHTMLAttributes } from "react";
import { forwardRef } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
};

const base =
    "inline-flex items-center justify-center gap-2 rounded-[calc(var(--radius)-6px)] font-medium " +
    "transition-[transform,background-color,border-color,color,box-shadow] duration-150 ease-out " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--ring))] " +
    "focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--bg))] " +
    "disabled:pointer-events-none disabled:opacity-60 active:scale-[0.98]";

const variants: Record<ButtonVariant, string> = {
    primary:
        "bg-[rgb(var(--primary))] text-[rgb(var(--primary-fg))] shadow-sm " +
        "hover:bg-[rgba(var(--primary),0.92)]",
    secondary:
        "border border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--fg))] shadow-sm " +
        "hover:bg-[rgba(var(--fg),0.03)]",
    ghost:
        "text-[rgb(var(--fg))] hover:bg-[rgba(var(--fg),0.05)]",
    danger:
        "bg-[rgb(var(--danger))] text-white shadow-sm hover:bg-[rgba(var(--danger),0.92)]",
};

const sizes: Record<ButtonSize, string> = {
    sm: "h-9 px-3 text-sm",
    md: "h-10 px-4 text-sm",
    lg: "h-11 px-5 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
    { className, variant = "secondary", size = "md", type = "button", ...props },
    ref
) {
    return (
        <button
            ref={ref}
            type={type}
            className={cn(base, variants[variant], sizes[size], className)}
            {...props}
        />
    );
});

