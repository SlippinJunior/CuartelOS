import { createRootRoute, createRoute, createRouter, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/app/AppShell";
import { LoginPage } from "@/features/auth/LoginPage";
import { RecuperarPage } from "@/features/auth/RecuperarPage";
import { EstablecerPage } from "@/features/auth/EstablecerPage";
import { ConsentimientoPage } from "@/features/auth/ConsentimientoPage";
import { InicioPage } from "@/features/inicio/InicioPage";
import { PersonalPage } from "@/features/personal/PersonalPage";
import { PersonaPage } from "@/features/personal/PersonaPage";
import { PersonaFormPage } from "@/features/personal/PersonaFormPage";
import { AsistenciaPage } from "@/features/asistencia/AsistenciaPage";
import { ListaPage } from "@/features/asistencia/ListaPage";
import { MiAsistenciaPage } from "@/features/asistencia/MiAsistenciaPage";
import { DocumentosPage } from "@/features/documentos/DocumentosPage";
import { EmitirPage } from "@/features/documentos/EmitirPage";
import { AdministracionPage } from "@/features/administracion/AdministracionPage";
import { VerificarPage } from "@/features/verificar/VerificarPage";
import { GuardiaPage } from "@/features/guardia/GuardiaPage";
import { MaterialPage } from "@/features/material/MaterialPage";
import { TesoreriaPage } from "@/features/tesoreria/TesoreriaPage";
import { MiTesoreriaPage } from "@/features/tesoreria/MiTesoreriaPage";
import { SecretariaPage } from "@/features/secretaria/SecretariaPage";
import { DisciplinaPage } from "@/features/disciplina/DisciplinaPage";
import { EstadisticasPage } from "@/features/estadisticas/EstadisticasPage";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

// eslint-disable-next-line react-refresh/only-export-components
function NoEncontrado() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-5xl font-bold text-primary">404</p>
      <p className="text-lg font-medium">Página no encontrada</p>
      <Link to="/"><Button>Volver al inicio</Button></Link>
    </div>
  );
}

const rootRoute = createRootRoute({
  component: () => <Outlet />,
  notFoundComponent: NoEncontrado,
});

const protegidaRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "protegida",
  component: AppShell,
});

const inicioRoute = createRoute({
  getParentRoute: () => protegidaRoute,
  path: "/",
  component: InicioPage,
});

const consentimientoRoute = createRoute({
  getParentRoute: () => protegidaRoute,
  path: "/consentimiento",
  component: ConsentimientoPage,
});

const personalRoute = createRoute({
  getParentRoute: () => protegidaRoute,
  path: "/personal",
  component: PersonalPage,
});

const personaNuevaRoute = createRoute({
  getParentRoute: () => protegidaRoute,
  path: "/personal/nuevo",
  component: () => <PersonaFormPage modo="crear" />,
});

const personaRoute = createRoute({
  getParentRoute: () => protegidaRoute,
  path: "/personal/$personaId",
  component: PersonaPage,
});

const personaEditarRoute = createRoute({
  getParentRoute: () => protegidaRoute,
  path: "/personal/$personaId/editar",
  component: () => <PersonaFormPage modo="editar" />,
});

const asistenciaRoute = createRoute({
  getParentRoute: () => protegidaRoute,
  path: "/asistencia",
  component: AsistenciaPage,
});

const miAsistenciaRoute = createRoute({
  getParentRoute: () => protegidaRoute,
  path: "/asistencia/mi",
  component: MiAsistenciaPage,
});

const listaRoute = createRoute({
  getParentRoute: () => protegidaRoute,
  path: "/asistencia/$listaId",
  component: ListaPage,
});

const documentosRoute = createRoute({
  getParentRoute: () => protegidaRoute,
  path: "/documentos",
  component: DocumentosPage,
});

const emitirRoute = createRoute({
  getParentRoute: () => protegidaRoute,
  path: "/documentos/emitir",
  component: EmitirPage,
});

const administracionRoute = createRoute({
  getParentRoute: () => protegidaRoute,
  path: "/administracion",
  component: AdministracionPage,
});

const guardiaRoute = createRoute({
  getParentRoute: () => protegidaRoute,
  path: "/guardia",
  component: GuardiaPage,
});

const materialRoute = createRoute({
  getParentRoute: () => protegidaRoute,
  path: "/material",
  component: MaterialPage,
});

const tesoreriaRoute = createRoute({
  getParentRoute: () => protegidaRoute,
  path: "/tesoreria",
  component: TesoreriaPage,
});

const miTesoreriaRoute = createRoute({
  getParentRoute: () => protegidaRoute,
  path: "/mis-cuotas",
  component: MiTesoreriaPage,
});

const secretariaRoute = createRoute({
  getParentRoute: () => protegidaRoute,
  path: "/secretaria",
  component: SecretariaPage,
});

const disciplinaRoute = createRoute({
  getParentRoute: () => protegidaRoute,
  path: "/disciplina",
  component: DisciplinaPage,
});

const estadisticasRoute = createRoute({
  getParentRoute: () => protegidaRoute,
  path: "/estadisticas",
  component: EstadisticasPage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

const recuperarRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auth/recuperar",
  component: RecuperarPage,
});

const establecerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auth/establecer",
  component: EstablecerPage,
});

const verificarRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/verificar/$token",
  component: VerificarPage,
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  recuperarRoute,
  establecerRoute,
  verificarRoute,
  protegidaRoute.addChildren([
    inicioRoute,
    consentimientoRoute,
    personalRoute,
    personaNuevaRoute,
    personaRoute,
    personaEditarRoute,
    asistenciaRoute,
    miAsistenciaRoute,
    listaRoute,
    documentosRoute,
    emitirRoute,
    administracionRoute,
    guardiaRoute,
    materialRoute,
    tesoreriaRoute,
    miTesoreriaRoute,
    secretariaRoute,
    disciplinaRoute,
    estadisticasRoute,
  ]),
]);

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultPreloadStaleTime: 30_000,
  scrollRestoration: true,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
