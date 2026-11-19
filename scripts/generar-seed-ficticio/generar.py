#!/usr/bin/env python3
"""
Genera supabase/seed.sql con datos FICTICIOS de desarrollo.

Uso:
    python3 scripts/generar-seed-ficticio/generar.py > supabase/seed.sql

Nada de esto es real: nombres, RUT, direcciones y montos son inventados.
Los usuarios demo tienen la contraseña `demo1234` y existen para probar
 cada rol de la matriz RLS.
"""
from __future__ import annotations

import random
import uuid
from datetime import date, timedelta

random.seed(20261112)

MESES_LARGO = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
]

NS = uuid.UUID("11111111-2222-3333-4444-555555555555")
COMPANIA = 1
PASSWORD = "demo1234"

out: list[str] = []


def w(line: str = "") -> None:
    out.append(line)


def q(value) -> str:
    if value is None:
        return "null"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float)):
        return str(int(value)) if float(value).is_integer() else str(value)
    return "'" + str(value).replace("'", "''") + "'"


def persona_id(registro: int) -> str:
    return str(uuid.uuid5(NS, f"persona-{registro}"))


def user_id(email: str) -> str:
    return str(uuid.uuid5(NS, f"usuario-{email}"))


def bulk(prefix: str, rows: list[str], chunk: int = 400) -> None:
    for i in range(0, len(rows), chunk):
        w(prefix + ",\n".join(rows[i:i + chunk]) + ";")


# ---------------------------------------------------------------------------
# Personas
# ---------------------------------------------------------------------------
NOMBRES = [
    ("Alejandra", "Rojas", "Pizarro"), ("Benjamín", "Soto", "Aguilera"),
    ("Camila", "Muñoz", "Tapia"), ("Daniel", "Fuentes", "Rivas"),
    ("Elena", "Cárdenas", "Vega"), ("Felipe", "Morales", "Sepúlveda"),
    ("Gabriela", "Torres", "Navarro"), ("Héctor", "Silva", "Contreras"),
    ("Ignacia", "Paredes", "Leiva"), ("Joaquín", "Herrera", "Molina"),
    ("Karen", "Espinoza", "Salinas"), ("Luis", "Vergara", "Cortés"),
    ("María", "Olivares", "Reyes"), ("Nicolás", "Guzmán", "Farías"),
    ("Olivia", "Mendez", "Riquelme"), ("Pablo", "Castillo", "Bravo"),
    ("Quintín", "Araya", "Valdés"), ("Rocío", "Sepúlveda", "Lagos"),
    ("Samuel", "Ibáñez", "Cáceres"), ("Tamara", "Véliz", "Andrade"),
    ("Ulises", "Poblete", "Sáez"), ("Valentina", "Godoy", "Miranda"),
    ("Walter", "Órdenes", "Peña"), ("Ximena", "Alarcón", "Fuentes"),
    ("Yerko", "Sandoval", "Pérez"), ("Zulema", "Castro", "Hidalgo"),
    ("Álvaro", "Bustamante", "Ramos"), ("Belén", "Navarrete", "Ortiz"),
    ("Cristóbal", "Latorre", "Werner"), ("Dominique", "Astudillo", "Vargas"),
]

REGISTROS = list(range(201, 231))
personas = []
for i, (nombre, ap, am) in enumerate(NOMBRES):
    reg = REGISTROS[i]
    fecha_ingreso = date(2026, 1, 1) - timedelta(days=random.randint(400, 8000))
    rango = "honorario" if i % 7 == 3 else ("aspirante" if i == 29 else "bombero")
    estado = "activo"
    if i == 27:
        estado = "suspendido"
    if i == 28:
        estado = "renunciado"
    personas.append({
        "id": persona_id(reg), "registro": reg, "nombres": nombre,
        "apellido_paterno": ap, "apellido_materno": am,
        "fecha_nacimiento": date(1980 + i % 20, (i % 12) + 1, (i % 27) + 1),
        "rut": f"{10000000 + reg * 37}-{reg % 10}",
        "email": f"persona{reg}@demo.local",
        "telefono": f"+569{10000000 + reg}",
        "direccion": f"Pasaje Ficticio {reg}, Limache",
        "fecha_ingreso": fecha_ingreso, "rango": rango, "estado": estado,
        "fecha_estado": date(2026, 10, 1) if estado != "activo" else None,
    })

w("-- =====================================================================")
w("-- DATOS FICTICIOS DE DESARROLLO · ERP Segunda Compañía")
w("-- Generado por scripts/generar-seed-ficticio/generar.py")
w("-- Nada de lo siguiente corresponde a personas reales.")
w("-- Usuarios demo: <rol>@demo.local / demo1234")
w("-- =====================================================================")
w("begin;")
w("set local statement_timeout = '120s';")
w()

w("-- Personas")
for p in personas:
    w(
        "insert into personal.persona (id, compania_id, registro, rut, nombres, apellido_paterno, "
        "apellido_materno, fecha_nacimiento, sexo, email, telefono, direccion, fecha_ingreso, rango, estado, fecha_estado) values ("
        f"{q(p['id'])}, {COMPANIA}, {p['registro']}, {q(p['rut'])}, {q(p['nombres'])}, "
        f"{q(p['apellido_paterno'])}, {q(p['apellido_materno'])}, {q(p['fecha_nacimiento'])}, "
        f"{q(['masculino','femenino'][p['registro'] % 2])}, {q(p['email'])}, {q(p['telefono'])}, "
        f"{q(p['direccion'])}, {q(p['fecha_ingreso'])}, {q(p['rango'])}, {q(p['estado'])}, {q(p['fecha_estado'])});"
    )
