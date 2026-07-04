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
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Progress } from "@/components/ui/progress";
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

const STORAGE_LIMIT_BYTES = 35 * 1024 * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

const primary = [
  { to: "/dashboard", label: "Home", icon: Home },
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

export function AppSidebar({ onClose }: { onClose?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

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
  const storageLabel = `${formatBytes(totalBytes)} / ${formatBytes(STORAGE_LIMIT_BYTES)}`;

  return (
    <aside className="w-full h-full flex flex-col border-r border-border/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.95))] dark:bg-[linear-gradient(180deg,rgba(16,24,40,0.98),rgba(10,15,26,0.98))] overflow-y-auto shrink-0">
      {/* Logo */}
      <div className="flex h-[62px] items-center border-b border-border/70 bg-background/70 px-4 backdrop-blur">
        <Link
          to="/"
          className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Logo />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-5" aria-label="Sidebar">
        <NavGroup label="Workspace" items={primary} pathname={pathname} />
        <NavGroup label="General" items={secondary} pathname={pathname} />
      </nav>

      {/* Storage widget */}
      <div className="mx-3 mb-4 rounded-2xl border border-border/70 bg-gradient-to-br from-brand/12 via-background to-accent/70 p-3.5 shadow-soft">
        <div className="mb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-6 w-6 place-items-center rounded-md bg-brand/10 text-brand">
              <HardDrive className="h-3 w-3" strokeWidth={2.5} />
            </div>
            <span className="text-xs font-medium text-foreground">Storage</span>
          </div>
          <span className="text-[10px] tabular-nums text-muted-foreground">
            {storagePercent.toFixed(0)}%
          </span>
        </div>
        <Progress value={storagePercent} className="h-1 mb-2" />
        <p className="text-[10px] text-muted-foreground">{storageLabel}</p>
        <Link
          to="/dashboard/settings"
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-background py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Zap className="h-3 w-3 text-brand" />
          Upgrade plan
        </Link>
      </div>
    </aside>
  );
}

function NavGroup({
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
      <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 select-none">
        {label}
      </p>
      <ul className="space-y-px" role="list">
        {items.map((item) => {
          const active =
            pathname === item.to ||
            (item.to !== "/dashboard" && pathname.startsWith(item.to));
          return (
            <li key={item.to}>
              <Link
                to={item.to}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm outline-none transition-all duration-150",
                  "focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "bg-brand/10 font-medium text-foreground shadow-sm ring-1 ring-brand/20"
                    : "font-normal text-muted-foreground hover:bg-accent/80 hover:text-foreground",
                )}
              >
                <item.icon
                  className={cn(
                    "h-[15px] w-[15px] shrink-0 transition-colors duration-150",
                    active ? "text-brand" : "text-muted-foreground/60 group-hover:text-foreground",
                  )}
                  strokeWidth={active ? 2.25 : 1.75}
                  aria-hidden="true"
                />
                <span className="truncate leading-none">{item.label}</span>
                {active && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
