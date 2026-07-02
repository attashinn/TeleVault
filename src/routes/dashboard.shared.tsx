import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Share2,
  Link as LinkIcon,
  Lock,
  Unlock,
  Clock,
  Copy,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  FolderOpen,
  ImageIcon,
  Film,
  Music,
  FileIcon,
  FileArchive,
  FileCode,
  Download,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/shared")({
  component: SharedPage,
  head: () => ({ meta: [{ title: "Shared Links — TeleVault" }] }),
});

interface ShareLink {
  id: string;
  token: string;
  fileId: string;
  downloadsCount: number;
  createdDate: string;
  passwordProtected: boolean;
  expiresAt: string | null;
  revoked: boolean;
  originalName: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    dateStyle: "medium",
  });
}

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

const getFileIcon = (filename: string) => {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext || "")) return ImageIcon;
  if (["mp4", "mkv", "avi", "mov", "webm"].includes(ext || "")) return Film;
  if (["mp3", "wav", "ogg", "flac", "m4a"].includes(ext || "")) return Music;
  if (["pdf"].includes(ext || "")) return FileText;
  if (["zip", "rar", "tar", "gz", "7z"].includes(ext || "")) return FileArchive;
  if (["js", "ts", "tsx", "jsx", "html", "css", "json", "py", "go", "cpp", "rs"].includes(ext || "")) return FileCode;
  return FileIcon;
};

const getFileColorClass = (filename: string): string => {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext || ""))
    return "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400";
  if (["mp4", "mkv", "avi", "mov", "webm"].includes(ext || ""))
    return "text-sky-600 bg-sky-50 dark:bg-sky-500/10 dark:text-sky-400";
  if (["mp3", "wav", "ogg", "flac", "m4a"].includes(ext || ""))
    return "text-violet-600 bg-violet-50 dark:bg-violet-500/10 dark:text-violet-400";
  if (["pdf"].includes(ext || "")) return "text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400";
  if (["zip", "rar", "tar", "gz", "7z"].includes(ext || ""))
    return "text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400";
  return "text-brand bg-brand-muted";
};

