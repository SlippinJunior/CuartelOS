import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Dialog } from "@/components/ui/dialog";

describe("Dialog", () => {
  it("no monta el <dialog> cuando está cerrado", () => {
    render(
      <Dialog abierto={false} onCambio={() => {}} titulo="Valor de la cuota">
        <p>Contenido</p>
      </Dialog>,
    );
    expect(document.querySelector("dialog")).toBeNull();
  });

  it("monta el <dialog> abierto con el título y el contenido", () => {
    render(
      <Dialog abierto onCambio={() => {}} titulo="Valor de la cuota" descripcion="Monto mensual">
        <p>Contenido del formulario</p>
      </Dialog>,
    );
    const dialogo = document.querySelector("dialog.dialogo-centrado");
    expect(dialogo).not.toBeNull();
    expect(screen.getByRole("heading", { name: "Valor de la cuota" })).toBeInTheDocument();
    expect(screen.getByText("Contenido del formulario")).toBeInTheDocument();
    // El centrado no puede depender solo de la clase m-auto.
    expect((dialogo as HTMLElement).style.margin).toBe("auto");
  });

  it("al desmontarse con un diálogo abierto no deja el <dialog> en el DOM", () => {
    const { rerender } = render(
      <Dialog abierto onCambio={() => {}} titulo="Pago">
        <p>Contenido</p>
      </Dialog>,
    );
    expect(document.querySelector("dialog")).not.toBeNull();
    rerender(
      <Dialog abierto={false} onCambio={() => {}} titulo="Pago">
        <p>Contenido</p>
      </Dialog>,
    );
    expect(document.querySelector("dialog")).toBeNull();
  });
});
