import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { TopNav } from "@/components/dashboard/top-nav";
import { Show, RedirectToSignIn } from "@clerk/tanstack-react-start";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <Show when="signed-in">
        <div className="flex h-screen overflow-hidden bg-background">
          {/* Mobile sidebar overlay - only show on mobile */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-30 bg-black/50 lg:hidden"
              onClick={() => setSidebarOpen(false)}
              role="button"
              tabIndex={0}
              aria-label="Close sidebar"
            />
          )}

          {/* Sidebar - fixed on mobile, static on desktop */}
          <div
            className={`fixed inset-y-0 left-0 z-40 w-[250px] transform bg-background transition-transform duration-300 ease-in-out lg:static lg:z-auto lg:transform-none ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            }`}
          >
            <AppSidebar onClose={() => setSidebarOpen(false)} />
          </div>

          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <TopNav onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
            <main className="flex-1 overflow-y-auto">
              <div className="w-full px-4 py-5 sm:px-6">
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