w()

# Datos sensibles: solo para un par, para probar la lectura auditada.
w("-- Datos sensibles (1 a 1)")
for reg, grupo, alergias in [
    (201, "O+", "Penicilina"), (204, "A-", None), (210, "B+", "Látex"), (219, "AB+", None),
]:
    w(
        "insert into personal.persona_dato_sensible (persona_id, grupo_sanguineo, alergias, "
        "contacto_emergencia_nombre, contacto_emergencia_telefono, notas) values ("
        f"{q(persona_id(reg))}, {q(grupo)}, {q(alergias)}, "
        f"'Contacto de emergencia {reg}', '+56900000000', 'Dato ficticio de desarrollo');"
    )
w()

# ---------------------------------------------------------------------------
# Usuarios y roles
# ---------------------------------------------------------------------------
ROLES = [
    ("director", 201), ("secretario", 202), ("prosecretario", 203),
    ("tesorero", 204), ("protesorero", 205), ("capitan", 206),
    ("teniente_1", 207), ("teniente_2", 208), ("teniente_3", 209),
    ("ayudante", 210), ("consejo", 211), ("bombero", 212), ("admin", 213),
]

w("-- Usuarios demo de Supabase Auth (contraseña: demo1234)")
for rol, reg in ROLES:
    uid = user_id(f"{rol}@demo.local")
    correo = f"{rol}@demo.local"
    w(
        "insert into auth.users (instance_id, id, aud, role, email, encrypted_password, "
        "email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, "
        "confirmation_token, recovery_token, email_change_token_new, email_change) values ("
        "'00000000-0000-0000-0000-000000000000', "
        f"{q(uid)}, 'authenticated', 'authenticated', {q(correo)}, "
        f"extensions.crypt({q(PASSWORD)}, extensions.gen_salt('bf')), now(), "
        "'{\"provider\":\"email\",\"providers\":[\"email\"]}'::jsonb, '{}'::jsonb, now(), now(), '', '', '', '');"
    )
    w(
        "insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at) values ("
        f"gen_random_uuid(), {q(uid)}, {q(uid)}, "
        f"jsonb_build_object('sub', {q(uid)}, 'email', {q(correo)}), 'email', now(), now(), now());"
    )
w()

w("-- Vínculo con la persona y rol manual")
for rol, reg in ROLES:
    uid = user_id(f"{rol}@demo.local")
    w(
        "insert into seguridad.usuario (user_id, persona_id, email, activo) values ("
        f"{q(uid)}, {q(persona_id(reg))}, {q(f'{rol}@demo.local')}, true);"
    )
    w(
        "insert into seguridad.usuario_rol (user_id, rol, desde, motivo) values ("
        f"{q(uid)}, {q(rol)}, '2026-01-01', 'Semilla de desarrollo');"
    )
    # Todos aceptan el consentimiento menos el bombero, para probar el flujo.
    if rol != "bombero":
        w(
            "insert into seguridad.consentimiento (usuario_id, texto_id) "
            f"select {q(uid)}, id from seguridad.consentimiento_texto where vigente;"
        )
w()

# ---------------------------------------------------------------------------
# Catálogos de asistencia extra
# ---------------------------------------------------------------------------
w("-- Tipos de acto adicionales")
for clave, desc, oblig in [
    ("1", "Citación de compañía", True), ("2", "Instrucción de compañía", False),
    ("3", "Servicio de guardia", False), ("15-1", "Acto interno 15-1", False),
    ("15-2", "Clave 15-2 (completar descripción)", False), ("F1", "Formación 1", False),
]:
    w(
        "insert into asistencia.tipo_acto (clave, descripcion, obligatorio) values ("
        f"{q(clave)}, {q(desc)}, {q(oblig)}) on conflict (clave) do nothing;"
    )
w()

# ---------------------------------------------------------------------------
# Listas y asistencia
# ---------------------------------------------------------------------------
w("-- 40 listas de asistencia de 2026")
listas = []
for n in range(1, 41):
    if n == 38:
        fecha = date(2026, 10, 29)
    elif n == 39:
        fecha = date(2026, 11, 5)
    elif n == 40:
        fecha = date(2026, 11, 10)
    else:
        fecha = date(2026, 1, 8) + timedelta(days=7 * (n - 1))
    tipo = "RO" if n % 4 != 0 else "RE"
    listas.append({"n": n, "fecha": fecha, "tipo": tipo})
    w(
        "insert into asistencia.lista (id, compania_id, anio, numero, fecha, tipo_acto_clave, descripcion, estado, origen) "
        f"overriding system value values ({n}, {COMPANIA}, {fecha.year}, {n}, {q(fecha)}, {q(tipo)}, "
        f"'Lista ficticia N° {n}', 'borrador', 'manual');"
    )
w()

