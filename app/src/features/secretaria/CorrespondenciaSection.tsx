import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Mail, Paperclip, Plus } from "lucide-react";
import { db, supabase } from "@/lib/supabase";
import { mensajeError } from "@/lib/errores";
import { usePerfil } from "@/features/auth/sesion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SearchInput } from "@/components/ui/search-input";
import { Textarea } from "@/components/ui/textarea";
import { ResponsiveList, type Columna } from "@/components/common/ResponsiveList";
import { EmptyState } from "@/components/common/EmptyState";
import { formatearFecha, semaforo } from "@/lib/formato";
import { nucleoNormalizar } from "@/lib/texto";
import type { Contraparte } from "@/types/tipos";

interface CorrespondenciaFila {
  id: number;
  sentido: "recibida" | "despachada";
  numero: string | null;
  fecha: string;
  materia: string | null;
  plazo_respuesta: string | null;
  responde_a_id: number | null;
  archivo_id: string | null;
  contraparte: { id: number; nombre: string } | null;
}

export function CorrespondenciaSection() {
  const queryClient = useQueryClient();
  const { data: perfil } = usePerfil();
  const puedeEditar = (perfil?.roles ?? []).some((r) =>
    ["secretario", "prosecretario", "director", "admin"].includes(r),
  );

  const [sentido, setSentido] = React.useState("");
  const [busqueda, setBusqueda] = React.useState("");
  const [editor, setEditor] = React.useState<CorrespondenciaFila | "nuevo" | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["secretaria", "correspondencia"],
    queryFn: async () => {
      // Las contrapartes viven en `nucleo`, así que se cargan por separado.
      const [{ data, error }, { data: contras, error: errorContras }] = await Promise.all([
        db.secretaria
          .from("correspondencia")
          .select("id, sentido, numero, fecha, materia, plazo_respuesta, responde_a_id, archivo_id, contraparte_id")
          .order("fecha", { ascending: false }),
        db.nucleo.from("contraparte").select("id, nombre"),
      ]);
      if (error) throw error;
      if (errorContras) throw errorContras;

      const mapa = new Map<number, string>();
      for (const c of (contras ?? []) as Array<{ id: number; nombre: string }>) mapa.set(c.id, c.nombre);

      return ((data ?? []) as Array<Record<string, any>>).map((fila) => ({
        ...fila,
        contraparte: fila.contraparte_id
          ? { id: fila.contraparte_id, nombre: mapa.get(fila.contraparte_id) ?? "Contraparte" }
          : null,
      })) as CorrespondenciaFila[];
    },
  });

  const filas = (data ?? [])
    .filter((c) => !sentido || c.sentido === sentido)
    .filter((c) => !busqueda || nucleoNormalizar(`${c.numero ?? ""} ${c.materia ?? ""} ${c.contraparte?.nombre ?? ""}`).includes(nucleoNormalizar(busqueda)));

  const columnas: Columna<CorrespondenciaFila>[] = [
    {
      clave: "carta",
      titulo: "Carta",
      render: (c) => (
        <div>
          <div className="flex items-center gap-2">
            <Badge variant={c.sentido === "recibida" ? "secondary" : "outline"}>{c.sentido}</Badge>
            <span className="text-sm font-medium">N° {c.numero ?? "s/n"}</span>
          </div>
          <p className="text-xs text-muted-foreground">{c.contraparte?.nombre ?? "Sin contraparte"}</p>
        </div>
      ),
    },
    { clave: "materia", titulo: "Materia", render: (c) => <span className="line-clamp-2">{c.materia ?? "—"}</span> },
    { clave: "fecha", titulo: "Fecha", render: (c) => formatearFecha(c.fecha) },
    {
      clave: "plazo",
      titulo: "Plazo",
      render: (c) => {
        if (!c.plazo_respuesta) return "—";
        const s = semaforo(c.plazo_respuesta, 3);
        return (
          <span className="flex items-center gap-1">
            <span className={`size-2 rounded-full ${s === "vencido" ? "bg-peligro" : s === "por_vencer" ? "bg-aviso" : "bg-exito"}`} />
            {formatearFecha(c.plazo_respuesta)}
          </span>
        );
      },
    },
    { clave: "adjunto", titulo: "Adjunto", render: (c) => (c.archivo_id ? <Paperclip className="size-4" /> : "—") },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-2.5 sm:flex sm:flex-wrap sm:items-center">
        <SearchInput
          containerClassName="w-full sm:max-w-xs"
          placeholder="Buscar por número, materia o contraparte"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          onLimpiar={() => setBusqueda("")}
          aria-label="Buscar correspondencia"
        />
        <Select value={sentido} onChange={(e) => setSentido(e.target.value)} aria-label="Sentido" className="w-full sm:w-44">
          <option value="">Todas</option>
          <option value="recibida">Recibidas</option>
          <option value="despachada">Despachadas</option>
        </Select>
        <Badge variant="outline" className="w-fit self-center">{filas.length} cartas</Badge>
        {puedeEditar && (
          <Button className="w-full sm:ml-auto sm:w-auto" onClick={() => setEditor("nuevo")}><Plus /> Registrar carta</Button>
        )}
      </div>

      <ResponsiveList
        filas={filas}
        columnas={columnas}
        claveFila={(c) => c.id}
        cargando={isLoading}
        alHacerClic={(c) => setEditor(c)}
        renderTarjeta={(c) => (
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant={c.sentido === "recibida" ? "secondary" : "outline"}>{c.sentido}</Badge>
                <span className="font-medium">N° {c.numero ?? "s/n"}</span>
              </div>
              <p className="mt-1 line-clamp-2 text-sm">{c.materia ?? "Sin materia"}</p>
              <p className="text-xs text-muted-foreground">{c.contraparte?.nombre} · {formatearFecha(c.fecha)}</p>
            </div>
            {c.archivo_id && <Paperclip className="size-4 text-muted-foreground" />}
          </div>
        )}
        vacio={<EmptyState titulo="Sin correspondencia" descripcion="Registra las cartas recibidas y despachadas." icono={Mail} />}
      />

      <EditorCorrespondencia
        carta={editor === "nuevo" ? null : editor}
        abierto={editor !== null}
        puedeEditar={puedeEditar}
        onCambio={() => setEditor(null)}
        onListo={async () => {
          await queryClient.invalidateQueries({ queryKey: ["secretaria", "correspondencia"] });
        }}
      />
    </div>
  );
}

