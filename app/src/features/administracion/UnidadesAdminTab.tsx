import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus, Save, Truck } from "lucide-react";
import { db } from "@/lib/supabase";
import { mensajeError } from "@/lib/errores";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import type { Persona, Unidad } from "@/types/tipos";

const ESTADOS_UNIDAD = [
  { id: "operativa", etiqueta: "Operativa", variante: "exito" as const },
  { id: "mantencion", etiqueta: "En mantención", variante: "aviso" as const },
  { id: "fuera_servicio", etiqueta: "Fuera de servicio", variante: "peligro" as const },
  { id: "baja", etiqueta: "De baja", variante: "apagado" as const },
];

export function UnidadesAdminTab({ puedeGestionar }: { puedeGestionar: boolean }) {
  const queryClient = useQueryClient();
  const [dialogo, setDialogo] = React.useState<{ abierto: boolean; unidad: Unidad | null }>({
    abierto: false,
    unidad: null,
  });

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

  const tiposQ = useQuery({
    queryKey: ["material", "tipos-unidad"],
    queryFn: async () => {
      const { data, error } = await db.material.from("tipo_unidad").select("*").order("id");
      if (error) throw error;
      return (data ?? []) as Array<{ id: number; codigo: string; nombre: string }>;
    },
  });

  const personasQ = useQuery({
    queryKey: ["personal", "activos-corto"],
    queryFn: async () => {
      const { data, error } = await db.personal
        .from("persona")
        .select("id, registro, nombres, apellido_paterno")
        .eq("estado", "activo")
        .order("registro");
      if (error) throw error;
      return (data ?? []) as Persona[];
    },
  });

  const invalidar = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["material", "unidades"] }),
      queryClient.invalidateQueries({ queryKey: ["estadisticas"] }),
    ]);
  };

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2">
          <Truck className="size-5 text-primary" /> Unidades de Material Mayor
        </CardTitle>
        {puedeGestionar && (
          <Button onClick={() => setDialogo({ abierto: true, unidad: null })}>
            <Plus /> Nueva unidad
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {unidadesQ.isLoading && <Skeleton className="h-32 w-full" />}

        {!unidadesQ.isLoading && (unidadesQ.data ?? []).length === 0 && (
          <EmptyState
            titulo="Sin unidades registradas"
            descripcion="Agrega las unidades de la compañía para habilitar su inventario y bitácora."
            icono={Truck}
          />
        )}

        {(unidadesQ.data ?? []).map((u) => {
          const est = ESTADOS_UNIDAD.find((e) => e.id === u.estado) ?? ESTADOS_UNIDAD[0];
          return (
            <div
              key={u.id}
              className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-base font-bold">{u.codigo}</p>
                  <Badge variant={est.variante}>{est.etiqueta}</Badge>
                  {u.tipo_unidad?.nombre && <Badge variant="outline">{u.tipo_unidad.nombre}</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">
                  {[u.marca, u.modelo, u.anio ? `(${u.anio})` : null].filter(Boolean).join(" ") || "Sin detalle de marca/modelo"}
                  {u.patente ? ` · Patente ${u.patente}` : ""}
                  {u.km_actual != null ? ` · ${u.km_actual.toLocaleString("es-CL")} km` : ""}
                </p>
              </div>
              {puedeGestionar && (
                <Button variant="outline" size="sm" onClick={() => setDialogo({ abierto: true, unidad: u })}>
                  <Pencil /> Editar
                </Button>
              )}
            </div>
          );
        })}
      </CardContent>

      <UnidadDialog
        abierto={dialogo.abierto}
        unidad={dialogo.unidad}
        tipos={tiposQ.data ?? []}
        personas={personasQ.data ?? []}
        onCerrar={() => setDialogo({ abierto: false, unidad: null })}
        onGuardado={invalidar}
      />
    </Card>
  );
}

function UnidadDialog({
  abierto,
  unidad,
  tipos,
  personas,
  onCerrar,
  onGuardado,
}: {
  abierto: boolean;
  unidad: Unidad | null;
  tipos: Array<{ id: number; codigo: string; nombre: string }>;
  personas: Persona[];
  onCerrar: () => void;
  onGuardado: () => Promise<void>;
}) {
  const [codigo, setCodigo] = React.useState("");
  const [tipoId, setTipoId] = React.useState("");
  const [patente, setPatente] = React.useState("");
  const [marca, setMarca] = React.useState("");
  const [modelo, setModelo] = React.useState("");
  const [anio, setAnio] = React.useState("");
  const [transmision, setTransmision] = React.useState("");
  const [kmActual, setKmActual] = React.useState("");
  const [estado, setEstado] = React.useState("operativa");
  const [responsableId, setResponsableId] = React.useState("");

  React.useEffect(() => {
    if (!abierto) return;
    setCodigo(unidad?.codigo ?? "");
    setTipoId(unidad?.tipo_unidad_id ? String(unidad.tipo_unidad_id) : "");
    setPatente(unidad?.patente ?? "");
    setMarca(unidad?.marca ?? "");
    setModelo(unidad?.modelo ?? "");
    setAnio(unidad?.anio ? String(unidad.anio) : "");
    setTransmision(unidad?.transmision ?? "");
    setKmActual(unidad?.km_actual != null ? String(unidad.km_actual) : "");
    setEstado(unidad?.estado ?? "operativa");
    setResponsableId(unidad?.responsable_persona_id ?? "");
  }, [abierto, unidad]);

  const guardar = useMutation({
    mutationFn: async () => {
      const payload = {
        codigo: codigo.trim().toUpperCase(),
        tipo_unidad_id: tipoId ? Number(tipoId) : null,
        patente: patente.trim().toUpperCase() || null,
        marca: marca.trim() || null,
        modelo: modelo.trim() || null,
        anio: anio ? Number(anio) : null,
        transmision: transmision.trim() || null,
        km_actual: kmActual !== "" ? Number(kmActual) : null,
        estado,
        responsable_persona_id: responsableId || null,
      };
      if (unidad) {
        const { error } = await db.material.from("unidad").update(payload as never).eq("id", unidad.id);
        if (error) throw error;
      } else {
        const { error } = await db.material.from("unidad").insert(payload as never);
        if (error) throw error;
      }
    },
    onSuccess: async () => {
      toast.success(unidad ? "Unidad actualizada" : "Unidad creada");
      await onGuardado();
      onCerrar();
    },
    onError: (e) => toast.error(mensajeError(e)),
  });

  return (
    <Dialog
      abierto={abierto}
      onCambio={(v) => !v && onCerrar()}
      titulo={unidad ? `Editar unidad ${unidad.codigo}` : "Nueva unidad"}
      descripcion="Ficha técnica y estado operativo del carro."
      pie={
        <>
          <Button variant="outline" onClick={onCerrar}>Cancelar</Button>
          <Button onClick={() => guardar.mutate()} disabled={!codigo.trim() || guardar.isPending}>
            <Save /> Guardar unidad
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="un-codigo">Código *</Label>
            <Input id="un-codigo" placeholder="M-21, B-2, R-22" value={codigo} onChange={(e) => setCodigo(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="un-tipo">Tipo</Label>
            <Select id="un-tipo" value={tipoId} onChange={(e) => setTipoId(e.target.value)}>
              <option value="">Seleccionar…</option>
              {tipos.map((t) => (
                <option key={t.id} value={t.id}>{t.nombre}</option>
              ))}
            </Select>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="un-patente">Patente</Label>
            <Input id="un-patente" value={patente} onChange={(e) => setPatente(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="un-estado">Estado</Label>
            <Select id="un-estado" value={estado} onChange={(e) => setEstado(e.target.value)}>
              {ESTADOS_UNIDAD.map((e) => (
                <option key={e.id} value={e.id}>{e.etiqueta}</option>
              ))}
            </Select>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor="un-marca">Marca</Label>
            <Input id="un-marca" value={marca} onChange={(e) => setMarca(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="un-modelo">Modelo</Label>
            <Input id="un-modelo" value={modelo} onChange={(e) => setModelo(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="un-anio">Año</Label>
            <Input id="un-anio" type="number" value={anio} onChange={(e) => setAnio(e.target.value)} />
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="un-km">Kilometraje actual</Label>
            <Input id="un-km" type="number" value={kmActual} onChange={(e) => setKmActual(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="un-trans">Transmisión</Label>
            <Input id="un-trans" placeholder="Automática / Manual" value={transmision} onChange={(e) => setTransmision(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="un-resp">Oficial / Maquinista responsable</Label>
          <Select id="un-resp" value={responsableId} onChange={(e) => setResponsableId(e.target.value)}>
            <option value="">Sin asignar</option>
            {personas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.registro} · {p.nombres} {p.apellido_paterno}
              </option>
            ))}
          </Select>
        </div>
      </div>
    </Dialog>
  );
}
