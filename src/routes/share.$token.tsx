import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Download,
  FileText,
  Lock,
  Loader2,
  AlertCircle,
  FileIcon,
  Image as ImageIcon,
  Film,
  Music,
  FileCode,
  FileArchive,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/share/$token")({
  component: PublicSharePage,
  head: () => ({ meta: [{ title: "Download File — TeleVault" }] }),
});

interface ShareInfo {
  id: string;
  token: string;
  passwordRequired: boolean;
  filename: string;
  size: number;
  mimeType: string;
  uploadDate: string;
  downloadsCount: number;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const getFileIcon = (mimeType: string, filename: string) => {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (mimeType.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext || "")) {
    return ImageIcon;
  }
  if (mimeType.startsWith("video/") || ["mp4", "mkv", "avi", "mov", "webm"].includes(ext || "")) {
    return Film;
  }
  if (mimeType.startsWith("audio/") || ["mp3", "wav", "ogg", "flac", "m4a"].includes(ext || "")) {
    return Music;
  }
  if (["pdf"].includes(ext || "")) {
    return FileText;
  }
  if (["zip", "rar", "tar", "gz", "7z"].includes(ext || "")) {
    return FileArchive;
  }
  if (["js", "ts", "tsx", "jsx", "html", "css", "json", "py", "go", "cpp", "rs"].includes(ext || "")) {
    return FileCode;
  }
  return FileIcon;
};

const getFileColorClass = (mimeType: string, filename: string) => {
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
  if (["pdf"].includes(ext || "")) {
    return "text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400";
  }
  if (["zip", "rar", "tar", "gz", "7z"].includes(ext || "")) {
    return "text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400";
  }
  return "text-muted-foreground bg-accent/60 dark:bg-accent/30";
};

function PublicSharePage() {
  const { token } = Route.useParams();
  
  // State
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Query Share Metadata
  const shareQuery = useQuery({
    queryKey: ["share", token],
    queryFn: async (): Promise<ShareInfo> => {
      const res = await fetch(`/api/shares/${token}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Failed to load shared link details");
      }
      return res.json();
    },
    retry: false,
  });

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setPasswordError("");
    setIsDownloading(true);

    try {
      const res = await fetch(`/api/shares/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.status === 401) {
        setPasswordError("Incorrect password. Please try again.");
      } else if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Verification failed");
      } else {
        // Authenticated! Trigger file download directly.
        setUnlocked(true);
        
        // Stream download
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = shareQuery.data?.filename || "downloaded-file";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        
        toast.success("Download started!");
        shareQuery.refetch(); // Invalidate to update downloads count
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to download file");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadNoPassword = async () => {
    setIsDownloading(true);
    try {
      const res = await fetch(`/api/shares/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: "" }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Failed to stream download");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = shareQuery.data?.filename || "downloaded-file";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Download started!");
      shareQuery.refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to download file");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-background relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand/10 dark:bg-brand/5 blur-3xl rounded-full pointer-events-none" />

      <div className="w-full max-w-md z-10 transition-all duration-300">
        <div className="mb-6 flex justify-center">
          <div className="flex items-center gap-2 font-bold text-foreground">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand text-brand-foreground text-xs">TV</span>
            <span>TeleVault Shares</span>
          </div>
        </div>

        {shareQuery.isLoading ? (
          <div className="rounded-3xl border border-border bg-surface/50 backdrop-blur-md p-8 text-center shadow-elevated">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-brand mb-4" />
            <p className="text-sm text-muted-foreground font-medium">Retrieving shared link metadata…</p>
          </div>
        ) : shareQuery.isError ? (
          <div className="rounded-3xl border border-border bg-surface/50 backdrop-blur-md p-8 text-center shadow-elevated">
            <div className="grid h-12 w-12 mx-auto place-items-center rounded-2xl bg-destructive/10 text-destructive mb-4">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-foreground">Link Invalid or Expired</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
              {shareQuery.error.message || "This sharing link is no longer active. It may have expired or been revoked by the owner."}
            </p>
            <Button variant="secondary" className="mt-6 rounded-xl w-full" asChild>
              <a href="/"><ArrowLeft className="mr-1.5 h-4 w-4" /> Go to TeleVault</a>
            </Button>
          </div>
        ) : (
          /* Success states */
          (() => {
            const data = shareQuery.data!;
            return (
              <div className="rounded-3xl border border-border bg-surface/40 backdrop-blur-md p-8 shadow-elevated border-opacity-70">
                {data.passwordRequired && !unlocked ? (
                  /* Password Protection Form */
                  <form onSubmit={handleVerifyPassword} className="space-y-6">
                    <div className="text-center space-y-2">
                      <div className="grid h-12 w-12 mx-auto place-items-center rounded-2xl bg-brand/10 text-brand">
                        <Lock className="h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-bold">Password Protected</h3>
                      <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                        The owner has protected this link. Enter the password to access the file.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Input
                        type="password"
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="rounded-xl border-border bg-background focus:bg-background text-center py-5 text-base"
                        autoFocus
                      />
                      {passwordError && (
                        <p className="text-xs text-destructive text-center font-medium">{passwordError}</p>
                      )}
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full rounded-xl py-5 bg-brand text-brand-foreground hover:bg-brand/90 font-semibold"
                      disabled={isDownloading || !password}
                    >
                      {isDownloading ? (
                        <>
                          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Unlocking & Downloading…
                        </>
                      ) : (
                        <>
                          <Download className="mr-1.5 h-4 w-4" /> Unlock & Download
                        </>
                      )}
                    </Button>
                  </form>
                ) : (
                  /* Ready for Download View */
                  <div className="space-y-6 text-center">
                    <div className="space-y-4">
                      {/* File icon preview */}
                      <div className="flex justify-center">
                        <div className={cn(
                          "grid h-16 w-16 place-items-center rounded-2xl shadow-inner",
                          getFileColorClass(data.mimeType, data.filename)
                        )}>
                          {(() => {
                            const Icon = getFileIcon(data.mimeType, data.filename);
                            return <Icon className="h-8 w-8" strokeWidth={2} />;
                          })()}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-lg font-bold text-foreground truncate max-w-sm mx-auto px-2">
                          {data.filename}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Size: {formatBytes(data.size)} · Downloads: {data.downloadsCount}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-border/60 py-2 text-left space-y-1.5 text-xs text-muted-foreground">
                      <div className="flex justify-between">
                        <span>File Type</span>
                        <span className="font-medium text-foreground">{data.mimeType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Uploaded</span>
                        <span className="font-medium text-foreground">
                          {new Date(data.uploadDate).toLocaleDateString(undefined, { dateStyle: "medium" })}
                        </span>
                      </div>
                    </div>

                    <Button
                      onClick={handleDownloadNoPassword}
                      className="w-full rounded-xl py-5 bg-brand text-brand-foreground hover:bg-brand/90 font-semibold cursor-pointer"
                      disabled={isDownloading}
                    >
                      {isDownloading ? (
                        <>
                          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Downloading…
                        </>
                      ) : (
                        <>
                          <Download className="mr-1.5 h-4 w-4" /> Download File
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
}
