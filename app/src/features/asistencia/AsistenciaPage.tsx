import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ClipboardCheck, Eye, Plus, UserCheck } from "lucide-react";
import { db } from "@/lib/supabase";
import { mensajeError } from "@/lib/errores";
import { usePerfil } from "@/features/auth/sesion";
import { puedeGestionar } from "@/lib/permisos";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { EstadoBadge } from "@/components/common/StatusBadge";
import { ResponsiveList, type Columna } from "@/components/common/ResponsiveList";
import { EmptyState } from "@/components/common/EmptyState";
import { formatearFecha } from "@/lib/formato";
import { LibroAsistenciaTab } from "@/features/asistencia/LibroAsistenciaTab";
import { ParteDetalleDialog } from "@/features/asistencia/ParteDetalleDialog";
import type { Lista, TipoActo } from "@/types/tipos";

const ESTADOS = ["borrador", "cerrada", "enviada", "anulada"];

export function AsistenciaPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: perfil } = usePerfil();
  const roles = perfil?.roles ?? [];
  const puedeEscribir = puedeGestionar(roles, "asistencia", perfil?.modulos);
  const anioActual = new Date().getFullYear();

  const [anio, setAnio] = React.useState(String(anioActual));
  const [estado, setEstado] = React.useState("");
  const [nuevoAbierto, setNuevoAbierto] = React.useState(false);
  const [parteDetalleId, setParteDetalleId] = React.useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["listas", anio],
    queryFn: async () => {
      const { data, error } = await db.asistencia
        .from("lista")
        .select("*, tipo_acto:tipo_acto(*)")
        .eq("anio", Number(anio))
        .order("numero", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Lista[];
    },
  });

  const filas = (data ?? []).filter((l) => !estado || l.estado === estado);
  const columnas: Columna<Lista>[] = [
    {
      clave: "numero",
      titulo: "Parte / Lista",
      render: (l) => (
        <div>
          <p className="font-medium">
            N° {l.numero} · <Badge variant="outline">{l.tipo_acto_clave ?? "OTRO"}</Badge>
          </p>
          <p className="text-xs text-muted-foreground">{formatearFecha(l.fecha)}</p>
        </div>
      ),
    },
    {
      clave: "acto",
      titulo: "Acto y comentarios",
      render: (l) => (
        <div>
          <p>{l.tipo_acto?.descripcion ?? l.descripcion ?? "—"}</p>
          {l.comentarios && <p className="line-clamp-1 text-xs text-muted-foreground">{l.comentarios}</p>}
        </div>
      ),
    },
    { clave: "estado", titulo: "Estado", render: (l) => <EstadoBadge estado={l.estado} /> },
    {
      clave: "accion",
      titulo: "",
      render: (l) => (
        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => setParteDetalleId(l.id)}>
            <Eye /> Ver parte
          </Button>
          {puedeEscribir && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => void navigate({ to: "/asistencia/$listaId", params: { listaId: String(l.id) } })}
            >
              Pasar lista
            </Button>
          )}
        </div>
      ),
    },
  ];

  const tabPartes = (
    <>
      <Card className="mb-4">
        <CardContent className="flex flex-wrap gap-2 pt-4">
          <Select value={anio} onChange={(e) => setAnio(e.target.value)} aria-label="Año" className="w-28">
            {Array.from({ length: 5 }, (_, i) => anioActual + 1 - i).map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </Select>
          <Select value={estado} onChange={(e) => setEstado(e.target.value)} aria-label="Estado" className="w-44">
            <option value="">Todos los estados</option>
            {ESTADOS.map((e) => (
              <option key={e} value={e} className="capitalize">{e}</option>
            ))}
          </Select>
          <span className="ml-auto self-center text-sm text-muted-foreground">{filas.length} partes</span>
        </CardContent>
      </Card>

      <ResponsiveList
        filas={filas}
        columnas={columnas}
        claveFila={(l) => l.id}
        cargando={isLoading}
        alHacerClic={(l) => setParteDetalleId(l.id)}
        renderTarjeta={(l) => (
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">
                  Parte N° {l.numero} · {l.tipo_acto_clave ?? "OTRO"}
                </p>
                <p className="text-sm text-muted-foreground">{l.tipo_acto?.descripcion ?? l.descripcion}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatearFecha(l.fecha)}</p>
              </div>
              <EstadoBadge estado={l.estado} />
            </div>
            {l.comentarios && <p className="text-xs text-muted-foreground">{l.comentarios}</p>}
          </div>
        )}
        vacio={
          <EmptyState
            titulo="Sin partes registrados"
            descripcion="No hay listas para el año y estado seleccionados."
            icono={ClipboardCheck}
            accion={
              puedeEscribir ? (
                <Button variant="outline" onClick={() => setNuevoAbierto(true)}>
                  <Plus /> Nuevo parte
                </Button>
              ) : undefined
            }
          />
        }
      />

      <p className="mt-4 text-xs text-muted-foreground">
        El pase de lista del Ayudante funciona también sin conexión. Todos los bomberos pueden consultar partes, claves y el Libro anual.
      </p>
    </>
  );

  return (
    <div>
      <PageHeader
        titulo="Asistencia"
        descripcion="Partes del Ayudante, Libro de Asistencia 2026 y consulta de claves."
        acciones={
          <>
            <Button variant="outline" onClick={() => void navigate({ to: "/asistencia/mi" })}>
              <UserCheck /> Mi asistencia y claves
            </Button>
            {puedeEscribir && (
              <Button onClick={() => setNuevoAbierto(true)}>
                <Plus /> Nuevo parte
              </Button>
            )}
          </>
        }
      />

      <Tabs
        items={[
          { id: "partes", etiqueta: "Partes y listas", contenido: tabPartes },
          { id: "libro", etiqueta: "Libro de Asistencia", contenido: <LibroAsistenciaTab onAbrirParte={setParteDetalleId} /> },
        ]}
      />

      {puedeEscribir && (
        <NuevaListaDialog
          abierto={nuevoAbierto}
          onCambio={setNuevoAbierto}
          anio={Number(anio)}
          onCreada={async (id) => {
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: ["listas"] }),
              queryClient.invalidateQueries({ queryKey: ["libro-anual"] }),
            ]);
            await navigate({ to: "/asistencia/$listaId", params: { listaId: String(id) } });
          }}
        />
      )}

      <ParteDetalleDialog
        listaId={parteDetalleId}
        puedeEditar={puedeEscribir}
        onCerrar={() => setParteDetalleId(null)}
      />
    </div>
  );
}

