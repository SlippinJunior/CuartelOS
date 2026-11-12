import * as React from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, FileText, ShieldCheck } from "lucide-react";
import { db, supabase } from "@/lib/supabase";
import { mensajeError } from "@/lib/errores";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { Persona } from "@/types/tipos";

interface ResultadoEmision {
  documento_id: string;
  tipo: string;
  anio: number;
  folio: number;
  token: string;
  url: string | null;
}

export function EmitirPage() {
  const search = useSearch({ strict: false }) as { persona?: string };
  const navigate = useNavigate();
  const [personaId, setPersonaId] = React.useState(search.persona ?? "");
  const [resultado, setResultado] = React.useState<ResultadoEmision | null>(null);
  const [enviando, setEnviando] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const { data: personas } = useQuery({
    queryKey: ["personal", "para-emitir"],
    queryFn: async () => {
      const { data, error } = await db.personal
        .from("persona")
        .select("id, registro, nombres, apellido_paterno, apellido_materno")
        .order("registro");
      if (error) throw error;
      return (data ?? []) as Persona[];
    },
  });

  const emitir = async () => {
    if (!personaId) return;
    setEnviando(true);
    setError(null);
    setResultado(null);
    try {
      const { data, error } = await supabase.functions.invoke("emitir-documento", {
        body: { tipo: "P3", persona_id: personaId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResultado(data as ResultadoEmision);
      toast.success("Hoja de vida emitida");
    } catch (e) {
      setError(mensajeError(e));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        titulo="Emitir hoja de vida"
        descripcion="Documento P3 con folio, huella SHA-256 y código QR de verificación."
        volverA="/documentos"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="size-5 text-primary" /> Nueva emisión</CardTitle>
          <CardDescription>
            El PDF se genera con los datos vigentes de la ficha. Los datos sensibles nunca se incluyen.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="persona">Bombero</Label>
            <Select id="persona" value={personaId} onChange={(e) => setPersonaId(e.target.value)}>
              <option value="">Seleccionar…</option>
              {(personas ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.registro} · {p.nombres} {p.apellido_paterno} {p.apellido_materno ?? ""}
                </option>
              ))}
            </Select>
          </div>

          <div className="rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
            <p className="flex items-center gap-2 font-medium text-foreground"><ShieldCheck className="size-4 text-exito" /> Qué incluye la hoja de vida</p>
            <p className="mt-1">
              Identificación, antigüedad, cargo actual, asistencia del año, cargos, formación, premios, material a
              cargo, cuotas y campaña. Sin grupo sanguíneo, alergias ni contacto de emergencia.
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-peligro/10 p-3 text-sm text-peligro">
              <p className="font-medium">No se pudo emitir</p>
              <p>{error}</p>
              <p className="mt-1 text-xs">
                Verifica que la Edge Function <code>emitir-documento</code> esté desplegada
                (<code>supabase functions serve</code>) y que el bucket <code>documentos</code> exista.
              </p>
            </div>
          )}

          {resultado && (
            <div className="rounded-md border border-exito/40 bg-exito/10 p-4">
              <p className="font-medium text-exito">Documento emitido</p>
              <p className="mt-1 text-sm">
                Folio {resultado.anio}-{String(resultado.folio).padStart(4, "0")}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => void navigate({ to: "/verificar/$token", params: { token: resultado.token } })}>
                  <ShieldCheck /> Verificar
                </Button>
                {resultado.url && (
                  <a href={resultado.url} target="_blank" rel="noreferrer">
                    <Button variant="outline"><Download /> Descargar PDF</Button>
                  </a>
                )}
                <Link to="/documentos" className="self-center text-sm text-primary hover:underline">
                  Volver al historial
                </Link>
              </div>
            </div>
          )}

          <Button className="w-full" onClick={() => void emitir()} disabled={!personaId || enviando}>
            {enviando ? "Generando PDF…" : "Emitir documento"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
