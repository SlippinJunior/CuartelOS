import * as React from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertTriangle, LogIn } from "lucide-react";
import { supabase, hayConfiguracion } from "@/lib/supabase";
import { useSesion } from "@/features/auth/sesion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mensajeError } from "@/lib/errores";
import { Redirigir } from "@/components/common/Redirigir";

const esquema = z.object({
  email: z.string().email("Ingresa un correo válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

type Formulario = z.infer<typeof esquema>;

const USUARIOS_DEMO = [
  "director", "secretario", "prosecretario", "tesorero", "protesorero",
  "capitan", "teniente_1", "teniente_2", "teniente_3", "ayudante",
  "consejo", "bombero", "cuartel", "admin",
];

export function LoginPage() {
  const { sesion } = useSesion();
  const navigate = useNavigate();
  const [error, setError] = React.useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Formulario>({ resolver: zodResolver(esquema), defaultValues: { email: "", password: "" } });

  if (sesion) return <Redirigir a="/" />;

  const enviar = async (datos: Formulario) => {
    setError(null);
    const { error: e } = await supabase.auth.signInWithPassword({
      email: datos.email.trim(),
      password: datos.password,
    });
    if (e) {
      setError(mensajeError(e));
      return;
    }
    await navigate({ to: "/" });
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <img src="/escudo.png" alt="Escudo de la Segunda Compañía" className="size-20 object-contain" />
          <h1 className="text-2xl font-bold">Segunda Compañía</h1>
          <p className="text-sm text-muted-foreground">Cuerpo de Bomberos de Limache</p>
        </div>

        {!hayConfiguracion && (
          <Card className="border-aviso/50 bg-aviso/10">
            <CardContent className="flex gap-2 pt-4 text-sm">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-aviso" />
              <span>
                Falta configurar <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code> en
                <code> app/.env</code>. Copia <code>.env.example</code> y ejecuta <code>supabase start</code>.
              </span>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Ingresar</CardTitle>
            <CardDescription>Acceso solo por invitación, con correo y contraseña.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit(enviar)} noValidate>
              <div className="space-y-2">
                <Label htmlFor="email">Correo</Label>
                <Input id="email" type="email" autoComplete="email" placeholder="nombre@compania.cl" {...register("email")} />
                {errors.email && <p className="text-sm text-peligro">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Contraseña</Label>
                  <Link to="/auth/recuperar" className="text-xs text-primary hover:underline">
                    ¿La olvidaste?
                  </Link>
                </div>
                <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
                {errors.password && <p className="text-sm text-peligro">{errors.password.message}</p>}
              </div>
              {error && <p className="rounded-md bg-peligro/10 p-2 text-sm text-peligro">{error}</p>}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                <LogIn /> {isSubmitting ? "Ingresando…" : "Ingresar"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Usuarios de desarrollo</CardTitle>
            <CardDescription>Contraseña <code>demo1234</code>. Solo existen con el seed ficticio.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1.5">
            {USUARIOS_DEMO.map((u) => (
              <Button
                key={u}
                variant="outline"
                size="sm"
                onClick={() => {
                  setValue("email", `${u}@demo.local`);
                  setValue("password", "demo1234");
                }}
              >
                {u}
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
