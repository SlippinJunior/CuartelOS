import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Save, UserPlus, Users } from "lucide-react";
import { db, supabase } from "@/lib/supabase";
import { mensajeError } from "@/lib/errores";
import { usePerfil } from "@/features/auth/sesion";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState } from "@/components/common/EmptyState";
import { ROLES, etiquetaRol } from "@/lib/permisos";
import type { Cargo, Parametro, Persona, UsuarioAdmin } from "@/types/tipos";

export function AdministracionPage() {
  const { data: perfil } = usePerfil();
  const puede = perfil?.roles.some((r) => ["admin", "director"].includes(r)) ?? false;

  if (!puede) {
    return <EmptyState titulo="Sin acceso" descripcion="Solo el Director y el administrador pueden entrar aquí." icono={Users} />;
  }

  return (
    <div>
      <PageHeader titulo="Administración" descripcion="Usuarios, roles, catálogos y parámetros del sistema." />
      <Tabs
        items={[
          { id: "usuarios", etiqueta: "Usuarios y roles", contenido: <UsuariosTab /> },
          { id: "catalogos", etiqueta: "Catálogos", contenido: <CatalogosTab /> },
          { id: "parametros", etiqueta: "Parámetros", contenido: <ParametrosTab /> },
        ]}
      />
    </div>
  );
}

function UsuariosTab() {
  const queryClient = useQueryClient();
  const [invitar, setInvitar] = React.useState(false);
  const [asignar, setAsignar] = React.useState<UsuarioAdmin | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["usuarios-admin"],
    queryFn: async () => {
      const { data, error } = await db.nucleo.rpc("listar_usuarios");
      if (error) throw error;
      return (data ?? []) as UsuarioAdmin[];
    },
  });

  const revocar = useMutation({
    mutationFn: async ({ userId, rol }: { userId: string; rol: string }) => {
      const { error } = await db.nucleo.rpc("admin_revocar_rol", {
        p_user_id: userId,
        p_rol: rol,
        p_motivo: "Revocación desde Administración",
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Rol revocado");
      await queryClient.invalidateQueries({ queryKey: ["usuarios-admin"] });
    },
    onError: (e) => toast.error(mensajeError(e)),
  });

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Usuarios del sistema</CardTitle>
        <Button onClick={() => setInvitar(true)}><UserPlus /> Invitar</Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading && <p className="text-sm text-muted-foreground">Cargando…</p>}
        {(data ?? []).map((u) => (
          <div key={u.user_id} className="flex flex-col gap-2 rounded-md border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">{u.nombre ?? u.email ?? "Sin nombre"}</p>
              <p className="text-xs text-muted-foreground">
                {u.email} {u.registro ? `· Registro ${u.registro}` : ""} {u.activo ? "" : "· Inactivo"}
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {u.roles.length === 0 && <Badge variant="apagado">Sin rol</Badge>}
                {u.roles.map((r) => (
                  <button key={r} type="button" onClick={() => revocar.mutate({ userId: u.user_id, rol: r })} title="Revocar rol">
                    <Badge variant="secondary" className="cursor-pointer hover:bg-peligro/15">{etiquetaRol(r)} ×</Badge>
                  </button>
                ))}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setAsignar(u)}><Plus /> Rol</Button>
          </div>
        ))}
        <p className="text-xs text-muted-foreground">
          Los roles son manuales y no dependen del cargo. Haz clic en un rol para revocarlo.
        </p>
      </CardContent>

      <InvitarDialog abierto={invitar} onCambio={setInvitar} />
      <AsignarRolDialog usuario={asignar} onCambio={(v) => !v && setAsignar(null)} />
    </Card>
  );
}

