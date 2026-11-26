import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RotateCcw, Save, ShieldCheck } from "lucide-react";
import { db } from "@/lib/supabase";
import { mensajeError } from "@/lib/errores";
import {
  etiquetaRol,
  MODULOS_CONFIGURABLES,
  nivelPorRoles,
  SECCIONES,
  type Seccion,
} from "@/lib/permisos";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { NivelPermiso, UsuarioAdmin } from "@/types/tipos";

type ValorSelector = "heredado" | NivelPermiso;

const ETIQUETA_NIVEL: Record<NivelPermiso, string> = {
  ninguno: "Sin acceso",
  lectura: "Lectura",
  gestion: "Gestión",
};

export function PermisosUsuarioDialog({
  usuario,
  onCerrar,
}: {
  usuario: UsuarioAdmin | null;
  onCerrar: () => void;
}) {
  const queryClient = useQueryClient();
  const [valores, setValores] = React.useState<Record<string, ValorSelector>>({});

  React.useEffect(() => {
    if (!usuario) return;
    const mapa: Record<string, ValorSelector> = {};
    for (const m of MODULOS_CONFIGURABLES) {
      const ex = usuario.permisos_modulo?.find((p) => p.modulo === m);
      mapa[m] = ex ? ex.nivel : "heredado";
    }
    setValores(mapa);
  }, [usuario]);

  const guardar = useMutation({
    mutationFn: async () => {
      if (!usuario) return;
      for (const m of MODULOS_CONFIGURABLES) {
        const val = valores[m] ?? "heredado";
        const previo = usuario.permisos_modulo?.find((p) => p.modulo === m)?.nivel ?? "heredado";
        if (val === previo) continue;
        const { error } = await db.nucleo.rpc("admin_definir_permiso_modulo", {
          p_user_id: usuario.user_id,
          p_modulo: m,
          p_nivel: val === "heredado" ? null : val,
        });
        if (error) throw error;
      }
    },
    onSuccess: async () => {
      toast.success("Permisos por módulo actualizados");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["usuarios-admin"] }),
        queryClient.invalidateQueries({ queryKey: ["mi-perfil"] }),
      ]);
      onCerrar();
    },
    onError: (e) => toast.error(mensajeError(e)),
  });

  const esAdmin = usuario?.roles.includes("admin") ?? false;
  const esCuartel =
    Boolean(usuario?.roles.includes("cuartel")) &&
    (usuario?.roles.every((r) => r === "cuartel") ?? false);

  return (
    <Dialog
      abierto={Boolean(usuario)}
      onCambio={(v) => !v && onCerrar()}
      titulo={`Permisos por módulo · ${usuario?.nombre ?? usuario?.email ?? ""}`}
      descripcion="Los roles asignan bloques automáticos. Aquí puedes agregar excepciones puntuales por módulo."
      pie={
        <>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              const limpio: Record<string, ValorSelector> = {};
              for (const m of MODULOS_CONFIGURABLES) limpio[m] = "heredado";
              setValores(limpio);
            }}
            disabled={esAdmin || esCuartel}
          >
            <RotateCcw /> Restaurar al rol
          </Button>
          <Button variant="outline" onClick={onCerrar}>Cancelar</Button>
          <Button onClick={() => guardar.mutate()} disabled={guardar.isPending || esAdmin || esCuartel}>
            <Save /> Guardar permisos
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-border bg-muted/40 p-2.5 text-xs">
          <ShieldCheck className="size-4 text-primary" />
          <span className="font-medium">Roles actuales:</span>
          {usuario?.roles.length ? (
            usuario.roles.map((r) => (
              <Badge key={r} variant="secondary">{etiquetaRol(r)}</Badge>
            ))
          ) : (
            <span className="text-muted-foreground">Sin roles</span>
          )}
        </div>

        {(esAdmin || esCuartel) && (
          <p className="rounded-md bg-aviso/10 p-2.5 text-sm text-aviso">
            {esAdmin
              ? "El rol Administrador tiene acceso total automático a todos los módulos."
              : "Las cuentas Pantalla de Cuartel quedan aisladas exclusivamente en el Tablero."}
          </p>
        )}

        <div className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
          {MODULOS_CONFIGURABLES.map((m: Seccion) => {
            const heredado = nivelPorRoles(usuario?.roles ?? [], m);
            const actual = valores[m] ?? "heredado";
            return (
              <div
                key={m}
                className="flex flex-col gap-2 rounded-md border border-border p-2.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{SECCIONES[m].titulo}</p>
                  <p className="text-xs text-muted-foreground">
                    Por rol: {ETIQUETA_NIVEL[heredado]}
                  </p>
                </div>
                <Select
                  aria-label={`Permiso para ${SECCIONES[m].titulo}`}
                  className="sm:w-52"
                  value={actual}
                  disabled={esAdmin || esCuartel}
                  onChange={(e) => setValores({ ...valores, [m]: e.target.value as ValorSelector })}
                >
                  <option value="heredado">Heredado ({ETIQUETA_NIVEL[heredado]})</option>
                  <option value="ninguno">Sin acceso</option>
                  <option value="lectura">Lectura</option>
                  <option value="gestion">Gestión</option>
                </Select>
              </div>
            );
          })}
        </div>
      </div>
    </Dialog>
  );
}
