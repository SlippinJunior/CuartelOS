import { useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, ShieldAlert, ShieldX } from "lucide-react";
import { db } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatearFechaHora } from "@/lib/formato";

interface Verificacion {
  tipo: string;
  folio: string;
  emitido_en: string;
  valido: boolean;
}

export function VerificarPage() {
  const { token } = useParams({ strict: false }) as { token: string };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["verificar", token],
    queryFn: async () => {
      const { data, error } = await db.documentos.rpc("verificar_documento", { p_token: token });
      if (error) throw error;
      const filas = (data ?? []) as Verificacion[];
      return filas[0] ?? null;
    },
    retry: false,
  });

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg space-y-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <img src="/escudo.png" alt="Escudo" className="size-16 object-contain" />
          <p className="text-sm font-medium">Segunda Compañía de Bomberos de Limache</p>
          <p className="text-xs text-muted-foreground">Verificación pública de documentos</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isLoading ? "Consultando…" : data?.valido ? <BadgeCheck className="text-exito" /> : <ShieldX className="text-peligro" />}
              {isLoading ? "Verificando documento" : data?.valido ? "Documento válido" : "Documento no válido"}
            </CardTitle>
            <CardDescription>
              Esta consulta no muestra datos personales. Solo confirma la existencia y vigencia del folio.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading && <Skeleton className="h-24 w-full" />}
            {isError && (
              <div className="flex items-center gap-2 rounded-md bg-peligro/10 p-3 text-sm text-peligro">
                <ShieldAlert className="size-4" /> No se pudo consultar el documento.
              </div>
            )}
            {!isLoading && !isError && !data && (
              <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                No existe un documento con este código. Revisa el enlace o el código QR.
              </p>
            )}
            {data && (
              <dl className="space-y-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Tipo</dt>
                  <dd className="font-medium">{data.tipo}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Folio</dt>
                  <dd className="font-mono font-medium">{data.folio}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Emitido</dt>
                  <dd className="font-medium">{formatearFechaHora(data.emitido_en)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Estado</dt>
                  <dd>
                    <Badge variant={data.valido ? "exito" : "peligro"}>
                      {data.valido ? "Vigente" : "Anulado"}
                    </Badge>
                  </dd>
                </div>
              </dl>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Documento emitido por el sistema de gestión de la Segunda Compañía. La verificación es informativa y no
          reemplaza el original firmado.
        </p>
      </div>
    </div>
  );
}
