#!/usr/bin/env python3
"""
Genera supabase/seed.sql con los datos de muestra reunidos de las planillas de la compañía
(data_segunda.json). Uso:
    python3 scripts/migrar_desde_json.py ruta/data_segunda.json > supabase/seed.sql
Todo lo que no se puede asignar con certeza va a gestion.staging_importacion para revisión
humana, en vez de inventarse.
"""
import json, sys, uuid, re, unicodedata
from datetime import date

NS = uuid.UUID('6b1f4c5e-2da0-4c1b-9a6e-000000000002')
MESES = {m: i+1 for i, m in enumerate(['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'])}
MESES_LARGO = {m: i+1 for i, m in enumerate(['enero','febrero','marzo','abril','mayo','junio','julio','agosto',
                                             'septiembre','octubre','noviembre','diciembre'])}

def q(v):
    if v is None or v == '': return 'null'
    if isinstance(v, bool): return 'true' if v else 'false'
    if isinstance(v, (int, float)): return str(int(v)) if float(v).is_integer() else str(v)
    return "'" + str(v).replace("'", "''") + "'"

def pid(reg): return str(uuid.uuid5(NS, f'persona-{reg}'))
def norm(s): return ''.join(c for c in unicodedata.normalize('NFD', str(s).lower()) if unicodedata.category(c) != 'Mn').strip()

def partir_nombre(n):
    t = n.split()
    if len(t) >= 4: return ' '.join(t[:-2]), t[-2], t[-1]
    if len(t) == 3: return t[0], t[1], t[2]
    if len(t) == 2: return t[0], t[1], None
    return n, '(sin apellido)', None

def fecha_larga(s, anio=2026):
    m = re.search(r'(\d{1,2}) de (\w+)(?: de (\d{4}))?', s.lower())
    if not m: return None
    return date(int(m.group(3) or anio), MESES_LARGO[m.group(2)], int(m.group(1))).isoformat()

