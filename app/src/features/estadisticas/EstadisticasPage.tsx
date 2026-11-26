import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, BarChart3, Flame, Package, ShieldCheck, Truck, Users } from "lucide-react";
import { db } from "@/lib/supabase";
import { usePerfil } from "@/features/auth/sesion";
import { puedeVer } from "@/lib/permisos";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { formatearCLP, formatearPorcentaje } from "@/lib/formato";
import { normalizarEstadisticas } from "@/features/estadisticas/logica";
import type { EstadisticasCompania } from "@/types/tipos";

const COLORES_MARCA: Record<string, string> = {
  A: "#15803d",
  F: "#b91c1c",
  P: "#0284c7",
  R: "#d97706",
  L: "#64748b",
  S: "#ea580c",
};

export function EstadisticasPage() {
  const { data: perfil } = usePerfil();
  const roles = perfil?.roles ?? [];
  const puede = puedeVer(roles, "estadisticas", perfil?.modulos);
  const anioActual = new Date().getFullYear();
  const [anio, setAnio] = React.useState(String(anioActual));

  const q = useQuery({
    queryKey: ["estadisticas", anio],
    enabled: puede,
    queryFn: async () => {
      const { data, error } = await db.nucleo.rpc("estadisticas_compania", { p_anio: Number(anio) });
      if (error) throw error;
      return normalizarEstadisticas(data as unknown as EstadisticasCompania, Number(anio));
    },
  });

  if (!puede) {
    return (
      <EmptyState
        titulo="Sin acceso a Estadísticas"
        descripcion="Solicita acceso de lectura al Director o Administrador."
        icono={BarChart3}
      />
    );
  }

  const datos = q.data ?? normalizarEstadisticas(null, Number(anio));

  return (
    <div className="space-y-5">
      <PageHeader
        titulo="Estadísticas"
        descripcion="Panel gráfico de emergencias, asistencia, inventario EPP, unidades y guardias para toma de decisiones."
        acciones={
          <Select aria-label="Año de estadísticas" className="w-28" value={anio} onChange={(e) => setAnio(e.target.value)}>
            {Array.from({ length: 5 }, (_, i) => anioActual + 1 - i).map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </Select>
        }
      />

      {q.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-1">
                <CardDescription className="flex items-center gap-1.5">
                  <Flame className="size-4 text-primary" /> Emergencias y actos
                </CardDescription>
                <CardTitle className="text-3xl">{datos.resumen.total_emergencias}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                de {datos.resumen.total_actos} listas totales en {datos.anio}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-1">
                <CardDescription className="flex items-center gap-1.5">
                  <Users className="size-4 text-primary" /> Asistencia promedio
                </CardDescription>
                <CardTitle className="text-3xl">{formatearPorcentaje(datos.resumen.asistencia_promedio_pct)}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                {datos.resumen.bomberos_activos} bomberos activos en lista
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-1">
                <CardDescription className="flex items-center gap-1.5">
                  <Package className="size-4 text-primary" /> EPP asignado
                </CardDescription>
                <CardTitle className="text-3xl">{datos.resumen.total_asignaciones_activas}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                {datos.resumen.stock_bajo_count} ítem(s) en stock bajo mínimo
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-1">
                <CardDescription className="flex items-center gap-1.5">
                  <Truck className="size-4 text-primary" /> Bitácora de unidades
                </CardDescription>
                <CardTitle className="text-3xl">{formatearCLP(datos.resumen.costo_mantenciones)}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                {datos.resumen.eventos_bitacora} eventos registrados en {datos.anio}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Emergencias vs otros actos por mes</CardTitle>
                <CardDescription>Evolución mensual de citaciones, reuniones y emergencias.</CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={datos.actos_por_mes}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                    <XAxis dataKey="etiqueta" fontSize={12} />
                    <YAxis allowDecimals={false} fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="emergencias" name="Emergencias" stroke="#b91c1c" fill="#b91c1c" fillOpacity={0.25} />
                    <Area type="monotone" dataKey="otros" name="Reuniones / Academias" stroke="#0284c7" fill="#0284c7" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Claves más frecuentes</CardTitle>
                <CardDescription>Top claves registradas en el Libro de Asistencia.</CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={datos.actos_por_clave} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                    <XAxis type="number" allowDecimals={false} fontSize={12} />
                    <YAxis dataKey="clave" type="category" width={54} fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="cantidad" name="Listas" fill="#b91c1c" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Distribución de marcas</CardTitle>
                <CardDescription>Proporción de A, F, P, R, L y S.</CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={datos.distribucion_marcas} dataKey="cantidad" nameKey="marca" outerRadius={80} label>
                      {datos.distribucion_marcas.map((d) => (
                        <Cell key={d.marca} fill={COLORES_MARCA[d.marca] ?? "#64748b"} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Mayor participación</CardTitle>
                <CardDescription>Top bomberos activos por % de asistencia.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {datos.top_asistencia.slice(0, 6).map((b) => (
                  <div key={b.registro} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate">{b.registro} · {b.nombre}</span>
                    <Badge variant="exito">{formatearPorcentaje(b.pct)}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Menor asistencia activa</CardTitle>
                <CardDescription>Útil para seguimiento de oficialidad.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {datos.menor_asistencia.slice(0, 6).map((b) => (
                  <div key={b.registro} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate">{b.registro} · {b.nombre}</span>
                    <Badge variant="peligro">{formatearPorcentaje(b.pct)}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Materiales que MÁS tienen los bomberos</CardTitle>
                <CardDescription>Asignaciones vigentes en poder del personal.</CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={datos.material_mas_asignado} layout="vertical" margin={{ left: 4, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                    <XAxis type="number" allowDecimals={false} fontSize={12} />
                    <YAxis
                      dataKey="articulo"
                      type="category"
                      width={112}
                      fontSize={11}
                      tickFormatter={(v: string) => (v.length > 16 ? `${v.slice(0, 15)}…` : v)}
                    />
                    <Tooltip />
                    <Bar dataKey="asignados" name="Asignados" fill="#15803d" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Materiales que MENOS tienen los bomberos</CardTitle>
                <CardDescription>Artículos con menor cobertura o sin entregar aún.</CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={datos.material_menos_asignado} layout="vertical" margin={{ left: 4, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                    <XAxis type="number" allowDecimals={false} fontSize={12} />
                    <YAxis
                      dataKey="articulo"
                      type="category"
                      width={112}
                      fontSize={11}
                      tickFormatter={(v: string) => (v.length > 16 ? `${v.slice(0, 15)}…` : v)}
                    />
                    <Tooltip />
                    <Bar dataKey="asignados" name="Asignados" fill="#d97706" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Truck className="size-4 text-primary" /> Estado y bitácora de unidades
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {datos.unidades_resumen.map((u) => (
                  <div key={u.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-2.5 text-sm">
                    <div>
                      <p className="font-semibold">{u.codigo} · {u.marca ?? ""} {u.modelo ?? ""}</p>
                      <p className="text-xs text-muted-foreground">
                        {u.km_actual != null ? `${u.km_actual.toLocaleString("es-CL")} km · ` : ""}
                        {u.mantenciones} mant. · {u.accidentes} acc.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={u.estado === "operativa" ? "exito" : "aviso"}>{u.estado}</Badge>
                      <span className="text-xs font-medium">{formatearCLP(u.costo_total)}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="size-4 text-aviso" /> Alertas de stock y cobertura de guardia
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-2.5 text-sm">
                  <span className="flex items-center gap-2 font-medium">
                    <ShieldCheck className="size-4 shrink-0 text-primary" />
                    Guardia ({datos.guardias_resumen.ciclo_nombre ?? "Sin ciclo activo"})
                  </span>
                  <Badge variant="outline">
                    {datos.guardias_resumen.turnos_cubiertos}/{datos.guardias_resumen.turnos_totales} turnos ({formatearPorcentaje(datos.guardias_resumen.pct_cobertura)})
                  </Badge>
                </div>

                {datos.stock_bajo.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin alertas de stock bajo en Inventario Compañía.</p>
                ) : (
                  <div className="space-y-1.5">
                    {datos.stock_bajo.map((s, i) => (
                      <div key={`${s.articulo}-${i}`} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-aviso/40 bg-aviso/10 px-3 py-2 text-sm">
                        <span className="min-w-0">{s.articulo}{s.talla ? ` (${s.talla})` : ""}</span>
                        <Badge variant="aviso" className="shrink-0">{s.cantidad} / mín. {s.minimo}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
