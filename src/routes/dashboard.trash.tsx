import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, RotateCcw, Trash, FileText, FolderOpen, ImageIcon, Film, Music, FileIcon, FileArchive, FileCode, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/trash")({
  component: TrashPage,
  head: () => ({ meta: [{ title: "Trash — TeleVault" }] }),
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

function TrashPage() {
  const qc = useQueryClient();
  const [itemToDelete, setItemToDelete] = useState<FileRow | null>(null);
  const [emptyTrashOpen, setEmptyTrashOpen] = useState(false);

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

  // Filter items in Trash (starts with 'trash/')
  const trashItems = files.filter((f) => f.filename.startsWith("trash/") && f.mime_type !== "application/x-share-link");

  // Mutation: Restore item (rename to remove 'trash/' prefix)
  const restoreMutation = useMutation({
    mutationFn: async ({ id, filename }: { id: string; filename: string }) => {
      const originalPath = filename.replace(/^trash\//, "");
      const res = await fetch(`/api/files/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: originalPath }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to restore item");
      }
    },
    onSuccess: () => {
      toast.success("Item restored successfully");
      qc.invalidateQueries({ queryKey: ["files"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Mutation: Permanent delete
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/files/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Delete failed");
      }
    },
    onSuccess: () => {
      toast.success("Item permanently deleted");
      qc.invalidateQueries({ queryKey: ["files"] });
      setItemToDelete(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Mutation: Empty Trash (permanently delete all items in trash)
  const emptyTrashMutation = useMutation({
    mutationFn: async () => {
      for (const item of trashItems) {
        await fetch(`/api/files/${item.id}`, { method: "DELETE" });
      }
    },
    onSuccess: () => {
      toast.success("Trash emptied successfully");
      qc.invalidateQueries({ queryKey: ["files"] });
      setEmptyTrashOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleRestore = (item: FileRow) => {
    restoreMutation.mutate({ id: item.id, filename: item.filename });
  };

  const handleDeletePermanently = (item: FileRow) => {
    setItemToDelete(item);
  };

  const executeDeletePermanently = () => {
    if (itemToDelete) {
      deleteMutation.mutate(itemToDelete.id);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Recycle"
        title="Trash"
        description="Items here can be restored or deleted permanently. Virtual folders are handled recursively."
        actions={
          trashItems.length > 0 && (
            <Button 
              variant="destructive" 
              className="rounded-xl cursor-pointer"
              onClick={() => setEmptyTrashOpen(true)}
            >
              <Trash2 className="mr-1.5 h-4 w-4" /> Empty Trash
            </Button>
          )
        }
      />

      <div className="mt-6">
        {filesQuery.isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-3 px-4 border border-border/40 rounded-2xl bg-surface/20">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-[40%]" />
                  <Skeleton className="h-3 w-[20%]" />
                </div>
                <Skeleton className="h-8 w-24 rounded-xl" />
              </div>
            ))}
          </div>
        ) : trashItems.length === 0 ? (
          <EmptyState
            icon={Trash2}
            title="Trash is empty"
            description="Deleted files and folders will appear here for you to restore or permanently delete."
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-surface/30 backdrop-blur-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-surface/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3.5 text-left">Name</th>
                  <th className="px-5 py-3.5 text-left">Original Location</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {trashItems.map((f) => {
                  const Icon = getFileIcon(f.mime_type, f.filename);
                  const isFolder = f.mime_type === "application/x-directory";
                  const displayName = f.filename.replace(/^trash\//, "").split("/").filter(Boolean).pop() || "";
                  const originalLocation = "/" + f.filename.replace(/^trash\//, "").split("/").slice(0, -1).join("/");
                  const colorClass = getFileColorClass(f.mime_type, f.filename);

                  return (
                    <tr key={f.id} className="group transition-colors hover:bg-accent/40">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
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
                        {originalLocation === "/" ? "/" : `${originalLocation}/`}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="rounded-xl gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
                            onClick={() => handleRestore(f)}
                            disabled={restoreMutation.isPending}
                          >
                            <RotateCcw className="h-4 w-4" /> Restore
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="rounded-xl gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                            onClick={() => handleDeletePermanently(f)}
                          >
                            <Trash className="h-4 w-4" /> Delete
                          </Button>
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

      {/* DIALOG: CONFIRM PERMANENT DELETE */}
      <Dialog open={itemToDelete !== null} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <DialogContent className="max-w-sm rounded-2xl border border-border bg-background p-6">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Permanent Delete?
            </DialogTitle>
            <DialogDescription>
              {itemToDelete && (itemToDelete.mime_type === "application/x-directory"
                ? `Permanently delete folder "${itemToDelete.filename.replace(/^trash\//, "").split("/").filter(Boolean).pop()}" and ALL nested files? This action CANNOT be undone.`
                : `Permanently delete "${itemToDelete.filename.replace(/^trash\//, "").split("/").filter(Boolean).pop()}"? This action CANNOT be undone.`
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button variant="ghost" onClick={() => setItemToDelete(null)} className="rounded-xl">
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={executeDeletePermanently}
              disabled={deleteMutation.isPending}
              className="rounded-xl"
            >
              {deleteMutation.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: EMPTY TRASH */}
      <Dialog open={emptyTrashOpen} onOpenChange={setEmptyTrashOpen}>
        <DialogContent className="max-w-sm rounded-2xl border border-border bg-background p-6">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Empty Trash?
            </DialogTitle>
            <DialogDescription>
              Permanently delete all items currently in the Trash? This will permanently free up storage. This action CANNOT be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button variant="ghost" onClick={() => setEmptyTrashOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => emptyTrashMutation.mutate()}
              disabled={emptyTrashMutation.isPending}
              className="rounded-xl"
            >
              {emptyTrashMutation.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Empty Everything
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
