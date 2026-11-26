import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Truck } from "lucide-react";
import { db } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatearFecha } from "@/lib/formato";
import type { Unidad, UnidadDocumento } from "@/types/tipos";

interface Cajonera {
  codigo: string;
  nombre: string;
  x: number;
  y: number;
  w: number;
  h: number;
  items: string[];
}

const LADOS: Record<string, Cajonera[]> = {
  izquierda: [
    { codigo: "C1", nombre: "Cajonera 1", x: 250, y: 80, w: 80, h: 90, items: ["Hacha de bombero ×2", "Pitón 2.5″"] },
    { codigo: "C2", nombre: "Cajonera 2", x: 340, y: 80, w: 80, h: 90, items: ["Cuerda 30 m", "Arnés"] },
    { codigo: "C3", nombre: "Cajonera 3", x: 430, y: 80, w: 80, h: 90, items: ["Linternas ×4", "Baterías"] },
    { codigo: "C4", nombre: "Cajonera 4", x: 250, y: 180, w: 80, h: 70, items: ["Botiquín", "Camilla rígida"] },
    { codigo: "C5", nombre: "Cajonera 5", x: 340, y: 180, w: 170, h: 70, items: ["ERA ×2", "Cilindros 6.8 L ×2", "Máscaras"] },
  ],
  derecha: [
    { codigo: "C1", nombre: "Cajonera 1", x: 250, y: 80, w: 80, h: 90, items: ["Traje Hazmat nivel B"] },
    { codigo: "C2", nombre: "Cajonera 2", x: 340, y: 80, w: 80, h: 90, items: ["Guantes ×6", "Capotes ×4"] },
    { codigo: "C3", nombre: "Cajonera 3", x: 430, y: 80, w: 80, h: 90, items: ["Cascos ×6"] },
    { codigo: "C4", nombre: "Cajonera 4", x: 250, y: 180, w: 80, h: 70, items: ["Herramientas menores"] },
    { codigo: "C5", nombre: "Cajonera 5", x: 340, y: 180, w: 170, h: 70, items: ["Mangueras", "Reducciones"] },
  ],
  trasera: [
    { codigo: "T1", nombre: "Compartimiento trasero", x: 200, y: 90, w: 200, h: 160, items: ["Escala extensible", "Conos ×6", "Cinta de seguridad"] },
  ],
};

