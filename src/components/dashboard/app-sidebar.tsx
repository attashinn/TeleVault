import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Clock,
  FolderOpen,
  HardDrive,
  Home,
  Settings,
  Share2,
  Star,
  Trash2,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileRow {
  id: string;
  filename: string;
  size: number;
  mime_type: string;
  telegram_message_id: number;
  telegram_file_id: string;
  channel_id: string;
  upload_date: string;
}

const STORAGE_LIMIT_BYTES = 35 * 1024 * 1024 * 1024; // 35 GB per user

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

const primary = [
  { to: "/dashboard", label: "Dashboard", icon: Home },
  { to: "/dashboard/files", label: "My Files", icon: FolderOpen },
  { to: "/dashboard/recent", label: "Recent", icon: Clock },
  { to: "/dashboard/shared", label: "Shared", icon: Share2 },
  { to: "/dashboard/favorites", label: "Favorites", icon: Star },
] as const;

const secondary = [
  { to: "/dashboard/team", label: "Team", icon: Users },
  { to: "/dashboard/trash", label: "Trash", icon: Trash2 },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
] as const;

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Query files to get real-time storage info
  const { data: allFiles } = useQuery({
    queryKey: ["files"],
    queryFn: async (): Promise<FileRow[]> => {
      const res = await fetch("/api/files");
      if (!res.ok) throw new Error("Failed to load files");
      const json = (await res.json()) as { files: FileRow[] };
      return json.files;
    },
    staleTime: 10_000,
  });

  const activeFiles = (allFiles ?? []).filter(
    (f) =>
      f.mime_type !== "application/x-share-link" &&
      f.mime_type !== "application/x-directory" &&
      !f.filename.startsWith("trash/"),
  );

  const totalBytes = activeFiles.reduce((s, f) => s + f.size, 0);
  const storagePercent = Math.min((totalBytes / STORAGE_LIMIT_BYTES) * 100, 100);

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface/60 backdrop-blur-sm lg:flex">
      {/* Logo */}
      <div className="flex h-16 items-center px-5 border-b border-border/50">
        <Link to="/" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg">
          <Logo />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4" aria-label="Sidebar navigation">
        <SidebarSection label="Workspace" items={primary} pathname={pathname} />
        <SidebarSection label="General" items={secondary} pathname={pathname} />
      </nav>

      {/* Storage widget */}
      <div className="m-3 rounded-2xl border border-border bg-gradient-to-br from-surface to-surface-elevated p-4 shadow-soft">
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-muted text-brand">
            <HardDrive className="h-3.5 w-3.5" strokeWidth={2.25} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground leading-tight">Storage</p>
            <p className="text-[11px] text-muted-foreground leading-tight mt-0.5 truncate">
              {formatBytes(totalBytes)} of {formatBytes(STORAGE_LIMIT_BYTES)}
            </p>
          </div>
        </div>
        <Progress value={storagePercent} className="mt-3 h-1" />
        <Button
          size="sm"
          variant="secondary"
          className="mt-3 w-full rounded-lg text-xs h-7 font-medium hover:bg-brand hover:text-brand-foreground transition-colors"
          asChild
        >
          <Link to="/dashboard/settings">Upgrade plan</Link>
        </Button>
      </div>
    </aside>
  );
}

function SidebarSection({
  label,
  items,
  pathname,
}: {
  label: string;
  items: readonly { to: string; label: string; icon: LucideIcon }[];
  pathname: string;
}) {
  return (
    <div>
      <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 select-none">
        {label}
      </p>
      <ul className="space-y-0.5" role="list">
        {items.map((item) => {
          const active = pathname === item.to || (item.to !== "/dashboard" && pathname.startsWith(item.to));
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium outline-none",
                  "transition-all duration-150 ease-out",
                  "focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "bg-accent text-foreground shadow-soft"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                )}
              >
                {/* Active indicator bar */}
                {active && (
                  <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r-full bg-brand animate-scale-in" />
                )}
                <item.icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-all duration-150",
                    active
                      ? "text-brand"
                      : "text-muted-foreground/70 group-hover:text-foreground group-hover:scale-110",
                  )}
                  strokeWidth={active ? 2.25 : 2}
                  aria-hidden="true"
                />
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
