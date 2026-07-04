import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowUpRight,
  Clock,
  FileArchive,
  FileCode,
  FileIcon,
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
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
});

// ── Types ─────────────────────────────────────────────────────────────────────

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

// ── Helpers ───────────────────────────────────────────────────────────────────

const STORAGE_LIMIT_BYTES = 35 * 1024 * 1024 * 1024;

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

function getFileIcon(mimeType: string, filename: string) {
  if (mimeType === "application/x-directory") return FolderOpen;
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (mimeType.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return ImageIcon;
  if (mimeType.startsWith("video/") || ["mp4", "mkv", "avi", "mov", "webm"].includes(ext)) return Film;
  if (mimeType.startsWith("audio/") || ["mp3", "wav", "ogg", "flac", "m4a"].includes(ext)) return Music;
  if (ext === "pdf") return FileText;
  if (["zip", "rar", "tar", "gz", "7z"].includes(ext)) return FileArchive;
  if (["js", "ts", "tsx", "jsx", "html", "css", "json", "py", "go", "cpp", "rs"].includes(ext)) return FileCode;
  return FileIcon;
}

function getFileDot(mimeType: string, filename: string): string {
  if (mimeType === "application/x-directory") return "bg-brand";
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (mimeType.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return "bg-emerald-500";
  if (mimeType.startsWith("video/") || ["mp4", "mkv", "avi", "mov", "webm"].includes(ext)) return "bg-sky-500";
  if (mimeType.startsWith("audio/") || ["mp3", "wav", "ogg", "flac", "m4a"].includes(ext)) return "bg-violet-500";
  if (ext === "pdf") return "bg-rose-500";
  if (["zip", "rar", "tar", "gz", "7z"].includes(ext)) return "bg-amber-500";
  return "bg-muted-foreground/40";
}

function getFileIconClass(mimeType: string, filename: string): string {
  if (mimeType === "application/x-directory") return "text-brand bg-brand/10";
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
  return "text-muted-foreground bg-muted/60";
}

// ── Skeletons ─────────────────────────────────────────────────────────────────

function StatSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-background/95 p-3.5 shadow-sm">
      <Skeleton className="h-8 w-8 rounded-lg mb-2" />
      <Skeleton className="h-2 w-14 mb-1.5" />
      <Skeleton className="h-7 w-16" />
    </div>
  );
}

