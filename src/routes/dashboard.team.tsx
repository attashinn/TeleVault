import { createFileRoute } from "@tanstack/react-router";
import { UserPlus, Users, Mail, MoreHorizontal, Shield, Trash2, Copy } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/team")({
  component: TeamPage,
  head: () => ({ meta: [{ title: "Team — TeleVault" }] }),
});

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "admin" | "member";
  avatar?: string;
  joinedAt: Date;
}

function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([
    {
      id: "1",
      name: "You",
      email: "your.email@example.com",
      role: "admin",
      joinedAt: new Date(2026, 0, 15),
    },
    {
      id: "2",
      name: "John Doe",
      email: "john@example.com",
      role: "member",
      joinedAt: new Date(2026, 1, 20),
    },
    {
      id: "3",
      name: "Sarah Smith",
      email: "sarah@example.com",
      role: "member",
      joinedAt: new Date(2026, 2, 10),
    },
  ]);

  const [inviteEmail, setInviteEmail] = useState("");
  const [openDialog, setOpenDialog] = useState(false);

  const handleInvite = () => {
    if (inviteEmail) {
      console.log("Inviting:", inviteEmail);
      setInviteEmail("");
      setOpenDialog(false);
    }
  };

  const removeMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="People"
        title="Team"
        description="Manage your workspace collaborators."
        actions={
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button className="rounded-lg">
                <UserPlus className="mr-1.5 h-4 w-4" /> Invite people
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Invite to workspace</DialogTitle>
                <DialogDescription>
                  Send an invite to collaborate on files and folders.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email address</label>
                  <Input
                    placeholder="colleague@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setOpenDialog(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleInvite} className="flex-1" disabled={!inviteEmail}>
                    Send invite
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {members.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-border/60 py-12">
          <Users className="mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="mb-1 font-medium text-foreground">You're flying solo</p>
          <p className="mb-4 max-w-xs text-center text-sm text-muted-foreground">
            Invite teammates to collaborate on files and folders in real time.
          </p>
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button className="rounded-lg" size="sm">
                <UserPlus className="mr-1.5 h-4 w-4" /> Send an invite
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Invite to workspace</DialogTitle>
                <DialogDescription>
                  Send an invite to collaborate on files and folders.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email address</label>
                  <Input
                    placeholder="colleague@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setOpenDialog(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleInvite} className="flex-1" disabled={!inviteEmail}>
                    Send invite
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border/60 bg-background/95 shadow-sm">
        <div className="overflow-x-auto">
          <div className="inline-grid min-w-full grid-cols-[1fr_100px_120px_40px] md:grid-cols-[1fr_120px_140px_40px] items-center gap-3 border-b border-border/50 px-3 sm:px-4 py-2.5 text-[10px] xs:text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <span>Member</span>
            <span>Role</span>
            <span>Joined</span>
            <span></span>
          </div>
        </div>

          {/* Members list */}
          <div className="divide-y divide-border/40">
            {members.map((member) => (
              <div
                key={member.id}
                className="grid grid-cols-[1fr_100px_120px_40px] md:grid-cols-[1fr_120px_140px_40px] items-center gap-3 px-3 sm:px-4 py-2.5 xs:py-3 hover:bg-muted/30 transition-colors text-xs xs:text-sm"
              >
                {/* Member info */}
                <div className="flex items-center gap-2 xs:gap-3 min-w-0">
                  <div className="flex h-7 xs:h-8 w-7 xs:w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-[9px] xs:text-xs font-bold text-brand">
                    {getInitials(member.name)}
                  </div>
                  <div className="min-w-0 hidden xs:block">
                    <p className="truncate font-medium text-foreground">{member.name}</p>
                    <p className="truncate text-[10px] text-muted-foreground">{member.email}</p>
                  </div>
                  <div className="min-w-0 xs:hidden block">
                    <p className="truncate text-xs font-medium text-foreground">{member.name}</p>
                  </div>
                </div>

                {/* Role */}
                <div className="flex items-center gap-1">
                  {member.role === "admin" && (
                    <>
                      <Shield className="h-3 w-3 text-brand hidden xs:block" />
                      <span className="text-[10px] xs:text-xs font-medium text-foreground">Admin</span>
                    </>
                  )}
                  {member.role === "member" && (
                    <span className="text-[10px] xs:text-xs text-muted-foreground">Member</span>
                  )}
                </div>

                {/* Joined date */}
                <div>
                  <span className="text-[10px] xs:text-xs text-muted-foreground">{formatDate(member.joinedAt)}</span>
                </div>

                {/* Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    {member.id !== "1" && (
                      <>
                        <DropdownMenuItem className="text-xs cursor-pointer">
                          <Mail className="mr-2 h-3.5 w-3.5" /> Resend invite
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-xs text-destructive cursor-pointer"
                          onClick={() => removeMember(member.id)}
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" /> Remove
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}"
          </div>
        </div>
      )}

      {/* Info card */}
      <div className="rounded-lg border border-border/60 bg-brand/5 px-4 py-3 text-sm">
        <p className="font-medium text-foreground mb-1">Team limit: {members.length} of 10</p>
        <p className="text-xs text-muted-foreground">
          Upgrade your plan to add more team members to your workspace.
        </p>
      </div>
    </div>
  );
}