/** Vista de Unidades conectada a material.unidad y maqueta 2D de cajoneras. */
export function VistaUnidades() {
  const [seleccionada, setSeleccionada] = React.useState<number | null>(null);
  const [activa, setActiva] = React.useState<Cajonera | null>(null);

  const unidadesQ = useQuery({
    queryKey: ["material", "unidades"],
    queryFn: async () => {
      const { data, error } = await db.material
        .from("unidad")
        .select("*, tipo_unidad:tipo_unidad(nombre, codigo)")
        .order("codigo");
      if (error) throw error;
      return (data ?? []) as Unidad[];
    },
  });

  const docsQ = useQuery({
    queryKey: ["material", "unidad-documentos"],
    queryFn: async () => {
      const { data, error } = await db.material.from("unidad_documento").select("*");
      if (error) throw error;
      return (data ?? []) as UnidadDocumento[];
    },
  });

  const unidades = unidadesQ.data ?? [];
  const unidad = unidades.find((u) => u.id === seleccionada) ?? unidades[0] ?? null;
  const docsUnidad = (docsQ.data ?? []).filter((d) => d.unidad_id === unidad?.id);
  const codigoUnidad = unidad?.codigo ?? "M-21";

  return (
    <div className="space-y-4">
      {unidadesQ.isLoading ? (
        <Skeleton className="h-28 w-full" />
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Truck className="size-5 text-primary" />
                <CardTitle>{unidad ? `${unidad.codigo} · ${unidad.marca ?? "Unidad"} ${unidad.modelo ?? ""}` : "Sin unidades"}</CardTitle>
              </div>
              {unidades.length > 0 && (
                <Select
                  aria-label="Seleccionar unidad"
                  className="w-full sm:w-52"
                  value={unidad ? String(unidad.id) : ""}
                  onChange={(e) => setSeleccionada(Number(e.target.value))}
                >
                  {unidades.map((u) => (
                    <option key={u.id} value={u.id}>{u.codigo} · {u.marca ?? "Carro"}</option>
                  ))}
                </Select>
              )}
            </div>
            {unidad && (
              <CardDescription>
                {unidad.tipo_unidad?.nombre ?? "Unidad"}
                {unidad.patente ? ` · Patente ${unidad.patente}` : ""}
                {unidad.anio ? ` · Año ${unidad.anio}` : ""}
                {unidad.km_actual != null ? ` · ${unidad.km_actual.toLocaleString("es-CL")} km` : ""}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 pt-0">
            {unidad && (
              <Badge variant={unidad.estado === "operativa" ? "exito" : unidad.estado === "mantencion" ? "aviso" : "peligro"}>
                Estado: {unidad.estado}
              </Badge>
            )}
            {docsUnidad.map((d) => (
              <Badge key={d.id} variant="outline">
                {d.tipo.replace(/_/g, " ")}: {d.vence ? formatearFecha(d.vence) : "sin fecha"}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-2 rounded-md border border-aviso/40 bg-aviso/10 p-3 text-sm">
        <Badge variant="aviso">Vista 2D</Badge>
        <span className="text-muted-foreground">
          Esquema de referencia de cajoneras para <strong>{codigoUnidad}</strong>. Las unidades se administran desde Administración → Unidades.
        </span>
      </div>

      <Tabs
        items={[
          {
            id: "izquierda",
            etiqueta: "Lado izquierdo",
            contenido: <VistaUnidad codigo={codigoUnidad} lado="izquierda" cajoneras={LADOS.izquierda} activa={activa} setActiva={setActiva} />,
          },
          {
            id: "derecha",
            etiqueta: "Lado derecho",
            contenido: <VistaUnidad codigo={codigoUnidad} lado="derecha" cajoneras={LADOS.derecha} activa={activa} setActiva={setActiva} />,
          },
          {
            id: "trasera",
            etiqueta: "Trasera",
            contenido: <VistaUnidad codigo={codigoUnidad} lado="trasera" cajoneras={LADOS.trasera} activa={activa} setActiva={setActiva} />,
          },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Inventario por cajonera</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {LADOS.izquierda.map((c) => (
              <button
                key={c.codigo}
                type="button"
                onClick={() => setActiva(c)}
                className="flex w-full items-center justify-between gap-3 rounded-md border border-border p-3 text-left hover:bg-accent"
              >
                <div>
                  <p className="text-sm font-medium">{c.nombre}</p>
                  <p className="text-xs text-muted-foreground">{c.items.join(" · ")}</p>
                </div>
                <Badge variant={activa?.codigo === c.codigo ? "default" : "outline"}>{c.codigo}</Badge>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{activa ? activa.nombre : "Toca una cajonera"}</CardTitle></CardHeader>
          <CardContent>
            {!activa && (
              <p className="text-sm text-muted-foreground">
                Al tocar una zona del carro se muestran los artículos guardados y su estado.
              </p>
            )}
            {activa && (
              <ul className="space-y-2">
                {activa.items.map((i) => (
                  <li key={i} className="flex items-center justify-between gap-2 rounded-md border border-border p-2 text-sm">
                    <span>{i}</span>
                    <Badge variant="exito">Bueno</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function VistaUnidad({
  codigo,
  lado,
  cajoneras,
  activa,
  setActiva,
}: {
  codigo: string;
  lado: string;
  cajoneras: Cajonera[];
  activa: Cajonera | null;
  setActiva: (c: Cajonera) => void;
}) {
  return (
    <Card>
      <CardContent className="pt-4">
        <svg viewBox="0 0 640 320" className="w-full rounded-md bg-[#f6efe6] dark:bg-[#241d19]" role="img" aria-label={`Vista ${lado} de la unidad ${codigo}`}>
          <rect x="20" y="60" width="600" height="210" rx="14" fill="#b71c1c" />
          <rect x="40" y="90" width="150" height="120" rx="8" fill="#e8dccd" />
          <text x="115" y="155" textAnchor="middle" fontSize="14" fill="#5c2a17">Cabina</text>
          {cajoneras.map((c) => {
            const sel = activa?.codigo === c.codigo;
            return (
              <g key={c.codigo} onClick={() => setActiva(c)} className="cursor-pointer">
                <rect
                  x={c.x}
                  y={c.y}
                  width={c.w}
                  height={c.h}
                  rx="6"
                  fill={sel ? "#fde68a" : "#f8f1e7"}
                  stroke={sel ? "#a16207" : "#9b1c1c"}
                  strokeWidth={sel ? 3 : 1.5}
                />
                <text x={c.x + c.w / 2} y={c.y + c.h / 2} textAnchor="middle" fontSize="16" fontWeight="600" fill="#5c2a17">
                  {c.codigo}
                </text>
                <text x={c.x + c.w / 2} y={c.y + c.h / 2 + 20} textAnchor="middle" fontSize="9" fill="#7a6b61">
                  {c.nombre}
                </text>
              </g>
            );
          })}
          <circle cx="80" cy="290" r="18" fill="#2b2522" />
          <circle cx="540" cy="290" r="18" fill="#2b2522" />
          <text x="600" y="300" textAnchor="end" fontSize="12" fill="#7a6b61">
            {codigo}
          </text>
        </svg>
        <Button variant="outline" className="mt-3 w-full" onClick={() => setActiva(cajoneras[0])}>
          Abrir primera cajonera
        </Button>
      </CardContent>
    </Card>
  );
}
