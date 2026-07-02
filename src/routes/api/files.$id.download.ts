import { createFileRoute } from "@tanstack/react-router";
import { getServerAuth } from "@/lib/auth.server";

export const Route = createFileRoute("/api/files/$id/download")({
  server: {
    handlers: {
      // Look up metadata, verify ownership, pull the file back from Telegram, stream it.
      // SECURITY: We enforce user_id ownership. A user cannot download another user's file
      // by guessing or enumerating UUIDs.
      GET: async ({ params, request }) => {
        try {
          const { userId } = await getServerAuth(request);
          if (!userId) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          const { data: file, error } = await supabaseAdmin
            .from("files")
            .select("*")
            .eq("id", params.id)
            .maybeSingle();

          if (error) {
            return Response.json({ error: error.message }, { status: 500 });
          }
          if (!file) {
            // Return 404 not 403 to avoid leaking existence of other users' files
            return new Response("Not found", { status: 404 });
          }

          // SECURITY: Ownership check — user may only download their own files.
          // Share links use a separate endpoint (/api/shares/:token) with token-based auth.
          if (file.user_id !== userId) {
            return new Response("Not found", { status: 404 });
          }

          // Block downloads of share-link pseudo-records
          if (file.mime_type === "application/x-share-link") {
            return new Response("Not found", { status: 404 });
          }

          const { downloadFile, TELEGRAM_MAX_DOWNLOAD_BYTES } = await import(
            "@/lib/telegram.server"
          );

          if (file.size > TELEGRAM_MAX_DOWNLOAD_BYTES) {
            return Response.json(
              {
                error: `This file is ${(file.size / 1024 / 1024).toFixed(
                  1,
                )} MB. Telegram bots can only download files up to ${
                  TELEGRAM_MAX_DOWNLOAD_BYTES / 1024 / 1024
                } MB.`,
              },
              { status: 413 },
            );
          }

          const dl = await downloadFile(file.telegram_file_id);

          const filename = file.filename.split("/").filter(Boolean).pop() || file.filename;

          const headers = new Headers();
          headers.set("Content-Type", file.mime_type || dl.contentType);
          // Use the original filename (not the full path) in the Content-Disposition header.
          headers.set(
            "Content-Disposition",
            `attachment; filename="${encodeURIComponent(filename)}"`,
          );
          // Do NOT forward Content-Length from Telegram's CDN.
          // The CDN may serve gzip-compressed bytes whose decompressed size
          // doesn't match the header, causing ERR_CONTENT_LENGTH_MISMATCH.
          // Omitting it lets the browser use chunked streaming instead.
          headers.set("Cache-Control", "no-store");

          return new Response(dl.body, { status: 200, headers });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          console.error("Download failed:", message);
          return Response.json({ error: message }, { status: 500 });
        }
      },
    },
  },
});
