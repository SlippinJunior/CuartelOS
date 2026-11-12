import { useQuery } from "@tanstack/react-query";
import { usePerfil } from "@/features/auth/sesion";
import { db } from "@/lib/supabase";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { formatearFecha, formatearPorcentaje } from "@/lib/formato";
import type { AsistenciaPersona, Marca } from "@/types/tipos";

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const NOMBRE_MARCA: Record<Marca, string> = {
  A: "Asiste",
  F: "Falta",
  P: "Permiso",
  R: "Eximido",
  S: "Suspendido",
  L: "Licencia",
};

interface FilaAsistencia {
  marca: Marca;
  lista: { anio: number; numero: number; fecha: string; tipo_acto?: { descripcion: string } | null } | null;
}

export function MiAsistenciaPage() {
  const { data: perfil } = usePerfil();
  const personaId = perfil?.persona?.id;
  const anio = new Date().getFullYear();

  const resumenQ = useQuery({
    queryKey: ["mi-asistencia", "resumen", personaId],
    queryFn: async () => {
      const { data, error } = await db.personal
        .from("v_asistencia_persona")
        .select("*")
        .eq("persona_id", personaId);
      if (error) throw error;
      return (data ?? []) as AsistenciaPersona[];
    },
    enabled: Boolean(personaId),
  });

  const detalleQ = useQuery({
    queryKey: ["mi-asistencia", "detalle", personaId],
    queryFn: async () => {
      const { data, error } = await db.asistencia
        .from("asistencia")
        .select("marca, lista:lista(anio, numero, fecha, tipo_acto:tipo_acto(descripcion))")
        .eq("persona_id", personaId);
      if (error) throw error;
      return (data ?? []) as unknown as FilaAsistencia[];
    },
    enabled: Boolean(personaId),
  });

  if (!personaId) {
    return <EmptyState titulo="Sin ficha vinculada" descripcion="Tu usuario no está asociado a una persona de la compañía." />;
  }

  const delAnio = (detalleQ.data ?? [])
    .filter((f) => f.lista?.anio === anio)
    .sort((a, b) => (a.lista?.fecha ?? "").localeCompare(b.lista?.fecha ?? ""));
  const resumen = resumenQ.data?.find((r) => r.anio === anio);

  const porMes = MESES.map((nombre, i) => {
    const filas = delAnio.filter((f) => f.lista && new Date(f.lista.fecha).getMonth() === i);
    const cuenta: Record<Marca, number> = { A: 0, F: 0, P: 0, R: 0, S: 0, L: 0 };
    filas.forEach((f) => {
      cuenta[f.marca]++;
    });
    return { nombre, ...cuenta, total: filas.length };
  });

  return (
    <div>
      <PageHeader
        titulo="Mi asistencia"
        descripcion={`Marcas registradas en el año ${anio}.`}
        volverA="/asistencia"
      />

      {resumenQ.isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Asistencias", resumen?.asistencias ?? 0],
              ["Faltas", resumen?.faltas ?? 0],
              ["Permisos", resumen?.permisos ?? 0],
              ["Porcentaje", formatearPorcentaje(resumen?.pct ?? 0)],
            ].map(([etiqueta, valor]) => (
              <Card key={String(etiqueta)}>
                <CardContent className="pt-4 text-center">
                  <p className="text-2xl font-bold">{valor}</p>
                  <p className="text-xs text-muted-foreground">{etiqueta}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle>Resumen mensual</CardTitle>
            </CardHeader>
            <CardContent>
              {delAnio.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aún no hay listas con tu marca este año.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="py-1 pr-2">Mes</th>
                        <th className="px-1 text-center">A</th>
                        <th className="px-1 text-center">F</th>
                        <th className="px-1 text-center">P</th>
                        <th className="px-1 text-center">L</th>
                        <th className="px-1 text-center">R</th>
                        <th className="px-1 text-center">S</th>
                      </tr>
                    </thead>
                    <tbody>
                      {porMes.filter((m) => m.total > 0).map((m) => (
                        <tr key={m.nombre} className="border-t border-border">
                          <td className="py-2 pr-2 font-medium">{m.nombre}</td>
                          <td className="px-1 text-center">{m.A}</td>
                          <td className="px-1 text-center">{m.F}</td>
                          <td className="px-1 text-center">{m.P}</td>
                          <td className="px-1 text-center">{m.L}</td>
                          <td className="px-1 text-center">{m.R}</td>
                          <td className="px-1 text-center">{m.S}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Detalle de actos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {delAnio.length === 0 && <p className="text-sm text-muted-foreground">Sin registros.</p>}
              {delAnio
                .slice()
                .reverse()
                .map((f, i) => (
                  <div key={`${f.lista?.numero}-${i}`} className="flex items-center justify-between gap-3 rounded-md border border-border p-2 text-sm">
                    <div>
                      <p className="font-medium">Lista N° {f.lista?.numero} · {f.lista?.tipo_acto?.descripcion ?? "Acto"}</p>
                      <p className="text-xs text-muted-foreground">{formatearFecha(f.lista?.fecha)}</p>
                    </div>
                    <Badge
                      variant={
                        f.marca === "A" ? "exito" : f.marca === "F" ? "peligro" : f.marca === "P" ? "aviso" : "apagado"
                      }
                    >
                      {f.marca} · {NOMBRE_MARCA[f.marca]}
                    </Badge>
                  </div>
                ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
