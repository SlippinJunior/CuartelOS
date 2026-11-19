import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BookMarked, Banknote, CircleDot } from "lucide-react";
import { db } from "@/lib/supabase";
import { mensajeError } from "@/lib/errores";
import { usePerfil } from "@/features/auth/sesion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ResponsiveList, type Columna } from "@/components/common/ResponsiveList";
import { EmptyState } from "@/components/common/EmptyState";
import { formatearCLP, formatearFecha, semaforo } from "@/lib/formato";
import { nucleoNormalizar } from "@/lib/texto";
import type { Acuerdo } from "@/types/tipos";

interface AcuerdoFila extends Acuerdo {
  acta?: { numero: number; anio: number; fecha: string } | null;
  compromiso_id?: number | null;
}

const ESTADOS = ["pendiente", "en_curso", "cumplido", "anulado"];

export function AcuerdosSection() {
  const queryClient = useQueryClient();
  const { data: perfil } = usePerfil();
  const roles = perfil?.roles ?? [];
  const puedeGestionar = roles.some((r) =>
    ["secretario", "prosecretario", "tesorero", "director", "admin"].includes(r),
  );

  const [estado, setEstado] = React.useState("");
  const [busqueda, setBusqueda] = React.useState("");
  const [detalle, setDetalle] = React.useState<AcuerdoFila | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["secretaria", "acuerdos"],
    queryFn: async () => {
      const { data, error } = await db.secretaria
        .from("acuerdo")
        .select("*, acta:acta(numero, anio, fecha)")
        .order("id", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AcuerdoFila[];
    },
  });

  const { data: compromisos } = useQuery({
    queryKey: ["secretaria", "compromisos-acuerdos"],
    queryFn: async () => {
      const { data, error } = await db.tesoreria
        .from("compromiso")
        .select("id, acuerdo_id")
        .not("acuerdo_id", "is", null);
      if (error) throw error;
      return (data ?? []) as Array<{ id: number; acuerdo_id: number }>;
    },
  });

  const compromisoPorAcuerdo = React.useMemo(() => {
    const mapa = new Map<number, number>();
    for (const c of compromisos ?? []) mapa.set(c.acuerdo_id, c.id);
    return mapa;
  }, [compromisos]);

  const filas = (data ?? [])
    .filter((a) => !estado || a.estado === estado)
    .filter((a) => {
      if (!busqueda) return true;
      return nucleoNormalizar(a.texto).includes(nucleoNormalizar(busqueda));
    })
    .map((a) => ({ ...a, compromiso_id: compromisoPorAcuerdo.get(a.id) ?? null }));

  const columnas: Columna<AcuerdoFila>[] = [
    {
      clave: "acuerdo",
      titulo: "Acuerdo",
      render: (a) => (
        <div className="max-w-md">
          <p className="line-clamp-2 text-sm">{a.texto}</p>
          <p className="text-xs text-muted-foreground">
            Acta N° {a.acta?.numero}/{a.acta?.anio} · N° {a.numero}
          </p>
        </div>
      ),
    },
    { clave: "monto", titulo: "Monto", render: (a) => (a.monto ? formatearCLP(a.monto) : "—") },
    {
      clave: "plazo",
      titulo: "Plazo",
      render: (a) => {
        if (!a.plazo) return "—";
        const s = semaforo(a.plazo, 7);
        return (
          <span className="flex items-center gap-1">
            <span
              className={`size-2 rounded-full ${
                s === "vencido" ? "bg-peligro" : s === "por_vencer" ? "bg-aviso" : "bg-exito"
              }`}
            />
            {formatearFecha(a.plazo)}
          </span>
        );
      },
    },
    { clave: "estado", titulo: "Estado", render: (a) => <Badge variant={varianteEstado(a.estado)}>{a.estado.replace("_", " ")}</Badge> },
    {
      clave: "tesoreria",
      titulo: "Tesorería",
      render: (a) => (a.compromiso_id ? <Badge variant="secondary">Compromiso #{a.compromiso_id}</Badge> : "—"),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Buscar en el libro de acuerdos"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="max-w-xs"
          aria-label="Buscar acuerdo"
        />
        <Select value={estado} onChange={(e) => setEstado(e.target.value)} aria-label="Estado" className="w-40">
          <option value="">Todos</option>
          {ESTADOS.map((e) => <option key={e} value={e}>{e.replace("_", " ")}</option>)}
        </Select>
        <Badge variant="outline" className="self-center">{filas.length} acuerdos</Badge>
      </div>

      <ResponsiveList
        filas={filas}
        columnas={columnas}
        claveFila={(a) => a.id}
        cargando={isLoading}
        alHacerClic={(a) => setDetalle(a)}
        renderTarjeta={(a) => (
          <div className="space-y-1">
            <div className="flex items-start justify-between gap-2">
              <p className="line-clamp-3 text-sm">{a.texto}</p>
              <Badge variant={varianteEstado(a.estado)}>{a.estado.replace("_", " ")}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Acta {a.acta?.numero}/{a.acta?.anio} · {a.monto ? formatearCLP(a.monto) : "sin monto"} · {a.plazo ? formatearFecha(a.plazo) : "sin plazo"}
            </p>
            {a.compromiso_id && <Badge variant="secondary">Compromiso #{a.compromiso_id}</Badge>}
          </div>
        )}
        vacio={<EmptyState titulo="Sin acuerdos" descripcion="Los acuerdos de las actas aparecerán aquí." icono={BookMarked} />}
      />

      <DialogoAcuerdo
        acuerdo={detalle}
        puedeGestionar={puedeGestionar}
        onCambio={(v) => !v && setDetalle(null)}
        onListo={async () => {
          await queryClient.invalidateQueries({ queryKey: ["secretaria", "acuerdos"] });
          await queryClient.invalidateQueries({ queryKey: ["secretaria", "compromisos-acuerdos"] });
          await queryClient.invalidateQueries({ queryKey: ["cartola"] });
        }}
      />
    </div>
  );
}

function varianteEstado(estado: string): "aviso" | "secondary" | "exito" | "peligro" {
  switch (estado) {
    case "cumplido":
      return "exito";
    case "anulado":
      return "peligro";
    case "en_curso":
      return "secondary";
    default:
      return "aviso";
  }
}

function DialogoAcuerdo({
  acuerdo,
  puedeGestionar,
  onCambio,
  onListo,
}: {
  acuerdo: AcuerdoFila | null;
  puedeGestionar: boolean;
  onCambio: (v: boolean) => void;
  onListo: () => Promise<void>;
}) {
  const [estado, setEstado] = React.useState("pendiente");
  const [seguimiento, setSeguimiento] = React.useState("");

  React.useEffect(() => {
    if (acuerdo) {
      setEstado(acuerdo.estado);
      setSeguimiento(acuerdo.seguimiento ?? "");
    }
  }, [acuerdo]);

  const guardar = useMutation({
    mutationFn: async () => {
      const { error } = await db.secretaria
        .from("acuerdo")
        .update({ estado, seguimiento } as never)
        .eq("id", acuerdo!.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Acuerdo actualizado");
      onCambio(false);
      await onListo();
    },
    onError: (e) => toast.error(mensajeError(e)),
  });

  const crearCompromiso = useMutation({
    mutationFn: async () => {
      const { data, error } = await db.secretaria.rpc("crear_compromiso_desde_acuerdo", {
        p_acuerdo_id: acuerdo!.id,
        p_categoria_id: null,
        p_fecha_estimada: null,
      });
      if (error) throw error;
      return Number(data);
    },
    onSuccess: async (id) => {
      toast.success(`Compromiso #${id} creado en Tesorería`);
      await onListo();
    },
    onError: (e) => toast.error(mensajeError(e)),
  });

  const sinCompromiso = acuerdo?.monto && !acuerdo.compromiso_id;

  return (
    <Dialog
      abierto={Boolean(acuerdo)}
      onCambio={onCambio}
      titulo={acuerdo ? `Acuerdo N° ${acuerdo.numero}` : "Acuerdo"}
      descripcion={acuerdo?.acta ? `Acta N° ${acuerdo.acta.numero}/${acuerdo.acta.anio}` : undefined}
      pie={
        <>
          <Button variant="outline" onClick={() => onCambio(false)}>Cerrar</Button>
          {puedeGestionar && (
            <Button onClick={() => guardar.mutate()} disabled={guardar.isPending}>Guardar</Button>
          )}
        </>
      }
    >
      {acuerdo && (
        <div className="space-y-4 text-sm">
          <p className="rounded-md border border-border bg-muted/30 p-3">{acuerdo.texto}</p>

          <dl className="grid grid-cols-2 gap-2">
            <div><dt className="text-xs text-muted-foreground">Monto</dt><dd>{acuerdo.monto ? formatearCLP(acuerdo.monto) : "—"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Plazo</dt><dd>{formatearFecha(acuerdo.plazo)}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Resultado</dt><dd>{acuerdo.resultado ?? "—"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Compromiso</dt><dd>{acuerdo.compromiso_id ? `#${acuerdo.compromiso_id}` : "Sin crear"}</dd></div>
          </dl>

          {puedeGestionar && (
            <>
              <div className="space-y-1">
                <Label htmlFor="acuerdo-estado">Estado</Label>
                <Select id="acuerdo-estado" value={estado} onChange={(e) => setEstado(e.target.value)}>
                  {ESTADOS.map((e) => <option key={e} value={e}>{e.replace("_", " ")}</option>)}
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="acuerdo-seguimiento">Seguimiento</Label>
                <Textarea id="acuerdo-seguimiento" value={seguimiento} onChange={(e) => setSeguimiento(e.target.value)} />
              </div>
            </>
          )}

          {sinCompromiso && puedeGestionar && (
            <div className="rounded-md border border-aviso/40 bg-aviso/5 p-3">
              <p className="flex items-center gap-2 font-medium"><Banknote className="size-4" /> Acuerdo con monto sin compromiso</p>
              <p className="mb-2 text-xs text-muted-foreground">
                Crea el compromiso en Tesorería para resolver la alerta R04.
              </p>
              <Button size="sm" onClick={() => crearCompromiso.mutate()} disabled={crearCompromiso.isPending}>
                <CircleDot /> {crearCompromiso.isPending ? "Creando…" : "Crear compromiso en Tesorería"}
              </Button>
            </div>
          )}
        </div>
      )}
    </Dialog>
  );
}
