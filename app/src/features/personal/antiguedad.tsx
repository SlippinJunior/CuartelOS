import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { db } from "@/lib/supabase";
import { mensajeError } from "@/lib/errores";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { formatearFecha } from "@/lib/formato";
import { etiquetaCategoria, periodoCategoria } from "@/features/guardia/logica";
import type { AntiguedadPersona } from "@/types/tipos";

export function useAntiguedad(personaId: string | undefined) {
  return useQuery({
    queryKey: ["antiguedad", personaId],
    queryFn: async () => {
      const { data, error } = await db.personal
        .from("v_antiguedad_persona")
        .select("*")
        .eq("persona_id", personaId)
        .maybeSingle();
      if (error) throw error;
      return data as AntiguedadPersona | null;
    },
    enabled: Boolean(personaId),
  });
}

/** Tarjeta resumen de antigüedad y categoría de guardia. */
export function TarjetaAntiguedad({
  antiguedad,
  puedeAjustar,
  alAjustar,
}: {
  antiguedad: AntiguedadPersona | null | undefined;
  puedeAjustar: boolean;
  alAjustar: () => void;
}) {
  if (!antiguedad) return null;

  return (
    <div className="rounded-md border border-border p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium">Antigüedad de servicio</p>
        {puedeAjustar && (
          <Button variant="ghost" size="sm" onClick={alAjustar}>Ajustar</Button>
        )}
      </div>
      <p className="mt-1 text-2xl font-bold text-primary">{antiguedad.anios_servicio} años</p>
      <p className="text-xs text-muted-foreground">
        {antiguedad.origen_antiguedad === "manual"
          ? "Ajuste manual de Director/Secretaría"
          : `Premios ${antiguedad.anios_premios} + abonos ${antiguedad.anios_abonos}`}
      </p>
      <div className="mt-2 flex flex-wrap gap-1">
        <Badge variant={antiguedad.exento_efectivo ? "apagado" : "outline"}>
          <ShieldCheck className="mr-1 size-3" /> {etiquetaCategoria(antiguedad.categoria_guardia)}
        </Badge>
        <Badge variant="secondary">{periodoCategoria(antiguedad.categoria_guardia)}</Badge>
        {antiguedad.codigo_charlie && <Badge variant="outline">{antiguedad.codigo_charlie}</Badge>}
      </div>
      {antiguedad.motivo_exencion && (
        <p className="mt-1 text-xs text-muted-foreground">Exención: {antiguedad.motivo_exencion}</p>
      )}
      {antiguedad.edad !== null && (
        <p className="mt-1 text-xs text-muted-foreground">Edad: {antiguedad.edad} años</p>
      )}
    </div>
  );
}

