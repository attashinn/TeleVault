import { createFileRoute } from "@tanstack/react-router";
import { getServerAuth } from "@/lib/auth.server";

export const Route = createFileRoute("/api/files")({
  server: {
    handlers: {
      // List all file metadata (newest first) — scoped to the current Clerk user.
      // SECURITY: Excludes internal Telegram details; scopes to the authenticated user.
      GET: async ({ request }) => {
        try {
          const { userId } = await getServerAuth(request);
          if (!userId) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data, error } = await supabaseAdmin
            .from("files")
            .select("id, user_id, filename, size, mime_type, telegram_message_id, upload_date")
            .eq("user_id", userId)
            .order("upload_date", { ascending: false });

          if (error) {
            return Response.json({ error: error.message }, { status: 500 });
          }
          return Response.json({ files: data ?? [] });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          return Response.json({ error: message }, { status: 500 });
        }
      },

      // POST handler: accepts multipart file upload or JSON for folders and copying.
      POST: async ({ request }) => {
        try {
          const { userId } = await getServerAuth(request);
          if (!userId) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }

          const contentType = request.headers.get("content-type") || "";

          if (contentType.includes("application/json")) {
            const body = await request.json();

            // Case A: Create Virtual Folder
            if (body.isFolder) {
              const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
              const { data, error } = await supabaseAdmin
                .from("files")
                .insert({
                  user_id: userId,
                  filename: body.name, // e.g. "Documents/"
                  size: 0,
                  mime_type: "application/x-directory",
                  telegram_message_id: 0,
                  telegram_file_id: "",
                  channel_id: "virtual",
                })
                .select()
                .single();

              if (error) {
                return Response.json({ error: error.message }, { status: 500 });
              }
              return Response.json({ file: data }, { status: 201 });
            }

            // Case B: Copy File Metadata
            if (body.copyFromId) {
              const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
              const { data: sourceFile, error: findError } = await supabaseAdmin
                .from("files")
                .select("*")
                .eq("id", body.copyFromId)
                .maybeSingle();

              if (findError) {
                return Response.json({ error: findError.message }, { status: 500 });
              }
              if (!sourceFile) {
                return Response.json({ error: "Source file not found" }, { status: 404 });
              }

              // SECURITY: verify ownership of the source file
              if (sourceFile.user_id !== userId) {
                return Response.json({ error: "Unauthorized" }, { status: 403 });
              }

              const { data: newFile, error: insertError } = await supabaseAdmin
                .from("files")
                .insert({
                  user_id: userId,
                  filename: body.filename, // New location path
                  size: sourceFile.size,
                  mime_type: sourceFile.mime_type,
                  telegram_message_id: sourceFile.telegram_message_id,
                  telegram_file_id: sourceFile.telegram_file_id,
                  channel_id: sourceFile.channel_id,
                })
                .select()
                .single();

              if (insertError) {
                return Response.json({ error: insertError.message }, { status: 500 });
              }
              return Response.json({ file: newFile }, { status: 201 });
            }

            return Response.json({ error: "Invalid action for JSON request" }, { status: 400 });
          }

          // Case C: Standard File Upload to Telegram
          const {
            sendDocument,
            getChannelId,
            TELEGRAM_MAX_UPLOAD_BYTES,
          } = await import("@/lib/telegram.server");

          const form = await request.formData();
          const file = form.get("file");
          if (!(file instanceof File)) {
            return Response.json(
              { error: "No file provided in 'file' field." },
              { status: 400 },
            );
          }

          if (file.size > TELEGRAM_MAX_UPLOAD_BYTES) {
            return Response.json(
              {
                error: `File is too large. Telegram bots can only upload files up to ${
                  TELEGRAM_MAX_UPLOAD_BYTES / 1024 / 1024
                } MB.`,
              },
              { status: 413 },
            );
          }

          const channelId = getChannelId();
          const sent = await sendDocument(file, channelId);

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data, error } = await supabaseAdmin
            .from("files")
            .insert({
              user_id: userId,
              filename: file.name,
              size: sent.fileSize,
              mime_type: sent.mimeType,
              telegram_message_id: sent.messageId,
              telegram_file_id: sent.fileId,
              channel_id: channelId,
            })
            .select()
            .single();

          if (error) {
            return Response.json({ error: error.message }, { status: 500 });
          }

          return Response.json({ file: data }, { status: 201 });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          console.error("Upload failed:", message);
          return Response.json({ error: message }, { status: 500 });
        }
      },
    },
  },
});
