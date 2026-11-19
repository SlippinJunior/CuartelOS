import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Download } from "lucide-react";
import { db, supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { formatearFecha } from "@/lib/formato";

interface ActaAprobada {
  id: number;
  numero: number;
  anio: number;
  fecha: string;
  texto: string | null;
  tipo_sesion?: { nombre: string } | null;
}

interface AcuerdoLite {
  id: number;
  acta_id: number;
  numero: number;
  texto: string;
  estado: string;
}

/** Vista de solo lectura de actas aprobadas y acuerdos para los bomberos. */
export function ActasAprobadas() {
  const { data, isLoading } = useQuery({
    queryKey: ["documentos", "actas-aprobadas"],
    queryFn: async () => {
      const { data, error } = await db.secretaria
        .from("acta")
        .select("id, numero, anio, fecha, texto")
        .not("aprobada_en_acta_id", "is", null)
        .order("fecha", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ActaAprobada[];
    },
  });

  const { data: acuerdos } = useQuery({
    queryKey: ["documentos", "acuerdos"],
    queryFn: async () => {
      const { data, error } = await db.secretaria.from("acuerdo").select("id, acta_id, numero, texto, estado").order("numero");
      if (error) throw error;
      return (data ?? []) as AcuerdoLite[];
    },
  });

  const [pdf, setPdf] = React.useState<Record<number, string | null>>({});

  const abrirPdf = async (actaId: number) => {
    if (pdf[actaId]) {
      window.open(pdf[actaId]!, "_blank");
      return;
    }
    const { data: doc } = await db.documentos
      .from("documento_emitido")
      .select("pdf_archivo_id")
      .eq("referencia", `ACTA:${actaId}`)
      .limit(1)
      .maybeSingle();
    const archivoId = (doc as { pdf_archivo_id: string | null } | null)?.pdf_archivo_id;
    if (!archivoId) return;
    const { data: archivo } = await db.documentos
      .from("archivo")
      .select("bucket, path")
      .eq("id", archivoId)
      .maybeSingle();
    const fila = archivo as { bucket: string; path: string } | null;
    if (!fila) return;
    const { data: firmada } = await supabase.storage.from(fila.bucket).createSignedUrl(fila.path, 3600);
    if (firmada?.signedUrl) {
      setPdf((p) => ({ ...p, [actaId]: firmada.signedUrl }));
      window.open(firmada.signedUrl, "_blank");
    }
  };

  if (isLoading) return <Skeleton className="h-32 w-full" />;

  if ((data ?? []).length === 0) {
    return <EmptyState titulo="Sin actas aprobadas" descripcion="Cuando el acta se apruebe aparecerá aquí." icono={BookOpen} />;
  }

  return (
    <div className="space-y-3">
      {(data ?? []).map((a) => {
        const deEstaActa = (acuerdos ?? []).filter((x) => x.acta_id === a.id);
        return (
          <Card key={a.id}>
            <CardHeader className="flex-row items-start justify-between gap-2 pb-2">
              <CardTitle className="text-base">
                Acta N° {a.numero}/{a.anio}
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  {a.tipo_sesion?.nombre ?? ""} · {formatearFecha(a.fecha)}
                </span>
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => void abrirPdf(a.id)}>
                <Download /> PDF
              </Button>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {a.texto && <p className="line-clamp-3 text-muted-foreground">{a.texto}</p>}
              {deEstaActa.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Acuerdos</p>
                  <ol className="mt-1 list-inside list-decimal space-y-1">
                    {deEstaActa.map((ac) => (
                      <li key={ac.id} className="flex items-center justify-between gap-2">
                        <span>{ac.texto}</span>
                        <Badge variant="outline">{ac.estado.replace("_", " ")}</Badge>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
