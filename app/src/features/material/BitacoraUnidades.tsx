import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Calendar, Fuel, Gauge, Plus, Save, Wrench } from "lucide-react";
import { db } from "@/lib/supabase";
import { mensajeError } from "@/lib/errores";
import { usePerfil } from "@/features/auth/sesion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { formatearCLP, formatearFecha } from "@/lib/formato";
import { ETIQUETAS_BITACORA, etiquetaTipoBitacora, resumirBitacora } from "@/features/material/logica";
import type { BitacoraUnidad, TipoBitacoraUnidad, Unidad } from "@/types/tipos";

const TIPOS: TipoBitacoraUnidad[] = ["mantencion", "accidente", "revision", "combustible", "novedad"];

const VARIANTE_TIPO: Record<TipoBitacoraUnidad, "default" | "peligro" | "aviso" | "exito" | "apagado"> = {
  mantencion: "default",
  accidente: "peligro",
  revision: "exito",
  combustible: "aviso",
  novedad: "apagado",
};

export function BitacoraUnidades({ puedeEditar }: { puedeEditar: boolean }) {
  const queryClient = useQueryClient();
  const { data: perfil } = usePerfil();
  const [unidadFiltro, setUnidadFiltro] = React.useState("");
  const [tipoFiltro, setTipoFiltro] = React.useState("");
  const [abierto, setAbierto] = React.useState(false);

  const unidadesQ = useQuery({
    queryKey: ["material", "unidades"],
    queryFn: async () => {
      const { data, error } = await db.material.from("unidad").select("id, codigo, marca, modelo, km_actual, estado").order("codigo");
      if (error) throw error;
      return (data ?? []) as Unidad[];
    },
  });

  const bitacoraQ = useQuery({
    queryKey: ["material", "bitacora"],
    queryFn: async () => {
      const { data, error } = await db.material
        .from("bitacora_unidad")
        .select("*, unidad:unidad(codigo, marca, modelo), responsable:responsable_persona_id(nombres, apellido_paterno, registro)")
        .order("fecha", { ascending: false })
        .order("id", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as BitacoraUnidad[];
    },
  });

  const filtradas = (bitacoraQ.data ?? []).filter(
    (b) =>
      (!unidadFiltro || String(b.unidad_id) === unidadFiltro) &&
      (!tipoFiltro || b.tipo === tipoFiltro),
  );
  const resumen = resumirBitacora(filtradas);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{resumen.total}</p>
            <p className="text-xs text-muted-foreground">Registros visibles</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{resumen.mantenciones}</p>
            <p className="text-xs text-muted-foreground">Mantenciones</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-peligro">{resumen.accidentes}</p>
            <p className="text-xs text-muted-foreground">Accidentes / incidentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{formatearCLP(resumen.costoTotal)}</p>
            <p className="text-xs text-muted-foreground">Costo acumulado</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="grid gap-2.5 sm:flex sm:flex-wrap sm:items-center">
          <Select value={unidadFiltro} onChange={(e) => setUnidadFiltro(e.target.value)} aria-label="Filtrar por unidad" className="w-full sm:w-44">
            <option value="">Todas las unidades</option>
            {(unidadesQ.data ?? []).map((u) => (
              <option key={u.id} value={u.id}>{u.codigo} · {u.marca ?? "Unidad"}</option>
            ))}
          </Select>
          <Select value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)} aria-label="Filtrar por tipo" className="w-full sm:w-44">
            <option value="">Todos los tipos</option>
            {TIPOS.map((t) => (
              <option key={t} value={t}>{ETIQUETAS_BITACORA[t]}</option>
            ))}
          </Select>
          {puedeEditar && (
            <Button className="w-full sm:ml-auto sm:w-auto" onClick={() => setAbierto(true)}>
              <Plus /> Registrar evento
            </Button>
          )}
        </CardContent>
      </Card>

      {bitacoraQ.isLoading && <Skeleton className="h-36 w-full" />}

      {!bitacoraQ.isLoading && filtradas.length === 0 && (
        <EmptyState
          titulo="Sin registros en la bitácora"
          descripcion="Registra mantenciones, accidentes, revisiones o cargas de combustible para cada unidad."
          icono={Wrench}
          accion={puedeEditar ? <Button onClick={() => setAbierto(true)}><Plus /> Primer registro</Button> : undefined}
        />
      )}

      <div className="space-y-3">
        {filtradas.map((b) => (
          <Card key={b.id}>
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{b.unidad?.codigo ?? `Unidad #${b.unidad_id}`}</Badge>
                  <Badge variant={VARIANTE_TIPO[b.tipo] ?? "apagado"}>
                    {b.tipo === "accidente" && <AlertTriangle className="mr-1 size-3" />}
                    {b.tipo === "combustible" && <Fuel className="mr-1 size-3" />}
                    {etiquetaTipoBitacora(b.tipo)}
                  </Badge>
                  <CardTitle className="text-base">{b.titulo || etiquetaTipoBitacora(b.tipo)}</CardTitle>
                </div>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="size-3.5" /> {formatearFecha(b.fecha)}
                </span>
              </div>
              {b.unidad?.marca && (
                <CardDescription>{b.unidad.marca} {b.unidad.modelo ?? ""}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-2 pt-0 text-sm">
              {b.novedades && <p className="whitespace-pre-line">{b.novedades}</p>}
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                {b.km != null && (
                  <span className="inline-flex items-center gap-1">
                    <Gauge className="size-3.5" /> {b.km.toLocaleString("es-CL")} km
                  </span>
                )}
                {b.horas_bomba != null && <span>Horas bomba: {b.horas_bomba}</span>}
                {b.costo != null && <span className="font-medium text-foreground">Costo: {formatearCLP(b.costo)}</span>}
                {b.proxima_fecha && <span>Próxima revisión: {formatearFecha(b.proxima_fecha)}</span>}
                {b.estado_unidad_post && <span>Estado post-evento: {b.estado_unidad_post}</span>}
                {b.responsable && (
                  <span>
                    Responsable: {b.responsable.nombres} {b.responsable.apellido_paterno} (Reg. {b.responsable.registro})
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <DialogoBitacora
        abierto={abierto}
        unidades={unidadesQ.data ?? []}
        miPersonaId={perfil?.persona?.id ?? null}
        onCerrar={() => setAbierto(false)}
        onGuardado={async () => {
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ["material"] }),
            queryClient.invalidateQueries({ queryKey: ["estadisticas"] }),
          ]);
        }}
      />
    </div>
  );
}

function DialogoBitacora({
  abierto,
  unidades,
  miPersonaId,
  onCerrar,
  onGuardado,
}: {
  abierto: boolean;
  unidades: Unidad[];
  miPersonaId: string | null;
  onCerrar: () => void;
  onGuardado: () => Promise<void>;
}) {
  const [unidadId, setUnidadId] = React.useState("");
  const [fecha, setFecha] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [tipo, setTipo] = React.useState<TipoBitacoraUnidad>("mantencion");
  const [titulo, setTitulo] = React.useState("");
  const [km, setKm] = React.useState("");
  const [horasBomba, setHorasBomba] = React.useState("");
  const [costo, setCosto] = React.useState("");
  const [proximaFecha, setProximaFecha] = React.useState("");
  const [estadoPost, setEstadoPost] = React.useState("");
  const [novedades, setNovedades] = React.useState("");

  React.useEffect(() => {
    if (!abierto) return;
    if (!unidadId && unidades.length > 0) setUnidadId(String(unidades[0].id));
  }, [abierto, unidadId, unidades]);

  const guardar = useMutation({
    mutationFn: async () => {
      const { error } = await db.material.from("bitacora_unidad").insert({
        unidad_id: Number(unidadId),
        fecha,
        tipo,
        titulo: titulo.trim() || etiquetaTipoBitacora(tipo),
        km: km !== "" ? Number(km) : null,
        horas_bomba: horasBomba !== "" ? Number(horasBomba) : null,
        costo: costo !== "" ? Number(costo) : null,
        proxima_fecha: proximaFecha || null,
        estado_unidad_post: estadoPost || null,
        novedades: novedades.trim() || null,
        responsable_persona_id: miPersonaId,
      } as never);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Evento registrado en la bitácora");
      setTitulo("");
      setKm("");
      setHorasBomba("");
      setCosto("");
      setProximaFecha("");
      setEstadoPost("");
      setNovedades("");
      await onGuardado();
      onCerrar();
    },
    onError: (e) => toast.error(mensajeError(e)),
  });

  return (
    <Dialog
      abierto={abierto}
      onCambio={(v) => !v && onCerrar()}
      titulo="Registrar en Bitácora de Unidades"
      descripcion="Mantenciones, accidentes, revisiones técnicas, combustible o novedades operativas."
      pie={
        <>
          <Button variant="outline" onClick={onCerrar}>Cancelar</Button>
          <Button onClick={() => guardar.mutate()} disabled={!unidadId || !titulo.trim() || guardar.isPending}>
            <Save /> Guardar registro
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="bit-unidad">Unidad *</Label>
            <Select id="bit-unidad" value={unidadId} onChange={(e) => setUnidadId(e.target.value)}>
              {unidades.map((u) => (
                <option key={u.id} value={u.id}>{u.codigo} · {u.marca ?? ""}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="bit-tipo">Tipo *</Label>
            <Select id="bit-tipo" value={tipo} onChange={(e) => setTipo(e.target.value as TipoBitacoraUnidad)}>
              {TIPOS.map((t) => (
                <option key={t} value={t}>{ETIQUETAS_BITACORA[t]}</option>
              ))}
            </Select>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="bit-fecha">Fecha</Label>
            <Input id="bit-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="bit-titulo">Título / resumen *</Label>
            <Input id="bit-titulo" placeholder="Ej.: Cambio de frenos o choque menor" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor="bit-km">Kilometraje</Label>
            <Input id="bit-km" type="number" value={km} onChange={(e) => setKm(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="bit-horas">Horas bomba</Label>
            <Input id="bit-horas" type="number" step="0.1" value={horasBomba} onChange={(e) => setHorasBomba(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="bit-costo">Costo (CLP)</Label>
            <Input id="bit-costo" type="number" value={costo} onChange={(e) => setCosto(e.target.value)} />
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="bit-prox">Próxima mantención</Label>
            <Input id="bit-prox" type="date" value={proximaFecha} onChange={(e) => setProximaFecha(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="bit-estado">Actualizar estado del carro</Label>
            <Select id="bit-estado" value={estadoPost} onChange={(e) => setEstadoPost(e.target.value)}>
              <option value="">Sin cambio</option>
              <option value="operativa">Operativa</option>
              <option value="mantencion">En mantención</option>
              <option value="fuera_servicio">Fuera de servicio</option>
            </Select>
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="bit-nov">Detalle / observaciones</Label>
          <Textarea id="bit-nov" rows={3} value={novedades} onChange={(e) => setNovedades(e.target.value)} />
        </div>
      </div>
    </Dialog>
  );
}
