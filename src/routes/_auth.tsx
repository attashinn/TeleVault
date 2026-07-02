import { createFileRoute, Outlet, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/logo";

export const Route = createFileRoute("/_auth")({
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative flex flex-col px-6 py-8 sm:px-12">
        <div className="flex items-center justify-between">
          <Link to="/">
            <Logo />
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to home
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-sm">
            <Outlet />
          </div>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} TeleVault. All rights reserved.
        </p>
      </div>

      <div className="relative hidden overflow-hidden border-l border-border bg-surface/60 lg:block">
        <div className="absolute inset-0 grid-bg opacity-70" />
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/25 blur-[120px]" />
        <div className="relative flex h-full flex-col items-center justify-center px-12 text-center">
          <blockquote className="max-w-md font-display text-3xl leading-snug tracking-tight text-foreground">
            "TeleVault feels like the calmest tool on my machine — files finally
            have a home that respects them."
          </blockquote>
          <p className="mt-6 text-sm text-muted-foreground">
            — Ada Reyes, Design Lead at Northwind
          </p>
        </div>
      </div>
    </div>
  );
}