function SharedPage() {
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState<ShareLink | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const sharesQuery = useQuery({
    queryKey: ["shares"],
    queryFn: async (): Promise<ShareLink[]> => {
      const res = await fetch("/api/shares");
      if (!res.ok) throw new Error("Failed to load shared links");
      const json = (await res.json()) as { shares: ShareLink[] };
      return json.shares;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/files/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error((json as { error?: string }).error || "Failed to delete share link");
      }
    },
    onSuccess: (_data, id) => {
      const name = confirmDelete?.originalName ?? "link";
      queryClient.setQueryData<ShareLink[]>(["shares"], (old) => old?.filter((s) => s.id !== id) ?? []);
      toast.success(`Share link for "${name}" deleted`);
      setConfirmDelete(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Could not delete share link");
    },
  });

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/share/${token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedToken(token);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopiedToken(null), 2000);
    });
  };

  const activeShares = (sharesQuery.data ?? []).filter((s) => !s.revoked && !isExpired(s.expiresAt));
  const expiredShares = (sharesQuery.data ?? []).filter((s) => s.revoked || isExpired(s.expiresAt));

  return (
    <div className="animate-fade-in">
      <PageHeader
        eyebrow="Sharing"
        title="Shared links"
        description="Manage public links you've created for files. Control access and monitor downloads."
      />

      <div className="mt-6 space-y-6">
        {/* Loading skeleton */}
        {sharesQuery.isLoading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 py-4 px-5 border border-border/40 rounded-2xl bg-surface/20"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-8 w-24 rounded-xl" />
                <Skeleton className="h-8 w-8 rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {sharesQuery.isError && (
          <div className="flex flex-col items-center gap-3 py-12 text-center rounded-2xl border border-destructive/20 bg-destructive/5">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm font-medium text-foreground">Failed to load shared links</p>
            <p className="text-xs text-muted-foreground">{sharesQuery.error?.message}</p>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl mt-1"
              onClick={() => sharesQuery.refetch()}
            >
              Try again
            </Button>
          </div>
        )}

        {/* Empty state */}
        {sharesQuery.isSuccess && (sharesQuery.data ?? []).length === 0 && (
          <EmptyState
            icon={Share2}
            title="No shared links yet"
            description="Create a share link from My Files to let anyone download a file without an account."
          />
        )}

        {/* Active shares table */}
        {sharesQuery.isSuccess && activeShares.length > 0 && (
          <div>
            <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              Active · {activeShares.length}
            </p>
            <div className="overflow-hidden rounded-2xl border border-border bg-surface/30 backdrop-blur-sm">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-surface/50 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                  <tr>
                    <th className="px-5 py-3 text-left">File</th>
                    <th className="hidden px-5 py-3 text-left sm:table-cell">Created</th>
                    <th className="hidden px-5 py-3 text-center md:table-cell">Downloads</th>
                    <th className="hidden px-5 py-3 text-center lg:table-cell">Security</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {activeShares.map((share, i) => {
                    const Icon = getFileIcon(share.originalName);
                    const colorClass = getFileColorClass(share.originalName);
                    const shareUrl = `/share/${share.token}`;
                    const isCopied = copiedToken === share.token;

                    return (
                      <tr
                        key={share.id}
                        className="group animate-slide-up transition-colors hover:bg-accent/40"
                        style={{ animationDelay: `${i * 40}ms`, animationFillMode: "both" }}
                      >
                        {/* File info */}
                        <td className="px-5 py-3.5">
                          <div className="flex min-w-0 items-center gap-3">
                            <div
                              className={cn(
                                "grid h-9 w-9 shrink-0 place-items-center rounded-xl transition-transform duration-150 group-hover:scale-105",
                                colorClass
                              )}
                            >
                              <Icon className="h-4 w-4" strokeWidth={2.25} />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-foreground max-w-[180px]">
                                {share.originalName || "Unnamed file"}
                              </p>
                              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
                                <LinkIcon className="h-2.5 w-2.5 shrink-0" />
                                {share.token}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Created date */}
                        <td className="hidden px-5 py-3.5 text-sm text-muted-foreground sm:table-cell">
                          {formatDate(share.createdDate)}
                          {share.expiresAt && (
                            <p className="flex items-center gap-1 text-[10px] text-amber-500 mt-0.5">
                              <Clock className="h-2.5 w-2.5" /> Expires {formatDate(share.expiresAt)}
                            </p>
                          )}
                        </td>

                        {/* Downloads count */}
                        <td className="hidden px-5 py-3.5 text-center md:table-cell">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/60 px-2.5 py-1 text-[11px] font-medium text-foreground">
                            <Download className="h-3 w-3 text-muted-foreground" />
                            {share.downloadsCount}
                          </span>
                        </td>

                        {/* Security badge */}
                        <td className="hidden px-5 py-3.5 text-center lg:table-cell">
                          {share.passwordProtected ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                              <Lock className="h-2.5 w-2.5" /> Protected
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                              <Unlock className="h-2.5 w-2.5" /> Public
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            {/* Copy link */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-xl hover:bg-accent"
                              onClick={() => copyLink(share.token)}
                              title="Copy share link"
                            >
                              {isCopied ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>

                            {/* Open in new tab */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-xl hover:bg-accent"
                              asChild
                              title="Open share page"
                            >
                              <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>

                            {/* Delete */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-xl hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => setConfirmDelete(share)}
                              title="Delete share link"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Expired / Revoked shares */}
        {sharesQuery.isSuccess && expiredShares.length > 0 && (
          <div>
            <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              Expired / Revoked · {expiredShares.length}
            </p>
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-surface/10 backdrop-blur-sm opacity-60">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-border/40">
                  {expiredShares.map((share) => {
                    const Icon = getFileIcon(share.originalName);
                    const colorClass = getFileColorClass(share.originalName);

                    return (
                      <tr key={share.id} className="group transition-colors hover:bg-accent/20">
                        <td className="px-5 py-3.5">
                          <div className="flex min-w-0 items-center gap-3">
                            <div
                              className={cn(
                                "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
                                colorClass
                              )}
                            >
                              <Icon className="h-4 w-4" strokeWidth={2.25} />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-muted-foreground line-through decoration-muted-foreground/50">
                                {share.originalName || "Unnamed file"}
                              </p>
                              <p className="text-[11px] text-muted-foreground/60">
                                {share.revoked ? "Revoked" : "Expired"} · {formatDate(share.expiresAt || share.createdDate)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-xl hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => setConfirmDelete(share)}
                            title="Delete share link"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <DialogContent className="rounded-3xl max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete share link?</DialogTitle>
            <DialogDescription>
              This will permanently remove the share link for{" "}
              <strong>"{confirmDelete?.originalName}"</strong>. Anyone using this link
              will no longer be able to access the file.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:flex-row">
            <Button
              variant="outline"
              className="rounded-xl flex-1"
              onClick={() => setConfirmDelete(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="rounded-xl flex-1"
              disabled={deleteMutation.isPending}
              onClick={() => confirmDelete && deleteMutation.mutate(confirmDelete.id)}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Deleting…
                </>
              ) : (
                <>
                  <Trash2 className="mr-1.5 h-4 w-4" /> Delete link
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
