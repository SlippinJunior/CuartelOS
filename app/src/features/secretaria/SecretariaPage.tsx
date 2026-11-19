import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { puedeVer } from "@/lib/permisos";
import { BookOpen } from "lucide-react";
import { Tabs } from "@/components/ui/tabs";
import { usePerfil } from "@/features/auth/sesion";
import { ActasSection } from "@/features/secretaria/ActasSection";
import { AcuerdosSection } from "@/features/secretaria/AcuerdosSection";
import { CorrespondenciaSection } from "@/features/secretaria/CorrespondenciaSection";
import { PostulacionesSection } from "@/features/secretaria/PostulacionesSection";

export function SecretariaPage() {
  const { data: perfil } = usePerfil();
  const roles = perfil?.roles ?? [];
  const puedeGestionar = roles.some((r) =>
    ["secretario", "prosecretario", "director", "capitan", "admin"].includes(r),
  );

  if (!puedeVer(roles, "secretaria")) {
    return (
      <EmptyState
        titulo="Sin acceso a Secretaría"
        descripcion="Las actas aprobadas y los acuerdos están disponibles en Documentos."
        icono={BookOpen}
      />
    );
  }

  const items = [
    { id: "actas", etiqueta: "Actas", contenido: <ActasSection /> },
    { id: "acuerdos", etiqueta: "Acuerdos", contenido: <AcuerdosSection /> },
    { id: "correspondencia", etiqueta: "Correspondencia", contenido: <CorrespondenciaSection /> },
    ...(puedeGestionar
      ? [{ id: "postulaciones", etiqueta: "Postulaciones", contenido: <PostulacionesSection /> }]
      : []),
  ];

  return (
    <div>
      <PageHeader
        titulo="Secretaría"
        descripcion="Actas, acuerdos, correspondencia y postulaciones de la compañía."
      />
      <Tabs items={items} />
    </div>
  );
}
