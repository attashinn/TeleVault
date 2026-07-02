import { createFileRoute } from "@tanstack/react-router";
import { UserPlus, Users } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard/team")({
  component: TeamPage,
  head: () => ({ meta: [{ title: "Team — TeleVault" }] }),
});

function TeamPage() {
  return (
    <div>
      <PageHeader
        eyebrow="People"
        title="Team"
        description="Invite collaborators to your workspace."
        actions={
          <Button className="rounded-xl">
            <UserPlus className="mr-1.5 h-4 w-4" /> Invite people
          </Button>
        }
      />
      <EmptyState
        icon={Users}
        title="You're flying solo"
        description="Invite teammates to collaborate on files and folders in real time."
        action={
          <Button className="rounded-xl">
            <UserPlus className="mr-1.5 h-4 w-4" /> Send an invite
          </Button>
        }
      />
    </div>
  );
}
