import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { TopNav } from "@/components/dashboard/top-nav";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});

import { Show, RedirectToSignIn } from "@clerk/tanstack-react-start";

function DashboardLayout() {
  return (
    <>
      <Show when="signed-in">
        <div className="flex min-h-screen bg-background">
          <AppSidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <TopNav />
            <main className="flex-1 px-4 py-8 md:px-8 md:py-10">
              <div className="mx-auto w-full max-w-6xl">
                <Outlet />
              </div>
            </main>
          </div>
        </div>
      </Show>
      <Show when="signed-out">
        <RedirectToSignIn signInForceRedirectUrl="/dashboard" />
      </Show>
    </>
  );
}
