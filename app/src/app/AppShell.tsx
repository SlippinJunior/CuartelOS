import * as React from "react";
import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { AlertTriangle, LogOut, Maximize2, Minimize2, ShieldAlert } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { TextoToggle } from "@/components/layout/TextoToggle";
import { BuscadorGlobal } from "@/components/layout/BuscadorGlobal";
import { ConnectionIndicator } from "@/components/layout/ConnectionIndicator";
import { usePerfil, useSesion } from "@/features/auth/sesion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { mensajeError } from "@/lib/errores";
import { esSoloCuartel, etiquetaRol, puedeVer, seccionDeRuta } from "@/lib/permisos";
import { Redirigir } from "@/components/common/Redirigir";

function Cargando() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background p-6">
      <img src="/escudo.png" alt="Escudo" className="size-16 animate-pulse object-contain" />
      <p className="text-base text-muted-foreground">Cargando el sistema…</p>
    </div>
  );
}

function RelojCuartel() {
  const [ahora, setAhora] = React.useState(() => new Date());
  React.useEffect(() => {
    const id = window.setInterval(() => setAhora(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const fecha = ahora.toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const hora = ahora.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });

  return (
    <p className="truncate text-sm text-muted-foreground capitalize">
      {fecha} · <span className="font-semibold text-foreground">{hora}</span>
    </p>
  );
}

function ShellCuartel({ salir, compania }: { salir: () => Promise<void>; compania?: string }) {
  const [completa, setCompleta] = React.useState(false);

  async function alternarPantalla() {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setCompleta(true);
      } else {
        await document.exitFullscreen();
        setCompleta(false);
      }
    } catch {
      // Navegadores móviles pueden restringir Fullscreen API.
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <img src="/escudo.png" alt="Escudo Segunda Compañía" className="size-10 shrink-0 object-contain" />
          <div className="min-w-0">
            <p className="truncate text-base font-bold leading-tight">
              Tablero de Cuartel · {compania ?? "Segunda Compañía"}
            </p>
            <RelojCuartel />
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <ConnectionIndicator />
          <TextoToggle />
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            aria-label={completa ? "Salir de pantalla completa" : "Pantalla completa"}
            title={completa ? "Salir de pantalla completa" : "Pantalla completa"}
            onClick={() => void alternarPantalla()}
          >
            {completa ? <Minimize2 /> : <Maximize2 />}
          </Button>
          <Button variant="outline" size="sm" onClick={() => void salir()}>
            <LogOut /> Salir
          </Button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl p-4 sm:p-6">
        <Outlet />
      </main>
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

  const roles = perfil.data?.roles ?? [];
  const modoCuartel = Boolean(perfil.data?.es_cuartel) || esSoloCuartel(roles);

  if (modoCuartel) {
    if (location.pathname !== "/") {
      return <Redirigir a="/" />;
    }
    return <ShellCuartel salir={salir} compania={perfil.data?.compania?.nombre} />;
  }

  const consentimiento = perfil.data?.consentimiento;
  const enConsentimiento = location.pathname.startsWith("/consentimiento");
  if (consentimiento && consentimiento.requerido !== false && !consentimiento.aceptado && !enConsentimiento) {
    return <Redirigir a="/consentimiento" />;
  }

  const seccionActual = seccionDeRuta(location.pathname);
  const sinPermiso = Boolean(seccionActual && !puedeVer(roles, seccionActual));

  return (
    <div className="min-h-dvh bg-background">
      <Sidebar />
      <div className="lg:pl-[var(--ancho-sidebar)]">
        <header className="sticky top-0 z-20 flex min-h-14 items-center justify-between gap-2 border-b border-border bg-background/90 px-3 backdrop-blur sm:px-4">
          <div className="flex min-w-0 items-center gap-2 lg:hidden">
            <img src="/escudo.png" alt="" className="size-8 object-contain" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Segunda Compañía</p>
              <p className="truncate text-xs text-muted-foreground">
                {perfil.data?.persona?.nombre ?? perfil.data?.email}
              </p>
            </div>
          </div>
          <div className="hidden min-w-0 lg:block">
            <p className="truncate text-sm font-medium">
              {perfil.data?.persona?.nombre ?? perfil.data?.email ?? "Sesión"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {roles.map(etiquetaRol).join(" · ")}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <BuscadorGlobal compacto />
            <ConnectionIndicator />
            <TextoToggle />
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
          {sinPermiso ? (
            <Card className="mx-auto mt-8 max-w-md">
              <CardContent className="space-y-3 pt-6 text-center">
                <ShieldAlert className="mx-auto size-10 text-aviso" />
                <h1 className="text-lg font-semibold">Sección no disponible para tu rol</h1>
                <p className="text-sm text-muted-foreground">
                  Si necesitas acceso, solicítalo al Director o Administrador.
                </p>
                <Link to="/">
                  <Button>Volver al Tablero</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
