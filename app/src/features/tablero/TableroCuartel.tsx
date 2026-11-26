import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  FileText,
  Megaphone,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { usePerfil } from "@/features/auth/sesion";
import { puedePublicarTablero, tiposPublicablesPor } from "@/lib/permisos";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { formatearFecha } from "@/lib/formato";
import {
  citacionProxima,
  contarPorTipo,
  filtrarPublicaciones,
  META_TIPO_TABLERO,
  ORDEN_FILTROS_TABLERO,
  ordenDiaVigente,
} from "@/features/tablero/logica";
import { DialogoPublicar } from "@/features/tablero/DialogoPublicar";
import { DialogoDetalleComunicado } from "@/features/tablero/DialogoDetalleComunicado";
import type { PublicacionTablero, TableroCuartelData, TipoPublicacionTablero } from "@/types/tipos";

export function TableroCuartel({ modoCuartel = false }: { modoCuartel?: boolean }) {
  const { data: perfil } = usePerfil();
  const roles = perfil?.roles ?? [];
  const esOficial = Boolean(perfil?.es_oficial) || roles.includes("admin");
  const tiposPublicables = tiposPublicablesPor(roles);
  const puedePublicar = !modoCuartel && puedePublicarTablero(roles);

  const [filtro, setFiltro] = React.useState<TipoPublicacionTablero | "todas">("todas");
  const [busqueda, setBusqueda] = React.useState("");
  const [publicarAbierto, setPublicarAbierto] = React.useState(false);
  const [seleccionada, setSeleccionada] = React.useState<PublicacionTablero | null>(null);

  const tableroQ = useQuery({
    queryKey: ["tablero-cuartel"],
    queryFn: async () => {
      const { data, error } = await supabase
        .schema("nucleo")
        .rpc("tablero_cuartel", { p_limite: 60 });
      if (error) throw error;
      return data as unknown as TableroCuartelData;
    },
    refetchInterval: modoCuartel ? 300_000 : false,
  });

  const data = tableroQ.data;
  const hoy = data?.hoy ?? new Date().toISOString().slice(0, 10);
  const publicaciones = React.useMemo(() => data?.publicaciones ?? [], [data]);
  const conteo = React.useMemo(() => contarPorTipo(publicaciones), [publicaciones]);
  const ordenHoy = React.useMemo(
    () => publicaciones.find((p) => ordenDiaVigente(p, hoy)) ?? null,
    [publicaciones, hoy],
  );
  const filtradas = React.useMemo(
    () => filtrarPublicaciones(publicaciones, filtro, busqueda),
    [publicaciones, filtro, busqueda],
  );

  const sinFiltroTexto = filtro === "todas" && !busqueda.trim();
  const citaciones = filtradas.filter((p) => p.tipo === "citacion");
  const capitanias = filtradas.filter((p) => p.tipo === "orden_capitania");
  const circularesCia = filtradas.filter((p) => p.tipo === "circular_compania");
  const circularesCbl = filtradas.filter((p) => p.tipo === "circular_cbl");
  const ordenesDiaPasadas = filtradas.filter((p) => p.tipo === "orden_dia" && p.id !== ordenHoy?.id);

  return (
    <section className="space-y-5" aria-label="Tablero de Cuartel">
      {/* Encabezado y acciones */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
            Tablero de Cuartel
          </h2>
          <p className="text-sm text-muted-foreground">
            Órdenes, citaciones y circulares vigentes de la compañía.
            {data?.feriado_hoy ? ` · Feriado: ${data.feriado_hoy}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void tableroQ.refetch()}
            disabled={tableroQ.isFetching}
          >
            <RefreshCw className={tableroQ.isFetching ? "animate-spin" : ""} />
            Actualizar
          </Button>
          {puedePublicar && (
            <Button onClick={() => setPublicarAbierto(true)}>
              <Plus /> Publicar comunicado
            </Button>
          )}
        </div>
      </div>

      {tableroQ.isLoading && (
        <div className="grid gap-3 md:grid-cols-2">
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-36 w-full" />
        </div>
      )}

      {/* Franja destacada: Orden del día vigente + Guardia de hoy */}
      {!tableroQ.isLoading && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="border-primary/35 bg-primary/5 lg:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge variant="default">
                  <Sparkles className="size-3.5" /> Orden del día vigente
                </Badge>
                {ordenHoy && (
                  <span className="text-sm font-medium text-muted-foreground">
                    N° {ordenHoy.numero}/{ordenHoy.anio} · {formatearFecha(ordenHoy.fecha)}
                  </span>
                )}
              </div>
              <CardTitle className="pt-1 text-lg sm:text-xl">
                {ordenHoy ? ordenHoy.titulo : "Sin orden del día activa para hoy"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ordenHoy ? (
                <>
                  <p className="line-clamp-3 text-base leading-relaxed text-foreground/90">
                    {ordenHoy.texto}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSeleccionada(ordenHoy)}>
                      <FileText /> Leer completa
                    </Button>
                    {ordenHoy.vigente_hasta && (
                      <span className="text-xs text-muted-foreground">
                        Vigente hasta {formatearFecha(ordenHoy.vigente_hasta)}
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Cuando Capitanía o Teniente 1° publique una orden del día aparecerá destacada aquí.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldCheck className="size-5 text-primary" /> Guardia nocturna de hoy
              </CardTitle>
              <CardDescription>
                {data?.guardia_hoy
                  ? `${formatearFecha(data.guardia_hoy.fecha)} · ${data.guardia_hoy.estado}`
                  : "Sin turno nocturno programado"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data?.guardia_hoy && data.guardia_hoy.dotacion.length > 0 ? (
                <ul className="space-y-1.5 text-sm">
                  {data.guardia_hoy.dotacion.map((g) => (
                    <li key={g.registro} className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium">
                        Reg. {g.registro} · {g.nombre}
                      </span>
                      {g.es_jefe && <Badge variant="secondary">Jefe</Badge>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Sin dotación asignada todavía para esta noche.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros grandes y búsqueda */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 sm:p-4">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Categorías del tablero">
          {ORDEN_FILTROS_TABLERO.map((f) => {
            const activo = filtro === f;
            const label = f === "todas" ? "Todas" : META_TIPO_TABLERO[f].etiquetaCorta;
            return (
              <Button
                key={f}
                variant={activo ? "default" : "outline"}
                size="sm"
                onClick={() => setFiltro(f)}
                className="min-h-11 px-3 text-sm"
              >
                {label}
                <span className="ml-1 rounded-full bg-background/20 px-1.5 text-xs">
                  {conteo[f] ?? 0}
                </span>
              </Button>
            );
          })}
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground" />
          <Input
            className="pl-9 text-base"
            placeholder="Buscar por título, número, lugar o tenida…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            aria-label="Buscar en el tablero"
          />
        </div>
      </div>

      {/* Cuerpo del Tablero */}
      {!tableroQ.isLoading && filtradas.length === 0 && (
        <EmptyState
          titulo="Sin publicaciones que coincidan"
          descripcion="Prueba quitando filtros o buscando otra palabra."
          icono={Megaphone}
        />
      )}

      {!tableroQ.isLoading && filtradas.length > 0 && sinFiltroTexto && (
        <div className="grid gap-4 lg:grid-cols-2">
          <BloqueTablero
            titulo="Próximas citaciones"
            items={citaciones}
            hoy={hoy}
            esOficial={esOficial}
            alAbrir={setSeleccionada}
            vacio="Sin citaciones registradas."
          />
          <BloqueTablero
            titulo="Órdenes de capitanía"
            items={capitanias}
            hoy={hoy}
            esOficial={esOficial}
            alAbrir={setSeleccionada}
            vacio="Sin órdenes de capitanía."
          />
          <BloqueTablero
            titulo="Circulares de compañía"
            items={circularesCia}
            hoy={hoy}
            esOficial={esOficial}
            alAbrir={setSeleccionada}
            vacio="Sin circulares de compañía."
          />
          <BloqueTablero
            titulo="Circulares CBL"
            items={circularesCbl}
            hoy={hoy}
            esOficial={esOficial}
            alAbrir={setSeleccionada}
            vacio="Sin circulares del Cuerpo."
          />
          {ordenesDiaPasadas.length > 0 && (
            <div className="lg:col-span-2">
              <BloqueTablero
                titulo="Órdenes del día anteriores"
                items={ordenesDiaPasadas}
                hoy={hoy}
                esOficial={esOficial}
                alAbrir={setSeleccionada}
                vacio=""
              />
            </div>
          )}
        </div>
      )}

      {!tableroQ.isLoading && filtradas.length > 0 && !sinFiltroTexto && (
        <div className="grid gap-3 md:grid-cols-2">
          {filtradas.map((p) => (
            <TarjetaPublicacion
              key={`${p.tipo}-${p.id}`}
              publicacion={p}
              hoy={hoy}
              esOficial={esOficial}
              alAbrir={setSeleccionada}
            />
          ))}
        </div>
      )}

      <DialogoPublicar
        abierto={publicarAbierto}
        onCambio={setPublicarAbierto}
        tiposPermitidos={tiposPublicables}
      />

      <DialogoDetalleComunicado
        publicacion={seleccionada}
        onCambio={(v) => !v && setSeleccionada(null)}
        esOficial={esOficial}
      />
    </section>
  );
}

function BloqueTablero({
  titulo,
  items,
  hoy,
  esOficial,
  alAbrir,
  vacio,
}: {
  titulo: string;
  items: PublicacionTablero[];
  hoy: string;
  esOficial: boolean;
  alAbrir: (p: PublicacionTablero) => void;
  vacio: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg">{titulo}</CardTitle>
          <Badge variant="outline">{items.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">{vacio}</p>
        )}
        {items.slice(0, 5).map((p) => (
          <TarjetaPublicacion
            key={`${p.tipo}-${p.id}`}
            publicacion={p}
            hoy={hoy}
            esOficial={esOficial}
            alAbrir={alAbrir}
            compacta
          />
        ))}
      </CardContent>
    </Card>
  );
}

function TarjetaPublicacion({
  publicacion: p,
  hoy,
  esOficial,
  alAbrir,
  compacta = false,
}: {
  publicacion: PublicacionTablero;
  hoy: string;
  esOficial: boolean;
  alAbrir: (p: PublicacionTablero) => void;
  compacta?: boolean;
}) {
  const meta = META_TIPO_TABLERO[p.tipo];
  const esProxima = citacionProxima(p, hoy);

  return (
    <button
      type="button"
      onClick={() => alAbrir(p)}
      className="flex w-full flex-col gap-2 rounded-lg border border-border bg-card p-3.5 text-left transition-colors hover:bg-accent"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {!compacta && <Badge variant={meta.badgeVariant}>{meta.etiqueta}</Badge>}
          <span className="text-xs font-semibold text-muted-foreground">
            N° {p.numero}/{p.anio}
          </span>
          {p.tipo === "citacion" && esProxima && (
            <Badge variant={p.obligatoria ? "peligro" : "exito"}>
              {p.obligatoria ? "Obligatoria" : "Próxima"}
            </Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground">{formatearFecha(p.fecha)}</span>
      </div>

      <p className="text-base font-semibold leading-snug">{p.titulo}</p>

      {p.tipo === "citacion" && p.fecha_evento && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1 font-medium text-foreground">
            <CalendarDays className="size-3.5 text-primary" />
            {formatearFecha(p.fecha_evento)} {p.hora_evento ? `${p.hora_evento.slice(0, 5)} h` : ""}
          </span>
          {p.lugar && <span>{p.lugar}</span>}
          {p.tenida && <Badge variant="secondary">{p.tenida}</Badge>}
        </div>
      )}

      {p.tipo !== "citacion" && p.resumen && (
        <p className="line-clamp-2 text-sm text-muted-foreground">{p.resumen}</p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {p.archivo_path && (
            <Badge variant="outline">
              <FileText className="mr-1 size-3" /> PDF
            </Badge>
          )}
          {esOficial && p.despacho_resumen && (
            <span className="text-xs text-muted-foreground">{p.despacho_resumen}</span>
          )}
        </div>
        <span className="text-xs font-semibold text-primary">Ver detalle →</span>
      </div>
    </button>
  );
}
