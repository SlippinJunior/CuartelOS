import * as React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { PenLine, Timer, UserPlus } from "lucide-react";
import { db } from "@/lib/supabase";
import { mensajeError } from "@/lib/errores";
import { usePerfil } from "@/features/auth/sesion";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchInput } from "@/components/ui/search-input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { horaCorta } from "@/features/guardia/logica";
import { nucleoNormalizar } from "@/lib/texto";
import type { CharlieModalidad, GuardiaTurnoGrilla, PersonaGuardiaCatalogo } from "@/types/tipos";

export function DialogoReemplazo({
  turno,
  onCambio,
  onListo,
}: {
  turno: GuardiaTurnoGrilla | null;
  onCambio: (v: boolean) => void;
  onListo: () => Promise<void>;
}) {
  const [busqueda, setBusqueda] = React.useState("");
  const [personaId, setPersonaId] = React.useState("");
  const [motivo, setMotivo] = React.useState("");

  const { data: catalogo } = useQuery({
    queryKey: ["guardia", "catalogo"],
    queryFn: async () => {
      const { data, error } = await db.operaciones.rpc("catalogo_guardia_personas");
      if (error) throw error;
      return (data ?? []) as unknown as PersonaGuardiaCatalogo[];
    },
    enabled: Boolean(turno),
  });

  const filtradas = React.useMemo(() => {
    const texto = nucleoNormalizar(busqueda);
    const ocupados = new Set((turno?.integrantes ?? []).map((i) => i.persona_id));
    return (catalogo ?? []).filter(
      (p) => !ocupados.has(p.id) && (!texto || nucleoNormalizar(`${p.nombre} ${p.registro}`).includes(texto)),
    );
  }, [catalogo, busqueda, turno]);

  const guardar = useMutation({
    mutationFn: async () => {
      const { error } = await db.operaciones.rpc("registrar_reemplazo", {
        p_turno_id: turno!.turno_id,
        p_reemplazante_id: personaId,
        p_motivo: motivo || null,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Reemplazo registrado");
      setPersonaId("");
      setMotivo("");
      onCambio(false);
      await onListo();
    },
    onError: (e) => toast.error(mensajeError(e)),
  });

  return (
    <Dialog
      abierto={Boolean(turno)}
      onCambio={onCambio}
      titulo="Gestionar reemplazo"
      descripcion="Orden 01/2026 §5: el titular sigue debiendo cubrir un día del período."
      pie={
        <>
          <Button variant="outline" onClick={() => onCambio(false)}>Cancelar</Button>
          <Button onClick={() => guardar.mutate()} disabled={!personaId || guardar.isPending}>
            <UserPlus /> Registrar reemplazo
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="reemplazo-buscar">Buscar reemplazante</Label>
          <SearchInput
            id="reemplazo-buscar"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onLimpiar={() => setBusqueda("")}
            placeholder="Nombre o número de registro"
          />
        </div>
        <div className="max-h-56 space-y-1 overflow-y-auto">
          {filtradas.length === 0 && <p className="text-sm text-muted-foreground">Sin bomberos disponibles.</p>}
          {filtradas.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPersonaId(p.id)}
              className={`flex w-full items-center justify-between gap-2 rounded-md border p-2 text-left text-sm ${
                personaId === p.id ? "border-primary bg-primary/10" : "border-border hover:bg-accent"
              }`}
            >
              <span>
                <span className="mr-2 font-mono text-xs text-muted-foreground">{p.registro}</span>
                {p.nombre}
              </span>
              {p.exento && <Badge variant="apagado">Exento</Badge>}
            </button>
          ))}
        </div>
        <div className="space-y-1">
          <Label htmlFor="reemplazo-motivo">Motivo</Label>
          <Textarea id="reemplazo-motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        </div>
      </div>
    </Dialog>
  );
}

