import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  titulo,
  descripcion,
  accion,
  icono: Icono = Inbox,
  className,
}: {
  titulo: string;
  descripcion?: string;
  accion?: React.ReactNode;
  icono?: LucideIcon;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border p-8 text-center", className)}>
      <div className="rounded-full bg-muted p-3 text-muted-foreground">
        <Icono className="size-6" aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="font-medium">{titulo}</p>
        {descripcion && <p className="mx-auto max-w-md text-sm text-muted-foreground">{descripcion}</p>}
      </div>
      {accion}
    </div>
  );
}
