// Telegram Bot API helpers — server only.
// Calls the official Telegram Bot API directly using the bot token.

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function getTelegramBase(): string {
  return `https://api.telegram.org/bot${requireEnv("TELEGRAM_API_KEY")}`;
}

// Telegram Bot API hard limits.
export const TELEGRAM_MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // 50 MB
export const TELEGRAM_MAX_DOWNLOAD_BYTES = 20 * 1024 * 1024; // 20 MB

export function getChannelId(): string {
  return requireEnv("TELEGRAM_CHANNEL_ID");
}

type SendDocumentResult = {
  messageId: number;
  fileId: string;
  fileUniqueId: string;
  fileSize: number;
  mimeType: string;
};

// Uploads a file (as a Document) to the configured private channel.
// Returns the Telegram message ID and file identifiers needed later for download.
export async function sendDocument(
  file: File,
  chatId: string,
): Promise<SendDocumentResult> {
  const form = new FormData();
  form.append("chat_id", chatId);
  form.append("document", file, file.name);

  const res = await fetch(`${getTelegramBase()}/sendDocument`, {
    method: "POST",
    body: form,
  });

  const json = (await res.json()) as {
    ok: boolean;
    description?: string;
    result?: {
      message_id: number;
      document?: {
        file_id: string;
        file_unique_id: string;
        file_size?: number;
        mime_type?: string;
      };
    };
  };

  if (!res.ok || !json.ok || !json.result) {
    throw new Error(
      `Telegram sendDocument failed [${res.status}]: ${json.description ?? JSON.stringify(json)}`,
    );
  }

  const doc = json.result.document;
  if (!doc) {
    throw new Error("Telegram sendDocument: response missing document");
  }

  return {
    messageId: json.result.message_id,
    fileId: doc.file_id,
    fileUniqueId: doc.file_unique_id,
    fileSize: doc.file_size ?? file.size,
    mimeType: doc.mime_type ?? file.type ?? "application/octet-stream",
  };
}

// Fetches a stored file back from Telegram. Returns a Response body stream ready to relay to the client.
export async function downloadFile(fileId: string): Promise<{
  body: ReadableStream<Uint8Array>;
  contentType: string;
  contentLength: string | null;
}> {
  const base = getTelegramBase();

  // Step 1: getFile → file_path
  const infoRes = await fetch(`${base}/getFile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file_id: fileId }),
  });

  const info = (await infoRes.json()) as {
    ok: boolean;
    description?: string;
    result?: { file_path?: string; file_size?: number };
  };

  if (!infoRes.ok || !info.ok || !info.result?.file_path) {
    throw new Error(
      `Telegram getFile failed [${infoRes.status}]: ${info.description ?? JSON.stringify(info)}`,
    );
  }

  // Step 2: download the file bytes from the CDN
  const token = requireEnv("TELEGRAM_API_KEY");
  const dl = await fetch(
    `https://api.telegram.org/file/bot${token}/${info.result.file_path}`,
  );

  if (!dl.ok || !dl.body) {
    throw new Error(`Telegram file download failed [${dl.status}]`);
  }

  return {
    body: dl.body,
    contentType: dl.headers.get("content-type") ?? "application/octet-stream",
    contentLength: dl.headers.get("content-length"),
  };
}
