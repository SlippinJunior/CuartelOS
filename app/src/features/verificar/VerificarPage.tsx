import * as React from "react";
import { useParams } from "@tanstack/react-router";
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

interface Estado {
  cargando: boolean;
  error: boolean;
  dato: Verificacion | null;
}

/**
 * Página pública. Se consulta con estado local en vez de React Query para
 * que funcione igual fuera de la sesión y del layout protegido.
 */
export function VerificarPage() {
  const { token } = useParams({ strict: false }) as { token: string };
  const [estado, setEstado] = React.useState<Estado>({ cargando: true, error: false, dato: null });

  React.useEffect(() => {
    let vivo = true;
    setEstado({ cargando: true, error: false, dato: null });

    db.documentos
      .rpc("verificar_documento", { p_token: token })
      .then(({ data, error }) => {
        if (!vivo) return;
        if (error) {
          setEstado({ cargando: false, error: true, dato: null });
          return;
        }
        const filas = (data ?? []) as Verificacion[];
        setEstado({ cargando: false, error: false, dato: filas[0] ?? null });
      });

    return () => {
      vivo = false;
    };
  }, [token]);

  const { dato, cargando, error } = estado;

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
              {cargando ? "Consultando…" : dato?.valido ? <BadgeCheck className="text-exito" /> : <ShieldX className="text-peligro" />}
              {cargando ? "Verificando documento" : dato?.valido ? "Documento válido" : "Documento no válido"}
            </CardTitle>
            <CardDescription>
              Esta consulta no muestra datos personales. Solo confirma la existencia y vigencia del folio.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {cargando && <Skeleton className="h-24 w-full" />}
            {error && (
              <div className="flex items-center gap-2 rounded-md bg-peligro/10 p-3 text-sm text-peligro">
                <ShieldAlert className="size-4" /> No se pudo consultar el documento.
              </div>
            )}
            {!cargando && !error && !dato && (
              <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                No existe un documento con este código. Revisa el enlace o el código QR.
              </p>
            )}
            {dato && (
              <dl className="space-y-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Tipo</dt>
                  <dd className="font-medium">{dato.tipo}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Folio</dt>
                  <dd className="font-mono font-medium">{dato.folio}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Emitido</dt>
                  <dd className="font-medium">{formatearFechaHora(dato.emitido_en)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Estado</dt>
                  <dd>
                    <Badge variant={dato.valido ? "exito" : "peligro"}>
                      {dato.valido ? "Vigente" : "Anulado"}
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
