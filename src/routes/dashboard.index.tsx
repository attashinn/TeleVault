import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Clock,
  FileText,
  FileType,
  Film,
  FolderOpen,
  HardDrive,
  Image as ImageIcon,
  MoreHorizontal,
  Music,
  RefreshCw,
  Share2,
  Star,
  Trash2,
  Upload,
  FileIcon,
  FileArchive,
  FileCode,
  AlertCircle,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import DotCard from "@/components/ui/moving-dot-card";


export const Route = createFileRoute("/dashboard/")(({
  component: DashboardHome,
}));

// ── Types ────────────────────────────────────────────────────────────────────

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

// ── Helpers ──────────────────────────────────────────────────────────────────

const STORAGE_LIMIT_BYTES = 35 * 1024 * 1024 * 1024; // 35 GB per user

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function formatRelative(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return "yesterday";
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" });
}

const getFileIcon = (mimeType: string, filename: string) => {
  if (mimeType === "application/x-directory") return FolderOpen;
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (mimeType.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return ImageIcon;
  if (mimeType.startsWith("video/") || ["mp4", "mkv", "avi", "mov", "webm"].includes(ext)) return Film;
  if (mimeType.startsWith("audio/") || ["mp3", "wav", "ogg", "flac", "m4a"].includes(ext)) return Music;
  if (ext === "pdf") return FileText;
  if (["zip", "rar", "tar", "gz", "7z"].includes(ext)) return FileArchive;
  if (["js", "ts", "tsx", "jsx", "html", "css", "json", "py", "go", "cpp", "rs"].includes(ext)) return FileCode;
  return FileIcon;
};

const getFileColorClass = (mimeType: string, filename: string): string => {
  if (mimeType === "application/x-directory") return "text-brand bg-brand-muted";
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (mimeType.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext))
    return "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400";
  if (mimeType.startsWith("video/") || ["mp4", "mkv", "avi", "mov", "webm"].includes(ext))
    return "text-sky-600 bg-sky-50 dark:bg-sky-500/10 dark:text-sky-400";
  if (mimeType.startsWith("audio/") || ["mp3", "wav", "ogg", "flac", "m4a"].includes(ext))
    return "text-violet-600 bg-violet-50 dark:bg-violet-500/10 dark:text-violet-400";
  if (ext === "pdf") return "text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400";
  if (["zip", "rar", "tar", "gz", "7z"].includes(ext))
    return "text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400";
  return "text-muted-foreground bg-accent/60";
};

// ── Skeleton Loaders ─────────────────────────────────────────────────────────

function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-9 rounded-xl" />
        <Skeleton className="h-6 w-6 rounded-lg" />
      </div>
      <Skeleton className="mt-4 h-3 w-20" />
      <Skeleton className="mt-2 h-7 w-16" />
      <Skeleton className="mt-4 h-1 w-full" />
    </div>
  );
}

function FileRowSkeleton() {
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_40px] items-center gap-4 px-5 py-3 sm:grid-cols-[minmax(0,1fr)_140px_120px_40px]">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-3.5 w-40" />
          <Skeleton className="h-2.5 w-24" />
        </div>
      </div>
      <Skeleton className="hidden h-3 w-16 sm:block" />
      <Skeleton className="hidden h-3 w-20 sm:block" />
      <Skeleton className="h-7 w-7 rounded-lg" />
    </li>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

