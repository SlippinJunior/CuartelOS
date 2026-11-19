import * as React from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { db } from "@/lib/supabase";
import { mensajeError } from "@/lib/errores";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import type { Persona } from "@/types/tipos";

const esquema = z.object({
  registro: z.string().regex(/^\d+$/, "El registro debe ser un número positivo"),
  rut: z.string().max(12).optional(),
  nombres: z.string().min(2, "Ingresa los nombres"),
  apellido_paterno: z.string().min(2, "Ingresa el apellido paterno"),
  apellido_materno: z.string().optional(),
  fecha_nacimiento: z.string().optional(),
  sexo: z.string().optional(),
  email: z.union([z.string().email("Correo inválido"), z.literal("")]).optional(),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  fecha_ingreso: z.string().optional(),
  rango: z.enum(["aspirante", "bombero", "honorario", "insigne", "martir"]),
  estado: z.enum(["activo", "suspendido", "renunciado", "separado", "expulsado", "fallecido", "trasladado"]),
  observaciones: z.string().optional(),
  codigo_charlie: z
    .union([z.string().max(20), z.literal("")])
    .optional(),
});

type Formulario = z.infer<typeof esquema>;

const VACIOS: Formulario = {
  registro: "",
  rut: "",
  nombres: "",
  apellido_paterno: "",
  apellido_materno: "",
  fecha_nacimiento: "",
  sexo: "",
  email: "",
  telefono: "",
  direccion: "",
  fecha_ingreso: "",
  rango: "bombero",
  estado: "activo",
  observaciones: "",
  codigo_charlie: "",
};

