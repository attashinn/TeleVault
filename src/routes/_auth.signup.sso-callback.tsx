import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/signup/sso-callback")({
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/sso-callback",
      search,
    });
  },
  component: () => null,
});
