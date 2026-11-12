import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { router } from "@/app/router";
import { TemaProvider } from "@/app/tema";
import { SesionProvider } from "@/features/auth/sesion";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

export function Providers() {
  return (
    <QueryClientProvider client={queryClient}>
      <TemaProvider>
        <SesionProvider>
          <RouterProvider router={router} />
          <Toaster richColors position="top-center" closeButton />
        </SesionProvider>
      </TemaProvider>
    </QueryClientProvider>
  );
}