export function PersonaFormPage({ modo }: { modo: "crear" | "editar" }) {
  const { personaId } = useParams({ strict: false }) as { personaId?: string };
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const personaQ = useQuery({
    queryKey: ["persona", personaId],
    queryFn: async () => {
      const { data, error } = await db.personal.from("persona").select("*").eq("id", personaId).single();
      if (error) throw error;
      return data as Persona;
    },
    enabled: modo === "editar" && Boolean(personaId),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Formulario>({
    resolver: zodResolver(esquema),
    defaultValues: VACIOS,
  });

  React.useEffect(() => {
    if (modo === "editar" && personaQ.data) {
      const p = personaQ.data;
      reset({
        registro: String(p.registro),
        rut: p.rut ?? "",
        nombres: p.nombres,
        apellido_paterno: p.apellido_paterno,
        apellido_materno: p.apellido_materno ?? "",
        fecha_nacimiento: p.fecha_nacimiento ?? "",
        sexo: p.sexo ?? "",
        email: p.email ?? "",
        telefono: p.telefono ?? "",
        direccion: p.direccion ?? "",
        fecha_ingreso: p.fecha_ingreso ?? "",
        rango: p.rango,
        estado: p.estado,
        observaciones: p.observaciones ?? "",
        codigo_charlie: p.codigo_charlie ?? "",
      });
    }
  }, [modo, personaQ.data, reset]);

  const guardar = useMutation({
    mutationFn: async (datos: Formulario) => {
      const payload: Record<string, unknown> = {
        registro: Number(datos.registro),
        rut: datos.rut || null,
        nombres: datos.nombres.trim(),
        apellido_paterno: datos.apellido_paterno.trim(),
        apellido_materno: datos.apellido_materno || null,
        fecha_nacimiento: datos.fecha_nacimiento || null,
        sexo: datos.sexo || null,
        email: datos.email || null,
        telefono: datos.telefono || null,
        direccion: datos.direccion || null,
        fecha_ingreso: datos.fecha_ingreso || null,
        observaciones: datos.observaciones || null,
        codigo_charlie: datos.codigo_charlie ? datos.codigo_charlie.trim().toUpperCase() : null,
      };

      if (modo === "editar" && personaId) {
        // Rango y estado NO se sobrescriben aquí: cambian solo mediante
        // persona_evento para conservar el historial.
        const { error } = await db.personal.from("persona").update(payload as never).eq("id", personaId);
        if (error) throw error;
        return personaId;
      }

      payload.rango = datos.rango;
      payload.estado = datos.estado;

      const { data, error } = await db.personal.from("persona").insert(payload as never).select("id").single();
      if (error) throw error;
      return (data as { id: string }).id;
    },
    onSuccess: async (id) => {
      toast.success(modo === "editar" ? "Ficha actualizada" : "Persona creada");
      await queryClient.invalidateQueries({ queryKey: ["personal"] });
      await queryClient.invalidateQueries({ queryKey: ["persona", id] });
      await navigate({ to: "/personal/$personaId", params: { personaId: id } });
    },
    onError: (e) => toast.error(mensajeError(e)),
  });

  if (modo === "editar" && personaQ.isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div>
      <PageHeader
        titulo={modo === "crear" ? "Nueva persona" : "Editar ficha"}
        descripcion="Los datos de salud se registran aparte, en la pestaña Sensibles."
        volverA={modo === "editar" && personaId ? "/personal" : "/personal"}
      />
      <Card>
        <CardContent className="pt-5">
          <form className="space-y-5" onSubmit={handleSubmit((d) => guardar.mutate(d))} noValidate>
            <section className="grid gap-3 sm:grid-cols-2">
              <Campo etiqueta="Registro" error={errors.registro?.message}>
                <Input type="number" inputMode="numeric" {...register("registro")} />
              </Campo>
              <Campo etiqueta="RUT" error={errors.rut?.message}>
                <Input placeholder="12345678-9" {...register("rut")} />
              </Campo>
              <Campo etiqueta="Nombres" error={errors.nombres?.message}>
                <Input {...register("nombres")} />
              </Campo>
              <Campo etiqueta="Apellido paterno" error={errors.apellido_paterno?.message}>
                <Input {...register("apellido_paterno")} />
              </Campo>
              <Campo etiqueta="Apellido materno" error={errors.apellido_materno?.message}>
                <Input {...register("apellido_materno")} />
              </Campo>
              <Campo etiqueta="Fecha de nacimiento" error={errors.fecha_nacimiento?.message}>
                <Input type="date" {...register("fecha_nacimiento")} />
              </Campo>
              <Campo etiqueta="Sexo">
                <Select {...register("sexo")}>
                  <option value="">Sin dato</option>
                  <option value="masculino">Masculino</option>
                  <option value="femenino">Femenino</option>
                  <option value="otro">Otro</option>
                  <option value="no_informa">No informa</option>
                </Select>
              </Campo>
              <Campo etiqueta="Correo" error={errors.email?.message}>
                <Input type="email" {...register("email")} />
              </Campo>
              <Campo etiqueta="Teléfono" error={errors.telefono?.message}>
                <Input {...register("telefono")} />
              </Campo>
              <Campo etiqueta="Dirección" error={errors.direccion?.message}>
                <Input {...register("direccion")} />
              </Campo>
              <Campo etiqueta="Fecha de ingreso" error={errors.fecha_ingreso?.message}>
                <Input type="date" {...register("fecha_ingreso")} />
              </Campo>
              <Campo etiqueta="Código Charlie">
                <Input placeholder="CH-201" {...register("codigo_charlie")} />
              </Campo>
              <Campo etiqueta={modo === "editar" ? "Rango (se cambia con un evento)" : "Rango"}>
                <Select {...register("rango")} disabled={modo === "editar"}>
                  <option value="aspirante">Aspirante</option>
                  <option value="bombero">Bombero</option>
                  <option value="honorario">Honorario</option>
                  <option value="insigne">Insigne</option>
                  <option value="martir">Mártir</option>
                </Select>
              </Campo>
              <Campo etiqueta={modo === "editar" ? "Estado (se cambia con un evento)" : "Estado"}>
                <Select {...register("estado")} disabled={modo === "editar"}>
                  <option value="activo">Activo</option>
                  <option value="suspendido">Suspendido</option>
                  <option value="renunciado">Renunciado</option>
                  <option value="separado">Separado</option>
                  <option value="expulsado">Expulsado</option>
                  <option value="fallecido">Fallecido</option>
                  <option value="trasladado">Trasladado</option>
                </Select>
              </Campo>
            </section>

            {modo === "editar" && (
              <p className="rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                El rango y el estado no se editan aquí: usa <strong>Registrar evento</strong> en la ficha
                para conservar el historial y la auditoría.
              </p>
            )}

            <Campo etiqueta="Observaciones" error={errors.observaciones?.message}>
              <Textarea {...register("observaciones")} />
            </Campo>

            <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => void navigate({ to: "/personal" })}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || guardar.isPending}>
                {guardar.isPending ? "Guardando…" : "Guardar ficha"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Campo({ etiqueta, error, children }: { etiqueta: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{etiqueta}</Label>
      {children}
      {error && <p className="text-sm text-peligro">{error}</p>}
    </div>
  );
}
