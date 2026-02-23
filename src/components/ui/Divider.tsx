import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type DividerProps = HTMLAttributes<HTMLHRElement>;

export function Divider({ className, ...props }: DividerProps) {
    return (
        <hr className={cn("border-0 border-t border-[rgb(var(--border))]", className)} {...props} />
    );
}

