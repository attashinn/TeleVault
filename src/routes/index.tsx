import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  CloudUpload,
  Fingerprint,
  Github,
  Layers,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <Hero />
        <Features />
        <ShowcaseStrip />
        <CTA />
      </main>
      <SiteFooter />
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#showcase" className="hover:text-foreground">Product</a>
          <a href="#pricing" className="hover:text-foreground">Pricing</a>
          <a href="#docs" className="hover:text-foreground">Docs</a>
        </nav>
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm" className="rounded-xl">
            <Link to="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm" className="rounded-xl">
            <Link to="/signup">
              Get started <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="absolute inset-0 -z-10 grid-bg opacity-70" />
      <div className="absolute left-1/2 top-0 -z-10 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-brand/20 blur-[120px]" />

      <div className="mx-auto max-w-7xl px-6 pb-24 pt-20 md:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1 text-xs text-muted-foreground shadow-soft">
            <Sparkles className="h-3.5 w-3.5 text-brand" />
            Now in private beta — invitations rolling out weekly
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-6xl">
            A calmer home for{" "}
            <span className="font-display italic text-brand">everything</span> your team ships.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
            TeleVault is a modern cloud workspace where files, folders, and collaborators
            live together — with the polish of Linear and the depth of Drive.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="rounded-xl">
              <Link to="/signup">
                Start for free <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="rounded-xl">
              <a href="#features">See how it works</a>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            35 GB free · No credit card required · Cancel any time
          </p>
        </div>

        <div className="relative mx-auto mt-16 max-w-5xl">
          <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-brand/30 via-brand/5 to-transparent blur-2xl" />
          <div className="glass rounded-3xl p-2 shadow-elevated">
            <MockDashboard />
          </div>
        </div>
      </div>
    </section>
  );
}

function MockDashboard() {
  return (
    <div className="overflow-hidden rounded-2xl bg-surface">
      <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-brand/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
        <span className="ml-3 text-xs text-muted-foreground">televault.app / dashboard</span>
      </div>
      <div className="grid grid-cols-[180px_1fr] gap-0">
        <div className="border-r border-border p-4">
          <div className="space-y-1.5">
            {["Home", "My Files", "Shared", "Favorites", "Trash"].map((l, i) => (
              <div
                key={l}
                className={`rounded-lg px-3 py-2 text-xs ${
                  i === 1 ? "bg-accent text-foreground" : "text-muted-foreground"
                }`}
              >
                {l}
              </div>
            ))}
          </div>
        </div>
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Workspace</p>
              <p className="text-sm font-semibold">My Files</p>
            </div>
            <div className="h-7 w-20 rounded-lg bg-primary" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] rounded-xl border border-border bg-muted/50" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const features = [
  {
    icon: CloudUpload,
    title: "Effortless uploads",
    desc: "Drag, drop, resume. TeleVault handles files up to 50 GB with graceful retries.",
  },
  {
    icon: Fingerprint,
    title: "End-to-end privacy",
    desc: "Your data is encrypted at rest and in transit. You own the keys. Always.",
  },
  {
    icon: Users,
    title: "Built for teams",
    desc: "Shared spaces, granular roles, and comments that live next to the file.",
  },
  {
    icon: Layers,
    title: "Organized by design",
    desc: "Smart folders, saved views, and tags — so nothing important ever gets lost.",
  },
  {
    icon: Zap,
    title: "Instant search",
    desc: "Find any file in milliseconds — by name, contents, tag, owner, or date.",
  },
  {
    icon: CheckCircle2,
    title: "Version history",
    desc: "Every save is preserved. Roll back to any version with a single click.",
  },
];

function Features() {
  return (
    <section id="features" className="border-b border-border py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-brand">Features</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Everything you'd expect. Nothing you wouldn't.
          </h2>
          <p className="mt-4 text-muted-foreground">
            A carefully considered set of primitives that scale from solo creator to
             hundred-person team.
          </p>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-border bg-surface p-6 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated"
            >
              <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-brand-muted text-brand transition-colors group-hover:bg-brand group-hover:text-brand-foreground">
                <f.icon className="h-5 w-5" strokeWidth={2} />
              </div>
              <h3 className="text-base font-semibold tracking-tight">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ShowcaseStrip() {
  return (
    <section id="showcase" className="border-b border-border bg-surface/40 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-brand">
              A workspace, not a folder
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Organized like your mind.{" "}
              <span className="font-display italic text-muted-foreground">
                Not your file system.
              </span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              TeleVault gives you sidebars, saved views, favorites, and shared spaces —
              the primitives you already use across Notion, Linear, and Figma.
            </p>
            <ul className="mt-8 space-y-3 text-sm">
              {[
                "Sidebar navigation with pinned spaces",
                "Command palette from anywhere (⌘K)",
                "Keyboard-first, mouse-optional",
                "Native light and dark modes",
              ].map((t) => (
                <li key={t} className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-brand" />
                  <span className="text-muted-foreground">{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-tr from-brand/20 to-transparent blur-2xl" />
            <div className="glass rounded-3xl p-2 shadow-elevated">
              <MockDashboard />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section id="pricing" className="py-24">
      <div className="mx-auto max-w-4xl px-6">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-primary p-12 text-center text-primary-foreground shadow-elevated">
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-brand/40 blur-3xl" />
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Bring calm to your cloud.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-primary-foreground/70">
            Sign up in seconds. Start with 35 GB free, upgrade whenever you need more.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" variant="secondary" className="rounded-xl">
              <Link to="/signup">Create your workspace</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="ghost"
              className="rounded-xl text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Link to="/login">I already have one</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
        <Logo size="sm" />
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} TeleVault. Built with care.
        </p>
        <a
          href="#"
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <Github className="h-3.5 w-3.5" />
          Open source
        </a>
      </div>
    </footer>
  );
}
