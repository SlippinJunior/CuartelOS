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

/**
 * Hoja inferior en el celular y panel lateral en escritorio.
 *
 * Los estilos de posición van en línea porque el preflight de Tailwind v4
 * aplica `margin: 0` a todos los elementos y anula el centrado nativo del
 * <dialog>.
 */
export function Sheet({ abierto, onCambio, titulo, children, lado = "inferior" }: SheetProps) {
  const ref = React.useRef<HTMLDialogElement>(null);

  const cerrar = React.useCallback(() => onCambio(false), [onCambio]);

  React.useEffect(() => {
    if (!abierto) return;
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        cerrar();
      }
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [abierto, cerrar]);

  React.useEffect(() => {
    const el = ref.current;
    if (!abierto || !el || el.open) return;
    try {
      el.showModal();
    } catch {
      el.setAttribute("open", "");
    }
  }, [abierto]);

  if (!abierto) return null;

  const posicion: React.CSSProperties =
    lado === "inferior"
      ? { margin: "auto 0 0 0", inset: "auto 0 0 0", maxHeight: "85dvh", width: "100%" }
      : { margin: "0 0 0 auto", inset: "0 0 0 auto", height: "100dvh", width: "min(88vw, 24rem)" };

  return (
    <dialog
      ref={ref}
      onClose={cerrar}
      onCancel={(e) => {
        e.preventDefault();
        cerrar();
      }}
      onClick={(e) => {
        if (e.target === ref.current) cerrar();
      }}
      className={cn(
        "hoja-dialogo fixed flex flex-col overflow-hidden border border-border bg-card p-0 text-card-foreground shadow-suave backdrop:bg-black/50",
        lado === "inferior" ? "rounded-t-2xl" : "rounded-l-2xl",
      )}
      style={posicion}
      aria-labelledby="sheet-titulo"
    >
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 id="sheet-titulo" className="text-base font-semibold">{titulo}</h2>
        <Button variant="ghost" size="icon" aria-label="Cerrar" onClick={cerrar}>
          <X />
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">{children}</div>
    </dialog>
  );
}
