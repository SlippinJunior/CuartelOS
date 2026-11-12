import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface DialogProps {
  abierto: boolean;
  onCambio: (abierto: boolean) => void;
  titulo: string;
  descripcion?: string;
  children: React.ReactNode;
  pie?: React.ReactNode;
  className?: string;
}

/**
 * Diálogo modal basado en <dialog> nativo: foco atrapado, Escape y fondo
 * inerte los maneja el navegador.
 */
export function Dialog({ abierto, onCambio, titulo, descripcion, children, pie, className }: DialogProps) {
  const ref = React.useRef<HTMLDialogElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (abierto && !el.open) el.showModal();
    if (!abierto && el.open) el.close();
  }, [abierto]);

  return (
    <dialog
      ref={ref}
      onClose={() => onCambio(false)}
      onClick={(e) => {
        if (e.target === ref.current) onCambio(false);
      }}
      className={cn(
        "w-[min(92vw,32rem)] rounded-lg border border-border bg-card p-0 text-card-foreground shadow-suave backdrop:bg-black/50",
        className,
      )}
      aria-labelledby="dialog-titulo"
    >
      <div className="flex items-start justify-between gap-4 border-b border-border p-4">
        <div>
          <h2 id="dialog-titulo" className="text-lg font-semibold">{titulo}</h2>
          {descripcion && <p className="mt-1 text-sm text-muted-foreground">{descripcion}</p>}
        </div>
        <Button variant="ghost" size="icon" aria-label="Cerrar" onClick={() => onCambio(false)}>
          <X />
        </Button>
      </div>
      <div className="max-h-[70dvh] overflow-y-auto p-4">{children}</div>
      {pie && <div className="flex justify-end gap-2 border-t border-border p-4">{pie}</div>}
    </dialog>
  );
}
