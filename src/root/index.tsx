import { createFileRoute } from "@tanstack/react-router";
import { RippleApp } from "@/components/ripple-app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <RippleApp />;
}
