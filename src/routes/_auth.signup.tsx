import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/_auth/signup")({
  component: SignupPage,
  head: () => ({ meta: [{ title: "Create your workspace — TeleVault" }] }),
});

import { SignUp } from "@clerk/tanstack-react-start";

function SignupPage() {
  return (
    <div className="flex justify-center items-center py-4">
      <SignUp signInUrl="/login" forceRedirectUrl="/dashboard" />
    </div>
  );
}

