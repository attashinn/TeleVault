import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ eyebrow, title, description, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "mb-4 xs:mb-5 sm:mb-6 rounded-[1rem] xs:rounded-[1.25rem] sm:rounded-[1.5rem] border border-border/60 bg-background/80 px-3 xs:px-4 sm:px-5 py-3 xs:py-4 shadow-soft backdrop-blur",
        "grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 xs:gap-3 sm:flex sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-0.5 xs:mb-1 text-[10px] xs:text-xs font-medium uppercase tracking-[0.15em] xs:tracking-wider text-brand">{eyebrow}</p>
        )}
        <h1 className="truncate text-xl xs:text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="mt-1 xs:mt-1.5 text-xs xs:text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1.5 xs:gap-2">{actions}</div>}
    </div>
  );
}
