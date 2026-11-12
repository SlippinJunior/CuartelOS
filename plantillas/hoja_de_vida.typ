// Hoja de vida del bombero · Segunda Compañía de Bomberos de Limache
// Compilar:  typst compile --input datos=hv.json hoja_de_vida.typ salida.pdf
#let d = json(sys.inputs.at("datos", default: "hv_ejemplo.json"))
#let rojo = rgb("#b71c1c")
#let gris = rgb("#5f6368")
#set document(title: "Hoja de vida · " + d.nombre, author: "Segunda Compañía de Bomberos de Limache")
#set page(paper: "a4", background: if d.at("ejemplo", default: false) { rotate(-35deg, text(80pt, fill: rgb(183,28,28,18), weight: "bold")[EJEMPLO]) }, margin: (top: 2.2cm, bottom: 2.2cm, x: 2cm),
  header: context { if counter(page).get().first() > 1 [
    #set text(8pt, fill: gris)
    Hoja de vida · #d.nombre #h(1fr) Folio #d.folio ] },
  footer: [
    #set text(7.5pt, fill: gris)
    #line(length: 100%, stroke: 0.4pt + gris)
    #grid(columns: (1fr, auto), gutter: 8pt,
      [Documento emitido por el sistema de gestión de la Segunda Compañía el #d.emitido. Folio #d.folio. \
       Verifique su autenticidad escaneando el código QR o en #d.url_verificacion.],
      image(d.qr, width: 1.6cm))
  ])
#set text(font: ("Libertinus Serif", "New Computer Modern"), size: 10pt, lang: "es")
#set par(justify: true)

#grid(columns: (2.2cm, 1fr, auto), gutter: 12pt, align: horizon,
  image(d.escudo, width: 2.1cm),
  [#text(9pt, fill: gris, tracking: 1.5pt)[CUERPO DE BOMBEROS DE LIMACHE] \
   #text(16pt, weight: "bold")[Segunda Compañía] \
   #text(8.5pt, fill: rojo, tracking: 2pt)[ATENCIÓN · SACRIFICIO · LEALTAD]],
  align(right)[#text(8pt, fill: gris)[Folio] \ #text(13pt, weight: "bold")[#d.folio]])
#v(4pt)
#line(length: 100%, stroke: 1.5pt + rojo)
#v(6pt)
#align(center, text(14pt, weight: "bold", tracking: 1pt)[HOJA DE VIDA DEL BOMBERO])
#v(6pt)

#let fila(k, v) = (text(fill: gris, k), if v == none or v == "" [—] else [#v])
#block(fill: rgb("#f6f6f8"), inset: 10pt, radius: 4pt, width: 100%,
  grid(columns: (3.3cm, 1.7fr, 2.8cm, 1fr), row-gutter: 7pt, column-gutter: 8pt,
    ..fila("Nombre", d.nombre), ..fila("Registro", str(d.registro)),
    ..fila("Rango", d.rango), ..fila("Cargo actual", d.cargo),
    ..fila("Fecha de ingreso", d.ingreso), ..fila("Antigüedad", d.antiguedad),
    ..fila("Nivel académico ANB", d.nivel_anb), ..fila("Estado", d.estado)))

#let seccion(t) = { v(10pt); text(11pt, weight: "bold", fill: rojo)[#upper(t)]; v(-6pt); line(length: 100%, stroke: 0.5pt + rojo); v(2pt) }
#let tabla(cols, encabezado, filas) = table(columns: cols, stroke: (x, y) => if y == 0 { (bottom: 0.8pt) } else { (bottom: 0.3pt + luma(220)) },
  inset: (x: 5pt, y: 4pt), align: (x, y) => if x == 0 { left } else { left },
  ..encabezado.map(h => text(8.5pt, weight: "bold", h)), ..filas.flatten().map(c => text(9pt, c)))

#seccion("Asistencia " + d.asistencia.periodo)
#grid(columns: (1fr,) * 4, gutter: 8pt,
  ..(("Asistencias", d.asistencia.a), ("Faltas", d.asistencia.f), ("Permisos", d.asistencia.p), ("Porcentaje", d.asistencia.pct)).map(((k, v)) =>
    block(stroke: 0.5pt + luma(210), radius: 4pt, inset: 8pt, width: 100%,
      align(center)[#text(16pt, weight: "bold")[#v] \ #text(8pt, fill: gris, k)])))

#seccion("Cargos y nombramientos")
#if d.cargos.len() == 0 [Sin registro.] else { tabla((1fr, 2.6cm, 2.6cm), ("Cargo", "Desde", "Hasta"), d.cargos.map(c => (c.cargo, c.desde, c.hasta))) }

#seccion("Formación (ANB y otros cursos)")
#if d.cursos.len() == 0 [Sin registro.] else { tabla((1fr, 3cm, 2.6cm), ("Curso", "Nivel", "Aprobación"), d.cursos.map(c => (c.nombre, c.nivel, c.fecha))) }

#seccion("Premios y distinciones")
#if d.premios.len() == 0 [Sin registro.] else { tabla((1fr, 2cm, 2.6cm), ("Premio", "Años", "Fecha"), d.premios.map(c => (c.tipo, c.anios, c.fecha))) }

#seccion("Material a cargo")
#if d.material.len() == 0 [Sin registro.] else { tabla((1fr, 1.4cm, 2.6cm), ("Artículo", "Cant.", "Origen"), d.material.map(c => (c.articulo, c.cantidad, c.origen))) }

#seccion("Campaña económica")
#if d.campana == none [Sin registro.] else [
  Campaña #d.campana.anio: venta total #d.campana.venta, talonario adicional #d.campana.adicional, saldo a favor #d.campana.saldo.
  #if d.campana.obs != "" [ #text(fill: rojo)[Observación: #d.campana.obs] ]]

#seccion("Cuotas sociales " + d.cuotas.periodo)
Pagadas: #d.cuotas.pagadas. Pendientes: #d.cuotas.pendientes.

#v(1.6cm)
#grid(columns: (1fr, 1fr), gutter: 2cm,
  align(center)[#line(length: 70%, stroke: 0.5pt) Secretario(a) de Compañía],
  align(center)[#line(length: 70%, stroke: 0.5pt) Director(a) de Compañía])
