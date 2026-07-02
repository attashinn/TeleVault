import { Vault } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: { box: "h-7 w-7", icon: 14, text: "text-sm" },
  md: { box: "h-9 w-9", icon: 18, text: "text-base" },
  lg: { box: "h-11 w-11", icon: 22, text: "text-lg" },
};

export function Logo({ className, showWordmark = true, size = "md" }: LogoProps) {
  const s = sizes[size];
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "relative grid place-items-center rounded-xl bg-primary text-primary-foreground shadow-soft",
          s.box,
        )}
      >
        <Vault size={s.icon} strokeWidth={2.25} />
        <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-foreground/10" />
      </div>
      {showWordmark && (
        <span className={cn("font-semibold tracking-tight text-foreground", s.text)}>
          TeleVault
        </span>
      )}
    </div>
  );
}