w("-- Marcas de asistencia")
activos = [p for p in personas if p["estado"] == "activo"]
rows = []
for l in listas:
    if l["n"] <= 37:
        elegidos = activos
    elif l["n"] == 38:
        elegidos = activos
    elif l["n"] == 39:
        elegidos = activos
    else:
        elegidos = activos[:18]
    for p in elegidos:
        r = random.random()
        if r < 0.78:
            marca = "A"
        elif r < 0.88:
            marca = "F"
        elif r < 0.94:
            marca = "P"
        elif r < 0.965:
            marca = "L"
        elif r < 0.985:
            marca = "R"
        else:
            marca = "S"
        rows.append(f"({l['n']}, {q(p['id'])}, {q(marca)})")
bulk("insert into asistencia.asistencia (lista_id, persona_id, marca) values ", rows)
w()

w("-- Cierre y envío de listas (primero se cargaron las marcas)")
for l in listas:
    if l["n"] <= 37:
        w(
            "update asistencia.lista set estado = 'enviada', cerrada_en = "
            f"{q(l['fecha'])}::timestamptz + interval '20 hours', enviada_en = "
            f"{q(l['fecha'])}::timestamptz + interval '30 hours' where id = {l['n']};"
        )
    elif l["n"] in (38, 39):
        w(
            "update asistencia.lista set estado = 'cerrada', cerrada_en = "
            f"{q(l['fecha'])}::timestamptz + interval '22 hours' where id = {l['n']};"
        )
w("select setval(pg_get_serial_sequence('asistencia.lista','id'), 40);")
w()

# ---------------------------------------------------------------------------
# Actas, acuerdos y cargos
# ---------------------------------------------------------------------------
w("-- Actas y acuerdos")
actas = [
    (1, "RO", 1, date(2026, 1, 15), "Acta de elección de oficialidad 2026"),
    (2, "RO", 2, date(2026, 4, 9), "Acta de reunión ordinaria de abril"),
    (3, "REO", 1, date(2026, 7, 2), "Acta de junta de oficiales"),
    (4, "RO", 3, date(2026, 10, 8), "Acta de reunión ordinaria de octubre"),
]
for i, tipo, num, fecha, texto in actas:
    w(
        "insert into secretaria.acta (id, tipo_sesion_codigo, numero, anio, fecha, lista_id, quorum_ok) "
        f"overriding system value values ({i}, {q(tipo)}, {num}, 2026, {q(fecha)}, {num}, true) "
        "on conflict do nothing;"
    )
for i in range(1, 4):
    w(f"update secretaria.acta set aprobada_en_acta_id = {i + 1} where id = {i};")

# Los acuerdos se numeran 1..N por acta; los ids de actor se fijan más abajo.
acuerdos_por_acta = [
    (1, "Aprobar el presupuesto anual 2026 presentado por Tesorería.", 8, 0, 1, "aprobado", 12000000, "2026-03-31", "cumplido"),
    (1, "Adquirir equipos de protección personal para la guardia nocturna.", 7, 1, 1, "aprobado", 850000, "2026-06-30", "en_curso"),
    (2, "Autorizar la campaña económica 2026.", 9, 0, 0, "aprobado", None, None, "cumplido"),
    (3, "Contratar mantención preventiva de la unidad M-21.", 5, 0, 0, "aprobado", 320000, "2026-08-15", "pendiente"),
]
numeros: dict[int, int] = {}
for idx, (acta, texto, vf, vc, ab, res, monto, plazo, estado) in enumerate(acuerdos_por_acta, start=1):
    numeros[acta] = numeros.get(acta, 0) + 1
    w(
        "insert into secretaria.acuerdo (id, acta_id, numero, texto, votos_favor, votos_contra, "
        "abstenciones, resultado, monto, plazo, estado) overriding system value values ("
        f"{idx}, {acta}, {numeros[acta]}, {q(texto)}, {vf}, {vc}, {ab}, {q(res)}, "
        f"{q(monto)}, {q(plazo)}, {q(estado)}) on conflict do nothing;"
    )
w("select setval(pg_get_serial_sequence('secretaria.acuerdo','id'), 4);")


w("-- Cargos 2026")
cargos = [
    (201, "DIR", 1), (202, "SEC", 1), (203, "PROSEC", 1), (204, "TES", 1),
    (205, "PROTES", 1), (206, "CAP", 1), (207, "T1", 1), (208, "T2", 1),
    (209, "T3", 1), (210, "AYU", 1), (211, "CONS", 1),
]
for reg, codigo, acta in cargos:
    w(
        "insert into personal.cargo_periodo (persona_id, cargo_id, desde, acta_id) "
        f"select {q(persona_id(reg))}, id, '2026-01-15', {acta} from personal.cargo where codigo = {q(codigo)};"
    )
w()

# ---------------------------------------------------------------------------
# Formación, premios, situaciones y licencias
# ---------------------------------------------------------------------------
w("-- Cursos")
cursos = [
    ("Curso Básico de Bombero", "Academia Nacional de Bomberos", "Básico"),
    ("Curso Intermedio", "Academia Nacional de Bomberos", "Intermedio"),
    ("Curso Avanzado", "Academia Nacional de Bomberos", "Avanzado"),
    ("Materiales Peligrosos", "Academia Nacional de Bomberos", "Hazmat"),
    ("Rescate Vehicular", "Academia Nacional de Bomberos", "Especialidad"),
]
for i, (nombre, inst, nivel) in enumerate(cursos, start=1):
    w(
        "insert into personal.curso (id, nombre, institucion, nivel, horas) overriding system value values ("
        f"{i}, {q(nombre)}, {q(inst)}, {q(nivel)}, 40);"
    )
