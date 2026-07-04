import { Menu, Command, Search, Upload } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationsPopover } from "@/components/dashboard/notifications-popover";
import { UserButton } from "@clerk/tanstack-react-start";
import { cn } from "@/lib/utils";

export function TopNav({ onMenuClick }: { onMenuClick?: () => void }) {
  const searchRef = useRef<HTMLInputElement>(null);
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
      if (e.key === "Escape" && searchFocused) {
        searchRef.current?.blur();
      }
    }
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [searchFocused]);

  return (
    <header
      className="sticky top-0 z-30 flex h-[62px] items-center gap-2 sm:gap-3 border-b border-border/60 bg-background/80 px-3 sm:px-4 backdrop-blur-xl md:px-5"
      role="banner"
    >
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:hidden"
        aria-label="Toggle sidebar"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Search */}
      <div className="relative flex flex-1 items-center">
        <Search
          className={cn(
            "pointer-events-none absolute left-3 h-[14px] w-[14px] transition-colors duration-150",
            searchFocused ? "text-brand" : "text-muted-foreground/60",
          )}
          aria-hidden="true"
        />
        <Input
          ref={searchRef}
          placeholder="Search files…"
          className={cn(
            "h-9 max-w-[280px] sm:max-w-[320px] rounded-xl border-border/60 bg-muted/40 pl-8 pr-12 sm:pr-16 text-xs sm:text-[13px] shadow-none",
            "placeholder:text-muted-foreground/40",
            "transition-all duration-200",
            "focus:max-w-sm focus:border-brand/40 focus:bg-background focus:ring-2 focus:ring-brand/15",
            "hover:bg-muted/50",
          )}
          aria-label="Search files and folders"
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
        <kbd
          className={cn(
            "pointer-events-none absolute right-2 sm:right-2.5 hidden items-center gap-0.5 rounded border border-border/60 bg-background px-1 sm:px-1.5 py-0.5 text-[9px] sm:text-[10px] text-muted-foreground/60 transition-opacity md:flex",
            searchFocused && "opacity-0",
          )}
          aria-label="Press Command K to search"
        >
          <Command className="h-2.5 w-2.5" />K
        </kbd>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1 sm:gap-1.5 ml-auto">
        {/* Upload button */}
        <Button
          asChild
          size="sm"
          className="hidden h-8 gap-1 sm:gap-1.5 rounded-lg px-2 sm:px-3 text-xs font-medium shadow-sm md:inline-flex"
        >
          <Link to="/dashboard/files">
            <Upload className="h-3.5 w-3.5" />
            Upload
          </Link>
        </Button>

        {/* Divider */}
        <div className="mx-1 hidden h-4 w-px bg-border/50 md:block" />

        <ThemeToggle />

        <NotificationsPopover />

        {/* User */}
        <UserButton
          appearance={{
            elements: {
              avatarBox: "h-7 w-7 rounded-lg hover:opacity-80 transition-opacity",
            },
          }}
        />
      </div>
    </header>
  );
}
