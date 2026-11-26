import * as React from "react";

export type Tema = "claro" | "oscuro";
export type TamanoTexto = "normal" | "grande";

export interface ContextoTema {
  tema: Tema;
  alternar: () => void;
  definir: (t: Tema) => void;
  tamanoTexto: TamanoTexto;
  alternarTexto: () => void;
}

const Contexto = React.createContext<ContextoTema | null>(null);

const CLAVE = "erp-tema";
const CLAVE_TEXTO = "erp-texto";

function temaInicial(): Tema {
  const guardado = localStorage.getItem(CLAVE);
  if (guardado === "claro" || guardado === "oscuro") return guardado;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "oscuro" : "claro";
}

function textoInicial(): TamanoTexto {
  const guardado = localStorage.getItem(CLAVE_TEXTO);
  return guardado === "grande" ? "grande" : "normal";
}

export function TemaProvider({ children }: { children: React.ReactNode }) {
  const [tema, setTema] = React.useState<Tema>(() => temaInicial());
  const [tamanoTexto, setTamanoTexto] = React.useState<TamanoTexto>(() => textoInicial());

  React.useEffect(() => {
    const raiz = document.documentElement;
    raiz.classList.toggle("dark", tema === "oscuro");
    raiz.style.colorScheme = tema === "oscuro" ? "dark" : "light";
    localStorage.setItem(CLAVE, tema);
  }, [tema]);

  React.useEffect(() => {
    const raiz = document.documentElement;
    raiz.classList.toggle("texto-grande", tamanoTexto === "grande");
    localStorage.setItem(CLAVE_TEXTO, tamanoTexto);
  }, [tamanoTexto]);

  const valor = React.useMemo(
    () => ({
      tema,
      alternar: () => setTema((t) => (t === "oscuro" ? "claro" : "oscuro")),
      definir: setTema,
      tamanoTexto,
      alternarTexto: () => setTamanoTexto((s) => (s === "grande" ? "normal" : "grande")),
    }),
    [tema, tamanoTexto],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTema() {
  const ctx = React.useContext(Contexto);
  if (!ctx) throw new Error("useTema debe usarse dentro de TemaProvider");
  return ctx;
}
