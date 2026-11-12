import { Proximamente } from "@/components/common/Proximamente";

export function DisciplinaPage() {
  return (
    <Proximamente
      titulo="Disciplina"
      descripcion="Expedientes reservados del Consejo de Disciplina (art. 125 B 25)."
      alcance={[
        "Solo el rol consejo accede a los expedientes completos.",
        "El Director ve únicamente las sanciones ejecutoriadas.",
        "Medidas preventivas y control de plazos del procedimiento.",
        "Notificaciones disciplinarias (P16) con folio y verificación.",
      ]}
      documento="disciplina.md"
    />
  );
}
