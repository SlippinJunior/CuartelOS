import * as React from "react";
import { Truck } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";

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

export function MaterialPage() {
  const [lado] = React.useState("izquierda");
  const [activa, setActiva] = React.useState<Cajonera | null>(null);
  const cajoneras = LADOS[lado];

  return (
    <div>
      <PageHeader
        titulo="Material mayor · vista 2D"
        descripcion="Demostración estática de la vista por lado del carro con cajoneras tocables."
      />

      <div className="mb-3 flex flex-wrap items-center gap-2 rounded-md border border-aviso/40 bg-aviso/10 p-3 text-sm">
        <Badge variant="aviso">Etapa 3</Badge>
        <span className="text-muted-foreground">
          Mock de validación. En la Etapa 3 las zonas se editan sobre una foto real y las coordenadas se guardan en
          <code className="mx-1">material.ubicacion.forma</code>.
        </span>
      </div>

      <Tabs
        items={[
          {
            id: "izquierda",
            etiqueta: "Lado izquierdo",
            contenido: <VistaUnidad lado="izquierda" cajoneras={LADOS.izquierda} activa={activa} setActiva={setActiva} />,
          },
          {
            id: "derecha",
            etiqueta: "Lado derecho",
            contenido: <VistaUnidad lado="derecha" cajoneras={LADOS.derecha} activa={activa} setActiva={setActiva} />,
          },
          {
            id: "trasera",
            etiqueta: "Trasera",
            contenido: <VistaUnidad lado="trasera" cajoneras={LADOS.trasera} activa={activa} setActiva={setActiva} />,
          },
        ]}
      />

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Inventario por cajonera</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {cajoneras.map((c) => (
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
                Al tocar una zona del carro se muestran los artículos guardados, su estado y el responsable.
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

      <p className="mt-4 text-xs text-muted-foreground">
        <Truck className="mr-1 inline size-4" />
        Unidad M-21 · Convencional · 48.200 km · Revisión técnica vence 01-03-2027.
      </p>
    </div>
  );
}

function VistaUnidad({
  lado,
  cajoneras,
  activa,
  setActiva,
}: {
  lado: string;
  cajoneras: Cajonera[];
  activa: Cajonera | null;
  setActiva: (c: Cajonera) => void;
}) {
  return (
    <Card>
      <CardContent className="pt-4">
        <svg viewBox="0 0 640 320" className="w-full rounded-md bg-[#f6efe6] dark:bg-[#241d19]" role="img" aria-label={`Vista ${lado} de la unidad M-21`}>
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
            M-21
          </text>
        </svg>
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>Frente</span>
          <span>Foto o SVG de ejemplo</span>
          <span>Fondo</span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {cajoneras.length} zonas tocables en el lado {lado}. La forma poligonal se normaliza 0–1 y se guarda en la base.
        </p>
        <Button variant="outline" className="mt-2 w-full" onClick={() => setActiva(cajoneras[0])}>
          Abrir primera cajonera
        </Button>
      </CardContent>
    </Card>
  );
}
