import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FileUp, Mail, MessageSquare, Send } from "lucide-react";
import { db, supabase } from "@/lib/supabase";
import { mensajeError } from "@/lib/errores";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { META_TIPO_TABLERO } from "@/features/tablero/logica";
import type { TipoPublicacionTablero } from "@/types/tipos";

const TENIDAS_SUGERIDAS = [
  "Tenida de trabajo / EPP",
  "Tenida de trabajo",
  "Tenida de parada",
  "Tenida de salida / Civil formal",
];

export function DialogoPublicar({
  abierto,
  onCambio,
  tiposPermitidos,
}: {
  abierto: boolean;
  onCambio: (v: boolean) => void;
  tiposPermitidos: TipoPublicacionTablero[];
}) {
  const queryClient = useQueryClient();
  const hoy = new Date().toISOString().slice(0, 10);

  const [tipo, setTipo] = React.useState<TipoPublicacionTablero>(tiposPermitidos[0] ?? "citacion");
  const [numero, setNumero] = React.useState("");
  const [fecha, setFecha] = React.useState(hoy);
  const [vigenteHasta, setVigenteHasta] = React.useState(hoy);
  const [titulo, setTitulo] = React.useState("");
  const [resumen, setResumen] = React.useState("");
  const [texto, setTexto] = React.useState("");
  const [fechaEvento, setFechaEvento] = React.useState(hoy);
  const [horaEvento, setHoraEvento] = React.useState("20:00");
  const [lugar, setLugar] = React.useState("Cuartel Segunda Compañía");
  const [tenida, setTenida] = React.useState("Tenida de trabajo");
  const [obligatoria, setObligatoria] = React.useState(true);

  const [archivoPdf, setArchivoPdf] = React.useState<File | null>(null);
  const [emitirPdf, setEmitirPdf] = React.useState(true);
  const [enviarCorreo, setEnviarCorreo] = React.useState(true);
  const [enviarWhatsapp, setEnviarWhatsapp] = React.useState(true);

  React.useEffect(() => {
    if (abierto && tiposPermitidos.length > 0 && !tiposPermitidos.includes(tipo)) {
      setTipo(tiposPermitidos[0]);
    }
  }, [abierto, tiposPermitidos, tipo]);

  async function subirPdfAdjunto(file: File): Promise<string> {
    const anio = Number(fecha.slice(0, 4)) || new Date().getFullYear();
    const limpio = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const ruta = `adjuntos/tablero/${anio}/${Date.now()}-${limpio}`;
    const { error: uploadErr } = await supabase.storage
      .from("documentos")
      .upload(ruta, file, { contentType: file.type || "application/pdf", upsert: false });
    if (uploadErr) throw uploadErr;

    const { data: reg, error: regErr } = await db.documentos
      .from("archivo")
      .insert({
        bucket: "documentos",
        path: ruta,
        nombre: file.name,
        mime: file.type || "application/pdf",
        tamano: file.size,
      } as never)
      .select("id")
      .single();
    if (regErr) throw regErr;
    return (reg as { id: string }).id;
  }

  const publicar = useMutation({
    mutationFn: async () => {
      if (tipo === "orden_capitania") {
        const { data, error } = await supabase.functions.invoke("orden-capitania", {
          body: {
            numero: numero ? Number(numero) : undefined,
            fecha,
            materia: titulo,
            texto,
            enviar_correo: enviarCorreo,
            enviar_whatsapp: enviarWhatsapp,
          },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        return data as { despacho_resumen?: string };
      }

      let archivoId: string | null = null;
      if (archivoPdf) {
        archivoId = await subirPdfAdjunto(archivoPdf);
      }

      const { data, error } = await supabase.functions.invoke("despachar-comunicado", {
        body: {
          accion: "publicar",
          tipo,
          archivo_id: archivoId,
          emitir_pdf: !archivoId && emitirPdf,
          enviar_correo: enviarCorreo,
          enviar_whatsapp: enviarWhatsapp,
          datos: {
            numero: numero || undefined,
            fecha,
            vigente_hasta: tipo === "orden_dia" ? vigenteHasta || null : undefined,
            titulo,
            resumen: resumen || undefined,
            texto,
            fecha_evento: fechaEvento,
            hora_evento: horaEvento,
            lugar,
            tenida,
            obligatoria,
            detalle: texto,
          },
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { despacho_resumen?: string };
    },
    onSuccess: async (res) => {
      toast.success(`Publicado en el Tablero${res.despacho_resumen ? ` · ${res.despacho_resumen}` : ""}`);
      setTitulo("");
      setResumen("");
      setTexto("");
      setNumero("");
      setArchivoPdf(null);
      onCambio(false);
      await queryClient.invalidateQueries({ queryKey: ["tablero-cuartel"] });
      await queryClient.invalidateQueries({ queryKey: ["ordenes-capitania"] });
    },
    onError: (e) => toast.error(mensajeError(e)),
  });

  const valido =
    titulo.trim().length >= 3 &&
    (tipo === "citacion" ? Boolean(fechaEvento && horaEvento && lugar.trim()) : tipo === "circular_cbl" ? (texto.trim().length >= 5 || Boolean(archivoPdf) || resumen.trim().length >= 5) : texto.trim().length >= 10);

  return (
    <Dialog
      abierto={abierto}
      onCambio={onCambio}
      titulo="Publicar en el Tablero"
      descripcion="Se publica en el portal y se despacha según los canales seleccionados."
      tamano="lg"
      pie={
        <>
          <Button variant="outline" onClick={() => onCambio(false)}>
            Cancelar
          </Button>
          <Button onClick={() => publicar.mutate()} disabled={!valido || publicar.isPending}>
            <Send /> {publicar.isPending ? "Publicando y despachando…" : "Publicar y despachar"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="pub-tipo">Tipo de publicación</Label>
            <Select
              id="pub-tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoPublicacionTablero)}
            >
              {tiposPermitidos.map((t) => (
                <option key={t} value={t}>
                  {META_TIPO_TABLERO[t].etiqueta}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="pub-num">Número (opcional)</Label>
              <Input
                id="pub-num"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                placeholder="Auto"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pub-fecha">Fecha</Label>
              <Input
                id="pub-fecha"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="pub-titulo">
            {tipo === "orden_capitania" ? "Materia" : "Título"}
          </Label>
          <Input
            id="pub-titulo"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej: Academia práctica o Normativa de guardia"
          />
        </div>

        {tipo === "orden_dia" && (
          <div className="space-y-1.5">
            <Label htmlFor="pub-vigente">Vigente hasta</Label>
            <Input
              id="pub-vigente"
              type="date"
              value={vigenteHasta}
              onChange={(e) => setVigenteHasta(e.target.value)}
            />
          </div>
        )}

        {tipo === "citacion" && (
          <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="cit-fecha">Fecha del acto</Label>
                <Input
                  id="cit-fecha"
                  type="date"
                  value={fechaEvento}
                  onChange={(e) => setFechaEvento(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cit-hora">Hora</Label>
                <Input
                  id="cit-hora"
                  type="time"
                  value={horaEvento}
                  onChange={(e) => setHoraEvento(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cit-lugar">Lugar</Label>
                <Input
                  id="cit-lugar"
                  value={lugar}
                  onChange={(e) => setLugar(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cit-tenida">Tenida</Label>
              <Input
                id="cit-tenida"
                value={tenida}
                onChange={(e) => setTenida(e.target.value)}
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {TENIDAS_SUGERIDAS.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setTenida(sug)}
                    className="rounded-full border border-border bg-card px-2.5 py-1 text-xs hover:bg-accent"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 pt-1">
              <span className="text-sm font-medium">Citación de asistencia obligatoria</span>
              <Switch
                aria-label="Citación de asistencia obligatoria"
                checked={obligatoria}
                onCheckedChange={setObligatoria}
              />
            </div>
          </div>
        )}

        {(tipo === "circular_cbl" || tipo === "circular_compania") && (
          <div className="space-y-1.5">
            <Label htmlFor="pub-resumen">Resumen corto (para el tablero y WhatsApp)</Label>
            <Input
              id="pub-resumen"
              value={resumen}
              onChange={(e) => setResumen(e.target.value)}
              placeholder="Síntesis en 1 o 2 líneas"
            />
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="pub-texto">
            {tipo === "citacion" ? "Indicaciones / tabla (opcional)" : "Contenido completo"}
          </Label>
          <Textarea
            id="pub-texto"
            className="min-h-28"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Redacta el detalle para los voluntarios..."
          />
        </div>

        {tipo !== "orden_capitania" && (
          <div className="space-y-2 rounded-lg border border-border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label htmlFor="pub-pdf" className="flex items-center gap-2 font-medium">
                <FileUp className="size-4 text-primary" /> Adjuntar PDF existente (opcional)
              </Label>
              {archivoPdf && (
                <Badge variant="secondary">{archivoPdf.name}</Badge>
              )}
            </div>
            <Input
              id="pub-pdf"
              type="file"
              accept="application/pdf"
              onChange={(e) => setArchivoPdf(e.target.files?.[0] ?? null)}
            />
            {!archivoPdf && (
              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-sm text-muted-foreground">
                  Generar PDF institucional automático con folio y QR
                </span>
                <Switch checked={emitirPdf} onCheckedChange={setEmitirPdf} />
              </div>
            )}
          </div>
        )}

        <div className="space-y-2.5 rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-sm font-semibold">Canales de despacho simultáneo</p>
          <div className="flex items-center justify-between text-sm">
            <span>Portal y Tablero de Cuartel</span>
            <Badge variant="exito">Siempre activo</Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <Mail className="size-4 text-primary" /> Enviar al correo de cada bombero
            </span>
            <Switch checked={enviarCorreo} onCheckedChange={setEnviarCorreo} />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <MessageSquare className="size-4 text-primary" /> Enviar por WhatsApp (Meta 1-a-1)
            </span>
            <Switch checked={enviarWhatsapp} onCheckedChange={setEnviarWhatsapp} />
          </div>
        </div>
      </div>
    </Dialog>
  );
}
