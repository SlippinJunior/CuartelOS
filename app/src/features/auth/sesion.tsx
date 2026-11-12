import * as React from "react";
import type { Session } from "@supabase/supabase-js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, hayConfiguracion } from "@/lib/supabase";
import type { Perfil } from "@/types/tipos";

interface ContextoSesion {
  sesion: Session | null;
  cargando: boolean;
  salir: () => Promise<void>;
  hayConfiguracion: boolean;
}

const Contexto = React.createContext<ContextoSesion | null>(null);

export function SesionProvider({ children }: { children: React.ReactNode }) {
  const [sesion, setSesion] = React.useState<Session | null>(null);
  const [cargando, setCargando] = React.useState(true);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    let vivo = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!vivo) return;
      setSesion(data.session);
      setCargando(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_evento, nueva) => {
      setSesion(nueva);
      if (!nueva) queryClient.clear();
    });

    return () => {
      vivo = false;
      data.subscription.unsubscribe();
    };
  }, [queryClient]);

  const salir = React.useCallback(async () => {
    await supabase.auth.signOut();
    queryClient.clear();
  }, [queryClient]);

  const valor = React.useMemo(
    () => ({ sesion, cargando, salir, hayConfiguracion }),
    [sesion, cargando, salir],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useSesion() {
  const ctx = React.useContext(Contexto);
  if (!ctx) throw new Error("useSesion debe usarse dentro de SesionProvider");
  return ctx;
}

export function usePerfil() {
  const { sesion } = useSesion();
  return useQuery({
    queryKey: ["perfil", sesion?.user.id],
    queryFn: async () => {
      const { data, error } = await supabase.schema("nucleo").rpc("mi_perfil");
      if (error) throw error;
      return data as unknown as Perfil;
    },
    enabled: Boolean(sesion),
    staleTime: 60_000,
  });
}

export function useRoles(): string[] {
  const { data } = usePerfil();
  return data?.roles ?? [];
}
