import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BellRing, CalendarDays, CheckCircle2, ShieldCheck, UserPlus } from "lucide-react";
import { db } from "@/lib/supabase";
import { mensajeError } from "@/lib/errores";
import { usePerfil } from "@/features/auth/sesion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { formatearFecha } from "@/lib/formato";
import {
  DESCRIPCION_CATEGORIA,
  diasCubiertos,
  etiquetaCategoria,
  evaluarInscripcion,
  horaCorta,
  periodoCategoria,
  puedeBajarseLibremente,
  semaforoDotacion,
  varianteDotacion,
} from "@/features/guardia/logica";
import {
  DialogoReemplazo,
  DialogoLlegadaTardia,
  DialogoReporteGuardia,
} from "@/features/guardia/dialogos";
import type { CumplimientoGuardia, GrillaGuardia, NotificacionGuardia, GuardiaTurnoGrilla } from "@/types/tipos";

const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export function GrillaGuardia({ gestiona }: { gestiona: boolean }) {
  const queryClient = useQueryClient();
  const { data: perfil } = usePerfil();
  const [cicloId, setCicloId] = React.useState<number | null>(null);
  const [semana, setSemana] = React.useState<1 | 2>(1);
  const [reemplazo, setReemplazo] = React.useState<GuardiaTurnoGrilla | null>(null);
  const [llegada, setLlegada] = React.useState<GuardiaTurnoGrilla | null>(null);
  const [reporte, setReporte] = React.useState<GuardiaTurnoGrilla | null>(null);

  const ciclosQ = useQuery({
    queryKey: ["guardia", "ciclos"],
    queryFn: async () => {
      const { data, error } = await db.operaciones
        .from("guardia_ciclo")
        .select("*")
        .order("fecha_inicio", { ascending: false })
        .limit(12);
      if (error) throw error;
      return data as Array<{ id: number; nombre: string; estado: string }>;
    },
  });

  const grillaQ = useQuery({
    queryKey: ["guardia", "grilla", cicloId],
    queryFn: async () => {
      const { data, error } = await db.operaciones.rpc("grilla_ciclo", { p_ciclo_id: cicloId });
      if (error) throw error;
      return data as unknown as GrillaGuardia | null;
    },
  });

  const cumplimientoQ = useQuery({
    queryKey: ["guardia", "cumplimiento", cicloId],
    queryFn: async () => {
      const { data, error } = await db.operaciones.rpc("mi_cumplimiento_guardia", { p_ciclo_id: cicloId });
      if (error) throw error;
      return data as unknown as CumplimientoGuardia;
    },
  });

  const notificacionesQ = useQuery({
    queryKey: ["guardia", "notificaciones"],
    queryFn: async () => {
      const { data, error } = await db.operaciones.rpc("mis_notificaciones_guardia");
      if (error) throw error;
      return (data ?? []) as unknown as NotificacionGuardia[];
    },
  });

  const recargar = React.useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["guardia"] });
    await queryClient.invalidateQueries({ queryKey: ["panel-inicio"] });
  }, [queryClient]);

  const inscribirse = useMutation({
    mutationFn: async (turnoId: number) => {
      const { error } = await db.operaciones.rpc("inscribirse_guardia", { p_turno_id: turnoId, p_persona_id: null });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Inscripción registrada");
      await recargar();
    },
    onError: (e) => toast.error(mensajeError(e)),
  });

  const bajarse = useMutation({
    mutationFn: async (turnoId: number) => {
      const { error } = await db.operaciones.rpc("bajarse_guardia", { p_turno_id: turnoId });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Te bajaste de esta guardia");
      await recargar();
    },
    onError: (e) => toast.error(mensajeError(e)),
  });

  const marcarLeida = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await db.operaciones.rpc("marcar_notificacion_leida", { p_id: id });
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["guardia", "notificaciones"] });
    },
  });

  const grilla = grillaQ.data;
  const cumplimiento = cumplimientoQ.data;
  const miPersona = perfil?.persona?.id;
  const dias = (grilla?.dias ?? []).filter((d) => d.semana_num === semana);
  const semanaCubierta = semana === 1 ? Boolean(grilla?.semana_1_cubierta) : Boolean(grilla?.semana_2_cubierta);
  const cupo = grilla?.ciclo.cupo_base ?? 3;
  const sinLeer = (notificacionesQ.data ?? []).filter((n) => !n.leida_en);

  if (grillaQ.isLoading || cumplimientoQ.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!grilla) {
    return (
      <EmptyState
        titulo="Sin ciclo de guardias"
        descripcion={
          gestiona
            ? "Crea un ciclo de 14 días desde la pestaña Gestión."
            : "Capitanía aún no ha agendado un ciclo de guardias."
        }
        icono={CalendarDays}
      />
    );
  }

  return (
    <div className="space-y-4">
      {sinLeer.length > 0 && (
        <Card className="border-aviso/40 bg-aviso/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <BellRing className="size-4 text-aviso" /> Avisos de guardia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {sinLeer.map((n) => (
              <div key={n.id} className="flex items-start justify-between gap-3 rounded-md border border-border bg-card p-2 text-sm">
                <span>{n.mensaje}</span>
                <Button variant="ghost" size="sm" onClick={() => marcarLeida.mutate(n.id)}>
                  <CheckCircle2 /> Entendido
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" /> Mi estado de guardia
          </CardTitle>
          <CardDescription>{DESCRIPCION_CATEGORIA[cumplimiento?.categoria_guardia ?? "0_4"]}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Años de servicio</p>
            <p className="text-lg font-semibold">{cumplimiento?.anios_servicio ?? "—"}</p>
            <p className="text-[11px] text-muted-foreground">
              {cumplimiento?.origen_antiguedad === "manual" ? "ajuste manual" : "premios + abonos"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Categoría</p>
            <p className="text-lg font-semibold">{etiquetaCategoria(cumplimiento?.categoria_guardia)}</p>
            <p className="text-[11px] text-muted-foreground">{periodoCategoria(cumplimiento?.categoria_guardia)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Estado del período</p>
            {cumplimiento?.exento ? (
              <Badge variant="apagado">⚪ Exento</Badge>
            ) : (cumplimiento?.cumplidas ?? 0) > 0 ? (
              <Badge variant="exito">🟢 Al día</Badge>
            ) : (cumplimiento?.inscritas ?? 0) > 0 ? (
              <Badge variant="aviso">🟡 Inscrito</Badge>
            ) : (
              <Badge variant="peligro">🔴 Falta inscribirse</Badge>
            )}
            {cumplimiento?.motivo_exencion && (
              <p className="mt-1 text-[11px] text-muted-foreground">{cumplimiento.motivo_exencion}</p>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Guardias</p>
            <p className="text-lg font-semibold">
              {cumplimiento?.cumplidas ?? 0} cumplidas · {cumplimiento?.inscritas ?? 0} inscritas
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={cicloId ?? ""}
          onChange={(e) => setCicloId(e.target.value ? Number(e.target.value) : null)}
          aria-label="Ciclo"
          className="w-auto min-w-56"
        >
          <option value="">Ciclo vigente</option>
          {(ciclosQ.data ?? []).map((c) => (
            <option key={c.id} value={c.id}>{c.nombre} · {c.estado}</option>
          ))}
        </Select>
        <div className="flex rounded-md border border-border p-1">
          {[1, 2].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSemana(s as 1 | 2)}
              className={`min-h-9 rounded px-4 text-sm font-medium ${semana === s ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              Semana {s}
            </button>
          ))}
        </div>
        <Badge variant={semanaCubierta ? "secondary" : "outline"} className="self-center">
          {diasCubiertos(dias, cupo)}/7 días cubiertos (mín. {cupo})
          {semanaCubierta ? " · cupos extra liberados" : ""}
        </Badge>
      </div>

      <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {dias.map((dia) => (
          <TarjetaDia
            key={dia.turno_id}
            dia={dia}
            cupo={cupo}
            semanaCubierta={semanaCubierta}
            exento={Boolean(cumplimiento?.exento)}
            miPersona={miPersona}
            alInscribirse={() => inscribirse.mutate(dia.turno_id)}
            alBajarse={() => bajarse.mutate(dia.turno_id)}
            alReemplazar={() => setReemplazo(dia)}
            alLlegada={() => setLlegada(dia)}
            alReporte={() => setReporte(dia)}
            ocupado={inscribirse.isPending || bajarse.isPending}
          />
        ))}
      </div>

      <DialogoReemplazo turno={reemplazo} onCambio={(v) => !v && setReemplazo(null)} onListo={recargar} />
      <DialogoLlegadaTardia turno={llegada} onCambio={(v) => !v && setLlegada(null)} onListo={recargar} />
      <DialogoReporteGuardia turno={reporte} onCambio={(v) => !v && setReporte(null)} onListo={recargar} />
    </div>
  );
}

function TarjetaDia({
  dia,
  cupo,
  semanaCubierta,
  exento,
  miPersona,
  alInscribirse,
  alBajarse,
  alReemplazar,
  alLlegada,
  alReporte,
  ocupado,
}: {
  dia: GuardiaTurnoGrilla;
  cupo: number;
  semanaCubierta: boolean;
  exento: boolean;
  miPersona?: string;
  alInscribirse: () => void;
  alBajarse: () => void;
  alReemplazar: () => void;
  alLlegada: () => void;
  alReporte: () => void;
  ocupado: boolean;
}) {
  const fecha = new Date(`${dia.fecha}T12:00:00`);
  const activos = dia.integrantes.filter((i) => i.estado === "inscrito" || i.estado === "cumplida");
  const mia = dia.integrantes.find((i) => i.persona_id === miPersona);
  const yaInscrito = Boolean(mia && (mia.estado === "inscrito" || mia.estado === "cumplida"));
  const estado = semaforoDotacion(dia.guardianes, cupo);
  const regla = evaluarInscripcion(dia, semanaCubierta, cupo, yaInscrito, exento);
  const puedeLlegar = dia.estado !== "programada" && !yaInscrito;

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">
              {DIAS[fecha.getDay()]} {formatearFecha(dia.fecha).slice(0, 5)}
            </CardTitle>
            <CardDescription>
              {dia.feriado ? `${dia.feriado} · ` : ""}Levantada {horaCorta(dia.termino)}
            </CardDescription>
          </div>
          <Badge variant={varianteDotacion(estado)}>{dia.guardianes}/{cupo}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-2">
        <ul className="space-y-1 text-sm">
          {activos.length === 0 && <li className="text-muted-foreground">Sin guardianes inscritos.</li>}
          {activos.map((i) => (
            <li key={i.persona_id} className="flex flex-wrap items-center gap-1">
              <span className="font-mono text-[11px] text-muted-foreground">{i.registro}</span>
              <span className="truncate">{i.nombre}</span>
              {i.es_jefe && <Badge variant="default">Jefe</Badge>}
              {i.origen === "charlie_z8" && <Badge variant="secondary">Charlie Z8</Badge>}
              {i.origen === "reemplazo" && <Badge variant="aviso">Reemplazo</Badge>}
              {i.origen === "llegada_tardia" && <Badge variant="outline">Llegada {horaCorta(i.hora_llegada)}</Badge>}
            </li>
          ))}
        </ul>
        <div className="mt-auto flex flex-wrap gap-2 pt-2">
          {yaInscrito ? (
            <>
              {puedeBajarseLibremente(dia.guardianes) ? (
                <Button variant="outline" size="sm" onClick={alBajarse} disabled={ocupado}>Bajarme</Button>
              ) : (
                <Button variant="outline" size="sm" onClick={alReemplazar} disabled={ocupado}>
                  <UserPlus /> Gestionar reemplazo
                </Button>
              )}
            </>
          ) : (
            <Button size="sm" onClick={alInscribirse} disabled={!regla.puedeInscribirse || ocupado} title={regla.motivo}>
              Inscribirme
            </Button>
          )}
          {puedeLlegar && (
            <Button variant="secondary" size="sm" onClick={alLlegada}>
              Llegué a la guardia
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={alReporte}>
            Reporte
          </Button>
        </div>
        {!yaInscrito && !regla.puedeInscribirse && (
          <p className="text-[11px] text-muted-foreground">{regla.motivo}</p>
        )}
        {dia.estado === "firmada" && <Badge variant="exito">Reporte firmado</Badge>}
        {dia.estado === "constituida" && <Badge variant="aviso">Reporte sin firmar</Badge>}
      </CardContent>
    </Card>
  );
}
