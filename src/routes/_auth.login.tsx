import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/_auth/login")({
  component: LoginPage,
  head: () => ({ meta: [{ title: "Sign in — TeleVault" }] }),
});

import { SignIn } from "@clerk/tanstack-react-start";

function LoginPage() {
  return (
    <div className="flex justify-center items-center py-4">
      <SignIn signUpUrl="/signup" forceRedirectUrl="/dashboard" />
    </div>
  );
}