function InvitarDialog({ abierto, onCambio }: { abierto: boolean; onCambio: (v: boolean) => void }) {
  const queryClient = useQueryClient();
  const [email, setEmail] = React.useState("");
  const [personaId, setPersonaId] = React.useState("");
  const [rol, setRol] = React.useState("bombero");

  const { data: personas } = useQuery({
    queryKey: ["personal", "sin-usuario"],
    queryFn: async () => {
      const { data, error } = await db.personal
        .from("persona")
        .select("id, registro, nombres, apellido_paterno")
        .eq("estado", "activo")
        .order("registro");
      if (error) throw error;
      return (data ?? []) as Persona[];
    },
    enabled: abierto,
  });

  const invitar = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("invitar-usuario", {
        body: { email: email.trim(), persona_id: personaId, rol },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
    },
    onSuccess: async () => {
      toast.success("Invitación enviada");
      setEmail("");
      setPersonaId("");
      onCambio(false);
      await queryClient.invalidateQueries({ queryKey: ["usuarios-admin"] });
    },
    onError: (e) => toast.error(mensajeError(e)),
  });

  return (
    <Dialog
      abierto={abierto}
      onCambio={onCambio}
      titulo="Invitar usuario"
      descripcion="Solo por invitación: se envía un correo para establecer la contraseña."
      pie={
        <>
          <Button variant="outline" onClick={() => onCambio(false)}>Cancelar</Button>
          <Button disabled={!email || !personaId || invitar.isPending} onClick={() => invitar.mutate()}>
            Enviar invitación
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="inv-email">Correo</Label>
          <Input id="inv-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="inv-persona">Persona</Label>
          <Select id="inv-persona" value={personaId} onChange={(e) => setPersonaId(e.target.value)}>
            <option value="">Seleccionar…</option>
            {personas?.map((p) => (
              <option key={p.id} value={p.id}>{p.registro} · {p.nombres} {p.apellido_paterno}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="inv-rol">Rol inicial</Label>
          <Select id="inv-rol" value={rol} onChange={(e) => setRol(e.target.value)}>
            {ROLES.map((r) => <option key={r} value={r}>{etiquetaRol(r)}</option>)}
          </Select>
        </div>
      </div>
    </Dialog>
  );
}

function AsignarRolDialog({ usuario, onCambio }: { usuario: UsuarioAdmin | null; onCambio: (v: boolean) => void }) {
  const queryClient = useQueryClient();
  const [rol, setRol] = React.useState("bombero");
  const [desde, setDesde] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [hasta, setHasta] = React.useState("");
  const [motivo, setMotivo] = React.useState("");

  const asignar = useMutation({
    mutationFn: async () => {
      if (!usuario) return;
      const { error } = await db.nucleo.rpc("admin_asignar_rol", {
        p_user_id: usuario.user_id,
        p_rol: rol,
        p_desde: desde,
        p_hasta: hasta || null,
        p_motivo: motivo || "Asignación desde Administración",
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Rol asignado");
      onCambio(false);
      await queryClient.invalidateQueries({ queryKey: ["usuarios-admin"] });
    },
    onError: (e) => toast.error(mensajeError(e)),
  });

  return (
    <Dialog
      abierto={Boolean(usuario)}
      onCambio={onCambio}
      titulo={`Asignar rol a ${usuario?.nombre ?? usuario?.email ?? ""}`}
      pie={
        <>
          <Button variant="outline" onClick={() => onCambio(false)}>Cancelar</Button>
          <Button onClick={() => asignar.mutate()} disabled={asignar.isPending}>Asignar</Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="ar-rol">Rol</Label>
          <Select id="ar-rol" value={rol} onChange={(e) => setRol(e.target.value)}>
            {ROLES.map((r) => <option key={r} value={r}>{etiquetaRol(r)}</option>)}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="ar-desde">Desde</Label>
            <Input id="ar-desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ar-hasta">Hasta</Label>
            <Input id="ar-hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="ar-motivo">Motivo</Label>
          <Input id="ar-motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        </div>
      </div>
    </Dialog>
  );
}

function CatalogosTab() {
  const queryClient = useQueryClient();
  const [nuevoAbierto, setNuevoAbierto] = React.useState(false);
  const [editar, setEditar] = React.useState<{ clave: string; descripcion: string } | null>(null);

  const tiposQ = useQuery({
    queryKey: ["tipos-acto-admin"],
    queryFn: async () => {
      const { data, error } = await db.asistencia.from("tipo_acto").select("*").order("clave");
      if (error) throw error;
      return (data ?? []) as Array<{ clave: string; descripcion: string; obligatorio: boolean; activo: boolean }>;
    },
  });

  const cargosQ = useQuery({
    queryKey: ["cargos"],
    queryFn: async () => {
      const { data, error } = await db.personal.from("cargo").select("*").order("orden");
      if (error) throw error;
      return (data ?? []) as Cargo[];
    },
  });

  const guardarTipo = useMutation({
    mutationFn: async (datos: { clave: string; descripcion: string }) => {
      const { error } = await db.asistencia.from("tipo_acto").upsert(datos as never, { onConflict: "clave" });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Tipo de acto guardado");
      setEditar(null);
      setNuevoAbierto(false);
      await queryClient.invalidateQueries({ queryKey: ["tipos-acto-admin"] });
    },
    onError: (e) => toast.error(mensajeError(e)),
  });

  const faltantes = (tiposQ.data ?? []).filter((t) => t.descripcion.includes("completar descripción")).length;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Tipos de acto</CardTitle>
          <Button variant="outline" onClick={() => setNuevoAbierto(true)}><Plus /> Nuevo</Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {faltantes > 0 && (
            <p className="rounded-md bg-aviso/10 p-2 text-sm text-aviso">
              {faltantes} claves del legado no tienen descripción. Haz clic para completarlas.
            </p>
          )}
          {(tiposQ.data ?? []).map((t) => (
            <button
              key={t.clave}
              type="button"
              onClick={() => setEditar({ clave: t.clave, descripcion: t.descripcion })}
              className="flex w-full items-center justify-between gap-3 rounded-md border border-border p-2 text-left text-sm hover:bg-accent"
            >
              <span className="font-mono text-xs text-muted-foreground">{t.clave}</span>
              <span className="flex-1">{t.descripcion}</span>
              {t.obligatorio && <Badge variant="secondary">Obligatorio</Badge>}
              {!t.activo && <Badge variant="apagado">Inactivo</Badge>}
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Cargos</CardTitle></CardHeader>
        <CardContent className="space-y-1">
          {(cargosQ.data ?? []).map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 rounded-md border border-border p-2 text-sm">
              <div>
                <p className="font-medium">{c.nombre}</p>
                <p className="text-xs text-muted-foreground">{c.codigo} · {c.tipo}</p>
              </div>
              <Badge variant={c.es_unico ? "outline" : "apagado"}>{c.es_unico ? "Único" : "Múltiple"}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog
        abierto={nuevoAbierto}
        onCambio={setNuevoAbierto}
        titulo="Nuevo tipo de acto"
        pie={
          <>
            <Button variant="outline" onClick={() => setNuevoAbierto(false)}>Cancelar</Button>
            <Button
              onClick={(e) => {
                const form = (e.currentTarget.closest("dialog") as HTMLElement)?.querySelector("form");
                form?.requestSubmit();
              }}
            >
              Guardar
            </Button>
          </>
        }
      >
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            guardarTipo.mutate({ clave: String(f.get("clave")), descripcion: String(f.get("descripcion")) });
          }}
        >
          <div className="space-y-1">
            <Label htmlFor="nt-clave">Clave</Label>
            <Input id="nt-clave" name="clave" required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="nt-desc">Descripción</Label>
            <Input id="nt-desc" name="descripcion" required />
          </div>
        </form>
      </Dialog>

      <Dialog
        abierto={Boolean(editar)}
        onCambio={(v) => !v && setEditar(null)}
        titulo={`Editar clave ${editar?.clave ?? ""}`}
        pie={
          <>
            <Button variant="outline" onClick={() => setEditar(null)}>Cancelar</Button>
            <Button onClick={() => editar && guardarTipo.mutate(editar)} disabled={guardarTipo.isPending}>
              <Save /> Guardar
            </Button>
          </>
        }
      >
        <div className="space-y-1">
          <Label htmlFor="et-desc">Descripción</Label>
          <Input
            id="et-desc"
            value={editar?.descripcion ?? ""}
            onChange={(e) => setEditar((x) => (x ? { ...x, descripcion: e.target.value } : x))}
          />
        </div>
      </Dialog>
    </div>
  );
}

function ParametrosTab() {
  const queryClient = useQueryClient();
  const [valores, setValores] = React.useState<Record<string, string>>({});

  const { data } = useQuery({
    queryKey: ["parametros"],
    queryFn: async () => {
      const { data, error } = await db.nucleo.from("parametro").select("*").order("grupo");
      if (error) throw error;
      return (data ?? []) as Parametro[];
    },
  });

  const guardar = useMutation({
    mutationFn: async ({ clave, valor }: { clave: string; valor: string }) => {
      let parseado: unknown;
      try {
        parseado = JSON.parse(valor);
      } catch {
        parseado = valor;
      }
      const { error } = await db.nucleo.rpc("guardar_parametro", { p_clave: clave, p_valor: parseado });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Parámetro guardado");
      await queryClient.invalidateQueries({ queryKey: ["parametros"] });
    },
    onError: (e) => toast.error(mensajeError(e)),
  });

  return (
    <Card>
      <CardHeader><CardTitle>Parámetros del sistema</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {(data ?? []).map((p) => {
          const valor = valores[p.clave] ?? JSON.stringify(p.valor);
          return (
            <div key={p.clave} className="grid gap-2 rounded-md border border-border p-3 sm:grid-cols-[1fr_10rem_auto] sm:items-end">
              <div>
                <p className="text-sm font-medium">{p.clave}</p>
                <p className="text-xs text-muted-foreground">{p.descripcion}</p>
                <p className="text-xs text-muted-foreground">Grupo: {p.grupo}</p>
              </div>
              <Input
                value={valor}
                onChange={(e) => setValores({ ...valores, [p.clave]: e.target.value })}
                aria-label={`Valor de ${p.clave}`}
              />
              <Button variant="outline" onClick={() => guardar.mutate({ clave: p.clave, valor })}>
                <Save /> Guardar
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
