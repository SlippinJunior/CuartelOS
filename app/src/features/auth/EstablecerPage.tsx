import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { KeyRound } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSesion } from "@/features/auth/sesion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mensajeError } from "@/lib/errores";

const esquema = z
  .object({
    password: z.string().min(8, "Usa al menos 8 caracteres"),
    confirmar: z.string(),
  })
  .refine((d) => d.password === d.confirmar, { path: ["confirmar"], message: "Las contraseñas no coinciden" });

type Formulario = z.infer<typeof esquema>;

export function EstablecerPage() {
  const navigate = useNavigate();
  const { sesion, cargando } = useSesion();
  const [error, setError] = React.useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Formulario>({ resolver: zodResolver(esquema) });

  const enviar = async (datos: Formulario) => {
    setError(null);
    const { error: e } = await supabase.auth.updateUser({ password: datos.password });
    if (e) {
      setError(mensajeError(e));
      return;
    }
    await navigate({ to: "/" });
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Establecer contraseña</CardTitle>
          <CardDescription>
            {cargando
              ? "Validando el enlace…"
              : sesion
                ? "Define la contraseña con la que ingresarás al sistema."
                : "El enlace no es válido o venció. Solicita uno nuevo."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sesion ? (
            <form className="space-y-4" onSubmit={handleSubmit(enviar)} noValidate>
              <div className="space-y-2">
                <Label htmlFor="password">Nueva contraseña</Label>
                <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
                {errors.password && <p className="text-sm text-peligro">{errors.password.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmar">Repetir contraseña</Label>
                <Input id="confirmar" type="password" autoComplete="new-password" {...register("confirmar")} />
                {errors.confirmar && <p className="text-sm text-peligro">{errors.confirmar.message}</p>}
              </div>
              {error && <p className="rounded-md bg-peligro/10 p-2 text-sm text-peligro">{error}</p>}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                <KeyRound /> {isSubmitting ? "Guardando…" : "Guardar contraseña"}
              </Button>
            </form>
          ) : (
            <Button className="w-full" onClick={() => void navigate({ to: "/auth/recuperar" })}>
              Solicitar un enlace nuevo
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
