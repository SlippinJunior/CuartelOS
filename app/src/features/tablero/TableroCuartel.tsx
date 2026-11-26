import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileText,
  Megaphone,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { usePerfil } from "@/features/auth/sesion";
import { puedePublicarTablero, tiposPublicablesPor } from "@/lib/permisos";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { formatearFecha } from "@/lib/formato";
import {
  citacionProxima,
  combinarCirculares,
  contarPorTipo,
  filtrarPublicaciones,
  META_TIPO_TABLERO,
  ORDEN_FILTROS_TABLERO,
  ordenDiaVigente,
  paginarPublicaciones,
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

  if (modoCuartel) {
    return (
      <>
        <VistaKioscoCuartel
          data={data}
          cargando={tableroQ.isLoading}
          actualizando={tableroQ.isFetching}
          hoy={hoy}
          ordenHoy={ordenHoy}
          citaciones={citaciones}
          capitanias={capitanias}
          circulares={combinarCirculares(publicaciones)}
          modalAbierto={Boolean(seleccionada)}
          alActualizar={() => void tableroQ.refetch()}
          alAbrir={setSeleccionada}
        />
        <DialogoDetalleComunicado
          publicacion={seleccionada}
          onCambio={(v) => !v && setSeleccionada(null)}
          esOficial={esOficial}
        />
      </>
    );
  }

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
        <div
          className="flex gap-1.5 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0"
          role="tablist"
          aria-label="Categorías del tablero"
        >
          {ORDEN_FILTROS_TABLERO.map((f) => {
            const activo = filtro === f;
            const label = f === "todas" ? "Todas" : META_TIPO_TABLERO[f].etiquetaCorta;
            return (
              <Button
                key={f}
                variant={activo ? "default" : "outline"}
                size="sm"
                onClick={() => setFiltro(f)}
                className="min-h-11 shrink-0 px-3 text-sm"
              >
                {label}
                <span className="ml-1 rounded-full bg-background/20 px-1.5 text-xs">
                  {conteo[f] ?? 0}
                </span>
              </Button>
            );
          })}
        </div>
        <SearchInput
          className="text-base"
          placeholder="Buscar por título, número, lugar o tenida…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          onLimpiar={() => setBusqueda("")}
          aria-label="Buscar en el tablero"
        />
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

/**
 * Vista de pantalla de cuartel diseñada para monitores y televisores:
 * en pantallas >= 1024px ajusta todo el contenido al viewport sin scroll.
 */
function VistaKioscoCuartel({
  data,
  cargando,
  actualizando,
  hoy,
  ordenHoy,
  citaciones,
  capitanias,
  circulares,
  modalAbierto,
  alActualizar,
  alAbrir,
}: {
  data?: TableroCuartelData;
  cargando: boolean;
  actualizando: boolean;
  hoy: string;
  ordenHoy: PublicacionTablero | null;
  citaciones: PublicacionTablero[];
  capitanias: PublicacionTablero[];
  circulares: PublicacionTablero[];
  modalAbierto: boolean;
  alActualizar: () => void;
  alAbrir: (p: PublicacionTablero) => void;
}) {
  if (cargando) {
    return (
      <div className="grid gap-3 lg:h-full lg:grid-rows-[0.4fr_0.6fr]">
        <Skeleton className="h-44 w-full lg:h-full" />
        <div className="grid gap-3 lg:grid-cols-3">
          <Skeleton className="h-56 w-full lg:h-full" />
          <Skeleton className="h-56 w-full lg:h-full" />
          <Skeleton className="h-56 w-full lg:h-full" />
        </div>
      </div>
    );
  }

  const dotacion = data?.guardia_hoy?.dotacion ?? [];

  return (
    <section
      aria-label="Tablero de Cuartel en pantalla completa"
      className="flex flex-col gap-3 [container-type:inline-size] lg:h-full lg:min-h-0 lg:overflow-hidden"
    >
      {/* Barra sutil de estado / feriado y actualización manual */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-foreground">
            Resumen operativo en tiempo real
          </span>
          {data?.feriado_hoy && (
            <Badge variant="aviso">Feriado: {data.feriado_hoy}</Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 min-h-8 px-2.5 text-xs"
          onClick={alActualizar}
          disabled={actualizando}
        >
          <RefreshCw className={actualizando ? "animate-spin" : ""} />
          Actualizar
        </Button>
      </div>

      {/* Grilla 2 franjas proporcionales (40% superior / 60% inferior en monitor/TV) */}
      <div className="grid min-h-0 flex-1 gap-3 lg:grid-rows-[minmax(0,0.40fr)_minmax(0,0.60fr)]">
        {/* Franja superior: Orden del día vigente + Guardia nocturna */}
        <div className="grid min-h-0 gap-3 lg:grid-cols-12">
          <Card className="flex min-h-0 flex-col overflow-hidden border-primary/40 bg-primary/5 lg:col-span-8">
            <CardHeader className="shrink-0 pb-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge variant="default">
                  <Sparkles className="size-3.5" aria-hidden="true" /> Orden del día vigente
                </Badge>
                {ordenHoy && (
                  <span className="text-xs font-medium text-muted-foreground sm:text-sm">
                    N° {ordenHoy.numero}/{ordenHoy.anio} · {formatearFecha(ordenHoy.fecha)}
                    {ordenHoy.vigente_hasta ? ` · Hasta ${formatearFecha(ordenHoy.vigente_hasta)}` : ""}
                  </span>
                )}
              </div>
              <CardTitle className="line-clamp-2 pt-1 text-[clamp(1.05rem,1.4cqi,1.65rem)] font-bold leading-snug">
                {ordenHoy ? ordenHoy.titulo : "Sin orden del día activa para hoy"}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex min-h-0 flex-1 flex-col justify-between gap-2 overflow-hidden">
              {ordenHoy ? (
                <>
                  <p className="line-clamp-4 text-[clamp(0.9rem,1.05cqi,1.25rem)] leading-relaxed text-foreground/90 xl:line-clamp-5">
                    {ordenHoy.texto}
                  </p>
                  <div className="shrink-0">
                    <Button variant="outline" size="sm" onClick={() => alAbrir(ordenHoy)}>
                      <FileText /> Leer completa
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Cuando Capitanía o Teniente 1° publique una orden del día aparecerá destacada aquí.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="flex min-h-0 flex-col overflow-hidden lg:col-span-4">
            <CardHeader className="shrink-0 pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-[clamp(1rem,1.15cqi,1.35rem)]">
                  <ShieldCheck className="size-5 shrink-0 text-primary" aria-hidden="true" />
                  Guardia nocturna de hoy
                </CardTitle>
                <Badge variant={dotacion.length > 0 ? "exito" : "outline"}>
                  {dotacion.length}
                </Badge>
              </div>
              <CardDescription>
                {data?.guardia_hoy
                  ? `${formatearFecha(data.guardia_hoy.fecha)} · ${data.guardia_hoy.estado}`
                  : "Sin turno nocturno programado"}
              </CardDescription>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 overflow-hidden">
              {dotacion.length > 0 ? (
                <ul
                  className={
                    dotacion.length > 6
                      ? "grid grid-cols-1 gap-x-3 gap-y-1 text-[clamp(0.8rem,0.9cqi,1.05rem)] xl:grid-cols-2"
                      : "space-y-1.5 text-[clamp(0.85rem,0.95cqi,1.1rem)]"
                  }
                >
                  {dotacion.slice(0, 12).map((g) => (
                    <li key={g.registro} className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium">
                        <span className="mr-1.5 font-mono text-xs text-muted-foreground">{g.registro}</span>
                        {g.nombre}
                      </span>
                      {g.es_jefe && <Badge variant="secondary" className="shrink-0">Jefe</Badge>}
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

        {/* Franja inferior: 3 columnas con paginación automática */}
        <div className="grid min-h-0 gap-3 lg:grid-cols-3">
          <ColumnaKiosco
            titulo="Próximas citaciones"
            items={citaciones}
            hoy={hoy}
            modalAbierto={modalAbierto}
            vacio="Sin citaciones registradas."
            alAbrir={alAbrir}
          />
          <ColumnaKiosco
            titulo="Órdenes de capitanía"
            items={capitanias}
            hoy={hoy}
            modalAbierto={modalAbierto}
            vacio="Sin órdenes de capitanía."
            alAbrir={alAbrir}
          />
          <ColumnaKiosco
            titulo="Circulares (Compañía y CBL)"
            items={circulares}
            hoy={hoy}
            modalAbierto={modalAbierto}
            vacio="Sin circulares vigentes."
            mostrarTipo
            alAbrir={alAbrir}
          />
        </div>
      </div>
    </section>
  );
}

function ColumnaKiosco({
  titulo,
  items,
  hoy,
  modalAbierto,
  vacio,
  mostrarTipo = false,
  alAbrir,
}: {
  titulo: string;
  items: PublicacionTablero[];
  hoy: string;
  modalAbierto: boolean;
  vacio: string;
  mostrarTipo?: boolean;
  alAbrir: (p: PublicacionTablero) => void;
}) {
  const [pagina, setPagina] = React.useState(0);
  const [enPausa, setEnPausa] = React.useState(false);

  const { visibles, totalPaginas, paginaActual } = React.useMemo(
    () => paginarPublicaciones(items, pagina, 3),
    [items, pagina],
  );

  React.useEffect(() => {
    if (totalPaginas <= 1 || enPausa || modalAbierto) return;
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const id = window.setInterval(() => {
      setPagina((p) => (p + 1) % totalPaginas);
    }, 15_000);
    return () => window.clearInterval(id);
  }, [totalPaginas, enPausa, modalAbierto]);

  return (
    <Card
      className="flex min-h-0 flex-col overflow-hidden"
      onMouseEnter={() => setEnPausa(true)}
      onMouseLeave={() => setEnPausa(false)}
    >
      <CardHeader className="shrink-0 pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="truncate text-[clamp(0.95rem,1.1cqi,1.25rem)]">{titulo}</CardTitle>
          <div className="flex shrink-0 items-center gap-1">
            {totalPaginas > 1 && (
              <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 min-h-7"
                  aria-label={`Página anterior de ${titulo}`}
                  onClick={() => setPagina((p) => (p - 1 + totalPaginas) % totalPaginas)}
                >
                  <ChevronLeft className="size-3.5" />
                </Button>
                <span className="tabular-nums px-1 font-medium">
                  {paginaActual + 1}/{totalPaginas}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 min-h-7"
                  aria-label={`Siguiente página de ${titulo}`}
                  onClick={() => setPagina((p) => (p + 1) % totalPaginas)}
                >
                  <ChevronRight className="size-3.5" />
                </Button>
              </div>
            )}
            <Badge variant="outline">{items.length}</Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="min-h-0 flex-1 overflow-hidden">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{vacio}</p>
        ) : (
          <div className="grid h-full min-h-0 gap-2 lg:grid-rows-3">
            {visibles.map((p) => {
              const esProxima = citacionProxima(p, hoy);
              return (
                <button
                  key={`${p.tipo}-${p.id}`}
                  type="button"
                  onClick={() => alAbrir(p)}
                  className="flex min-h-0 w-full flex-col justify-between gap-1 overflow-hidden rounded-lg border border-border bg-card p-2.5 text-left transition-colors hover:bg-accent xl:p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 flex-wrap items-center gap-1">
                      {mostrarTipo && (
                        <Badge variant={p.tipo === "circular_cbl" ? "secondary" : "outline"} className="text-[10px]">
                          {p.tipo === "circular_cbl" ? "CBL" : "Compañía"}
                        </Badge>
                      )}
                      <span className="text-[11px] font-semibold text-muted-foreground">
                        N° {p.numero}/{p.anio}
                      </span>
                      {p.tipo === "citacion" && esProxima && (
                        <Badge variant={p.obligatoria ? "peligro" : "exito"} className="text-[10px]">
                          {p.obligatoria ? "Obligatoria" : "Próxima"}
                        </Badge>
                      )}
                    </div>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {formatearFecha(p.fecha)}
                    </span>
                  </div>

                  <p className="line-clamp-1 text-[clamp(0.85rem,0.95cqi,1.05rem)] font-semibold leading-snug xl:line-clamp-2">
                    {p.titulo}
                  </p>

                  {p.tipo === "citacion" && p.fecha_evento ? (
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1 font-medium text-foreground">
                        <CalendarDays className="size-3 text-primary" aria-hidden="true" />
                        {formatearFecha(p.fecha_evento)} {p.hora_evento ? `${p.hora_evento.slice(0, 5)} h` : ""}
                      </span>
                      {p.lugar && <span className="truncate">{p.lugar}</span>}
                      {p.tenida && <Badge variant="secondary" className="text-[10px]">{p.tenida}</Badge>}
                    </div>
                  ) : (
                    p.resumen && (
                      <p className="line-clamp-1 text-xs text-muted-foreground">{p.resumen}</p>
                    )
                  )}
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
