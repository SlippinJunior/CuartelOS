import * as React from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { FilePlus2, FileText, ShieldCheck } from "lucide-react";
import { db, supabase } from "@/lib/supabase";
import { mensajeError } from "@/lib/errores";
import { usePerfil } from "@/features/auth/sesion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ResponsiveList, type Columna } from "@/components/common/ResponsiveList";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { formatearFechaHora } from "@/lib/formato";
import type { DocumentoEmitido } from "@/types/tipos";

interface PersonaDocumento {
  id: string;
  nombres: string;
  apellido_paterno: string;
}

export function EmitidosTab() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: perfil } = usePerfil();
  const esOficial = perfil?.es_oficial ?? false;
  const [anular, setAnular] = React.useState<DocumentoEmitido | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["documentos-emitidos"],
    queryFn: async () => {
      const { data, error } = await db.documentos
        .from("documento_emitido")
        .select("*")
        .order("emitido_en", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DocumentoEmitido[];
    },
  });

  const personaIds = React.useMemo(
    () => Array.from(new Set((data ?? []).map((d) => d.persona_id).filter(Boolean))) as string[],
    [data],
  );

  const { data: personas } = useQuery({
    queryKey: ["documentos-personas", personaIds.join(",")],
    queryFn: async () => {
      const { data, error } = await db.personal
        .from("persona")
        .select("id, nombres, apellido_paterno")
        .in("id", personaIds);
      if (error) throw error;
      return (data ?? []) as PersonaDocumento[];
    },
    enabled: personaIds.length > 0,
  });

  const nombrePersona = (id: string | null) => {
    const p = (personas ?? []).find((x) => x.id === id);
    return p ? `${p.nombres} ${p.apellido_paterno}` : "—";
  };

  const anularMut = useMutation({
    mutationFn: async ({ id, motivo }: { id: string; motivo: string }) => {
      const { error } = await supabase.schema("documentos").rpc("anular_documento", {
        p_id: id,
        p_motivo: motivo,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Documento anulado");
      setAnular(null);
      await queryClient.invalidateQueries({ queryKey: ["documentos-emitidos"] });
    },
    onError: (e) => toast.error(mensajeError(e)),
  });

  const columnas: Columna<DocumentoEmitido>[] = [
    {
      clave: "tipo",
      titulo: "Documento",
      render: (d) => (
        <div>
          <p className="font-medium">{d.tipo_documento_codigo}</p>
          <p className="text-xs text-muted-foreground">Folio {d.anio}-{String(d.folio).padStart(4, "0")}</p>
        </div>
      ),
    },
    { clave: "persona", titulo: "Persona", render: (d) => nombrePersona(d.persona_id) },
    { clave: "fecha", titulo: "Emitido", render: (d) => formatearFechaHora(d.emitido_en) },
    {
      clave: "estado",
      titulo: "Estado",
      render: (d) => <Badge variant={d.anulado ? "peligro" : "exito"}>{d.anulado ? "Anulado" : "Válido"}</Badge>,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="size-4 text-exito" />
          Cada documento lleva folio, SHA-256 y verificación pública.
        </div>
        <Button onClick={() => void navigate({ to: "/documentos/emitir" })}>
          <FilePlus2 /> Emitir hoja de vida
        </Button>
      </div>

      <ResponsiveList
        filas={data ?? []}
        columnas={columnas}
        claveFila={(d) => d.id}
        cargando={isLoading}
        renderTarjeta={(d) => (
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium">{d.tipo_documento_codigo} · {d.anio}-{String(d.folio).padStart(4, "0")}</p>
              <p className="text-sm text-muted-foreground">{nombrePersona(d.persona_id)}</p>
              <p className="text-xs text-muted-foreground">{formatearFechaHora(d.emitido_en)}</p>
            </div>
            <Badge variant={d.anulado ? "peligro" : "exito"}>{d.anulado ? "Anulado" : "Válido"}</Badge>
          </div>
        )}
        vacio={
          <EmptyState
            titulo="Sin documentos emitidos"
            descripcion="Emite una hoja de vida para comenzar el historial."
            icono={FileText}
            accion={
              <Button variant="outline" onClick={() => void navigate({ to: "/documentos/emitir" })}>
                <FilePlus2 /> Emitir el primero
              </Button>
            }
          />
        }
      />

      {(data ?? []).length > 0 && (
        <div className="space-y-2">
          {(data ?? []).map((d) => (
            <div key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3 text-sm">
              <div>
                <span className="font-medium">{d.tipo_documento_codigo} {d.anio}-{String(d.folio).padStart(4, "0")}</span>
                <span className="ml-2 text-muted-foreground">{d.anulado ? `Anulado: ${d.motivo_anulacion}` : nombrePersona(d.persona_id)}</span>
              </div>
              <div className="flex items-center gap-3">
                <Link to="/verificar/$token" params={{ token: d.token_verificacion }} className="text-primary hover:underline">
                  Verificar
                </Link>
                {esOficial && !d.anulado && (
                  <Button variant="ghost" size="sm" className="text-peligro" onClick={() => setAnular(d)}>
                    Anular
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        abierto={Boolean(anular)}
        onCambio={(v) => !v && setAnular(null)}
        titulo="Anular documento"
        descripcion="La verificación pública pasará a inválida. La acción queda auditada."
        textoConfirmar="Anular"
        variante="destructive"
        pideMotivo
        procesando={anularMut.isPending}
        onConfirmar={(motivo) => {
          if (anular) anularMut.mutate({ id: anular.id, motivo });
        }}
      />
    </div>
  );
}