export function DialogoLlegadaTardia({
  turno,
  onCambio,
  onListo,
}: {
  turno: GuardiaTurnoGrilla | null;
  onCambio: (v: boolean) => void;
  onListo: () => Promise<void>;
}) {
  const [observacion, setObservacion] = React.useState("");

  const guardar = useMutation({
    mutationFn: async () => {
      const { error } = await db.operaciones.rpc("registrar_llegada_tardia", {
        p_turno_id: turno!.turno_id,
        p_observacion: observacion || null,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Llegada registrada. Cuenta como guardia cumplida.");
      setObservacion("");
      onCambio(false);
      await onListo();
    },
    onError: (e) => toast.error(mensajeError(e)),
  });

  return (
    <Dialog
      abierto={Boolean(turno)}
      onCambio={onCambio}
      titulo="Llegué a la guardia"
      descripcion="La llegada cuenta de inmediato como guardia cumplida y se avisa al Jefe de Guardia a las 09:00."
      pie={
        <>
          <Button variant="outline" onClick={() => onCambio(false)}>Cancelar</Button>
          <Button onClick={() => guardar.mutate()} disabled={guardar.isPending}>
            <Timer /> Registrar llegada
          </Button>
        </>
      }
    >
      <div className="space-y-3 text-sm">
        <p className="rounded-md border border-border bg-muted/40 p-3">
          Hora actual: <strong>{horaCorta(new Date().toISOString())}</strong>
        </p>
        <div className="space-y-1">
          <Label htmlFor="llegada-obs">Observación (opcional)</Label>
          <Textarea id="llegada-obs" value={observacion} onChange={(e) => setObservacion(e.target.value)} />
        </div>
      </div>
    </Dialog>
  );
}

export function DialogoReporteGuardia({
  turno,
  onCambio,
  onListo,
}: {
  turno: GuardiaTurnoGrilla | null;
  onCambio: (v: boolean) => void;
  onListo: () => Promise<void>;
}) {
  const { data: perfil } = usePerfil();
  const [hora, setHora] = React.useState("");
  const [modalidad, setModalidad] = React.useState<CharlieModalidad>("sin_maquinista");
  const [charlie, setCharlie] = React.useState("");
  const [presencia, setPresencia] = React.useState<Record<string, boolean>>({});
  const [observacion, setObservacion] = React.useState("");

  React.useEffect(() => {
    if (!turno) return;
    setHora(turno.hora_aviso_central ? new Date(turno.hora_aviso_central).toTimeString().slice(0, 5) : "");
    setModalidad(turno.charlie_modalidad ?? "sin_maquinista");
    setCharlie(turno.charlie_codigo ?? "");
    setObservacion(turno.observacion ?? "");
    const mapa: Record<string, boolean> = {};
    for (const i of turno.integrantes) {
      if (i.estado === "inscrito" || i.estado === "cumplida") mapa[i.persona_id] = i.estado === "cumplida";
    }
    setPresencia(mapa);
  }, [turno]);

  const presentes = Object.entries(presencia).filter(([, v]) => v).map(([k]) => k);
  const ausentes = Object.entries(presencia).filter(([, v]) => !v).map(([k]) => k);

  const guardar = useMutation({
    mutationFn: async () => {
      const { error } = await db.operaciones.rpc("guardar_reporte_guardia", {
        p_turno_id: turno!.turno_id,
        p_hora_aviso_central: hora || null,
        p_charlie_modalidad: modalidad,
        p_charlie_codigo: charlie || null,
        p_presentes: presentes,
        p_ausentes: ausentes,
        p_observacion: observacion || null,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Reporte guardado");
      await onListo();
    },
    onError: (e) => toast.error(mensajeError(e)),
  });

  const firmar = useMutation({
    mutationFn: async () => {
      const { error } = await db.operaciones.rpc("firmar_reporte_guardia", { p_turno_id: turno!.turno_id });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Reporte firmado digitalmente");
      onCambio(false);
      await onListo();
    },
    onError: (e) => toast.error(mensajeError(e)),
  });

  const jefe = turno?.integrantes.find((i) => i.es_jefe);
  const soyJefe = Boolean(jefe && perfil?.persona?.id === jefe.persona_id);
  const puedeFirmar = soyJefe || (perfil?.roles ?? []).some((r) => ["capitan", "teniente_1", "director", "admin"].includes(r));
  const llegadas = (turno?.observacion ?? "").split("\n").filter((l) => l.includes("Llegada tardía"));

  return (
    <Dialog
      abierto={Boolean(turno)}
      onCambio={onCambio}
      titulo="Reporte nocturno"
      descripcion={turno ? `Guardia del ${turno.fecha}` : ""}
      tamano="lg"
      pie={
        <>
          <Button variant="outline" onClick={() => onCambio(false)}>Cerrar</Button>
          <Button variant="secondary" onClick={() => guardar.mutate()} disabled={guardar.isPending}>
            Guardar reporte
          </Button>
          <Button onClick={() => firmar.mutate()} disabled={!puedeFirmar || firmar.isPending}>
            <PenLine /> Firmar reporte
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="reporte-hora">Hora de aviso a central</Label>
            <div className="flex gap-2">
              <Input id="reporte-hora" type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
              <Button variant="outline" onClick={() => setHora(new Date().toTimeString().slice(0, 5))}>Ahora</Button>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="reporte-charlie">N° de Charlie</Label>
            <Input
              id="reporte-charlie"
              placeholder="CH-201"
              value={charlie}
              onChange={(e) => setCharlie(e.target.value.toUpperCase())}
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="reporte-modalidad">Maquinista (Charlie)</Label>
          <Select
            id="reporte-modalidad"
            value={modalidad}
            onChange={(e) => setModalidad(e.target.value as CharlieModalidad)}
          >
            <option value="Z8">Z8 · En cuartel (cuenta como guardián)</option>
            <option value="Z20">Z20 · A la escucha (solo estadística)</option>
            <option value="sin_maquinista">Sin maquinista</option>
          </Select>
        </div>

        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dotación</p>
          <div className="divide-y divide-border rounded-md border border-border">
            {(turno?.integrantes ?? [])
              .filter((i) => i.estado === "inscrito" || i.estado === "cumplida")
              .map((i) => (
                <div key={i.persona_id} className="flex flex-col gap-2 p-2.5 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <span className="min-w-0 truncate">
                    <span className="mr-2 font-mono text-xs text-muted-foreground">{i.registro}</span>
                    {i.nombre}
                  </span>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      size="sm"
                      variant={presencia[i.persona_id] ? "default" : "outline"}
                      onClick={() => setPresencia({ ...presencia, [i.persona_id]: true })}
                    >
                      Presente
                    </Button>
                    <Button
                      size="sm"
                      variant={presencia[i.persona_id] === false ? "destructive" : "outline"}
                      onClick={() => setPresencia({ ...presencia, [i.persona_id]: false })}
                    >
                      Ausente
                    </Button>
                  </div>
                </div>
              ))}
            {(turno?.integrantes ?? []).length === 0 && (
              <p className="p-3 text-sm text-muted-foreground">Sin dotación inscrita.</p>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="reporte-obs">Observaciones</Label>
          <Textarea id="reporte-obs" value={observacion} onChange={(e) => setObservacion(e.target.value)} />
        </div>

        {llegadas.length > 0 && (
          <div className="rounded-md border border-aviso/40 bg-aviso/10 p-3 text-sm">
            <p className="font-medium text-aviso">Llegadas tardías registradas</p>
            {llegadas.map((l) => <p key={l}>{l}</p>)}
          </div>
        )}

        <div className="rounded-md border border-border bg-muted/40 p-3 text-sm">
          <p className="font-medium">Firma digital</p>
          <p className="text-muted-foreground">
            Responsable: {jefe ? `${jefe.nombre} (Reg. ${jefe.registro})` : "se calcula al guardar el reporte"}.
            {" "}Oficial operativo de mayor rango presente o bombero con menor número de registro.
          </p>
          {puedeFirmar ? (
            <Badge variant="exito" className="mt-2">Puedes firmar este reporte</Badge>
          ) : (
            <Badge variant="apagado" className="mt-2">Solo el Jefe de Guardia o Capitanía pueden firmar</Badge>
          )}
        </div>
      </div>
    </Dialog>
  );
}
