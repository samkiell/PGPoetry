"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PoemsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[poems] render error", error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-4 py-24 text-center sm:px-6">
      <span className="bg-muted text-muted-foreground grid size-12 place-items-center rounded-full">
        <AlertTriangle className="size-6" />
      </span>
      <h1 className="font-serif text-2xl font-medium">Something went wrong</h1>
      <p className="text-muted-foreground max-w-sm text-sm">
        We couldn&apos;t load the poems just now. Please try again in a moment.
      </p>
      <Button onClick={reset} variant="outline">
        Try again
      </Button>
    </div>
  );
}
