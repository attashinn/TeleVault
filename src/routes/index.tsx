import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Github,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { HeroSection, LogosSection } from "@/components/ui/hero-1";
import CombinedFeaturedSection from "@/components/ui/combined-featured-section";
import { WorldMap } from "@/components/ui/map";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <HeroSection />
        <LogosSection />
        <CombinedFeaturedSection />
        <GlobalNetwork />
        <ShowcaseStrip />
        <CTA />
      </main>
      <SiteFooter />
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />
        <nav className="hidden items-center gap-2 text-sm text-muted-foreground md:flex">
          {[
            { label: "Features", href: "#features" },
            { label: "Product", href: "#showcase" },
            { label: "Pricing", href: "#pricing" },
            { label: "Docs", href: "#docs" },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="rounded-full px-3 py-1.5 transition-colors hover:bg-accent hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm" className="rounded-full">
            <Link to="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm" className="rounded-full">
            <Link to="/signup">
              Get started <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}



function GlobalNetwork() {
  return (
    <section className="relative overflow-hidden border-b border-border/70 bg-gradient-to-b from-background via-background to-muted/20 py-12 xs:py-16 sm:py-24">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,oklch(var(--brand)/0.12),transparent_55%)]" />
      <div className="mx-auto max-w-6xl px-3 xs:px-4 sm:px-6 lg:px-8 text-center">
        <p className="mb-2 xs:mb-3 text-[10px] xs:text-xs font-medium uppercase tracking-[0.2em] xs:tracking-[0.24em] text-brand">
          Powered by Telegram
        </p>
        <h2 className="text-2xl xs:text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
          Store anywhere. <span className="font-display italic text-muted-foreground">Access everywhere.</span>
        </h2>
        <p className="mx-auto max-w-2xl py-3 xs:py-4 text-xs xs:text-sm sm:text-lg leading-6 sm:leading-7 text-muted-foreground">
          TeleVault uses Telegram's global infrastructure to store your files — giving you
          rock-solid reliability and instant access from any device, anywhere in the world.
        </p>
      </div>
      <div className="mx-auto mt-6 xs:mt-8 max-w-6xl px-3 xs:px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-lg xs:rounded-xl lg:rounded-[1.75rem] border border-border/70 bg-background/70 p-2 xs:p-3 shadow-soft backdrop-blur">
          <WorldMap
          dots={[
            {
              start: { lat: 64.2008, lng: -149.4937, label: "Fairbanks" },
              end: { lat: 34.0522, lng: -118.2437, label: "Los Angeles" },
            },
            {
              start: { lat: 64.2008, lng: -149.4937, label: "Fairbanks" },
              end: { lat: -15.7975, lng: -47.8919, label: "Brasília" },
            },
            {
              start: { lat: -15.7975, lng: -47.8919, label: "Brasília" },
              end: { lat: 38.7223, lng: -9.1393, label: "Lisbon" },
            },
            {
              start: { lat: 51.5074, lng: -0.1278, label: "London" },
              end: { lat: 28.6139, lng: 77.209, label: "New Delhi" },
            },
            {
              start: { lat: 28.6139, lng: 77.209, label: "New Delhi" },
              end: { lat: 43.1332, lng: 131.9113, label: "Vladivostok" },
            },
            {
              start: { lat: 28.6139, lng: 77.209, label: "New Delhi" },
              end: { lat: -1.2921, lng: 36.8219, label: "Nairobi" },
            },
          ]}
          />
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

function ShowcaseStrip() {
  return (
    <section id="showcase" className="border-b border-border py-12 xs:py-16 sm:py-24 overflow-hidden">
      <div className="mx-auto max-w-7xl px-3 xs:px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 xs:mb-12 sm:mb-16 max-w-2xl">
          <p className="text-[10px] xs:text-xs font-medium uppercase tracking-[0.15em] xs:tracking-wider text-brand mb-2 xs:mb-3">
            Built for the way you work
          </p>
          <h2 className="text-2xl xs:text-3xl sm:text-4xl font-semibold tracking-tight">
            A workspace that fits <br />
            <span className="font-display italic text-muted-foreground">
              how your team thinks.
            </span>
          </h2>
          <p className="mt-3 xs:mt-4 text-xs xs:text-sm sm:text-base text-muted-foreground leading-relaxed">
            TeleVault isn't just a file dump — it's a full workspace. Organize files into folders,
            pin your most-used spaces, and share with a single link. No chaos, no clutter.
          </p>
        </div>

        {/* Bento grid */}
        <div className="grid gap-3 xs:gap-4 lg:grid-cols-5 lg:grid-rows-2">
          {/* Dashboard preview — spans 3 cols, 2 rows */}
          <div className="relative overflow-hidden rounded-lg xs:rounded-xl lg:rounded-2xl border border-border bg-surface lg:col-span-3 lg:row-span-2">
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand/10 via-transparent to-transparent" />
            <div className="p-3 xs:p-4 sm:p-6 pb-0">
              <p className="text-[10px] xs:text-xs font-medium text-brand uppercase tracking-wider mb-1">Live preview</p>
              <p className="text-xs xs:text-sm font-semibold text-foreground">Your workspace, beautifully organized</p>
            </div>
            <div className="mt-4 xs:mt-6 px-3 xs:px-4 sm:px-6 overflow-hidden">
              <div className="rounded-t-lg xs:rounded-t-xl border border-border border-b-0 overflow-hidden shadow-elevated">
                <MockDashboard />
              </div>
            </div>
          </div>

          {/* Feature pills — right column */}
          {[
            {
              label: "Sidebar navigation",
              desc: "Pinned spaces, smart folders, and saved views all in one place.",
              icon: "⌘",
            },
            {
              label: "Command palette",
              desc: "Jump to any file, action, or setting from anywhere with ⌘K.",
              icon: "⌨",
            },
            {
              label: "Keyboard-first",
              desc: "Full keyboard navigation — no mouse required for power users.",
              icon: "↑",
            },
            {
              label: "Dark & light modes",
              desc: "Automatically follows your system, or set it manually anytime.",
              icon: "◑",
            },
          ].map((f) => (
            <div
              key={f.label}
              className="group flex items-start gap-3 xs:gap-4 rounded-lg xs:rounded-xl lg:rounded-2xl border border-border bg-surface p-3 xs:p-4 sm:p-5 transition-all hover:-translate-y-0.5 hover:shadow-elevated hover:border-brand/30 lg:col-span-2"
            >
              <div className="grid h-7 xs:h-8 sm:h-9 w-7 xs:w-8 sm:w-9 shrink-0 place-items-center rounded-lg xs:rounded-lg border border-border bg-background text-sm xs:text-base font-bold text-brand">
                {f.icon}
              </div>
              <div>
                <p className="text-xs xs:text-sm font-semibold text-foreground">{f.label}</p>
                <p className="mt-0.5 text-[10px] xs:text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section id="pricing" className="border-b border-border py-12 xs:py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-3 xs:px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-xl xs:rounded-2xl lg:rounded-[2rem] border border-white/10 bg-gradient-to-br from-foreground via-[#121726] to-[#232a3d] text-background shadow-[0_35px_90px_-35px_rgba(15,23,42,0.4)]">
          <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-brand/10 blur-3xl" />

          <div className="relative grid gap-0 lg:grid-cols-2">
            {/* Left: copy */}
            <div className="p-6 xs:p-8 sm:p-10 md:p-12 lg:p-14 xl:p-16 flex flex-col justify-center">
              <p className="text-[10px] xs:text-xs font-medium uppercase tracking-[0.15em] xs:tracking-wider text-brand mb-2 xs:mb-3 sm:mb-4">
                Get started free
              </p>
              <h2 className="text-2xl xs:text-3xl sm:text-4xl font-semibold tracking-tight text-background">
                Bring calm to your cloud.
              </h2>
              <p className="mt-3 xs:mt-4 text-xs xs:text-sm text-background/60 max-w-sm leading-relaxed">
                Sign up in seconds. Start with 35 GB free — no credit card required.
                Upgrade whenever your team grows.
              </p>
              <div className="mt-6 xs:mt-8 flex flex-col xs:flex-row gap-2 xs:gap-3">
                <Button asChild size="sm" variant="secondary" className="rounded-lg xs:rounded-lg text-xs xs:text-sm h-8 xs:h-9">
                  <Link to="/signup">Create your workspace</Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  variant="ghost"
                  className="rounded-lg xs:rounded-lg text-xs xs:text-sm text-background hover:bg-background/10 hover:text-background h-8 xs:h-9"
                >
                  <Link to="/login">I already have one</Link>
                </Button>
              </div>
              <p className="mt-4 xs:mt-5 text-[10px] xs:text-xs text-background/40">
                35 GB free · No credit card · Cancel anytime
              </p>
            </div>

            {/* Right: stat cards */}
            <div className="hidden gap-px border-l border-white/10 lg:grid lg:grid-cols-2">
              {[
                { value: "35 GB", label: "Free storage" },
                { value: "∞", label: "Collaborators" },
                { value: "99.9%", label: "Uptime SLA" },
                { value: "<50ms", label: "Global latency" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="flex flex-col justify-center border-white/10 p-10 odd:border-r even:border-r-0 [&:nth-child(-n+2)]:border-b"
                >
                  <p className="text-3xl sm:text-4xl font-semibold tracking-tight text-background">{s.value}</p>
                  <p className="mt-1 text-xs sm:text-sm text-background/60">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  const footerLinks = {
    Product: ["Features", "Pricing", "Changelog", "Roadmap"],
    Company: ["About", "Blog", "Careers", "Press"],
    Legal: ["Privacy", "Terms", "Security", "Cookies"],
  };

  return (
    <footer className="border-t border-border bg-surface/40">
      {/* Main footer grid */}
      <div className="mx-auto max-w-7xl px-3 xs:px-4 sm:px-6 lg:px-8 py-10 xs:py-12 sm:py-14">
        <div className="grid gap-6 xs:gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <Logo size="sm" />
            <p className="mt-3 xs:mt-4 max-w-xs text-xs xs:text-sm text-muted-foreground leading-relaxed">
              A calm, powerful workspace for your files. Share, sync, and collaborate
              with your team — without the chaos.
            </p>
            <div className="mt-4 xs:mt-6 flex items-center gap-2 xs:gap-3">
              <a
                href="#"
                className="grid h-7 xs:h-8 w-7 xs:w-8 place-items-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:text-foreground hover:border-foreground/20"
                aria-label="GitHub"
              >
                <Github className="h-3 xs:h-3.5 w-3 xs:w-3.5" />
              </a>
              {["𝕏", "in"].map((icon) => (
                <a
                  key={icon}
                  href="#"
                  className="grid h-7 xs:h-8 w-7 xs:w-8 place-items-center rounded-lg border border-border bg-background text-xs font-bold text-muted-foreground transition-colors hover:text-foreground hover:border-foreground/20"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground mb-4">
                {group}
              </p>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-5 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} TeleVault, Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
            <p className="text-xs text-muted-foreground">All systems operational</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
