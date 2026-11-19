import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Flame, TrendingUp } from "lucide-react";
import { db } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { etiquetaCategoria } from "@/features/guardia/logica";
import { fechaISO } from "@/lib/formato";
import type { CategoriaGuardia, EstadisticasGuardia } from "@/types/tipos";

const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function EstadisticasGuardiaPanel() {
  const hoy = new Date();
  const hace180 = new Date();
  hace180.setDate(hace180.getDate() - 180);
  const [desde, setDesde] = React.useState(fechaISO(hace180));
  const [hasta, setHasta] = React.useState(fechaISO(hoy));

  const { data, isLoading } = useQuery({
    queryKey: ["guardia", "estadisticas", desde, hasta],
    queryFn: async () => {
      const { data, error } = await db.operaciones.rpc("estadisticas_guardia", {
        p_desde: desde,
        p_hasta: hasta,
      });
      if (error) throw error;
      return data as unknown as EstadisticasGuardia;
    },
  });

  const maxDia = Math.max(1, ...(data?.por_dia_semana ?? []).map((d) => d.guardianes));

  if (isLoading) return <p className="text-sm text-muted-foreground">Calculando estadísticas…</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <Label htmlFor="est-desde">Desde</Label>
          <Input id="est-desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="est-hasta">Hasta</Label>
          <Input id="est-hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="size-5 text-primary" /> Cumplimiento por categoría
          </CardTitle>
          <CardDescription>Orden 01/2026 §3</CardDescription>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <th className="px-2 py-2">Categoría</th>
                <th className="px-2 py-2 text-right">Bomberos</th>
                <th className="px-2 py-2 text-right">Guardias cumplidas</th>
                <th className="px-2 py-2 text-right">Llegadas tardías</th>
              </tr>
            </thead>
            <tbody>
              {(data?.por_categoria ?? []).map((c) => (
                <tr key={c.categoria} className="border-b border-border">
                  <td className="px-2 py-2">
                    <Badge variant={c.categoria === "exento" ? "apagado" : "outline"}>
                      {etiquetaCategoria(c.categoria as CategoriaGuardia)}
                    </Badge>
                  </td>
                  <td className="px-2 py-2 text-right">{c.personas}</td>
                  <td className="px-2 py-2 text-right">{c.cumplidas}</td>
                  <td className="px-2 py-2 text-right">{c.llegadas_tardias}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="size-5 text-primary" /> Cobertura por día de la semana
          </CardTitle>
          <CardDescription>Guardias cumplidas por día; detecta los días débiles.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {DIAS.map((dia, i) => {
            const fila = (data?.por_dia_semana ?? []).find((d) => d.dia === i + 1);
            const valor = fila?.guardianes ?? 0;
            return (
              <div key={dia} className="flex items-center gap-3 text-sm">
                <span className="w-8 text-muted-foreground">{dia}</span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(valor / maxDia) * 100}%` }} />
                </div>
                <span className="w-10 text-right">{valor}</span>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Flame className="size-5 text-primary" /> Maquinistas (Charlie)
          </CardTitle>
          <CardDescription>Turnos Z8 (en cuartel) y Z20 (a la escucha).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {(data?.maquinistas ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">Sin turnos con maquinista registrados.</p>
          )}
          {(data?.maquinistas ?? []).map((m) => (
            <div key={m.persona_id} className="flex items-center justify-between rounded-md border border-border p-2 text-sm">
              <span className="font-mono text-xs">{m.codigo}</span>
              <div className="flex gap-2">
                <Badge variant="exito">Z8 · {m.z8}</Badge>
                <Badge variant="aviso">Z20 · {m.z20}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
