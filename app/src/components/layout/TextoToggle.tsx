import { Button } from "@/components/ui/button";
import { useTema } from "@/app/tema";

/** Botón claro para alternar entre texto normal (16 px) y grande (18 px). */
export function TextoToggle() {
  const { tamanoTexto, alternarTexto } = useTema();
  const esGrande = tamanoTexto === "grande";

  return (
    <Button
      variant={esGrande ? "secondary" : "ghost"}
      size="sm"
      onClick={alternarTexto}
      aria-pressed={esGrande}
      aria-label={esGrande ? "Usar tamaño de texto normal" : "Aumentar tamaño de texto"}
      title={esGrande ? "Texto grande activo (clic para normal)" : "Aumentar tamaño de texto"}
      className="min-h-11 px-2.5 font-bold"
    >
      <span className="text-sm">{esGrande ? "A−" : "A+"}</span>
    </Button>
  );
}
