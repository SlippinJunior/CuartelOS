import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BookOpen, Download, FilePlus2, FileText, ShieldCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { db, supabase } from "@/lib/supabase";
import { mensajeError } from "@/lib/errores";
import { usePerfil } from "@/features/auth/sesion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ResponsiveList, type Columna } from "@/components/common/ResponsiveList";
import { EmptyState } from "@/components/common/EmptyState";
import { formatearFecha } from "@/lib/formato";
import type { ActaListado, Acuerdo } from "@/types/tipos";

interface TipoSesion {
  codigo: string;
  nombre: string;
}

interface ListaOpcion {
  id: number;
  anio: number;
  numero: number;
  fecha: string;
}

export function ActasTab() {
  const { data: perfil } = usePerfil();
  const roles = perfil?.roles ?? [];
  const puedeCrear = roles.some((r) => ["secretario", "prosecretario", "director", "admin"].includes(r));

  const [nueva, setNueva] = React.useState(false);
  const [detalle, setDetalle] = React.useState<ActaListado | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["actas"],
    queryFn: async () => {
      const { data, error } = await db.secretaria
        .from("acta")
        .select("*, tipo_sesion:tipo_sesion(nombre)")
        .order("fecha", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ActaListado[];
    },
  });

  const { data: acuerdos } = useQuery({
    queryKey: ["acuerdos"],
    queryFn: async () => {
      const { data, error } = await db.secretaria.from("acuerdo").select("*").order("numero");
      if (error) throw error;
      return (data ?? []) as Acuerdo[];
    },
  });

  const columnas: Columna<ActaListado>[] = [
    {
      clave: "acta",
      titulo: "Acta",
      render: (a) => (
        <div>
          <p className="font-medium">N° {a.numero}/{a.anio}</p>
          <p className="text-xs text-muted-foreground">{a.tipo_sesion?.nombre ?? a.tipo_sesion_codigo}</p>
        </div>
      ),
    },
    { clave: "fecha", titulo: "Fecha", render: (a) => formatearFecha(a.fecha) },
    {
      clave: "estado",
      titulo: "Estado",
      render: (a) => <Badge variant={a.aprobada_en_acta_id ? "exito" : "aviso"}>{a.aprobada_en_acta_id ? "Aprobada" : "Borrador"}</Badge>,
    },
    {
      clave: "pdf",
      titulo: "PDF",
      render: (a) => (a.archivo_id ? <Badge variant="secondary">Emitido</Badge> : <span className="text-muted-foreground">—</span>),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BookOpen className="size-4 text-primary" />
          Actas de reuniones y sesiones de la compañía.
        </div>
        {puedeCrear && (
          <Button onClick={() => setNueva(true)}>
            <FilePlus2 /> Nueva acta
          </Button>
        )}
      </div>

      <ResponsiveList
        filas={data ?? []}
        columnas={columnas}
        claveFila={(a) => a.id}
        cargando={isLoading}
        alHacerClic={(a) => setDetalle(a)}
        renderTarjeta={(a) => (
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium">Acta N° {a.numero}/{a.anio}</p>
              <p className="text-sm text-muted-foreground">{a.tipo_sesion?.nombre ?? a.tipo_sesion_codigo}</p>
              <p className="text-xs text-muted-foreground">{formatearFecha(a.fecha)}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant={a.aprobada_en_acta_id ? "exito" : "aviso"}>{a.aprobada_en_acta_id ? "Aprobada" : "Borrador"}</Badge>
              {a.archivo_id && <Badge variant="secondary">PDF</Badge>}
            </div>
          </div>
        )}
        vacio={
          <EmptyState
            titulo="Sin actas"
            descripcion="Aún no hay actas de reuniones registradas."
            icono={BookOpen}
            accion={puedeCrear ? <Button variant="outline" onClick={() => setNueva(true)}><FilePlus2 /> Crear acta</Button> : undefined}
          />
        }
      />

      <NuevaActaDialog
        abierto={nueva}
        onCambio={setNueva}
        onCreada={async () => {
          await queryClient.invalidateQueries({ queryKey: ["actas"] });
          await queryClient.invalidateQueries({ queryKey: ["acuerdos"] });
        }}
      />

      <DetalleActaDialog
        acta={detalle}
        acuerdos={(acuerdos ?? []).filter((a) => a.acta_id === detalle?.id)}
        puedeAprobar={puedeCrear}
        onCambio={(v) => !v && setDetalle(null)}
      />
    </div>
  );
}

