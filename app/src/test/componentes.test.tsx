import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { EstadoBadge, SemaforoBadge } from "@/components/common/StatusBadge";

describe("componentes base", () => {
  it("renderiza un botón accesible con altura táctil", () => {
    render(<Button>Guardar</Button>);
    const boton = screen.getByRole("button", { name: "Guardar" });
    expect(boton).toBeInTheDocument();
    expect(boton.className).toContain("min-h-11");
  });

  it("muestra el estado vacío con acción", () => {
    render(<EmptyState titulo="Sin datos" descripcion="Nada por aquí" accion={<Button>Crear</Button>} />);
    expect(screen.getByText("Sin datos")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Crear" })).toBeInTheDocument();
  });

  it("traduce estados a etiquetas legibles", () => {
    render(<EstadoBadge estado="enviada" />);
    expect(screen.getByText("Enviada")).toBeInTheDocument();
  });

  it("muestra el semáforo de vencimiento", () => {
    render(<SemaforoBadge vence="2020-01-01" />);
    expect(screen.getByText("Vencido")).toBeInTheDocument();
  });
});
