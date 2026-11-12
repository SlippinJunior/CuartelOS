import * as React from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Mail, Megaphone, Plus, ShieldCheck } from "lucide-react";
import { db, supabase } from "@/lib/supabase";
import { mensajeError } from "@/lib/errores";
import { usePerfil } from "@/features/auth/sesion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ResponsiveList, type Columna } from "@/components/common/ResponsiveList";
import { EmptyState } from "@/components/common/EmptyState";
import { formatearFecha, formatearFechaHora } from "@/lib/formato";
import type { OrdenCapitania } from "@/types/tipos";

export function OrdenesTab() {
  const { data: perfil } = usePerfil();
  const roles = perfil?.roles ?? [];
  const puedeCrear = roles.some((r) => ["capitan", "ayudante", "teniente_1", "director", "admin"].includes(r));
  const queryClient = useQueryClient();
  const [nueva, setNueva] = React.useState(false);
  const [detalle, setDetalle] = React.useState<OrdenCapitania | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["ordenes-capitania"],
    queryFn: async () => {
      const { data, error } = await db.operaciones
        .from("orden_capitania")
        .select("*")
        .order("fecha", { ascending: false })
        .order("numero", { ascending: false });
      if (error) throw error;
      return (data ?? []) as OrdenCapitania[];
    },
  });

  const columnas: Columna<OrdenCapitania>[] = [
    {
      clave: "orden",
      titulo: "Orden",
      render: (o) => (
        <div>
          <p className="font-medium">N° {o.numero}/{o.anio}</p>
          <p className="text-xs text-muted-foreground">{formatearFecha(o.fecha)}</p>
        </div>
      ),
    },
    { clave: "materia", titulo: "Materia", render: (o) => o.materia ?? "—" },
    {
      clave: "correo",
      titulo: "Correo",
      render: (o) => <Badge variant={o.enviada_en ? "exito" : "apagado"}>{o.correo_estado ?? "Sin enviar"}</Badge>,
    },
    {
      clave: "pdf",
      titulo: "PDF",
      render: (o) => (o.archivo_id ? <Badge variant="secondary">Emitido</Badge> : <span className="text-muted-foreground">—</span>),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Megaphone className="size-4 text-primary" />
          Órdenes de capitanía visibles para todos los bomberos.
        </div>
        {puedeCrear && (
          <Button onClick={() => setNueva(true)}>
            <Plus /> Nueva orden
          </Button>
        )}
      </div>

      <ResponsiveList
        filas={data ?? []}
        columnas={columnas}
        claveFila={(o) => o.id}
        cargando={isLoading}
        alHacerClic={(o) => setDetalle(o)}
        renderTarjeta={(o) => (
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium">Orden N° {o.numero}/{o.anio}</p>
              <p className="text-sm text-muted-foreground">{o.materia}</p>
              <p className="text-xs text-muted-foreground">{formatearFecha(o.fecha)}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              {o.enviada_en && <Badge variant="exito"><Mail className="size-3" /> Enviada</Badge>}
              {o.archivo_id && <Badge variant="secondary">PDF</Badge>}
            </div>
          </div>
        )}
        vacio={
          <EmptyState
            titulo="Sin órdenes de capitanía"
            descripcion="Las órdenes emitidas por la Capitanía aparecerán aquí para toda la compañía."
            icono={Megaphone}
            accion={puedeCrear ? <Button variant="outline" onClick={() => setNueva(true)}><Plus /> Crear orden</Button> : undefined}
          />
        }
      />

      <NuevaOrdenDialog
        abierto={nueva}
        onCambio={setNueva}
        onCreada={async (id) => {
          await queryClient.invalidateQueries({ queryKey: ["ordenes-capitania"] });
          const orden = (data ?? []).find((o) => o.id === id) ?? null;
          if (orden) setDetalle(orden);
        }}
      />

      <DetalleOrdenDialog orden={detalle} onCambio={(v) => !v && setDetalle(null)} />
    </div>
  );
}

