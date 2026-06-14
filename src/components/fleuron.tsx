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
        "my-10 flex items-center justify-center gap-5 text-muted-foreground",
        className,
      )}
    >
      <span className="bg-border/60 h-px w-10" />
      <span className="text-primary/70 font-serif text-base leading-none">❦</span>
      <span className="bg-border/60 h-px w-10" />
    </div>
  );
}
