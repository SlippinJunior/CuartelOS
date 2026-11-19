import { useQuery } from "@tanstack/react-query";
import { Clock3 } from "lucide-react";
import { db } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/EmptyState";
import { formatearFecha } from "@/lib/formato";
import { horaCorta } from "@/features/guardia/logica";
import type { GrillaGuardia as Grilla } from "@/types/tipos";

/** Historial personal de guardias del ciclo vigente. */
export function MisGuardias() {
  const { data, isLoading } = useQuery({
    queryKey: ["guardia", "grilla", null, "mias"],
    queryFn: async () => {
      const { data, error } = await db.operaciones.rpc("grilla_ciclo", { p_ciclo_id: null });
      if (error) throw error;
      return data as unknown as Grilla | null;
    },
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Cargando…</p>;
  if (!data) {
    return <EmptyState titulo="Sin ciclo vigente" descripcion="Capitanía aún no ha agendado guardias." icono={Clock3} />;
  }

  const mias = data.dias
    .map((d) => ({
      ...d,
      yo: d.integrantes.find((i) => i.estado === "inscrito" || i.estado === "cumplida"),
    }))
    .filter((d) => d.yo);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Clock3 className="size-5 text-primary" /> Mis guardias del ciclo
          </CardTitle>
          <CardDescription>{data.ciclo.nombre}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {mias.length === 0 && (
            <p className="text-sm text-muted-foreground">No tienes guardias inscritas en este ciclo.</p>
          )}
          {mias.map((d) => (
            <div key={d.turno_id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3 text-sm">
              <div>
                <p className="font-medium">{formatearFecha(d.fecha)}</p>
                <p className="text-xs text-muted-foreground">
                  {horaCorta(d.inicio)} → {horaCorta(d.termino)} · {d.guardianes} guardianes
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                {d.estado === "firmada" && <Badge variant="exito">Firmada</Badge>}
                {d.estado === "constituida" && <Badge variant="aviso">Sin firmar</Badge>}
                {d.estado === "programada" && <Badge variant="outline">Programada</Badge>}
                {d.yo?.origen === "llegada_tardia" && <Badge variant="secondary">Llegada {horaCorta(d.yo.hora_llegada)}</Badge>}
                {d.yo?.origen === "reemplazo" && <Badge variant="aviso">Reemplazo</Badge>}
                {d.yo?.es_jefe && <Badge>Jefe de guardia</Badge>}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle>Reportes del ciclo</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {data.dias
            .filter((d) => d.estado !== "programada")
            .map((d) => (
              <div key={d.turno_id} className="rounded-md border border-border p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{formatearFecha(d.fecha)}</p>
                  {d.firmado_en ? <Badge variant="exito">Firmado</Badge> : <Badge variant="aviso">Sin firma</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">
                  Aviso central {horaCorta(d.hora_aviso_central)} · Charlie {d.charlie_modalidad ?? "—"}
                  {d.charlie_codigo ? ` (${d.charlie_codigo})` : ""}
                </p>
                {d.observacion && <p className="mt-1 whitespace-pre-wrap text-xs">{d.observacion}</p>}
              </div>
            ))}
          {data.dias.every((d) => d.estado === "programada") && (
            <p className="text-sm text-muted-foreground">Aún no hay reportes informados.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
