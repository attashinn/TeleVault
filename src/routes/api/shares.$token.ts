import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/shares/$token")({
  server: {
    handlers: {
      // GET: fetch share metadata publicly. Does NOT stream the file itself.
      GET: async ({ params }) => {
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          // 1. Find the share record
          const { data: shareRow, error: shareError } = await supabaseAdmin
            .from("files")
            .select("*")
            .eq("filename", `shares/${params.token}`)
            .eq("mime_type", "application/x-share-link")
            .maybeSingle();

          if (shareError) {
            return Response.json({ error: shareError.message }, { status: 500 });
          }
          if (!shareRow) {
            return Response.json({ error: "Link not found or invalid" }, { status: 404 });
          }

          // 2. Parse share settings
          let settings = { password: null, expiresAt: null, revoked: false, originalName: "" };
          try {
            settings = JSON.parse(shareRow.channel_id);
          } catch {}

          // 3. Verify validity (expiry & revocation)
          if (settings.revoked) {
            return Response.json({ error: "This link has been revoked by the owner", revoked: true }, { status: 410 });
          }

          if (settings.expiresAt && new Date(settings.expiresAt).getTime() < Date.now()) {
            return Response.json({ error: "This link has expired", expired: true }, { status: 410 });
          }

          // 4. Fetch public file metadata
          const { data: sourceFile, error: fileError } = await supabaseAdmin
            .from("files")
            .select("id, filename, size, mime_type, upload_date")
            .eq("id", shareRow.telegram_file_id)
            .maybeSingle();

          if (fileError) {
            return Response.json({ error: fileError.message }, { status: 500 });
          }
          if (!sourceFile) {
            return Response.json({ error: "Shared file has been deleted from vault" }, { status: 404 });
          }

          // 5. Return info
          return Response.json({
            id: shareRow.id,
            token: params.token,
            passwordRequired: !!settings.password,
            filename: settings.originalName || sourceFile.filename.split("/").pop(),
            size: sourceFile.size,
            mimeType: sourceFile.mime_type,
            uploadDate: sourceFile.upload_date,
            downloadsCount: shareRow.telegram_message_id,
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return Response.json({ error: msg }, { status: 500 });
        }
      },

      // POST: authenticate password and download/stream the file.
      POST: async ({ params, request }) => {
        try {
          const body = await request.json();
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          // 1. Fetch share record
          const { data: shareRow, error: shareError } = await supabaseAdmin
            .from("files")
            .select("*")
            .eq("filename", `shares/${params.token}`)
            .eq("mime_type", "application/x-share-link")
            .maybeSingle();

          if (shareError) {
            return Response.json({ error: shareError.message }, { status: 500 });
          }
          if (!shareRow) {
            return Response.json({ error: "Link not found or invalid" }, { status: 404 });
          }

          // 2. Parse settings
          let settings = { password: null, expiresAt: null, revoked: false, originalName: "" };
          try {
            settings = JSON.parse(shareRow.channel_id);
          } catch {}

          // 3. Verify validity
          if (settings.revoked) {
            return Response.json({ error: "Link revoked" }, { status: 410 });
          }
          if (settings.expiresAt && new Date(settings.expiresAt).getTime() < Date.now()) {
            return Response.json({ error: "Link expired" }, { status: 410 });
          }

          // 4. Authenticate password (if applicable)
          if (settings.password && settings.password !== body.password) {
            return Response.json({ error: "Incorrect password" }, { status: 401 });
          }

          // 5. Fetch source file metadata
          const { data: sourceFile, error: fileError } = await supabaseAdmin
            .from("files")
            .select("*")
            .eq("id", shareRow.telegram_file_id)
            .maybeSingle();

          if (fileError) {
            return Response.json({ error: fileError.message }, { status: 500 });
          }
          if (!sourceFile) {
            return Response.json({ error: "File no longer exists" }, { status: 404 });
          }

          const { downloadFile, TELEGRAM_MAX_DOWNLOAD_BYTES } = await import(
            "@/lib/telegram.server"
          );

          if (sourceFile.size > TELEGRAM_MAX_DOWNLOAD_BYTES) {
            return Response.json(
              {
                error: `This file is ${(sourceFile.size / 1024 / 1024).toFixed(
                  1,
                )} MB. Telegram limits web browser downloads to ${
                  TELEGRAM_MAX_DOWNLOAD_BYTES / 1024 / 1024
                } MB.`,
              },
              { status: 413 },
            );
          }

          // 6. Increment download stats (telegram_message_id)
          await supabaseAdmin
            .from("files")
            .update({ telegram_message_id: shareRow.telegram_message_id + 1 })
            .eq("id", shareRow.id);

          // 7. Download and stream the file
          const dl = await downloadFile(sourceFile.telegram_file_id);

          const originalFilename = settings.originalName || sourceFile.filename.split("/").pop() || sourceFile.filename;

          const headers = new Headers();
          headers.set("Content-Type", sourceFile.mime_type || dl.contentType);
          headers.set(
            "Content-Disposition",
            `attachment; filename="${encodeURIComponent(originalFilename)}"`,
          );
          // Do NOT forward Content-Length — Telegram CDN may compress bytes,
          // causing a mismatch between the header and the decompressed stream size.
          headers.set("Cache-Control", "no-store");

          return new Response(dl.body, { status: 200, headers });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return Response.json({ error: msg }, { status: 500 });
        }
      },

      // DELETE: revoke a share link immediately (deletes metadata row).
      // SECURITY: Checks Clerk userId to verify ownership before allowing deletion.
      DELETE: async ({ params, request }) => {
        try {
          const { getServerAuth } = await import("@/lib/auth.server");
          const { userId } = await getServerAuth(request);
          if (!userId) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          // 1. Fetch current share row to verify ownership
          const { data: shareRow, error: fetchError } = await supabaseAdmin
            .from("files")
            .select("*")
            .eq("filename", `shares/${params.token}`)
            .eq("mime_type", "application/x-share-link")
            .maybeSingle();

          if (fetchError) {
            return Response.json({ error: fetchError.message }, { status: 500 });
          }
          if (!shareRow) {
            return Response.json({ error: "Link not found" }, { status: 404 });
          }

          if (shareRow.user_id !== userId) {
            return Response.json({ error: "Link not found" }, { status: 404 });
          }

          // 2. Perform delete
          const { error } = await supabaseAdmin
            .from("files")
            .delete()
            .eq("id", shareRow.id);

          if (error) {
            return Response.json({ error: error.message }, { status: 500 });
          }

          return Response.json({ ok: true });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return Response.json({ error: msg }, { status: 500 });
        }
      },
    },
  },
});
