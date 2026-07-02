import { useState, useEffect, CSSProperties } from "react";
import { LucideIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface DotCardProps {
  target?: number;
  duration?: number;
  label?: string;
  format?: (val: number) => string;
  icon?: LucideIcon;
  iconClass?: string;
  hint?: string;
  progress?: number;
  className?: string;
  style?: CSSProperties;
}

export default function DotCard({
  target = 777000,
  duration = 2000,
  label = "Views",
  format,
  icon: Icon,
  iconClass = "",
  hint,
  progress,
  className = "",
  style,
}: DotCardProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = target;
    const range = end - start;
    if (range <= 0) {
      setCount(0);
      return;
    }
    const increment = Math.ceil(end / (duration / 50));
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        start = end;
        clearInterval(timer);
      }
      setCount(start);
    }, 50);
    return () => clearInterval(timer);
  }, [target, duration]);

  const display = format
    ? format(count)
    : count < 1000
    ? count.toString()
    : `${(count / 1000).toFixed(0)}k`;

  return (
    <div 
      className={cn(
        "group w-full rounded-2xl border border-border bg-surface p-5 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated flex flex-col justify-between items-stretch", 
        className
      )} 
      style={{ minHeight: "140px", ...style }}
    >
      {/* Top Section: Icon */}
      <div className="flex items-center justify-between">
        {Icon && (
          <div className={cn("grid h-9 w-9 place-items-center rounded-xl transition-transform duration-200 group-hover:scale-110", iconClass)}>
            <Icon className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Middle Section: Label & Value */}
      <div className="mt-4 text-left">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        <div className="mt-1.5 flex items-baseline gap-1.5 flex-wrap">
          <span className="text-2xl font-bold tracking-tight tabular-nums text-foreground">
            {display}
          </span>
          {hint && (
            <span className="text-xs text-muted-foreground">
              {hint}
            </span>
          )}
        </div>
      </div>

      {/* Bottom Section: Progress Bar */}
      {progress !== undefined && (
        <Progress value={progress} className="mt-4 h-1" />
      )}
    </div>
  );
}