function RowSkeleton() {
  return (
    <li className="flex items-center gap-2.5 px-4 py-2">
      <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
      <div className="flex-1 space-y-1">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-2 w-20" />
      </div>
      <Skeleton className="hidden h-2 w-12 sm:block" />
      <Skeleton className="hidden h-2 w-14 sm:block" />
    </li>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

function DashboardHome() {
  const queryClient = useQueryClient();
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    try {
      setFavorites(JSON.parse(localStorage.getItem("televault-favorites") || "[]"));
    } catch {}
  }, []);

  const { data: allFiles, isLoading, isError, error, dataUpdatedAt } = useQuery({
    queryKey: ["files"],
    queryFn: async (): Promise<FileRow[]> => {
      const res = await fetch("/api/files");
      if (!res.ok) throw new Error("Failed to load files");
      const json = (await res.json()) as { files: FileRow[] };
      return json.files;
    },
    refetchInterval: 30_000,
    staleTime: 10_000,
  });

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

  const recentFiles = [...activeFiles]
    .sort((a, b) => new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime())
    .slice(0, 8);

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  const statCards = [
    {
      label: "Total Storage",
      value: formatBytes(totalBytes),
      sub: `of ${formatBytes(STORAGE_LIMIT_BYTES)}`,
      icon: HardDrive,
      color: "text-brand",
      bg: "bg-brand/10",
      dot: "bg-brand",
    },
    {
      label: "All Files",
      value: activeFiles.length.toLocaleString(),
      sub: formatBytes(totalBytes),
      icon: FileType,
      color: "text-sky-500",
      bg: "bg-sky-500/10",
      dot: "bg-sky-500",
    },
    {
      label: "Images",
      value: imageFiles.length.toLocaleString(),
      sub: formatBytes(imageFiles.reduce((s, f) => s + f.size, 0)),
      icon: ImageIcon,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      dot: "bg-emerald-500",
    },
    {
      label: "Videos",
      value: videoFiles.length.toLocaleString(),
      sub: formatBytes(videoFiles.reduce((s, f) => s + f.size, 0)),
      icon: Film,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
      dot: "bg-violet-500",
    },
    {
      label: "Documents",
      value: docFiles.length.toLocaleString(),
      sub: formatBytes(docFiles.reduce((s, f) => s + f.size, 0)),
      icon: FileText,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      dot: "bg-amber-500",
    },
  ] as const;

  return (
    <div className="animate-fade-in space-y-3">
      {/* Header */}
      <PageHeader
        eyebrow="Overview"
        title="Welcome back"
        description="Live overview of your workspace."
        actions={
          <div className="flex flex-col gap-2 xs:flex-row items-stretch xs:items-center xs:gap-2">
            {lastUpdated && (
              <span className="hidden items-center gap-1 text-[10px] xs:text-xs text-muted-foreground xs:flex">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {lastUpdated}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-lg border-border/60 text-xs"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["files"] })}
            >
              <RefreshCw className="mr-1 xs:mr-1.5 h-3 w-3" />
              <span className="hidden xs:inline">Refresh</span>
            </Button>
            <Button asChild size="sm" className="h-8 rounded-lg text-xs">
              <Link to="/dashboard/files">
                <Upload className="mr-1 xs:mr-1.5 h-3 w-3" />
                <span className="hidden xs:inline">Upload</span>
              </Link>
            </Button>
          </div>
        }
      />

      <section className="mb-1 overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-brand/10 via-background to-background px-4 py-3 shadow-sm sm:px-5">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand">At a glance</p>
            <h2 className="mt-0.5 text-lg font-bold tracking-tight text-foreground">
              Your workspace is ready.
            </h2>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-background/80 px-2.5 py-1.5 text-xs font-medium text-foreground shadow-sm">
            <HardDrive className="h-3.5 w-3.5 text-brand" />
            <span>{isLoading ? "Loading" : `${formatBytes(totalBytes)} used`}</span>
          </div>
        </div>
      </section>

      {/* Error */}
      {isError && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1">Failed: {(error as Error)?.message}</span>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-6 rounded-lg text-xs text-destructive hover:bg-destructive/10"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["files"] })}
          >
            Retry
          </Button>
        </div>
      )}

      {/* ── Stat cards ── */}
      <section
        className="grid grid-cols-2 gap-2 xs:gap-2.5 sm:grid-cols-3 lg:grid-cols-5"
        aria-label="Storage overview"
      >
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => <StatSkeleton key={i} />)
          : statCards.map((s, i) => (
              <div
                key={s.label}
                className="group rounded-xl border border-border/60 bg-background/95 p-3.5 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-soft animate-slide-up"
                style={{ animationDelay: `${i * 30}ms`, animationFillMode: "both" }}
              >
                <div className={cn("mb-2 grid h-8 w-8 place-items-center rounded-lg", s.bg)}>
                  <s.icon className={cn("h-4 w-4", s.color)} strokeWidth={2.5} />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-foreground">
                  {s.value}
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground/80">{s.sub}</p>
              </div>
            ))}
      </section>

      {/* ── Main content: recent files + sidebar ── */}
      <section
        className="grid gap-2.5 xs:gap-3 lg:grid-cols-[1fr_280px]"
        aria-label="Files and quick access"
      >
        {/* Recent files */}
        <div
          className="overflow-hidden rounded-xl border border-border/60 bg-background/95 shadow-sm animate-slide-up"
          style={{ animationDelay: "280ms", animationFillMode: "both" }}
        >
          {/* Card header */}
          <div className="flex items-center justify-between border-b border-border/50 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground/70" />
              <h2 className="text-sm font-bold">Recent files</h2>
            </div>
            <Link
              to="/dashboard/recent"
              className="flex items-center gap-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              View all
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Column headers */}
          <div className="hidden grid-cols-[minmax(0,1fr)_80px_100px_32px] sm:grid-cols-[minmax(0,1fr)_100px_100px_32px] items-center gap-2 sm:gap-3 border-b border-border/30 px-3 sm:px-4 py-1.5 sm:grid">
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Name</span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Size</span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Uploaded</span>
            <span />
          </div>

          {isLoading ? (
            <ul role="list">
              {Array.from({ length: 6 }).map((_, i) => <RowSkeleton key={i} />)}
            </ul>
          ) : recentFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-2 grid h-12 w-12 place-items-center rounded-lg bg-muted/70 text-muted-foreground">
                <FolderOpen className="h-6 w-6" strokeWidth={1.5} />
              </div>
              <p className="text-base font-semibold text-foreground">No files yet</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Upload your first file to get started.</p>
              <Button asChild size="sm" className="mt-3 h-7 rounded-lg text-xs font-medium">
                <Link to="/dashboard/files">
                  <Upload className="mr-1.5 h-3 w-3" />
                  Upload file
                </Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-border/40" role="list">
              {recentFiles.map((f, i) => {
                const Icon = getFileIcon(f.mime_type, f.filename);
                const iconClass = getFileIconClass(f.mime_type, f.filename);
                const dot = getFileDot(f.mime_type, f.filename);
                const displayName = f.filename.split("/").filter(Boolean).pop() || f.filename;

                return (
                  <li
                    key={f.id}
                    className="group grid grid-cols-[minmax(0,1fr)_32px] items-center gap-2.5 px-4 py-2 transition-colors hover:bg-muted/40 sm:grid-cols-[minmax(0,1fr)_100px_100px_32px] animate-slide-up"
                    style={{ animationDelay: `${i * 20 + 280}ms`, animationFillMode: "both" }}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg", iconClass)}>
                        <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold leading-tight text-foreground">
                          {displayName}
                        </p>
                        <div className="mt-0.5 flex items-center gap-1">
                          <span className={cn("inline-block h-1.5 w-1.5 rounded-full", dot)} />
                          <p className="truncate text-[10px] text-muted-foreground/80">
                            {f.mime_type}
                          </p>
                        </div>
                      </div>
                    </div>
                    <span className="hidden text-sm font-semibold tabular-nums text-foreground sm:block">
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
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Right panel */}
        <div className="space-y-3">
          {/* Quick access */}
          <div
            className="rounded-xl border border-border/60 bg-background/95 p-3 shadow-sm animate-slide-up"
            style={{ animationDelay: "320ms", animationFillMode: "both" }}
          >
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-bold">Quick access</h2>
              <Link
                to="/dashboard/files"
                className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                All files
              </Link>
            </div>
            <ul className="grid grid-cols-1 xs:grid-cols-2 gap-1.5 xs:gap-2" role="list">
              {[
                { name: "My Files", meta: `${activeFiles.length} files`, icon: FolderOpen, to: "/dashboard/files" },
                { name: "Shared", meta: `${shareLinks.length} links`, icon: Share2, to: "/dashboard/shared" },
                { name: "Favorites", meta: `${favorites.length} starred`, icon: Star, to: "/dashboard/favorites" },
                { name: "Folders", meta: `${folders.length} folders`, icon: FolderOpen, to: "/dashboard/files" },
              ].map((q) => (
                <li key={q.name}>
                  <Link
                    to={q.to}
                    className="group flex flex-col gap-1.5 rounded-lg border border-border/60 bg-muted/40 px-2.5 py-2.5 transition-all hover:border-brand/30 hover:bg-muted/70"
                  >
                    <div className="grid h-7 w-7 place-items-center rounded-lg bg-background text-muted-foreground border border-border/60 transition-colors group-hover:text-brand group-hover:border-brand/30">
                      <q.icon className="h-3.5 w-3.5" strokeWidth={2} />
                    </div>
                    <div>
                      <p className="text-[12px] font-bold leading-tight text-foreground">{q.name}</p>
                      {isLoading ? (
                        <Skeleton className="mt-0.5 h-2 w-10" />
                      ) : (
                        <p className="mt-0.5 text-[9px] text-muted-foreground/80 font-medium">{q.meta}</p>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Storage */}
          <div
            className="rounded-xl border border-border/60 bg-background p-4 animate-slide-up"
            style={{ animationDelay: "380ms", animationFillMode: "both" }}
          >
            <div className="mb-3 flex items-center gap-2.5">
              <div className="grid h-7 w-7 place-items-center rounded-lg bg-brand/10 text-brand">
                <HardDrive className="h-3.5 w-3.5" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold leading-tight">Storage</p>
                {isLoading ? (
                  <Skeleton className="mt-1 h-2.5 w-24" />
                ) : (
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {formatBytes(totalBytes)} of {formatBytes(STORAGE_LIMIT_BYTES)}
                  </p>
                )}
              </div>
              <span className="ml-auto text-[11px] tabular-nums text-muted-foreground">
                {storagePercent.toFixed(0)}%
              </span>
            </div>
            {isLoading ? (
              <Skeleton className="h-1 w-full rounded-full" />
            ) : (
              <Progress value={storagePercent} className="h-1" />
            )}
            <Button
              asChild
              size="sm"
              variant="secondary"
              className="mt-3 w-full h-7 rounded-lg text-xs hover:bg-brand hover:text-brand-foreground transition-colors"
            >
              <Link to="/dashboard/files">
                <Upload className="mr-1.5 h-3 w-3" />
                Upload more files
              </Link>
            </Button>
          </div>

          {/* Trash */}
          <div
            className="rounded-xl border border-border/60 bg-background p-4 animate-slide-up"
            style={{ animationDelay: "420ms", animationFillMode: "both" }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="h-[14px] w-[14px] text-muted-foreground/60" />
                <h2 className="text-sm font-semibold">Trash</h2>
              </div>
              <Link
                to="/dashboard/trash"
                className="flex items-center gap-0.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Open <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="mt-3">
              {isLoading ? (
                <Skeleton className="h-3 w-28" />
              ) : trashFiles.length === 0 ? (
                <p className="text-[12px] text-muted-foreground">Trash is empty.</p>
              ) : (
                <p className="text-[12px] text-muted-foreground">
                  <span className="font-semibold text-foreground">{trashFiles.length}</span>{" "}
                  {trashFiles.length === 1 ? "file" : "files"} ·{" "}
                  {formatBytes(trashFiles.reduce((s, f) => s + f.size, 0))}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
