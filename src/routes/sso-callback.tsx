import { createFileRoute } from "@tanstack/react-router";
import { AuthenticateWithRedirectCallback } from "@clerk/tanstack-react-start";

export const Route = createFileRoute("/sso-callback")({
  component: SSOCallback,
  head: () => ({ meta: [{ title: "Signing in… — TeleVault" }] }),
});

function SSOCallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <AuthenticateWithRedirectCallback
        signInForceRedirectUrl="/dashboard"
        signUpForceRedirectUrl="/dashboard"
      />
    </div>
  );
}