function NuevaOrdenDialog({
  abierto,
  onCambio,
  onCreada,
}: {
  abierto: boolean;
  onCambio: (v: boolean) => void;
  onCreada: (id: number) => Promise<void>;
}) {
  const [numero, setNumero] = React.useState("");
  const [fecha, setFecha] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [materia, setMateria] = React.useState("");
  const [texto, setTexto] = React.useState("");
  const [enviar, setEnviar] = React.useState(true);

  const anioOrden = Number(fecha.slice(0, 4)) || new Date().getFullYear();

  const { data: ultima } = useQuery({
    queryKey: ["ultima-orden", anioOrden],
    queryFn: async () => {
      const { data, error } = await db.operaciones
        .from("orden_capitania")
        .select("numero")
        .eq("anio", anioOrden)
        .order("numero", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as { numero: number } | null;
    },
    enabled: abierto,
  });

  React.useEffect(() => {
    if (abierto) setNumero(String((ultima?.numero ?? 0) + 1));
  }, [abierto, ultima]);

  const crear = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("orden-capitania", {
        body: {
          numero: Number(numero),
          fecha,
          materia,
          texto,
          enviar_correo: enviar,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { orden_id: number; correo?: { enviados: number; total: number; error: string | null } };
    },
    onSuccess: async (data) => {
      if (data.correo) {
        if (data.correo.error) {
          toast.warning(`Orden creada. ${data.correo.enviados}/${data.correo.total} correos enviados: ${data.correo.error}`);
        } else if (data.correo.total > 0) {
          toast.success(`Orden creada y enviada a ${data.correo.enviados} correos.`);
        } else {
          toast.success("Orden creada. No hay destinatarios con correo.");
        }
      } else {
        toast.success("Orden creada");
      }
      setMateria("");
      setTexto("");
      onCambio(false);
      await onCreada(data.orden_id);
    },
    onError: (e) => toast.error(mensajeError(e)),
  });

  return (
    <Dialog
      abierto={abierto}
      onCambio={onCambio}
      titulo="Nueva orden de capitanía"
      descripcion="Se emitirá el PDF con folio y se enviará por correo a todos los bomberos activos."
      pie={
        <>
          <Button variant="outline" onClick={() => onCambio(false)}>Cancelar</Button>
          <Button onClick={() => crear.mutate()} disabled={crear.isPending || materia.trim().length < 3 || texto.trim().length < 10}>
            {crear.isPending ? "Emitiendo…" : "Emitir orden"}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="orden-numero">Número</Label>
            <Input id="orden-numero" type="number" value={numero} onChange={(e) => setNumero(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="orden-fecha">Fecha</Label>
            <Input id="orden-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="orden-materia">Materia</Label>
          <Input id="orden-materia" value={materia} onChange={(e) => setMateria(e.target.value)} placeholder="Por ejemplo: Guardia nocturna de fin de semana" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="orden-texto">Texto de la orden</Label>
          <Textarea id="orden-texto" className="min-h-36" value={texto} onChange={(e) => setTexto(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="size-5 accent-[var(--primario)]" checked={enviar} onChange={(e) => setEnviar(e.target.checked)} />
          Enviar por correo a todos los bomberos activos
        </label>
      </div>
    </Dialog>
  );
}

function DetalleOrdenDialog({
  orden,
  onCambio,
}: {
  orden: OrdenCapitania | null;
  onCambio: (v: boolean) => void;
}) {
  const [urlPdf, setUrlPdf] = React.useState<string | null>(null);

  const { data: documento } = useQuery({
    queryKey: ["orden-documento", orden?.id],
    queryFn: async () => {
      const { data, error } = await db.documentos
        .from("documento_emitido")
        .select("*")
        .eq("referencia", `ORDEN:${orden?.id}`)
        .order("emitido_en", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as { token_verificacion: string; pdf_archivo_id: string | null } | null;
    },
    enabled: Boolean(orden),
  });

  const { data: archivo } = useQuery({
    queryKey: ["orden-archivo", documento?.pdf_archivo_id],
    queryFn: async () => {
      const { data, error } = await db.documentos
        .from("archivo")
        .select("bucket, path")
        .eq("id", documento?.pdf_archivo_id)
        .maybeSingle();
      if (error) throw error;
      return data as { bucket: string; path: string } | null;
    },
    enabled: Boolean(documento?.pdf_archivo_id),
  });

  React.useEffect(() => {
    let vivo = true;
    if (archivo?.bucket && archivo.path) {
      void supabase.storage.from(archivo.bucket).createSignedUrl(archivo.path, 3600).then(({ data }) => {
        if (vivo) setUrlPdf(data?.signedUrl ?? null);
      });
    } else {
      setUrlPdf(null);
    }
    return () => {
      vivo = false;
    };
  }, [archivo]);

  return (
    <Dialog
      abierto={Boolean(orden)}
      onCambio={onCambio}
      titulo={orden ? `Orden N° ${orden.numero}/${orden.anio}` : "Orden de capitanía"}
      descripcion={orden ? `${formatearFecha(orden.fecha)} · ${orden.materia ?? ""}` : ""}
      pie={
        <>
          <Button variant="outline" onClick={() => onCambio(false)}>Cerrar</Button>
          {urlPdf && (
            <a href={urlPdf} target="_blank" rel="noreferrer">
              <Button variant="outline"><Download /> PDF</Button>
            </a>
          )}
        </>
      }
    >
      {orden && (
        <div className="space-y-4 text-sm">
          <div className="flex flex-wrap gap-2">
            {orden.enviada_en && <Badge variant="exito"><Mail className="size-3" /> Enviada {formatearFechaHora(orden.enviada_en)}</Badge>}
            <Badge variant="secondary">{orden.correo_estado ?? "Sin envío registrado"}</Badge>
            {documento && (
              <Link to="/verificar/$token" params={{ token: documento.token_verificacion }} className="text-primary hover:underline">
                <Badge variant="outline"><ShieldCheck className="mr-1 size-3" /> Verificar</Badge>
              </Link>
            )}
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Materia</p>
            <p className="rounded-md border border-border bg-muted/30 p-3 font-medium">{orden.materia ?? "—"}</p>
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Texto</p>
            <p className="whitespace-pre-wrap rounded-md border border-border bg-muted/30 p-3">{orden.texto ?? "—"}</p>
          </div>
        </div>
      )}
    </Dialog>
  );
}
