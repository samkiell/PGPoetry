import { Feather } from "lucide-react";

export function EmptyState({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-16 text-center">
      <span className="bg-muted text-muted-foreground grid size-12 place-items-center rounded-full">
        <Feather className="size-6" />
      </span>
      <p className="font-serif text-lg font-medium">{title}</p>
      {description ? (
        <p className="text-muted-foreground max-w-sm text-sm">{description}</p>
      ) : null}
      {children}
    </div>
  );
}
