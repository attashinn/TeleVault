import { Bell, Command, Search, Upload, ChevronDown, User, Settings, LogOut, Moon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserButton } from "@clerk/tanstack-react-start";
import { cn } from "@/lib/utils";

export function TopNav() {
  const searchRef = useRef<HTMLInputElement>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [hasNotifications] = useState(true);

  // ⌘K / Ctrl+K → focus search
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
      className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl md:px-6"
      role="banner"
    >
      {/* Search */}
      <div className="relative flex flex-1 items-center">
        <Search
          className={cn(
            "pointer-events-none absolute left-3.5 h-4 w-4 transition-colors duration-150",
            searchFocused ? "text-brand" : "text-muted-foreground",
          )}
          aria-hidden="true"
        />
        <Input
          ref={searchRef}
          placeholder="Search files, folders, and members…"
          className={cn(
            "h-9 max-w-sm rounded-xl border-border bg-muted/40 pl-10 pr-20 text-sm transition-all duration-200",
            "placeholder:text-muted-foreground/60",
            "focus:bg-surface focus:border-brand/40 focus:ring-2 focus:ring-brand/20 focus:max-w-md",
            "hover:bg-muted/60",
          )}
          aria-label="Search files, folders, and members"
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
        <kbd
          className={cn(
            "pointer-events-none absolute right-3 hidden items-center gap-1 rounded-md border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground transition-opacity duration-150 md:flex",
            searchFocused && "opacity-0",
          )}
          aria-label="Press Command K to search"
        >
          <Command className="h-2.5 w-2.5" />K
        </kbd>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        {/* Upload */}
        <Button asChild size="sm" className="hidden h-8 rounded-xl text-xs font-medium md:inline-flex">
          <Link to="/dashboard/files" aria-label="Upload files">
            <Upload className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
            Upload
          </Link>
        </Button>

        <ThemeToggle />

        {/* Notification bell */}
        <Button
          variant="ghost"
          size="icon"
          className="relative h-8 w-8 rounded-xl mr-2"
          aria-label={hasNotifications ? "Notifications (unread)" : "Notifications"}
        >
          <Bell className="h-4 w-4" aria-hidden="true" />
          {hasNotifications && (
            <span
              className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand ring-2 ring-background animate-pulse-ring"
              aria-hidden="true"
            />
          )}
        </Button>

        {/* Clerk User Button */}
        <UserButton
          appearance={{
            elements: {
              avatarBox: "h-8 w-8 rounded-xl hover:opacity-90 transition-opacity",
            },
          }}
        />
      </div>
    </header>
  );
}
