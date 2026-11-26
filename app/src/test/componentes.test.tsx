import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchInput } from "@/components/ui/search-input";
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

  it("renderiza SearchInput centrado y permite limpiar la búsqueda", () => {
    const limpiar = vi.fn();
    render(
      <SearchInput
        value="bombero"
        onChange={() => {}}
        onLimpiar={limpiar}
        placeholder="Buscar"
      />,
    );
    const input = screen.getByPlaceholderText("Buscar");
    expect(input.className).toContain("pl-10");
    const btnLimpiar = screen.getByRole("button", { name: "Limpiar búsqueda" });
    fireEvent.click(btnLimpiar);
    expect(limpiar).toHaveBeenCalledTimes(1);
  });

  it("mantiene padding simétrico en CardContent independiente y data-slot con CardHeader", () => {
    const { container } = render(
      <Card>
        <CardHeader>
          <CardTitle>Título</CardTitle>
        </CardHeader>
        <CardContent>Cuerpo</CardContent>
      </Card>,
    );
    const header = container.querySelector('[data-slot="card-header"]');
    const content = container.querySelector('[data-slot="card-content"]');
    expect(header).not.toBeNull();
    expect(content).not.toBeNull();
    expect(content?.className).not.toContain("sm:pt-0");
  });
});
