import { createFileRoute } from "@tanstack/react-router";
import { getServerAuth } from "@/lib/auth.server";

export const Route = createFileRoute("/api/shares")({
  server: {
    handlers: {
      // GET: retrieve shared links scoped to the current Clerk user.
      // SECURITY: Only returns shares owned by the current user — not all shares in the DB.
      GET: async ({ request }) => {
        try {
          const { userId } = await getServerAuth(request);
          if (!userId) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          const { data, error } = await supabaseAdmin
            .from("files")
            .select("*")
            .eq("mime_type", "application/x-share-link")
            .eq("user_id", userId)
            .order("upload_date", { ascending: false });

          if (error) {
            return Response.json({ error: error.message }, { status: 500 });
          }

          const shares = (data ?? []).map((row) => {
            let metadata = { password: null, expiresAt: null, revoked: false, originalName: "" };
            try {
              metadata = JSON.parse(row.channel_id);
            } catch {}

            return {
              id: row.id,
              token: row.filename.replace("shares/", ""),
              // SECURITY: fileId is the internal DB reference — NOT the raw Telegram file_id.
              // We return only the metadata fields needed to render the share list UI.
              fileId: row.telegram_file_id,
              downloadsCount: row.telegram_message_id,
              createdDate: row.upload_date,
              passwordProtected: !!metadata.password,
              expiresAt: metadata.expiresAt,
              revoked: metadata.revoked,
              originalName: metadata.originalName,
            };
          });

          return Response.json({ shares });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return Response.json({ error: msg }, { status: 500 });
        }
      },

      // POST: create a new share link.
      // SECURITY: Verifies ownership of the source file before creating a share.
      POST: async ({ request }) => {
        try {
          const { userId } = await getServerAuth(request);
          if (!userId) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }

          const body = await request.json();
          if (!body.fileId) {
            return Response.json({ error: "fileId is required" }, { status: 400 });
          }

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          // 1. Verify original file exists AND belongs to the current user
          const { data: sourceFile, error: fetchError } = await supabaseAdmin
            .from("files")
            .select("*")
            .eq("id", body.fileId)
            .maybeSingle();

          if (fetchError) {
            return Response.json({ error: fetchError.message }, { status: 500 });
          }
          if (!sourceFile) {
            return Response.json({ error: "Source file not found" }, { status: 404 });
          }

          // SECURITY: Ownership check — users can only share their own files.
          // Return 404 (not 403) to avoid leaking existence of other users' files.
          if (sourceFile.user_id !== userId) {
            return Response.json({ error: "Source file not found" }, { status: 404 });
          }

          // SECURITY: Use crypto.randomUUID() — cryptographically secure random (122-bit entropy).
          // Math.random() is NOT a CSPRNG and its output is predictable; never use it for tokens.
          const token =
            crypto.randomUUID().replace(/-/g, "") +
            crypto.randomUUID().replace(/-/g, "").slice(0, 8);

          // 3. Serialize settings into channel_id field
          const settings = {
            password: body.password || null,
            expiresAt: body.expiresAt || null,
            revoked: false,
            originalName: sourceFile.filename.split("/").pop() || sourceFile.filename,
          };

          // 4. Create share link record owned by the authenticated Clerk user
          const { data: shareLink, error: insertError } = await supabaseAdmin
            .from("files")
            .insert({
              user_id: userId,
              filename: `shares/${token}`,
              size: 0,
              mime_type: "application/x-share-link",
              telegram_file_id: body.fileId, // Reference the source file ID
              telegram_message_id: 0, // Used as download statistics counter
              channel_id: JSON.stringify(settings),
            })
            .select()
            .single();

          if (insertError) {
            return Response.json({ error: insertError.message }, { status: 500 });
          }

          return Response.json({
            success: true,
            share: {
              id: shareLink.id,
              token,
              fileId: body.fileId,
              downloadsCount: 0,
              createdDate: shareLink.upload_date,
              passwordProtected: !!settings.password,
              expiresAt: settings.expiresAt,
              revoked: settings.revoked,
              originalName: settings.originalName,
            },
          }, { status: 201 });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return Response.json({ error: msg }, { status: 500 });
        }
      },
    },
  },
});