def main(path):
    d = json.load(open(path, encoding='utf-8'))
    out = ['-- Datos de muestra generados desde las planillas 2025-2026 de la Segunda Compañía.',
           '-- Revisar gestion.staging_importacion: allí queda lo que requiere validación humana.',
           'set search_path = gestion, public;', 'begin;',
           "insert into compania values (2, 'Segunda Compañía', 'Cuerpo de Bomberos de Limache', 'Atención, Sacrificio, Lealtad');"]
    stg = []
    def staging(origen, datos, error):
        stg.append(f"insert into staging_importacion(origen, datos, estado, error) values ({q(origen)}, {q(json.dumps(datos, ensure_ascii=False))}::jsonb, 'pendiente', {q(error)});")

    # Personas
    people = d['people']; regs = {p['reg'] for p in people}
    for p in people:
        n, ap, am = partir_nombre(p['nombre'])
        rango = 'honorario' if p.get('rango') == 'Honorario' else 'bombero'
        obs = '; '.join(x for x in [f"Cargo en libro de asistencia: {p['cargo']}" if p.get('cargo') else '',
                                     f"Inventario 2025: {p['rango_inventario']}" if p.get('rango_inventario') else ''] if x)
        out.append(f"insert into persona(id, compania_id, registro, nombres, apellido_paterno, apellido_materno, fecha_ingreso, rango, observaciones) values "
                   f"({q(pid(p['reg']))}, 2, {p['reg']}, {q(n)}, {q(ap)}, {q(am)}, {q(p.get('ingreso'))}, {q(rango)}, {q(obs)});")
        if not p.get('ingreso'): staging('persona_fecha_ingreso', {'registro': p['reg'], 'nombre': p['nombre']}, 'Falta fecha de ingreso')
        staging('persona_nivel_anb', {'registro': p['reg'], 'nombre': p['nombre']}, 'Sin registro de nivel ANB ni premios en los archivos revisados')

    # Asistencia
    claves = sorted({l['clave'] for l in d['listas']})
    desc = {'RO': 'Reunión ordinaria', 'RE': 'Reunión extraordinaria'}
    for c in claves:
        out.append(f"insert into tipo_acto(clave, descripcion, obligatorio) values ({q(c)}, {q(desc.get(c, 'Clave ' + c + ' (completar descripción)'))}, {q(c in ('RO','RE'))});")
    for i, l in enumerate(d['listas'], start=1):
        out.append(f"insert into lista(id, compania_id, numero, anio, fecha, clave, origen) values ({i}, 2, {l['n']}, {l['fecha'][:4]}, {q(l['fecha'])}, {q(l['clave'])}, 'importacion');")
    vals = []
    for p in people:
        for i, m in enumerate(p['marcas'], start=1):
            if m in 'AFPRS': vals.append(f"({i}, {q(pid(p['reg']))}, {q(m)})")
    for k in range(0, len(vals), 500):
        out.append('insert into asistencia(lista_id, persona_id, marca) values ' + ',\n'.join(vals[k:k+500]) + ';')
    out.append(f"select setval(pg_get_serial_sequence('gestion.lista','id'), {len(d['listas'])});")

    # Órdenes y guardias
    for i, o in enumerate(d['ordenes'], start=1):
        f = fecha_larga(o['fecha'])
        out.append(f"insert into orden_capitania(id, numero, anio, fecha, materia, texto) values ({i}, {o['n']}, 2026, {q(f)}, {q(o.get('materia'))}, {q(o.get('texto'))});")
        for g in o.get('guardias', []):
            fg = fecha_larga(g['dia'])
            for nom, reg in zip(g['personal'], g.get('regs', [])):
                if reg in regs and fg:
                    out.append(f"insert into guardia(orden_id, persona_id, inicio) values ({i}, {q(pid(reg))}, {q(fg + ' 23:00-03')});")
                else:
                    staging('guardia', {'orden': o['n'], 'dia': g['dia'], 'nombre': nom, 'registro': reg}, 'Bombero no está en el libro de asistencia 2026')
    out.append(f"select setval(pg_get_serial_sequence('gestion.orden_capitania','id'), {len(d['ordenes'])});")

    # Artículos, unidades, inventario
    arts = {}
    def art(nombre, cat=None):
        k = norm(nombre)
        if k not in arts:
            arts[k] = len(arts) + 1
            out.append(f"insert into articulo(id, nombre, categoria) values ({arts[k]}, {q(nombre.strip().capitalize())}, {q(cat)});")
        return arts[k]
    est = lambda e: {'BUENO': 'bueno', 'MALO': 'malo', 'MALOS': 'malo', 'REGULAR': 'regular'}.get(str(e).upper().strip(), 'sin_revisar')
    for j, u in enumerate(d['unidades'], start=1):
        fi = u['ficha']
        anio = int(float(fi['año'])) if fi.get('año') else None
        pat = fi['patente'] if fi.get('patente') not in (None, 'C.C.') else None
        out.append(f"insert into unidad(id, codigo, tipo, patente, marca, anio, transmision) values ({j}, {q(u['unidad'])}, {q(u['tipo'])}, {q(pat)}, {q(fi.get('marca_modelo'))}, {q(anio)}, {q(fi.get('transmision'))});")
        out.append(f"insert into revision_inventario(unidad_id, fecha, observacion) values ({j}, {q(fi.get('fecha_inventario'))}, 'Inventario material menor 2025 (planilla INVENTARIO 2-3 REV 1)');")
        for it in u['items']:
            a = art(it['nombre'])
            cant = it['cantidad'] if isinstance(it['cantidad'], (int, float)) else 1
            out.append(f"insert into item_inventario(articulo_id, unidad_id, ubicacion, marca, n_serie, cantidad, estado, observacion) values "
                       f"({a}, {j}, {q(str(it['ubicacion']).capitalize())}, {q(it.get('marca') if it.get('marca') not in ('S/M','') else None)}, {q(it.get('serie') or None)}, {cant}, {q(est(it.get('estado')))}, {q(it.get('obs'))});")
    ucod = {u['unidad']: j for j, u in enumerate(d['unidades'], start=1)}
    for e in d['era']:
        a = art(e['descripcion'], 'ERA')
        out.append(f"insert into item_inventario(articulo_id, unidad_id, ubicacion, n_serie, estado, observacion) values ({a}, {q(ucod.get(e.get('ubicacion')))}, {q(e.get('ubicacion'))}, {q((e.get('serie') or '').replace('.0','') or None)}, {q(est(e.get('estado')))}, {q(' '.join(x for x in [str(e.get('enumeracion') or ''), str(e.get('obs') or '')] if x) or None)});")
    for b in d['bodega']:
        if b['descripcion'] == 'UNIDAD': continue
        a = art(b['descripcion'][:120])
        out.append(f"insert into item_inventario(articulo_id, ubicacion, cantidad, estado) values ({a}, 'Bodega', {b['cantidad'] if isinstance(b['cantidad'], (int, float)) else 1}, 'sin_revisar');")
    for p in people:
        for e in p.get('epp', []):
            a = art(e, 'Tenida/EPP')
            out.append(f"insert into asignacion(persona_id, articulo_id, observacion) values ({q(pid(p['reg']))}, {a}, 'Inventario 2025 por bombero');")
    out.append(f"select setval(pg_get_serial_sequence('gestion.articulo','id'), {len(arts)});")
    out.append(f"select setval(pg_get_serial_sequence('gestion.unidad','id'), {len(d['unidades'])});")

    # Tesorería: categorías, presupuesto, movimientos, cierres
    cats = {}
    for t in d['transacciones']:
        if t['codigo'] not in cats:
            cats[t['codigo']] = len(cats) + 1
            out.append(f"insert into categoria(id, codigo, nombre, tipo) values ({cats[t['codigo']]}, {q(t['codigo'])}, {q(t['categoria'])}, {q(t['tipo'])});")
    out.append("insert into presupuesto(id, anio, version, vigente) values (1, 2026, 1, true);")
    for k, l in enumerate(d['presupuesto_cumplimiento']['lineas'], start=1):
        out.append(f"insert into presupuesto_linea(id, presupuesto_id, item, tipo, monto_anual, detalle) values ({k}, 1, {q(l['item'])}, {q(l['tipo'].lower())}, {q(l['presupuesto_anual'] or 0)}, {q(l.get('nota'))});")
    for t in d['transacciones']:
        dd, mm = t['fecha'].split('-')
        f = date(int(t['mes'][:4]), MESES[mm[:3].lower()], int(dd)).isoformat()
        out.append(f"insert into movimiento(fecha, tipo, categoria_id, monto, glosa) values ({q(f)}, {q(t['tipo'])}, {cats[t['codigo']]}, {t['monto']}, {q(t['detalle'])});")
        if t['codigo'] == '1001001':
            staging('cuota', {'fecha': f, 'detalle': t['detalle'], 'monto': t['monto']}, 'Asignar bombero y mes(es) pagados antes de registrar la cuota')
    for m in d['tesoreria']['meses']:
        if m.get('faltante'): staging('cierre_mensual', {'mes': m['mes']}, 'Cuenta mensual no disponible en los archivos'); continue
        mes, anio = m['mes'].split()
        per = date(int(anio), MESES_LARGO[mes.lower()], 1).isoformat()
        out.append(f"insert into cierre_mensual(periodo, saldo_anterior, ingresos, egresos, saldo_cartola, cheques_no_cobrados) values ({q(per)}, {m['saldo_anterior']}, {m['ingresos']}, {m['egresos']}, {q(m.get('cartola'))}, {q(m.get('no_cobrados', 0))});")
    out.append(f"select setval(pg_get_serial_sequence('gestion.categoria','id'), {len(cats)});")

    # Campaña 2025
    out.append("insert into campana(id, anio, valor_talonario) values (1, 2025, 1000);")
    for p in people:
        c = p.get('campana_2025')
        if c:
            out.append(f"insert into campana_saldo(campana_id, persona_id, venta_total, adicional, saldo_arrastre, observacion) values (1, {q(pid(p['reg']))}, {c['venta_total']}, {c['adicional']}, {c['saldo_2023_2024']}, {q(c.get('obs') or c.get('nota'))});")

    # Actas y acuerdos
    tipo_corto = {'Reunión Ordinaria': 'RO', 'Reunión Extraordinaria': 'REO'}
    for k, a in enumerate(d['actas'], start=1):
        lid = next((i for i, l in enumerate(d['listas'], start=1) if l['n'] == (a.get('lista_libro') or {}).get('n')), None)
        out.append(f"insert into acta(id, tipo, fecha, lista_id, presentes, permisos) values ({k}, {q(tipo_corto.get(a['tipo'], a['tipo']))}, {q(a['fecha'])}, {q(lid)}, {q(a.get('presentes_acta'))}, {q(a.get('permisos_acta'))});")
        for n, ac in enumerate(a['acuerdos'], start=1):
            out.append(f"insert into acuerdo(acta_id, numero, texto, resultado, seguimiento) values ({k}, {n}, {q(ac['texto'])}, {q(ac.get('resultado'))}, {q((ac.get('votos') or '') + ' · ' + (ac.get('seguimiento') or ''))});")
    out.append(f"select setval(pg_get_serial_sequence('gestion.acta','id'), {len(d['actas'])});")

    # Correspondencia
    for c in d['correspondencia']:
        try: dd, mm, yy = c['fecha'].split('/'); f = date(2000 + int(yy), int(mm), int(dd)).isoformat()
        except Exception: staging('correspondencia', c, 'Fecha no reconocida'); continue
        out.append(f"insert into correspondencia(sentido, numero, fecha, contraparte, materia) values ({q(c['tipo'].lower())}, {q(c.get('doc'))}, {q(f)}, {q(c.get('contraparte'))}, {q(c.get('materia'))});")

    out += stg
    out.append('commit;')
    out.append('-- Luego: select gestion.generar_alertas();')
    sys.stdout.write('\n'.join(out) + '\n')

if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'data_segunda.json')
