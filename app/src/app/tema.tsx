import * as React from "react";

type Tema = "claro" | "oscuro";

interface ContextoTema {
  tema: Tema;
  alternar: () => void;
  definir: (t: Tema) => void;
}

const Contexto = React.createContext<ContextoTema | null>(null);

const CLAVE = "erp-tema";

function temaInicial(): Tema {
  const guardado = localStorage.getItem(CLAVE);
  if (guardado === "claro" || guardado === "oscuro") return guardado;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "oscuro" : "claro";
}

export function TemaProvider({ children }: { children: React.ReactNode }) {
  const [tema, setTema] = React.useState<Tema>(() => temaInicial());

  React.useEffect(() => {
    const raiz = document.documentElement;
    raiz.classList.toggle("dark", tema === "oscuro");
    raiz.style.colorScheme = tema === "oscuro" ? "dark" : "light";
    localStorage.setItem(CLAVE, tema);
  }, [tema]);

  const valor = React.useMemo(
    () => ({
      tema,
      alternar: () => setTema((t) => (t === "oscuro" ? "claro" : "oscuro")),
      definir: setTema,
    }),
    [tema],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useTema() {
  const ctx = React.useContext(Contexto);
  if (!ctx) throw new Error("useTema debe usarse dentro de TemaProvider");
  return ctx;
}
