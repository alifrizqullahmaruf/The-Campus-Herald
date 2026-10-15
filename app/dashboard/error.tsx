"use client";

import { ErrorPanel } from "@/components/ui/error-panel";

export default function DashboardError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <ErrorPanel error={error} retry={retry} home="/dashboard" />;
}
