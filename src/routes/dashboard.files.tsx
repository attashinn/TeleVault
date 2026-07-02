import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState, useEffect } from "react";
import {
  Download,
  FileText,
  FolderOpen,
  Loader2,
  Trash2,
  Upload,
  Search,
  Grid,
  List,
  FolderPlus,
  ChevronRight,
  MoreVertical,
  ChevronDown,
  Edit,
  Copy,
  Move,
  X,
  ExternalLink,
  HardDrive,
  FileIcon,
  Image as ImageIcon,
  Film,
  Music,
  FileCode,
  FileArchive,
  ArrowUpDown,
  CheckCircle2,
  AlertCircle,
  Minimize2,
  Maximize2,
  Share2,
  Star,
  Link as LinkIcon,
  Lock,
  Calendar,
  Eye,
  EyeOff,
  QrCode,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/files")({
  component: MyFilesPage,
  head: () => ({ meta: [{ title: "My Files — TeleVault" }] }),
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

interface UploadProgress {
  id: string;
  name: string;
  size: number;
  progress: number;
  status: "queued" | "uploading" | "completed" | "failed";
  error?: string;
  file?: File;
}

const TELEGRAM_MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // 50 MB
const TELEGRAM_MAX_DOWNLOAD_BYTES = 20 * 1024 * 1024; // 20 MB

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

const getFileIcon = (mimeType: string, filename: string) => {
  if (mimeType === "application/x-directory") return FolderOpen;
  
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
  if (mimeType === "application/x-directory") {
    return "text-brand bg-brand/10 dark:bg-brand/15";
  }
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

function MyFilesPage() {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Folder & Search state
  const [currentPath, setCurrentPath] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"name" | "size" | "date" | "type">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Drag & drop state
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  // Upload queue state
  const [uploadQueue, setUploadQueue] = useState<UploadProgress[]>([]);
  const [queueOpen, setQueueOpen] = useState(true);
  const [queueMinimized, setQueueMinimized] = useState(false);
  const queueRef = useRef<UploadProgress[]>([]);

  // Dialog / Action states
  const [previewFile, setPreviewFile] = useState<FileRow | null>(null);
  const [renameFile, setRenameFile] = useState<FileRow | null>(null);
  const [renameName, setRenameName] = useState("");
  const [moveFile, setMoveFile] = useState<FileRow | null>(null);
  const [copyFile, setCopyFile] = useState<FileRow | null>(null);
  const [targetMoveCopyPath, setTargetMoveCopyPath] = useState("");
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<FileRow | null>(null);
  const [shareTokenToRevoke, setShareTokenToRevoke] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("televault-favorites") || "[]");
    } catch {
      return [];
    }
  });

  const toggleFavorite = (id: string, name: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem("televault-favorites", JSON.stringify(next));
      toast.success(prev.includes(id) ? `Removed "${name}" from Favorites` : `Added "${name}" to Favorites`);
      return next;
    });
  };

  // Share dialog states
  const [shareFile, setShareFile] = useState<FileRow | null>(null);
  const [sharePasswordEnabled, setSharePasswordEnabled] = useState(false);
  const [sharePassword, setSharePassword] = useState("");
  const [sharePasswordVisible, setSharePasswordVisible] = useState(false);
  const [shareExpirationEnabled, setShareExpirationEnabled] = useState(false);
  const [shareExpiresDays, setShareExpiresDays] = useState("7");
  const [showQrCode, setShowQrCode] = useState(false);

  // Sync ref with queue state
  useEffect(() => {
    queueRef.current = uploadQueue;
  }, [uploadQueue]);

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

  // Mutation: Create Folder
  const createFolderMutation = useMutation({
    mutationFn: async (folderPath: string) => {
      const res = await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFolder: true, name: folderPath }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to create folder");
      }
    },
    onSuccess: () => {
      toast.success("Folder created successfully");
      qc.invalidateQueries({ queryKey: ["files"] });
      setCreateFolderOpen(false);
      setNewFolderName("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Mutation: Rename/Move
  const renameMoveMutation = useMutation({
    mutationFn: async ({ id, filename }: { id: string; filename: string }) => {
      const res = await fetch(`/api/files/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to update item");
      }
    },
    onSuccess: () => {
      toast.success("Item updated successfully");
      qc.invalidateQueries({ queryKey: ["files"] });
      setRenameFile(null);
      setMoveFile(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Mutation: Copy
  const copyMutation = useMutation({
    mutationFn: async ({ id, filename }: { id: string; filename: string }) => {
      const res = await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ copyFromId: id, filename }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to copy file");
      }
    },
    onSuccess: () => {
      toast.success("File copied successfully");
      qc.invalidateQueries({ queryKey: ["files"] });
      setCopyFile(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Mutation: Delete
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/files/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Delete failed");
      }
    },
    onSuccess: () => {
      toast.success("Item removed from vault");
      qc.invalidateQueries({ queryKey: ["files"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Mutation: Create Share Link
  const createShareMutation = useMutation({
    mutationFn: async () => {
      if (!shareFile) return;
      let expiresAt: string | null = null;
      if (shareExpirationEnabled) {
        expiresAt = new Date(Date.now() + parseInt(shareExpiresDays) * 24 * 60 * 60 * 1000).toISOString();
      }

      const res = await fetch("/api/shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId: shareFile.id,
          password: sharePasswordEnabled && sharePassword.trim() ? sharePassword.trim() : null,
          expiresAt,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to create share link");
      }
    },
    onSuccess: () => {
      toast.success("Share link created successfully");
      qc.invalidateQueries({ queryKey: ["files"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Mutation: Revoke Share Link
  const revokeShareMutation = useMutation({
    mutationFn: async (token: string) => {
      const res = await fetch(`/api/shares/${token}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to revoke share link");
      }
    },
    onSuccess: () => {
      toast.success("Share link revoked successfully");
      qc.invalidateQueries({ queryKey: ["files"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Directory helper functions
  const getFolderContents = (allFiles: FileRow[], path: string) => {
    const directFiles: FileRow[] = [];
    const directFolders = new Map<string, FileRow>();

    allFiles.forEach((f) => {
      // CRITICAL: Filter out share link rows from files navigator!
      if (f.mime_type === "application/x-share-link") return;
      if (f.filename.startsWith("trash/")) return;
      if (f.filename === path) return; // Skip current folder row

      if (path === "") {
        // Root path
        const parts = f.filename.split("/");
        if (parts.length === 1) {
          // File directly at root
          directFiles.push(f);
        } else if (parts.length > 1) {
          // Folder nested somewhere
          const folderName = parts[0] + "/";
          if (!directFolders.has(folderName)) {
            const existingFolder = allFiles.find((x) => x.filename === folderName);
            directFolders.set(folderName, existingFolder ?? {
              id: `virtual-${folderName}`,
              filename: folderName,
              size: 0,
              mime_type: "application/x-directory",
              telegram_message_id: 0,
              telegram_file_id: "",
              channel_id: "virtual",
              upload_date: f.upload_date,
            });
          }
        }
      } else {
        // Subpath
        if (f.filename.startsWith(path)) {
          const relative = f.filename.slice(path.length);
          if (relative === "") return;
          const parts = relative.split("/");
          if (parts.length === 1 && f.mime_type !== "application/x-directory") {
            // Direct file
            directFiles.push(f);
          } else {
            // Subfolder
            const folderName = path + parts[0] + "/";
            if (!directFolders.has(folderName)) {
              const existingFolder = allFiles.find((x) => x.filename === folderName);
              directFolders.set(folderName, existingFolder ?? {
                id: `virtual-${folderName}`,
                filename: folderName,
                size: 0,
                mime_type: "application/x-directory",
                telegram_message_id: 0,
                telegram_file_id: "",
                channel_id: "virtual",
                upload_date: f.upload_date,
              });
            }
          }
        }
      }
    });

    return {
      folders: Array.from(directFolders.values()),
      files: directFiles,
      all: [...Array.from(directFolders.values()), ...directFiles],
    };
  };

  const currentFolderContents = getFolderContents(files, currentPath);

  // Filter & Search
  const filteredContents = currentFolderContents.all.filter((item) => {
    const displayName = item.filename.split("/").filter(Boolean).pop() || "";
    return displayName.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Sort logic
  const sortedContents = [...filteredContents].sort((a, b) => {
    const aIsFolder = a.mime_type === "application/x-directory";
    const bIsFolder = b.mime_type === "application/x-directory";
    if (aIsFolder && !bIsFolder) return -1;
    if (!aIsFolder && bIsFolder) return 1;

    let comparison = 0;
    if (sortBy === "name") {
      const aName = (a.filename.split("/").filter(Boolean).pop() || "").toLowerCase();
      const bName = (b.filename.split("/").filter(Boolean).pop() || "").toLowerCase();
      comparison = aName.localeCompare(bName);
    } else if (sortBy === "size") {
      comparison = a.size - b.size;
    } else if (sortBy === "date") {
      comparison = new Date(a.upload_date).getTime() - new Date(b.upload_date).getTime();
    } else if (sortBy === "type") {
      comparison = a.mime_type.localeCompare(b.mime_type);
    }

    return sortOrder === "asc" ? comparison : -comparison;
  });

  // Extract all unique folder paths for move/copy destinations
  const allFolders = Array.from(
    new Set([
      "",
      ...files
        .filter((f) => f.mime_type === "application/x-directory")
        .map((f) => f.filename),
      ...files
        .map((f) => {
          if (f.mime_type === "application/x-share-link") return "";
          const parts = f.filename.split("/");
          if (parts.length > 1) {
            return parts.slice(0, -1).join("/") + "/";
          }
          return "";
        })
        .filter(Boolean),
    ])
  ).sort();

  // Helper: count nested items inside a folder path
  const countFolderItems = (folderPath: string) => {
    return files.filter(
      (f) => f.filename.startsWith(folderPath) && f.filename !== folderPath && f.mime_type !== "application/x-directory" && f.mime_type !== "application/x-share-link"
    ).length;
  };

  // Helper: check if item has active share link and return details
  const getShareLinkForItem = (itemId: string) => {
    const shareRow = files.find((x) => x.telegram_file_id === itemId && x.mime_type === "application/x-share-link");
    if (!shareRow) return null;

    let settings = { password: "", expiresAt: "", revoked: false, originalName: "" };
    try {
      settings = JSON.parse(shareRow.channel_id);
    } catch {}

    const token = shareRow.filename.replace("shares/", "");
    const shareUrl = `${window.location.origin}/share/${token}`;

    return {
      id: shareRow.id,
      token,
      shareUrl,
      downloadsCount: shareRow.telegram_message_id,
      createdDate: shareRow.upload_date,
      passwordProtected: !!settings.password,
      password: settings.password || "",
      expiresAt: settings.expiresAt || "",
      revoked: settings.revoked,
      originalName: settings.originalName,
    };
  };

  // Upload progress helper updates
  const updateQueueItem = (id: string, updates: Partial<UploadProgress>) => {
    setUploadQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  // Concurrent Upload Queue Runner
  const processUploadQueue = () => {
    const active = queueRef.current.filter((item) => item.status === "uploading").length;
    if (active >= 2) return;

    const next = queueRef.current.find((item) => item.status === "queued");
    if (!next || !next.file) return;

    const { id, file } = next;
    updateQueueItem(id, { status: "uploading" });

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/files");

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        updateQueueItem(id, { progress: percent });
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        updateQueueItem(id, { status: "completed", progress: 100 });
        qc.invalidateQueries({ queryKey: ["files"] });
        setTimeout(processUploadQueue, 100);
      } else {
        let errorMsg = "Upload failed";
        try {
          const res = JSON.parse(xhr.responseText);
          errorMsg = res.error || errorMsg;
        } catch {}
        updateQueueItem(id, { status: "failed", error: errorMsg });
        setTimeout(processUploadQueue, 100);
      }
    };

    xhr.onerror = () => {
      updateQueueItem(id, { status: "failed", error: "Network error" });
      setTimeout(processUploadQueue, 100);
    };

    const formData = new FormData();
    const finalFilename = currentPath ? `${currentPath}${file.name}` : file.name;
    formData.append("file", file, finalFilename);
    xhr.send(formData);

    setTimeout(processUploadQueue, 50);
  };

  // Handle selected/dropped files
  const handleFilesAdded = (filesList: FileList | File[]) => {
    const list = Array.from(filesList);
    const newItems: UploadProgress[] = list.map((file) => {
      const id = Math.random().toString(36).substring(7);
      const isTooLarge = file.size > TELEGRAM_MAX_UPLOAD_BYTES;
      return {
        id,
        name: file.name,
        size: file.size,
        progress: 0,
        status: isTooLarge ? "failed" : "queued",
        error: isTooLarge ? "Telegram Bot limit is 50 MB" : undefined,
        file: isTooLarge ? undefined : file,
      };
    });

    const isUploadingAny = queueRef.current.some((x) => x.status === "uploading" || x.status === "queued");

    setUploadQueue((prev) => [...prev, ...newItems]);
    setQueueOpen(true);
    setQueueMinimized(false);

    if (!isUploadingAny) {
      setTimeout(() => {
        processUploadQueue();
      }, 50);
    }
  };

  // Drag & drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };

  // Navigate folder helper
  const navigateInto = (item: FileRow) => {
    if (item.mime_type === "application/x-directory") {
      setCurrentPath(item.filename);
      setSearchQuery("");
    } else {
      setPreviewFile(item);
    }
  };

  // Breadcrumbs builder
  const renderBreadcrumbs = () => {
    const parts = currentPath.split("/").filter(Boolean);
    const crumbs = [{ name: "All Files", path: "" }];
    
    let cumulative = "";
    parts.forEach((p) => {
      cumulative += p + "/";
      crumbs.push({ name: p, path: cumulative });
    });

    return (
      <div className="flex items-center gap-1.5 overflow-x-auto py-2 text-sm text-muted-foreground">
        {crumbs.map((crumb, idx) => (
          <div key={crumb.path} className="flex items-center shrink-0">
            {idx > 0 && <ChevronRight className="mx-1 h-3.5 w-3.5 text-muted-foreground/60" />}
            <button
              onClick={() => setCurrentPath(crumb.path)}
              className={cn(
                "rounded-md px-2 py-1 transition-colors hover:bg-accent hover:text-foreground",
                currentPath === crumb.path && "font-semibold text-foreground bg-accent/40"
              )}
            >
              {crumb.name}
            </button>
          </div>
        ))}
      </div>
    );
  };

  // Actions trigger helpers
  const triggerRename = (item: FileRow) => {
    const parts = item.filename.split("/").filter(Boolean);
    const base = parts.pop() || "";
    setRenameFile(item);
    setRenameName(base);
  };

  const executeRename = () => {
    if (!renameFile) return;
    const isFolder = renameFile.mime_type === "application/x-directory";
    const oldParts = renameFile.filename.split("/").filter(Boolean);
    oldParts.pop(); // Remove the old name
    
    const parentPath = oldParts.join("/");
    let targetFilename = parentPath ? `${parentPath}/${renameName}` : renameName;
    if (isFolder) {
      targetFilename += "/";
    }

    renameMoveMutation.mutate({ id: renameFile.id, filename: targetFilename });
  };

  const triggerMove = (item: FileRow) => {
    setMoveFile(item);
    const parts = item.filename.split("/").filter(Boolean);
    parts.pop(); // Remove basename
    const parent = parts.length > 0 ? parts.join("/") + "/" : "";
    setTargetMoveCopyPath(parent);
  };

  const executeMove = () => {
    if (!moveFile) return;
    const isFolder = moveFile.mime_type === "application/x-directory";
    const parts = moveFile.filename.split("/").filter(Boolean);
    const basename = parts.pop() || "";
    
    let targetFilename = targetMoveCopyPath ? `${targetMoveCopyPath}${basename}` : basename;
    if (isFolder) {
      targetFilename += "/";
    }

    renameMoveMutation.mutate({ id: moveFile.id, filename: targetFilename });
  };

  const triggerCopy = (item: FileRow) => {
    const parts = item.filename.split("/").filter(Boolean);
    parts.pop();
    const parent = parts.length > 0 ? parts.join("/") + "/" : "";
    setTargetMoveCopyPath(parent);
    setCopyFile(item);
  };

  const executeCopy = () => {
    if (!copyFile) return;
    const parts = copyFile.filename.split("/").filter(Boolean);
    const basename = parts.pop() || "";
    const targetFilename = targetMoveCopyPath ? `${targetMoveCopyPath}${basename}` : basename;

    copyMutation.mutate({ id: copyFile.id, filename: targetFilename });
  };

  const triggerCreateFolder = () => {
    if (!newFolderName.trim()) return;
    let fullFolderName = currentPath ? `${currentPath}${newFolderName.trim()}` : newFolderName.trim();
    if (!fullFolderName.endsWith("/")) {
      fullFolderName += "/";
    }
    createFolderMutation.mutate(fullFolderName);
  };

  // Keyboard navigation & shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "SELECT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.key === "Escape") {
        setSelectedFileId(null);
        return;
      }

      if (!selectedFileId) return;

      const currentIndex = sortedContents.findIndex((f) => f.id === selectedFileId);
      if (currentIndex === -1) return;
      const selectedItem = sortedContents[currentIndex];

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        triggerFileDelete(selectedItem);
      } else if (e.key === "F2") {
        e.preventDefault();
        triggerRename(selectedItem);
      } else if (e.key === "Enter") {
        e.preventDefault();
        navigateInto(selectedItem);
      } else if ((e.metaKey || e.ctrlKey) && e.key === "d") {
        if (selectedItem.mime_type !== "application/x-directory") {
          e.preventDefault();
          window.location.href = `/api/files/${selectedItem.id}/download`;
        }
      } else if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % sortedContents.length;
        setSelectedFileId(sortedContents[nextIndex].id);
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        const prevIndex = (currentIndex - 1 + sortedContents.length) % sortedContents.length;
        setSelectedFileId(sortedContents[prevIndex].id);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedFileId, sortedContents]);

  const triggerFileDelete = (item: FileRow) => {
    setItemToDelete(item);
  };

  const executeSoftDelete = () => {
    if (!itemToDelete) return;
    const item = itemToDelete;
    setItemToDelete(null);

    const isFolder = item.mime_type === "application/x-directory";
    const name = item.filename.split("/").filter(Boolean).pop() || "";
    const newFilename = `trash/${item.filename}`;

    const promise = renameMoveMutation.mutateAsync({ id: item.id, filename: newFilename });
    
    toast.promise(promise, {
      loading: `Moving "${name}" to Trash...`,
      success: () => {
        return (
          <div className="flex items-center justify-between w-full">
            <span>Moved "${name}" to Trash</span>
            <button
              onClick={() => {
                renameMoveMutation.mutate({ id: item.id, filename: item.filename });
              }}
              className="text-xs font-bold text-brand hover:underline shrink-0 ml-3 cursor-pointer"
            >
              Undo
            </button>
          </div>
        );
      },
      error: "Failed to move item to Trash",
    });
  };

  const triggerShare = (item: FileRow) => {
    setShareFile(item);
    const existing = getShareLinkForItem(item.id);
    if (existing) {
      setSharePasswordEnabled(existing.passwordProtected);
      setSharePassword(existing.password);
      setShareExpirationEnabled(!!existing.expiresAt);
    } else {
      setSharePasswordEnabled(false);
      setSharePassword("");
      setShareExpirationEnabled(false);
      setShareExpiresDays("7");
    }
    setShowQrCode(false);
  };

  const executeCreateShare = () => {
    createShareMutation.mutate();
  };

  const executeRevokeShare = (token: string) => {
    setShareTokenToRevoke(token);
  };

  const confirmRevokeShare = () => {
    if (!shareTokenToRevoke) return;
    const token = shareTokenToRevoke;
    setShareTokenToRevoke(null);
    revokeShareMutation.mutate(token);
  };

  const handleCopyShareLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Share link copied to clipboard!");
  };

  const queueSummary = () => {
    const active = uploadQueue.filter(x => x.status === "uploading").length;
    const pending = uploadQueue.filter(x => x.status === "queued").length;
    const completed = uploadQueue.filter(x => x.status === "completed").length;
    const failed = uploadQueue.filter(x => x.status === "failed").length;

    if (active > 0) return `Uploading ${active} file${active > 1 ? "s" : ""} (${completed}/${uploadQueue.length})`;
    if (pending > 0) return `${pending} file${pending > 1 ? "s" : ""} queued`;
    if (failed > 0 && active === 0) return `Completed with ${failed} failure${failed > 1 ? "s" : ""}`;
    return "All uploads completed";
  };

  return (
    <div 
      className="relative min-h-[70vh] flex flex-col"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Full-screen drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center rounded-3xl border-3 border-dashed border-brand bg-background/95 backdrop-blur-sm pointer-events-none animate-in fade-in duration-200">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-brand/10 text-brand mb-4">
            <Upload className="h-8 w-8 animate-bounce" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Drop files to upload</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Uploading to {currentPath ? `/${currentPath}` : "Root Directory"}
          </p>
        </div>
      )}

      <PageHeader
        eyebrow="Workspace"
        title="My Vault"
        description="Encrypted metadata storage backed by Telegram document routing."
        actions={
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) handleFilesAdded(e.target.files);
              }}
            />
            <Button
              variant="outline"
              className="rounded-xl border-border bg-surface hover:bg-accent/40"
              onClick={() => setCreateFolderOpen(true)}
            >
              <FolderPlus className="mr-1.5 h-4 w-4 text-brand" />
              New folder
            </Button>
            <Button
              className="rounded-xl bg-brand hover:bg-brand/90"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-1.5 h-4 w-4" />
              Upload
            </Button>
          </div>
        }
      />

      {/* Toolbar / Filters */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center max-w-md relative">
          <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vault..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 rounded-xl border-border bg-surface/50 focus:bg-background"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")} 
              className="absolute right-3.5 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Sorting */}
          <div className="flex items-center gap-1 bg-surface/60 border border-border rounded-xl p-1 text-sm">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="rounded-lg gap-1.5 h-8 font-medium">
                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                  Sort: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-popover border border-border rounded-xl shadow-md">
                <DropdownMenuItem onClick={() => setSortBy("name")} className="rounded-lg">Sort by Name</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("size")} className="rounded-lg">Sort by Size</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("date")} className="rounded-lg">Sort by Date</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("type")} className="rounded-lg">Sort by Type</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg"
              onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
              title={sortOrder === "asc" ? "Sort Ascending" : "Sort Descending"}
            >
              <span className="text-[10px] uppercase font-bold text-muted-foreground">
                {sortOrder}
              </span>
            </Button>
          </div>

          {/* View Toggles */}
          <div className="flex bg-surface/60 border border-border rounded-xl p-1">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8 rounded-lg shadow-none"
              onClick={() => setViewMode("grid")}
              title="Grid View"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8 rounded-lg shadow-none"
              onClick={() => setViewMode("list")}
              title="List View"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Breadcrumb Path navigation */}
      <div className="mt-4 border-b border-border/60 pb-2">
        {renderBreadcrumbs()}
      </div>

      {/* Main Files Display */}
      <div className="flex-1 mt-6">
        {filesQuery.isLoading ? (
          viewMode === "list" ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-3 px-4 border border-border/40 rounded-2xl bg-surface/20">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[40%]" />
                    <Skeleton className="h-3 w-[20%]" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-12 rounded-lg" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="border border-border/40 rounded-2xl bg-surface/20 p-4 space-y-4">
                  <Skeleton className="h-24 w-full rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-[60%]" />
                  </div>
                </div>
              ))}
            </div>
          )
        ) : filesQuery.isError ? (
          <EmptyState
            icon={FolderOpen}
            title="Couldn't load files"
            description={filesQuery.error.message || "An unexpected error occurred."}
            action={
              <Button variant="outline" className="rounded-xl" onClick={() => filesQuery.refetch()}>
                Retry
              </Button>
            }
          />
        ) : sortedContents.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title={searchQuery ? "No matches found" : "Folder is empty"}
            description={
              searchQuery 
                ? "Try searching for a different term or directory name." 
                : "Drag & drop files here, or use the buttons above to get started."
            }
            action={
              !searchQuery && (
                <div className="flex gap-2">
                  <Button variant="outline" className="rounded-xl" onClick={() => setCreateFolderOpen(true)}>
                    <FolderPlus className="mr-1.5 h-4 w-4" /> New folder
                  </Button>
                  <Button className="rounded-xl" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-1.5 h-4 w-4" /> Upload first file
                  </Button>
                </div>
              )
            }
          />
        ) : viewMode === "list" ? (
          /* LIST VIEW */
          <div className="overflow-hidden rounded-2xl border border-border bg-surface/30 backdrop-blur-sm">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-surface/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3.5 text-left">Name</th>
                  <th className="px-5 py-3.5 text-left">Size</th>
                  <th className="px-5 py-3.5 text-left">Modified</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {sortedContents.map((f) => {
                  const Icon = getFileIcon(f.mime_type, f.filename);
                  const isFolder = f.mime_type === "application/x-directory";
                  const displayName = f.filename.split("/").filter(Boolean).pop() || "";
                  const colorClass = getFileColorClass(f.mime_type, f.filename);
                  const share = getShareLinkForItem(f.id);
                  const isSelected = selectedFileId === f.id;
                  const isStarred = favorites.includes(f.id);

                  return (
                    <tr 
                      key={f.id} 
                      className={cn(
                        "group transition-all duration-150 cursor-pointer border-l-2",
                        isSelected 
                          ? "bg-brand/5 border-l-brand" 
                          : "hover:bg-accent/40 border-l-transparent"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFileId(f.id);
                      }}
                      onDoubleClick={() => navigateInto(f)}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(f.id, displayName);
                            }}
                            className={cn(
                              "opacity-0 group-hover:opacity-100 transition-all duration-150 p-1.5 rounded-lg hover:bg-accent cursor-pointer",
                              isStarred && "opacity-100 text-amber-500"
                            )}
                            title={isStarred ? "Remove from Favorites" : "Add to Favorites"}
                          >
                            <Star className="h-4 w-4" fill={isStarred ? "currentColor" : "none"} />
                          </button>
                          <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-transform duration-200 group-hover:scale-105", colorClass)}>
                            <Icon className="h-5 w-5" strokeWidth={2.25} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate font-semibold text-foreground">{displayName}</p>
                              {share && (
                                <span className="inline-flex items-center gap-0.5 rounded-full bg-brand-muted px-1.5 py-0.5 text-[9px] font-bold text-brand uppercase">
                                  <Share2 className="h-2 w-2" /> Shared
                                </span>
                              )}
                            </div>
                            <p className="truncate text-xs text-muted-foreground">
                              {isFolder ? "Directory" : f.mime_type} {f.telegram_message_id > 0 && `· msg #${f.telegram_message_id}`}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {isFolder ? `${countFolderItems(f.filename)} items` : formatBytes(f.size)}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{formatDate(f.upload_date)}</td>
                      <td className="px-5 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {!isFolder && (
                            <Button asChild variant="ghost" size="icon" className="rounded-xl h-8 w-8 hover:bg-accent">
                              <a href={`/api/files/${f.id}/download`} title="Download">
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8 hover:bg-accent">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44 bg-popover border border-border rounded-xl shadow-md p-1">
                              {!isFolder && (
                                <DropdownMenuItem onClick={() => triggerShare(f)} className="rounded-lg gap-2 cursor-pointer font-medium text-brand focus:text-brand focus:bg-brand-muted/40">
                                  <Share2 className="h-4 w-4" /> Share File
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => triggerRename(f)} className="rounded-lg gap-2 cursor-pointer">
                                <Edit className="h-4 w-4" /> Rename
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => triggerMove(f)} className="rounded-lg gap-2 cursor-pointer">
                                <Move className="h-4 w-4" /> Move
                              </DropdownMenuItem>
                              {!isFolder && (
                                <DropdownMenuItem onClick={() => triggerCopy(f)} className="rounded-lg gap-2 cursor-pointer">
                                  <Copy className="h-4 w-4" /> Copy
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => triggerFileDelete(f)} 
                                className="rounded-lg gap-2 text-destructive hover:text-destructive cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {sortedContents.map((f) => {
              const Icon = getFileIcon(f.mime_type, f.filename);
              const isFolder = f.mime_type === "application/x-directory";
              const displayName = f.filename.split("/").filter(Boolean).pop() || "";
              const colorClass = getFileColorClass(f.mime_type, f.filename);
              const share = getShareLinkForItem(f.id);
              const isSelected = selectedFileId === f.id;
              const isStarred = favorites.includes(f.id);

              // Check if we can show image thumbnail
              const isImage = f.mime_type.startsWith("image/");
              const canPreview = f.size <= TELEGRAM_MAX_DOWNLOAD_BYTES;

              return (
                <div
                  key={f.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFileId(f.id);
                  }}
                  onDoubleClick={() => navigateInto(f)}
                  className={cn(
                    "group relative flex flex-col items-center justify-center border rounded-2xl p-4 transition-all duration-200 cursor-pointer text-center",
                    isSelected 
                      ? "border-brand bg-brand-muted/20 ring-2 ring-brand/40 shadow-soft" 
                      : "border-border/70 bg-surface/30 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-soft hover:bg-surface/50"
                  )}
                >
                  {/* Favorite toggle and Share indicator */}
                  <div className="absolute top-2 left-2 flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(f.id, displayName);
                      }}
                      className={cn(
                        "grid h-6 w-6 place-items-center rounded-lg bg-surface/80 text-muted-foreground hover:text-amber-500 opacity-0 group-hover:opacity-100 transition-all border border-border/40 shadow-sm cursor-pointer",
                        isStarred && "opacity-100 text-amber-500 bg-amber-500/10 border-amber-500/20"
                      )}
                      title={isStarred ? "Remove from Favorites" : "Add to Favorites"}
                    >
                      <Star className="h-3.5 w-3.5" fill={isStarred ? "currentColor" : "none"} />
                    </button>
                    {share && (
                      <div className="grid h-6 w-6 place-items-center rounded-lg bg-brand-muted text-brand border border-brand/20 shadow-sm" title="Shared file">
                        <Share2 className="h-3 w-3" />
                      </div>
                    )}
                  </div>

                  {/* Menu buttons in grid */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-accent">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44 bg-popover border border-border rounded-xl shadow-md p-1">
                        {!isFolder && (
                          <DropdownMenuItem onClick={() => triggerShare(f)} className="rounded-lg gap-2 cursor-pointer font-medium text-brand focus:text-brand focus:bg-brand-muted/40">
                            <Share2 className="h-4 w-4" /> Share File
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => triggerRename(f)} className="rounded-lg gap-2 cursor-pointer">
                          <Edit className="h-4 w-4" /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => triggerMove(f)} className="rounded-lg gap-2 cursor-pointer">
                          <Move className="h-4 w-4" /> Move
                        </DropdownMenuItem>
                        {!isFolder && (
                          <DropdownMenuItem onClick={() => triggerCopy(f)} className="rounded-lg gap-2 cursor-pointer">
                            <Copy className="h-4 w-4" /> Copy
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => triggerFileDelete(f)} 
                          className="rounded-lg gap-2 text-destructive hover:text-destructive cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Thumbnail / Icon area */}
                  <div className="flex h-20 w-full items-center justify-center mb-3">
                    {isImage && canPreview ? (
                      <img
                        src={`/api/files/${f.id}/download`}
                        alt={displayName}
                        className="h-20 max-w-full object-contain rounded-xl shadow-sm border border-border/20 transition-transform group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className={cn("grid h-16 w-16 place-items-center rounded-2xl transition-transform group-hover:scale-105 shadow-inner", colorClass)}>
                        <Icon className="h-8 w-8" strokeWidth={2} />
                      </div>
                    )}
                  </div>

                  <p className="w-full text-xs font-semibold truncate text-foreground px-1">{displayName}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {isFolder ? `${countFolderItems(f.filename)} items` : formatBytes(f.size)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FLOAT UPLOAD QUEUE PANEL */}
      {uploadQueue.length > 0 && queueOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-80 sm:w-96 overflow-hidden rounded-2xl border border-border bg-surface/90 backdrop-blur-md shadow-elevated transition-all animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3">
            <div className="flex items-center gap-2">
              {uploadQueue.some(x => x.status === "uploading" || x.status === "queued") ? (
                <Loader2 className="h-4 w-4 animate-spin text-brand" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              )}
              <h4 className="text-xs font-bold uppercase tracking-wider">{queueSummary()}</h4>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-lg text-muted-foreground hover:bg-accent"
                onClick={() => setQueueMinimized(prev => !prev)}
              >
                {queueMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-lg text-muted-foreground hover:bg-accent hover:text-destructive"
                onClick={() => {
                  setQueueOpen(false);
                  setUploadQueue([]);
                }}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <div className={cn("transition-all duration-300", queueMinimized ? "h-0" : "max-h-60 overflow-y-auto px-4 py-3 divide-y divide-border/60")}>
            {uploadQueue.map((item) => (
              <div key={item.id} className="py-2.5 first:pt-0 last:pb-0 flex flex-col gap-1.5 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium truncate flex-1">{item.name}</span>
                  <span className="text-muted-foreground shrink-0">{formatBytes(item.size)}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <Progress value={item.progress} className="h-1 flex-1 bg-accent" />
                  <span className="shrink-0 w-8 text-right font-semibold">
                    {item.status === "failed" && <AlertCircle className="inline h-4 w-4 text-destructive" />}
                    {item.status === "completed" && <CheckCircle2 className="inline h-4 w-4 text-emerald-500" />}
                    {item.status === "uploading" && `${item.progress}%`}
                    {item.status === "queued" && "Queued"}
                  </span>
                </div>

                {item.error && (
                  <p className="text-[10px] text-destructive font-medium">{item.error}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DIALOG: CREATE FOLDER */}
      <Dialog open={createFolderOpen} onOpenChange={setCreateFolderOpen}>
        <DialogContent className="max-w-sm rounded-2xl border border-border bg-background p-6">
          <DialogHeader>
            <DialogTitle>Create new folder</DialogTitle>
            <DialogDescription>
              A folder lets you organize files inside your vault.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Folder name (e.g. Documents)"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="rounded-xl border-border bg-surface/40 focus:bg-background"
              onKeyDown={(e) => {
                if (e.key === "Enter") triggerCreateFolder();
              }}
              autoFocus
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setCreateFolderOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button 
              onClick={triggerCreateFolder} 
              disabled={!newFolderName.trim() || createFolderMutation.isPending}
              className="rounded-xl"
            >
              {createFolderMutation.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: RENAME */}
      <Dialog open={renameFile !== null} onOpenChange={(open) => !open && setRenameFile(null)}>
        <DialogContent className="max-w-sm rounded-2xl border border-border bg-background p-6">
          <DialogHeader>
            <DialogTitle>Rename item</DialogTitle>
            <DialogDescription>
              Enter a new name for this file or folder.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="New name"
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              className="rounded-xl border-border bg-surface/40 focus:bg-background"
              onKeyDown={(e) => {
                if (e.key === "Enter") executeRename();
              }}
              autoFocus
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setRenameFile(null)} className="rounded-xl">
              Cancel
            </Button>
            <Button 
              onClick={executeRename} 
              disabled={!renameName.trim() || renameMoveMutation.isPending}
              className="rounded-xl"
            >
              {renameMoveMutation.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: MOVE */}
      <Dialog open={moveFile !== null} onOpenChange={(open) => !open && setMoveFile(null)}>
        <DialogContent className="max-w-sm rounded-2xl border border-border bg-background p-6">
          <DialogHeader>
            <DialogTitle>Move item</DialogTitle>
            <DialogDescription>
              Select the destination folder for this item.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Destination folder</label>
            <select
              value={targetMoveCopyPath}
              onChange={(e) => setTargetMoveCopyPath(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface/40 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
            >
              <option value="">/ (Root Directory)</option>
              {allFolders.filter(Boolean).map((folder) => {
                const displayName = folder.split("/").filter(Boolean).join(" / ");
                return (
                  <option key={folder} value={folder}>
                    /{displayName}/
                  </option>
                );
              })}
            </select>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setMoveFile(null)} className="rounded-xl">
              Cancel
            </Button>
            <Button 
              onClick={executeMove} 
              disabled={renameMoveMutation.isPending}
              className="rounded-xl"
            >
              {renameMoveMutation.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Move Here
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: COPY */}
      <Dialog open={copyFile !== null} onOpenChange={(open) => !open && setCopyFile(null)}>
        <DialogContent className="max-w-sm rounded-2xl border border-border bg-background p-6">
          <DialogHeader>
            <DialogTitle>Copy file</DialogTitle>
            <DialogDescription>
              Select where you want to copy this file. It will reference the same Telegram upload instantly.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Destination folder</label>
            <select
              value={targetMoveCopyPath}
              onChange={(e) => setTargetMoveCopyPath(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface/40 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
            >
              <option value="">/ (Root Directory)</option>
              {allFolders.filter(Boolean).map((folder) => {
                const displayName = folder.split("/").filter(Boolean).join(" / ");
                return (
                  <option key={folder} value={folder}>
                    /{displayName}/
                  </option>
                );
              })}
            </select>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setCopyFile(null)} className="rounded-xl">
              Cancel
            </Button>
            <Button 
              onClick={executeCopy} 
              disabled={copyMutation.isPending}
              className="rounded-xl"
            >
              {copyMutation.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Copy Here
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: FILE SHARING */}
      <Dialog open={shareFile !== null} onOpenChange={(open) => !open && setShareFile(null)}>
        <DialogContent className="max-w-md rounded-3xl border border-border bg-background p-6 shadow-elevated">
          {shareFile && (() => {
            const share = getShareLinkForItem(shareFile.id);
            const name = shareFile.filename.split("/").filter(Boolean).pop() || "";

            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Share2 className="h-5 w-5 text-brand" /> Share File
                  </DialogTitle>
                  <DialogDescription className="truncate">
                    Configure sharing settings for "{name}"
                  </DialogDescription>
                </DialogHeader>

                {share ? (
                  /* SHARE IS ACTIVE STATE */
                  <div className="space-y-6 py-2">
                    {/* Share Link display */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Share Link</label>
                      <div className="flex gap-2">
                        <Input
                          readOnly
                          value={share.shareUrl}
                          className="rounded-xl border-border bg-surface/50 font-mono text-xs select-all py-5 focus:ring-0 focus:outline-none"
                        />
                        <Button 
                          onClick={() => handleCopyShareLink(share.shareUrl)} 
                          className="rounded-xl bg-brand text-brand-foreground hover:bg-brand/90 px-4"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Stats & Settings info */}
                    <div className="grid grid-cols-2 gap-4 rounded-2xl border border-border bg-surface/30 p-4 text-xs">
                      <div>
                        <p className="text-muted-foreground mb-0.5">Downloads Count</p>
                        <p className="text-base font-bold text-foreground flex items-center gap-1.5">
                          <Download className="h-4 w-4 text-brand" /> {share.downloadsCount}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-0.5">Link Security</p>
                        <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                          {share.passwordProtected ? (
                            <span className="text-brand flex items-center gap-1"><Lock className="h-3.5 w-3.5" /> Secure</span>
                          ) : (
                            <span className="text-muted-foreground">Public</span>
                          )}
                        </p>
                      </div>
                      <div className="col-span-2 border-t border-border/40 pt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          {share.expiresAt 
                            ? `Expires ${new Date(share.expiresAt).toLocaleDateString()} at ${new Date(share.expiresAt).toLocaleTimeString()}`
                            : "This link never expires"
                          }
                        </span>
                      </div>
                    </div>

                    {/* QR Code toggle section */}
                    <div className="space-y-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowQrCode(prev => !prev)}
                        className="w-full text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl border border-border/40 py-5"
                      >
                        <QrCode className="mr-1.5 h-4 w-4" /> {showQrCode ? "Hide QR Code" : "Show QR Code"}
                      </Button>
                      
                      {showQrCode && (
                        <div className="flex flex-col items-center justify-center p-4 border border-border/60 bg-white dark:bg-white rounded-2xl animate-in zoom-in-95 duration-200">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(share.shareUrl)}`}
                            alt="QR Code"
                            className="h-36 w-36 shadow-sm"
                          />
                          <p className="text-[10px] text-black font-semibold mt-2">Scan to access download page</p>
                        </div>
                      )}
                    </div>

                    <DialogFooter className="flex sm:justify-between items-center w-full gap-2 border-t border-border/40 pt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setShareFile(null)} 
                        className="rounded-xl flex-1 sm:flex-none"
                      >
                        Close
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => executeRevokeShare(share.token)}
                        disabled={revokeShareMutation.isPending}
                        className="rounded-xl flex-1 sm:flex-none"
                      >
                        {revokeShareMutation.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                        <Trash2 className="mr-1.5 h-4 w-4" /> Revoke Sharing
                      </Button>
                    </DialogFooter>
                  </div>
                ) : (
                  /* SHARE NOT ACTIVE STATE */
                  <div className="space-y-5 py-2">
                    {/* Password Protection */}
                    <div className="rounded-2xl border border-border bg-surface/30 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <label className="text-xs font-bold flex items-center gap-1.5">
                            <Lock className="h-3.5 w-3.5 text-brand" /> Password Protection
                          </label>
                          <p className="text-[10px] text-muted-foreground">Require visitors to enter a password to download</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={sharePasswordEnabled}
                          onChange={(e) => setSharePasswordEnabled(e.target.checked)}
                          className="h-4 w-4 rounded border-border text-brand focus:ring-brand accent-brand cursor-pointer"
                        />
                      </div>
                      
                      {sharePasswordEnabled && (
                        <div className="relative">
                          <Input
                            type={sharePasswordVisible ? "text" : "password"}
                            placeholder="Set share password"
                            value={sharePassword}
                            onChange={(e) => setSharePassword(e.target.value)}
                            className="rounded-xl border-border bg-background focus:bg-background pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setSharePasswordVisible(prev => !prev)}
                            className="absolute right-3.5 top-[27%] text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            {sharePasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Expiration Settings */}
                    <div className="rounded-2xl border border-border bg-surface/30 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <label className="text-xs font-bold flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-brand" /> Expiration Date
                          </label>
                          <p className="text-[10px] text-muted-foreground">Automatically disable link after a set duration</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={shareExpirationEnabled}
                          onChange={(e) => setShareExpirationEnabled(e.target.checked)}
                          className="h-4 w-4 rounded border-border text-brand focus:ring-brand accent-brand cursor-pointer"
                        />
                      </div>
                      
                      {shareExpirationEnabled && (
                        <select
                          value={shareExpiresDays}
                          onChange={(e) => setShareExpiresDays(e.target.value)}
                          className="w-full rounded-xl border border-border bg-background p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand/40"
                        >
                          <option value="1">1 Day</option>
                          <option value="7">7 Days</option>
                          <option value="30">30 Days</option>
                        </select>
                      )}
                    </div>

                    <DialogFooter className="flex gap-2 sm:gap-0 pt-2 border-t border-border/40">
                      <Button variant="ghost" onClick={() => setShareFile(null)} className="rounded-xl">
                        Cancel
                      </Button>
                      <Button 
                        onClick={executeCreateShare} 
                        disabled={createShareMutation.isPending || (sharePasswordEnabled && !sharePassword.trim())}
                        className="rounded-xl bg-brand text-brand-foreground hover:bg-brand/90 font-semibold"
                      >
                        {createShareMutation.isPending ? (
                          <>
                            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Creating Link…
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-1.5 h-4 w-4 text-brand-foreground" /> Generate Link
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </div>
                )}
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* DIALOG: PREVIEW */}
      <Dialog open={previewFile !== null} onOpenChange={(open) => !open && setPreviewFile(null)}>
        <DialogContent className="max-w-4xl rounded-2xl border border-border bg-background p-6">
          {previewFile && (
            <>
              <DialogHeader>
                <DialogTitle className="truncate pr-8">{previewFile.filename.split("/").pop()}</DialogTitle>
                <DialogDescription>
                  {formatBytes(previewFile.size)} · {previewFile.mime_type} · Uploaded {formatDate(previewFile.upload_date)}
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col items-center justify-center min-h-[30vh] max-h-[70vh] py-6 bg-accent/20 rounded-2xl overflow-hidden border border-border/40">
                {previewFile.size > TELEGRAM_MAX_DOWNLOAD_BYTES ? (
                  <div className="text-center p-8 space-y-4">
                    <AlertCircle className="mx-auto h-12 w-12 text-amber-500 animate-pulse" />
                    <h4 className="font-semibold text-foreground">Too Large for Web Preview</h4>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Telegram limits bots to downloads up to 20 MB. You can still download this file directly to your system.
                    </p>
                    <Button asChild className="rounded-xl">
                      <a href={`/api/files/${previewFile.id}/download`}>
                        <Download className="mr-1.5 h-4 w-4" /> Download File ({formatBytes(previewFile.size)})
                      </a>
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Image Preview */}
                    {previewFile.mime_type.startsWith("image/") && (
                      <img
                        src={`/api/files/${previewFile.id}/download`}
                        alt={previewFile.filename}
                        className="max-h-[60vh] max-w-full object-contain rounded-xl shadow-md border border-border/20"
                      />
                    )}

                    {/* Video Preview */}
                    {previewFile.mime_type.startsWith("video/") && (
                      <video
                        src={`/api/files/${previewFile.id}/download`}
                        controls
                        className="max-h-[60vh] max-w-full rounded-xl shadow-md bg-black"
                      />
                    )}

                    {/* Audio Preview */}
                    {previewFile.mime_type.startsWith("audio/") && (
                      <div className="w-full max-w-md px-6 text-center space-y-6">
                        <div className="grid h-24 w-24 mx-auto place-items-center rounded-3xl text-violet-600 bg-violet-100 dark:bg-violet-500/15 dark:text-violet-400 shadow-md">
                          <Music className="h-10 w-10 animate-bounce" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-semibold text-sm truncate">{previewFile.filename.split("/").pop()}</h4>
                          <p className="text-xs text-muted-foreground">{formatBytes(previewFile.size)}</p>
                        </div>
                        <audio
                          src={`/api/files/${previewFile.id}/download`}
                          controls
                          className="w-full"
                        />
                      </div>
                    )}

                    {/* PDF Preview */}
                    {previewFile.mime_type === "application/pdf" && (
                      <iframe
                        src={`/api/files/${previewFile.id}/download`}
                        className="w-full h-[60vh] border-0 rounded-xl"
                      />
                    )}

                    {/* Non-previewable fallback */}
                    {!previewFile.mime_type.startsWith("image/") &&
                      !previewFile.mime_type.startsWith("video/") &&
                      !previewFile.mime_type.startsWith("audio/") &&
                      previewFile.mime_type !== "application/pdf" && (
                        <div className="text-center p-8 space-y-4">
                          <FileText className="mx-auto h-16 w-16 text-muted-foreground" />
                          <h4 className="font-semibold text-foreground">No Preview Available</h4>
                          <p className="text-sm text-muted-foreground max-w-md">
                            Previews are only supported for images, videos, audio, and PDFs under 20 MB.
                          </p>
                          <div className="flex gap-2 justify-center">
                            <Button variant="outline" asChild className="rounded-xl">
                              <a href={`/api/files/${previewFile.id}/download`}>
                                <Download className="mr-1.5 h-4 w-4" /> Download
                              </a>
                            </Button>
                            <Button asChild className="rounded-xl">
                              <a href={`/api/files/${previewFile.id}/download`} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="mr-1.5 h-4 w-4" /> Open in New Tab
                              </a>
                            </Button>
                          </div>
                        </div>
                      )}
                  </>
                )}
              </div>

              <DialogFooter className="flex sm:justify-between items-center w-full gap-2">
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  File Reference: {previewFile.id}
                </span>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button variant="ghost" onClick={() => setPreviewFile(null)} className="rounded-xl flex-1 sm:flex-none">
                    Close
                  </Button>
                  <Button asChild className="rounded-xl flex-1 sm:flex-none">
                    <a href={`/api/files/${previewFile.id}/download`}>
                      <Download className="mr-1.5 h-4 w-4" /> Download
                    </a>
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      {/* DIALOG: DELETE CONFIRMATION */}
      <Dialog open={itemToDelete !== null} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <DialogContent className="max-w-sm rounded-2xl border border-border bg-background p-6">
          <DialogHeader>
            <DialogTitle>Move item to Trash?</DialogTitle>
            <DialogDescription>
              {itemToDelete && (itemToDelete.mime_type === "application/x-directory"
                ? `"${itemToDelete.filename.split("/").filter(Boolean).pop()}" and all its nested files will be moved to the Trash.`
                : `"${itemToDelete.filename.split("/").filter(Boolean).pop()}" will be moved to the Trash.`
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button variant="ghost" onClick={() => setItemToDelete(null)} className="rounded-xl">
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={executeSoftDelete}
              className="rounded-xl"
            >
              Move to Trash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: REVOKE SHARE CONFIRMATION */}
      <Dialog open={shareTokenToRevoke !== null} onOpenChange={(open) => !open && setShareTokenToRevoke(null)}>
        <DialogContent className="max-w-sm rounded-2xl border border-border bg-background p-6">
          <DialogHeader>
            <DialogTitle>Revoke Share Link?</DialogTitle>
            <DialogDescription>
              This will disable the share link immediately. Anyone visiting the link will no longer be able to download the file.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button variant="ghost" onClick={() => setShareTokenToRevoke(null)} className="rounded-xl">
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={confirmRevokeShare}
              className="rounded-xl"
            >
              Revoke Sharing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
