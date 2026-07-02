import { createFileRoute } from "@tanstack/react-router";
import { getServerAuth } from "@/lib/auth.server";

export const Route = createFileRoute("/api/files/$id")({
  server: {
    handlers: {
      // PATCH: rename or move file/folder. If a folder, update all children recursively.
      // SECURITY: Ownership verified — users can only rename their own files.
      PATCH: async ({ params, request }) => {
        try {
          const { userId } = await getServerAuth(request);
          if (!userId) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }

          const body = await request.json();
          if (!body.filename) {
            return Response.json({ error: "filename is required" }, { status: 400 });
          }

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          // 1. Fetch current record
          const { data: item, error: fetchError } = await supabaseAdmin
            .from("files")
            .select("*")
            .eq("id", params.id)
            .maybeSingle();

          if (fetchError) {
            return Response.json({ error: fetchError.message }, { status: 500 });
          }
          if (!item) {
            return Response.json({ error: "Item not found" }, { status: 404 });
          }

          // SECURITY: Ownership check
          if (item.user_id !== userId) {
            return Response.json({ error: "Item not found" }, { status: 404 });
          }

          const oldPath = item.filename;
          const newPath = body.filename;

          // 2. If it is a folder, recursively rename all nested items
          if (item.mime_type === "application/x-directory") {
            const { data: children, error: childrenError } = await supabaseAdmin
              .from("files")
              .select("*")
              .like("filename", `${oldPath}%`);

            if (childrenError) {
              return Response.json({ error: childrenError.message }, { status: 500 });
            }

            if (children && children.length > 0) {
              for (const child of children) {
                if (child.id === item.id) continue; // Skip root folder itself

                const updatedFilename = child.filename.replace(oldPath, newPath);
                await supabaseAdmin
                  .from("files")
                  .update({ filename: updatedFilename })
                  .eq("id", child.id);
              }
            }
          }

          // 3. Update the folder/file record itself
          const { data: updatedItem, error: updateError } = await supabaseAdmin
            .from("files")
            .update({ filename: newPath })
            .eq("id", params.id)
            .select()
            .single();

          if (updateError) {
            return Response.json({ error: updateError.message }, { status: 500 });
          }

          return Response.json({ file: updatedItem });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          return Response.json({ error: message }, { status: 500 });
        }
      },

      // DELETE: remove metadata row. If it's a folder, remove all nested contents.
      // SECURITY: Ownership verified — users can only delete their own files.
      DELETE: async ({ params, request }) => {
        try {
          const { userId } = await getServerAuth(request);
          if (!userId) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          const { data: item, error: fetchError } = await supabaseAdmin
            .from("files")
            .select("*")
            .eq("id", params.id)
            .maybeSingle();

          if (fetchError) {
            return Response.json({ error: fetchError.message }, { status: 500 });
          }
          if (!item) {
            return Response.json({ error: "Item not found" }, { status: 404 });
          }

          // SECURITY: Ownership check — return 404 not 403 to avoid leaking file existence
          if (item.user_id !== userId) {
            return Response.json({ error: "Item not found" }, { status: 404 });
          }

          if (item.mime_type === "application/x-directory") {
            const { error: deleteError } = await supabaseAdmin
              .from("files")
              .delete()
              .like("filename", `${item.filename}%`);

            if (deleteError) {
              return Response.json({ error: deleteError.message }, { status: 500 });
            }
          } else {
            const { error: deleteError } = await supabaseAdmin
              .from("files")
              .delete()
              .eq("id", params.id);

            if (deleteError) {
              return Response.json({ error: deleteError.message }, { status: 500 });
            }
          }

          return Response.json({ ok: true });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          return Response.json({ error: message }, { status: 500 });
        }
      },
    },
  },
});
