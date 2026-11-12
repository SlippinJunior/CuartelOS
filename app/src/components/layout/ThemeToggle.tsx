import { Moon, Sun } from "lucide-react";
import { useTema } from "@/app/tema";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { tema, alternar } = useTema();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={alternar}
      aria-label={tema === "oscuro" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title="Modo claro / oscuro"
    >
      {tema === "oscuro" ? <Sun /> : <Moon />}
    </Button>
  );
}
