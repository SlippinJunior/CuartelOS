import {
  Banknote,
  BookOpen,
  ClipboardCheck,
  FileText,
  Home,
  Shield,
  Siren,
  Truck,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { Seccion } from "@/lib/permisos";

export const ICONOS: Record<Seccion, LucideIcon> = {
  inicio: Home,
  personal: Users,
  asistencia: ClipboardCheck,
  guardia: Siren,
  material: Truck,
  tesoreria: Banknote,
  secretaria: BookOpen,
  documentos: FileText,
  administracion: Wrench,
  disciplina: Shield,
};
