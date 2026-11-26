import * as React from "react";
import { Link } from "@tanstack/react-router";
import { CalendarDays, Clock, Download, MapPin, ShieldCheck, Shirt } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { formatearFecha } from "@/lib/formato";
import { META_TIPO_TABLERO } from "@/features/tablero/logica";
import { MonitorDespacho } from "@/features/tablero/MonitorDespacho";
import type { PublicacionTablero } from "@/types/tipos";

export function DialogoDetalleComunicado({
  publicacion,
  onCambio,
  esOficial = false,
}: {
  publicacion: PublicacionTablero | null;
  onCambio: (v: boolean) => void;
  esOficial?: boolean;
}) {
  const [urlPdf, setUrlPdf] = React.useState<string | null>(null);

  React.useEffect(() => {
    let vivo = true;
    if (publicacion?.archivo_bucket && publicacion.archivo_path) {
      void supabase.storage
        .from(publicacion.archivo_bucket)
        .createSignedUrl(publicacion.archivo_path, 3600)
        .then(({ data }) => {
          if (vivo) setUrlPdf(data?.signedUrl ?? null);
        });
    } else {
      setUrlPdf(null);
    }
    return () => {
      vivo = false;
    };
  }, [publicacion]);

  if (!publicacion) return null;

  const meta = META_TIPO_TABLERO[publicacion.tipo];

  const contenidoPrincipal = (
    <div className="space-y-4 text-base">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={meta.badgeVariant}>{meta.etiqueta}</Badge>
        <Badge variant="outline">N° {publicacion.numero}/{publicacion.anio}</Badge>
        <Badge variant="secondary">{formatearFecha(publicacion.fecha)}</Badge>
        {publicacion.obligatoria && <Badge variant="peligro">Asistencia obligatoria</Badge>}
        {publicacion.token_verificacion && (
          <Link to="/verificar/$token" params={{ token: publicacion.token_verificacion }}>
            <Badge variant="outline">
              <ShieldCheck className="mr-1 size-3.5" /> Verificar QR
            </Badge>
          </Link>
        )}
      </div>

      {publicacion.tipo === "citacion" && (
        <div className="grid gap-2 rounded-lg border border-border bg-muted/40 p-3 text-sm sm:grid-cols-2">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-primary" />
            <span>
              <strong>Fecha:</strong> {formatearFecha(publicacion.fecha_evento)}
            </span>
          </div>
          {publicacion.hora_evento && (
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-primary" />
              <span>
                <strong>Hora:</strong> {publicacion.hora_evento.slice(0, 5)} h
              </span>
            </div>
          )}
          {publicacion.lugar && (
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-primary" />
              <span>
                <strong>Lugar:</strong> {publicacion.lugar}
              </span>
            </div>
          )}
          {publicacion.tenida && (
            <div className="flex items-center gap-2">
              <Shirt className="size-4 text-primary" />
              <span>
                <strong>Tenida:</strong> {publicacion.tenida}
              </span>
            </div>
          )}
        </div>
      )}

      {publicacion.vigente_hasta && publicacion.tipo === "orden_dia" && (
        <p className="text-sm text-muted-foreground">
          Vigente hasta el <strong>{formatearFecha(publicacion.vigente_hasta)}</strong>.
        </p>
      )}

      <div className="whitespace-pre-wrap rounded-lg border border-border bg-card p-4 text-base leading-relaxed">
        {publicacion.texto || publicacion.resumen || "Sin contenido adicional."}
      </div>
    </div>
  );

  return (
    <Dialog
      abierto={Boolean(publicacion)}
      onCambio={onCambio}
      titulo={publicacion.titulo}
      descripcion={`${meta.etiqueta} N° ${publicacion.numero}/${publicacion.anio}`}
      tamano="lg"
      pie={
        <>
          <Button variant="outline" onClick={() => onCambio(false)}>
            Cerrar
          </Button>
          {urlPdf && (
            <a href={urlPdf} target="_blank" rel="noreferrer">
              <Button>
                <Download /> Abrir PDF
              </Button>
            </a>
          )}
        </>
      }
    >
      {esOficial ? (
        <Tabs
          items={[
            { id: "detalle", etiqueta: "Comunicado", contenido: contenidoPrincipal },
            {
              id: "despacho",
              etiqueta: "Despacho (Correo / WhatsApp)",
              contenido: (
                <MonitorDespacho origenTipo={publicacion.tipo} origenId={publicacion.id} />
              ),
            },
          ]}
        />
      ) : (
        contenidoPrincipal
      )}
    </Dialog>
  );
}