for idx, p in enumerate(personas[:22], start=1):
    for c in (1, 2, 3, 4, 5):
        if (p["registro"] + c) % 3 == 0:
            w(
                "insert into personal.persona_curso (persona_id, curso_id, fecha_aprobacion, vigente_hasta) values ("
                f"{q(p['id'])}, {c}, {q(date(2024, 1, 1) + timedelta(days=c * 40))}, '2030-12-31');"
            )
w("select setval(pg_get_serial_sequence('personal.curso','id'), 5);")
w()

w("-- Premios de constancia")
for i, p in enumerate(personas[:12], start=1):
    anios = [5, 10, 15, 20][i % 4]
    w(
        "insert into personal.persona_premio (persona_id, premio_tipo_id, anios, otorgado_por, fecha) "
        f"select {q(p['id'])}, id, {anios}, 'Compañía', {q(date(2026, 3, 1))} "
        "from personal.premio_tipo where codigo = 'CONSTANCIA';"
    )
w()

w("-- Situaciones especiales y licencias")
w(
    "insert into personal.situacion_especial (persona_id, tipo, desde, hasta, motivo) values ("
    f"{q(persona_id(210))}, 'licencia_medica', '2026-11-01', '2026-11-20', 'Reposo ficticio por licencia');"
)
w(
    "insert into personal.situacion_especial (persona_id, tipo, desde, hasta, motivo) values ("
    f"{q(persona_id(222))}, 'embarazo', '2026-08-01', null, 'Situación ficticia de desarrollo');"
)
w(
    "insert into personal.situacion_especial (persona_id, tipo, desde, hasta, motivo) values ("
    f"{q(persona_id(228))}, 'suspension', '2026-09-01', '2026-12-31', 'Suspensión ficticia');"
)
for reg, clase in [(201, "A2"), (206, "A4"), (210, "B")]:
    w(
        "insert into personal.licencia_conducir (persona_id, clase, numero, vence) values ("
        f"{q(persona_id(reg))}, {q(clase)}, 'FICTICIO-{reg}', {q(date(2027, 6, 1))});"
    )
w()

# ---------------------------------------------------------------------------
# Material mayor y menor
# ---------------------------------------------------------------------------
w("-- Unidades (material mayor)")
unidades = [
    (1, "M-21", "CONV", "Convencional", "ABCD12", "Volvo", "FMX", 2018, 48000),
    (2, "R-22", "RESC", "Rescate", "EFGH34", "Mercedes-Benz", "Atego", 2020, 31000),
    (3, "F-23", "FOR", "Forestal", "IJKL56", "Toyota", "Hilux", 2022, 22000),
]
for uid, codigo, tipo, nombre, patente, marca, modelo, anio, km in unidades:
    w(
        "insert into material.unidad (id, codigo, tipo_unidad_id, patente, marca, modelo, anio, transmision, km_actual, estado) "
        "overriding system value values ("
        f"{uid}, {q(codigo)}, (select id from material.tipo_unidad where codigo = {q(tipo)}), "
        f"{q(patente)}, {q(marca)}, {q(modelo)}, {anio}, 'automática', {km}, 'operativa');"
    )
w()

w("-- Documentos de unidades")
for uid, tipo, vence in [
    (1, "revision_tecnica", date(2027, 3, 1)),
    (1, "seguro", date(2026, 12, 1)),
    (2, "revision_tecnica", date(2026, 11, 20)),
    (2, "seguro", date(2027, 5, 1)),
    (3, "revision_tecnica", date(2026, 9, 1)),
]:
    w(
        "insert into material.unidad_documento (unidad_id, tipo, vence) values ("
        f"{uid}, {q(tipo)}, {q(vence)}) on conflict (unidad_id, tipo) do nothing;"
    )
w()

w("-- Vistas 2D y ubicaciones")
vistas = [(1, "izquierda"), (1, "derecha"), (1, "trasera"), (2, "izquierda"), (2, "derecha"), (3, "izquierda")]
vid = 0
for uid, lado in vistas:
    vid += 1
    w(
        "insert into material.unidad_vista (id, unidad_id, lado, orden) overriding system value values ("
        f"{vid}, {uid}, {q(lado)}, {vid});"
    )
w()

ubicaciones = []  # (id, unidad, padre, vista, tipo, codigo, nombre, forma)
uid_counter = 0
vid_map = {1: 1, 2: 4, 3: 6}
for unidad, base_vista in [(1, 1), (2, 4), (3, 6)]:
    for j in range(1, 7):
        uid_counter += 1
        forma = [[0.05 + 0.14 * (j - 1), 0.10], [0.18 + 0.14 * (j - 1), 0.10],
                 [0.18 + 0.14 * (j - 1), 0.40], [0.05 + 0.14 * (j - 1), 0.40]]
        import json
        ubicaciones.append((uid_counter, unidad, None, base_vista, "cajonera", f"C{j}", f"Cajonera {j}", json.dumps(forma)))
        if j == 5:
            for k in (1, 2, 3):
                uid_counter += 1
                ubicaciones.append((uid_counter, unidad, uid_counter - 1, base_vista, "cajonera",
                                    f"C5.{k}", f"Cajonera 5.{k}", None))
