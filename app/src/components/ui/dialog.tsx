import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type TamanoDialogo = "sm" | "md" | "lg";

interface DialogProps {
  abierto: boolean;
  onCambio: (abierto: boolean) => void;
  titulo: string;
  descripcion?: string;
  children: React.ReactNode;
  pie?: React.ReactNode;
  className?: string;
  tamano?: TamanoDialogo;
}

const ANCHO: Record<TamanoDialogo, string> = {
  sm: "min(92vw, 26rem)",
  md: "min(92vw, 32rem)",
  lg: "min(96vw, 44rem)",
};

function useEscapeCompartido(abierto: boolean, cerrar: () => void) {
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
}

/**
 * Diálogo modal centrado, construido sobre <dialog> nativo.
 *
 * El <dialog> solo se monta mientras está abierto: así se puede abrir un
 * diálogo desde otro sin quedar atrapado en el contexto de pila modal del
 * primero (showModal sobre un elemento externo arroja InvalidStateError).
 *
 * El centrado se fija con estilos en línea porque el preflight de Tailwind v4
 * aplica `margin: 0` a todos los elementos y anula el centrado del navegador.
 */
export function Dialog({
  abierto,
  onCambio,
  titulo,
  descripcion,
  children,
  pie,
  className,
  tamano = "md",
}: DialogProps) {
  const ref = React.useRef<HTMLDialogElement>(null);
  const cerrar = React.useCallback(() => onCambio(false), [onCambio]);

  useEscapeCompartido(abierto, cerrar);

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
        "dialogo-centrado fixed m-auto flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-lg border border-border bg-card p-0 text-card-foreground shadow-suave backdrop:bg-black/50",
        className,
      )}
      style={{ margin: "auto", width: ANCHO[tamano], maxWidth: ANCHO[tamano] }}
      aria-labelledby="dialog-titulo"
    >
      <div className="flex items-start justify-between gap-4 border-b border-border p-4">
        <div>
          <h2 id="dialog-titulo" className="text-lg font-semibold">{titulo}</h2>
          {descripcion && <p className="mt-1 text-sm text-muted-foreground">{descripcion}</p>}
        </div>
        <Button variant="ghost" size="icon" aria-label="Cerrar" onClick={cerrar}>
          <X />
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
      {pie && (
        <div className="flex flex-col-reverse gap-2 border-t border-border p-4 sm:flex-row sm:justify-end">
          {pie}
        </div>
      )}
    </dialog>
  );
}
