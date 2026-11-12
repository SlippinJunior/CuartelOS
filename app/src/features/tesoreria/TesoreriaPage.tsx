import * as React from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import { formatearCLP, formatearFecha } from "@/lib/formato";

const CARTOLA = [
  { fecha: "2026-10-01", glosa: "Saldo inicial", tipo: "ingreso", monto: 0, saldo: 4520000 },
  { fecha: "2026-10-03", glosa: "Cuotas sociales", tipo: "ingreso", monto: 356000, saldo: 4876000 },
  { fecha: "2026-10-07", glosa: "Combustible M-21", tipo: "egreso", monto: 98000, saldo: 4778000 },
  { fecha: "2026-10-12", glosa: "Venta de talonarios", tipo: "ingreso", monto: 124000, saldo: 4902000 },
  { fecha: "2026-10-18", glosa: "Mantención preventiva", tipo: "egreso", monto: 320000, saldo: 4582000 },
  { fecha: "2026-10-25", glosa: "Cuota al Cuerpo", tipo: "egreso", monto: 50000, saldo: 4532000 },
  { fecha: "2026-10-31", glosa: "Gastos administrativos", tipo: "egreso", monto: 38000, saldo: 4494000 },
];

const PROYECCION = [
  { mes: "Nov", saldo: 4494000, ingreso: 480000, egreso: 470000 },
  { mes: "Dic", saldo: 4504000, ingreso: 480000, egreso: 920000 },
  { mes: "Ene", saldo: 4064000, ingreso: 420000, egreso: 500000 },
  { mes: "Feb", saldo: 3984000, ingreso: 420000, egreso: 430000 },
  { mes: "Mar", saldo: 3974000, ingreso: 420000, egreso: 260000 },
  { mes: "Abr", saldo: 4134000, ingreso: 420000, egreso: 330000 },
];

const PRESUPUESTO = [
  { categoria: "Combustible", anual: 1200000, ejecutado: 780000 },
  { categoria: "Mantención de unidades", anual: 1500000, ejecutado: 640000 },
  { categoria: "Material menor", anual: 800000, ejecutado: 410000 },
  { categoria: "Seguros", anual: 700000, ejecutado: 450000 },
  { categoria: "Gastos administrativos", anual: 600000, ejecutado: 320000 },
];

export function TesoreriaPage() {
  const [tab, setTab] = React.useState("cartola");
  return (
    <div>
      <PageHeader
        titulo="Tesorería"
        descripcion="Cartola, compromisos y proyección de saldo. Vista de demostración con datos ficticios."
      />

      <div className="mb-3 flex flex-wrap items-center gap-2 rounded-md border border-aviso/40 bg-aviso/10 p-3 text-sm">
        <Badge variant="aviso">Etapa 2</Badge>
        <span className="text-muted-foreground">
          El esquema y las vistas ya existen en PostgreSQL. La funcionalidad completa de registro y conciliación llega
          en la Etapa 2.
        </span>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Saldo en banco", 4494000],
          ["Ingresos de octubre", 480000],
          ["Egresos de octubre", 506000],
          ["Compromisos pendientes", 1620000],
        ].map(([etiqueta, valor]) => (
          <Card key={String(etiqueta)}>
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">{etiqueta}</p>
              <p className="mt-1 text-xl font-bold">{formatearCLP(Number(valor))}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs
        value={tab}
        onValueChange={setTab}
        items={[
          { id: "cartola", etiqueta: "Cartola", contenido: <Cartola /> },
          { id: "proyeccion", etiqueta: "Proyección", contenido: <Proyeccion /> },
          { id: "presupuesto", etiqueta: "Presupuesto", contenido: <Presupuesto /> },
        ]}
      />
    </div>
  );
}

function Cartola() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cartola de octubre</CardTitle>
        <CardDescription>Saldo corriente calculado con <code>v_cartola</code>.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Glosa</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {CARTOLA.map((m) => (
              <TableRow key={`${m.fecha}-${m.glosa}`}>
                <TableCell className="whitespace-nowrap">{formatearFecha(m.fecha)}</TableCell>
                <TableCell>{m.glosa}</TableCell>
                <TableCell className={`text-right ${m.tipo === "ingreso" ? "text-exito" : "text-peligro"}`}>
                  {m.monto === 0 ? "—" : `${m.tipo === "ingreso" ? "+" : "−"}${formatearCLP(m.monto)}`}
                </TableCell>
                <TableCell className="text-right font-medium">{formatearCLP(m.saldo)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function Proyeccion() {
  const max = Math.max(...PROYECCION.map((p) => p.saldo));
  const min = Math.min(...PROYECCION.map((p) => p.saldo));
  return (
    <Card>
      <CardHeader>
        <CardTitle>Saldo proyectado 6 meses</CardTitle>
        <CardDescription>Saldo actual + recurrentes + compromisos − egresos. Datos ficticios.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex h-56 items-end gap-3">
          {PROYECCION.map((p) => {
            const altura = 20 + ((p.saldo - min + 100000) / (max - min + 200000)) * 80;
            return (
              <div key={p.mes} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[10px] text-muted-foreground">{formatearCLP(p.saldo)}</span>
                <div
                  className="w-full rounded-t-md bg-primary/80"
                  style={{ height: `${altura}%` }}
                  title={`${p.mes}: ${formatearCLP(p.saldo)}`}
                />
                <span className="text-xs font-medium">{p.mes}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
          {PROYECCION.map((p) => (
            <div key={p.mes} className="rounded-md border border-border p-2">
              <p className="font-medium">{p.mes}</p>
              <p className="text-xs text-exito">+ {formatearCLP(p.ingreso)}</p>
              <p className="text-xs text-peligro">− {formatearCLP(p.egreso)}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function Presupuesto() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ejecución presupuestaria 2026</CardTitle>
        <CardDescription>Por categoría y año, según <code>v_presupuesto_ejecucion</code>.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {PRESUPUESTO.map((p) => {
          const pct = Math.round((p.ejecutado / p.anual) * 100);
          return (
            <div key={p.categoria}>
              <div className="mb-1 flex justify-between text-sm">
                <span>{p.categoria}</span>
                <span className="text-muted-foreground">{formatearCLP(p.ejecutado)} / {formatearCLP(p.anual)} · {pct}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className={`h-full rounded-full ${pct > 90 ? "bg-peligro" : pct > 75 ? "bg-aviso" : "bg-exito"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
