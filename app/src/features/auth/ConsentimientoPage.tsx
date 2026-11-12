import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { usePerfil, useSesion } from "@/features/auth/sesion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { mensajeError } from "@/lib/errores";
import { Redirigir } from "@/components/common/Redirigir";

export function ConsentimientoPage() {
  const { data: perfil, isLoading } = usePerfil();
  const { salir } = useSesion();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [aceptado, setAceptado] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [enviando, setEnviando] = React.useState(false);

  if (!isLoading && perfil?.consentimiento?.aceptado) return <Redirigir a="/" />;

  const aceptar = async () => {
    setEnviando(true);
    setError(null);
    const { error: e } = await supabase.schema("nucleo").rpc("aceptar_consentimiento", {
      p_version: perfil?.consentimiento?.version ?? null,
    });
    setEnviando(false);
    if (e) {
      setError(mensajeError(e));
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["perfil"] });
    await navigate({ to: "/" });
  };

  return (
    <div className="mx-auto max-w-2xl py-4">
      <Card>
        <CardHeader>
          <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck />
          </div>
          <CardTitle>{perfil?.consentimiento?.titulo ?? "Consentimiento de datos personales"}</CardTitle>
          <CardDescription>
            Antes de continuar necesitamos tu consentimiento para tratar datos personales y de salud
            estrictamente necesarios para el servicio bomberil (Ley 21.719).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-h-64 overflow-y-auto rounded-md border border-border bg-muted/40 p-3 text-sm leading-relaxed">
            {perfil?.consentimiento?.texto ?? "Cargando el texto…"}
          </div>
          <p className="text-xs text-muted-foreground">
            Versión {perfil?.consentimiento?.version ?? "—"}. Este texto es un borrador y debe ser validado por el
            Directorio o asesoría legal antes de usarse con bomberos reales.
          </p>
          <label className="flex items-start gap-3 rounded-md border border-border p-3 text-sm">
            <input
              type="checkbox"
              className="mt-1 size-5 accent-[var(--primario)]"
              checked={aceptado}
              onChange={(e) => setAceptado(e.target.checked)}
            />
            <span>He leído y acepto el tratamiento de mis datos personales en los términos descritos.</span>
          </label>
          {error && <p className="rounded-md bg-peligro/10 p-2 text-sm text-peligro">{error}</p>}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button className="sm:flex-1" onClick={() => void aceptar()} disabled={!aceptado || enviando}>
              {enviando ? "Registrando…" : "Aceptar y continuar"}
            </Button>
            <Button variant="outline" onClick={() => void salir()}>
              Cerrar sesión
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