function NuevaListaDialog({
  abierto,
  onCambio,
  anio,
  onCreada,
}: {
  abierto: boolean;
  onCambio: (v: boolean) => void;
  anio: number;
  onCreada: (id: number) => Promise<void>;
}) {
  const [numero, setNumero] = React.useState("");
  const [fecha, setFecha] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [tipo, setTipo] = React.useState("10-1");
  const [citacionId, setCitacionId] = React.useState("");
  const [descripcion, setDescripcion] = React.useState("");
  const [direccion, setDireccion] = React.useState("");
  const [horaInicio, setHoraInicio] = React.useState("");
  const [horaTermino, setHoraTermino] = React.useState("");
  const [comentarios, setComentarios] = React.useState("");
  const [esAbono, setEsAbono] = React.useState(false);
  const [justificacion, setJustificacion] = React.useState("");

  const { data: tipos } = useQuery({
    queryKey: ["tipos-acto"],
    queryFn: async () => {
      const { data, error } = await db.asistencia.from("tipo_acto").select("*").eq("activo", true).order("clave");
      if (error) throw error;
      return data as TipoActo[];
    },
    enabled: abierto,
  });

  const { data: citaciones } = useQuery({
    queryKey: ["citaciones-recientes"],
    queryFn: async () => {
      const { data, error } = await db.secretaria
        .from("citacion")
        .select("id, numero, anio, fecha_evento, hora_evento, lugar, tipo_acto_clave, titulo")
        .order("fecha_evento", { ascending: false })
        .limit(15);
      if (error) throw error;
      return (data ?? []) as Array<{
        id: number;
        numero: number;
        anio: number;
        fecha_evento: string;
        hora_evento: string;
        lugar: string;
        tipo_acto_clave: string | null;
        titulo: string;
      }>;
    },
    enabled: abierto,
  });

  const { data: ultima } = useQuery({
    queryKey: ["ultima-lista", anio],
    queryFn: async () => {
      const { data, error } = await db.asistencia
        .from("lista")
        .select("numero")
        .eq("anio", anio)
        .order("numero", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as { numero: number } | null;
    },
    enabled: abierto,
  });

  React.useEffect(() => {
    if (!abierto) return;
    setNumero(ultima ? String(ultima.numero + 1) : "1");
    setCitacionId("");
    setComentarios("");
    setDireccion("");
    setHoraInicio("");
    setHoraTermino("");
  }, [abierto, ultima]);

  function alElegirCitacion(idStr: string) {
    setCitacionId(idStr);
    const c = (citaciones ?? []).find((x) => String(x.id) === idStr);
    if (!c) return;
    setFecha(c.fecha_evento);
    if (c.tipo_acto_clave) setTipo(c.tipo_acto_clave);
    setDireccion(c.lugar);
    setHoraInicio(c.hora_evento.slice(0, 5));
    setDescripcion(c.titulo);
  }

  const crear = useMutation({
    mutationFn: async () => {
      const { data, error } = await db.asistencia
        .from("lista")
        .insert({
          compania_id: 1,
          anio: Number(fecha.slice(0, 4)) || anio,
          numero: Number(numero),
          fecha,
          tipo_acto_clave: tipo,
          citacion_id: citacionId ? Number(citacionId) : null,
          descripcion: descripcion.trim() || null,
          direccion: direccion.trim() || null,
          hora_inicio: horaInicio || null,
          hora_termino: horaTermino || null,
          comentarios: comentarios.trim() || null,
          es_abono: esAbono,
          abono_justificacion: esAbono ? justificacion : null,
          estado: "borrador",
        } as never)
        .select("id")
        .single();
      if (error) throw error;
      return (data as { id: number }).id;
    },
    onSuccess: async (id) => {
      toast.success("Parte y lista creados");
      onCambio(false);
      await onCreada(id);
    },
    onError: (e) => toast.error(mensajeError(e)),
  });

  return (
    <Dialog
      abierto={abierto}
      onCambio={onCambio}
      titulo="Nuevo parte de asistencia"
      descripcion="Registra la clave del acto, citación (si aplica), horario y comentarios antes de pasar lista."
      pie={
        <>
          <Button variant="outline" onClick={() => onCambio(false)}>Cancelar</Button>
          <Button
            onClick={() => crear.mutate()}
            disabled={crear.isPending || !numero || (esAbono && justificacion.trim().length < 3)}
          >
            Crear y pasar lista
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {(citaciones?.length ?? 0) > 0 && (
          <div className="space-y-1">
            <Label htmlFor="nl-cit">Vincular citación (opcional)</Label>
            <Select id="nl-cit" value={citacionId} onChange={(e) => alElegirCitacion(e.target.value)}>
              <option value="">Acto / emergencia sin citación previa</option>
              {citaciones?.map((c) => (
                <option key={c.id} value={c.id}>
                  N° {c.numero}/{c.anio} · {c.titulo} ({formatearFecha(c.fecha_evento)})
                </option>
              ))}
            </Select>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="nl-numero">N° de lista</Label>
            <Input id="nl-numero" type="number" value={numero} onChange={(e) => setNumero(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="nl-fecha">Fecha</Label>
            <Input id="nl-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="nl-tipo">Clave del acto</Label>
          <Select id="nl-tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            {tipos?.map((t) => (
              <option key={t.clave} value={t.clave}>{t.clave} · {t.descripcion}</option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-1 space-y-1">
            <Label htmlFor="nl-hi">Inicio</Label>
            <Input id="nl-hi" type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} />
          </div>
          <div className="col-span-1 space-y-1">
            <Label htmlFor="nl-ht">Término</Label>
            <Input id="nl-ht" type="time" value={horaTermino} onChange={(e) => setHoraTermino(e.target.value)} />
          </div>
          <div className="col-span-1 space-y-1">
            <Label htmlFor="nl-dir">Lugar</Label>
            <Input id="nl-dir" placeholder="Dirección / Cuartel" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="nl-desc">Descripción breve (opcional)</Label>
          <Input id="nl-desc" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="nl-com">Comentarios del parte (visible para la compañía)</Label>
          <Textarea id="nl-com" rows={3} placeholder="Novedades del acto, unidades concurrentes, observaciones…" value={comentarios} onChange={(e) => setComentarios(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="size-5 accent-[var(--primario)]" checked={esAbono} onChange={(e) => setEsAbono(e.target.checked)} />
          Es lista de abono
        </label>
        {esAbono && (
          <div className="space-y-1">
            <Label htmlFor="nl-just">Justificación del abono</Label>
            <Input id="nl-just" value={justificacion} onChange={(e) => setJustificacion(e.target.value)} />
          </div>
        )}
      </div>
    </Dialog>
  );
}
