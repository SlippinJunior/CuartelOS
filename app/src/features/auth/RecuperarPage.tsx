import * as React from "react";
import { Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mensajeError } from "@/lib/errores";

const esquema = z.object({ email: z.string().email("Ingresa un correo válido") });
type Formulario = z.infer<typeof esquema>;

export function RecuperarPage() {
  const [mensaje, setMensaje] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Formulario>({ resolver: zodResolver(esquema) });

  const enviar = async (datos: Formulario) => {
    setError(null);
    setMensaje(null);
    const { error: e } = await supabase.auth.resetPasswordForEmail(datos.email.trim(), {
      redirectTo: `${window.location.origin}/auth/establecer`,
    });
    if (e) setError(mensajeError(e));
    else setMensaje("Si el correo existe, recibirás un enlace para restablecer la contraseña.");
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Recuperar contraseña</CardTitle>
          <CardDescription>Te enviaremos un enlace al correo registrado.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-4" onSubmit={handleSubmit(enviar)} noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">Correo</Label>
              <Input id="email" type="email" autoComplete="email" {...register("email")} />
              {errors.email && <p className="text-sm text-peligro">{errors.email.message}</p>}
            </div>
            {error && <p className="rounded-md bg-peligro/10 p-2 text-sm text-peligro">{error}</p>}
            {mensaje && <p className="rounded-md bg-exito/10 p-2 text-sm text-exito">{mensaje}</p>}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              <Mail /> {isSubmitting ? "Enviando…" : "Enviar enlace"}
            </Button>
          </form>
          <Link to="/login" className="block text-center text-sm text-primary hover:underline">
            Volver al ingreso
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
