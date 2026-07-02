import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  variant?: "default" | "drag-here" | "search-empty";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = "default",
  size = "md",
  className,
}: EmptyStateProps) {
  const sizes = {
    sm: { wrapper: "py-10", icon: "h-10 w-10", iconInner: "h-5 w-5", title: "text-sm", desc: "text-xs" },
    md: { wrapper: "py-16", icon: "h-14 w-14", iconInner: "h-7 w-7", title: "text-base", desc: "text-sm" },
    lg: { wrapper: "py-24", icon: "h-20 w-20", iconInner: "h-10 w-10", title: "text-lg", desc: "text-base" },
  }[size];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center animate-fade-in",
        sizes.wrapper,
        variant === "drag-here" && "rounded-2xl border-2 border-dashed border-border bg-muted/20",
        className,
      )}
    >
      {/* Animated icon container */}
      <div className="relative mb-5">
        {/* Outer glow ring */}
        <div
          className={cn(
            "absolute inset-0 rounded-full bg-brand/10 blur-lg",
            sizes.icon,
          )}
        />
        <div
          className={cn(
            "relative grid place-items-center rounded-2xl bg-muted/70 text-muted-foreground animate-float",
            variant === "drag-here" && "bg-brand-muted text-brand",
            sizes.icon,
          )}
        >
          <Icon className={sizes.iconInner} strokeWidth={1.5} />
        </div>
      </div>

      <p className={cn("font-semibold tracking-tight text-foreground", sizes.title)}>
        {title}
      </p>
      {description && (
        <p className={cn("mt-1.5 max-w-xs text-muted-foreground leading-relaxed", sizes.desc)}>
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
