import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
    return (
        <div
            className={cn(
                "rounded-[var(--radius)] border border-[rgb(var(--border))] bg-[rgb(var(--card))] shadow-sm",
                className
            )}
            {...props}
        />
    );
}

export function CardHeader({ className, ...props }: CardProps) {
    return <div className={cn("px-5 pt-5", className)} {...props} />;
}

export function CardTitle({ className, ...props }: CardProps) {
    return (
        <div className={cn("text-base font-semibold tracking-[-0.01em]", className)} {...props} />
    );
}

export function CardDescription({ className, ...props }: CardProps) {
    return <div className={cn("mt-1 text-sm text-[rgb(var(--muted))]", className)} {...props} />;
}

export function CardContent({ className, ...props }: CardProps) {
    return <div className={cn("px-5 pb-5", className)} {...props} />;
}

export function CardFooter({ className, ...props }: CardProps) {
    return <div className={cn("flex items-center justify-between px-5 pb-5", className)} {...props} />;
}

