import { cn } from "@/lib/utils";

/**
 * Small ornamental divider used to mark sections within a poem page.
 * Two hairlines flanking a fleuron — a quiet, magazine-style separator.
 */
export function Fleuron({ className }: { className?: string }) {
  return (
    <div
      role="presentation"
      aria-hidden
      className={cn(
        "my-10 flex items-center justify-center gap-4 text-muted-foreground",
        className,
      )}
    >
      <span className="bg-border h-px w-14" />
      <span className="font-serif text-lg leading-none text-primary">❦</span>
      <span className="bg-border h-px w-14" />
    </div>
  );
}