function DashboardHome() {
  const queryClient = useQueryClient();
  const [favorites, setFavorites] = useState<string[]>([]);

  // Load favorites from localStorage (client only)
  useEffect(() => {
    try {
      setFavorites(JSON.parse(localStorage.getItem("televault-favorites") || "[]"));
    } catch {}
  }, []);

  // Fetch all files
  const { data: allFiles, isLoading, isError, error, dataUpdatedAt } = useQuery({
    queryKey: ["files"],
    queryFn: async (): Promise<FileRow[]> => {
      const res = await fetch("/api/files");
      if (!res.ok) throw new Error("Failed to load files");
      const json = (await res.json()) as { files: FileRow[] };
      return json.files;
    },
    refetchInterval: 30_000, // Auto-refresh every 30s
    staleTime: 10_000,
  });

  // ── Derived stats ──────────────────────────────────────────────────────────
  const activeFiles = (allFiles ?? []).filter(
    (f) =>
      f.mime_type !== "application/x-share-link" &&
      f.mime_type !== "application/x-directory" &&
      !f.filename.startsWith("trash/"),
  );

  const trashFiles = (allFiles ?? []).filter(
    (f) => f.filename.startsWith("trash/") && f.mime_type !== "application/x-share-link",
  );

  const shareLinks = (allFiles ?? []).filter((f) => f.mime_type === "application/x-share-link");
  const folders = (allFiles ?? []).filter(
    (f) => f.mime_type === "application/x-directory" && !f.filename.startsWith("trash/"),
  );

  const totalBytes = activeFiles.reduce((s, f) => s + f.size, 0);
  const storagePercent = Math.min((totalBytes / STORAGE_LIMIT_BYTES) * 100, 100);

  const imageFiles = activeFiles.filter((f) => {
    const ext = f.filename.split(".").pop()?.toLowerCase() ?? "";
    return f.mime_type.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext);
  });
  const videoFiles = activeFiles.filter((f) => {
    const ext = f.filename.split(".").pop()?.toLowerCase() ?? "";
    return f.mime_type.startsWith("video/") || ["mp4", "mkv", "avi", "mov", "webm"].includes(ext);
  });
  const docFiles = activeFiles.filter((f) => {
    const ext = f.filename.split(".").pop()?.toLowerCase() ?? "";
    return (
      f.mime_type.startsWith("text/") ||
      f.mime_type.includes("pdf") ||
      f.mime_type.includes("document") ||
      ["pdf", "doc", "docx", "txt", "md", "odt"].includes(ext)
    );
  });

  const imageBytes = imageFiles.reduce((s, f) => s + f.size, 0);
  const videoBytes = videoFiles.reduce((s, f) => s + f.size, 0);
  const docBytes = docFiles.reduce((s, f) => s + f.size, 0);

  const storageCards = [
    {
      label: "Total Storage",
      target: totalBytes,
      format: formatBytes,
      hint: `of ${formatBytes(STORAGE_LIMIT_BYTES)}`,
      icon: HardDrive,
      progress: storagePercent,
      tone: "text-brand bg-brand-muted",
    },
    {
      label: "Files",
      target: activeFiles.length,
      format: (val: number) => val.toLocaleString(),
      hint: formatBytes(totalBytes),
      icon: FileType,
      progress: Math.min((activeFiles.length / Math.max(activeFiles.length, 1)) * 100, 100),
      tone: "text-sky-600 bg-sky-100 dark:bg-sky-500/15 dark:text-sky-300",
    },
    {
      label: "Images",
      target: imageFiles.length,
      format: (val: number) => val.toLocaleString(),
      hint: formatBytes(imageBytes),
      icon: ImageIcon,
      progress: Math.min((imageBytes / Math.max(totalBytes, 1)) * 100, 100),
      tone: "text-emerald-600 bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300",
    },
    {
      label: "Videos",
      target: videoFiles.length,
      format: (val: number) => val.toLocaleString(),
      hint: formatBytes(videoBytes),
      icon: Film,
      progress: Math.min((videoBytes / Math.max(totalBytes, 1)) * 100, 100),
      tone: "text-rose-600 bg-rose-100 dark:bg-rose-500/15 dark:text-rose-300",
    },
    {
      label: "Documents",
      target: docFiles.length,
      format: (val: number) => val.toLocaleString(),
      hint: formatBytes(docBytes),
      icon: FileText,
      progress: Math.min((docBytes / Math.max(totalBytes, 1)) * 100, 100),
      tone: "text-amber-600 bg-amber-100 dark:bg-amber-500/15 dark:text-amber-300",
    },
  ] as const;

  const recentFiles = [...activeFiles]
    .sort((a, b) => new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime())
    .slice(0, 6);

  const quickAccess = [
    {
      name: "My Files",
      meta: `${activeFiles.length} files`,
      icon: FolderOpen,
      to: "/dashboard/files",
    },
    {
      name: "Shared Links",
      meta: `${shareLinks.length} links`,
      icon: Share2,
      to: "/dashboard/shared",
    },
    {
      name: "Favorites",
      meta: `${favorites.length} starred`,
      icon: Star,
      to: "/dashboard/favorites",
    },
    {
      name: "Folders",
      meta: `${folders.length} folders`,
      icon: FolderOpen,
      to: "/dashboard/files",
    },
  ];

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Overview"
        title="Welcome back"
        description="Here's a live overview of your workspace."
        actions={
          <>
            {lastUpdated && (
              <span className="hidden items-center gap-1.5 text-xs text-muted-foreground md:flex">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Updated {lastUpdated}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl h-9 text-sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["files"] })}
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Refresh
            </Button>
            <Button asChild className="rounded-xl h-9 text-sm">
              <Link to="/dashboard/files">
                <Upload className="mr-1.5 h-4 w-4" />
                Upload
              </Link>
            </Button>
          </>
        }
      />

      {/* Error State */}
      {isError && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive animate-slide-down">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Failed to load workspace data: {(error as Error)?.message}</span>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto rounded-lg h-7 text-xs text-destructive hover:bg-destructive/10"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["files"] })}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Storage cards — staggered slide-up */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5" aria-label="Storage overview">
        {isLoading
          ? [...Array(5)].map((_, i) => <StatCardSkeleton key={i} />)
          : storageCards.map((s, i) => (
              <DotCard
                key={s.label}
                label={s.label}
                target={s.target}
                format={s.format}
                hint={s.hint}
                icon={s.icon}
                iconClass={s.tone}
                progress={s.progress}
                className="animate-slide-up"
                style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
                duration={1500}
              />
            ))}
      </section>

      {/* Recent files + Quick access */}
      <section className="mt-8 grid gap-5 lg:grid-cols-[1fr_300px]" aria-label="Recent files and quick access">
        {/* Recent files table */}
        <div
          className="rounded-2xl border border-border bg-surface shadow-soft overflow-hidden animate-slide-up"
          style={{ animationDelay: "320ms", animationFillMode: "both" }}
        >
          <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <h2 className="text-sm font-semibold tracking-tight">Recent files</h2>
            </div>
            <Link
              to="/dashboard/recent"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Table header */}
          <div className="hidden grid-cols-[minmax(0,1fr)_140px_120px_40px] gap-4 border-b border-border/50 px-5 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 sm:grid">
            <span>Name</span>
            <span>Size</span>
            <span>Uploaded</span>
            <span />
          </div>

          {isLoading ? (
            <ul className="divide-y divide-border/60" role="list">
              {[...Array(5)].map((_, i) => (
                <FileRowSkeleton key={i} />
              ))}
            </ul>
          ) : recentFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-muted/60 text-muted-foreground mb-3">
                <FolderOpen className="h-6 w-6" strokeWidth={1.5} />
              </div>
              <p className="text-sm font-semibold text-foreground">No files yet</p>
              <p className="mt-1 text-xs text-muted-foreground max-w-xs">
                Upload your first file to get started.
              </p>
              <Button asChild size="sm" className="mt-4 rounded-xl">
                <Link to="/dashboard/files">
                  <Upload className="mr-1.5 h-3.5 w-3.5" />
                  Upload file
                </Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-border/60" role="list">
              {recentFiles.map((f, i) => {
                const Icon = getFileIcon(f.mime_type, f.filename);
                const colorClass = getFileColorClass(f.mime_type, f.filename);
                const displayName = f.filename.split("/").filter(Boolean).pop() || f.filename;

                return (
                  <li
                    key={f.id}
                    className="group grid grid-cols-[minmax(0,1fr)_40px] items-center gap-4 px-5 py-3 transition-colors hover:bg-accent/40 sm:grid-cols-[minmax(0,1fr)_140px_120px_40px] animate-slide-up"
                    style={{ animationDelay: `${i * 30 + 350}ms`, animationFillMode: "both" }}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={cn(
                          "grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-transform duration-150 group-hover:scale-105",
                          colorClass,
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
                        <p className="truncate text-[11px] text-muted-foreground">{f.mime_type}</p>
                      </div>
                    </div>
                    <span className="hidden text-sm text-muted-foreground sm:block">
                      {formatBytes(f.size)}
                    </span>
                    <span className="hidden text-sm text-muted-foreground sm:block">
                      {formatRelative(f.upload_date)}
                    </span>
                    <button
                      type="button"
                      className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground opacity-0 transition-all hover:bg-accent hover:text-foreground group-hover:opacity-100"
                      aria-label={`More options for ${displayName}`}
                    >
                      <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Quick Access */}
          <div
            className="rounded-2xl border border-border bg-surface p-5 shadow-soft animate-slide-up"
            style={{ animationDelay: "380ms", animationFillMode: "both" }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-tight">Quick access</h2>
              <Link
                to="/dashboard/files"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                All files
              </Link>
            </div>
            <ul className="grid grid-cols-2 gap-2.5" role="list">
              {quickAccess.map((q) => (
                <li key={q.name}>
                  <Link
                    to={q.to}
                    className="group flex flex-col gap-2.5 rounded-xl border border-border bg-background/60 p-3 transition-all duration-150 hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-muted text-brand transition-transform duration-150 group-hover:scale-110">
                      <q.icon className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold leading-tight">{q.name}</p>
                      {isLoading ? (
                        <Skeleton className="mt-1 h-2.5 w-12" />
                      ) : (
                        <p className="text-[10px] text-muted-foreground mt-0.5">{q.meta}</p>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Storage breakdown */}
          <div
            className="rounded-2xl border border-border bg-surface p-5 shadow-soft animate-slide-up"
            style={{ animationDelay: "420ms", animationFillMode: "both" }}
          >
            <div className="flex items-center gap-2.5 mb-4">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-brand-muted text-brand">
                <HardDrive className="h-3.5 w-3.5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">Storage</p>
                {isLoading ? (
                  <Skeleton className="mt-1 h-3 w-28" />
                ) : (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatBytes(totalBytes)} of {formatBytes(STORAGE_LIMIT_BYTES)} used
                  </p>
                )}
              </div>
            </div>
            {isLoading ? (
              <Skeleton className="h-1.5 w-full rounded-full" />
            ) : (
              <Progress value={storagePercent} className="h-1" aria-label={`${storagePercent.toFixed(1)}% storage used`} />
            )}
            <Button
              asChild
              size="sm"
              variant="secondary"
              className="mt-4 w-full rounded-lg text-xs h-7 hover:bg-brand hover:text-brand-foreground transition-colors"
            >
              <Link to="/dashboard/files">
                <Upload className="mr-1.5 h-3 w-3" />
                Upload more files
              </Link>
            </Button>
          </div>

          {/* Trash snapshot */}
          <div
            className="rounded-2xl border border-border bg-surface p-5 shadow-soft animate-slide-up"
            style={{ animationDelay: "460ms", animationFillMode: "both" }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold tracking-tight">Trash</h2>
              </div>
              <Link
                to="/dashboard/trash"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Open <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
            {isLoading ? (
              <Skeleton className="h-4 w-28" />
            ) : trashFiles.length === 0 ? (
              <p className="text-xs text-muted-foreground">Trash is empty.</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{trashFiles.length}</span>{" "}
                {trashFiles.length === 1 ? "file" : "files"} in trash ·{" "}
                {formatBytes(trashFiles.reduce((s, f) => s + f.size, 0))}
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