uid_counter += 1
ubicaciones.append((uid_counter, None, None, None, "bodega", "BOD", "Bodega del cuartel", None))
for u in ubicaciones:
    id_, unidad, padre, vista, tipo, codigo, nombre, forma = u
    w(
        "insert into material.ubicacion (id, unidad_id, padre_id, vista_id, tipo, codigo, nombre, forma, orden) "
        "overriding system value values ("
        f"{id_}, {q(unidad)}, {q(padre)}, {q(vista)}, {q(tipo)}, {q(codigo)}, {q(nombre)}, "
        f"{q(forma)}::jsonb, {id_ % 20});"
    )
w()

w("-- Artículos")
articulos = [
    (1, "Casco de bombero", "EPP", True), (2, "Guantes de protección", "EPP", False),
    (3, "Botas de agua", "EPP", False), (4, "Capote de aproximación", "EPP", False),
    (5, "Equipo de respiración autónoma", "ERA", True), (6, "Cilindro de aire 6.8 L", "ERA", True),
    (7, "Máscara ERA", "ERA", True), (8, "Pitón de 2.5 pulgadas", "HERR", False),
    (9, "Hacha de bombero", "HERR", False), (10, "Tifón", "HERR", False),
    (11, "Radio portátil", "RADIO", True), (12, "Linterna de casco", "OTRO", False),
    (13, "Camilla rígida", "MED", True), (14, "Botiquín de primeros auxilios", "MED", False),
    (15, "Cuerda de rescate 30 m", "HERR", True), (16, "Traje Hazmat nivel B", "EPP", True),
]
for aid, nombre, cat, serie in articulos:
    w(
        "insert into material.articulo (id, nombre, categoria_id, requiere_serie, vida_util_meses) "
        "overriding system value values ("
        f"{aid}, {q(nombre)}, (select id from material.categoria_articulo where codigo = {q(cat)}), "
        f"{q(serie)}, 120);"
    )
w()

w("-- Ítems de inventario")
item_id = 0
items = []
for u in ubicaciones:
    id_, unidad, *_ = u
    if id_ == ubicaciones[-1][0]:
        continue
    for k in range(2):
        item_id += 1
        art = random.choice([2, 3, 4, 8, 9, 10, 12, 14])
        estado = random.choice(["bueno", "bueno", "bueno", "regular", "malo", "sin_revisar"])
        items.append((item_id, art, id_, None, None, random.randint(1, 4), estado))
for k in range(12):
    item_id += 1
    items.append((item_id, random.choice([2, 3, 4, 8, 9, 10, 14]), ubicaciones[-1][0],
                  None, None, random.randint(5, 20), "bueno"))
for iid, art, ubi, marca, serie, cant, estado in items:
    w(
        "insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) "
        "overriding system value values ("
        f"{iid}, {art}, {ubi}, 'Genérica', {q(serie)}, {cant}, {q(estado)}, 'compania', {random.randint(5000, 250000)});"
    )
w("select setval(pg_get_serial_sequence('material.item','id'), (select max(id) from material.item));")
w("select setval(pg_get_serial_sequence('material.ubicacion','id'), (select max(id) from material.ubicacion));")
w("select setval(pg_get_serial_sequence('material.unidad','id'), 3);")
w("select setval(pg_get_serial_sequence('material.articulo','id'), 16);")
w("select setval(pg_get_serial_sequence('material.unidad_vista','id'), 6);")
w()

w("-- Asignaciones de EPP")
for p in personas[:14]:
    for art in random.sample([1, 2, 3, 4, 5], k=random.randint(1, 3)):
        w(
            "insert into material.asignacion (persona_id, articulo_id, cantidad, talla, fecha_entrega, origen) values ("
            f"{q(p['id'])}, {art}, 1, {q(random.choice(['S','M','L','XL']))}, "
            f"{q(date(2026, 3, 1))}, 'compania');"
        )
w()

w("-- Revisiones y bitácoras")
for uid in (1, 2, 3):
    w(
        "insert into material.revision_inventario (unidad_id, fecha, observacion) values ("
        f"{uid}, {q(date(2026, 6, 15) if uid != 3 else date(2025, 10, 1))}, 'Revisión ficticia');"
    )
for uid, km in [(1, 48200), (2, 31500), (3, 22400)]:
    w(
        "insert into material.bitacora_unidad (unidad_id, fecha, km, horas_bomba, novedades) values ("
        f"{uid}, '2026-10-31', {km}, {random.randint(10, 60)}, 'Sin novedades');"
    )
w()

# ---------------------------------------------------------------------------
# Tesorería
# ---------------------------------------------------------------------------
w("-- Tesorería: cuenta, fondo, categorías")
w("insert into tesoreria.cuenta (id, nombre, banco, numero, tipo) overriding system value values (1, 'Cuenta corriente compañía', 'Banco Ficticio', '000-123456-7', 'corriente');")
w("select setval(pg_get_serial_sequence('tesoreria.cuenta','id'), 1);")
w()
categorias = [
    (1, "1001001", "Cuotas sociales", "ingreso"),
    (2, "1002001", "Campaña económica", "ingreso"),
    (3, "1003001", "Donaciones", "ingreso"),
    (4, "1004001", "Aportes municipales", "ingreso"),
    (5, "2001001", "Combustible", "egreso"),
    (6, "2002001", "Mantención de unidades", "egreso"),
    (7, "2003001", "Material menor", "egreso"),
    (8, "2004001", "Seguros", "egreso"),
    (9, "2005001", "Cuotas al Cuerpo", "egreso"),
    (10, "2006001", "Gastos administrativos", "egreso"),
]
for cid, codigo, nombre, tipo in categorias:
    w(
        "insert into tesoreria.categoria (id, codigo, nombre, tipo) overriding system value values ("
        f"{cid}, {q(codigo)}, {q(nombre)}, {q(tipo)}) on conflict (id) do nothing;"
    )