/** Ajuste manual de la antigüedad y la exención de guardia. */
export function DialogoAntiguedad({
  personaId,
  actual,
  abierto,
  onCambio,
}: {
  personaId: string;
  actual: AntiguedadPersona | null | undefined;
  abierto: boolean;
  onCambio: (v: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [manual, setManual] = React.useState("");
  const [exento, setExento] = React.useState(false);
  const [motivo, setMotivo] = React.useState("");

  React.useEffect(() => {
    if (!abierto) return;
    setManual(actual?.anios_servicio_manual != null ? String(actual.anios_servicio_manual) : "");
    setExento(Boolean(actual?.exento_guardia));
    setMotivo(actual?.motivo_exencion ?? "");
  }, [abierto, actual]);

  const guardar = useMutation({
    mutationFn: async () => {
      const { error } = await db.personal
        .from("persona")
        .update({
          anios_servicio_manual: manual.trim() === "" ? null : Number(manual),
          exento_guardia: exento,
          motivo_exencion: exento ? (motivo || null) : null,
        } as never)
        .eq("id", personaId);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Antigüedad actualizada");
      onCambio(false);
      await queryClient.invalidateQueries({ queryKey: ["antiguedad", personaId] });
      await queryClient.invalidateQueries({ queryKey: ["persona", personaId] });
      await queryClient.invalidateQueries({ queryKey: ["guardia"] });
    },
    onError: (e) => toast.error(mensajeError(e)),
  });

  return (
    <Dialog
      abierto={abierto}
      onCambio={onCambio}
      titulo="Ajustar antigüedad y guardia"
      descripcion="Solo Director, Secretario o admin. Deja el ajuste vacío para usar premios + abonos."
      pie={
        <>
          <Button variant="outline" onClick={() => onCambio(false)}>Cancelar</Button>
          <Button onClick={() => guardar.mutate()} disabled={guardar.isPending}>Guardar</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-md border border-border bg-muted/40 p-3 text-sm">
          <p>Calculado: {actual?.anios_calculados ?? 0} años (premios {actual?.anios_premios ?? 0} + abonos {actual?.anios_abonos ?? 0})</p>
          <p className="text-xs text-muted-foreground">
            Categoría actual: {etiquetaCategoria(actual?.categoria_guardia)} · {periodoCategoria(actual?.categoria_guardia)}
          </p>
        </div>
        <div className="space-y-1">
          <Label htmlFor="antiguedad-manual">Años de servicio (ajuste manual)</Label>
          <Input
            id="antiguedad-manual"
            type="number"
            min={0}
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="Sin ajuste"
          />
        </div>
        <div className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
          <div>
            <p className="text-sm font-medium">Exento de guardia</p>
            <p className="text-xs text-muted-foreground">Oficiales Generales o Miembros Honorarios del Directorio General.</p>
          </div>
          <Switch checked={exento} onCheckedChange={setExento} aria-label="Exento de guardia" />
        </div>
        {exento && (
          <div className="space-y-1">
            <Label htmlFor="motivo-exencion">Motivo de la exención</Label>
            <Input id="motivo-exencion" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
          </div>
        )}
        {(actual?.edad ?? 0) >= 60 || (actual?.anios_calculados ?? 0) >= 35 ? (
          <p className="rounded-md bg-aviso/10 p-2 text-xs text-aviso">
            El bombero ya queda exento automáticamente (60 años o 35 de servicio).
          </p>
        ) : null}
      </div>
    </Dialog>
  );
}

/** Abono de antigüedad reconocido por acuerdo. */
export function DialogoAbono({
  personaId,
  abierto,
  onCambio,
}: {
  personaId: string;
  abierto: boolean;
  onCambio: (v: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [anios, setAnios] = React.useState("");
  const [fecha, setFecha] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [motivo, setMotivo] = React.useState("");
  const [resolucion, setResolucion] = React.useState("");

  const guardar = useMutation({
    mutationFn: async () => {
      const { error } = await db.personal.from("antiguedad_abono").insert({
        persona_id: personaId,
        anios: Number(anios),
        fecha,
        motivo,
        resolucion: resolucion || null,
      } as never);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Abono registrado");
      setAnios("");
      setMotivo("");
      onCambio(false);
      await queryClient.invalidateQueries({ queryKey: ["antiguedad", personaId] });
      await queryClient.invalidateQueries({ queryKey: ["abonos", personaId] });
    },
    onError: (e) => toast.error(mensajeError(e)),
  });

  return (
    <Dialog
      abierto={abierto}
      onCambio={onCambio}
      titulo="Registrar abono de antigüedad"
      descripcion="Se suma a los premios de constancia para calcular la antigüedad."
      pie={
        <>
          <Button variant="outline" onClick={() => onCambio(false)}>Cancelar</Button>
          <Button disabled={!anios || !motivo || guardar.isPending} onClick={() => guardar.mutate()}>
            Registrar
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="abono-anios">Años abonados</Label>
            <Input id="abono-anios" type="number" step="0.5" min={0.5} value={anios} onChange={(e) => setAnios(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="abono-fecha">Fecha</Label>
            <Input id="abono-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="abono-motivo">Motivo</Label>
          <Input id="abono-motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="abono-resolucion">Resolución o acta</Label>
          <Input id="abono-resolucion" value={resolucion} onChange={(e) => setResolucion(e.target.value)} />
        </div>
        <p className="text-xs text-muted-foreground">Hoy: {formatearFecha(new Date())}</p>
      </div>
    </Dialog>
  );
}