function EditorCorrespondencia({
  carta,
  abierto,
  puedeEditar,
  onCambio,
  onListo,
}: {
  carta: CorrespondenciaFila | null;
  abierto: boolean;
  puedeEditar: boolean;
  onCambio: () => void;
  onListo: () => Promise<void>;
}) {
  const queryClient = useQueryClient();
  const [sentido, setSentido] = React.useState<"recibida" | "despachada">("recibida");
  const [numero, setNumero] = React.useState("");
  const [fecha, setFecha] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [contraparteId, setContraparteId] = React.useState("");
  const [materia, setMateria] = React.useState("");
  const [plazo, setPlazo] = React.useState("");
  const [respondeA, setRespondeA] = React.useState("");
  const [archivo, setArchivo] = React.useState<File | null>(null);
  const [subiendo, setSubiendo] = React.useState(false);

  const { data: contrapartes } = useQuery({
    queryKey: ["contrapartes"],
    queryFn: async () => {
      const { data, error } = await db.nucleo.from("contraparte").select("id, tipo, nombre, rut, email, telefono").order("nombre");
      if (error) throw error;
      return (data ?? []) as Contraparte[];
    },
    enabled: abierto,
  });

  const { data: cartas } = useQuery({
    queryKey: ["correspondencia-para-respuesta"],
    queryFn: async () => {
      const { data, error } = await db.secretaria
        .from("correspondencia")
        .select("id, numero, fecha")
        .eq("sentido", "recibida")
        .order("fecha", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as Array<{ id: number; numero: string | null; fecha: string }>;
    },
    enabled: abierto,
  });

  React.useEffect(() => {
    if (!abierto) return;
    if (carta) {
      setSentido(carta.sentido);
      setNumero(carta.numero ?? "");
      setFecha(carta.fecha);
      setContraparteId(carta.contraparte?.id ? String(carta.contraparte.id) : "");
      setMateria(carta.materia ?? "");
      setPlazo(carta.plazo_respuesta ?? "");
      setRespondeA(carta.responde_a_id ? String(carta.responde_a_id) : "");
    } else {
      setNumero("");
      setMateria("");
      setPlazo("");
      setRespondeA("");
    }
    setArchivo(null);
  }, [abierto, carta]);

  const guardar = useMutation({
    mutationFn: async () => {
      let archivoId: string | null = carta?.archivo_id ?? null;

      if (archivo) {
        setSubiendo(true);
        const ruta = `adjuntos/correspondencia/${Date.now()}-${archivo.name.replace(/\s+/g, "-")}`;
        const { error: subida } = await supabase.storage.from("documentos").upload(ruta, archivo, { upsert: true });
        if (subida) throw subida;
        const { data: fila, error } = await db.documentos
          .from("archivo")
          .insert({
            bucket: "documentos",
            path: ruta,
            nombre: archivo.name,
            mime: archivo.type || null,
            tamano: archivo.size,
          } as never)
          .select("id")
          .single();
        if (error) throw error;
        archivoId = (fila as { id: string }).id;
        setSubiendo(false);
      }

      const payload = {
        sentido,
        numero: numero || null,
        fecha,
        contraparte_id: contraparteId ? Number(contraparteId) : null,
        materia: materia || null,
        plazo_respuesta: plazo || null,
        responde_a_id: respondeA ? Number(respondeA) : null,
        archivo_id: archivoId,
      };

      if (carta) {
        const { error } = await db.secretaria.from("correspondencia").update(payload as never).eq("id", carta.id);
        if (error) throw error;
      } else {
        const { error } = await db.secretaria.from("correspondencia").insert(payload as never);
        if (error) throw error;
      }
    },
    onSuccess: async () => {
      toast.success("Correspondencia guardada");
      onCambio();
      await onListo();
    },
    onError: (e) => {
      setSubiendo(false);
      toast.error(mensajeError(e));
    },
  });

  const nuevaContraparte = useMutation({
    mutationFn: async (nombre: string) => {
      const { data, error } = await db.nucleo
        .from("contraparte")
        .insert({ tipo: "institucion", nombre } as never)
        .select("id")
        .single();
      if (error) throw error;
      return (data as { id: number }).id;
    },
    onSuccess: async (id) => {
      setContraparteId(String(id));
      toast.success("Contraparte creada");
      await queryClient.invalidateQueries({ queryKey: ["contrapartes"] });
    },
    onError: (e) => toast.error(mensajeError(e)),
  });

  const [nuevaNombre, setNuevaNombre] = React.useState("");

  return (
    <Dialog
      abierto={abierto}
      onCambio={onCambio}
      titulo={carta ? `Carta N° ${carta.numero ?? "s/n"}` : "Registrar correspondencia"}
      descripcion="Recibida o despachada, con contraparte, plazo y adjunto."
      pie={
        <>
          <Button variant="outline" onClick={onCambio}>Cerrar</Button>
          {puedeEditar && (
            <Button onClick={() => guardar.mutate()} disabled={guardar.isPending || subiendo}>
              {subiendo ? "Subiendo…" : "Guardar"}
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="cor-sentido">Sentido</Label>
            <Select id="cor-sentido" value={sentido} onChange={(e) => setSentido(e.target.value as "recibida" | "despachada")} disabled={!puedeEditar}>
              <option value="recibida">Recibida</option>
              <option value="despachada">Despachada</option>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="cor-numero">Número</Label>
            <Input id="cor-numero" value={numero} onChange={(e) => setNumero(e.target.value)} disabled={!puedeEditar} />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="cor-contraparte">Contraparte</Label>
          <Select id="cor-contraparte" value={contraparteId} onChange={(e) => setContraparteId(e.target.value)} disabled={!puedeEditar}>
            <option value="">Sin contraparte</option>
            {(contrapartes ?? []).map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </Select>
          {puedeEditar && (
            <div className="flex gap-2">
              <Input placeholder="Nueva contraparte" value={nuevaNombre} onChange={(e) => setNuevaNombre(e.target.value)} />
              <Button
                variant="outline"
                size="sm"
                disabled={nuevaNombre.trim().length < 3}
                onClick={() => {
                  nuevaContraparte.mutate(nuevaNombre.trim());
                  setNuevaNombre("");
                }}
              >
                <Plus /> Añadir
              </Button>
            </div>
          )}
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="cor-fecha">Fecha</Label>
            <Input id="cor-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} disabled={!puedeEditar} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cor-plazo">Plazo de respuesta</Label>
            <Input id="cor-plazo" type="date" value={plazo} onChange={(e) => setPlazo(e.target.value)} disabled={!puedeEditar} />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="cor-materia">Materia</Label>
          <Textarea id="cor-materia" value={materia} onChange={(e) => setMateria(e.target.value)} disabled={!puedeEditar} />
        </div>

        <div className="space-y-1">
          <Label htmlFor="cor-responde">Responde a</Label>
          <Select id="cor-responde" value={respondeA} onChange={(e) => setRespondeA(e.target.value)} disabled={!puedeEditar}>
            <option value="">Sin vínculo</option>
            {(cartas ?? []).map((c) => (
              <option key={c.id} value={c.id}>N° {c.numero ?? "s/n"} · {formatearFecha(c.fecha)}</option>
            ))}
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="cor-archivo">Adjunto (PDF, JPG o PNG)</Label>
          <Input
            id="cor-archivo"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
            disabled={!puedeEditar}
          />
          {carta?.archivo_id && <p className="text-xs text-muted-foreground"><Paperclip className="inline size-3" /> Ya tiene un adjunto</p>}
        </div>

        {carta?.archivo_id && <DescargarAdjunto archivoId={carta.archivo_id} />}
      </div>
    </Dialog>
  );
}

function DescargarAdjunto({ archivoId }: { archivoId: string }) {
  const [url, setUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    let vivo = true;
    void db.documentos
      .from("archivo")
      .select("bucket, path, nombre")
      .eq("id", archivoId)
      .maybeSingle()
      .then(async ({ data }) => {
        const fila = data as { bucket: string; path: string } | null;
        if (!fila || !vivo) return;
        const { data: firmada } = await supabase.storage.from(fila.bucket).createSignedUrl(fila.path, 3600);
        if (vivo) setUrl(firmada?.signedUrl ?? null);
      });
    return () => {
      vivo = false;
    };
  }, [archivoId]);

  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
      <Download className="size-4" /> Descargar adjunto
    </a>
  );
}
