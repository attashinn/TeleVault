import { createFileRoute } from "@tanstack/react-router";
import { Camera } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/dashboard/profile")({
  component: ProfilePage,
  head: () => ({ meta: [{ title: "Profile — TeleVault" }] }),
});

function ProfilePage() {
  return (
    <div>
      <PageHeader
        eyebrow="Account"
        title="Profile"
        description="How you appear across TeleVault."
      />

      <section className="rounded-2xl border border-border bg-surface p-6 shadow-soft">
        <div className="flex items-center gap-5">
          <div className="relative">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-brand text-lg font-semibold text-brand-foreground">
                TV
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full border border-border bg-surface shadow-soft hover:bg-accent"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight">Your name</p>
            <p className="text-sm text-muted-foreground">Update your photo and details.</p>
          </div>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fullname">Full name</Label>
            <Input id="fullname" placeholder="Ada Lovelace" className="h-10 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@company.com" className="h-10 rounded-xl" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              rows={3}
              placeholder="A short line about you."
              className="rounded-xl"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" className="rounded-xl">Cancel</Button>
          <Button className="rounded-xl">Save changes</Button>
        </div>
      </section>
    </div>
  );
}
