import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Mail, MessageSquare, RefreshCw } from "lucide-react";
import { db, supabase } from "@/lib/supabase";
import { mensajeError } from "@/lib/errores";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Despacho, DespachoDetalle, TipoPublicacionTablero } from "@/types/tipos";

export function MonitorDespacho({
  origenTipo,
  origenId,
}: {
  origenTipo: TipoPublicacionTablero;
  origenId: number;
}) {
  const queryClient = useQueryClient();

  const despachoQ = useQuery({
    queryKey: ["despacho", origenTipo, origenId],
    queryFn: async () => {
      const { data, error } = await db.nucleo
        .from("despacho")
        .select("*")
        .eq("origen_tipo", origenTipo)
        .eq("origen_id", origenId)
        .order("creado_en", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as Despacho | null;
    },
  });

  const detallesQ = useQuery({
    queryKey: ["despacho-detalle", despachoQ.data?.id],
    queryFn: async () => {
      const { data, error } = await db.nucleo
        .from("despacho_detalle")
        .select("*")
        .eq("despacho_id", despachoQ.data!.id)
        .order("canal")
        .order("nombre");
      if (error) throw error;
      return (data ?? []) as DespachoDetalle[];
    },
    enabled: Boolean(despachoQ.data?.id),
  });

  const reintentar = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("despachar-comunicado", {
        body: { accion: "reintentar", despacho_id: despachoQ.data!.id, canal: "ambos" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as { correo_reintentados_ok?: number; whatsapp_reintentados_ok?: number };
    },
    onSuccess: async (res) => {
      toast.success(
        `Reintento completado: ${res.correo_reintentados_ok ?? 0} correos y ${res.whatsapp_reintentados_ok ?? 0} WhatsApp enviados.`,
      );
      await queryClient.invalidateQueries({ queryKey: ["despacho", origenTipo, origenId] });
      await queryClient.invalidateQueries({ queryKey: ["despacho-detalle", despachoQ.data?.id] });
    },
    onError: (e) => toast.error(mensajeError(e)),
  });

  if (despachoQ.isLoading) return <Skeleton className="h-24 w-full" />;
  if (!despachoQ.data) {
    return (
      <p className="rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
        Sin registro de despacho automático para esta publicación.
      </p>
    );
  }

  const d = despachoQ.data;
  const detalles = detallesQ.data ?? [];
  const hayPendientes = detalles.some((f) => f.estado === "fallido" || f.estado === "no_configurado");

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">Estado del despacho</p>
        {hayPendientes && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => reintentar.mutate()}
            disabled={reintentar.isPending}
          >
            <RefreshCw className={reintentar.isPending ? "animate-spin" : ""} />
            {reintentar.isPending ? "Reintentando…" : "Reintentar pendientes"}
          </Button>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="flex items-center justify-between rounded-md border border-border bg-card p-2.5 text-sm">
          <span className="flex items-center gap-2 font-medium">
            <Mail className="size-4 text-primary" /> Correo
          </span>
          <Badge variant={d.correo_error ? "aviso" : "exito"}>
            {d.correo_enviados}/{d.correo_total} enviados
          </Badge>
        </div>
        <div className="flex items-center justify-between rounded-md border border-border bg-card p-2.5 text-sm">
          <span className="flex items-center gap-2 font-medium">
            <MessageSquare className="size-4 text-primary" /> WhatsApp (Meta)
          </span>
          <Badge variant={d.whatsapp_error ? "aviso" : "exito"}>
            {d.whatsapp_enviados}/{d.whatsapp_total} enviados
          </Badge>
        </div>
      </div>

      {d.whatsapp_error && (
        <p className="rounded-md bg-aviso/10 p-2 text-xs text-aviso">{d.whatsapp_error}</p>
      )}

      {detalles.length > 0 && (
        <div className="max-h-48 space-y-1 overflow-y-auto pr-1">
          {detalles.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-2 rounded border border-border bg-card px-2.5 py-1.5 text-xs"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {item.nombre ?? "Destinatario"} · <span className="uppercase">{item.canal}</span>
                </p>
                <p className="truncate text-muted-foreground">{item.destino ?? "Sin dato"}</p>
              </div>
              <Badge
                variant={
                  item.estado === "enviado"
                    ? "exito"
                    : item.estado === "fallido"
                      ? "peligro"
                      : "apagado"
                }
              >
                {item.estado.replace("_", " ")}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
