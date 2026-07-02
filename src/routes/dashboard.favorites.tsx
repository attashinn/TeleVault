import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Star, Download, MoreVertical, FileText, FolderOpen, ImageIcon, Film, Music, FileIcon, FileArchive, FileCode } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/favorites")({
  component: FavoritesPage,
  head: () => ({ meta: [{ title: "Favorites — TeleVault" }] }),
});

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

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

const getFileIcon = (mimeType: string, filename: string) => {
  if (mimeType === "application/x-directory") return FolderOpen;
  const ext = filename.split(".").pop()?.toLowerCase();
  if (mimeType.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext || "")) return ImageIcon;
  if (mimeType.startsWith("video/") || ["mp4", "mkv", "avi", "mov", "webm"].includes(ext || "")) return Film;
  if (mimeType.startsWith("audio/") || ["mp3", "wav", "ogg", "flac", "m4a"].includes(ext || "")) return Music;
  if (["pdf"].includes(ext || "")) return FileText;
  if (["zip", "rar", "tar", "gz", "7z"].includes(ext || "")) return FileArchive;
  if (["js", "ts", "tsx", "jsx", "html", "css", "json", "py", "go", "cpp", "rs"].includes(ext || "")) return FileCode;
  return FileIcon;
};

const getFileColorClass = (mimeType: string, filename: string) => {
  if (mimeType === "application/x-directory") return "text-brand bg-brand/10 dark:bg-brand/15";
  const ext = filename.split(".").pop()?.toLowerCase();
  if (mimeType.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext || "")) {
    return "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400";
  }
  if (mimeType.startsWith("video/") || ["mp4", "mkv", "avi", "mov", "webm"].includes(ext || "")) {
    return "text-sky-600 bg-sky-50 dark:bg-sky-500/10 dark:text-sky-400";
  }
  if (mimeType.startsWith("audio/") || ["mp3", "wav", "ogg", "flac", "m4a"].includes(ext || "")) {
    return "text-violet-600 bg-violet-50 dark:bg-violet-500/10 dark:text-violet-400";
  }
  if (["pdf"].includes(ext || "")) return "text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400";
  if (["zip", "rar", "tar", "gz", "7z"].includes(ext || "")) return "text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400";
  return "text-muted-foreground bg-accent/60 dark:bg-accent/30";
};

function FavoritesPage() {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("televault-favorites") || "[]");
      setFavorites(stored);
    } catch {}
  }, []);

  // Fetch all files
  const filesQuery = useQuery({
    queryKey: ["files"],
    queryFn: async (): Promise<FileRow[]> => {
      const res = await fetch("/api/files");
      if (!res.ok) throw new Error("Failed to load files");
      const json = (await res.json()) as { files: FileRow[] };
      return json.files;
    },
  });

  const files = filesQuery.data ?? [];

  // Filter files that are in favorites AND not deleted (not starting with 'trash/')
  const favoriteItems = files.filter(
    (f) => favorites.includes(f.id) && !f.filename.startsWith("trash/") && f.mime_type !== "application/x-share-link"
  );

  const handleUnfavorite = (id: string, name: string) => {
    const updated = favorites.filter((x) => x !== id);
    setFavorites(updated);
    localStorage.setItem("televault-favorites", JSON.stringify(updated));
    toast.success(`Removed "${name}" from Favorites`);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Pinned"
        title="Favorites"
        description="Starred files and folders for quick access."
      />

      <div className="mt-6">
        {filesQuery.isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3 px-4 border border-border/40 rounded-2xl bg-surface/20">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-[40%]" />
                  <Skeleton className="h-3 w-[20%]" />
                </div>
                <Skeleton className="h-8 w-8 rounded-xl" />
              </div>
            ))}
          </div>
        ) : favoriteItems.length === 0 ? (
          <EmptyState
            icon={Star}
            title="No favorites yet"
            description="Star any file or folder inside My Files to access it quickly from here."
            action={
              <Button asChild variant="outline" className="rounded-xl">
                <Link to="/dashboard/files">Go to My Files</Link>
              </Button>
            }
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-surface/30 backdrop-blur-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-surface/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3.5 text-left">Name</th>
                  <th className="px-5 py-3.5 text-left">Location</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {favoriteItems.map((f) => {
                  const Icon = getFileIcon(f.mime_type, f.filename);
                  const isFolder = f.mime_type === "application/x-directory";
                  const displayName = f.filename.split("/").filter(Boolean).pop() || "";
                  const location = "/" + f.filename.split("/").slice(0, -1).join("/");
                  const colorClass = getFileColorClass(f.mime_type, f.filename);

                  return (
                    <tr key={f.id} className="group transition-colors hover:bg-accent/40">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleUnfavorite(f.id, displayName)}
                            className="text-amber-500 hover:text-muted-foreground p-1 rounded-lg hover:bg-accent transition-colors cursor-pointer"
                            title="Remove from Favorites"
                          >
                            <Star className="h-4 w-4" fill="currentColor" />
                          </button>
                          <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", colorClass)}>
                            <Icon className="h-5 w-5" strokeWidth={2.25} />
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{displayName}</p>
                            <p className="text-xs text-muted-foreground">
                              {isFolder ? "Directory" : f.mime_type} · {formatBytes(f.size)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground font-mono text-xs">
                        {location === "/" ? "/" : `${location}/`}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          {!isFolder && (
                            <Button asChild variant="ghost" size="icon" className="rounded-xl h-8 w-8 hover:bg-accent">
                              <a href={`/api/files/${f.id}/download`} title="Download">
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