function NuevaActaDialog({
  abierto,
  onCambio,
  onCreada,
}: {
  abierto: boolean;
  onCambio: (v: boolean) => void;
  onCreada: () => Promise<void>;
}) {
  const [tipo, setTipo] = React.useState("RO");
  const [numero, setNumero] = React.useState("");
  const [fecha, setFecha] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [listaId, setListaId] = React.useState("");
  const [quorum, setQuorum] = React.useState(true);
  const [texto, setTexto] = React.useState("");
  const [acuerdosTexto, setAcuerdosTexto] = React.useState("");

  const { data: tipos } = useQuery({
    queryKey: ["tipos-sesion"],
    queryFn: async () => {
      const { data, error } = await db.secretaria.from("tipo_sesion").select("codigo, nombre").order("codigo");
      if (error) throw error;
      return (data ?? []) as TipoSesion[];
    },
    enabled: abierto,
  });

  const { data: listas } = useQuery({
    queryKey: ["listas-para-acta"],
    queryFn: async () => {
      const { data, error } = await db.asistencia
        .from("lista")
        .select("id, anio, numero, fecha")
        .order("fecha", { ascending: false })
        .limit(80);
      if (error) throw error;
      return (data ?? []) as ListaOpcion[];
    },
    enabled: abierto,
  });

  const anioActa = Number(fecha.slice(0, 4)) || new Date().getFullYear();

  const { data: ultima } = useQuery({
    queryKey: ["ultima-acta", tipo, anioActa],
    queryFn: async () => {
      const { data, error } = await db.secretaria
        .from("acta")
        .select("numero")
        .eq("tipo_sesion_codigo", tipo)
        .eq("anio", anioActa)
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
      const { data, error } = await db.secretaria
        .from("acta")
        .insert({
          tipo_sesion_codigo: tipo,
          numero: Number(numero),
          anio: anioActa,
          fecha,
          lista_id: listaId ? Number(listaId) : null,
          quorum_ok: quorum,
          texto: texto || null,
        } as never)
        .select("id")
        .single();
      if (error) throw error;
      const actaId = (data as { id: number }).id;
      const lineas = acuerdosTexto
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      if (lineas.length > 0) {
        const { error: errorAcuerdos } = await db.secretaria.from("acuerdo").insert(
          lineas.map((linea, i) => ({
            acta_id: actaId,
            numero: i + 1,
            texto: linea,
            estado: "pendiente",
          })) as never,
        );
        if (errorAcuerdos) throw errorAcuerdos;
      }
    },
    onSuccess: async () => {
      toast.success("Acta creada");
      setTexto("");
      setAcuerdosTexto("");
      onCambio(false);
      await onCreada();
    },
    onError: (e) => toast.error(mensajeError(e)),
  });

  return (
    <Dialog
      abierto={abierto}
      onCambio={onCambio}
      titulo="Nueva acta de reunión"
      descripcion="El número es correlativo por tipo y año."
      pie={
        <>
          <Button variant="outline" onClick={() => onCambio(false)}>Cancelar</Button>
          <Button onClick={() => crear.mutate()} disabled={crear.isPending || !numero}>
            {crear.isPending ? "Creando…" : "Crear acta"}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="acta-tipo">Tipo de sesión</Label>
            <Select id="acta-tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
              {(tipos ?? []).map((t) => <option key={t.codigo} value={t.codigo}>{t.nombre}</option>)}
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="acta-numero">Número</Label>
            <Input id="acta-numero" type="number" value={numero} onChange={(e) => setNumero(e.target.value)} />
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="acta-fecha">Fecha</Label>
            <Input id="acta-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="acta-lista">Lista asociada</Label>
            <Select id="acta-lista" value={listaId} onChange={(e) => setListaId(e.target.value)}>
              <option value="">Sin lista</option>
              {(listas ?? []).map((l) => (
                <option key={l.id} value={l.id}>N° {l.numero}/{l.anio} · {formatearFecha(l.fecha)}</option>
              ))}
            </Select>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="size-5 accent-[var(--primario)]" checked={quorum} onChange={(e) => setQuorum(e.target.checked)} />
          Se cumplió el quórum
        </label>
        <div className="space-y-1">
          <Label htmlFor="acta-texto">Texto del acta</Label>
          <Textarea
            id="acta-texto"
            className="min-h-36"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Resumen de la sesión, asistentes, deliberaciones…"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="acta-acuerdos">Acuerdos (uno por línea)</Label>
          <Textarea
            id="acta-acuerdos"
            value={acuerdosTexto}
            onChange={(e) => setAcuerdosTexto(e.target.value)}
            placeholder="Aprobar el presupuesto 2026&#10;Autorizar la compra de EPP"
          />
        </div>
      </div>
    </Dialog>
  );
}

function DetalleActaDialog({
  acta,
  acuerdos,
  puedeAprobar,
  onCambio,
}: {
  acta: ActaListado | null;
  acuerdos: Acuerdo[];
  puedeAprobar: boolean;
  onCambio: (v: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [emitiendo, setEmitiendo] = React.useState(false);
  const [urlPdf, setUrlPdf] = React.useState<string | null>(null);

  const { data: documento } = useQuery({
    queryKey: ["acta-documento", acta?.id],
    queryFn: async () => {
      const { data, error } = await db.documentos
        .from("documento_emitido")
        .select("*")
        .eq("referencia", `ACTA:${acta?.id}`)
        .order("emitido_en", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as { id: string; token_verificacion: string; pdf_archivo_id: string | null } | null;
    },
    enabled: Boolean(acta),
  });

  const { data: archivo } = useQuery({
    queryKey: ["acta-archivo", documento?.pdf_archivo_id],
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

  const aprobar = useMutation({
    mutationFn: async () => {
      if (!acta) return;
      const { error } = await db.secretaria
        .from("acta")
        .update({ aprobada_en_acta_id: acta.id } as never)
        .eq("id", acta.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Acta aprobada y visible para la compañía");
      await queryClient.invalidateQueries({ queryKey: ["actas"] });
      onCambio(false);
    },
    onError: (e) => toast.error(mensajeError(e)),
  });

  const emitir = async () => {
    if (!acta) return;
    setEmitiendo(true);
    try {
      const { data, error } = await supabase.functions.invoke("emitir-acta", { body: { acta_id: acta.id } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.pdf_path) {
        const { data: firmada } = await supabase.storage.from("documentos").createSignedUrl(data.pdf_path, 3600);
        setUrlPdf(firmada?.signedUrl ?? null);
      }
      toast.success(`Acta emitida con folio ${data.anio}-${String(data.folio).padStart(4, "0")}`);
      await queryClient.invalidateQueries({ queryKey: ["acta-documento", acta.id] });
      await queryClient.invalidateQueries({ queryKey: ["actas"] });
    } catch (e) {
      toast.error(mensajeError(e));
    } finally {
      setEmitiendo(false);
    }
  };

  return (
    <Dialog
      abierto={Boolean(acta)}
      onCambio={onCambio}
      titulo={acta ? `Acta N° ${acta.numero}/${acta.anio}` : "Acta"}
      descripcion={acta ? `${acta.tipo_sesion?.nombre ?? acta.tipo_sesion_codigo} · ${formatearFecha(acta.fecha)}` : ""}
      pie={
        <>
          <Button variant="outline" onClick={() => onCambio(false)}>Cerrar</Button>
          {acta && !acta.aprobada_en_acta_id && puedeAprobar && (
            <Button variant="outline" onClick={() => aprobar.mutate()} disabled={aprobar.isPending}>
              Aprobar y publicar
            </Button>
          )}
          {urlPdf && (
            <a href={urlPdf} target="_blank" rel="noreferrer">
              <Button variant="outline"><Download /> PDF</Button>
            </a>
          )}
          <Button onClick={() => void emitir()} disabled={emitiendo}>
            <FileText /> {emitiendo ? "Emitiendo…" : "Emitir PDF"}
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-sm">
        <div className="flex flex-wrap gap-2">
          <Badge variant={acta?.aprobada_en_acta_id ? "exito" : "aviso"}>
            {acta?.aprobada_en_acta_id ? "Aprobada" : "Borrador"}
          </Badge>
          <Badge variant={acta?.quorum_ok ? "exito" : "apagado"}>
            Quórum {acta?.quorum_ok ? "cumplido" : "sin registrar"}
          </Badge>
          {documento && (
            <Link to="/verificar/$token" params={{ token: documento.token_verificacion }} className="text-primary hover:underline">
              <Badge variant="secondary"><ShieldCheck className="mr-1 size-3" /> Verificar PDF</Badge>
            </Link>
          )}
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Texto</p>
          <p className="whitespace-pre-wrap rounded-md border border-border bg-muted/30 p-3">
            {acta?.texto || "Sin texto registrado."}
          </p>
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Acuerdos</p>
          {acuerdos.length === 0 ? (
            <p className="text-muted-foreground">Sin acuerdos registrados.</p>
          ) : (
            <ol className="list-inside list-decimal space-y-1">
              {acuerdos.map((a) => <li key={a.id}>{a.texto}</li>)}
            </ol>
          )}
        </div>
      </div>
    </Dialog>
  );
}
