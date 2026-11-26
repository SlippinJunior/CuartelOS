import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Bell, Check, ClipboardList, Package, PackagePlus, Search, Users, X,
} from "lucide-react";
import { db } from "@/lib/supabase";
import { mensajeError } from "@/lib/errores";
import { usePerfil } from "@/features/auth/sesion";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState } from "@/components/common/EmptyState";
import { EstadoBadge } from "@/components/common/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatearFecha } from "@/lib/formato";
import {
  agruparAsignaciones,
  cantidadLegible,
  describirArticulo,
  esGestorMaterial,
  puedeEditarBitacora,
  puedeVerInventarioBomberos,
  solicitudAbierta,
  solicitudCancelable,
} from "@/features/material/logica";
import {
  DialogoAsignacion, DialogoResolver, DialogoSolicitud, DialogoStock,
  type PersonaOpcion,
} from "@/features/material/dialogos";
import { VistaUnidades } from "@/features/material/VistaUnidades";
import { BitacoraUnidades } from "@/features/material/BitacoraUnidades";
import type {
  Articulo, AsignacionMaterial, EstadoSolicitud, PanolStock, SolicitudMaterial,
} from "@/types/tipos";

const ESTADOS: EstadoSolicitud[] = ["pendiente", "aprobada", "entregada", "rechazada", "cancelada"];