w("select setval(pg_get_serial_sequence('tesoreria.categoria','id'), 10);")
w()

w("-- Presupuesto 2026")
w("insert into tesoreria.presupuesto (id, anio, version, acta_id, vigente) overriding system value values (1, 2026, 1, 1, true);")
presupuesto_montos = {1: 4200000, 2: 1800000, 3: 600000, 4: 2000000, 5: 1200000,
                      6: 1500000, 7: 800000, 8: 700000, 9: 900000, 10: 600000}
for cid, monto in presupuesto_montos.items():
    w(
        "insert into tesoreria.presupuesto_linea (presupuesto_id, categoria_id, item, monto_anual) values ("
        f"1, {cid}, (select nombre from tesoreria.categoria where id = {cid}), {monto});"
    )
w("select setval(pg_get_serial_sequence('tesoreria.presupuesto','id'), 1);")
w()

w("-- Compromisos")
compromisos = [
    (1, "Compra de EPP para guardia nocturna", 850000, date(2026, 11, 30), "comprometido", 2, 7),
    (2, "Mantención preventiva M-21", 320000, date(2026, 11, 20), "devengado", 4, 6),
    (3, "Pago de seguro de unidades", 450000, date(2026, 12, 15), "comprometido", 1, 8),
    (4, "Cuota anual al Cuerpo", 900000, date(2026, 12, 31), "comprometido", 1, 9),
    (5, "Reparación de material menor", 120000, date(2026, 10, 15), "pagado", 1, 7),
]
for cid, desc, monto, fecha, estado, acuerdo, cat in compromisos:
    w(
        "insert into tesoreria.compromiso (id, descripcion, monto, fecha_estimada, estado, acuerdo_id, categoria_id) "
        "overriding system value values ("
        f"{cid}, {q(desc)}, {monto}, {q(fecha)}, {q(estado)}, {acuerdo}, {cat});"
    )
w("select setval(pg_get_serial_sequence('tesoreria.compromiso','id'), 5);")
w()

w("-- Movimientos de 6 meses")
mov_id = 0
mov_rows = []
for mes in range(5, 11):
    for cid, monto, glosa in [
        (1, random.randint(320000, 380000), "Recaudación de cuotas sociales"),
        (2, random.randint(80000, 160000), "Venta de talonarios"),
        (5, random.randint(80000, 120000), "Combustible de unidades"),
        (6, random.randint(40000, 90000), "Mantención menor"),
        (7, random.randint(20000, 60000), "Reposición de material menor"),
        (9, 50000, "Cuota al Cuerpo"),
        (10, random.randint(25000, 45000), "Gastos administrativos"),
    ]:
        mov_id += 1
        tipo = "ingreso" if cid <= 4 else "egreso"
        mov_rows.append(
            f"({mov_id}, {q(date(2026, mes, random.randint(1, 27)))}, {q(tipo)}, 1, "
            f"(select id from tesoreria.fondo where codigo = {q('PROPIO')}), {cid}, {monto}, "
            f"{q(glosa)}, 'transferencia', false)"
        )
# Dos egresos sin comprobante y uno con compromiso pagado
mov_id += 1
mov_rows.append(
    f"({mov_id}, '2026-10-20', 'egreso', 1, (select id from tesoreria.fondo where codigo = 'PROPIO'), 7, 120000, "
    "'Pago de reparación de material menor', 'transferencia', false)"
)
mov_id += 1
mov_rows.append(
    f"({mov_id}, '2026-10-25', 'egreso', 1, (select id from tesoreria.fondo where codigo = 'PROPIO'), 10, 30000, "
    "'Insumos de aseo', 'efectivo', false)"
)
bulk(
    "insert into tesoreria.movimiento (id, fecha, tipo, cuenta_id, fondo_id, categoria_id, monto, glosa, medio_pago, anulado) overriding system value values ",
    mov_rows,
)
w(f"select setval(pg_get_serial_sequence('tesoreria.movimiento','id'), {mov_id});")
w()

w("-- Recurrentes y escenario de proyección")
recurrentes = [
    ("Cuotas sociales mensuales", "ingreso", 360000, "mensual", 1, 5),
    ("Combustible mensual", "egreso", 95000, "mensual", 5, 5),
    ("Gastos administrativos", "egreso", 35000, "mensual", 10, 5),
    ("Seguro anual de unidades", "egreso", 450000, "anual", 8, 1),
]
for desc, tipo, monto, frec, cat, dia in recurrentes:
    w(
        "insert into tesoreria.recurrente (descripcion, tipo, cuenta_id, fondo_id, categoria_id, monto_estimado, frecuencia, dia_mes, desde) values ("
        f"{q(desc)}, {q(tipo)}, 1, (select id from tesoreria.fondo where codigo = 'PROPIO'), {cat}, {monto}, {q(frec)}, {dia}, '2026-01-01');"
    )
