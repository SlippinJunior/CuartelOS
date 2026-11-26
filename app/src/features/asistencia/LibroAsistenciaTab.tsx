import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Download, Search } from "lucide-react";
import { db } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { calcularFilaLibro, CLASE_CELDA_LIBRO, exportarLibroCsv } from "@/features/asistencia/logica";
import { cn } from "@/lib/utils";
import type { LibroAnualData, TipoActo } from "@/types/tipos";

export function LibroAsistenciaTab({
  onAbrirParte,
}: {
  onAbrirParte: (listaId: number) => void;
}) {
  const anioActual = new Date().getFullYear();
  const [anio, setAnio] = React.useState(String(anioActual));
  const [clave, setClave] = React.useState("");
  const [busqueda, setBusqueda] = React.useState("");

  const clavesQ = useQuery({
    queryKey: ["tipos-acto"],
    queryFn: async () => {
      const { data, error } = await db.asistencia.from("tipo_acto").select("*").eq("activo", true).order("clave");
      if (error) throw error;
      return (data ?? []) as TipoActo[];
    },
  });

  const libroQ = useQuery({
    queryKey: ["libro-anual", anio, clave],
    queryFn: async () => {
      const { data, error } = await db.asistencia.rpc("libro_anual", {
        p_anio: Number(anio),
        p_clave: clave || null,
      });
      if (error) throw error;
      return data as unknown as LibroAnualData;
    },
  });

  const libro = libroQ.data;
  const texto = busqueda.trim().toLowerCase();
  const personasFiltradas = (libro?.personas ?? []).filter(
    (p) => !texto || `${p.registro} ${p.nombre} ${p.cargo_grado}`.toLowerCase().includes(texto),
  );

  function descargarCsv() {
    if (!libro) return;
    const csv = exportarLibroCsv(libro);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `libro_asistencia_${libro.anio}${clave ? `_${clave}` : ""}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-center gap-2 pt-4">
          <Select value={anio} onChange={(e) => setAnio(e.target.value)} aria-label="Año del libro" className="w-28">
            {Array.from({ length: 5 }, (_, i) => anioActual + 1 - i).map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </Select>
          <Select value={clave} onChange={(e) => setClave(e.target.value)} aria-label="Filtrar por clave" className="w-56">
            <option value="">Todas las claves</option>
            {(clavesQ.data ?? []).map((t) => (
              <option key={t.clave} value={t.clave}>{t.clave} · {t.descripcion}</option>
            ))}
          </Select>
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar bombero o registro"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <Button variant="outline" className="ml-auto" onClick={descargarCsv} disabled={!libro || libro.listas.length === 0}>
            <Download /> Exportar CSV
          </Button>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-medium text-muted-foreground">Leyenda:</span>
        <span className={cn("rounded px-2 py-0.5", CLASE_CELDA_LIBRO.A)}>1, 2… Asiste (acumulado)</span>
        <span className={cn("rounded px-2 py-0.5", CLASE_CELDA_LIBRO.F)}>F Falta</span>
        <span className={cn("rounded px-2 py-0.5", CLASE_CELDA_LIBRO.R)}>R Reconocida / Eximido</span>
        <span className={cn("rounded px-2 py-0.5", CLASE_CELDA_LIBRO.P)}>P Permiso</span>
        <span className={cn("rounded px-2 py-0.5", CLASE_CELDA_LIBRO.S)}>S Suspendido</span>
        <span className={cn("rounded px-2 py-0.5", CLASE_CELDA_LIBRO.L)}>L Licencia</span>
        <span className={cn("rounded px-2 py-0.5", CLASE_CELDA_LIBRO.NA)}>N/A Previo a ingreso</span>
      </div>

      {libroQ.isLoading && <Skeleton className="h-64 w-full" />}

      {!libroQ.isLoading && (!libro || libro.listas.length === 0) && (
        <EmptyState
          titulo="Sin listas registradas en el libro"
          descripcion="No hay partes registrados para el año y clave seleccionados."
          icono={BookOpen}
        />
      )}

      {libro && libro.listas.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Libro de Asistencia · Período {libro.anio} ({libro.listas.length} listas · {personasFiltradas.length} bomberos)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/60">
                    <th scope="col" className="sticky left-0 z-10 bg-card px-2 py-2 text-left font-semibold">Reg.</th>
                    <th scope="col" className="sticky left-12 z-10 min-w-44 bg-card px-2 py-2 text-left font-semibold">Bombero</th>
                    <th scope="col" className="px-2 py-2 text-left font-semibold">Cargo</th>
                    <th scope="col" className="px-2 py-2 text-center font-semibold">Tot.</th>
                    {libro.listas.map((l) => (
                      <th key={l.id} scope="col" className="min-w-14 border-l border-border p-1 text-center">
                        <button
                          type="button"
                          onClick={() => onAbrirParte(l.id)}
                          className="w-full rounded px-1 py-0.5 hover:bg-accent"
                          title={`${l.clave} · ${l.descripcion} (${l.fecha})`}
                        >
                          <div className="font-bold text-primary">{l.clave}</div>
                          <div className="text-[10px] text-muted-foreground">{l.fecha.slice(5, 10).split("-").reverse().join("/")}</div>
                          <div className="text-[10px] font-medium">L{l.numero}</div>
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {personasFiltradas.map((p) => {
                    const { total, celdas } = calcularFilaLibro(p, libro.listas);
                    return (
                      <tr key={p.persona_id} className="border-t border-border hover:bg-muted/30">
                        <td className="sticky left-0 z-10 bg-card px-2 py-1.5 font-mono">{p.registro}</td>
                        <td className="sticky left-12 z-10 bg-card px-2 py-1.5 font-medium whitespace-nowrap">{p.nombre}</td>
                        <td className="px-2 py-1.5 text-muted-foreground whitespace-nowrap">{p.cargo_grado}</td>
                        <td className="px-2 py-1.5 text-center font-bold">{total}</td>
                        {celdas.map((c) => (
                          <td
                            key={c.listaId}
                            className={cn("border-l border-border px-1 py-1.5 text-center", c.clase)}
                          >
                            {c.texto}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
