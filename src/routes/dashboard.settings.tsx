import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
  head: () => ({ meta: [{ title: "Settings — TeleVault" }] }),
});

function SettingsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Preferences"
        title="Settings"
        description="Manage your workspace, security, and notifications."
      />

      <div className="space-y-6">
        <SettingsCard
          title="Workspace"
          description="How TeleVault appears to you and your team."
        >
          <Field label="Workspace name">
            <Input defaultValue="My Workspace" className="h-10 rounded-xl" />
          </Field>
          <Field label="Workspace URL">
            <Input defaultValue="televault.app/my-workspace" className="h-10 rounded-xl" />
          </Field>
        </SettingsCard>

        <SettingsCard title="Notifications" description="Choose what you want to hear about.">
          <ToggleRow
            label="Email notifications"
            description="Get an email when files are shared with you."
            defaultChecked
          />
          <Separator />
          <ToggleRow
            label="Product updates"
            description="Occasional announcements about new TeleVault features."
          />
        </SettingsCard>

        <SettingsCard
          title="Danger zone"
          description="Irreversible actions. Proceed with care."
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Delete workspace</p>
              <p className="text-xs text-muted-foreground">
                Permanently remove your workspace and all files.
              </p>
            </div>
            <Button variant="destructive" className="rounded-xl">
              Delete
            </Button>
          </div>
        </SettingsCard>
      </div>
    </div>
  );
}

function SettingsCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-6 shadow-soft">
      <div className="mb-5">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5 sm:grid-cols-[200px_1fr] sm:items-center sm:gap-4">
      <Label className="text-sm text-muted-foreground">{label}</Label>
      <div>{children}</div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  defaultChecked,
}: {
  label: string;
  description: string;
  defaultChecked?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="pr-4">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch defaultChecked={defaultChecked} />
    </div>
  );
}