w("insert into tesoreria.escenario (id, nombre, descripcion) overriding system value values (1, 'Base', 'Escenario con los valores actuales.');")
w("insert into tesoreria.escenario (id, nombre, descripcion) overriding system value values (2, 'Optimista', 'Escenario con mayor recaudación.');")
for mes in (11, 12):
    w(
        "insert into tesoreria.escenario_ajuste (escenario_id, mes, categoria_id, tipo, monto, descripcion) values ("
        f"2, {q(date(2026, mes, 1))}, 1, 'ingreso', 60000, 'Mayor recaudación esperada');"
    )
w("select setval(pg_get_serial_sequence('tesoreria.escenario','id'), 2);")
w()

w("-- Cuotas sociales")
w("insert into tesoreria.cuota_valor (anio, monto, vigente_desde) values (2026, 3000, '2026-01-01');")
cuota_rows = []
for p in personas:
    if p["rango"] == "honorario" or p["estado"] != "activo":
        continue
    for mes in range(1, 11):
        if random.random() < 0.88:
            cuota_rows.append(
                f"({q(p['id'])}, {q(date(2026, mes, 1))}, 3000)"
            )
bulk("insert into tesoreria.cuota_pago (persona_id, periodo, monto) values ", cuota_rows)
w()

w("-- Cierre mensual de septiembre")
w(
    "insert into tesoreria.cierre_mensual (periodo, cuenta_id, saldo_cartola, saldo_libro, cheques_no_cobrados, observacion) values ("
    "'2026-09-01', 1, 4850000, 4850000, 0, 'Cierre ficticio de septiembre');"
)
w()

w("-- Campaña 2025")
w("insert into tesoreria.campana (id, anio, meta, valor_talonario, acta_id) overriding system value values (1, 2025, 2000000, 1000, 2);")
for p in personas[:20]:
    venta = random.randint(5, 60) * 1000
    w(
        "insert into tesoreria.campana_participacion (campana_id, persona_id, venta_total, aporte_obligatorio, aporte_adicional, saldo_arrastre, observacion) values ("
        f"1, {q(p['id'])}, {venta}, {random.randint(0, 20000)}, {random.randint(0, 30000)}, "
        f"{random.randint(0, 15000)}, 'Dato ficticio');"
    )
w("select setval(pg_get_serial_sequence('tesoreria.campana','id'), 1);")
w()

w("-- Donaciones y beneficios")
for i in range(1, 4):
    w(
        "insert into nucleo.contraparte (tipo, nombre) values ('donante', "
        f"'Donante ficticio {i}') on conflict do nothing;"
    )
w(
    "insert into tesoreria.beneficio (nombre, descripcion, monto, activo) values "
    "('Ayuda de sepelio', 'Beneficio ficticio para socios', 300000, true),"
    "('Beca de formación', 'Apoyo a cursos ANB', 150000, true);"
)
w()

# ---------------------------------------------------------------------------
# Operaciones: guardias
# ---------------------------------------------------------------------------
w("-- Antigüedad manual, exenciones y códigos Charlie")
for idx, p in enumerate(personas):
    if idx % 6 == 0:
        w(
            "update personal.persona set anios_servicio_manual = "
            f"{12 + idx}, exento_guardia = false where id = {q(p['id'])};"
        )
    if idx % 11 == 4:
        w(
            "update personal.persona set exento_guardia = true, "
            f"motivo_exencion = 'Miembro Honorario del Directorio General' where id = {q(p['id'])};"
        )
    if idx < 4:
        w(
            f"update personal.persona set codigo_charlie = 'CH-{201 + idx}' where id = {q(p['id'])};"
        )
for reg in (209, 214):
    w(f"update personal.persona set codigo_charlie = 'CH-{reg}' where id = {q(persona_id(reg))};")
w()

w("-- Abonos de antigüedad")
for i, reg in enumerate([203, 208, 215]):
    w(
        "insert into personal.antiguedad_abono (persona_id, anios, fecha, motivo, resolucion) values ("
        f"{q(persona_id(reg))}, {1.5 if i % 2 else 1}, '2025-03-01', "
        "'Abono por servicio en otra compañía', 'Acta de Oficiales N° 12/2025');"
    )
w()

w("-- Guardias nocturnas históricas (compatibilidad)")
guardia_id = 0
for k in range(6):
    guardia_id += 1
    fecha = date(2026, 8, 1) + timedelta(days=7 * k)
    jefe = personas[(k % 10) + 6]
    w(
        "insert into operaciones.guardia_turno (id, fecha, tipo, jefe_persona_id, inicio, termino) "
        "overriding system value values ("
        f"{guardia_id}, {q(fecha)}, 'nocturna', {q(jefe['id'])}, "
        f"{q(fecha)}::timestamptz + interval '23 hours 30 minutes', {q(fecha + timedelta(days=1))}::timestamptz + interval '9 hours 30 minutes');"
    )
    for p in personas[k:k + 4]:
        w(
            "insert into operaciones.guardia_integrante (turno_id, persona_id, funcion, origen, estado) values ("
            f"{guardia_id}, {q(p['id'])}::uuid, 'voluntario', 'asignacion_capitania', 'cumplida');"
        )
w("select setval(pg_get_serial_sequence('operaciones.guardia_turno','id'), 6);")
w()

