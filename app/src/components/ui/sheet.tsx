import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SheetProps {
  abierto: boolean;
  onCambio: (abierto: boolean) => void;
  titulo: string;
  children: React.ReactNode;
  lado?: "inferior" | "derecha";
}

/** Hoja inferior en el celular y panel lateral en escritorio. */
export function Sheet({ abierto, onCambio, titulo, children, lado = "inferior" }: SheetProps) {
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
        "m-0 max-h-[85dvh] w-full border border-border bg-card p-0 text-card-foreground shadow-suave backdrop:bg-black/50",
        lado === "inferior"
          ? "mt-auto rounded-t-2xl"
          : "ml-auto mr-0 h-dvh max-h-dvh w-[min(88vw,24rem)] rounded-l-2xl",
      )}
      aria-labelledby="sheet-titulo"
    >
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 id="sheet-titulo" className="text-base font-semibold">{titulo}</h2>
        <Button variant="ghost" size="icon" aria-label="Cerrar" onClick={() => onCambio(false)}>
          <X />
        </Button>
      </div>
      <div className="overflow-y-auto p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">{children}</div>
    </dialog>
  );
}