export function MaterialPage() {
  const { data: perfil } = usePerfil();
  const queryClient = useQueryClient();
  const roles = perfil?.roles ?? [];
  const modulos = perfil?.modulos;
  const esT2 = esGestorMaterial(roles, modulos);
  const esOficial = puedeVerInventarioBomberos(roles, modulos);
  const puedeBitacora = puedeEditarBitacora(roles, modulos);
  const miPersonaId = perfil?.persona?.id ?? null;

  const [busqueda, setBusqueda] = React.useState("");
  const [estado, setEstado] = React.useState("");
  const [stockDialogo, setStockDialogo] = React.useState<{ abierto: boolean; stock: PanolStock | null }>({ abierto: false, stock: null });
  const [solicitudDialogo, setSolicitudDialogo] = React.useState<PanolStock | null>(null);
  const [resolverDialogo, setResolverDialogo] = React.useState<SolicitudMaterial | null>(null);
  const [asignacionAbierta, setAsignacionAbierta] = React.useState(false);

  const invalidar = React.useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["material"] }),
      queryClient.invalidateQueries({ queryKey: ["panel-inicio"] }),
    ]);
  }, [queryClient]);

  const panol = useQuery({
    queryKey: ["material", "panol"],
    queryFn: async () => {
      const { data, error } = await db.material.from("v_panol").select("*").order("articulo");
      if (error) throw error;
      return (data ?? []) as PanolStock[];
    },
  });

  const articulos = useQuery({
    queryKey: ["material", "articulos"],
    queryFn: async () => {
      const { data, error } = await db.material.from("articulo").select("id, nombre, categoria_id, vida_util_meses, requiere_serie, unidad_medida").order("nombre");
      if (error) throw error;
      return (data ?? []) as Articulo[];
    },
  });

  const solicitudes = useQuery({
    queryKey: ["material", "solicitudes"],
    queryFn: async () => {
      const { data, error } = await db.material.from("v_solicitudes").select("*").order("creado_en", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SolicitudMaterial[];
    },
  });

  const asignaciones = useQuery({
    queryKey: ["material", "asignaciones"],
    enabled: esOficial,
    queryFn: async () => {
      const { data, error } = await db.material.from("v_asignaciones_persona").select("*").order("persona");
      if (error) throw error;
      return (data ?? []) as AsignacionMaterial[];
    },
  });

  const personas = useQuery({
    queryKey: ["material", "personas"],
    enabled: esOficial,
    queryFn: async () => {
      const { data, error } = await db.personal
        .from("persona")
        .select("id, registro, nombres, apellido_paterno, apellido_materno, rango")
        .eq("estado", "activo")
        .order("registro");
      if (error) throw error;
      return (data ?? []) as PersonaOpcion[];
    },
  });

  const notificaciones = useQuery({
    queryKey: ["material", "notificaciones"],
    enabled: Boolean(miPersonaId),
    queryFn: async () => {
      const { data, error } = await db.material
        .from("notificacion")
        .select("id, tipo, titulo, detalle, creado_en")
        .is("leida_en", null)
        .order("creado_en", { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data ?? []) as Array<{ id: number; tipo: string; titulo: string; detalle: string | null; creado_en: string }>;
    },
  });

  const marcarLeidas = useMutation({
    mutationFn: async () => {
      const ids = (notificaciones.data ?? []).map((n) => n.id);
      if (ids.length === 0) return;
      const { error } = await db.material
        .from("notificacion")
        .update({ leida_en: new Date().toISOString() })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: invalidar,
    onError: (e) => toast.error(mensajeError(e)),
  });

  const texto = busqueda.trim().toLowerCase();
  const panolFiltrado = (panol.data ?? []).filter(
    (s) => !texto || `${s.articulo} ${s.categoria ?? ""} ${s.talla ?? ""}`.toLowerCase().includes(texto),
  );
  const solicitudesFiltradas = (solicitudes.data ?? []).filter(
    (s) =>
      (!estado || s.estado === estado) &&
      (!texto || `${s.solicitante} ${s.articulo} ${s.motivo ?? ""}`.toLowerCase().includes(texto)),
  );
  const abiertas = (solicitudes.data ?? []).filter((s) => s.estado === "pendiente").length;

  const tabs = [
    {
      id: "panol",
      etiqueta: "Inventario Compañía",
      contenido: (
        <PanolTab
          filas={panolFiltrado}
          cargando={panol.isLoading}
          esT2={esT2}
          miPersonaId={miPersonaId}
          alSolicitar={setSolicitudDialogo}
          alEditar={(stock) => setStockDialogo({ abierto: true, stock })}
          onNuevo={() => setStockDialogo({ abierto: true, stock: null })}
        />
      ),
    },
    {
      id: "solicitudes",
      etiqueta: `Solicitudes${abiertas > 0 ? ` (${abiertas})` : ""}`,
      contenido: (
        <SolicitudesTab
          filas={solicitudesFiltradas}
          cargando={solicitudes.isLoading}
          esT2={esT2}
          miPersonaId={miPersonaId}
          notificaciones={notificaciones.data ?? []}
          alMarcarLeidas={() => marcarLeidas.mutate()}
          alResolver={setResolverDialogo}
          onCancelar={async (s) => {
            const { error } = await db.material.rpc("cancelar_solicitud", { p_solicitud_id: s.id });
            if (error) toast.error(mensajeError(error));
            else {
              toast.success("Solicitud cancelada");
              await invalidar();
            }
          }}
        />
      ),
    },
  ];

  if (esOficial) {
    tabs.push({
      id: "bomberos",
      etiqueta: "Bomberos",
      contenido: (
        <BomberosTab
          filas={asignaciones.data ?? []}
          cargando={asignaciones.isLoading}
          esT2={esT2}
          alAsignar={() => setAsignacionAbierta(true)}
        />
      ),
    });
    tabs.push({
      id: "bitacora",
      etiqueta: "Bitácora de Unidades",
      contenido: <BitacoraUnidades puedeEditar={puedeBitacora} />,
    });
    tabs.push({
      id: "unidades",
      etiqueta: "Unidades",
      contenido: <VistaUnidades />,
    });
  }

  return (
    <div>
      <PageHeader
        titulo="Material"
        descripcion="Inventario Compañía, solicitudes de los bomberos, EPP y bitácora de unidades."
        acciones={
          esT2 ? (
            <Button onClick={() => setStockDialogo({ abierto: true, stock: null })}>
              <PackagePlus /> Agregar al inventario
            </Button>
          ) : undefined
        }
      />

      <Card className="mb-4">
        <CardContent className="flex flex-wrap gap-2 pt-4">
          <div className="relative min-w-0 flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar artículo, persona o motivo"
              className="pl-9"
              aria-label="Buscar"
            />
          </div>
          <Select value={estado} onChange={(e) => setEstado(e.target.value)} aria-label="Estado" className="w-44">
            <option value="">Todos los estados</option>
            {ESTADOS.map((e) => (
              <option key={e} value={e} className="capitalize">{e}</option>
            ))}
          </Select>
          <span className="ml-auto self-center text-sm text-muted-foreground">
            {esT2 ? `${abiertas} solicitudes por resolver` : `${solicitudesFiltradas.length} solicitudes`}
          </span>
        </CardContent>
      </Card>

      <Tabs items={tabs} />

      <DialogoStock
        abierto={stockDialogo.abierto}
        stock={stockDialogo.stock}
        articulos={articulos.data ?? []}
        onCerrar={() => setStockDialogo({ abierto: false, stock: null })}
        onGuardado={invalidar}
      />
      <DialogoSolicitud
        stock={solicitudDialogo}
        miPersonaId={miPersonaId}
        onCerrar={() => setSolicitudDialogo(null)}
        onSolicitado={invalidar}
      />
      <DialogoResolver
        solicitud={resolverDialogo}
        onCerrar={() => setResolverDialogo(null)}
        onResuelto={invalidar}
      />
      <DialogoAsignacion
        abierto={asignacionAbierta}
        personas={personas.data ?? []}
        articulos={articulos.data ?? []}
        onCerrar={() => setAsignacionAbierta(false)}
        onCreada={invalidar}
      />
    </div>
  );
}

// ---------------------------------------------------------------------
// Pañol
// ---------------------------------------------------------------------
function PanolTab({
  filas, cargando, esT2, miPersonaId, alSolicitar, alEditar, onNuevo,
}: {
  filas: PanolStock[];
  cargando: boolean;
  esT2: boolean;
  miPersonaId: string | null;
  alSolicitar: (stock: PanolStock) => void;
  alEditar: (stock: PanolStock) => void;
  onNuevo: () => void;
}) {
  if (cargando) {
    return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-40 w-full" />)}</div>;
  }

  if (filas.length === 0) {
    return (
      <EmptyState
        titulo="Sin artículos en Inventario Compañía"
        descripcion={esT2 ? "Agrega el primer artículo para que los bomberos puedan solicitarlo." : "Aún no se han cargado existencias."}
        icono={Package}
        accion={esT2 ? <Button onClick={onNuevo}><PackagePlus /> Agregar artículo</Button> : undefined}
      />
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {filas.map((s) => (
        <Card key={s.id} className="flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-base leading-snug">{s.articulo}</CardTitle>
              {s.stock_bajo && <Badge variant="aviso">Reponer</Badge>}
            </div>
            <CardDescription>
              {s.categoria ?? "Sin categoría"}
              {s.talla ? ` · Talla ${s.talla}` : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto space-y-3 pt-0">
            <div className="flex items-end justify-between gap-2">
              <div>
                <p className="text-2xl font-semibold leading-none">{cantidadLegible(s.cantidad)}</p>
                <p className="mt-1 text-xs text-muted-foreground">disponibles · mínimo {cantidadLegible(s.minimo)}</p>
              </div>
              <Badge variant="outline">{s.ubicacion}</Badge>
            </div>
            {esT2 ? (
              <Button variant="outline" className="w-full" onClick={() => alEditar(s)}>
                Editar stock
              </Button>
            ) : (
              <Button className="w-full" onClick={() => alSolicitar(s)} disabled={!miPersonaId || s.cantidad <= 0}>
                <PackagePlus /> {s.cantidad > 0 ? "Solicitar" : "Sin stock"}
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------
// Solicitudes
// ---------------------------------------------------------------------
function SolicitudesTab({
  filas, cargando, esT2, miPersonaId, notificaciones, alMarcarLeidas, alResolver, onCancelar,
}: {
  filas: SolicitudMaterial[];
  cargando: boolean;
  esT2: boolean;
  miPersonaId: string | null;
  notificaciones: Array<{ id: number; tipo: string; titulo: string; detalle: string | null; creado_en: string }>;
  alMarcarLeidas: () => void;
  alResolver: (s: SolicitudMaterial) => void;
  onCancelar: (s: SolicitudMaterial) => Promise<void>;
}) {
  return (
    <div className="space-y-4">
      {notificaciones.length > 0 && (
        <Card className="border-primary/30">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="size-4 text-primary" /> Avisos de Inventario Compañía
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={alMarcarLeidas}>
              <Check /> Marcar leídas
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {notificaciones.map((n) => (
              <div key={n.id} className="rounded-md border border-border p-2 text-sm">
                <p className="font-medium">{n.titulo}</p>
                {n.detalle && <p className="text-xs text-muted-foreground">{n.detalle}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {cargando && <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>}

      {!cargando && filas.length === 0 && (
        <EmptyState
          titulo={esT2 ? "Sin solicitudes" : "Aún no has solicitado material"}
          descripcion={esT2 ? "Cuando un bombero pida algo al Inventario Compañía aparecerá aquí." : "Abre la pestaña Inventario Compañía y pide lo que necesites."}
          icono={ClipboardList}
        />
      )}

      {!cargando && filas.map((s) => {
        const propia = s.persona_id === miPersonaId;
        return (
          <Card key={s.id}>
            <CardContent className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{s.solicitante}</p>
                  <span className="text-xs text-muted-foreground">Registro {s.registro}</span>
                  <EstadoBadge estado={s.estado} />
                </div>
                <p className="text-sm">{describirArticulo(s.articulo, s.talla, s.cantidad)}</p>
                {s.motivo && <p className="text-xs text-muted-foreground">«{s.motivo}»</p>}
                <p className="text-xs text-muted-foreground">
                  Solicitada el {formatearFecha(s.creado_en.slice(0, 10))}
                  {s.resuelto_en ? ` · resuelta el ${formatearFecha(s.resuelto_en.slice(0, 10))}` : ""}
                </p>
                {s.respuesta && <p className="text-xs text-muted-foreground">Respuesta: {s.respuesta}</p>}
              </div>
              <div className="flex shrink-0 gap-2">
                {esT2 && solicitudAbierta(s.estado) && (
                  <Button onClick={() => alResolver(s)}>
                    <PackagePlus /> Resolver
                  </Button>
                )}
                {propia && solicitudCancelable(s.estado) && (
                  <Button variant="outline" onClick={() => void onCancelar(s)}>
                    <X /> Cancelar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------
// Inventario de los bomberos (EPP a cargo)
// ---------------------------------------------------------------------
function BomberosTab({
  filas, cargando, esT2, alAsignar,
}: {
  filas: AsignacionMaterial[];
  cargando: boolean;
  esT2: boolean;
  alAsignar: () => void;
}) {
  const grupos = React.useMemo(() => agruparAsignaciones(filas), [filas]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          EPP y vestuario a cargo de cada bombero. El Teniente 2° puede asignar y devolver.
        </p>
        {esT2 && (
          <Button onClick={alAsignar}>
            <Users /> Asignar EPP
          </Button>
        )}
      </div>

      {cargando && <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>}

      {!cargando && grupos.length === 0 && (
        <EmptyState titulo="Sin asignaciones" descripcion="Aún no hay EPP entregado a los bomberos." icono={Users} />
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        {grupos.map((g) => (
          <Card key={g.persona_id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{g.persona}</CardTitle>
              <CardDescription>Registro {g.registro} · {g.rango}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {g.articulos.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-2 rounded-md border border-border p-2 text-sm">
                  <span>{describirArticulo(a.articulo, a.talla, a.cantidad)}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {a.fecha_devolucion
                      ? `Devuelto ${formatearFecha(a.fecha_devolucion)}`
                      : a.fecha_entrega ? `Entregado ${formatearFecha(a.fecha_entrega)}` : "Sin fecha"}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
