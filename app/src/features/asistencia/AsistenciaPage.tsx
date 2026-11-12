import * as React from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ClipboardCheck, Plus, UserCheck } from "lucide-react";
import { db } from "@/lib/supabase";
import { mensajeError } from "@/lib/errores";
import { usePerfil } from "@/features/auth/sesion";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog } from "@/components/ui/dialog";
import { EstadoBadge } from "@/components/common/StatusBadge";
import { ResponsiveList, type Columna } from "@/components/common/ResponsiveList";
import { EmptyState } from "@/components/common/EmptyState";
import { formatearFecha } from "@/lib/formato";
import type { Lista } from "@/types/tipos";

const ESTADOS = ["borrador", "cerrada", "enviada", "anulada"];

export function AsistenciaPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: perfil } = usePerfil();
  const roles = perfil?.roles ?? [];
  const puedeEscribir = roles.some((r) => ["ayudante", "capitan", "secretario", "admin"].includes(r));
  const anioActual = new Date().getFullYear();

  const [anio, setAnio] = React.useState(String(anioActual));
  const [estado, setEstado] = React.useState("");
  const [nuevoAbierto, setNuevoAbierto] = React.useState(false);

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
      titulo: "Lista",
      render: (l) => (
        <div>
          <p className="font-medium">N° {l.numero}</p>
          <p className="text-xs text-muted-foreground">{formatearFecha(l.fecha)}</p>
        </div>
      ),
    },
    { clave: "acto", titulo: "Acto", render: (l) => l.tipo_acto?.descripcion ?? l.descripcion ?? "—" },
    { clave: "estado", titulo: "Estado", render: (l) => <EstadoBadge estado={l.estado} /> },
    { clave: "abono", titulo: "Abono", render: (l) => (l.es_abono ? "Sí" : "—") },
  ];

  return (
    <div>
      <PageHeader
        titulo="Asistencia"
        descripcion="Listas del libro de asistencia y pase de lista en el celular."
        acciones={
          <>
            <Button variant="outline" onClick={() => void navigate({ to: "/asistencia/mi" })}>
              <UserCheck /> Mi asistencia
            </Button>
            {puedeEscribir && (
              <Button onClick={() => setNuevoAbierto(true)}>
                <Plus /> Nueva lista
              </Button>
            )}
          </>
        }
      />

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
          <span className="ml-auto self-center text-sm text-muted-foreground">{filas.length} listas</span>
        </CardContent>
      </Card>

      <ResponsiveList
        filas={filas}
        columnas={columnas}
        claveFila={(l) => l.id}
        cargando={isLoading}
        alHacerClic={(l) => void navigate({ to: "/asistencia/$listaId", params: { listaId: String(l.id) } })}
        renderTarjeta={(l) => (
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium">Lista N° {l.numero} · {l.anio}</p>
              <p className="text-sm text-muted-foreground">{l.tipo_acto?.descripcion ?? l.descripcion}</p>
              <p className="mt-1 text-xs text-muted-foreground">{formatearFecha(l.fecha)}</p>
            </div>
            <EstadoBadge estado={l.estado} />
          </div>
        )}
        vacio={
          <EmptyState
            titulo="Sin listas"
            descripcion="No hay listas para el año y estado seleccionados."
            icono={ClipboardCheck}
            accion={
              puedeEscribir ? (
                <Button variant="outline" onClick={() => setNuevoAbierto(true)}>
                  <Plus /> Crear lista
                </Button>
              ) : undefined
            }
          />
        }
      />

      {puedeEscribir && (
        <NuevaListaDialog
          abierto={nuevoAbierto}
          onCambio={setNuevoAbierto}
          anio={Number(anio)}
          onCreada={async (id) => {
            await queryClient.invalidateQueries({ queryKey: ["listas"] });
            await navigate({ to: "/asistencia/$listaId", params: { listaId: String(id) } });
          }}
        />
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        El pase de lista se puede realizar sin conexión. Las marcas quedan en el dispositivo y se sincronizan
        automáticamente.{" "}
        <Link to="/asistencia/mi" className="text-primary hover:underline">Ver mi asistencia</Link>
      </p>
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
  const [tipo, setTipo] = React.useState("RO");
  const [descripcion, setDescripcion] = React.useState("");
  const [esAbono, setEsAbono] = React.useState(false);
  const [justificacion, setJustificacion] = React.useState("");

  const { data: tipos } = useQuery({
    queryKey: ["tipos-acto"],
    queryFn: async () => {
      const { data, error } = await db.asistencia.from("tipo_acto").select("*").eq("activo", true).order("clave");
      if (error) throw error;
      return data as Array<{ clave: string; descripcion: string }>;
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
    if (abierto && ultima) setNumero(String(ultima.numero + 1));
    if (abierto && !ultima) setNumero("1");
  }, [abierto, ultima]);

  const crear = useMutation({
    mutationFn: async () => {
      const { data, error } = await db.asistencia
        .from("lista")
        .insert({
          compania_id: 1,
          anio,
          numero: Number(numero),
          fecha,
          tipo_acto_clave: tipo,
          descripcion: descripcion || null,
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
      toast.success("Lista creada");
      onCambio(false);
      await onCreada(id);
    },
    onError: (e) => toast.error(mensajeError(e)),
  });

  return (
    <Dialog
      abierto={abierto}
      onCambio={onCambio}
      titulo="Nueva lista de asistencia"
      pie={
        <>
          <Button variant="outline" onClick={() => onCambio(false)}>Cancelar</Button>
          <Button
            onClick={() => crear.mutate()}
            disabled={crear.isPending || !numero || (esAbono && justificacion.trim().length < 3)}
          >
            Crear lista
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="nl-numero">Número</Label>
            <Input id="nl-numero" type="number" value={numero} onChange={(e) => setNumero(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="nl-fecha">Fecha</Label>
            <Input id="nl-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="nl-tipo">Tipo de acto</Label>
          <Select id="nl-tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            {tipos?.map((t) => (
              <option key={t.clave} value={t.clave}>{t.clave} · {t.descripcion}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="nl-desc">Descripción (opcional)</Label>
          <Input id="nl-desc" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
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
