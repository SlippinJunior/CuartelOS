import { Outlet, useLocation } from "@tanstack/react-router";
import { AlertTriangle, LogOut } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { ConnectionIndicator } from "@/components/layout/ConnectionIndicator";
import { usePerfil, useSesion } from "@/features/auth/sesion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { mensajeError } from "@/lib/errores";
import { etiquetaRol } from "@/lib/permisos";
import { Redirigir } from "@/components/common/Redirigir";

function Cargando() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background p-6">
      <img src="/escudo.png" alt="Escudo" className="size-16 animate-pulse object-contain" />
      <p className="text-sm text-muted-foreground">Cargando el sistema…</p>
    </div>
  );
}

export function AppShell() {
  const { sesion, cargando, salir } = useSesion();
  const perfil = usePerfil();
  const location = useLocation();

  if (cargando || (sesion && perfil.isLoading)) return <Cargando />;
  if (!sesion) return <Redirigir a="/login" />;

  if (perfil.isError) {
    return (
      <div className="mx-auto max-w-lg p-6">
        <Card>
          <CardContent className="space-y-3 pt-6">
            <div className="flex items-center gap-2 font-semibold text-peligro">
              <AlertTriangle className="size-5" /> No se pudo cargar el perfil
            </div>
            <p className="text-sm text-muted-foreground">{mensajeError(perfil.error)}</p>
            <Button onClick={() => void salir()}>Cerrar sesión</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const consentimiento = perfil.data?.consentimiento;
  const enConsentimiento = location.pathname.startsWith("/consentimiento");
  if (consentimiento && !consentimiento.aceptado && !enConsentimiento) {
    return <Redirigir a="/consentimiento" />;
  }

  return (
    <div className="min-h-dvh bg-background">
      <Sidebar />
      <div className="lg:pl-[var(--ancho-sidebar)]">
        <header className="sticky top-0 z-20 flex min-h-14 items-center justify-between gap-2 border-b border-border bg-background/90 px-3 backdrop-blur">
          <div className="flex min-w-0 items-center gap-2 lg:hidden">
            <img src="/escudo.png" alt="" className="size-8 object-contain" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Segunda Compañía</p>
              <p className="truncate text-[11px] text-muted-foreground">
                {perfil.data?.persona?.nombre ?? perfil.data?.email}
              </p>
            </div>
          </div>
          <div className="hidden min-w-0 lg:block">
            <p className="truncate text-sm font-medium">
              {perfil.data?.persona?.nombre ?? perfil.data?.email ?? "Sesión"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {(perfil.data?.roles ?? []).map(etiquetaRol).join(" · ")}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <ConnectionIndicator />
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label="Cerrar sesión"
              onClick={() => void salir()}
            >
              <LogOut />
            </Button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl p-4 pb-[calc(var(--alto-barra-inferior)+1.5rem)] sm:p-6 lg:pb-10">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
