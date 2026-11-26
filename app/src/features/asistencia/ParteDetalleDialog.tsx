import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, Edit3, MapPin, MessageSquareText, Search } from "lucide-react";
import { db } from "@/lib/supabase";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EstadoBadge } from "@/components/common/StatusBadge";
import { formatearFecha } from "@/lib/formato";
import { etiquetaCategoriaClave } from "@/features/asistencia/logica";
import type { Marca, ParteDetalleData } from "@/types/tipos";

const VARIANTE_MARCA: Record<Marca, "exito" | "peligro" | "aviso" | "apagado"> = {
  A: "exito",
  F: "peligro",
  P: "aviso",
  R: "apagado",
  S: "apagado",
  L: "apagado",
};

export function ParteDetalleDialog({
  listaId,
  puedeEditar,
  onCerrar,
}: {
  listaId: number | null;
  puedeEditar: boolean;
  onCerrar: () => void;
}) {
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = React.useState("");
  const [filtroMarca, setFiltroMarca] = React.useState("");

  React.useEffect(() => {
    setBusqueda("");
    setFiltroMarca("");
  }, [listaId]);

  const detalleQ = useQuery({
    queryKey: ["parte-detalle", listaId],
    enabled: Boolean(listaId),
    queryFn: async () => {
      const { data, error } = await db.asistencia.rpc("detalle_parte", { p_lista_id: listaId });
      if (error) throw error;
      return data as unknown as ParteDetalleData;
    },
  });

  const parte = detalleQ.data;
  const texto = busqueda.trim().toLowerCase();
  const filtradas = (parte?.asistencias ?? []).filter(
    (a) =>
      (!filtroMarca || a.marca === filtroMarca) &&
      (!texto || `${a.registro} ${a.nombre}`.toLowerCase().includes(texto)),
  );

  return (
    <Dialog
      abierto={Boolean(listaId)}
      onCambio={(v) => !v && onCerrar()}
      titulo={
        parte
          ? `Parte N° ${parte.lista.numero} · ${parte.lista.clave ?? "Sin clave"}`
          : "Detalle del parte"
      }
      descripcion={parte?.lista.tipo_descripcion ?? parte?.lista.descripcion ?? undefined}
      pie={
        <>
          <Button variant="outline" onClick={onCerrar}>Cerrar</Button>
          {puedeEditar && listaId && (
            <Button
              onClick={() => {
                onCerrar();
                void navigate({ to: "/asistencia/$listaId", params: { listaId: String(listaId) } });
              }}
            >
              <Edit3 /> Pasar lista / editar
            </Button>
          )}
        </>
      }
    >
      {detalleQ.isLoading && <Skeleton className="h-48 w-full" />}

      {parte && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <EstadoBadge estado={parte.lista.estado} />
            <Badge variant="outline">{etiquetaCategoriaClave(parte.lista.categoria)}</Badge>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="size-3.5" /> {formatearFecha(parte.lista.fecha)}
            </span>
            {(parte.lista.hora_inicio || parte.lista.hora_termino) && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="size-3.5" />
                {parte.lista.hora_inicio?.slice(0, 5) ?? "?"} – {parte.lista.hora_termino?.slice(0, 5) ?? "?"}
              </span>
            )}
            {parte.lista.direccion && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3.5" /> {parte.lista.direccion}
              </span>
            )}
          </div>

          {parte.lista.citacion_titulo && (
            <p className="rounded-md bg-muted/50 px-3 py-2 text-xs">
              Citación vinculada: <strong>{parte.lista.citacion_titulo}</strong>
            </p>
          )}

          {parte.lista.comentarios && (
            <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <MessageSquareText className="size-3.5" /> Comentarios del Ayudante
              </p>
              <p className="whitespace-pre-line">{parte.lista.comentarios}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-1.5">
            <Badge variant="exito">A {parte.resumen.A}</Badge>
            <Badge variant="peligro">F {parte.resumen.F}</Badge>
            <Badge variant="aviso">P {parte.resumen.P}</Badge>
            <Badge variant="apagado">R {parte.resumen.R}</Badge>
            <Badge variant="apagado">S {parte.resumen.S}</Badge>
            <Badge variant="apagado">L {parte.resumen.L}</Badge>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Filtrar por bombero o registro"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <Select
              aria-label="Filtrar por marca"
              className="w-32"
              value={filtroMarca}
              onChange={(e) => setFiltroMarca(e.target.value)}
            >
              <option value="">Todas</option>
              {(["A", "F", "P", "R", "S", "L"] as Marca[]).map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </Select>
          </div>

          <div className="max-h-72 divide-y divide-border overflow-y-auto rounded-md border border-border">
            {filtradas.length === 0 && (
              <p className="p-4 text-center text-sm text-muted-foreground">Sin marcas registradas.</p>
            )}
            {filtradas.map((a) => (
              <div key={a.persona_id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    <span className="mr-2 font-mono text-xs text-muted-foreground">{a.registro}</span>
                    {a.nombre}
                  </p>
                  {a.observacion && <p className="text-xs text-muted-foreground">{a.observacion}</p>}
                </div>
                <Badge variant={VARIANTE_MARCA[a.marca]}>{a.marca}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </Dialog>
  );
}
