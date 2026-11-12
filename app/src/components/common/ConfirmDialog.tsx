import * as React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ConfirmDialog({
  abierto,
  onCambio,
  titulo,
  descripcion,
  textoConfirmar = "Confirmar",
  variante = "default",
  pideMotivo = false,
  onConfirmar,
  procesando = false,
}: {
  abierto: boolean;
  onCambio: (v: boolean) => void;
  titulo: string;
  descripcion?: string;
  textoConfirmar?: string;
  variante?: "default" | "destructive";
  pideMotivo?: boolean;
  onConfirmar: (motivo: string) => void | Promise<void>;
  procesando?: boolean;
}) {
  const [motivo, setMotivo] = React.useState("");

  React.useEffect(() => {
    if (!abierto) setMotivo("");
  }, [abierto]);

  const faltaMotivo = pideMotivo && motivo.trim().length < 3;

  return (
    <Dialog
      abierto={abierto}
      onCambio={onCambio}
      titulo={titulo}
      descripcion={descripcion}
      pie={
        <>
          <Button variant="outline" onClick={() => onCambio(false)} disabled={procesando}>
            Cancelar
          </Button>
          <Button
            variant={variante}
            onClick={() => onConfirmar(motivo)}
            disabled={procesando || faltaMotivo}
          >
            {procesando ? "Procesando…" : textoConfirmar}
          </Button>
        </>
      }
    >
      {pideMotivo && (
        <div className="space-y-2">
          <Label htmlFor="motivo-confirmacion">Motivo (obligatorio)</Label>
          <Textarea
            id="motivo-confirmacion"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Explique brevemente la razón de esta acción"
            required
          />
          <p className="text-xs text-muted-foreground">Quedará registrado en la auditoría.</p>
        </div>
      )}
    </Dialog>
  );
}