w("-- Ciclo de guardias de 14 días: Semana 1 en curso y Semana 2 abierta")
hoy = date.today()
inicio_ciclo = hoy - timedelta(days=hoy.weekday() % 7 + 7)
w(
    "do $$ begin perform operaciones.crear_ciclo_guardia("
    f"'Ciclo {MESES_LARGO[inicio_ciclo.month - 1]} {inicio_ciclo.year}', {q(inicio_ciclo)}, 3); end $$;"
)
w(
    "update operaciones.guardia_ciclo set estado = 'en_curso' "
    f"where fecha_inicio = {q(inicio_ciclo)};"
)
# Semana 1: algunos días con 3, otros con 1 o 2 para probar la regla de cobertura.
candidatos = [p for p in personas if p["estado"] == "activo" and p["registro"] not in (204, 211)]
cubiertos = [3, 3, 1, 2, 3, 0, 1]
base = 0
for dia in range(7):
    n = cubiertos[dia]
    for j in range(n):
        p = candidatos[(base + j) % len(candidatos)]
        w(
            "insert into operaciones.guardia_integrante (turno_id, persona_id, origen, estado) "
            "select t.id, "
            f"{q(p['id'])}::uuid, 'inscripcion', 'inscrito' from operaciones.guardia_turno t "
            f"where t.ciclo_id = (select id from operaciones.guardia_ciclo where fecha_inicio = {q(inicio_ciclo)}) "
            f"and t.fecha = {q(inicio_ciclo + timedelta(days=dia))} on conflict do nothing;"
        )
    base += n
# Semana 2: solo dos días con una persona, para dejar cupos abiertos.
for dia in (8, 10):
    p = candidatos[dia % len(candidatos)]
    w(
        "insert into operaciones.guardia_integrante (turno_id, persona_id, origen, estado) "
        "select t.id, "
        f"{q(p['id'])}::uuid, 'inscripcion', 'inscrito' from operaciones.guardia_turno t "
        f"where t.ciclo_id = (select id from operaciones.guardia_ciclo where fecha_inicio = {q(inicio_ciclo)}) "
        f"and t.fecha = {q(inicio_ciclo + timedelta(days=dia))} on conflict do nothing;"
    )
w()

w("-- Reporte y firma de una noche pasada, con Charlie Z8")
w(
    "do $$ declare v_turno bigint; v_persona uuid; begin "
    f"select id into v_turno from operaciones.guardia_turno where ciclo_id = (select id from operaciones.guardia_ciclo where fecha_inicio = {q(inicio_ciclo)}) and fecha = {q(inicio_ciclo)} limit 1; "
    f"select id into v_persona from personal.persona where id = {q(persona_id(201))}; "
    "perform set_config('request.jwt.claim.sub', v_persona::text, true); "
    "perform set_config('request.jwt.claim.role', 'authenticated', true); "
    "perform operaciones.guardar_reporte_guardia(v_turno, time '23:40', 'Z8', 'CH-201', '{}'::uuid[], '{}'::uuid[], 'Guardia normal, sin novedades.'); "
    "perform operaciones.firmar_reporte_guardia(v_turno); "
    "end $$;"
)
w()

# ---------------------------------------------------------------------------
# Disciplina
# ---------------------------------------------------------------------------
w("-- Disciplina (solo visible para consejo; director ve sanciones ejecutoriadas)")
w(
    "insert into disciplina.expediente (id, numero, anio, persona_id, fecha_apertura, estado, causa, instructor_persona_id) "
    "overriding system value values (1, 1, 2026, "
    f"{q(persona_id(228))}, '2026-09-05', 'resuelto', 'Incumplimiento ficticio de guardia', {q(persona_id(211))});"
)
w(
    "insert into disciplina.sancion (expediente_id, persona_id, tipo_medida, descripcion, fecha, desde, hasta, ejecutoriada, fecha_ejecutoriada) values ("
    f"1, {q(persona_id(228))}, 'suspension', 'Suspensión ficticia de 3 meses', '2026-09-20', '2026-09-01', '2026-12-31', true, '2026-09-25');"
)
w(
    "insert into disciplina.expediente (id, numero, anio, persona_id, fecha_apertura, estado, causa, instructor_persona_id) "
    "overriding system value values (2, 2, 2026, "
    f"{q(persona_id(227))}, '2026-10-10', 'en_investigacion', 'Causa ficticia en investigación', {q(persona_id(211))});"
)
w(
    "insert into disciplina.medida_preventiva (expediente_id, persona_id, medida, desde, hasta, motivo) values ("
    f"2, {q(persona_id(227))}, 'Suspensión preventiva', '2026-10-11', '2026-11-30', 'Medida ficticia');"
)
w(
    "insert into disciplina.plazo_disciplinario (expediente_id, etapa, vence) values ("
    "2, 'Informe del instructor', '2026-12-15');"
)
w("select setval(pg_get_serial_sequence('disciplina.expediente','id'), 2);")
w()

# ---------------------------------------------------------------------------
# Staging
# ---------------------------------------------------------------------------
w("-- Zona de importación con datos dudosos de ejemplo")
w(
    "insert into nucleo.staging_importacion (origen, datos, estado, error) values "
    "('persona_fecha_ingreso', '{\"registro\": 299, \"nombre\": \"Persona sin fecha\"}'::jsonb, 'pendiente', 'Falta fecha de ingreso'),"
    "('viper_asistencia', '{\"lista\": \"2026-11-01\", \"registro\": 250, \"marca\": \"A\"}'::jsonb, 'pendiente', 'Registro no está en la compañía');"
)
w()

w("commit;")
w()
w("-- Alertas de demostración")
w("select seguridad.generar_alertas();")

print("\n".join(out))
