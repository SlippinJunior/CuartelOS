-- =====================================================================
-- DATOS FICTICIOS DE DESARROLLO · ERP Segunda Compañía
-- Generado por scripts/generar-seed-ficticio/generar.py
-- Nada de lo siguiente corresponde a personas reales.
-- Usuarios demo: <rol>@demo.local / demo1234
-- =====================================================================
begin;
set local statement_timeout = '120s';

-- Personas
insert into personal.persona (id, compania_id, registro, rut, nombres, apellido_paterno, apellido_materno, fecha_nacimiento, sexo, email, telefono, direccion, fecha_ingreso, rango, estado, fecha_estado) values ('e58014ec-d954-5bde-8fd9-655529ac50eb', 1, 201, '10007437-1', 'Alejandra', 'Rojas', 'Pizarro', '1980-01-01', 'femenino', 'persona201@demo.local', '+56910000201', 'Pasaje Ficticio 201, Limache', '2020-03-07', 'bombero', 'activo', null);
insert into personal.persona (id, compania_id, registro, rut, nombres, apellido_paterno, apellido_materno, fecha_nacimiento, sexo, email, telefono, direccion, fecha_ingreso, rango, estado, fecha_estado) values ('20fb4035-3feb-58da-a9ab-77df01ce6a8e', 1, 202, '10007474-2', 'Benjamín', 'Soto', 'Aguilera', '1981-02-02', 'masculino', 'persona202@demo.local', '+56910000202', 'Pasaje Ficticio 202, Limache', '2007-03-14', 'bombero', 'activo', null);
insert into personal.persona (id, compania_id, registro, rut, nombres, apellido_paterno, apellido_materno, fecha_nacimiento, sexo, email, telefono, direccion, fecha_ingreso, rango, estado, fecha_estado) values ('2c27012d-f957-58be-aa9e-7c4cd2355b18', 1, 203, '10007511-3', 'Camila', 'Muñoz', 'Tapia', '1982-03-03', 'femenino', 'persona203@demo.local', '+56910000203', 'Pasaje Ficticio 203, Limache', '2013-07-29', 'bombero', 'activo', null);
insert into personal.persona (id, compania_id, registro, rut, nombres, apellido_paterno, apellido_materno, fecha_nacimiento, sexo, email, telefono, direccion, fecha_ingreso, rango, estado, fecha_estado) values ('17f48af4-6fc3-5512-b003-ba76920910ff', 1, 204, '10007548-4', 'Daniel', 'Fuentes', 'Rivas', '1983-04-04', 'masculino', 'persona204@demo.local', '+56910000204', 'Pasaje Ficticio 204, Limache', '2020-04-19', 'honorario', 'activo', null);
insert into personal.persona (id, compania_id, registro, rut, nombres, apellido_paterno, apellido_materno, fecha_nacimiento, sexo, email, telefono, direccion, fecha_ingreso, rango, estado, fecha_estado) values ('4345e829-8b8a-5149-90b2-810ee247e60a', 1, 205, '10007585-5', 'Elena', 'Cárdenas', 'Vega', '1984-05-05', 'femenino', 'persona205@demo.local', '+56910000205', 'Pasaje Ficticio 205, Limache', '2016-04-30', 'bombero', 'activo', null);
insert into personal.persona (id, compania_id, registro, rut, nombres, apellido_paterno, apellido_materno, fecha_nacimiento, sexo, email, telefono, direccion, fecha_ingreso, rango, estado, fecha_estado) values ('c1e20062-0df0-528a-85fd-03ac52aa9158', 1, 206, '10007622-6', 'Felipe', 'Morales', 'Sepúlveda', '1985-06-06', 'masculino', 'persona206@demo.local', '+56910000206', 'Pasaje Ficticio 206, Limache', '2006-07-16', 'bombero', 'activo', null);
insert into personal.persona (id, compania_id, registro, rut, nombres, apellido_paterno, apellido_materno, fecha_nacimiento, sexo, email, telefono, direccion, fecha_ingreso, rango, estado, fecha_estado) values ('e87444d3-a2a6-5222-af23-a3292cd4842c', 1, 207, '10007659-7', 'Gabriela', 'Torres', 'Navarro', '1986-07-07', 'femenino', 'persona207@demo.local', '+56910000207', 'Pasaje Ficticio 207, Limache', '2008-06-09', 'bombero', 'activo', null);
insert into personal.persona (id, compania_id, registro, rut, nombres, apellido_paterno, apellido_materno, fecha_nacimiento, sexo, email, telefono, direccion, fecha_ingreso, rango, estado, fecha_estado) values ('dee56da3-9c6b-5091-9d8e-32e95ca908e3', 1, 208, '10007696-8', 'Héctor', 'Silva', 'Contreras', '1987-08-08', 'masculino', 'persona208@demo.local', '+56910000208', 'Pasaje Ficticio 208, Limache', '2005-01-13', 'bombero', 'activo', null);
insert into personal.persona (id, compania_id, registro, rut, nombres, apellido_paterno, apellido_materno, fecha_nacimiento, sexo, email, telefono, direccion, fecha_ingreso, rango, estado, fecha_estado) values ('8f8831d0-40e9-5d41-ada6-aed4cda2a60f', 1, 209, '10007733-9', 'Ignacia', 'Paredes', 'Leiva', '1988-09-09', 'femenino', 'persona209@demo.local', '+56910000209', 'Pasaje Ficticio 209, Limache', '2019-04-22', 'bombero', 'activo', null);
insert into personal.persona (id, compania_id, registro, rut, nombres, apellido_paterno, apellido_materno, fecha_nacimiento, sexo, email, telefono, direccion, fecha_ingreso, rango, estado, fecha_estado) values ('7a5efba2-1e47-51a1-bff9-7045345a182d', 1, 210, '10007770-0', 'Joaquín', 'Herrera', 'Molina', '1989-10-10', 'masculino', 'persona210@demo.local', '+56910000210', 'Pasaje Ficticio 210, Limache', '2011-05-12', 'bombero', 'activo', null);
insert into personal.persona (id, compania_id, registro, rut, nombres, apellido_paterno, apellido_materno, fecha_nacimiento, sexo, email, telefono, direccion, fecha_ingreso, rango, estado, fecha_estado) values ('2b273959-45fa-5c61-b757-359a169f2e1e', 1, 211, '10007807-1', 'Karen', 'Espinoza', 'Salinas', '1990-11-11', 'femenino', 'persona211@demo.local', '+56910000211', 'Pasaje Ficticio 211, Limache', '2022-04-24', 'honorario', 'activo', null);
insert into personal.persona (id, compania_id, registro, rut, nombres, apellido_paterno, apellido_materno, fecha_nacimiento, sexo, email, telefono, direccion, fecha_ingreso, rango, estado, fecha_estado) values ('87585a59-cd24-5815-bbb7-9b7fbbc01c16', 1, 212, '10007844-2', 'Luis', 'Vergara', 'Cortés', '1991-12-12', 'masculino', 'persona212@demo.local', '+56910000212', 'Pasaje Ficticio 212, Limache', '2005-01-23', 'bombero', 'activo', null);
insert into personal.persona (id, compania_id, registro, rut, nombres, apellido_paterno, apellido_materno, fecha_nacimiento, sexo, email, telefono, direccion, fecha_ingreso, rango, estado, fecha_estado) values ('a5ac36f5-693c-55b3-81b1-c1535a355af7', 1, 213, '10007881-3', 'María', 'Olivares', 'Reyes', '1992-01-13', 'femenino', 'persona213@demo.local', '+56910000213', 'Pasaje Ficticio 213, Limache', '2007-11-09', 'bombero', 'activo', null);
insert into personal.persona (id, compania_id, registro, rut, nombres, apellido_paterno, apellido_materno, fecha_nacimiento, sexo, email, telefono, direccion, fecha_ingreso, rango, estado, fecha_estado) values ('719c8def-873f-50f2-83c4-7006e03ceb8c', 1, 214, '10007918-4', 'Nicolás', 'Guzmán', 'Farías', '1993-02-14', 'masculino', 'persona214@demo.local', '+56910000214', 'Pasaje Ficticio 214, Limache', '2019-06-13', 'bombero', 'activo', null);
insert into personal.persona (id, compania_id, registro, rut, nombres, apellido_paterno, apellido_materno, fecha_nacimiento, sexo, email, telefono, direccion, fecha_ingreso, rango, estado, fecha_estado) values ('8b8a4e76-f7f1-5fab-af6d-9a13dbe20dd5', 1, 215, '10007955-5', 'Olivia', 'Mendez', 'Riquelme', '1994-03-15', 'femenino', 'persona215@demo.local', '+56910000215', 'Pasaje Ficticio 215, Limache', '2015-02-22', 'bombero', 'activo', null);
insert into personal.persona (id, compania_id, registro, rut, nombres, apellido_paterno, apellido_materno, fecha_nacimiento, sexo, email, telefono, direccion, fecha_ingreso, rango, estado, fecha_estado) values ('d5bb007f-958d-5c73-ac74-2abbcc9606dd', 1, 216, '10007992-6', 'Pablo', 'Castillo', 'Bravo', '1995-04-16', 'masculino', 'persona216@demo.local', '+56910000216', 'Pasaje Ficticio 216, Limache', '2016-12-19', 'bombero', 'activo', null);
insert into personal.persona (id, compania_id, registro, rut, nombres, apellido_paterno, apellido_materno, fecha_nacimiento, sexo, email, telefono, direccion, fecha_ingreso, rango, estado, fecha_estado) values ('6a523054-722b-5663-bb5e-7cec43e71400', 1, 217, '10008029-7', 'Quintín', 'Araya', 'Valdés', '1996-05-17', 'femenino', 'persona217@demo.local', '+56910000217', 'Pasaje Ficticio 217, Limache', '2020-12-18', 'bombero', 'activo', null);
insert into personal.persona (id, compania_id, registro, rut, nombres, apellido_paterno, apellido_materno, fecha_nacimiento, sexo, email, telefono, direccion, fecha_ingreso, rango, estado, fecha_estado) values ('186fc2b3-89cd-5b37-b106-78d29bc1a104', 1, 218, '10008066-8', 'Rocío', 'Sepúlveda', 'Lagos', '1997-06-18', 'masculino', 'persona218@demo.local', '+56910000218', 'Pasaje Ficticio 218, Limache', '2007-02-08', 'honorario', 'activo', null);
insert into personal.persona (id, compania_id, registro, rut, nombres, apellido_paterno, apellido_materno, fecha_nacimiento, sexo, email, telefono, direccion, fecha_ingreso, rango, estado, fecha_estado) values ('6961e3db-e3cc-5a18-a7ec-47c623cd734a', 1, 219, '10008103-9', 'Samuel', 'Ibáñez', 'Cáceres', '1998-07-19', 'femenino', 'persona219@demo.local', '+56910000219', 'Pasaje Ficticio 219, Limache', '2014-04-09', 'bombero', 'activo', null);
insert into personal.persona (id, compania_id, registro, rut, nombres, apellido_paterno, apellido_materno, fecha_nacimiento, sexo, email, telefono, direccion, fecha_ingreso, rango, estado, fecha_estado) values ('518e32ec-a189-5ace-a6dc-841a2e136245', 1, 220, '10008140-0', 'Tamara', 'Véliz', 'Andrade', '1999-08-20', 'masculino', 'persona220@demo.local', '+56910000220', 'Pasaje Ficticio 220, Limache', '2012-09-24', 'bombero', 'activo', null);
insert into personal.persona (id, compania_id, registro, rut, nombres, apellido_paterno, apellido_materno, fecha_nacimiento, sexo, email, telefono, direccion, fecha_ingreso, rango, estado, fecha_estado) values ('b8cd318d-ced4-56d5-ad1d-10ecff64f64b', 1, 221, '10008177-1', 'Ulises', 'Poblete', 'Sáez', '1980-09-21', 'femenino', 'persona221@demo.local', '+56910000221', 'Pasaje Ficticio 221, Limache', '2020-04-03', 'bombero', 'activo', null);
insert into personal.persona (id, compania_id, registro, rut, nombres, apellido_paterno, apellido_materno, fecha_nacimiento, sexo, email, telefono, direccion, fecha_ingreso, rango, estado, fecha_estado) values ('6252616f-a023-543e-9845-044ededfea05', 1, 222, '10008214-2', 'Valentina', 'Godoy', 'Miranda', '1981-10-22', 'masculino', 'persona222@demo.local', '+56910000222', 'Pasaje Ficticio 222, Limache', '2019-09-19', 'bombero', 'activo', null);
insert into personal.persona (id, compania_id, registro, rut, nombres, apellido_paterno, apellido_materno, fecha_nacimiento, sexo, email, telefono, direccion, fecha_ingreso, rango, estado, fecha_estado) values ('0d0f33f5-6711-5d14-abfe-00a32dc594a2', 1, 223, '10008251-3', 'Walter', 'Órdenes', 'Peña', '1982-11-23', 'femenino', 'persona223@demo.local', '+56910000223', 'Pasaje Ficticio 223, Limache', '2013-11-01', 'bombero', 'activo', null);
insert into personal.persona (id, compania_id, registro, rut, nombres, apellido_paterno, apellido_materno, fecha_nacimiento, sexo, email, telefono, direccion, fecha_ingreso, rango, estado, fecha_estado) values ('99e3978a-5008-588d-93a1-e45e28c81702', 1, 224, '10008288-4', 'Ximena', 'Alarcón', 'Fuentes', '1983-12-24', 'masculino', 'persona224@demo.local', '+56910000224', 'Pasaje Ficticio 224, Limache', '2015-03-30', 'bombero', 'activo', null);
insert into personal.persona (id, compania_id, registro, rut, nombres, apellido_paterno, apellido_materno, fecha_nacimiento, sexo, email, telefono, direccion, fecha_ingreso, rango, estado, fecha_estado) values ('dd6e2df9-978b-521f-8271-c8b87df4af97', 1, 225, '10008325-5', 'Yerko', 'Sandoval', 'Pérez', '1984-01-25', 'femenino', 'persona225@demo.local', '+56910000225', 'Pasaje Ficticio 225, Limache', '2015-02-05', 'honorario', 'activo', null);
insert into personal.persona (id, compania_id, registro, rut, nombres, apellido_paterno, apellido_materno, fecha_nacimiento, sexo, email, telefono, direccion, fecha_ingreso, rango, estado, fecha_estado) values ('cbd0661d-8815-5999-ab79-bd785dcf3f3b', 1, 226, '10008362-6', 'Zulema', 'Castro', 'Hidalgo', '1985-02-26', 'masculino', 'persona226@demo.local', '+56910000226', 'Pasaje Ficticio 226, Limache', '2024-05-04', 'bombero', 'activo', null);
insert into personal.persona (id, compania_id, registro, rut, nombres, apellido_paterno, apellido_materno, fecha_nacimiento, sexo, email, telefono, direccion, fecha_ingreso, rango, estado, fecha_estado) values ('5734d562-6470-5225-9137-6c4023409340', 1, 227, '10008399-7', 'Álvaro', 'Bustamante', 'Ramos', '1986-03-27', 'femenino', 'persona227@demo.local', '+56910000227', 'Pasaje Ficticio 227, Limache', '2013-04-02', 'bombero', 'activo', null);
insert into personal.persona (id, compania_id, registro, rut, nombres, apellido_paterno, apellido_materno, fecha_nacimiento, sexo, email, telefono, direccion, fecha_ingreso, rango, estado, fecha_estado) values ('2ef99536-6cbf-5e68-a4f2-a9c6e151220e', 1, 228, '10008436-8', 'Belén', 'Navarrete', 'Ortiz', '1987-04-01', 'masculino', 'persona228@demo.local', '+56910000228', 'Pasaje Ficticio 228, Limache', '2018-01-29', 'bombero', 'suspendido', '2026-10-01');
insert into personal.persona (id, compania_id, registro, rut, nombres, apellido_paterno, apellido_materno, fecha_nacimiento, sexo, email, telefono, direccion, fecha_ingreso, rango, estado, fecha_estado) values ('96622d38-b882-5afd-a157-3aa778067272', 1, 229, '10008473-9', 'Cristóbal', 'Latorre', 'Werner', '1988-05-02', 'femenino', 'persona229@demo.local', '+56910000229', 'Pasaje Ficticio 229, Limache', '2022-11-08', 'bombero', 'renunciado', '2026-10-01');
insert into personal.persona (id, compania_id, registro, rut, nombres, apellido_paterno, apellido_materno, fecha_nacimiento, sexo, email, telefono, direccion, fecha_ingreso, rango, estado, fecha_estado) values ('344dedc7-32e5-5d5f-a848-7fb592111bf1', 1, 230, '10008510-0', 'Dominique', 'Astudillo', 'Vargas', '1989-06-03', 'masculino', 'persona230@demo.local', '+56910000230', 'Pasaje Ficticio 230, Limache', '2013-01-23', 'aspirante', 'activo', null);

-- Datos sensibles (1 a 1)
insert into personal.persona_dato_sensible (persona_id, grupo_sanguineo, alergias, contacto_emergencia_nombre, contacto_emergencia_telefono, notas) values ('e58014ec-d954-5bde-8fd9-655529ac50eb', 'O+', 'Penicilina', 'Contacto de emergencia 201', '+56900000000', 'Dato ficticio de desarrollo');
insert into personal.persona_dato_sensible (persona_id, grupo_sanguineo, alergias, contacto_emergencia_nombre, contacto_emergencia_telefono, notas) values ('17f48af4-6fc3-5512-b003-ba76920910ff', 'A-', null, 'Contacto de emergencia 204', '+56900000000', 'Dato ficticio de desarrollo');
insert into personal.persona_dato_sensible (persona_id, grupo_sanguineo, alergias, contacto_emergencia_nombre, contacto_emergencia_telefono, notas) values ('7a5efba2-1e47-51a1-bff9-7045345a182d', 'B+', 'Látex', 'Contacto de emergencia 210', '+56900000000', 'Dato ficticio de desarrollo');
insert into personal.persona_dato_sensible (persona_id, grupo_sanguineo, alergias, contacto_emergencia_nombre, contacto_emergencia_telefono, notas) values ('6961e3db-e3cc-5a18-a7ec-47c623cd734a', 'AB+', null, 'Contacto de emergencia 219', '+56900000000', 'Dato ficticio de desarrollo');

-- Usuarios demo de Supabase Auth (contraseña: demo1234)
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change) values ('00000000-0000-0000-0000-000000000000', '4d612390-e116-5ceb-a439-82067cb183da', 'authenticated', 'authenticated', 'director@demo.local', extensions.crypt('demo1234', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(), '', '', '', '');
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at) values (gen_random_uuid(), '4d612390-e116-5ceb-a439-82067cb183da', '4d612390-e116-5ceb-a439-82067cb183da', jsonb_build_object('sub', '4d612390-e116-5ceb-a439-82067cb183da', 'email', 'director@demo.local'), 'email', now(), now(), now());
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change) values ('00000000-0000-0000-0000-000000000000', 'd53789b3-52a2-5405-bf24-c97aeb564d6e', 'authenticated', 'authenticated', 'secretario@demo.local', extensions.crypt('demo1234', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(), '', '', '', '');
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at) values (gen_random_uuid(), 'd53789b3-52a2-5405-bf24-c97aeb564d6e', 'd53789b3-52a2-5405-bf24-c97aeb564d6e', jsonb_build_object('sub', 'd53789b3-52a2-5405-bf24-c97aeb564d6e', 'email', 'secretario@demo.local'), 'email', now(), now(), now());
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change) values ('00000000-0000-0000-0000-000000000000', 'bfabe726-164d-576e-a846-17f5f76deb5a', 'authenticated', 'authenticated', 'prosecretario@demo.local', extensions.crypt('demo1234', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(), '', '', '', '');
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at) values (gen_random_uuid(), 'bfabe726-164d-576e-a846-17f5f76deb5a', 'bfabe726-164d-576e-a846-17f5f76deb5a', jsonb_build_object('sub', 'bfabe726-164d-576e-a846-17f5f76deb5a', 'email', 'prosecretario@demo.local'), 'email', now(), now(), now());
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change) values ('00000000-0000-0000-0000-000000000000', 'd4eb1e9d-073b-50a2-bd6e-f97909a80df1', 'authenticated', 'authenticated', 'tesorero@demo.local', extensions.crypt('demo1234', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(), '', '', '', '');
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at) values (gen_random_uuid(), 'd4eb1e9d-073b-50a2-bd6e-f97909a80df1', 'd4eb1e9d-073b-50a2-bd6e-f97909a80df1', jsonb_build_object('sub', 'd4eb1e9d-073b-50a2-bd6e-f97909a80df1', 'email', 'tesorero@demo.local'), 'email', now(), now(), now());
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change) values ('00000000-0000-0000-0000-000000000000', 'c4d48c6c-6d17-5525-9d01-b8fc682462d8', 'authenticated', 'authenticated', 'protesorero@demo.local', extensions.crypt('demo1234', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(), '', '', '', '');
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at) values (gen_random_uuid(), 'c4d48c6c-6d17-5525-9d01-b8fc682462d8', 'c4d48c6c-6d17-5525-9d01-b8fc682462d8', jsonb_build_object('sub', 'c4d48c6c-6d17-5525-9d01-b8fc682462d8', 'email', 'protesorero@demo.local'), 'email', now(), now(), now());
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change) values ('00000000-0000-0000-0000-000000000000', '7bb44644-e641-5390-9b17-299388170d53', 'authenticated', 'authenticated', 'capitan@demo.local', extensions.crypt('demo1234', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(), '', '', '', '');
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at) values (gen_random_uuid(), '7bb44644-e641-5390-9b17-299388170d53', '7bb44644-e641-5390-9b17-299388170d53', jsonb_build_object('sub', '7bb44644-e641-5390-9b17-299388170d53', 'email', 'capitan@demo.local'), 'email', now(), now(), now());
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change) values ('00000000-0000-0000-0000-000000000000', '84e9ad2e-2d69-5ca3-a6ed-70431b9c012c', 'authenticated', 'authenticated', 'teniente_1@demo.local', extensions.crypt('demo1234', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(), '', '', '', '');
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at) values (gen_random_uuid(), '84e9ad2e-2d69-5ca3-a6ed-70431b9c012c', '84e9ad2e-2d69-5ca3-a6ed-70431b9c012c', jsonb_build_object('sub', '84e9ad2e-2d69-5ca3-a6ed-70431b9c012c', 'email', 'teniente_1@demo.local'), 'email', now(), now(), now());
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change) values ('00000000-0000-0000-0000-000000000000', '3a0bd7bb-741e-5763-8ab7-19c966feb51c', 'authenticated', 'authenticated', 'teniente_2@demo.local', extensions.crypt('demo1234', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(), '', '', '', '');
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at) values (gen_random_uuid(), '3a0bd7bb-741e-5763-8ab7-19c966feb51c', '3a0bd7bb-741e-5763-8ab7-19c966feb51c', jsonb_build_object('sub', '3a0bd7bb-741e-5763-8ab7-19c966feb51c', 'email', 'teniente_2@demo.local'), 'email', now(), now(), now());
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change) values ('00000000-0000-0000-0000-000000000000', '19f19dc7-900a-559c-8832-605e8d7ac294', 'authenticated', 'authenticated', 'teniente_3@demo.local', extensions.crypt('demo1234', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(), '', '', '', '');
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at) values (gen_random_uuid(), '19f19dc7-900a-559c-8832-605e8d7ac294', '19f19dc7-900a-559c-8832-605e8d7ac294', jsonb_build_object('sub', '19f19dc7-900a-559c-8832-605e8d7ac294', 'email', 'teniente_3@demo.local'), 'email', now(), now(), now());
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change) values ('00000000-0000-0000-0000-000000000000', 'cf685528-fb13-5e28-8faa-c60b5b90535e', 'authenticated', 'authenticated', 'ayudante@demo.local', extensions.crypt('demo1234', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(), '', '', '', '');
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at) values (gen_random_uuid(), 'cf685528-fb13-5e28-8faa-c60b5b90535e', 'cf685528-fb13-5e28-8faa-c60b5b90535e', jsonb_build_object('sub', 'cf685528-fb13-5e28-8faa-c60b5b90535e', 'email', 'ayudante@demo.local'), 'email', now(), now(), now());
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change) values ('00000000-0000-0000-0000-000000000000', '6c170486-ed4e-5674-b5a5-8aa271a8e394', 'authenticated', 'authenticated', 'consejo@demo.local', extensions.crypt('demo1234', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(), '', '', '', '');
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at) values (gen_random_uuid(), '6c170486-ed4e-5674-b5a5-8aa271a8e394', '6c170486-ed4e-5674-b5a5-8aa271a8e394', jsonb_build_object('sub', '6c170486-ed4e-5674-b5a5-8aa271a8e394', 'email', 'consejo@demo.local'), 'email', now(), now(), now());
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change) values ('00000000-0000-0000-0000-000000000000', '56b3ac17-016d-57af-8b0f-2ebe7f9d57c2', 'authenticated', 'authenticated', 'bombero@demo.local', extensions.crypt('demo1234', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(), '', '', '', '');
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at) values (gen_random_uuid(), '56b3ac17-016d-57af-8b0f-2ebe7f9d57c2', '56b3ac17-016d-57af-8b0f-2ebe7f9d57c2', jsonb_build_object('sub', '56b3ac17-016d-57af-8b0f-2ebe7f9d57c2', 'email', 'bombero@demo.local'), 'email', now(), now(), now());
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change) values ('00000000-0000-0000-0000-000000000000', '9c9535dc-ee69-50d0-bb82-0ecf838ae964', 'authenticated', 'authenticated', 'admin@demo.local', extensions.crypt('demo1234', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(), '', '', '', '');
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at) values (gen_random_uuid(), '9c9535dc-ee69-50d0-bb82-0ecf838ae964', '9c9535dc-ee69-50d0-bb82-0ecf838ae964', jsonb_build_object('sub', '9c9535dc-ee69-50d0-bb82-0ecf838ae964', 'email', 'admin@demo.local'), 'email', now(), now(), now());
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change) values ('00000000-0000-0000-0000-000000000000', '18709649-266b-5822-84aa-f891aec9209a', 'authenticated', 'authenticated', 'cuartel@demo.local', extensions.crypt('demo1234', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(), '', '', '', '');
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at) values (gen_random_uuid(), '18709649-266b-5822-84aa-f891aec9209a', '18709649-266b-5822-84aa-f891aec9209a', jsonb_build_object('sub', '18709649-266b-5822-84aa-f891aec9209a', 'email', 'cuartel@demo.local'), 'email', now(), now(), now());

-- Vínculo con la persona y rol manual
insert into seguridad.usuario (user_id, persona_id, email, activo) values ('4d612390-e116-5ceb-a439-82067cb183da', 'e58014ec-d954-5bde-8fd9-655529ac50eb', 'director@demo.local', true);
insert into seguridad.usuario_rol (user_id, rol, desde, motivo) values ('4d612390-e116-5ceb-a439-82067cb183da', 'director', '2026-01-01', 'Semilla de desarrollo');
insert into seguridad.consentimiento (usuario_id, texto_id) select '4d612390-e116-5ceb-a439-82067cb183da', id from seguridad.consentimiento_texto where vigente;
insert into seguridad.usuario (user_id, persona_id, email, activo) values ('d53789b3-52a2-5405-bf24-c97aeb564d6e', '20fb4035-3feb-58da-a9ab-77df01ce6a8e', 'secretario@demo.local', true);
insert into seguridad.usuario_rol (user_id, rol, desde, motivo) values ('d53789b3-52a2-5405-bf24-c97aeb564d6e', 'secretario', '2026-01-01', 'Semilla de desarrollo');
insert into seguridad.consentimiento (usuario_id, texto_id) select 'd53789b3-52a2-5405-bf24-c97aeb564d6e', id from seguridad.consentimiento_texto where vigente;
insert into seguridad.usuario (user_id, persona_id, email, activo) values ('bfabe726-164d-576e-a846-17f5f76deb5a', '2c27012d-f957-58be-aa9e-7c4cd2355b18', 'prosecretario@demo.local', true);
insert into seguridad.usuario_rol (user_id, rol, desde, motivo) values ('bfabe726-164d-576e-a846-17f5f76deb5a', 'prosecretario', '2026-01-01', 'Semilla de desarrollo');
insert into seguridad.consentimiento (usuario_id, texto_id) select 'bfabe726-164d-576e-a846-17f5f76deb5a', id from seguridad.consentimiento_texto where vigente;
insert into seguridad.usuario (user_id, persona_id, email, activo) values ('d4eb1e9d-073b-50a2-bd6e-f97909a80df1', '17f48af4-6fc3-5512-b003-ba76920910ff', 'tesorero@demo.local', true);
insert into seguridad.usuario_rol (user_id, rol, desde, motivo) values ('d4eb1e9d-073b-50a2-bd6e-f97909a80df1', 'tesorero', '2026-01-01', 'Semilla de desarrollo');
insert into seguridad.consentimiento (usuario_id, texto_id) select 'd4eb1e9d-073b-50a2-bd6e-f97909a80df1', id from seguridad.consentimiento_texto where vigente;
insert into seguridad.usuario (user_id, persona_id, email, activo) values ('c4d48c6c-6d17-5525-9d01-b8fc682462d8', '4345e829-8b8a-5149-90b2-810ee247e60a', 'protesorero@demo.local', true);
insert into seguridad.usuario_rol (user_id, rol, desde, motivo) values ('c4d48c6c-6d17-5525-9d01-b8fc682462d8', 'protesorero', '2026-01-01', 'Semilla de desarrollo');
insert into seguridad.consentimiento (usuario_id, texto_id) select 'c4d48c6c-6d17-5525-9d01-b8fc682462d8', id from seguridad.consentimiento_texto where vigente;
insert into seguridad.usuario (user_id, persona_id, email, activo) values ('7bb44644-e641-5390-9b17-299388170d53', 'c1e20062-0df0-528a-85fd-03ac52aa9158', 'capitan@demo.local', true);
insert into seguridad.usuario_rol (user_id, rol, desde, motivo) values ('7bb44644-e641-5390-9b17-299388170d53', 'capitan', '2026-01-01', 'Semilla de desarrollo');
insert into seguridad.consentimiento (usuario_id, texto_id) select '7bb44644-e641-5390-9b17-299388170d53', id from seguridad.consentimiento_texto where vigente;
insert into seguridad.usuario (user_id, persona_id, email, activo) values ('84e9ad2e-2d69-5ca3-a6ed-70431b9c012c', 'e87444d3-a2a6-5222-af23-a3292cd4842c', 'teniente_1@demo.local', true);
insert into seguridad.usuario_rol (user_id, rol, desde, motivo) values ('84e9ad2e-2d69-5ca3-a6ed-70431b9c012c', 'teniente_1', '2026-01-01', 'Semilla de desarrollo');
insert into seguridad.consentimiento (usuario_id, texto_id) select '84e9ad2e-2d69-5ca3-a6ed-70431b9c012c', id from seguridad.consentimiento_texto where vigente;
insert into seguridad.usuario (user_id, persona_id, email, activo) values ('3a0bd7bb-741e-5763-8ab7-19c966feb51c', 'dee56da3-9c6b-5091-9d8e-32e95ca908e3', 'teniente_2@demo.local', true);
insert into seguridad.usuario_rol (user_id, rol, desde, motivo) values ('3a0bd7bb-741e-5763-8ab7-19c966feb51c', 'teniente_2', '2026-01-01', 'Semilla de desarrollo');
insert into seguridad.consentimiento (usuario_id, texto_id) select '3a0bd7bb-741e-5763-8ab7-19c966feb51c', id from seguridad.consentimiento_texto where vigente;
insert into seguridad.usuario (user_id, persona_id, email, activo) values ('19f19dc7-900a-559c-8832-605e8d7ac294', '8f8831d0-40e9-5d41-ada6-aed4cda2a60f', 'teniente_3@demo.local', true);
insert into seguridad.usuario_rol (user_id, rol, desde, motivo) values ('19f19dc7-900a-559c-8832-605e8d7ac294', 'teniente_3', '2026-01-01', 'Semilla de desarrollo');
insert into seguridad.consentimiento (usuario_id, texto_id) select '19f19dc7-900a-559c-8832-605e8d7ac294', id from seguridad.consentimiento_texto where vigente;
insert into seguridad.usuario (user_id, persona_id, email, activo) values ('cf685528-fb13-5e28-8faa-c60b5b90535e', '7a5efba2-1e47-51a1-bff9-7045345a182d', 'ayudante@demo.local', true);
insert into seguridad.usuario_rol (user_id, rol, desde, motivo) values ('cf685528-fb13-5e28-8faa-c60b5b90535e', 'ayudante', '2026-01-01', 'Semilla de desarrollo');
insert into seguridad.consentimiento (usuario_id, texto_id) select 'cf685528-fb13-5e28-8faa-c60b5b90535e', id from seguridad.consentimiento_texto where vigente;
insert into seguridad.usuario (user_id, persona_id, email, activo) values ('6c170486-ed4e-5674-b5a5-8aa271a8e394', '2b273959-45fa-5c61-b757-359a169f2e1e', 'consejo@demo.local', true);
insert into seguridad.usuario_rol (user_id, rol, desde, motivo) values ('6c170486-ed4e-5674-b5a5-8aa271a8e394', 'consejo', '2026-01-01', 'Semilla de desarrollo');
insert into seguridad.consentimiento (usuario_id, texto_id) select '6c170486-ed4e-5674-b5a5-8aa271a8e394', id from seguridad.consentimiento_texto where vigente;
insert into seguridad.usuario (user_id, persona_id, email, activo) values ('56b3ac17-016d-57af-8b0f-2ebe7f9d57c2', '87585a59-cd24-5815-bbb7-9b7fbbc01c16', 'bombero@demo.local', true);
insert into seguridad.usuario_rol (user_id, rol, desde, motivo) values ('56b3ac17-016d-57af-8b0f-2ebe7f9d57c2', 'bombero', '2026-01-01', 'Semilla de desarrollo');
insert into seguridad.usuario (user_id, persona_id, email, activo) values ('9c9535dc-ee69-50d0-bb82-0ecf838ae964', 'a5ac36f5-693c-55b3-81b1-c1535a355af7', 'admin@demo.local', true);
insert into seguridad.usuario_rol (user_id, rol, desde, motivo) values ('9c9535dc-ee69-50d0-bb82-0ecf838ae964', 'admin', '2026-01-01', 'Semilla de desarrollo');
insert into seguridad.consentimiento (usuario_id, texto_id) select '9c9535dc-ee69-50d0-bb82-0ecf838ae964', id from seguridad.consentimiento_texto where vigente;
insert into seguridad.usuario (user_id, persona_id, email, activo) values ('18709649-266b-5822-84aa-f891aec9209a', null, 'cuartel@demo.local', true);
insert into seguridad.usuario_rol (user_id, rol, desde, motivo) values ('18709649-266b-5822-84aa-f891aec9209a', 'cuartel', '2026-01-01', 'Semilla de desarrollo');

-- Tipos de acto adicionales
insert into asistencia.tipo_acto (clave, descripcion, obligatorio) values ('1', 'Citación de compañía', true) on conflict (clave) do nothing;
insert into asistencia.tipo_acto (clave, descripcion, obligatorio) values ('2', 'Instrucción de compañía', false) on conflict (clave) do nothing;
insert into asistencia.tipo_acto (clave, descripcion, obligatorio) values ('3', 'Servicio de guardia', false) on conflict (clave) do nothing;
insert into asistencia.tipo_acto (clave, descripcion, obligatorio) values ('15-1', 'Acto interno 15-1', false) on conflict (clave) do nothing;
insert into asistencia.tipo_acto (clave, descripcion, obligatorio) values ('15-2', 'Clave 15-2 (completar descripción)', false) on conflict (clave) do nothing;
insert into asistencia.tipo_acto (clave, descripcion, obligatorio) values ('F1', 'Formación 1', false) on conflict (clave) do nothing;

-- 40 listas de asistencia de 2026
insert into asistencia.lista (id, compania_id, anio, numero, fecha, tipo_acto_clave, descripcion, estado, origen) overriding system value values (1, 1, 2026, 1, '2026-01-08', 'RO', 'Lista ficticia N° 1', 'borrador', 'manual');
insert into asistencia.lista (id, compania_id, anio, numero, fecha, tipo_acto_clave, descripcion, estado, origen) overriding system value values (2, 1, 2026, 2, '2026-01-15', 'RO', 'Lista ficticia N° 2', 'borrador', 'manual');
insert into asistencia.lista (id, compania_id, anio, numero, fecha, tipo_acto_clave, descripcion, estado, origen) overriding system value values (3, 1, 2026, 3, '2026-01-22', 'RO', 'Lista ficticia N° 3', 'borrador', 'manual');
insert into asistencia.lista (id, compania_id, anio, numero, fecha, tipo_acto_clave, descripcion, estado, origen) overriding system value values (4, 1, 2026, 4, '2026-01-29', 'RE', 'Lista ficticia N° 4', 'borrador', 'manual');
insert into asistencia.lista (id, compania_id, anio, numero, fecha, tipo_acto_clave, descripcion, estado, origen) overriding system value values (5, 1, 2026, 5, '2026-02-05', 'RO', 'Lista ficticia N° 5', 'borrador', 'manual');
insert into asistencia.lista (id, compania_id, anio, numero, fecha, tipo_acto_clave, descripcion, estado, origen) overriding system value values (6, 1, 2026, 6, '2026-02-12', 'RO', 'Lista ficticia N° 6', 'borrador', 'manual');
insert into asistencia.lista (id, compania_id, anio, numero, fecha, tipo_acto_clave, descripcion, estado, origen) overriding system value values (7, 1, 2026, 7, '2026-02-19', 'RO', 'Lista ficticia N° 7', 'borrador', 'manual');
insert into asistencia.lista (id, compania_id, anio, numero, fecha, tipo_acto_clave, descripcion, estado, origen) overriding system value values (8, 1, 2026, 8, '2026-02-26', 'RE', 'Lista ficticia N° 8', 'borrador', 'manual');
insert into asistencia.lista (id, compania_id, anio, numero, fecha, tipo_acto_clave, descripcion, estado, origen) overriding system value values (9, 1, 2026, 9, '2026-03-05', 'RO', 'Lista ficticia N° 9', 'borrador', 'manual');
insert into asistencia.lista (id, compania_id, anio, numero, fecha, tipo_acto_clave, descripcion, estado, origen) overriding system value values (10, 1, 2026, 10, '2026-03-12', 'RO', 'Lista ficticia N° 10', 'borrador', 'manual');
insert into asistencia.lista (id, compania_id, anio, numero, fecha, tipo_acto_clave, descripcion, estado, origen) overriding system value values (11, 1, 2026, 11, '2026-03-19', 'RO', 'Lista ficticia N° 11', 'borrador', 'manual');
insert into asistencia.lista (id, compania_id, anio, numero, fecha, tipo_acto_clave, descripcion, estado, origen) overriding system value values (12, 1, 2026, 12, '2026-03-26', 'RE', 'Lista ficticia N° 12', 'borrador', 'manual');
insert into asistencia.lista (id, compania_id, anio, numero, fecha, tipo_acto_clave, descripcion, estado, origen) overriding system value values (13, 1, 2026, 13, '2026-04-02', 'RO', 'Lista ficticia N° 13', 'borrador', 'manual');
insert into asistencia.lista (id, compania_id, anio, numero, fecha, tipo_acto_clave, descripcion, estado, origen) overriding system value values (14, 1, 2026, 14, '2026-04-09', 'RO', 'Lista ficticia N° 14', 'borrador', 'manual');
insert into asistencia.lista (id, compania_id, anio, numero, fecha, tipo_acto_clave, descripcion, estado, origen) overriding system value values (15, 1, 2026, 15, '2026-04-16', 'RO', 'Lista ficticia N° 15', 'borrador', 'manual');
insert into asistencia.lista (id, compania_id, anio, numero, fecha, tipo_acto_clave, descripcion, estado, origen) overriding system value values (16, 1, 2026, 16, '2026-04-23', 'RE', 'Lista ficticia N° 16', 'borrador', 'manual');
insert into asistencia.lista (id, compania_id, anio, numero, fecha, tipo_acto_clave, descripcion, estado, origen) overriding system value values (17, 1, 2026, 17, '2026-04-30', 'RO', 'Lista ficticia N° 17', 'borrador', 'manual');
insert into asistencia.lista (id, compania_id, anio, numero, fecha, tipo_acto_clave, descripcion, estado, origen) overriding system value values (18, 1, 2026, 18, '2026-05-07', 'RO', 'Lista ficticia N° 18', 'borrador', 'manual');
insert into asistencia.lista (id, compania_id, anio, numero, fecha, tipo_acto_clave, descripcion, estado, origen) overriding system value values (19, 1, 2026, 19, '2026-05-14', 'RO', 'Lista ficticia N° 19', 'borrador', 'manual');
insert into asistencia.lista (id, compania_id, anio, numero, fecha, tipo_acto_clave, descripcion, estado, origen) overriding system value values (20, 1, 2026, 20, '2026-05-21', 'RE', 'Lista ficticia N° 20', 'borrador', 'manual');
insert into asistencia.lista (id, compania_id, anio, numero, fecha, tipo_acto_clave, descripcion, estado, origen) overriding system value values (21, 1, 2026, 21, '2026-05-28', 'RO', 'Lista ficticia N° 21', 'borrador', 'manual');
insert into asistencia.lista (id, compania_id, anio, numero, fecha, tipo_acto_clave, descripcion, estado, origen) overriding system value values (22, 1, 2026, 22, '2026-06-04', 'RO', 'Lista ficticia N° 22', 'borrador', 'manual');
insert into asistencia.lista (id, compania_id, anio, numero, fecha, tipo_acto_clave, descripcion, estado, origen) overriding system value values (23, 1, 2026, 23, '2026-06-11', 'RO', 'Lista ficticia N° 23', 'borrador', 'manual');
insert into asistencia.lista (id, compania_id, anio, numero, fecha, tipo_acto_clave, descripcion, estado, origen) overriding system value values (24, 1, 2026, 24, '2026-06-18', 'RE', 'Lista ficticia N° 24', 'borrador', 'manual');
insert into asistencia.lista (id, compania_id, anio, numero, fecha, tipo_acto_clave, descripcion, estado, origen) overriding system value values (25, 1, 2026, 25, '2026-06-25', 'RO', 'Lista ficticia N° 25', 'borrador', 'manual');
insert into asistencia.lista (id, compania_id, anio, numero, fecha, tipo_acto_clave, descripcion, estado, origen) overriding system value values (26, 1, 2026, 26, '2026-07-02', 'RO', 'Lista ficticia N° 26', 'borrador', 'manual');
insert into asistencia.lista (id, compania_id, anio, numero, fecha, tipo_acto_clave, descripcion, estado, origen) overriding system value values (27, 1, 2026, 27, '2026-07-09', 'RO', 'Lista ficticia N° 27', 'borrador', 'manual');
insert into asistencia.lista (id, compania_id, anio, numero, fecha, tipo_acto_clave, descripcion, estado, origen) overriding system value values (28, 1, 2026, 28, '2026-07-16', 'RE', 'Lista ficticia N° 28', 'borrador', 'manual');
insert into asistencia.lista (id, compania_id, anio, numero, fecha, tipo_acto_clave, descripcion, estado, origen) overriding system value values (29, 1, 2026, 29, '2026-07-23', 'RO', 'Lista ficticia N° 29', 'borrador', 'manual');
insert into asistencia.lista (id, compania_id, anio, numero, fecha, tipo_acto_clave, descripcion, estado, origen) overriding system value values (30, 1, 2026, 30, '2026-07-30', 'RO', 'Lista ficticia N° 30', 'borrador', 'manual');
insert into asistencia.lista (id, compania_id, anio, numero, fecha, tipo_acto_clave, descripcion, estado, origen) overriding system value values (31, 1, 2026, 31, '2026-08-06', 'RO', 'Lista ficticia N° 31', 'borrador', 'manual');
insert into asistencia.lista (id, compania_id, anio, numero, fecha, tipo_acto_clave, descripcion, estado, origen) overriding system value values (32, 1, 2026, 32, '2026-08-13', 'RE', 'Lista ficticia N° 32', 'borrador', 'manual');
insert into asistencia.lista (id, compania_id, anio, numero, fecha, tipo_acto_clave, descripcion, estado, origen) overriding system value values (33, 1, 2026, 33, '2026-08-20', 'RO', 'Lista ficticia N° 33', 'borrador', 'manual');
insert into asistencia.lista (id, compania_id, anio, numero, fecha, tipo_acto_clave, descripcion, estado, origen) overriding system value values (34, 1, 2026, 34, '2026-08-27', 'RO', 'Lista ficticia N° 34', 'borrador', 'manual');
insert into asistencia.lista (id, compania_id, anio, numero, fecha, tipo_acto_clave, descripcion, estado, origen) overriding system value values (35, 1, 2026, 35, '2026-09-03', 'RO', 'Lista ficticia N° 35', 'borrador', 'manual');
insert into asistencia.lista (id, compania_id, anio, numero, fecha, tipo_acto_clave, descripcion, estado, origen) overriding system value values (36, 1, 2026, 36, '2026-09-10', 'RE', 'Lista ficticia N° 36', 'borrador', 'manual');
insert into asistencia.lista (id, compania_id, anio, numero, fecha, tipo_acto_clave, descripcion, estado, origen) overriding system value values (37, 1, 2026, 37, '2026-09-17', 'RO', 'Lista ficticia N° 37', 'borrador', 'manual');
insert into asistencia.lista (id, compania_id, anio, numero, fecha, tipo_acto_clave, descripcion, estado, origen) overriding system value values (38, 1, 2026, 38, '2026-10-29', 'RO', 'Lista ficticia N° 38', 'borrador', 'manual');
insert into asistencia.lista (id, compania_id, anio, numero, fecha, tipo_acto_clave, descripcion, estado, origen) overriding system value values (39, 1, 2026, 39, '2026-11-05', 'RO', 'Lista ficticia N° 39', 'borrador', 'manual');
insert into asistencia.lista (id, compania_id, anio, numero, fecha, tipo_acto_clave, descripcion, estado, origen) overriding system value values (40, 1, 2026, 40, '2026-11-10', 'RE', 'Lista ficticia N° 40', 'borrador', 'manual');

-- Marcas de asistencia
insert into asistencia.asistencia (lista_id, persona_id, marca) values (1, 'e58014ec-d954-5bde-8fd9-655529ac50eb', 'A'),
(1, '20fb4035-3feb-58da-a9ab-77df01ce6a8e', 'F'),
(1, '2c27012d-f957-58be-aa9e-7c4cd2355b18', 'A'),
(1, '17f48af4-6fc3-5512-b003-ba76920910ff', 'A'),
(1, '4345e829-8b8a-5149-90b2-810ee247e60a', 'F'),
(1, 'c1e20062-0df0-528a-85fd-03ac52aa9158', 'L'),
(1, 'e87444d3-a2a6-5222-af23-a3292cd4842c', 'A'),
(1, 'dee56da3-9c6b-5091-9d8e-32e95ca908e3', 'A'),
(1, '8f8831d0-40e9-5d41-ada6-aed4cda2a60f', 'A'),
(1, '7a5efba2-1e47-51a1-bff9-7045345a182d', 'F'),
(1, '2b273959-45fa-5c61-b757-359a169f2e1e', 'A'),
(1, '87585a59-cd24-5815-bbb7-9b7fbbc01c16', 'A'),
(1, 'a5ac36f5-693c-55b3-81b1-c1535a355af7', 'A'),
(1, '719c8def-873f-50f2-83c4-7006e03ceb8c', 'A'),
(1, '8b8a4e76-f7f1-5fab-af6d-9a13dbe20dd5', 'A'),
(1, 'd5bb007f-958d-5c73-ac74-2abbcc9606dd', 'A'),
(1, '6a523054-722b-5663-bb5e-7cec43e71400', 'A'),
(1, '186fc2b3-89cd-5b37-b106-78d29bc1a104', 'A'),
(1, '6961e3db-e3cc-5a18-a7ec-47c623cd734a', 'A'),
(1, '518e32ec-a189-5ace-a6dc-841a2e136245', 'A'),
(1, 'b8cd318d-ced4-56d5-ad1d-10ecff64f64b', 'F'),
(1, '6252616f-a023-543e-9845-044ededfea05', 'A'),
(1, '0d0f33f5-6711-5d14-abfe-00a32dc594a2', 'A'),
(1, '99e3978a-5008-588d-93a1-e45e28c81702', 'A'),
(1, 'dd6e2df9-978b-521f-8271-c8b87df4af97', 'A'),
(1, 'cbd0661d-8815-5999-ab79-bd785dcf3f3b', 'P'),
(1, '5734d562-6470-5225-9137-6c4023409340', 'A'),
(1, '344dedc7-32e5-5d5f-a848-7fb592111bf1', 'P'),
(2, 'e58014ec-d954-5bde-8fd9-655529ac50eb', 'A'),
(2, '20fb4035-3feb-58da-a9ab-77df01ce6a8e', 'A'),
(2, '2c27012d-f957-58be-aa9e-7c4cd2355b18', 'A'),
(2, '17f48af4-6fc3-5512-b003-ba76920910ff', 'A'),
(2, '4345e829-8b8a-5149-90b2-810ee247e60a', 'P'),
(2, 'c1e20062-0df0-528a-85fd-03ac52aa9158', 'A'),
(2, 'e87444d3-a2a6-5222-af23-a3292cd4842c', 'A'),
(2, 'dee56da3-9c6b-5091-9d8e-32e95ca908e3', 'A'),
(2, '8f8831d0-40e9-5d41-ada6-aed4cda2a60f', 'F'),
(2, '7a5efba2-1e47-51a1-bff9-7045345a182d', 'A'),
(2, '2b273959-45fa-5c61-b757-359a169f2e1e', 'A'),
(2, '87585a59-cd24-5815-bbb7-9b7fbbc01c16', 'A'),
(2, 'a5ac36f5-693c-55b3-81b1-c1535a355af7', 'A'),
(2, '719c8def-873f-50f2-83c4-7006e03ceb8c', 'A'),
(2, '8b8a4e76-f7f1-5fab-af6d-9a13dbe20dd5', 'A'),
(2, 'd5bb007f-958d-5c73-ac74-2abbcc9606dd', 'A'),
(2, '6a523054-722b-5663-bb5e-7cec43e71400', 'A'),
(2, '186fc2b3-89cd-5b37-b106-78d29bc1a104', 'A'),
(2, '6961e3db-e3cc-5a18-a7ec-47c623cd734a', 'A'),
(2, '518e32ec-a189-5ace-a6dc-841a2e136245', 'A'),
(2, 'b8cd318d-ced4-56d5-ad1d-10ecff64f64b', 'A'),
(2, '6252616f-a023-543e-9845-044ededfea05', 'F'),
(2, '0d0f33f5-6711-5d14-abfe-00a32dc594a2', 'A'),
(2, '99e3978a-5008-588d-93a1-e45e28c81702', 'A'),
(2, 'dd6e2df9-978b-521f-8271-c8b87df4af97', 'A'),
(2, 'cbd0661d-8815-5999-ab79-bd785dcf3f3b', 'A'),
(2, '5734d562-6470-5225-9137-6c4023409340', 'A'),
(2, '344dedc7-32e5-5d5f-a848-7fb592111bf1', 'A'),
(3, 'e58014ec-d954-5bde-8fd9-655529ac50eb', 'F'),
(3, '20fb4035-3feb-58da-a9ab-77df01ce6a8e', 'L'),
(3, '2c27012d-f957-58be-aa9e-7c4cd2355b18', 'A'),
(3, '17f48af4-6fc3-5512-b003-ba76920910ff', 'F'),
(3, '4345e829-8b8a-5149-90b2-810ee247e60a', 'P'),
(3, 'c1e20062-0df0-528a-85fd-03ac52aa9158', 'A'),
(3, 'e87444d3-a2a6-5222-af23-a3292cd4842c', 'F'),
(3, 'dee56da3-9c6b-5091-9d8e-32e95ca908e3', 'A'),
(3, '8f8831d0-40e9-5d41-ada6-aed4cda2a60f', 'A'),
(3, '7a5efba2-1e47-51a1-bff9-7045345a182d', 'A'),
(3, '2b273959-45fa-5c61-b757-359a169f2e1e', 'A'),
(3, '87585a59-cd24-5815-bbb7-9b7fbbc01c16', 'A'),
(3, 'a5ac36f5-693c-55b3-81b1-c1535a355af7', 'A'),
(3, '719c8def-873f-50f2-83c4-7006e03ceb8c', 'A'),
(3, '8b8a4e76-f7f1-5fab-af6d-9a13dbe20dd5', 'F'),
(3, 'd5bb007f-958d-5c73-ac74-2abbcc9606dd', 'A'),
(3, '6a523054-722b-5663-bb5e-7cec43e71400', 'A'),
(3, '186fc2b3-89cd-5b37-b106-78d29bc1a104', 'A'),
(3, '6961e3db-e3cc-5a18-a7ec-47c623cd734a', 'A'),
(3, '518e32ec-a189-5ace-a6dc-841a2e136245', 'A'),
(3, 'b8cd318d-ced4-56d5-ad1d-10ecff64f64b', 'A'),
(3, '6252616f-a023-543e-9845-044ededfea05', 'A'),
(3, '0d0f33f5-6711-5d14-abfe-00a32dc594a2', 'R'),
(3, '99e3978a-5008-588d-93a1-e45e28c81702', 'A'),
(3, 'dd6e2df9-978b-521f-8271-c8b87df4af97', 'A'),
(3, 'cbd0661d-8815-5999-ab79-bd785dcf3f3b', 'P'),
(3, '5734d562-6470-5225-9137-6c4023409340', 'A'),
(3, '344dedc7-32e5-5d5f-a848-7fb592111bf1', 'P'),
(4, 'e58014ec-d954-5bde-8fd9-655529ac50eb', 'A'),
(4, '20fb4035-3feb-58da-a9ab-77df01ce6a8e', 'A'),
(4, '2c27012d-f957-58be-aa9e-7c4cd2355b18', 'A'),
(4, '17f48af4-6fc3-5512-b003-ba76920910ff', 'A'),
(4, '4345e829-8b8a-5149-90b2-810ee247e60a', 'A'),
(4, 'c1e20062-0df0-528a-85fd-03ac52aa9158', 'A'),
(4, 'e87444d3-a2a6-5222-af23-a3292cd4842c', 'A'),
(4, 'dee56da3-9c6b-5091-9d8e-32e95ca908e3', 'A'),
(4, '8f8831d0-40e9-5d41-ada6-aed4cda2a60f', 'A'),
(4, '7a5efba2-1e47-51a1-bff9-7045345a182d', 'A'),
(4, '2b273959-45fa-5c61-b757-359a169f2e1e', 'A'),
(4, '87585a59-cd24-5815-bbb7-9b7fbbc01c16', 'A'),
(4, 'a5ac36f5-693c-55b3-81b1-c1535a355af7', 'R'),
(4, '719c8def-873f-50f2-83c4-7006e03ceb8c', 'A'),
(4, '8b8a4e76-f7f1-5fab-af6d-9a13dbe20dd5', 'P'),
(4, 'd5bb007f-958d-5c73-ac74-2abbcc9606dd', 'A'),
(4, '6a523054-722b-5663-bb5e-7cec43e71400', 'A'),
(4, '186fc2b3-89cd-5b37-b106-78d29bc1a104', 'F'),
(4, '6961e3db-e3cc-5a18-a7ec-47c623cd734a', 'A'),
(4, '518e32ec-a189-5ace-a6dc-841a2e136245', 'A'),
(4, 'b8cd318d-ced4-56d5-ad1d-10ecff64f64b', 'A'),
(4, '6252616f-a023-543e-9845-044ededfea05', 'A'),
(4, '0d0f33f5-6711-5d14-abfe-00a32dc594a2', 'A'),
(4, '99e3978a-5008-588d-93a1-e45e28c81702', 'P'),
(4, 'dd6e2df9-978b-521f-8271-c8b87df4af97', 'A'),
(4, 'cbd0661d-8815-5999-ab79-bd785dcf3f3b', 'F'),
(4, '5734d562-6470-5225-9137-6c4023409340', 'A'),
(4, '344dedc7-32e5-5d5f-a848-7fb592111bf1', 'A'),
(5, 'e58014ec-d954-5bde-8fd9-655529ac50eb', 'A'),
(5, '20fb4035-3feb-58da-a9ab-77df01ce6a8e', 'A'),
(5, '2c27012d-f957-58be-aa9e-7c4cd2355b18', 'A'),
(5, '17f48af4-6fc3-5512-b003-ba76920910ff', 'A'),
(5, '4345e829-8b8a-5149-90b2-810ee247e60a', 'F'),
(5, 'c1e20062-0df0-528a-85fd-03ac52aa9158', 'A'),
(5, 'e87444d3-a2a6-5222-af23-a3292cd4842c', 'A'),
(5, 'dee56da3-9c6b-5091-9d8e-32e95ca908e3', 'A'),
(5, '8f8831d0-40e9-5d41-ada6-aed4cda2a60f', 'A'),
(5, '7a5efba2-1e47-51a1-bff9-7045345a182d', 'R'),
(5, '2b273959-45fa-5c61-b757-359a169f2e1e', 'A'),
(5, '87585a59-cd24-5815-bbb7-9b7fbbc01c16', 'A'),
(5, 'a5ac36f5-693c-55b3-81b1-c1535a355af7', 'A'),
(5, '719c8def-873f-50f2-83c4-7006e03ceb8c', 'P'),
(5, '8b8a4e76-f7f1-5fab-af6d-9a13dbe20dd5', 'A'),
(5, 'd5bb007f-958d-5c73-ac74-2abbcc9606dd', 'A'),
(5, '6a523054-722b-5663-bb5e-7cec43e71400', 'A'),
(5, '186fc2b3-89cd-5b37-b106-78d29bc1a104', 'A'),
(5, '6961e3db-e3cc-5a18-a7ec-47c623cd734a', 'A'),
(5, '518e32ec-a189-5ace-a6dc-841a2e136245', 'A'),
(5, 'b8cd318d-ced4-56d5-ad1d-10ecff64f64b', 'A'),
(5, '6252616f-a023-543e-9845-044ededfea05', 'A'),
(5, '0d0f33f5-6711-5d14-abfe-00a32dc594a2', 'A'),
(5, '99e3978a-5008-588d-93a1-e45e28c81702', 'A'),
(5, 'dd6e2df9-978b-521f-8271-c8b87df4af97', 'A'),
(5, 'cbd0661d-8815-5999-ab79-bd785dcf3f3b', 'A'),
(5, '5734d562-6470-5225-9137-6c4023409340', 'A'),
(5, '344dedc7-32e5-5d5f-a848-7fb592111bf1', 'A'),
(6, 'e58014ec-d954-5bde-8fd9-655529ac50eb', 'R'),
(6, '20fb4035-3feb-58da-a9ab-77df01ce6a8e', 'A'),
(6, '2c27012d-f957-58be-aa9e-7c4cd2355b18', 'P'),
(6, '17f48af4-6fc3-5512-b003-ba76920910ff', 'A'),
(6, '4345e829-8b8a-5149-90b2-810ee247e60a', 'A'),
(6, 'c1e20062-0df0-528a-85fd-03ac52aa9158', 'A'),
(6, 'e87444d3-a2a6-5222-af23-a3292cd4842c', 'A'),
(6, 'dee56da3-9c6b-5091-9d8e-32e95ca908e3', 'P'),
(6, '8f8831d0-40e9-5d41-ada6-aed4cda2a60f', 'A'),
(6, '7a5efba2-1e47-51a1-bff9-7045345a182d', 'A'),
(6, '2b273959-45fa-5c61-b757-359a169f2e1e', 'A'),
(6, '87585a59-cd24-5815-bbb7-9b7fbbc01c16', 'F'),
(6, 'a5ac36f5-693c-55b3-81b1-c1535a355af7', 'A'),
(6, '719c8def-873f-50f2-83c4-7006e03ceb8c', 'A'),
(6, '8b8a4e76-f7f1-5fab-af6d-9a13dbe20dd5', 'A'),
(6, 'd5bb007f-958d-5c73-ac74-2abbcc9606dd', 'A'),
(6, '6a523054-722b-5663-bb5e-7cec43e71400', 'A'),
(6, '186fc2b3-89cd-5b37-b106-78d29bc1a104', 'A'),
(6, '6961e3db-e3cc-5a18-a7ec-47c623cd734a', 'A'),
(6, '518e32ec-a189-5ace-a6dc-841a2e136245', 'A'),
(6, 'b8cd318d-ced4-56d5-ad1d-10ecff64f64b', 'F'),
(6, '6252616f-a023-543e-9845-044ededfea05', 'A'),
(6, '0d0f33f5-6711-5d14-abfe-00a32dc594a2', 'F'),
(6, '99e3978a-5008-588d-93a1-e45e28c81702', 'L'),
(6, 'dd6e2df9-978b-521f-8271-c8b87df4af97', 'A'),
(6, 'cbd0661d-8815-5999-ab79-bd785dcf3f3b', 'A'),
(6, '5734d562-6470-5225-9137-6c4023409340', 'A'),
(6, '344dedc7-32e5-5d5f-a848-7fb592111bf1', 'A'),
(7, 'e58014ec-d954-5bde-8fd9-655529ac50eb', 'L'),
(7, '20fb4035-3feb-58da-a9ab-77df01ce6a8e', 'A'),
(7, '2c27012d-f957-58be-aa9e-7c4cd2355b18', 'A'),
(7, '17f48af4-6fc3-5512-b003-ba76920910ff', 'A'),
(7, '4345e829-8b8a-5149-90b2-810ee247e60a', 'A'),
(7, 'c1e20062-0df0-528a-85fd-03ac52aa9158', 'A'),
(7, 'e87444d3-a2a6-5222-af23-a3292cd4842c', 'A'),
(7, 'dee56da3-9c6b-5091-9d8e-32e95ca908e3', 'A'),
(7, '8f8831d0-40e9-5d41-ada6-aed4cda2a60f', 'R'),
(7, '7a5efba2-1e47-51a1-bff9-7045345a182d', 'P'),
(7, '2b273959-45fa-5c61-b757-359a169f2e1e', 'A'),
(7, '87585a59-cd24-5815-bbb7-9b7fbbc01c16', 'F'),
(7, 'a5ac36f5-693c-55b3-81b1-c1535a355af7', 'A'),
(7, '719c8def-873f-50f2-83c4-7006e03ceb8c', 'A'),
(7, '8b8a4e76-f7f1-5fab-af6d-9a13dbe20dd5', 'A'),
(7, 'd5bb007f-958d-5c73-ac74-2abbcc9606dd', 'A'),
(7, '6a523054-722b-5663-bb5e-7cec43e71400', 'A'),
(7, '186fc2b3-89cd-5b37-b106-78d29bc1a104', 'F'),
(7, '6961e3db-e3cc-5a18-a7ec-47c623cd734a', 'A'),
(7, '518e32ec-a189-5ace-a6dc-841a2e136245', 'A'),
(7, 'b8cd318d-ced4-56d5-ad1d-10ecff64f64b', 'A'),
(7, '6252616f-a023-543e-9845-044ededfea05', 'A'),
(7, '0d0f33f5-6711-5d14-abfe-00a32dc594a2', 'A'),
(7, '99e3978a-5008-588d-93a1-e45e28c81702', 'A'),
(7, 'dd6e2df9-978b-521f-8271-c8b87df4af97', 'A'),
(7, 'cbd0661d-8815-5999-ab79-bd785dcf3f3b', 'A'),
(7, '5734d562-6470-5225-9137-6c4023409340', 'A'),
(7, '344dedc7-32e5-5d5f-a848-7fb592111bf1', 'A'),
(8, 'e58014ec-d954-5bde-8fd9-655529ac50eb', 'A'),
(8, '20fb4035-3feb-58da-a9ab-77df01ce6a8e', 'A'),
(8, '2c27012d-f957-58be-aa9e-7c4cd2355b18', 'A'),
(8, '17f48af4-6fc3-5512-b003-ba76920910ff', 'A'),
(8, '4345e829-8b8a-5149-90b2-810ee247e60a', 'A'),
(8, 'c1e20062-0df0-528a-85fd-03ac52aa9158', 'A'),
(8, 'e87444d3-a2a6-5222-af23-a3292cd4842c', 'A'),
(8, 'dee56da3-9c6b-5091-9d8e-32e95ca908e3', 'A'),
(8, '8f8831d0-40e9-5d41-ada6-aed4cda2a60f', 'F'),
(8, '7a5efba2-1e47-51a1-bff9-7045345a182d', 'A'),
(8, '2b273959-45fa-5c61-b757-359a169f2e1e', 'A'),
(8, '87585a59-cd24-5815-bbb7-9b7fbbc01c16', 'A'),
(8, 'a5ac36f5-693c-55b3-81b1-c1535a355af7', 'A'),
(8, '719c8def-873f-50f2-83c4-7006e03ceb8c', 'A'),
(8, '8b8a4e76-f7f1-5fab-af6d-9a13dbe20dd5', 'A'),
(8, 'd5bb007f-958d-5c73-ac74-2abbcc9606dd', 'A'),
(8, '6a523054-722b-5663-bb5e-7cec43e71400', 'A'),
(8, '186fc2b3-89cd-5b37-b106-78d29bc1a104', 'A'),
(8, '6961e3db-e3cc-5a18-a7ec-47c623cd734a', 'A'),
(8, '518e32ec-a189-5ace-a6dc-841a2e136245', 'A'),
(8, 'b8cd318d-ced4-56d5-ad1d-10ecff64f64b', 'A'),
(8, '6252616f-a023-543e-9845-044ededfea05', 'A'),
(8, '0d0f33f5-6711-5d14-abfe-00a32dc594a2', 'A'),
(8, '99e3978a-5008-588d-93a1-e45e28c81702', 'A'),
(8, 'dd6e2df9-978b-521f-8271-c8b87df4af97', 'A'),
(8, 'cbd0661d-8815-5999-ab79-bd785dcf3f3b', 'L'),
(8, '5734d562-6470-5225-9137-6c4023409340', 'F'),
(8, '344dedc7-32e5-5d5f-a848-7fb592111bf1', 'A'),
(9, 'e58014ec-d954-5bde-8fd9-655529ac50eb', 'A'),
(9, '20fb4035-3feb-58da-a9ab-77df01ce6a8e', 'A'),
(9, '2c27012d-f957-58be-aa9e-7c4cd2355b18', 'A'),
(9, '17f48af4-6fc3-5512-b003-ba76920910ff', 'A'),
(9, '4345e829-8b8a-5149-90b2-810ee247e60a', 'A'),
(9, 'c1e20062-0df0-528a-85fd-03ac52aa9158', 'A'),
(9, 'e87444d3-a2a6-5222-af23-a3292cd4842c', 'A'),
(9, 'dee56da3-9c6b-5091-9d8e-32e95ca908e3', 'A'),
(9, '8f8831d0-40e9-5d41-ada6-aed4cda2a60f', 'F'),
(9, '7a5efba2-1e47-51a1-bff9-7045345a182d', 'A'),
(9, '2b273959-45fa-5c61-b757-359a169f2e1e', 'A'),
(9, '87585a59-cd24-5815-bbb7-9b7fbbc01c16', 'A'),
(9, 'a5ac36f5-693c-55b3-81b1-c1535a355af7', 'A'),
(9, '719c8def-873f-50f2-83c4-7006e03ceb8c', 'L'),
(9, '8b8a4e76-f7f1-5fab-af6d-9a13dbe20dd5', 'A'),
(9, 'd5bb007f-958d-5c73-ac74-2abbcc9606dd', 'A'),
(9, '6a523054-722b-5663-bb5e-7cec43e71400', 'A'),
(9, '186fc2b3-89cd-5b37-b106-78d29bc1a104', 'A'),
(9, '6961e3db-e3cc-5a18-a7ec-47c623cd734a', 'A'),
(9, '518e32ec-a189-5ace-a6dc-841a2e136245', 'F'),
(9, 'b8cd318d-ced4-56d5-ad1d-10ecff64f64b', 'A'),
(9, '6252616f-a023-543e-9845-044ededfea05', 'F'),
(9, '0d0f33f5-6711-5d14-abfe-00a32dc594a2', 'A'),
(9, '99e3978a-5008-588d-93a1-e45e28c81702', 'A'),
(9, 'dd6e2df9-978b-521f-8271-c8b87df4af97', 'A'),
(9, 'cbd0661d-8815-5999-ab79-bd785dcf3f3b', 'A'),
(9, '5734d562-6470-5225-9137-6c4023409340', 'A'),
(9, '344dedc7-32e5-5d5f-a848-7fb592111bf1', 'A'),
(10, 'e58014ec-d954-5bde-8fd9-655529ac50eb', 'A'),
(10, '20fb4035-3feb-58da-a9ab-77df01ce6a8e', 'A'),
(10, '2c27012d-f957-58be-aa9e-7c4cd2355b18', 'A'),
(10, '17f48af4-6fc3-5512-b003-ba76920910ff', 'A'),
(10, '4345e829-8b8a-5149-90b2-810ee247e60a', 'A'),
(10, 'c1e20062-0df0-528a-85fd-03ac52aa9158', 'A'),
(10, 'e87444d3-a2a6-5222-af23-a3292cd4842c', 'F'),
(10, 'dee56da3-9c6b-5091-9d8e-32e95ca908e3', 'A'),
(10, '8f8831d0-40e9-5d41-ada6-aed4cda2a60f', 'A'),
(10, '7a5efba2-1e47-51a1-bff9-7045345a182d', 'A'),
(10, '2b273959-45fa-5c61-b757-359a169f2e1e', 'A'),
(10, '87585a59-cd24-5815-bbb7-9b7fbbc01c16', 'A'),
(10, 'a5ac36f5-693c-55b3-81b1-c1535a355af7', 'A'),
(10, '719c8def-873f-50f2-83c4-7006e03ceb8c', 'F'),
(10, '8b8a4e76-f7f1-5fab-af6d-9a13dbe20dd5', 'A'),
(10, 'd5bb007f-958d-5c73-ac74-2abbcc9606dd', 'A'),
(10, '6a523054-722b-5663-bb5e-7cec43e71400', 'F'),
(10, '186fc2b3-89cd-5b37-b106-78d29bc1a104', 'A'),
(10, '6961e3db-e3cc-5a18-a7ec-47c623cd734a', 'A'),
(10, '518e32ec-a189-5ace-a6dc-841a2e136245', 'A'),
(10, 'b8cd318d-ced4-56d5-ad1d-10ecff64f64b', 'A'),
(10, '6252616f-a023-543e-9845-044ededfea05', 'A'),
(10, '0d0f33f5-6711-5d14-abfe-00a32dc594a2', 'P'),
(10, '99e3978a-5008-588d-93a1-e45e28c81702', 'A'),
(10, 'dd6e2df9-978b-521f-8271-c8b87df4af97', 'A'),
(10, 'cbd0661d-8815-5999-ab79-bd785dcf3f3b', 'A'),
(10, '5734d562-6470-5225-9137-6c4023409340', 'A'),
(10, '344dedc7-32e5-5d5f-a848-7fb592111bf1', 'A'),
(11, 'e58014ec-d954-5bde-8fd9-655529ac50eb', 'A'),
(11, '20fb4035-3feb-58da-a9ab-77df01ce6a8e', 'A'),
(11, '2c27012d-f957-58be-aa9e-7c4cd2355b18', 'A'),
(11, '17f48af4-6fc3-5512-b003-ba76920910ff', 'A'),
(11, '4345e829-8b8a-5149-90b2-810ee247e60a', 'A'),
(11, 'c1e20062-0df0-528a-85fd-03ac52aa9158', 'A'),
(11, 'e87444d3-a2a6-5222-af23-a3292cd4842c', 'A'),
(11, 'dee56da3-9c6b-5091-9d8e-32e95ca908e3', 'A'),
(11, '8f8831d0-40e9-5d41-ada6-aed4cda2a60f', 'A'),
(11, '7a5efba2-1e47-51a1-bff9-7045345a182d', 'F'),
(11, '2b273959-45fa-5c61-b757-359a169f2e1e', 'A'),
(11, '87585a59-cd24-5815-bbb7-9b7fbbc01c16', 'A'),
(11, 'a5ac36f5-693c-55b3-81b1-c1535a355af7', 'A'),
(11, '719c8def-873f-50f2-83c4-7006e03ceb8c', 'A'),
(11, '8b8a4e76-f7f1-5fab-af6d-9a13dbe20dd5', 'P'),
(11, 'd5bb007f-958d-5c73-ac74-2abbcc9606dd', 'A'),
(11, '6a523054-722b-5663-bb5e-7cec43e71400', 'A'),
(11, '186fc2b3-89cd-5b37-b106-78d29bc1a104', 'A'),
(11, '6961e3db-e3cc-5a18-a7ec-47c623cd734a', 'A'),
(11, '518e32ec-a189-5ace-a6dc-841a2e136245', 'A'),
(11, 'b8cd318d-ced4-56d5-ad1d-10ecff64f64b', 'A'),
(11, '6252616f-a023-543e-9845-044ededfea05', 'A'),
(11, '0d0f33f5-6711-5d14-abfe-00a32dc594a2', 'A'),
(11, '99e3978a-5008-588d-93a1-e45e28c81702', 'F'),
(11, 'dd6e2df9-978b-521f-8271-c8b87df4af97', 'A'),
(11, 'cbd0661d-8815-5999-ab79-bd785dcf3f3b', 'A'),
(11, '5734d562-6470-5225-9137-6c4023409340', 'A'),
(11, '344dedc7-32e5-5d5f-a848-7fb592111bf1', 'A'),
(12, 'e58014ec-d954-5bde-8fd9-655529ac50eb', 'A'),
(12, '20fb4035-3feb-58da-a9ab-77df01ce6a8e', 'A'),
(12, '2c27012d-f957-58be-aa9e-7c4cd2355b18', 'A'),
(12, '17f48af4-6fc3-5512-b003-ba76920910ff', 'A'),
(12, '4345e829-8b8a-5149-90b2-810ee247e60a', 'A'),
(12, 'c1e20062-0df0-528a-85fd-03ac52aa9158', 'A'),
(12, 'e87444d3-a2a6-5222-af23-a3292cd4842c', 'A'),
(12, 'dee56da3-9c6b-5091-9d8e-32e95ca908e3', 'A'),
(12, '8f8831d0-40e9-5d41-ada6-aed4cda2a60f', 'A'),
(12, '7a5efba2-1e47-51a1-bff9-7045345a182d', 'A'),
(12, '2b273959-45fa-5c61-b757-359a169f2e1e', 'F'),
(12, '87585a59-cd24-5815-bbb7-9b7fbbc01c16', 'A'),
(12, 'a5ac36f5-693c-55b3-81b1-c1535a355af7', 'A'),
(12, '719c8def-873f-50f2-83c4-7006e03ceb8c', 'A'),
(12, '8b8a4e76-f7f1-5fab-af6d-9a13dbe20dd5', 'A'),
(12, 'd5bb007f-958d-5c73-ac74-2abbcc9606dd', 'A'),
(12, '6a523054-722b-5663-bb5e-7cec43e71400', 'R'),
(12, '186fc2b3-89cd-5b37-b106-78d29bc1a104', 'A'),
(12, '6961e3db-e3cc-5a18-a7ec-47c623cd734a', 'F'),
(12, '518e32ec-a189-5ace-a6dc-841a2e136245', 'A'),
(12, 'b8cd318d-ced4-56d5-ad1d-10ecff64f64b', 'A'),
(12, '6252616f-a023-543e-9845-044ededfea05', 'A'),
(12, '0d0f33f5-6711-5d14-abfe-00a32dc594a2', 'A'),
(12, '99e3978a-5008-588d-93a1-e45e28c81702', 'A'),
(12, 'dd6e2df9-978b-521f-8271-c8b87df4af97', 'A'),
(12, 'cbd0661d-8815-5999-ab79-bd785dcf3f3b', 'A'),
(12, '5734d562-6470-5225-9137-6c4023409340', 'A'),
(12, '344dedc7-32e5-5d5f-a848-7fb592111bf1', 'A'),
(13, 'e58014ec-d954-5bde-8fd9-655529ac50eb', 'A'),
(13, '20fb4035-3feb-58da-a9ab-77df01ce6a8e', 'P'),
(13, '2c27012d-f957-58be-aa9e-7c4cd2355b18', 'A'),
(13, '17f48af4-6fc3-5512-b003-ba76920910ff', 'A'),
(13, '4345e829-8b8a-5149-90b2-810ee247e60a', 'A'),
(13, 'c1e20062-0df0-528a-85fd-03ac52aa9158', 'A'),
(13, 'e87444d3-a2a6-5222-af23-a3292cd4842c', 'F'),
(13, 'dee56da3-9c6b-5091-9d8e-32e95ca908e3', 'P'),
(13, '8f8831d0-40e9-5d41-ada6-aed4cda2a60f', 'P'),
(13, '7a5efba2-1e47-51a1-bff9-7045345a182d', 'A'),
(13, '2b273959-45fa-5c61-b757-359a169f2e1e', 'P'),
(13, '87585a59-cd24-5815-bbb7-9b7fbbc01c16', 'A'),
(13, 'a5ac36f5-693c-55b3-81b1-c1535a355af7', 'A'),
(13, '719c8def-873f-50f2-83c4-7006e03ceb8c', 'A'),
(13, '8b8a4e76-f7f1-5fab-af6d-9a13dbe20dd5', 'A'),
(13, 'd5bb007f-958d-5c73-ac74-2abbcc9606dd', 'A'),
(13, '6a523054-722b-5663-bb5e-7cec43e71400', 'A'),
(13, '186fc2b3-89cd-5b37-b106-78d29bc1a104', 'A'),
(13, '6961e3db-e3cc-5a18-a7ec-47c623cd734a', 'A'),
(13, '518e32ec-a189-5ace-a6dc-841a2e136245', 'A'),
(13, 'b8cd318d-ced4-56d5-ad1d-10ecff64f64b', 'F'),
(13, '6252616f-a023-543e-9845-044ededfea05', 'A'),
(13, '0d0f33f5-6711-5d14-abfe-00a32dc594a2', 'A'),
(13, '99e3978a-5008-588d-93a1-e45e28c81702', 'F'),
(13, 'dd6e2df9-978b-521f-8271-c8b87df4af97', 'A'),
(13, 'cbd0661d-8815-5999-ab79-bd785dcf3f3b', 'A'),
(13, '5734d562-6470-5225-9137-6c4023409340', 'F'),
(13, '344dedc7-32e5-5d5f-a848-7fb592111bf1', 'A'),
(14, 'e58014ec-d954-5bde-8fd9-655529ac50eb', 'A'),
(14, '20fb4035-3feb-58da-a9ab-77df01ce6a8e', 'A'),
(14, '2c27012d-f957-58be-aa9e-7c4cd2355b18', 'F'),
(14, '17f48af4-6fc3-5512-b003-ba76920910ff', 'A'),
(14, '4345e829-8b8a-5149-90b2-810ee247e60a', 'A'),
(14, 'c1e20062-0df0-528a-85fd-03ac52aa9158', 'A'),
(14, 'e87444d3-a2a6-5222-af23-a3292cd4842c', 'A'),
(14, 'dee56da3-9c6b-5091-9d8e-32e95ca908e3', 'A'),
(14, '8f8831d0-40e9-5d41-ada6-aed4cda2a60f', 'A'),
(14, '7a5efba2-1e47-51a1-bff9-7045345a182d', 'A'),
(14, '2b273959-45fa-5c61-b757-359a169f2e1e', 'A'),
(14, '87585a59-cd24-5815-bbb7-9b7fbbc01c16', 'A'),
(14, 'a5ac36f5-693c-55b3-81b1-c1535a355af7', 'A'),
(14, '719c8def-873f-50f2-83c4-7006e03ceb8c', 'F'),
(14, '8b8a4e76-f7f1-5fab-af6d-9a13dbe20dd5', 'A'),
(14, 'd5bb007f-958d-5c73-ac74-2abbcc9606dd', 'A'),
(14, '6a523054-722b-5663-bb5e-7cec43e71400', 'A'),
(14, '186fc2b3-89cd-5b37-b106-78d29bc1a104', 'A'),
(14, '6961e3db-e3cc-5a18-a7ec-47c623cd734a', 'F'),
(14, '518e32ec-a189-5ace-a6dc-841a2e136245', 'P'),
(14, 'b8cd318d-ced4-56d5-ad1d-10ecff64f64b', 'A'),
(14, '6252616f-a023-543e-9845-044ededfea05', 'A'),
(14, '0d0f33f5-6711-5d14-abfe-00a32dc594a2', 'A'),
(14, '99e3978a-5008-588d-93a1-e45e28c81702', 'A'),
(14, 'dd6e2df9-978b-521f-8271-c8b87df4af97', 'A'),
(14, 'cbd0661d-8815-5999-ab79-bd785dcf3f3b', 'A'),
(14, '5734d562-6470-5225-9137-6c4023409340', 'F'),
(14, '344dedc7-32e5-5d5f-a848-7fb592111bf1', 'A'),
(15, 'e58014ec-d954-5bde-8fd9-655529ac50eb', 'A'),
(15, '20fb4035-3feb-58da-a9ab-77df01ce6a8e', 'A'),
(15, '2c27012d-f957-58be-aa9e-7c4cd2355b18', 'A'),
(15, '17f48af4-6fc3-5512-b003-ba76920910ff', 'F'),
(15, '4345e829-8b8a-5149-90b2-810ee247e60a', 'A'),
(15, 'c1e20062-0df0-528a-85fd-03ac52aa9158', 'A'),
(15, 'e87444d3-a2a6-5222-af23-a3292cd4842c', 'A'),
(15, 'dee56da3-9c6b-5091-9d8e-32e95ca908e3', 'A');
insert into asistencia.asistencia (lista_id, persona_id, marca) values (15, '8f8831d0-40e9-5d41-ada6-aed4cda2a60f', 'A'),
(15, '7a5efba2-1e47-51a1-bff9-7045345a182d', 'A'),
(15, '2b273959-45fa-5c61-b757-359a169f2e1e', 'P'),
(15, '87585a59-cd24-5815-bbb7-9b7fbbc01c16', 'L'),
(15, 'a5ac36f5-693c-55b3-81b1-c1535a355af7', 'A'),
(15, '719c8def-873f-50f2-83c4-7006e03ceb8c', 'F'),
(15, '8b8a4e76-f7f1-5fab-af6d-9a13dbe20dd5', 'A'),
(15, 'd5bb007f-958d-5c73-ac74-2abbcc9606dd', 'P'),
(15, '6a523054-722b-5663-bb5e-7cec43e71400', 'P'),
(15, '186fc2b3-89cd-5b37-b106-78d29bc1a104', 'A'),
(15, '6961e3db-e3cc-5a18-a7ec-47c623cd734a', 'A'),
(15, '518e32ec-a189-5ace-a6dc-841a2e136245', 'A'),
(15, 'b8cd318d-ced4-56d5-ad1d-10ecff64f64b', 'A'),
(15, '6252616f-a023-543e-9845-044ededfea05', 'A'),
(15, '0d0f33f5-6711-5d14-abfe-00a32dc594a2', 'A'),
(15, '99e3978a-5008-588d-93a1-e45e28c81702', 'A'),
(15, 'dd6e2df9-978b-521f-8271-c8b87df4af97', 'A'),
(15, 'cbd0661d-8815-5999-ab79-bd785dcf3f3b', 'F'),
(15, '5734d562-6470-5225-9137-6c4023409340', 'A'),
(15, '344dedc7-32e5-5d5f-a848-7fb592111bf1', 'A'),
(16, 'e58014ec-d954-5bde-8fd9-655529ac50eb', 'A'),
(16, '20fb4035-3feb-58da-a9ab-77df01ce6a8e', 'A'),
(16, '2c27012d-f957-58be-aa9e-7c4cd2355b18', 'A'),
(16, '17f48af4-6fc3-5512-b003-ba76920910ff', 'A'),
(16, '4345e829-8b8a-5149-90b2-810ee247e60a', 'A'),
(16, 'c1e20062-0df0-528a-85fd-03ac52aa9158', 'A'),
(16, 'e87444d3-a2a6-5222-af23-a3292cd4842c', 'A'),
(16, 'dee56da3-9c6b-5091-9d8e-32e95ca908e3', 'A'),
(16, '8f8831d0-40e9-5d41-ada6-aed4cda2a60f', 'A'),
(16, '7a5efba2-1e47-51a1-bff9-7045345a182d', 'A'),
(16, '2b273959-45fa-5c61-b757-359a169f2e1e', 'A'),
(16, '87585a59-cd24-5815-bbb7-9b7fbbc01c16', 'A'),
(16, 'a5ac36f5-693c-55b3-81b1-c1535a355af7', 'A'),
(16, '719c8def-873f-50f2-83c4-7006e03ceb8c', 'A'),
(16, '8b8a4e76-f7f1-5fab-af6d-9a13dbe20dd5', 'A'),
(16, 'd5bb007f-958d-5c73-ac74-2abbcc9606dd', 'A'),
(16, '6a523054-722b-5663-bb5e-7cec43e71400', 'A'),
(16, '186fc2b3-89cd-5b37-b106-78d29bc1a104', 'A'),
(16, '6961e3db-e3cc-5a18-a7ec-47c623cd734a', 'A'),
(16, '518e32ec-a189-5ace-a6dc-841a2e136245', 'A'),
(16, 'b8cd318d-ced4-56d5-ad1d-10ecff64f64b', 'F'),
(16, '6252616f-a023-543e-9845-044ededfea05', 'A'),
(16, '0d0f33f5-6711-5d14-abfe-00a32dc594a2', 'A'),
(16, '99e3978a-5008-588d-93a1-e45e28c81702', 'P'),
(16, 'dd6e2df9-978b-521f-8271-c8b87df4af97', 'R'),
(16, 'cbd0661d-8815-5999-ab79-bd785dcf3f3b', 'F'),
(16, '5734d562-6470-5225-9137-6c4023409340', 'A'),
(16, '344dedc7-32e5-5d5f-a848-7fb592111bf1', 'A'),
(17, 'e58014ec-d954-5bde-8fd9-655529ac50eb', 'A'),
(17, '20fb4035-3feb-58da-a9ab-77df01ce6a8e', 'A'),
(17, '2c27012d-f957-58be-aa9e-7c4cd2355b18', 'F'),
(17, '17f48af4-6fc3-5512-b003-ba76920910ff', 'A'),
(17, '4345e829-8b8a-5149-90b2-810ee247e60a', 'A'),
(17, 'c1e20062-0df0-528a-85fd-03ac52aa9158', 'A'),
(17, 'e87444d3-a2a6-5222-af23-a3292cd4842c', 'F'),
(17, 'dee56da3-9c6b-5091-9d8e-32e95ca908e3', 'S'),
(17, '8f8831d0-40e9-5d41-ada6-aed4cda2a60f', 'L'),
(17, '7a5efba2-1e47-51a1-bff9-7045345a182d', 'R'),
(17, '2b273959-45fa-5c61-b757-359a169f2e1e', 'A'),
(17, '87585a59-cd24-5815-bbb7-9b7fbbc01c16', 'A'),
(17, 'a5ac36f5-693c-55b3-81b1-c1535a355af7', 'F'),
(17, '719c8def-873f-50f2-83c4-7006e03ceb8c', 'A'),
(17, '8b8a4e76-f7f1-5fab-af6d-9a13dbe20dd5', 'A'),
(17, 'd5bb007f-958d-5c73-ac74-2abbcc9606dd', 'R'),
(17, '6a523054-722b-5663-bb5e-7cec43e71400', 'P'),
(17, '186fc2b3-89cd-5b37-b106-78d29bc1a104', 'A'),
(17, '6961e3db-e3cc-5a18-a7ec-47c623cd734a', 'A'),
(17, '518e32ec-a189-5ace-a6dc-841a2e136245', 'A'),
(17, 'b8cd318d-ced4-56d5-ad1d-10ecff64f64b', 'A'),
(17, '6252616f-a023-543e-9845-044ededfea05', 'F'),
(17, '0d0f33f5-6711-5d14-abfe-00a32dc594a2', 'F'),
(17, '99e3978a-5008-588d-93a1-e45e28c81702', 'P'),
(17, 'dd6e2df9-978b-521f-8271-c8b87df4af97', 'A'),
(17, 'cbd0661d-8815-5999-ab79-bd785dcf3f3b', 'A'),
(17, '5734d562-6470-5225-9137-6c4023409340', 'A'),
(17, '344dedc7-32e5-5d5f-a848-7fb592111bf1', 'F'),
(18, 'e58014ec-d954-5bde-8fd9-655529ac50eb', 'A'),
(18, '20fb4035-3feb-58da-a9ab-77df01ce6a8e', 'A'),
(18, '2c27012d-f957-58be-aa9e-7c4cd2355b18', 'P'),
(18, '17f48af4-6fc3-5512-b003-ba76920910ff', 'A'),
(18, '4345e829-8b8a-5149-90b2-810ee247e60a', 'A'),
(18, 'c1e20062-0df0-528a-85fd-03ac52aa9158', 'A'),
(18, 'e87444d3-a2a6-5222-af23-a3292cd4842c', 'A'),
(18, 'dee56da3-9c6b-5091-9d8e-32e95ca908e3', 'A'),
(18, '8f8831d0-40e9-5d41-ada6-aed4cda2a60f', 'A'),
(18, '7a5efba2-1e47-51a1-bff9-7045345a182d', 'F'),
(18, '2b273959-45fa-5c61-b757-359a169f2e1e', 'A'),
(18, '87585a59-cd24-5815-bbb7-9b7fbbc01c16', 'R'),
(18, 'a5ac36f5-693c-55b3-81b1-c1535a355af7', 'F'),
(18, '719c8def-873f-50f2-83c4-7006e03ceb8c', 'A'),
(18, '8b8a4e76-f7f1-5fab-af6d-9a13dbe20dd5', 'A'),
(18, 'd5bb007f-958d-5c73-ac74-2abbcc9606dd', 'A'),
(18, '6a523054-722b-5663-bb5e-7cec43e71400', 'F'),
(18, '186fc2b3-89cd-5b37-b106-78d29bc1a104', 'A'),
(18, '6961e3db-e3cc-5a18-a7ec-47c623cd734a', 'A'),
(18, '518e32ec-a189-5ace-a6dc-841a2e136245', 'A'),
(18, 'b8cd318d-ced4-56d5-ad1d-10ecff64f64b', 'A'),
(18, '6252616f-a023-543e-9845-044ededfea05', 'A'),
(18, '0d0f33f5-6711-5d14-abfe-00a32dc594a2', 'A'),
(18, '99e3978a-5008-588d-93a1-e45e28c81702', 'A'),
(18, 'dd6e2df9-978b-521f-8271-c8b87df4af97', 'A'),
(18, 'cbd0661d-8815-5999-ab79-bd785dcf3f3b', 'A'),
(18, '5734d562-6470-5225-9137-6c4023409340', 'A'),
(18, '344dedc7-32e5-5d5f-a848-7fb592111bf1', 'A'),
(19, 'e58014ec-d954-5bde-8fd9-655529ac50eb', 'A'),
(19, '20fb4035-3feb-58da-a9ab-77df01ce6a8e', 'A'),
(19, '2c27012d-f957-58be-aa9e-7c4cd2355b18', 'A'),
(19, '17f48af4-6fc3-5512-b003-ba76920910ff', 'A'),
(19, '4345e829-8b8a-5149-90b2-810ee247e60a', 'A'),
(19, 'c1e20062-0df0-528a-85fd-03ac52aa9158', 'A'),
(19, 'e87444d3-a2a6-5222-af23-a3292cd4842c', 'A'),
(19, 'dee56da3-9c6b-5091-9d8e-32e95ca908e3', 'A'),
(19, '8f8831d0-40e9-5d41-ada6-aed4cda2a60f', 'A'),
(19, '7a5efba2-1e47-51a1-bff9-7045345a182d', 'A'),
(19, '2b273959-45fa-5c61-b757-359a169f2e1e', 'L'),
(19, '87585a59-cd24-5815-bbb7-9b7fbbc01c16', 'A'),
(19, 'a5ac36f5-693c-55b3-81b1-c1535a355af7', 'A'),
(19, '719c8def-873f-50f2-83c4-7006e03ceb8c', 'A'),
(19, '8b8a4e76-f7f1-5fab-af6d-9a13dbe20dd5', 'A'),
(19, 'd5bb007f-958d-5c73-ac74-2abbcc9606dd', 'A'),
(19, '6a523054-722b-5663-bb5e-7cec43e71400', 'A'),
(19, '186fc2b3-89cd-5b37-b106-78d29bc1a104', 'A'),
(19, '6961e3db-e3cc-5a18-a7ec-47c623cd734a', 'F'),
(19, '518e32ec-a189-5ace-a6dc-841a2e136245', 'A'),
(19, 'b8cd318d-ced4-56d5-ad1d-10ecff64f64b', 'F'),
(19, '6252616f-a023-543e-9845-044ededfea05', 'A'),
(19, '0d0f33f5-6711-5d14-abfe-00a32dc594a2', 'A'),
(19, '99e3978a-5008-588d-93a1-e45e28c81702', 'A'),
(19, 'dd6e2df9-978b-521f-8271-c8b87df4af97', 'A'),
(19, 'cbd0661d-8815-5999-ab79-bd785dcf3f3b', 'A'),
(19, '5734d562-6470-5225-9137-6c4023409340', 'A'),
(19, '344dedc7-32e5-5d5f-a848-7fb592111bf1', 'A'),
(20, 'e58014ec-d954-5bde-8fd9-655529ac50eb', 'A'),
(20, '20fb4035-3feb-58da-a9ab-77df01ce6a8e', 'A'),
(20, '2c27012d-f957-58be-aa9e-7c4cd2355b18', 'A'),
(20, '17f48af4-6fc3-5512-b003-ba76920910ff', 'F'),
(20, '4345e829-8b8a-5149-90b2-810ee247e60a', 'A'),
(20, 'c1e20062-0df0-528a-85fd-03ac52aa9158', 'L'),
(20, 'e87444d3-a2a6-5222-af23-a3292cd4842c', 'A'),
(20, 'dee56da3-9c6b-5091-9d8e-32e95ca908e3', 'A'),
(20, '8f8831d0-40e9-5d41-ada6-aed4cda2a60f', 'P'),
(20, '7a5efba2-1e47-51a1-bff9-7045345a182d', 'A'),
(20, '2b273959-45fa-5c61-b757-359a169f2e1e', 'A'),
(20, '87585a59-cd24-5815-bbb7-9b7fbbc01c16', 'A'),
(20, 'a5ac36f5-693c-55b3-81b1-c1535a355af7', 'A'),
(20, '719c8def-873f-50f2-83c4-7006e03ceb8c', 'A'),
(20, '8b8a4e76-f7f1-5fab-af6d-9a13dbe20dd5', 'A'),
(20, 'd5bb007f-958d-5c73-ac74-2abbcc9606dd', 'R'),
(20, '6a523054-722b-5663-bb5e-7cec43e71400', 'A'),
(20, '186fc2b3-89cd-5b37-b106-78d29bc1a104', 'A'),
(20, '6961e3db-e3cc-5a18-a7ec-47c623cd734a', 'A'),
(20, '518e32ec-a189-5ace-a6dc-841a2e136245', 'A'),
(20, 'b8cd318d-ced4-56d5-ad1d-10ecff64f64b', 'A'),
(20, '6252616f-a023-543e-9845-044ededfea05', 'L'),
(20, '0d0f33f5-6711-5d14-abfe-00a32dc594a2', 'A'),
(20, '99e3978a-5008-588d-93a1-e45e28c81702', 'A'),
(20, 'dd6e2df9-978b-521f-8271-c8b87df4af97', 'F'),
(20, 'cbd0661d-8815-5999-ab79-bd785dcf3f3b', 'A'),
(20, '5734d562-6470-5225-9137-6c4023409340', 'A'),
(20, '344dedc7-32e5-5d5f-a848-7fb592111bf1', 'A'),
(21, 'e58014ec-d954-5bde-8fd9-655529ac50eb', 'A'),
(21, '20fb4035-3feb-58da-a9ab-77df01ce6a8e', 'A'),
(21, '2c27012d-f957-58be-aa9e-7c4cd2355b18', 'A'),
(21, '17f48af4-6fc3-5512-b003-ba76920910ff', 'A'),
(21, '4345e829-8b8a-5149-90b2-810ee247e60a', 'A'),
(21, 'c1e20062-0df0-528a-85fd-03ac52aa9158', 'P'),
(21, 'e87444d3-a2a6-5222-af23-a3292cd4842c', 'A'),
(21, 'dee56da3-9c6b-5091-9d8e-32e95ca908e3', 'P'),
(21, '8f8831d0-40e9-5d41-ada6-aed4cda2a60f', 'L'),
(21, '7a5efba2-1e47-51a1-bff9-7045345a182d', 'A'),
(21, '2b273959-45fa-5c61-b757-359a169f2e1e', 'A'),
(21, '87585a59-cd24-5815-bbb7-9b7fbbc01c16', 'A'),
(21, 'a5ac36f5-693c-55b3-81b1-c1535a355af7', 'A'),
(21, '719c8def-873f-50f2-83c4-7006e03ceb8c', 'A'),
(21, '8b8a4e76-f7f1-5fab-af6d-9a13dbe20dd5', 'A'),
(21, 'd5bb007f-958d-5c73-ac74-2abbcc9606dd', 'A'),
(21, '6a523054-722b-5663-bb5e-7cec43e71400', 'A'),
(21, '186fc2b3-89cd-5b37-b106-78d29bc1a104', 'S'),
(21, '6961e3db-e3cc-5a18-a7ec-47c623cd734a', 'A'),
(21, '518e32ec-a189-5ace-a6dc-841a2e136245', 'A'),
(21, 'b8cd318d-ced4-56d5-ad1d-10ecff64f64b', 'L'),
(21, '6252616f-a023-543e-9845-044ededfea05', 'A'),
(21, '0d0f33f5-6711-5d14-abfe-00a32dc594a2', 'A'),
(21, '99e3978a-5008-588d-93a1-e45e28c81702', 'A'),
(21, 'dd6e2df9-978b-521f-8271-c8b87df4af97', 'A'),
(21, 'cbd0661d-8815-5999-ab79-bd785dcf3f3b', 'A'),
(21, '5734d562-6470-5225-9137-6c4023409340', 'A'),
(21, '344dedc7-32e5-5d5f-a848-7fb592111bf1', 'A'),
(22, 'e58014ec-d954-5bde-8fd9-655529ac50eb', 'A'),
(22, '20fb4035-3feb-58da-a9ab-77df01ce6a8e', 'P'),
(22, '2c27012d-f957-58be-aa9e-7c4cd2355b18', 'A'),
(22, '17f48af4-6fc3-5512-b003-ba76920910ff', 'A'),
(22, '4345e829-8b8a-5149-90b2-810ee247e60a', 'A'),
(22, 'c1e20062-0df0-528a-85fd-03ac52aa9158', 'A'),
(22, 'e87444d3-a2a6-5222-af23-a3292cd4842c', 'F'),
(22, 'dee56da3-9c6b-5091-9d8e-32e95ca908e3', 'R'),
(22, '8f8831d0-40e9-5d41-ada6-aed4cda2a60f', 'F'),
(22, '7a5efba2-1e47-51a1-bff9-7045345a182d', 'A'),
(22, '2b273959-45fa-5c61-b757-359a169f2e1e', 'A'),
(22, '87585a59-cd24-5815-bbb7-9b7fbbc01c16', 'A'),
(22, 'a5ac36f5-693c-55b3-81b1-c1535a355af7', 'A'),
(22, '719c8def-873f-50f2-83c4-7006e03ceb8c', 'A'),
(22, '8b8a4e76-f7f1-5fab-af6d-9a13dbe20dd5', 'F'),
(22, 'd5bb007f-958d-5c73-ac74-2abbcc9606dd', 'A'),
(22, '6a523054-722b-5663-bb5e-7cec43e71400', 'A'),
(22, '186fc2b3-89cd-5b37-b106-78d29bc1a104', 'A'),
(22, '6961e3db-e3cc-5a18-a7ec-47c623cd734a', 'A'),
(22, '518e32ec-a189-5ace-a6dc-841a2e136245', 'A'),
(22, 'b8cd318d-ced4-56d5-ad1d-10ecff64f64b', 'A'),
(22, '6252616f-a023-543e-9845-044ededfea05', 'A'),
(22, '0d0f33f5-6711-5d14-abfe-00a32dc594a2', 'A'),
(22, '99e3978a-5008-588d-93a1-e45e28c81702', 'A'),
(22, 'dd6e2df9-978b-521f-8271-c8b87df4af97', 'A'),
(22, 'cbd0661d-8815-5999-ab79-bd785dcf3f3b', 'A'),
(22, '5734d562-6470-5225-9137-6c4023409340', 'A'),
(22, '344dedc7-32e5-5d5f-a848-7fb592111bf1', 'A'),
(23, 'e58014ec-d954-5bde-8fd9-655529ac50eb', 'A'),
(23, '20fb4035-3feb-58da-a9ab-77df01ce6a8e', 'A'),
(23, '2c27012d-f957-58be-aa9e-7c4cd2355b18', 'A'),
(23, '17f48af4-6fc3-5512-b003-ba76920910ff', 'A'),
(23, '4345e829-8b8a-5149-90b2-810ee247e60a', 'A'),
(23, 'c1e20062-0df0-528a-85fd-03ac52aa9158', 'F'),
(23, 'e87444d3-a2a6-5222-af23-a3292cd4842c', 'A'),
(23, 'dee56da3-9c6b-5091-9d8e-32e95ca908e3', 'P'),
(23, '8f8831d0-40e9-5d41-ada6-aed4cda2a60f', 'P'),
(23, '7a5efba2-1e47-51a1-bff9-7045345a182d', 'A'),
(23, '2b273959-45fa-5c61-b757-359a169f2e1e', 'A'),
(23, '87585a59-cd24-5815-bbb7-9b7fbbc01c16', 'F'),
(23, 'a5ac36f5-693c-55b3-81b1-c1535a355af7', 'A'),
(23, '719c8def-873f-50f2-83c4-7006e03ceb8c', 'A'),
(23, '8b8a4e76-f7f1-5fab-af6d-9a13dbe20dd5', 'A'),
(23, 'd5bb007f-958d-5c73-ac74-2abbcc9606dd', 'A'),
(23, '6a523054-722b-5663-bb5e-7cec43e71400', 'A'),
(23, '186fc2b3-89cd-5b37-b106-78d29bc1a104', 'A'),
(23, '6961e3db-e3cc-5a18-a7ec-47c623cd734a', 'A'),
(23, '518e32ec-a189-5ace-a6dc-841a2e136245', 'A'),
(23, 'b8cd318d-ced4-56d5-ad1d-10ecff64f64b', 'A'),
(23, '6252616f-a023-543e-9845-044ededfea05', 'A'),
(23, '0d0f33f5-6711-5d14-abfe-00a32dc594a2', 'A'),
(23, '99e3978a-5008-588d-93a1-e45e28c81702', 'A'),
(23, 'dd6e2df9-978b-521f-8271-c8b87df4af97', 'A'),
(23, 'cbd0661d-8815-5999-ab79-bd785dcf3f3b', 'A'),
(23, '5734d562-6470-5225-9137-6c4023409340', 'A'),
(23, '344dedc7-32e5-5d5f-a848-7fb592111bf1', 'A'),
(24, 'e58014ec-d954-5bde-8fd9-655529ac50eb', 'L'),
(24, '20fb4035-3feb-58da-a9ab-77df01ce6a8e', 'F'),
(24, '2c27012d-f957-58be-aa9e-7c4cd2355b18', 'A'),
(24, '17f48af4-6fc3-5512-b003-ba76920910ff', 'A'),
(24, '4345e829-8b8a-5149-90b2-810ee247e60a', 'A'),
(24, 'c1e20062-0df0-528a-85fd-03ac52aa9158', 'A'),
(24, 'e87444d3-a2a6-5222-af23-a3292cd4842c', 'A'),
(24, 'dee56da3-9c6b-5091-9d8e-32e95ca908e3', 'A'),
(24, '8f8831d0-40e9-5d41-ada6-aed4cda2a60f', 'P'),
(24, '7a5efba2-1e47-51a1-bff9-7045345a182d', 'A'),
(24, '2b273959-45fa-5c61-b757-359a169f2e1e', 'A'),
(24, '87585a59-cd24-5815-bbb7-9b7fbbc01c16', 'A'),
(24, 'a5ac36f5-693c-55b3-81b1-c1535a355af7', 'F'),
(24, '719c8def-873f-50f2-83c4-7006e03ceb8c', 'F'),
(24, '8b8a4e76-f7f1-5fab-af6d-9a13dbe20dd5', 'A'),
(24, 'd5bb007f-958d-5c73-ac74-2abbcc9606dd', 'A'),
(24, '6a523054-722b-5663-bb5e-7cec43e71400', 'A'),
(24, '186fc2b3-89cd-5b37-b106-78d29bc1a104', 'A'),
(24, '6961e3db-e3cc-5a18-a7ec-47c623cd734a', 'A'),
(24, '518e32ec-a189-5ace-a6dc-841a2e136245', 'A'),
(24, 'b8cd318d-ced4-56d5-ad1d-10ecff64f64b', 'A'),
(24, '6252616f-a023-543e-9845-044ededfea05', 'A'),
(24, '0d0f33f5-6711-5d14-abfe-00a32dc594a2', 'A'),
(24, '99e3978a-5008-588d-93a1-e45e28c81702', 'A'),
(24, 'dd6e2df9-978b-521f-8271-c8b87df4af97', 'A'),
(24, 'cbd0661d-8815-5999-ab79-bd785dcf3f3b', 'F'),
(24, '5734d562-6470-5225-9137-6c4023409340', 'A'),
(24, '344dedc7-32e5-5d5f-a848-7fb592111bf1', 'A'),
(25, 'e58014ec-d954-5bde-8fd9-655529ac50eb', 'A'),
(25, '20fb4035-3feb-58da-a9ab-77df01ce6a8e', 'A'),
(25, '2c27012d-f957-58be-aa9e-7c4cd2355b18', 'A'),
(25, '17f48af4-6fc3-5512-b003-ba76920910ff', 'A'),
(25, '4345e829-8b8a-5149-90b2-810ee247e60a', 'A'),
(25, 'c1e20062-0df0-528a-85fd-03ac52aa9158', 'A'),
(25, 'e87444d3-a2a6-5222-af23-a3292cd4842c', 'A'),
(25, 'dee56da3-9c6b-5091-9d8e-32e95ca908e3', 'F'),
(25, '8f8831d0-40e9-5d41-ada6-aed4cda2a60f', 'A'),
(25, '7a5efba2-1e47-51a1-bff9-7045345a182d', 'A'),
(25, '2b273959-45fa-5c61-b757-359a169f2e1e', 'A'),
(25, '87585a59-cd24-5815-bbb7-9b7fbbc01c16', 'F'),
(25, 'a5ac36f5-693c-55b3-81b1-c1535a355af7', 'A'),
(25, '719c8def-873f-50f2-83c4-7006e03ceb8c', 'A'),
(25, '8b8a4e76-f7f1-5fab-af6d-9a13dbe20dd5', 'P'),
(25, 'd5bb007f-958d-5c73-ac74-2abbcc9606dd', 'A'),
(25, '6a523054-722b-5663-bb5e-7cec43e71400', 'A'),
(25, '186fc2b3-89cd-5b37-b106-78d29bc1a104', 'F'),
(25, '6961e3db-e3cc-5a18-a7ec-47c623cd734a', 'A'),
(25, '518e32ec-a189-5ace-a6dc-841a2e136245', 'A'),
(25, 'b8cd318d-ced4-56d5-ad1d-10ecff64f64b', 'A'),
(25, '6252616f-a023-543e-9845-044ededfea05', 'A'),
(25, '0d0f33f5-6711-5d14-abfe-00a32dc594a2', 'A'),
(25, '99e3978a-5008-588d-93a1-e45e28c81702', 'A'),
(25, 'dd6e2df9-978b-521f-8271-c8b87df4af97', 'A'),
(25, 'cbd0661d-8815-5999-ab79-bd785dcf3f3b', 'F'),
(25, '5734d562-6470-5225-9137-6c4023409340', 'A'),
(25, '344dedc7-32e5-5d5f-a848-7fb592111bf1', 'A'),
(26, 'e58014ec-d954-5bde-8fd9-655529ac50eb', 'A'),
(26, '20fb4035-3feb-58da-a9ab-77df01ce6a8e', 'A'),
(26, '2c27012d-f957-58be-aa9e-7c4cd2355b18', 'R'),
(26, '17f48af4-6fc3-5512-b003-ba76920910ff', 'A'),
(26, '4345e829-8b8a-5149-90b2-810ee247e60a', 'F'),
(26, 'c1e20062-0df0-528a-85fd-03ac52aa9158', 'A'),
(26, 'e87444d3-a2a6-5222-af23-a3292cd4842c', 'A'),
(26, 'dee56da3-9c6b-5091-9d8e-32e95ca908e3', 'A'),
(26, '8f8831d0-40e9-5d41-ada6-aed4cda2a60f', 'A'),
(26, '7a5efba2-1e47-51a1-bff9-7045345a182d', 'A'),
(26, '2b273959-45fa-5c61-b757-359a169f2e1e', 'A'),
(26, '87585a59-cd24-5815-bbb7-9b7fbbc01c16', 'A'),
(26, 'a5ac36f5-693c-55b3-81b1-c1535a355af7', 'F'),
(26, '719c8def-873f-50f2-83c4-7006e03ceb8c', 'A'),
(26, '8b8a4e76-f7f1-5fab-af6d-9a13dbe20dd5', 'F'),
(26, 'd5bb007f-958d-5c73-ac74-2abbcc9606dd', 'A'),
(26, '6a523054-722b-5663-bb5e-7cec43e71400', 'A'),
(26, '186fc2b3-89cd-5b37-b106-78d29bc1a104', 'A'),
(26, '6961e3db-e3cc-5a18-a7ec-47c623cd734a', 'F'),
(26, '518e32ec-a189-5ace-a6dc-841a2e136245', 'A'),
(26, 'b8cd318d-ced4-56d5-ad1d-10ecff64f64b', 'A'),
(26, '6252616f-a023-543e-9845-044ededfea05', 'A'),
(26, '0d0f33f5-6711-5d14-abfe-00a32dc594a2', 'F'),
(26, '99e3978a-5008-588d-93a1-e45e28c81702', 'A'),
(26, 'dd6e2df9-978b-521f-8271-c8b87df4af97', 'A'),
(26, 'cbd0661d-8815-5999-ab79-bd785dcf3f3b', 'A'),
(26, '5734d562-6470-5225-9137-6c4023409340', 'F'),
(26, '344dedc7-32e5-5d5f-a848-7fb592111bf1', 'F'),
(27, 'e58014ec-d954-5bde-8fd9-655529ac50eb', 'A'),
(27, '20fb4035-3feb-58da-a9ab-77df01ce6a8e', 'A'),
(27, '2c27012d-f957-58be-aa9e-7c4cd2355b18', 'L'),
(27, '17f48af4-6fc3-5512-b003-ba76920910ff', 'A'),
(27, '4345e829-8b8a-5149-90b2-810ee247e60a', 'F'),
(27, 'c1e20062-0df0-528a-85fd-03ac52aa9158', 'A'),
(27, 'e87444d3-a2a6-5222-af23-a3292cd4842c', 'A'),
(27, 'dee56da3-9c6b-5091-9d8e-32e95ca908e3', 'A'),
(27, '8f8831d0-40e9-5d41-ada6-aed4cda2a60f', 'A'),
(27, '7a5efba2-1e47-51a1-bff9-7045345a182d', 'A'),
(27, '2b273959-45fa-5c61-b757-359a169f2e1e', 'A'),
(27, '87585a59-cd24-5815-bbb7-9b7fbbc01c16', 'A'),
(27, 'a5ac36f5-693c-55b3-81b1-c1535a355af7', 'A'),
(27, '719c8def-873f-50f2-83c4-7006e03ceb8c', 'A'),
(27, '8b8a4e76-f7f1-5fab-af6d-9a13dbe20dd5', 'A'),
(27, 'd5bb007f-958d-5c73-ac74-2abbcc9606dd', 'F'),
(27, '6a523054-722b-5663-bb5e-7cec43e71400', 'A'),
(27, '186fc2b3-89cd-5b37-b106-78d29bc1a104', 'A'),
(27, '6961e3db-e3cc-5a18-a7ec-47c623cd734a', 'A'),
(27, '518e32ec-a189-5ace-a6dc-841a2e136245', 'A'),
(27, 'b8cd318d-ced4-56d5-ad1d-10ecff64f64b', 'A'),
(27, '6252616f-a023-543e-9845-044ededfea05', 'S'),
(27, '0d0f33f5-6711-5d14-abfe-00a32dc594a2', 'A'),
(27, '99e3978a-5008-588d-93a1-e45e28c81702', 'A'),
(27, 'dd6e2df9-978b-521f-8271-c8b87df4af97', 'A'),
(27, 'cbd0661d-8815-5999-ab79-bd785dcf3f3b', 'A'),
(27, '5734d562-6470-5225-9137-6c4023409340', 'A'),
(27, '344dedc7-32e5-5d5f-a848-7fb592111bf1', 'A'),
(28, 'e58014ec-d954-5bde-8fd9-655529ac50eb', 'A'),
(28, '20fb4035-3feb-58da-a9ab-77df01ce6a8e', 'A'),
(28, '2c27012d-f957-58be-aa9e-7c4cd2355b18', 'A'),
(28, '17f48af4-6fc3-5512-b003-ba76920910ff', 'A'),
(28, '4345e829-8b8a-5149-90b2-810ee247e60a', 'A'),
(28, 'c1e20062-0df0-528a-85fd-03ac52aa9158', 'A'),
(28, 'e87444d3-a2a6-5222-af23-a3292cd4842c', 'A'),
(28, 'dee56da3-9c6b-5091-9d8e-32e95ca908e3', 'A'),
(28, '8f8831d0-40e9-5d41-ada6-aed4cda2a60f', 'F'),
(28, '7a5efba2-1e47-51a1-bff9-7045345a182d', 'A'),
(28, '2b273959-45fa-5c61-b757-359a169f2e1e', 'L'),
(28, '87585a59-cd24-5815-bbb7-9b7fbbc01c16', 'A'),
(28, 'a5ac36f5-693c-55b3-81b1-c1535a355af7', 'A'),
(28, '719c8def-873f-50f2-83c4-7006e03ceb8c', 'A'),
(28, '8b8a4e76-f7f1-5fab-af6d-9a13dbe20dd5', 'A'),
(28, 'd5bb007f-958d-5c73-ac74-2abbcc9606dd', 'F'),
(28, '6a523054-722b-5663-bb5e-7cec43e71400', 'A'),
(28, '186fc2b3-89cd-5b37-b106-78d29bc1a104', 'S'),
(28, '6961e3db-e3cc-5a18-a7ec-47c623cd734a', 'A'),
(28, '518e32ec-a189-5ace-a6dc-841a2e136245', 'A'),
(28, 'b8cd318d-ced4-56d5-ad1d-10ecff64f64b', 'A'),
(28, '6252616f-a023-543e-9845-044ededfea05', 'P'),
(28, '0d0f33f5-6711-5d14-abfe-00a32dc594a2', 'A'),
(28, '99e3978a-5008-588d-93a1-e45e28c81702', 'A'),
(28, 'dd6e2df9-978b-521f-8271-c8b87df4af97', 'A'),
(28, 'cbd0661d-8815-5999-ab79-bd785dcf3f3b', 'P'),
(28, '5734d562-6470-5225-9137-6c4023409340', 'A'),
(28, '344dedc7-32e5-5d5f-a848-7fb592111bf1', 'A'),
(29, 'e58014ec-d954-5bde-8fd9-655529ac50eb', 'A'),
(29, '20fb4035-3feb-58da-a9ab-77df01ce6a8e', 'A'),
(29, '2c27012d-f957-58be-aa9e-7c4cd2355b18', 'F'),
(29, '17f48af4-6fc3-5512-b003-ba76920910ff', 'A'),
(29, '4345e829-8b8a-5149-90b2-810ee247e60a', 'A'),
(29, 'c1e20062-0df0-528a-85fd-03ac52aa9158', 'A'),
(29, 'e87444d3-a2a6-5222-af23-a3292cd4842c', 'A'),
(29, 'dee56da3-9c6b-5091-9d8e-32e95ca908e3', 'F'),
(29, '8f8831d0-40e9-5d41-ada6-aed4cda2a60f', 'P'),
(29, '7a5efba2-1e47-51a1-bff9-7045345a182d', 'F'),
(29, '2b273959-45fa-5c61-b757-359a169f2e1e', 'A'),
(29, '87585a59-cd24-5815-bbb7-9b7fbbc01c16', 'A'),
(29, 'a5ac36f5-693c-55b3-81b1-c1535a355af7', 'A'),
(29, '719c8def-873f-50f2-83c4-7006e03ceb8c', 'A'),
(29, '8b8a4e76-f7f1-5fab-af6d-9a13dbe20dd5', 'P'),
(29, 'd5bb007f-958d-5c73-ac74-2abbcc9606dd', 'A');
insert into asistencia.asistencia (lista_id, persona_id, marca) values (29, '6a523054-722b-5663-bb5e-7cec43e71400', 'A'),
(29, '186fc2b3-89cd-5b37-b106-78d29bc1a104', 'F'),
(29, '6961e3db-e3cc-5a18-a7ec-47c623cd734a', 'A'),
(29, '518e32ec-a189-5ace-a6dc-841a2e136245', 'A'),
(29, 'b8cd318d-ced4-56d5-ad1d-10ecff64f64b', 'F'),
(29, '6252616f-a023-543e-9845-044ededfea05', 'A'),
(29, '0d0f33f5-6711-5d14-abfe-00a32dc594a2', 'A'),
(29, '99e3978a-5008-588d-93a1-e45e28c81702', 'A'),
(29, 'dd6e2df9-978b-521f-8271-c8b87df4af97', 'A'),
(29, 'cbd0661d-8815-5999-ab79-bd785dcf3f3b', 'F'),
(29, '5734d562-6470-5225-9137-6c4023409340', 'A'),
(29, '344dedc7-32e5-5d5f-a848-7fb592111bf1', 'A'),
(30, 'e58014ec-d954-5bde-8fd9-655529ac50eb', 'A'),
(30, '20fb4035-3feb-58da-a9ab-77df01ce6a8e', 'P'),
(30, '2c27012d-f957-58be-aa9e-7c4cd2355b18', 'A'),
(30, '17f48af4-6fc3-5512-b003-ba76920910ff', 'R'),
(30, '4345e829-8b8a-5149-90b2-810ee247e60a', 'F'),
(30, 'c1e20062-0df0-528a-85fd-03ac52aa9158', 'P'),
(30, 'e87444d3-a2a6-5222-af23-a3292cd4842c', 'A'),
(30, 'dee56da3-9c6b-5091-9d8e-32e95ca908e3', 'A'),
(30, '8f8831d0-40e9-5d41-ada6-aed4cda2a60f', 'A'),
(30, '7a5efba2-1e47-51a1-bff9-7045345a182d', 'A'),
(30, '2b273959-45fa-5c61-b757-359a169f2e1e', 'A'),
(30, '87585a59-cd24-5815-bbb7-9b7fbbc01c16', 'A'),
(30, 'a5ac36f5-693c-55b3-81b1-c1535a355af7', 'F'),
(30, '719c8def-873f-50f2-83c4-7006e03ceb8c', 'A'),
(30, '8b8a4e76-f7f1-5fab-af6d-9a13dbe20dd5', 'L'),
(30, 'd5bb007f-958d-5c73-ac74-2abbcc9606dd', 'A'),
(30, '6a523054-722b-5663-bb5e-7cec43e71400', 'A'),
(30, '186fc2b3-89cd-5b37-b106-78d29bc1a104', 'A'),
(30, '6961e3db-e3cc-5a18-a7ec-47c623cd734a', 'A'),
(30, '518e32ec-a189-5ace-a6dc-841a2e136245', 'A'),
(30, 'b8cd318d-ced4-56d5-ad1d-10ecff64f64b', 'A'),
(30, '6252616f-a023-543e-9845-044ededfea05', 'F'),
(30, '0d0f33f5-6711-5d14-abfe-00a32dc594a2', 'F'),
(30, '99e3978a-5008-588d-93a1-e45e28c81702', 'A'),
(30, 'dd6e2df9-978b-521f-8271-c8b87df4af97', 'R'),
(30, 'cbd0661d-8815-5999-ab79-bd785dcf3f3b', 'A'),
(30, '5734d562-6470-5225-9137-6c4023409340', 'A'),
(30, '344dedc7-32e5-5d5f-a848-7fb592111bf1', 'A'),
(31, 'e58014ec-d954-5bde-8fd9-655529ac50eb', 'A'),
(31, '20fb4035-3feb-58da-a9ab-77df01ce6a8e', 'A'),
(31, '2c27012d-f957-58be-aa9e-7c4cd2355b18', 'P'),
(31, '17f48af4-6fc3-5512-b003-ba76920910ff', 'A'),
(31, '4345e829-8b8a-5149-90b2-810ee247e60a', 'A'),
(31, 'c1e20062-0df0-528a-85fd-03ac52aa9158', 'A'),
(31, 'e87444d3-a2a6-5222-af23-a3292cd4842c', 'A'),
(31, 'dee56da3-9c6b-5091-9d8e-32e95ca908e3', 'A'),
(31, '8f8831d0-40e9-5d41-ada6-aed4cda2a60f', 'A'),
(31, '7a5efba2-1e47-51a1-bff9-7045345a182d', 'F'),
(31, '2b273959-45fa-5c61-b757-359a169f2e1e', 'A'),
(31, '87585a59-cd24-5815-bbb7-9b7fbbc01c16', 'P'),
(31, 'a5ac36f5-693c-55b3-81b1-c1535a355af7', 'A'),
(31, '719c8def-873f-50f2-83c4-7006e03ceb8c', 'A'),
(31, '8b8a4e76-f7f1-5fab-af6d-9a13dbe20dd5', 'A'),
(31, 'd5bb007f-958d-5c73-ac74-2abbcc9606dd', 'A'),
(31, '6a523054-722b-5663-bb5e-7cec43e71400', 'A'),
(31, '186fc2b3-89cd-5b37-b106-78d29bc1a104', 'A'),
(31, '6961e3db-e3cc-5a18-a7ec-47c623cd734a', 'A'),
(31, '518e32ec-a189-5ace-a6dc-841a2e136245', 'L'),
(31, 'b8cd318d-ced4-56d5-ad1d-10ecff64f64b', 'A'),
(31, '6252616f-a023-543e-9845-044ededfea05', 'A'),
(31, '0d0f33f5-6711-5d14-abfe-00a32dc594a2', 'A'),
(31, '99e3978a-5008-588d-93a1-e45e28c81702', 'A'),
(31, 'dd6e2df9-978b-521f-8271-c8b87df4af97', 'F'),
(31, 'cbd0661d-8815-5999-ab79-bd785dcf3f3b', 'A'),
(31, '5734d562-6470-5225-9137-6c4023409340', 'A'),
(31, '344dedc7-32e5-5d5f-a848-7fb592111bf1', 'A'),
(32, 'e58014ec-d954-5bde-8fd9-655529ac50eb', 'A'),
(32, '20fb4035-3feb-58da-a9ab-77df01ce6a8e', 'R'),
(32, '2c27012d-f957-58be-aa9e-7c4cd2355b18', 'P'),
(32, '17f48af4-6fc3-5512-b003-ba76920910ff', 'A'),
(32, '4345e829-8b8a-5149-90b2-810ee247e60a', 'A'),
(32, 'c1e20062-0df0-528a-85fd-03ac52aa9158', 'A'),
(32, 'e87444d3-a2a6-5222-af23-a3292cd4842c', 'F'),
(32, 'dee56da3-9c6b-5091-9d8e-32e95ca908e3', 'A'),
(32, '8f8831d0-40e9-5d41-ada6-aed4cda2a60f', 'A'),
(32, '7a5efba2-1e47-51a1-bff9-7045345a182d', 'A'),
(32, '2b273959-45fa-5c61-b757-359a169f2e1e', 'F'),
(32, '87585a59-cd24-5815-bbb7-9b7fbbc01c16', 'R'),
(32, 'a5ac36f5-693c-55b3-81b1-c1535a355af7', 'A'),
(32, '719c8def-873f-50f2-83c4-7006e03ceb8c', 'A'),
(32, '8b8a4e76-f7f1-5fab-af6d-9a13dbe20dd5', 'A'),
(32, 'd5bb007f-958d-5c73-ac74-2abbcc9606dd', 'A'),
(32, '6a523054-722b-5663-bb5e-7cec43e71400', 'A'),
(32, '186fc2b3-89cd-5b37-b106-78d29bc1a104', 'F'),
(32, '6961e3db-e3cc-5a18-a7ec-47c623cd734a', 'A'),
(32, '518e32ec-a189-5ace-a6dc-841a2e136245', 'A'),
(32, 'b8cd318d-ced4-56d5-ad1d-10ecff64f64b', 'A'),
(32, '6252616f-a023-543e-9845-044ededfea05', 'P'),
(32, '0d0f33f5-6711-5d14-abfe-00a32dc594a2', 'P'),
(32, '99e3978a-5008-588d-93a1-e45e28c81702', 'S'),
(32, 'dd6e2df9-978b-521f-8271-c8b87df4af97', 'P'),
(32, 'cbd0661d-8815-5999-ab79-bd785dcf3f3b', 'A'),
(32, '5734d562-6470-5225-9137-6c4023409340', 'A'),
(32, '344dedc7-32e5-5d5f-a848-7fb592111bf1', 'P'),
(33, 'e58014ec-d954-5bde-8fd9-655529ac50eb', 'A'),
(33, '20fb4035-3feb-58da-a9ab-77df01ce6a8e', 'A'),
(33, '2c27012d-f957-58be-aa9e-7c4cd2355b18', 'A'),
(33, '17f48af4-6fc3-5512-b003-ba76920910ff', 'A'),
(33, '4345e829-8b8a-5149-90b2-810ee247e60a', 'A'),
(33, 'c1e20062-0df0-528a-85fd-03ac52aa9158', 'A'),
(33, 'e87444d3-a2a6-5222-af23-a3292cd4842c', 'A'),
(33, 'dee56da3-9c6b-5091-9d8e-32e95ca908e3', 'F'),
(33, '8f8831d0-40e9-5d41-ada6-aed4cda2a60f', 'A'),
(33, '7a5efba2-1e47-51a1-bff9-7045345a182d', 'A'),
(33, '2b273959-45fa-5c61-b757-359a169f2e1e', 'A'),
(33, '87585a59-cd24-5815-bbb7-9b7fbbc01c16', 'F'),
(33, 'a5ac36f5-693c-55b3-81b1-c1535a355af7', 'A'),
(33, '719c8def-873f-50f2-83c4-7006e03ceb8c', 'S'),
(33, '8b8a4e76-f7f1-5fab-af6d-9a13dbe20dd5', 'A'),
(33, 'd5bb007f-958d-5c73-ac74-2abbcc9606dd', 'L'),
(33, '6a523054-722b-5663-bb5e-7cec43e71400', 'A'),
(33, '186fc2b3-89cd-5b37-b106-78d29bc1a104', 'A'),
(33, '6961e3db-e3cc-5a18-a7ec-47c623cd734a', 'A'),
(33, '518e32ec-a189-5ace-a6dc-841a2e136245', 'A'),
(33, 'b8cd318d-ced4-56d5-ad1d-10ecff64f64b', 'A'),
(33, '6252616f-a023-543e-9845-044ededfea05', 'P'),
(33, '0d0f33f5-6711-5d14-abfe-00a32dc594a2', 'A'),
(33, '99e3978a-5008-588d-93a1-e45e28c81702', 'A'),
(33, 'dd6e2df9-978b-521f-8271-c8b87df4af97', 'A'),
(33, 'cbd0661d-8815-5999-ab79-bd785dcf3f3b', 'A'),
(33, '5734d562-6470-5225-9137-6c4023409340', 'A'),
(33, '344dedc7-32e5-5d5f-a848-7fb592111bf1', 'A'),
(34, 'e58014ec-d954-5bde-8fd9-655529ac50eb', 'L'),
(34, '20fb4035-3feb-58da-a9ab-77df01ce6a8e', 'A'),
(34, '2c27012d-f957-58be-aa9e-7c4cd2355b18', 'A'),
(34, '17f48af4-6fc3-5512-b003-ba76920910ff', 'P'),
(34, '4345e829-8b8a-5149-90b2-810ee247e60a', 'F'),
(34, 'c1e20062-0df0-528a-85fd-03ac52aa9158', 'A'),
(34, 'e87444d3-a2a6-5222-af23-a3292cd4842c', 'A'),
(34, 'dee56da3-9c6b-5091-9d8e-32e95ca908e3', 'A'),
(34, '8f8831d0-40e9-5d41-ada6-aed4cda2a60f', 'A'),
(34, '7a5efba2-1e47-51a1-bff9-7045345a182d', 'A'),
(34, '2b273959-45fa-5c61-b757-359a169f2e1e', 'P'),
(34, '87585a59-cd24-5815-bbb7-9b7fbbc01c16', 'A'),
(34, 'a5ac36f5-693c-55b3-81b1-c1535a355af7', 'A'),
(34, '719c8def-873f-50f2-83c4-7006e03ceb8c', 'P'),
(34, '8b8a4e76-f7f1-5fab-af6d-9a13dbe20dd5', 'P'),
(34, 'd5bb007f-958d-5c73-ac74-2abbcc9606dd', 'F'),
(34, '6a523054-722b-5663-bb5e-7cec43e71400', 'A'),
(34, '186fc2b3-89cd-5b37-b106-78d29bc1a104', 'A'),
(34, '6961e3db-e3cc-5a18-a7ec-47c623cd734a', 'A'),
(34, '518e32ec-a189-5ace-a6dc-841a2e136245', 'A'),
(34, 'b8cd318d-ced4-56d5-ad1d-10ecff64f64b', 'L'),
(34, '6252616f-a023-543e-9845-044ededfea05', 'A'),
(34, '0d0f33f5-6711-5d14-abfe-00a32dc594a2', 'A'),
(34, '99e3978a-5008-588d-93a1-e45e28c81702', 'A'),
(34, 'dd6e2df9-978b-521f-8271-c8b87df4af97', 'A'),
(34, 'cbd0661d-8815-5999-ab79-bd785dcf3f3b', 'A'),
(34, '5734d562-6470-5225-9137-6c4023409340', 'A'),
(34, '344dedc7-32e5-5d5f-a848-7fb592111bf1', 'A'),
(35, 'e58014ec-d954-5bde-8fd9-655529ac50eb', 'A'),
(35, '20fb4035-3feb-58da-a9ab-77df01ce6a8e', 'A'),
(35, '2c27012d-f957-58be-aa9e-7c4cd2355b18', 'A'),
(35, '17f48af4-6fc3-5512-b003-ba76920910ff', 'A'),
(35, '4345e829-8b8a-5149-90b2-810ee247e60a', 'A'),
(35, 'c1e20062-0df0-528a-85fd-03ac52aa9158', 'A'),
(35, 'e87444d3-a2a6-5222-af23-a3292cd4842c', 'F'),
(35, 'dee56da3-9c6b-5091-9d8e-32e95ca908e3', 'F'),
(35, '8f8831d0-40e9-5d41-ada6-aed4cda2a60f', 'A'),
(35, '7a5efba2-1e47-51a1-bff9-7045345a182d', 'A'),
(35, '2b273959-45fa-5c61-b757-359a169f2e1e', 'A'),
(35, '87585a59-cd24-5815-bbb7-9b7fbbc01c16', 'A'),
(35, 'a5ac36f5-693c-55b3-81b1-c1535a355af7', 'A'),
(35, '719c8def-873f-50f2-83c4-7006e03ceb8c', 'A'),
(35, '8b8a4e76-f7f1-5fab-af6d-9a13dbe20dd5', 'A'),
(35, 'd5bb007f-958d-5c73-ac74-2abbcc9606dd', 'L'),
(35, '6a523054-722b-5663-bb5e-7cec43e71400', 'L'),
(35, '186fc2b3-89cd-5b37-b106-78d29bc1a104', 'A'),
(35, '6961e3db-e3cc-5a18-a7ec-47c623cd734a', 'A'),
(35, '518e32ec-a189-5ace-a6dc-841a2e136245', 'F'),
(35, 'b8cd318d-ced4-56d5-ad1d-10ecff64f64b', 'A'),
(35, '6252616f-a023-543e-9845-044ededfea05', 'A'),
(35, '0d0f33f5-6711-5d14-abfe-00a32dc594a2', 'A'),
(35, '99e3978a-5008-588d-93a1-e45e28c81702', 'A'),
(35, 'dd6e2df9-978b-521f-8271-c8b87df4af97', 'A'),
(35, 'cbd0661d-8815-5999-ab79-bd785dcf3f3b', 'P'),
(35, '5734d562-6470-5225-9137-6c4023409340', 'A'),
(35, '344dedc7-32e5-5d5f-a848-7fb592111bf1', 'A'),
(36, 'e58014ec-d954-5bde-8fd9-655529ac50eb', 'A'),
(36, '20fb4035-3feb-58da-a9ab-77df01ce6a8e', 'P'),
(36, '2c27012d-f957-58be-aa9e-7c4cd2355b18', 'A'),
(36, '17f48af4-6fc3-5512-b003-ba76920910ff', 'A'),
(36, '4345e829-8b8a-5149-90b2-810ee247e60a', 'A'),
(36, 'c1e20062-0df0-528a-85fd-03ac52aa9158', 'A'),
(36, 'e87444d3-a2a6-5222-af23-a3292cd4842c', 'A'),
(36, 'dee56da3-9c6b-5091-9d8e-32e95ca908e3', 'A'),
(36, '8f8831d0-40e9-5d41-ada6-aed4cda2a60f', 'A'),
(36, '7a5efba2-1e47-51a1-bff9-7045345a182d', 'A'),
(36, '2b273959-45fa-5c61-b757-359a169f2e1e', 'F'),
(36, '87585a59-cd24-5815-bbb7-9b7fbbc01c16', 'F'),
(36, 'a5ac36f5-693c-55b3-81b1-c1535a355af7', 'A'),
(36, '719c8def-873f-50f2-83c4-7006e03ceb8c', 'A'),
(36, '8b8a4e76-f7f1-5fab-af6d-9a13dbe20dd5', 'R'),
(36, 'd5bb007f-958d-5c73-ac74-2abbcc9606dd', 'F'),
(36, '6a523054-722b-5663-bb5e-7cec43e71400', 'A'),
(36, '186fc2b3-89cd-5b37-b106-78d29bc1a104', 'P'),
(36, '6961e3db-e3cc-5a18-a7ec-47c623cd734a', 'A'),
(36, '518e32ec-a189-5ace-a6dc-841a2e136245', 'A'),
(36, 'b8cd318d-ced4-56d5-ad1d-10ecff64f64b', 'A'),
(36, '6252616f-a023-543e-9845-044ededfea05', 'A'),
(36, '0d0f33f5-6711-5d14-abfe-00a32dc594a2', 'A'),
(36, '99e3978a-5008-588d-93a1-e45e28c81702', 'A'),
(36, 'dd6e2df9-978b-521f-8271-c8b87df4af97', 'A'),
(36, 'cbd0661d-8815-5999-ab79-bd785dcf3f3b', 'A'),
(36, '5734d562-6470-5225-9137-6c4023409340', 'A'),
(36, '344dedc7-32e5-5d5f-a848-7fb592111bf1', 'A'),
(37, 'e58014ec-d954-5bde-8fd9-655529ac50eb', 'A'),
(37, '20fb4035-3feb-58da-a9ab-77df01ce6a8e', 'P'),
(37, '2c27012d-f957-58be-aa9e-7c4cd2355b18', 'A'),
(37, '17f48af4-6fc3-5512-b003-ba76920910ff', 'A'),
(37, '4345e829-8b8a-5149-90b2-810ee247e60a', 'A'),
(37, 'c1e20062-0df0-528a-85fd-03ac52aa9158', 'R'),
(37, 'e87444d3-a2a6-5222-af23-a3292cd4842c', 'P'),
(37, 'dee56da3-9c6b-5091-9d8e-32e95ca908e3', 'A'),
(37, '8f8831d0-40e9-5d41-ada6-aed4cda2a60f', 'A'),
(37, '7a5efba2-1e47-51a1-bff9-7045345a182d', 'A'),
(37, '2b273959-45fa-5c61-b757-359a169f2e1e', 'A'),
(37, '87585a59-cd24-5815-bbb7-9b7fbbc01c16', 'A'),
(37, 'a5ac36f5-693c-55b3-81b1-c1535a355af7', 'A'),
(37, '719c8def-873f-50f2-83c4-7006e03ceb8c', 'P'),
(37, '8b8a4e76-f7f1-5fab-af6d-9a13dbe20dd5', 'A'),
(37, 'd5bb007f-958d-5c73-ac74-2abbcc9606dd', 'A'),
(37, '6a523054-722b-5663-bb5e-7cec43e71400', 'A'),
(37, '186fc2b3-89cd-5b37-b106-78d29bc1a104', 'A'),
(37, '6961e3db-e3cc-5a18-a7ec-47c623cd734a', 'A'),
(37, '518e32ec-a189-5ace-a6dc-841a2e136245', 'A'),
(37, 'b8cd318d-ced4-56d5-ad1d-10ecff64f64b', 'A'),
(37, '6252616f-a023-543e-9845-044ededfea05', 'A'),
(37, '0d0f33f5-6711-5d14-abfe-00a32dc594a2', 'A'),
(37, '99e3978a-5008-588d-93a1-e45e28c81702', 'A'),
(37, 'dd6e2df9-978b-521f-8271-c8b87df4af97', 'R'),
(37, 'cbd0661d-8815-5999-ab79-bd785dcf3f3b', 'A'),
(37, '5734d562-6470-5225-9137-6c4023409340', 'A'),
(37, '344dedc7-32e5-5d5f-a848-7fb592111bf1', 'A'),
(38, 'e58014ec-d954-5bde-8fd9-655529ac50eb', 'A'),
(38, '20fb4035-3feb-58da-a9ab-77df01ce6a8e', 'F'),
(38, '2c27012d-f957-58be-aa9e-7c4cd2355b18', 'A'),
(38, '17f48af4-6fc3-5512-b003-ba76920910ff', 'A'),
(38, '4345e829-8b8a-5149-90b2-810ee247e60a', 'A'),
(38, 'c1e20062-0df0-528a-85fd-03ac52aa9158', 'A'),
(38, 'e87444d3-a2a6-5222-af23-a3292cd4842c', 'A'),
(38, 'dee56da3-9c6b-5091-9d8e-32e95ca908e3', 'A'),
(38, '8f8831d0-40e9-5d41-ada6-aed4cda2a60f', 'A'),
(38, '7a5efba2-1e47-51a1-bff9-7045345a182d', 'A'),
(38, '2b273959-45fa-5c61-b757-359a169f2e1e', 'A'),
(38, '87585a59-cd24-5815-bbb7-9b7fbbc01c16', 'R'),
(38, 'a5ac36f5-693c-55b3-81b1-c1535a355af7', 'A'),
(38, '719c8def-873f-50f2-83c4-7006e03ceb8c', 'A'),
(38, '8b8a4e76-f7f1-5fab-af6d-9a13dbe20dd5', 'A'),
(38, 'd5bb007f-958d-5c73-ac74-2abbcc9606dd', 'A'),
(38, '6a523054-722b-5663-bb5e-7cec43e71400', 'A'),
(38, '186fc2b3-89cd-5b37-b106-78d29bc1a104', 'A'),
(38, '6961e3db-e3cc-5a18-a7ec-47c623cd734a', 'F'),
(38, '518e32ec-a189-5ace-a6dc-841a2e136245', 'F'),
(38, 'b8cd318d-ced4-56d5-ad1d-10ecff64f64b', 'A'),
(38, '6252616f-a023-543e-9845-044ededfea05', 'A'),
(38, '0d0f33f5-6711-5d14-abfe-00a32dc594a2', 'A'),
(38, '99e3978a-5008-588d-93a1-e45e28c81702', 'A'),
(38, 'dd6e2df9-978b-521f-8271-c8b87df4af97', 'A'),
(38, 'cbd0661d-8815-5999-ab79-bd785dcf3f3b', 'A'),
(38, '5734d562-6470-5225-9137-6c4023409340', 'A'),
(38, '344dedc7-32e5-5d5f-a848-7fb592111bf1', 'A'),
(39, 'e58014ec-d954-5bde-8fd9-655529ac50eb', 'A'),
(39, '20fb4035-3feb-58da-a9ab-77df01ce6a8e', 'A'),
(39, '2c27012d-f957-58be-aa9e-7c4cd2355b18', 'A'),
(39, '17f48af4-6fc3-5512-b003-ba76920910ff', 'F'),
(39, '4345e829-8b8a-5149-90b2-810ee247e60a', 'A'),
(39, 'c1e20062-0df0-528a-85fd-03ac52aa9158', 'A'),
(39, 'e87444d3-a2a6-5222-af23-a3292cd4842c', 'P'),
(39, 'dee56da3-9c6b-5091-9d8e-32e95ca908e3', 'A'),
(39, '8f8831d0-40e9-5d41-ada6-aed4cda2a60f', 'P'),
(39, '7a5efba2-1e47-51a1-bff9-7045345a182d', 'L'),
(39, '2b273959-45fa-5c61-b757-359a169f2e1e', 'A'),
(39, '87585a59-cd24-5815-bbb7-9b7fbbc01c16', 'A'),
(39, 'a5ac36f5-693c-55b3-81b1-c1535a355af7', 'F'),
(39, '719c8def-873f-50f2-83c4-7006e03ceb8c', 'A'),
(39, '8b8a4e76-f7f1-5fab-af6d-9a13dbe20dd5', 'A'),
(39, 'd5bb007f-958d-5c73-ac74-2abbcc9606dd', 'A'),
(39, '6a523054-722b-5663-bb5e-7cec43e71400', 'A'),
(39, '186fc2b3-89cd-5b37-b106-78d29bc1a104', 'A'),
(39, '6961e3db-e3cc-5a18-a7ec-47c623cd734a', 'A'),
(39, '518e32ec-a189-5ace-a6dc-841a2e136245', 'A'),
(39, 'b8cd318d-ced4-56d5-ad1d-10ecff64f64b', 'A'),
(39, '6252616f-a023-543e-9845-044ededfea05', 'P'),
(39, '0d0f33f5-6711-5d14-abfe-00a32dc594a2', 'A'),
(39, '99e3978a-5008-588d-93a1-e45e28c81702', 'A'),
(39, 'dd6e2df9-978b-521f-8271-c8b87df4af97', 'A'),
(39, 'cbd0661d-8815-5999-ab79-bd785dcf3f3b', 'P'),
(39, '5734d562-6470-5225-9137-6c4023409340', 'A'),
(39, '344dedc7-32e5-5d5f-a848-7fb592111bf1', 'A'),
(40, 'e58014ec-d954-5bde-8fd9-655529ac50eb', 'F'),
(40, '20fb4035-3feb-58da-a9ab-77df01ce6a8e', 'A'),
(40, '2c27012d-f957-58be-aa9e-7c4cd2355b18', 'A'),
(40, '17f48af4-6fc3-5512-b003-ba76920910ff', 'A'),
(40, '4345e829-8b8a-5149-90b2-810ee247e60a', 'A'),
(40, 'c1e20062-0df0-528a-85fd-03ac52aa9158', 'A'),
(40, 'e87444d3-a2a6-5222-af23-a3292cd4842c', 'A'),
(40, 'dee56da3-9c6b-5091-9d8e-32e95ca908e3', 'A'),
(40, '8f8831d0-40e9-5d41-ada6-aed4cda2a60f', 'A'),
(40, '7a5efba2-1e47-51a1-bff9-7045345a182d', 'P'),
(40, '2b273959-45fa-5c61-b757-359a169f2e1e', 'A'),
(40, '87585a59-cd24-5815-bbb7-9b7fbbc01c16', 'A'),
(40, 'a5ac36f5-693c-55b3-81b1-c1535a355af7', 'A'),
(40, '719c8def-873f-50f2-83c4-7006e03ceb8c', 'A'),
(40, '8b8a4e76-f7f1-5fab-af6d-9a13dbe20dd5', 'A'),
(40, 'd5bb007f-958d-5c73-ac74-2abbcc9606dd', 'F'),
(40, '6a523054-722b-5663-bb5e-7cec43e71400', 'A'),
(40, '186fc2b3-89cd-5b37-b106-78d29bc1a104', 'A');

-- Cierre y envío de listas (primero se cargaron las marcas)
update asistencia.lista set estado = 'enviada', cerrada_en = '2026-01-08'::timestamptz + interval '20 hours', enviada_en = '2026-01-08'::timestamptz + interval '30 hours' where id = 1;
update asistencia.lista set estado = 'enviada', cerrada_en = '2026-01-15'::timestamptz + interval '20 hours', enviada_en = '2026-01-15'::timestamptz + interval '30 hours' where id = 2;
update asistencia.lista set estado = 'enviada', cerrada_en = '2026-01-22'::timestamptz + interval '20 hours', enviada_en = '2026-01-22'::timestamptz + interval '30 hours' where id = 3;
update asistencia.lista set estado = 'enviada', cerrada_en = '2026-01-29'::timestamptz + interval '20 hours', enviada_en = '2026-01-29'::timestamptz + interval '30 hours' where id = 4;
update asistencia.lista set estado = 'enviada', cerrada_en = '2026-02-05'::timestamptz + interval '20 hours', enviada_en = '2026-02-05'::timestamptz + interval '30 hours' where id = 5;
update asistencia.lista set estado = 'enviada', cerrada_en = '2026-02-12'::timestamptz + interval '20 hours', enviada_en = '2026-02-12'::timestamptz + interval '30 hours' where id = 6;
update asistencia.lista set estado = 'enviada', cerrada_en = '2026-02-19'::timestamptz + interval '20 hours', enviada_en = '2026-02-19'::timestamptz + interval '30 hours' where id = 7;
update asistencia.lista set estado = 'enviada', cerrada_en = '2026-02-26'::timestamptz + interval '20 hours', enviada_en = '2026-02-26'::timestamptz + interval '30 hours' where id = 8;
update asistencia.lista set estado = 'enviada', cerrada_en = '2026-03-05'::timestamptz + interval '20 hours', enviada_en = '2026-03-05'::timestamptz + interval '30 hours' where id = 9;
update asistencia.lista set estado = 'enviada', cerrada_en = '2026-03-12'::timestamptz + interval '20 hours', enviada_en = '2026-03-12'::timestamptz + interval '30 hours' where id = 10;
update asistencia.lista set estado = 'enviada', cerrada_en = '2026-03-19'::timestamptz + interval '20 hours', enviada_en = '2026-03-19'::timestamptz + interval '30 hours' where id = 11;
update asistencia.lista set estado = 'enviada', cerrada_en = '2026-03-26'::timestamptz + interval '20 hours', enviada_en = '2026-03-26'::timestamptz + interval '30 hours' where id = 12;
update asistencia.lista set estado = 'enviada', cerrada_en = '2026-04-02'::timestamptz + interval '20 hours', enviada_en = '2026-04-02'::timestamptz + interval '30 hours' where id = 13;
update asistencia.lista set estado = 'enviada', cerrada_en = '2026-04-09'::timestamptz + interval '20 hours', enviada_en = '2026-04-09'::timestamptz + interval '30 hours' where id = 14;
update asistencia.lista set estado = 'enviada', cerrada_en = '2026-04-16'::timestamptz + interval '20 hours', enviada_en = '2026-04-16'::timestamptz + interval '30 hours' where id = 15;
update asistencia.lista set estado = 'enviada', cerrada_en = '2026-04-23'::timestamptz + interval '20 hours', enviada_en = '2026-04-23'::timestamptz + interval '30 hours' where id = 16;
update asistencia.lista set estado = 'enviada', cerrada_en = '2026-04-30'::timestamptz + interval '20 hours', enviada_en = '2026-04-30'::timestamptz + interval '30 hours' where id = 17;
update asistencia.lista set estado = 'enviada', cerrada_en = '2026-05-07'::timestamptz + interval '20 hours', enviada_en = '2026-05-07'::timestamptz + interval '30 hours' where id = 18;
update asistencia.lista set estado = 'enviada', cerrada_en = '2026-05-14'::timestamptz + interval '20 hours', enviada_en = '2026-05-14'::timestamptz + interval '30 hours' where id = 19;
update asistencia.lista set estado = 'enviada', cerrada_en = '2026-05-21'::timestamptz + interval '20 hours', enviada_en = '2026-05-21'::timestamptz + interval '30 hours' where id = 20;
update asistencia.lista set estado = 'enviada', cerrada_en = '2026-05-28'::timestamptz + interval '20 hours', enviada_en = '2026-05-28'::timestamptz + interval '30 hours' where id = 21;
update asistencia.lista set estado = 'enviada', cerrada_en = '2026-06-04'::timestamptz + interval '20 hours', enviada_en = '2026-06-04'::timestamptz + interval '30 hours' where id = 22;
update asistencia.lista set estado = 'enviada', cerrada_en = '2026-06-11'::timestamptz + interval '20 hours', enviada_en = '2026-06-11'::timestamptz + interval '30 hours' where id = 23;
update asistencia.lista set estado = 'enviada', cerrada_en = '2026-06-18'::timestamptz + interval '20 hours', enviada_en = '2026-06-18'::timestamptz + interval '30 hours' where id = 24;
update asistencia.lista set estado = 'enviada', cerrada_en = '2026-06-25'::timestamptz + interval '20 hours', enviada_en = '2026-06-25'::timestamptz + interval '30 hours' where id = 25;
update asistencia.lista set estado = 'enviada', cerrada_en = '2026-07-02'::timestamptz + interval '20 hours', enviada_en = '2026-07-02'::timestamptz + interval '30 hours' where id = 26;
update asistencia.lista set estado = 'enviada', cerrada_en = '2026-07-09'::timestamptz + interval '20 hours', enviada_en = '2026-07-09'::timestamptz + interval '30 hours' where id = 27;
update asistencia.lista set estado = 'enviada', cerrada_en = '2026-07-16'::timestamptz + interval '20 hours', enviada_en = '2026-07-16'::timestamptz + interval '30 hours' where id = 28;
update asistencia.lista set estado = 'enviada', cerrada_en = '2026-07-23'::timestamptz + interval '20 hours', enviada_en = '2026-07-23'::timestamptz + interval '30 hours' where id = 29;
update asistencia.lista set estado = 'enviada', cerrada_en = '2026-07-30'::timestamptz + interval '20 hours', enviada_en = '2026-07-30'::timestamptz + interval '30 hours' where id = 30;
update asistencia.lista set estado = 'enviada', cerrada_en = '2026-08-06'::timestamptz + interval '20 hours', enviada_en = '2026-08-06'::timestamptz + interval '30 hours' where id = 31;
update asistencia.lista set estado = 'enviada', cerrada_en = '2026-08-13'::timestamptz + interval '20 hours', enviada_en = '2026-08-13'::timestamptz + interval '30 hours' where id = 32;
update asistencia.lista set estado = 'enviada', cerrada_en = '2026-08-20'::timestamptz + interval '20 hours', enviada_en = '2026-08-20'::timestamptz + interval '30 hours' where id = 33;
update asistencia.lista set estado = 'enviada', cerrada_en = '2026-08-27'::timestamptz + interval '20 hours', enviada_en = '2026-08-27'::timestamptz + interval '30 hours' where id = 34;
update asistencia.lista set estado = 'enviada', cerrada_en = '2026-09-03'::timestamptz + interval '20 hours', enviada_en = '2026-09-03'::timestamptz + interval '30 hours' where id = 35;
update asistencia.lista set estado = 'enviada', cerrada_en = '2026-09-10'::timestamptz + interval '20 hours', enviada_en = '2026-09-10'::timestamptz + interval '30 hours' where id = 36;
update asistencia.lista set estado = 'enviada', cerrada_en = '2026-09-17'::timestamptz + interval '20 hours', enviada_en = '2026-09-17'::timestamptz + interval '30 hours' where id = 37;
update asistencia.lista set estado = 'cerrada', cerrada_en = '2026-10-29'::timestamptz + interval '22 hours' where id = 38;
update asistencia.lista set estado = 'cerrada', cerrada_en = '2026-11-05'::timestamptz + interval '22 hours' where id = 39;
select setval(pg_get_serial_sequence('asistencia.lista','id'), 40);

-- Actas y acuerdos
insert into secretaria.acta (id, tipo_sesion_codigo, numero, anio, fecha, lista_id, quorum_ok) overriding system value values (1, 'RO', 1, 2026, '2026-01-15', 1, true) on conflict do nothing;
insert into secretaria.acta (id, tipo_sesion_codigo, numero, anio, fecha, lista_id, quorum_ok) overriding system value values (2, 'RO', 2, 2026, '2026-04-09', 2, true) on conflict do nothing;
insert into secretaria.acta (id, tipo_sesion_codigo, numero, anio, fecha, lista_id, quorum_ok) overriding system value values (3, 'REO', 1, 2026, '2026-07-02', 1, true) on conflict do nothing;
insert into secretaria.acta (id, tipo_sesion_codigo, numero, anio, fecha, lista_id, quorum_ok) overriding system value values (4, 'RO', 3, 2026, '2026-10-08', 3, true) on conflict do nothing;
update secretaria.acta set aprobada_en_acta_id = 2 where id = 1;
update secretaria.acta set aprobada_en_acta_id = 3 where id = 2;
update secretaria.acta set aprobada_en_acta_id = 4 where id = 3;
insert into secretaria.acuerdo (id, acta_id, numero, texto, votos_favor, votos_contra, abstenciones, resultado, monto, plazo, estado) overriding system value values (1, 1, 1, 'Aprobar el presupuesto anual 2026 presentado por Tesorería.', 8, 0, 1, 'aprobado', 12000000, '2026-03-31', 'cumplido') on conflict do nothing;
insert into secretaria.acuerdo (id, acta_id, numero, texto, votos_favor, votos_contra, abstenciones, resultado, monto, plazo, estado) overriding system value values (2, 1, 2, 'Adquirir equipos de protección personal para la guardia nocturna.', 7, 1, 1, 'aprobado', 850000, '2026-06-30', 'en_curso') on conflict do nothing;
insert into secretaria.acuerdo (id, acta_id, numero, texto, votos_favor, votos_contra, abstenciones, resultado, monto, plazo, estado) overriding system value values (3, 2, 1, 'Autorizar la campaña económica 2026.', 9, 0, 0, 'aprobado', null, null, 'cumplido') on conflict do nothing;
insert into secretaria.acuerdo (id, acta_id, numero, texto, votos_favor, votos_contra, abstenciones, resultado, monto, plazo, estado) overriding system value values (4, 3, 1, 'Contratar mantención preventiva de la unidad M-21.', 5, 0, 0, 'aprobado', 320000, '2026-08-15', 'pendiente') on conflict do nothing;
select setval(pg_get_serial_sequence('secretaria.acuerdo','id'), (select max(id) from secretaria.acuerdo));
select setval(pg_get_serial_sequence('secretaria.acta','id'), (select max(id) from secretaria.acta));
-- Cargos 2026
insert into personal.cargo_periodo (persona_id, cargo_id, desde, acta_id) select 'e58014ec-d954-5bde-8fd9-655529ac50eb', id, '2026-01-15', 1 from personal.cargo where codigo = 'DIR';
insert into personal.cargo_periodo (persona_id, cargo_id, desde, acta_id) select '20fb4035-3feb-58da-a9ab-77df01ce6a8e', id, '2026-01-15', 1 from personal.cargo where codigo = 'SEC';
insert into personal.cargo_periodo (persona_id, cargo_id, desde, acta_id) select '2c27012d-f957-58be-aa9e-7c4cd2355b18', id, '2026-01-15', 1 from personal.cargo where codigo = 'PROSEC';
insert into personal.cargo_periodo (persona_id, cargo_id, desde, acta_id) select '17f48af4-6fc3-5512-b003-ba76920910ff', id, '2026-01-15', 1 from personal.cargo where codigo = 'TES';
insert into personal.cargo_periodo (persona_id, cargo_id, desde, acta_id) select '4345e829-8b8a-5149-90b2-810ee247e60a', id, '2026-01-15', 1 from personal.cargo where codigo = 'PROTES';
insert into personal.cargo_periodo (persona_id, cargo_id, desde, acta_id) select 'c1e20062-0df0-528a-85fd-03ac52aa9158', id, '2026-01-15', 1 from personal.cargo where codigo = 'CAP';
insert into personal.cargo_periodo (persona_id, cargo_id, desde, acta_id) select 'e87444d3-a2a6-5222-af23-a3292cd4842c', id, '2026-01-15', 1 from personal.cargo where codigo = 'T1';
insert into personal.cargo_periodo (persona_id, cargo_id, desde, acta_id) select 'dee56da3-9c6b-5091-9d8e-32e95ca908e3', id, '2026-01-15', 1 from personal.cargo where codigo = 'T2';
insert into personal.cargo_periodo (persona_id, cargo_id, desde, acta_id) select '8f8831d0-40e9-5d41-ada6-aed4cda2a60f', id, '2026-01-15', 1 from personal.cargo where codigo = 'T3';
insert into personal.cargo_periodo (persona_id, cargo_id, desde, acta_id) select '7a5efba2-1e47-51a1-bff9-7045345a182d', id, '2026-01-15', 1 from personal.cargo where codigo = 'AYU';
insert into personal.cargo_periodo (persona_id, cargo_id, desde, acta_id) select '2b273959-45fa-5c61-b757-359a169f2e1e', id, '2026-01-15', 1 from personal.cargo where codigo = 'CONS';

-- Cursos
insert into personal.curso (id, nombre, institucion, nivel, horas) overriding system value values (1, 'Curso Básico de Bombero', 'Academia Nacional de Bomberos', 'Básico', 40);
insert into personal.curso (id, nombre, institucion, nivel, horas) overriding system value values (2, 'Curso Intermedio', 'Academia Nacional de Bomberos', 'Intermedio', 40);
insert into personal.curso (id, nombre, institucion, nivel, horas) overriding system value values (3, 'Curso Avanzado', 'Academia Nacional de Bomberos', 'Avanzado', 40);
insert into personal.curso (id, nombre, institucion, nivel, horas) overriding system value values (4, 'Materiales Peligrosos', 'Academia Nacional de Bomberos', 'Hazmat', 40);
insert into personal.curso (id, nombre, institucion, nivel, horas) overriding system value values (5, 'Rescate Vehicular', 'Academia Nacional de Bomberos', 'Especialidad', 40);
insert into personal.persona_curso (persona_id, curso_id, fecha_aprobacion, vigente_hasta) values ('e58014ec-d954-5bde-8fd9-655529ac50eb', 3, '2024-04-30', '2030-12-31');
insert into personal.persona_curso (persona_id, curso_id, fecha_aprobacion, vigente_hasta) values ('20fb4035-3feb-58da-a9ab-77df01ce6a8e', 2, '2024-03-21', '2030-12-31');
insert into personal.persona_curso (persona_id, curso_id, fecha_aprobacion, vigente_hasta) values ('20fb4035-3feb-58da-a9ab-77df01ce6a8e', 5, '2024-07-19', '2030-12-31');
insert into personal.persona_curso (persona_id, curso_id, fecha_aprobacion, vigente_hasta) values ('2c27012d-f957-58be-aa9e-7c4cd2355b18', 1, '2024-02-10', '2030-12-31');
insert into personal.persona_curso (persona_id, curso_id, fecha_aprobacion, vigente_hasta) values ('2c27012d-f957-58be-aa9e-7c4cd2355b18', 4, '2024-06-09', '2030-12-31');
insert into personal.persona_curso (persona_id, curso_id, fecha_aprobacion, vigente_hasta) values ('17f48af4-6fc3-5512-b003-ba76920910ff', 3, '2024-04-30', '2030-12-31');
insert into personal.persona_curso (persona_id, curso_id, fecha_aprobacion, vigente_hasta) values ('4345e829-8b8a-5149-90b2-810ee247e60a', 2, '2024-03-21', '2030-12-31');
insert into personal.persona_curso (persona_id, curso_id, fecha_aprobacion, vigente_hasta) values ('4345e829-8b8a-5149-90b2-810ee247e60a', 5, '2024-07-19', '2030-12-31');
insert into personal.persona_curso (persona_id, curso_id, fecha_aprobacion, vigente_hasta) values ('c1e20062-0df0-528a-85fd-03ac52aa9158', 1, '2024-02-10', '2030-12-31');
insert into personal.persona_curso (persona_id, curso_id, fecha_aprobacion, vigente_hasta) values ('c1e20062-0df0-528a-85fd-03ac52aa9158', 4, '2024-06-09', '2030-12-31');
insert into personal.persona_curso (persona_id, curso_id, fecha_aprobacion, vigente_hasta) values ('e87444d3-a2a6-5222-af23-a3292cd4842c', 3, '2024-04-30', '2030-12-31');
insert into personal.persona_curso (persona_id, curso_id, fecha_aprobacion, vigente_hasta) values ('dee56da3-9c6b-5091-9d8e-32e95ca908e3', 2, '2024-03-21', '2030-12-31');
insert into personal.persona_curso (persona_id, curso_id, fecha_aprobacion, vigente_hasta) values ('dee56da3-9c6b-5091-9d8e-32e95ca908e3', 5, '2024-07-19', '2030-12-31');
insert into personal.persona_curso (persona_id, curso_id, fecha_aprobacion, vigente_hasta) values ('8f8831d0-40e9-5d41-ada6-aed4cda2a60f', 1, '2024-02-10', '2030-12-31');
insert into personal.persona_curso (persona_id, curso_id, fecha_aprobacion, vigente_hasta) values ('8f8831d0-40e9-5d41-ada6-aed4cda2a60f', 4, '2024-06-09', '2030-12-31');
insert into personal.persona_curso (persona_id, curso_id, fecha_aprobacion, vigente_hasta) values ('7a5efba2-1e47-51a1-bff9-7045345a182d', 3, '2024-04-30', '2030-12-31');
insert into personal.persona_curso (persona_id, curso_id, fecha_aprobacion, vigente_hasta) values ('2b273959-45fa-5c61-b757-359a169f2e1e', 2, '2024-03-21', '2030-12-31');
insert into personal.persona_curso (persona_id, curso_id, fecha_aprobacion, vigente_hasta) values ('2b273959-45fa-5c61-b757-359a169f2e1e', 5, '2024-07-19', '2030-12-31');
insert into personal.persona_curso (persona_id, curso_id, fecha_aprobacion, vigente_hasta) values ('87585a59-cd24-5815-bbb7-9b7fbbc01c16', 1, '2024-02-10', '2030-12-31');
insert into personal.persona_curso (persona_id, curso_id, fecha_aprobacion, vigente_hasta) values ('87585a59-cd24-5815-bbb7-9b7fbbc01c16', 4, '2024-06-09', '2030-12-31');
insert into personal.persona_curso (persona_id, curso_id, fecha_aprobacion, vigente_hasta) values ('a5ac36f5-693c-55b3-81b1-c1535a355af7', 3, '2024-04-30', '2030-12-31');
insert into personal.persona_curso (persona_id, curso_id, fecha_aprobacion, vigente_hasta) values ('719c8def-873f-50f2-83c4-7006e03ceb8c', 2, '2024-03-21', '2030-12-31');
insert into personal.persona_curso (persona_id, curso_id, fecha_aprobacion, vigente_hasta) values ('719c8def-873f-50f2-83c4-7006e03ceb8c', 5, '2024-07-19', '2030-12-31');
insert into personal.persona_curso (persona_id, curso_id, fecha_aprobacion, vigente_hasta) values ('8b8a4e76-f7f1-5fab-af6d-9a13dbe20dd5', 1, '2024-02-10', '2030-12-31');
insert into personal.persona_curso (persona_id, curso_id, fecha_aprobacion, vigente_hasta) values ('8b8a4e76-f7f1-5fab-af6d-9a13dbe20dd5', 4, '2024-06-09', '2030-12-31');
insert into personal.persona_curso (persona_id, curso_id, fecha_aprobacion, vigente_hasta) values ('d5bb007f-958d-5c73-ac74-2abbcc9606dd', 3, '2024-04-30', '2030-12-31');
insert into personal.persona_curso (persona_id, curso_id, fecha_aprobacion, vigente_hasta) values ('6a523054-722b-5663-bb5e-7cec43e71400', 2, '2024-03-21', '2030-12-31');
insert into personal.persona_curso (persona_id, curso_id, fecha_aprobacion, vigente_hasta) values ('6a523054-722b-5663-bb5e-7cec43e71400', 5, '2024-07-19', '2030-12-31');
insert into personal.persona_curso (persona_id, curso_id, fecha_aprobacion, vigente_hasta) values ('186fc2b3-89cd-5b37-b106-78d29bc1a104', 1, '2024-02-10', '2030-12-31');
insert into personal.persona_curso (persona_id, curso_id, fecha_aprobacion, vigente_hasta) values ('186fc2b3-89cd-5b37-b106-78d29bc1a104', 4, '2024-06-09', '2030-12-31');
insert into personal.persona_curso (persona_id, curso_id, fecha_aprobacion, vigente_hasta) values ('6961e3db-e3cc-5a18-a7ec-47c623cd734a', 3, '2024-04-30', '2030-12-31');
insert into personal.persona_curso (persona_id, curso_id, fecha_aprobacion, vigente_hasta) values ('518e32ec-a189-5ace-a6dc-841a2e136245', 2, '2024-03-21', '2030-12-31');
insert into personal.persona_curso (persona_id, curso_id, fecha_aprobacion, vigente_hasta) values ('518e32ec-a189-5ace-a6dc-841a2e136245', 5, '2024-07-19', '2030-12-31');
insert into personal.persona_curso (persona_id, curso_id, fecha_aprobacion, vigente_hasta) values ('b8cd318d-ced4-56d5-ad1d-10ecff64f64b', 1, '2024-02-10', '2030-12-31');
insert into personal.persona_curso (persona_id, curso_id, fecha_aprobacion, vigente_hasta) values ('b8cd318d-ced4-56d5-ad1d-10ecff64f64b', 4, '2024-06-09', '2030-12-31');
insert into personal.persona_curso (persona_id, curso_id, fecha_aprobacion, vigente_hasta) values ('6252616f-a023-543e-9845-044ededfea05', 3, '2024-04-30', '2030-12-31');
select setval(pg_get_serial_sequence('personal.curso','id'), 5);

-- Premios de constancia
insert into personal.persona_premio (persona_id, premio_tipo_id, anios, otorgado_por, fecha) select 'e58014ec-d954-5bde-8fd9-655529ac50eb', id, 10, 'Compañía', '2026-03-01' from personal.premio_tipo where codigo = 'CONSTANCIA';
insert into personal.persona_premio (persona_id, premio_tipo_id, anios, otorgado_por, fecha) select '20fb4035-3feb-58da-a9ab-77df01ce6a8e', id, 15, 'Compañía', '2026-03-01' from personal.premio_tipo where codigo = 'CONSTANCIA';
insert into personal.persona_premio (persona_id, premio_tipo_id, anios, otorgado_por, fecha) select '2c27012d-f957-58be-aa9e-7c4cd2355b18', id, 20, 'Compañía', '2026-03-01' from personal.premio_tipo where codigo = 'CONSTANCIA';
insert into personal.persona_premio (persona_id, premio_tipo_id, anios, otorgado_por, fecha) select '17f48af4-6fc3-5512-b003-ba76920910ff', id, 5, 'Compañía', '2026-03-01' from personal.premio_tipo where codigo = 'CONSTANCIA';
insert into personal.persona_premio (persona_id, premio_tipo_id, anios, otorgado_por, fecha) select '4345e829-8b8a-5149-90b2-810ee247e60a', id, 10, 'Compañía', '2026-03-01' from personal.premio_tipo where codigo = 'CONSTANCIA';
insert into personal.persona_premio (persona_id, premio_tipo_id, anios, otorgado_por, fecha) select 'c1e20062-0df0-528a-85fd-03ac52aa9158', id, 15, 'Compañía', '2026-03-01' from personal.premio_tipo where codigo = 'CONSTANCIA';
insert into personal.persona_premio (persona_id, premio_tipo_id, anios, otorgado_por, fecha) select 'e87444d3-a2a6-5222-af23-a3292cd4842c', id, 20, 'Compañía', '2026-03-01' from personal.premio_tipo where codigo = 'CONSTANCIA';
insert into personal.persona_premio (persona_id, premio_tipo_id, anios, otorgado_por, fecha) select 'dee56da3-9c6b-5091-9d8e-32e95ca908e3', id, 5, 'Compañía', '2026-03-01' from personal.premio_tipo where codigo = 'CONSTANCIA';
insert into personal.persona_premio (persona_id, premio_tipo_id, anios, otorgado_por, fecha) select '8f8831d0-40e9-5d41-ada6-aed4cda2a60f', id, 10, 'Compañía', '2026-03-01' from personal.premio_tipo where codigo = 'CONSTANCIA';
insert into personal.persona_premio (persona_id, premio_tipo_id, anios, otorgado_por, fecha) select '7a5efba2-1e47-51a1-bff9-7045345a182d', id, 15, 'Compañía', '2026-03-01' from personal.premio_tipo where codigo = 'CONSTANCIA';
insert into personal.persona_premio (persona_id, premio_tipo_id, anios, otorgado_por, fecha) select '2b273959-45fa-5c61-b757-359a169f2e1e', id, 20, 'Compañía', '2026-03-01' from personal.premio_tipo where codigo = 'CONSTANCIA';
insert into personal.persona_premio (persona_id, premio_tipo_id, anios, otorgado_por, fecha) select '87585a59-cd24-5815-bbb7-9b7fbbc01c16', id, 5, 'Compañía', '2026-03-01' from personal.premio_tipo where codigo = 'CONSTANCIA';

-- Situaciones especiales y licencias
insert into personal.situacion_especial (persona_id, tipo, desde, hasta, motivo) values ('7a5efba2-1e47-51a1-bff9-7045345a182d', 'licencia_medica', '2026-11-01', '2026-11-20', 'Reposo ficticio por licencia');
insert into personal.situacion_especial (persona_id, tipo, desde, hasta, motivo) values ('6252616f-a023-543e-9845-044ededfea05', 'embarazo', '2026-08-01', null, 'Situación ficticia de desarrollo');
insert into personal.situacion_especial (persona_id, tipo, desde, hasta, motivo) values ('2ef99536-6cbf-5e68-a4f2-a9c6e151220e', 'suspension', '2026-09-01', '2026-12-31', 'Suspensión ficticia');
insert into personal.licencia_conducir (persona_id, clase, numero, vence) values ('e58014ec-d954-5bde-8fd9-655529ac50eb', 'A2', 'FICTICIO-201', '2027-06-01');
insert into personal.licencia_conducir (persona_id, clase, numero, vence) values ('c1e20062-0df0-528a-85fd-03ac52aa9158', 'A4', 'FICTICIO-206', '2027-06-01');
insert into personal.licencia_conducir (persona_id, clase, numero, vence) values ('7a5efba2-1e47-51a1-bff9-7045345a182d', 'B', 'FICTICIO-210', '2027-06-01');

-- Unidades (material mayor)
insert into material.unidad (id, codigo, tipo_unidad_id, patente, marca, modelo, anio, transmision, km_actual, estado) overriding system value values (1, 'M-21', (select id from material.tipo_unidad where codigo = 'CONV'), 'ABCD12', 'Volvo', 'FMX', 2018, 'automática', 48000, 'operativa');
insert into material.unidad (id, codigo, tipo_unidad_id, patente, marca, modelo, anio, transmision, km_actual, estado) overriding system value values (2, 'R-22', (select id from material.tipo_unidad where codigo = 'RESC'), 'EFGH34', 'Mercedes-Benz', 'Atego', 2020, 'automática', 31000, 'operativa');
insert into material.unidad (id, codigo, tipo_unidad_id, patente, marca, modelo, anio, transmision, km_actual, estado) overriding system value values (3, 'F-23', (select id from material.tipo_unidad where codigo = 'FOR'), 'IJKL56', 'Toyota', 'Hilux', 2022, 'automática', 22000, 'operativa');

-- Documentos de unidades
insert into material.unidad_documento (unidad_id, tipo, vence) values (1, 'revision_tecnica', '2027-03-01') on conflict (unidad_id, tipo) do nothing;
insert into material.unidad_documento (unidad_id, tipo, vence) values (1, 'seguro', '2026-12-01') on conflict (unidad_id, tipo) do nothing;
insert into material.unidad_documento (unidad_id, tipo, vence) values (2, 'revision_tecnica', '2026-11-20') on conflict (unidad_id, tipo) do nothing;
insert into material.unidad_documento (unidad_id, tipo, vence) values (2, 'seguro', '2027-05-01') on conflict (unidad_id, tipo) do nothing;
insert into material.unidad_documento (unidad_id, tipo, vence) values (3, 'revision_tecnica', '2026-09-01') on conflict (unidad_id, tipo) do nothing;

-- Vistas 2D y ubicaciones
insert into material.unidad_vista (id, unidad_id, lado, orden) overriding system value values (1, 1, 'izquierda', 1);
insert into material.unidad_vista (id, unidad_id, lado, orden) overriding system value values (2, 1, 'derecha', 2);
insert into material.unidad_vista (id, unidad_id, lado, orden) overriding system value values (3, 1, 'trasera', 3);
insert into material.unidad_vista (id, unidad_id, lado, orden) overriding system value values (4, 2, 'izquierda', 4);
insert into material.unidad_vista (id, unidad_id, lado, orden) overriding system value values (5, 2, 'derecha', 5);
insert into material.unidad_vista (id, unidad_id, lado, orden) overriding system value values (6, 3, 'izquierda', 6);

insert into material.ubicacion (id, unidad_id, padre_id, vista_id, tipo, codigo, nombre, forma, orden) overriding system value values (1, 1, null, 1, 'cajonera', 'C1', 'Cajonera 1', '[[0.05, 0.1], [0.18, 0.1], [0.18, 0.4], [0.05, 0.4]]'::jsonb, 1);
insert into material.ubicacion (id, unidad_id, padre_id, vista_id, tipo, codigo, nombre, forma, orden) overriding system value values (2, 1, null, 1, 'cajonera', 'C2', 'Cajonera 2', '[[0.19, 0.1], [0.32, 0.1], [0.32, 0.4], [0.19, 0.4]]'::jsonb, 2);
insert into material.ubicacion (id, unidad_id, padre_id, vista_id, tipo, codigo, nombre, forma, orden) overriding system value values (3, 1, null, 1, 'cajonera', 'C3', 'Cajonera 3', '[[0.33, 0.1], [0.46, 0.1], [0.46, 0.4], [0.33, 0.4]]'::jsonb, 3);
insert into material.ubicacion (id, unidad_id, padre_id, vista_id, tipo, codigo, nombre, forma, orden) overriding system value values (4, 1, null, 1, 'cajonera', 'C4', 'Cajonera 4', '[[0.47000000000000003, 0.1], [0.6000000000000001, 0.1], [0.6000000000000001, 0.4], [0.47000000000000003, 0.4]]'::jsonb, 4);
insert into material.ubicacion (id, unidad_id, padre_id, vista_id, tipo, codigo, nombre, forma, orden) overriding system value values (5, 1, null, 1, 'cajonera', 'C5', 'Cajonera 5', '[[0.6100000000000001, 0.1], [0.74, 0.1], [0.74, 0.4], [0.6100000000000001, 0.4]]'::jsonb, 5);
insert into material.ubicacion (id, unidad_id, padre_id, vista_id, tipo, codigo, nombre, forma, orden) overriding system value values (6, 1, 5, 1, 'cajonera', 'C5.1', 'Cajonera 5.1', null::jsonb, 6);
insert into material.ubicacion (id, unidad_id, padre_id, vista_id, tipo, codigo, nombre, forma, orden) overriding system value values (7, 1, 6, 1, 'cajonera', 'C5.2', 'Cajonera 5.2', null::jsonb, 7);
insert into material.ubicacion (id, unidad_id, padre_id, vista_id, tipo, codigo, nombre, forma, orden) overriding system value values (8, 1, 7, 1, 'cajonera', 'C5.3', 'Cajonera 5.3', null::jsonb, 8);
insert into material.ubicacion (id, unidad_id, padre_id, vista_id, tipo, codigo, nombre, forma, orden) overriding system value values (9, 1, null, 1, 'cajonera', 'C6', 'Cajonera 6', '[[0.7500000000000001, 0.1], [0.8800000000000001, 0.1], [0.8800000000000001, 0.4], [0.7500000000000001, 0.4]]'::jsonb, 9);
insert into material.ubicacion (id, unidad_id, padre_id, vista_id, tipo, codigo, nombre, forma, orden) overriding system value values (10, 2, null, 4, 'cajonera', 'C1', 'Cajonera 1', '[[0.05, 0.1], [0.18, 0.1], [0.18, 0.4], [0.05, 0.4]]'::jsonb, 10);
insert into material.ubicacion (id, unidad_id, padre_id, vista_id, tipo, codigo, nombre, forma, orden) overriding system value values (11, 2, null, 4, 'cajonera', 'C2', 'Cajonera 2', '[[0.19, 0.1], [0.32, 0.1], [0.32, 0.4], [0.19, 0.4]]'::jsonb, 11);
insert into material.ubicacion (id, unidad_id, padre_id, vista_id, tipo, codigo, nombre, forma, orden) overriding system value values (12, 2, null, 4, 'cajonera', 'C3', 'Cajonera 3', '[[0.33, 0.1], [0.46, 0.1], [0.46, 0.4], [0.33, 0.4]]'::jsonb, 12);
insert into material.ubicacion (id, unidad_id, padre_id, vista_id, tipo, codigo, nombre, forma, orden) overriding system value values (13, 2, null, 4, 'cajonera', 'C4', 'Cajonera 4', '[[0.47000000000000003, 0.1], [0.6000000000000001, 0.1], [0.6000000000000001, 0.4], [0.47000000000000003, 0.4]]'::jsonb, 13);
insert into material.ubicacion (id, unidad_id, padre_id, vista_id, tipo, codigo, nombre, forma, orden) overriding system value values (14, 2, null, 4, 'cajonera', 'C5', 'Cajonera 5', '[[0.6100000000000001, 0.1], [0.74, 0.1], [0.74, 0.4], [0.6100000000000001, 0.4]]'::jsonb, 14);
insert into material.ubicacion (id, unidad_id, padre_id, vista_id, tipo, codigo, nombre, forma, orden) overriding system value values (15, 2, 14, 4, 'cajonera', 'C5.1', 'Cajonera 5.1', null::jsonb, 15);
insert into material.ubicacion (id, unidad_id, padre_id, vista_id, tipo, codigo, nombre, forma, orden) overriding system value values (16, 2, 15, 4, 'cajonera', 'C5.2', 'Cajonera 5.2', null::jsonb, 16);
insert into material.ubicacion (id, unidad_id, padre_id, vista_id, tipo, codigo, nombre, forma, orden) overriding system value values (17, 2, 16, 4, 'cajonera', 'C5.3', 'Cajonera 5.3', null::jsonb, 17);
insert into material.ubicacion (id, unidad_id, padre_id, vista_id, tipo, codigo, nombre, forma, orden) overriding system value values (18, 2, null, 4, 'cajonera', 'C6', 'Cajonera 6', '[[0.7500000000000001, 0.1], [0.8800000000000001, 0.1], [0.8800000000000001, 0.4], [0.7500000000000001, 0.4]]'::jsonb, 18);
insert into material.ubicacion (id, unidad_id, padre_id, vista_id, tipo, codigo, nombre, forma, orden) overriding system value values (19, 3, null, 6, 'cajonera', 'C1', 'Cajonera 1', '[[0.05, 0.1], [0.18, 0.1], [0.18, 0.4], [0.05, 0.4]]'::jsonb, 19);
insert into material.ubicacion (id, unidad_id, padre_id, vista_id, tipo, codigo, nombre, forma, orden) overriding system value values (20, 3, null, 6, 'cajonera', 'C2', 'Cajonera 2', '[[0.19, 0.1], [0.32, 0.1], [0.32, 0.4], [0.19, 0.4]]'::jsonb, 0);
insert into material.ubicacion (id, unidad_id, padre_id, vista_id, tipo, codigo, nombre, forma, orden) overriding system value values (21, 3, null, 6, 'cajonera', 'C3', 'Cajonera 3', '[[0.33, 0.1], [0.46, 0.1], [0.46, 0.4], [0.33, 0.4]]'::jsonb, 1);
insert into material.ubicacion (id, unidad_id, padre_id, vista_id, tipo, codigo, nombre, forma, orden) overriding system value values (22, 3, null, 6, 'cajonera', 'C4', 'Cajonera 4', '[[0.47000000000000003, 0.1], [0.6000000000000001, 0.1], [0.6000000000000001, 0.4], [0.47000000000000003, 0.4]]'::jsonb, 2);
insert into material.ubicacion (id, unidad_id, padre_id, vista_id, tipo, codigo, nombre, forma, orden) overriding system value values (23, 3, null, 6, 'cajonera', 'C5', 'Cajonera 5', '[[0.6100000000000001, 0.1], [0.74, 0.1], [0.74, 0.4], [0.6100000000000001, 0.4]]'::jsonb, 3);
insert into material.ubicacion (id, unidad_id, padre_id, vista_id, tipo, codigo, nombre, forma, orden) overriding system value values (24, 3, 23, 6, 'cajonera', 'C5.1', 'Cajonera 5.1', null::jsonb, 4);
insert into material.ubicacion (id, unidad_id, padre_id, vista_id, tipo, codigo, nombre, forma, orden) overriding system value values (25, 3, 24, 6, 'cajonera', 'C5.2', 'Cajonera 5.2', null::jsonb, 5);
insert into material.ubicacion (id, unidad_id, padre_id, vista_id, tipo, codigo, nombre, forma, orden) overriding system value values (26, 3, 25, 6, 'cajonera', 'C5.3', 'Cajonera 5.3', null::jsonb, 6);
insert into material.ubicacion (id, unidad_id, padre_id, vista_id, tipo, codigo, nombre, forma, orden) overriding system value values (27, 3, null, 6, 'cajonera', 'C6', 'Cajonera 6', '[[0.7500000000000001, 0.1], [0.8800000000000001, 0.1], [0.8800000000000001, 0.4], [0.7500000000000001, 0.4]]'::jsonb, 7);
insert into material.ubicacion (id, unidad_id, padre_id, vista_id, tipo, codigo, nombre, forma, orden) overriding system value values (28, null, null, null, 'bodega', 'BOD', 'Bodega del cuartel', null::jsonb, 8);

-- Artículos
insert into material.articulo (id, nombre, categoria_id, requiere_serie, vida_util_meses) overriding system value values (1, 'Casco de bombero', (select id from material.categoria_articulo where codigo = 'EPP'), true, 120);
insert into material.articulo (id, nombre, categoria_id, requiere_serie, vida_util_meses) overriding system value values (2, 'Guantes de protección', (select id from material.categoria_articulo where codigo = 'EPP'), false, 120);
insert into material.articulo (id, nombre, categoria_id, requiere_serie, vida_util_meses) overriding system value values (3, 'Botas de agua', (select id from material.categoria_articulo where codigo = 'EPP'), false, 120);
insert into material.articulo (id, nombre, categoria_id, requiere_serie, vida_util_meses) overriding system value values (4, 'Capote de aproximación', (select id from material.categoria_articulo where codigo = 'EPP'), false, 120);
insert into material.articulo (id, nombre, categoria_id, requiere_serie, vida_util_meses) overriding system value values (5, 'Equipo de respiración autónoma', (select id from material.categoria_articulo where codigo = 'ERA'), true, 120);
insert into material.articulo (id, nombre, categoria_id, requiere_serie, vida_util_meses) overriding system value values (6, 'Cilindro de aire 6.8 L', (select id from material.categoria_articulo where codigo = 'ERA'), true, 120);
insert into material.articulo (id, nombre, categoria_id, requiere_serie, vida_util_meses) overriding system value values (7, 'Máscara ERA', (select id from material.categoria_articulo where codigo = 'ERA'), true, 120);
insert into material.articulo (id, nombre, categoria_id, requiere_serie, vida_util_meses) overriding system value values (8, 'Pitón de 2.5 pulgadas', (select id from material.categoria_articulo where codigo = 'HERR'), false, 120);
insert into material.articulo (id, nombre, categoria_id, requiere_serie, vida_util_meses) overriding system value values (9, 'Hacha de bombero', (select id from material.categoria_articulo where codigo = 'HERR'), false, 120);
insert into material.articulo (id, nombre, categoria_id, requiere_serie, vida_util_meses) overriding system value values (10, 'Tifón', (select id from material.categoria_articulo where codigo = 'HERR'), false, 120);
insert into material.articulo (id, nombre, categoria_id, requiere_serie, vida_util_meses) overriding system value values (11, 'Radio portátil', (select id from material.categoria_articulo where codigo = 'RADIO'), true, 120);
insert into material.articulo (id, nombre, categoria_id, requiere_serie, vida_util_meses) overriding system value values (12, 'Linterna de casco', (select id from material.categoria_articulo where codigo = 'OTRO'), false, 120);
insert into material.articulo (id, nombre, categoria_id, requiere_serie, vida_util_meses) overriding system value values (13, 'Camilla rígida', (select id from material.categoria_articulo where codigo = 'MED'), true, 120);
insert into material.articulo (id, nombre, categoria_id, requiere_serie, vida_util_meses) overriding system value values (14, 'Botiquín de primeros auxilios', (select id from material.categoria_articulo where codigo = 'MED'), false, 120);
insert into material.articulo (id, nombre, categoria_id, requiere_serie, vida_util_meses) overriding system value values (15, 'Cuerda de rescate 30 m', (select id from material.categoria_articulo where codigo = 'HERR'), true, 120);
insert into material.articulo (id, nombre, categoria_id, requiere_serie, vida_util_meses) overriding system value values (16, 'Traje Hazmat nivel B', (select id from material.categoria_articulo where codigo = 'EPP'), true, 120);

-- Ítems de inventario
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (1, 10, 1, 'Genérica', null, 2, 'bueno', 'compania', 203785);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (2, 12, 1, 'Genérica', null, 2, 'bueno', 'compania', 122769);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (3, 10, 2, 'Genérica', null, 2, 'sin_revisar', 'compania', 11829);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (4, 4, 2, 'Genérica', null, 4, 'bueno', 'compania', 201021);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (5, 2, 3, 'Genérica', null, 2, 'bueno', 'compania', 61287);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (6, 12, 3, 'Genérica', null, 1, 'bueno', 'compania', 165849);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (7, 14, 4, 'Genérica', null, 1, 'sin_revisar', 'compania', 15163);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (8, 14, 4, 'Genérica', null, 2, 'regular', 'compania', 234359);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (9, 14, 5, 'Genérica', null, 2, 'bueno', 'compania', 52915);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (10, 14, 5, 'Genérica', null, 1, 'malo', 'compania', 115701);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (11, 8, 6, 'Genérica', null, 3, 'sin_revisar', 'compania', 181573);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (12, 10, 6, 'Genérica', null, 4, 'regular', 'compania', 199289);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (13, 14, 7, 'Genérica', null, 3, 'regular', 'compania', 34343);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (14, 2, 7, 'Genérica', null, 1, 'malo', 'compania', 48961);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (15, 14, 8, 'Genérica', null, 3, 'regular', 'compania', 84177);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (16, 12, 8, 'Genérica', null, 3, 'bueno', 'compania', 112733);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (17, 10, 9, 'Genérica', null, 4, 'bueno', 'compania', 239252);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (18, 4, 9, 'Genérica', null, 4, 'regular', 'compania', 72975);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (19, 4, 10, 'Genérica', null, 1, 'malo', 'compania', 71693);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (20, 2, 10, 'Genérica', null, 2, 'bueno', 'compania', 140487);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (21, 9, 11, 'Genérica', null, 2, 'malo', 'compania', 187001);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (22, 4, 11, 'Genérica', null, 1, 'bueno', 'compania', 5581);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (23, 4, 12, 'Genérica', null, 1, 'malo', 'compania', 64071);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (24, 10, 12, 'Genérica', null, 2, 'sin_revisar', 'compania', 210405);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (25, 2, 13, 'Genérica', null, 1, 'bueno', 'compania', 147531);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (26, 8, 13, 'Genérica', null, 4, 'malo', 'compania', 85784);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (27, 9, 14, 'Genérica', null, 4, 'bueno', 'compania', 36216);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (28, 4, 14, 'Genérica', null, 1, 'bueno', 'compania', 220604);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (29, 10, 15, 'Genérica', null, 4, 'bueno', 'compania', 22737);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (30, 3, 15, 'Genérica', null, 2, 'malo', 'compania', 129589);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (31, 14, 16, 'Genérica', null, 4, 'bueno', 'compania', 66144);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (32, 4, 16, 'Genérica', null, 4, 'bueno', 'compania', 109007);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (33, 2, 17, 'Genérica', null, 2, 'bueno', 'compania', 42572);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (34, 2, 17, 'Genérica', null, 2, 'malo', 'compania', 153279);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (35, 14, 18, 'Genérica', null, 4, 'bueno', 'compania', 105306);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (36, 12, 18, 'Genérica', null, 4, 'malo', 'compania', 234943);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (37, 3, 19, 'Genérica', null, 4, 'malo', 'compania', 114143);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (38, 12, 19, 'Genérica', null, 4, 'bueno', 'compania', 74839);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (39, 9, 20, 'Genérica', null, 3, 'malo', 'compania', 247575);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (40, 14, 20, 'Genérica', null, 1, 'regular', 'compania', 96852);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (41, 3, 21, 'Genérica', null, 4, 'sin_revisar', 'compania', 193715);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (42, 10, 21, 'Genérica', null, 2, 'bueno', 'compania', 213772);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (43, 14, 22, 'Genérica', null, 2, 'regular', 'compania', 95822);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (44, 2, 22, 'Genérica', null, 1, 'malo', 'compania', 141437);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (45, 2, 23, 'Genérica', null, 4, 'bueno', 'compania', 228807);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (46, 14, 23, 'Genérica', null, 1, 'sin_revisar', 'compania', 206905);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (47, 14, 24, 'Genérica', null, 1, 'bueno', 'compania', 223569);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (48, 9, 24, 'Genérica', null, 4, 'bueno', 'compania', 26403);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (49, 2, 25, 'Genérica', null, 1, 'sin_revisar', 'compania', 218625);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (50, 8, 25, 'Genérica', null, 4, 'bueno', 'compania', 220095);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (51, 12, 26, 'Genérica', null, 2, 'regular', 'compania', 55951);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (52, 8, 26, 'Genérica', null, 3, 'bueno', 'compania', 249163);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (53, 4, 27, 'Genérica', null, 1, 'bueno', 'compania', 57099);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (54, 12, 27, 'Genérica', null, 4, 'bueno', 'compania', 230093);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (55, 8, 28, 'Genérica', null, 11, 'bueno', 'compania', 206890);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (56, 10, 28, 'Genérica', null, 11, 'bueno', 'compania', 121893);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (57, 2, 28, 'Genérica', null, 9, 'bueno', 'compania', 77240);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (58, 3, 28, 'Genérica', null, 16, 'bueno', 'compania', 238399);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (59, 9, 28, 'Genérica', null, 17, 'bueno', 'compania', 242902);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (60, 3, 28, 'Genérica', null, 17, 'bueno', 'compania', 198649);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (61, 9, 28, 'Genérica', null, 16, 'bueno', 'compania', 34662);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (62, 10, 28, 'Genérica', null, 8, 'bueno', 'compania', 219682);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (63, 3, 28, 'Genérica', null, 9, 'bueno', 'compania', 120833);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (64, 9, 28, 'Genérica', null, 10, 'bueno', 'compania', 118888);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (65, 4, 28, 'Genérica', null, 14, 'bueno', 'compania', 13819);
insert into material.item (id, articulo_id, ubicacion_id, marca, n_serie, cantidad, estado, origen, valor) overriding system value values (66, 14, 28, 'Genérica', null, 18, 'bueno', 'compania', 17727);
select setval(pg_get_serial_sequence('material.item','id'), (select max(id) from material.item));
select setval(pg_get_serial_sequence('material.ubicacion','id'), (select max(id) from material.ubicacion));
select setval(pg_get_serial_sequence('material.unidad','id'), 3);
select setval(pg_get_serial_sequence('material.articulo','id'), 16);
select setval(pg_get_serial_sequence('material.unidad_vista','id'), 6);

-- Asignaciones de EPP
insert into material.asignacion (persona_id, articulo_id, cantidad, talla, fecha_entrega, origen) values ('e58014ec-d954-5bde-8fd9-655529ac50eb', 5, 1, 'M', '2026-03-01', 'compania');
insert into material.asignacion (persona_id, articulo_id, cantidad, talla, fecha_entrega, origen) values ('e58014ec-d954-5bde-8fd9-655529ac50eb', 1, 1, 'XL', '2026-03-01', 'compania');
insert into material.asignacion (persona_id, articulo_id, cantidad, talla, fecha_entrega, origen) values ('20fb4035-3feb-58da-a9ab-77df01ce6a8e', 4, 1, 'XL', '2026-03-01', 'compania');
insert into material.asignacion (persona_id, articulo_id, cantidad, talla, fecha_entrega, origen) values ('20fb4035-3feb-58da-a9ab-77df01ce6a8e', 3, 1, 'M', '2026-03-01', 'compania');
insert into material.asignacion (persona_id, articulo_id, cantidad, talla, fecha_entrega, origen) values ('20fb4035-3feb-58da-a9ab-77df01ce6a8e', 5, 1, 'XL', '2026-03-01', 'compania');
insert into material.asignacion (persona_id, articulo_id, cantidad, talla, fecha_entrega, origen) values ('2c27012d-f957-58be-aa9e-7c4cd2355b18', 3, 1, 'L', '2026-03-01', 'compania');
insert into material.asignacion (persona_id, articulo_id, cantidad, talla, fecha_entrega, origen) values ('17f48af4-6fc3-5512-b003-ba76920910ff', 2, 1, 'M', '2026-03-01', 'compania');
insert into material.asignacion (persona_id, articulo_id, cantidad, talla, fecha_entrega, origen) values ('17f48af4-6fc3-5512-b003-ba76920910ff', 4, 1, 'M', '2026-03-01', 'compania');
insert into material.asignacion (persona_id, articulo_id, cantidad, talla, fecha_entrega, origen) values ('17f48af4-6fc3-5512-b003-ba76920910ff', 5, 1, 'XL', '2026-03-01', 'compania');
insert into material.asignacion (persona_id, articulo_id, cantidad, talla, fecha_entrega, origen) values ('4345e829-8b8a-5149-90b2-810ee247e60a', 5, 1, 'M', '2026-03-01', 'compania');
insert into material.asignacion (persona_id, articulo_id, cantidad, talla, fecha_entrega, origen) values ('c1e20062-0df0-528a-85fd-03ac52aa9158', 1, 1, 'M', '2026-03-01', 'compania');
insert into material.asignacion (persona_id, articulo_id, cantidad, talla, fecha_entrega, origen) values ('e87444d3-a2a6-5222-af23-a3292cd4842c', 4, 1, 'L', '2026-03-01', 'compania');
insert into material.asignacion (persona_id, articulo_id, cantidad, talla, fecha_entrega, origen) values ('e87444d3-a2a6-5222-af23-a3292cd4842c', 5, 1, 'M', '2026-03-01', 'compania');
insert into material.asignacion (persona_id, articulo_id, cantidad, talla, fecha_entrega, origen) values ('e87444d3-a2a6-5222-af23-a3292cd4842c', 2, 1, 'S', '2026-03-01', 'compania');
insert into material.asignacion (persona_id, articulo_id, cantidad, talla, fecha_entrega, origen) values ('dee56da3-9c6b-5091-9d8e-32e95ca908e3', 3, 1, 'XL', '2026-03-01', 'compania');
insert into material.asignacion (persona_id, articulo_id, cantidad, talla, fecha_entrega, origen) values ('8f8831d0-40e9-5d41-ada6-aed4cda2a60f', 4, 1, 'L', '2026-03-01', 'compania');
insert into material.asignacion (persona_id, articulo_id, cantidad, talla, fecha_entrega, origen) values ('8f8831d0-40e9-5d41-ada6-aed4cda2a60f', 5, 1, 'S', '2026-03-01', 'compania');
insert into material.asignacion (persona_id, articulo_id, cantidad, talla, fecha_entrega, origen) values ('7a5efba2-1e47-51a1-bff9-7045345a182d', 4, 1, 'S', '2026-03-01', 'compania');
insert into material.asignacion (persona_id, articulo_id, cantidad, talla, fecha_entrega, origen) values ('2b273959-45fa-5c61-b757-359a169f2e1e', 1, 1, 'XL', '2026-03-01', 'compania');
insert into material.asignacion (persona_id, articulo_id, cantidad, talla, fecha_entrega, origen) values ('2b273959-45fa-5c61-b757-359a169f2e1e', 2, 1, 'L', '2026-03-01', 'compania');
insert into material.asignacion (persona_id, articulo_id, cantidad, talla, fecha_entrega, origen) values ('2b273959-45fa-5c61-b757-359a169f2e1e', 5, 1, 'S', '2026-03-01', 'compania');
insert into material.asignacion (persona_id, articulo_id, cantidad, talla, fecha_entrega, origen) values ('87585a59-cd24-5815-bbb7-9b7fbbc01c16', 3, 1, 'XL', '2026-03-01', 'compania');
insert into material.asignacion (persona_id, articulo_id, cantidad, talla, fecha_entrega, origen) values ('87585a59-cd24-5815-bbb7-9b7fbbc01c16', 5, 1, 'XL', '2026-03-01', 'compania');
insert into material.asignacion (persona_id, articulo_id, cantidad, talla, fecha_entrega, origen) values ('87585a59-cd24-5815-bbb7-9b7fbbc01c16', 2, 1, 'S', '2026-03-01', 'compania');
insert into material.asignacion (persona_id, articulo_id, cantidad, talla, fecha_entrega, origen) values ('a5ac36f5-693c-55b3-81b1-c1535a355af7', 3, 1, 'XL', '2026-03-01', 'compania');
insert into material.asignacion (persona_id, articulo_id, cantidad, talla, fecha_entrega, origen) values ('a5ac36f5-693c-55b3-81b1-c1535a355af7', 2, 1, 'L', '2026-03-01', 'compania');
insert into material.asignacion (persona_id, articulo_id, cantidad, talla, fecha_entrega, origen) values ('719c8def-873f-50f2-83c4-7006e03ceb8c', 4, 1, 'M', '2026-03-01', 'compania');
insert into material.asignacion (persona_id, articulo_id, cantidad, talla, fecha_entrega, origen) values ('719c8def-873f-50f2-83c4-7006e03ceb8c', 2, 1, 'S', '2026-03-01', 'compania');

-- Pañol del Teniente 2° (stock ficticio)
insert into material.panol_stock (articulo_id, talla, cantidad, minimo) values (1, 'M', 4, 2);
insert into material.panol_stock (articulo_id, talla, cantidad, minimo) values (1, 'L', 6, 2);
insert into material.panol_stock (articulo_id, talla, cantidad, minimo) values (1, 'XL', 2, 1);
insert into material.panol_stock (articulo_id, talla, cantidad, minimo) values (2, 'M', 12, 6);
insert into material.panol_stock (articulo_id, talla, cantidad, minimo) values (2, 'L', 18, 6);
insert into material.panol_stock (articulo_id, talla, cantidad, minimo) values (3, '39', 6, 4);
insert into material.panol_stock (articulo_id, talla, cantidad, minimo) values (3, '41', 8, 4);
insert into material.panol_stock (articulo_id, talla, cantidad, minimo) values (3, '43', 4, 2);
insert into material.panol_stock (articulo_id, talla, cantidad, minimo) values (4, 'M', 5, 3);
insert into material.panol_stock (articulo_id, talla, cantidad, minimo) values (4, 'L', 7, 3);
insert into material.panol_stock (articulo_id, talla, cantidad, minimo) values (5, null, 2, 1);
insert into material.panol_stock (articulo_id, talla, cantidad, minimo) values (6, null, 4, 2);
insert into material.panol_stock (articulo_id, talla, cantidad, minimo) values (7, null, 3, 2);
insert into material.panol_stock (articulo_id, talla, cantidad, minimo) values (8, null, 5, 2);
insert into material.panol_stock (articulo_id, talla, cantidad, minimo) values (9, null, 6, 2);
insert into material.panol_stock (articulo_id, talla, cantidad, minimo) values (10, null, 2, 1);
insert into material.panol_stock (articulo_id, talla, cantidad, minimo) values (11, null, 8, 4);
insert into material.panol_stock (articulo_id, talla, cantidad, minimo) values (12, null, 10, 4);
insert into material.panol_stock (articulo_id, talla, cantidad, minimo) values (13, null, 2, 1);
insert into material.panol_stock (articulo_id, talla, cantidad, minimo) values (14, null, 3, 1);
insert into material.panol_stock (articulo_id, talla, cantidad, minimo) values (15, null, 2, 1);
insert into material.panol_stock (articulo_id, talla, cantidad, minimo) values (16, 'L', 1, 1);

-- Solicitudes ficticias al pañol (2 pendientes, 1 entregada, 1 rechazada)
insert into material.solicitud (persona_id, stock_id, articulo_id, cantidad, motivo) values ('87585a59-cd24-5815-bbb7-9b7fbbc01c16', 5, (select articulo_id from material.panol_stock where id = 5), 2, 'Reposición de guantes para la guardia');
insert into material.solicitud (persona_id, stock_id, articulo_id, cantidad, motivo) values ('719c8def-873f-50f2-83c4-7006e03ceb8c', 18, (select articulo_id from material.panol_stock where id = 18), 1, 'Linterna del casco con batería descargada');
insert into material.solicitud (persona_id, stock_id, articulo_id, cantidad, motivo) values ('d5bb007f-958d-5c73-ac74-2abbcc9606dd', 7, (select articulo_id from material.panol_stock where id = 7), 1, 'Botas de agua rotas en acto de servicio');
insert into material.solicitud (persona_id, stock_id, articulo_id, cantidad, motivo) values ('186fc2b3-89cd-5b37-b106-78d29bc1a104', 17, (select articulo_id from material.panol_stock where id = 17), 1, 'Radio portátil con falla de recepción');
do $$ begin perform set_config('request.jwt.claim.sub', '3a0bd7bb-741e-5763-8ab7-19c966feb51c', true); perform material.resolver_solicitud(2, 'entregada', 'Se entrega en el pañol.'); perform material.resolver_solicitud(4, 'rechazada', 'Sin stock hasta la próxima reposición.'); perform set_config('request.jwt.claim.sub', '9c9535dc-ee69-50d0-bb82-0ecf838ae964', true); end $$;

-- Revisiones y bitácoras
insert into material.revision_inventario (unidad_id, fecha, observacion) values (1, '2026-06-15', 'Revisión ficticia');
insert into material.revision_inventario (unidad_id, fecha, observacion) values (2, '2026-06-15', 'Revisión ficticia');
insert into material.revision_inventario (unidad_id, fecha, observacion) values (3, '2025-10-01', 'Revisión ficticia');
insert into material.bitacora_unidad (unidad_id, fecha, km, horas_bomba, novedades) values (1, '2026-10-31', 48200, 54, 'Sin novedades');
insert into material.bitacora_unidad (unidad_id, fecha, km, horas_bomba, novedades) values (2, '2026-10-31', 31500, 21, 'Sin novedades');
insert into material.bitacora_unidad (unidad_id, fecha, km, horas_bomba, novedades) values (3, '2026-10-31', 22400, 23, 'Sin novedades');

-- Tesorería: cuenta, fondo, categorías
insert into tesoreria.cuenta (id, nombre, banco, numero, tipo) overriding system value values (1, 'Cuenta corriente compañía', 'Banco Ficticio', '000-123456-7', 'corriente');
select setval(pg_get_serial_sequence('tesoreria.cuenta','id'), 1);

insert into tesoreria.categoria (id, codigo, nombre, tipo) overriding system value values (1, '1001001', 'Cuotas sociales', 'ingreso') on conflict (id) do nothing;
insert into tesoreria.categoria (id, codigo, nombre, tipo) overriding system value values (2, '1002001', 'Campaña económica', 'ingreso') on conflict (id) do nothing;
insert into tesoreria.categoria (id, codigo, nombre, tipo) overriding system value values (3, '1003001', 'Donaciones', 'ingreso') on conflict (id) do nothing;
insert into tesoreria.categoria (id, codigo, nombre, tipo) overriding system value values (4, '1004001', 'Aportes municipales', 'ingreso') on conflict (id) do nothing;
insert into tesoreria.categoria (id, codigo, nombre, tipo) overriding system value values (5, '2001001', 'Combustible', 'egreso') on conflict (id) do nothing;
insert into tesoreria.categoria (id, codigo, nombre, tipo) overriding system value values (6, '2002001', 'Mantención de unidades', 'egreso') on conflict (id) do nothing;
insert into tesoreria.categoria (id, codigo, nombre, tipo) overriding system value values (7, '2003001', 'Material menor', 'egreso') on conflict (id) do nothing;
insert into tesoreria.categoria (id, codigo, nombre, tipo) overriding system value values (8, '2004001', 'Seguros', 'egreso') on conflict (id) do nothing;
insert into tesoreria.categoria (id, codigo, nombre, tipo) overriding system value values (9, '2005001', 'Cuotas al Cuerpo', 'egreso') on conflict (id) do nothing;
insert into tesoreria.categoria (id, codigo, nombre, tipo) overriding system value values (10, '2006001', 'Gastos administrativos', 'egreso') on conflict (id) do nothing;
select setval(pg_get_serial_sequence('tesoreria.categoria','id'), 10);

-- Presupuesto 2026
insert into tesoreria.presupuesto (id, anio, version, acta_id, vigente) overriding system value values (1, 2026, 1, 1, true);
insert into tesoreria.presupuesto_linea (presupuesto_id, categoria_id, item, monto_anual) values (1, 1, (select nombre from tesoreria.categoria where id = 1), 4200000);
insert into tesoreria.presupuesto_linea (presupuesto_id, categoria_id, item, monto_anual) values (1, 2, (select nombre from tesoreria.categoria where id = 2), 1800000);
insert into tesoreria.presupuesto_linea (presupuesto_id, categoria_id, item, monto_anual) values (1, 3, (select nombre from tesoreria.categoria where id = 3), 600000);
insert into tesoreria.presupuesto_linea (presupuesto_id, categoria_id, item, monto_anual) values (1, 4, (select nombre from tesoreria.categoria where id = 4), 2000000);
insert into tesoreria.presupuesto_linea (presupuesto_id, categoria_id, item, monto_anual) values (1, 5, (select nombre from tesoreria.categoria where id = 5), 1200000);
insert into tesoreria.presupuesto_linea (presupuesto_id, categoria_id, item, monto_anual) values (1, 6, (select nombre from tesoreria.categoria where id = 6), 1500000);
insert into tesoreria.presupuesto_linea (presupuesto_id, categoria_id, item, monto_anual) values (1, 7, (select nombre from tesoreria.categoria where id = 7), 800000);
insert into tesoreria.presupuesto_linea (presupuesto_id, categoria_id, item, monto_anual) values (1, 8, (select nombre from tesoreria.categoria where id = 8), 700000);
insert into tesoreria.presupuesto_linea (presupuesto_id, categoria_id, item, monto_anual) values (1, 9, (select nombre from tesoreria.categoria where id = 9), 900000);
insert into tesoreria.presupuesto_linea (presupuesto_id, categoria_id, item, monto_anual) values (1, 10, (select nombre from tesoreria.categoria where id = 10), 600000);
select setval(pg_get_serial_sequence('tesoreria.presupuesto','id'), 1);

-- Compromisos
insert into tesoreria.compromiso (id, descripcion, monto, fecha_estimada, estado, acuerdo_id, categoria_id) overriding system value values (1, 'Compra de EPP para guardia nocturna', 850000, '2026-11-30', 'comprometido', 2, 7);
insert into tesoreria.compromiso (id, descripcion, monto, fecha_estimada, estado, acuerdo_id, categoria_id) overriding system value values (2, 'Mantención preventiva M-21', 320000, '2026-11-20', 'devengado', 2, 6);
insert into tesoreria.compromiso (id, descripcion, monto, fecha_estimada, estado, acuerdo_id, categoria_id) overriding system value values (3, 'Pago de seguro de unidades', 450000, '2026-12-15', 'comprometido', 1, 8);
insert into tesoreria.compromiso (id, descripcion, monto, fecha_estimada, estado, acuerdo_id, categoria_id) overriding system value values (4, 'Cuota anual al Cuerpo', 900000, '2026-12-31', 'comprometido', 1, 9);
insert into tesoreria.compromiso (id, descripcion, monto, fecha_estimada, estado, acuerdo_id, categoria_id) overriding system value values (5, 'Reparación de material menor', 120000, '2026-10-15', 'pagado', 1, 7);
insert into tesoreria.compromiso (id, descripcion, monto, fecha_estimada, estado, acuerdo_id, categoria_id) overriding system value values (6, 'Cuota de capacitación ANB 2026', 260000, '2026-12-20', 'comprometido', null, 10);
select setval(pg_get_serial_sequence('tesoreria.compromiso','id'), 6);

-- Movimientos de 6 meses
insert into tesoreria.movimiento (id, fecha, tipo, cuenta_id, fondo_id, categoria_id, monto, glosa, medio_pago, anulado) overriding system value values (1, '2026-05-27', 'ingreso', 1, (select id from tesoreria.fondo where codigo = 'PROPIO'), 1, 343558, 'Recaudación de cuotas sociales', 'transferencia', false),
(2, '2026-05-01', 'ingreso', 1, (select id from tesoreria.fondo where codigo = 'PROPIO'), 2, 96767, 'Venta de talonarios', 'transferencia', false),
(3, '2026-05-17', 'egreso', 1, (select id from tesoreria.fondo where codigo = 'PROPIO'), 5, 91245, 'Combustible de unidades', 'transferencia', false),
(4, '2026-05-13', 'egreso', 1, (select id from tesoreria.fondo where codigo = 'PROPIO'), 6, 47961, 'Mantención menor', 'transferencia', false),
(5, '2026-05-23', 'egreso', 1, (select id from tesoreria.fondo where codigo = 'PROPIO'), 7, 58666, 'Reposición de material menor', 'transferencia', false),
(6, '2026-05-10', 'egreso', 1, (select id from tesoreria.fondo where codigo = 'PROPIO'), 9, 50000, 'Cuota al Cuerpo', 'transferencia', false),
(7, '2026-05-11', 'egreso', 1, (select id from tesoreria.fondo where codigo = 'PROPIO'), 10, 43477, 'Gastos administrativos', 'transferencia', false),
(8, '2026-06-21', 'ingreso', 1, (select id from tesoreria.fondo where codigo = 'PROPIO'), 1, 350497, 'Recaudación de cuotas sociales', 'transferencia', false),
(9, '2026-06-01', 'ingreso', 1, (select id from tesoreria.fondo where codigo = 'PROPIO'), 2, 95374, 'Venta de talonarios', 'transferencia', false),
(10, '2026-06-22', 'egreso', 1, (select id from tesoreria.fondo where codigo = 'PROPIO'), 5, 114300, 'Combustible de unidades', 'transferencia', false),
(11, '2026-06-06', 'egreso', 1, (select id from tesoreria.fondo where codigo = 'PROPIO'), 6, 61393, 'Mantención menor', 'transferencia', false),
(12, '2026-06-26', 'egreso', 1, (select id from tesoreria.fondo where codigo = 'PROPIO'), 7, 41398, 'Reposición de material menor', 'transferencia', false),
(13, '2026-06-09', 'egreso', 1, (select id from tesoreria.fondo where codigo = 'PROPIO'), 9, 50000, 'Cuota al Cuerpo', 'transferencia', false),
(14, '2026-06-16', 'egreso', 1, (select id from tesoreria.fondo where codigo = 'PROPIO'), 10, 34005, 'Gastos administrativos', 'transferencia', false),
(15, '2026-07-06', 'ingreso', 1, (select id from tesoreria.fondo where codigo = 'PROPIO'), 1, 367472, 'Recaudación de cuotas sociales', 'transferencia', false),
(16, '2026-07-24', 'ingreso', 1, (select id from tesoreria.fondo where codigo = 'PROPIO'), 2, 142616, 'Venta de talonarios', 'transferencia', false),
(17, '2026-07-06', 'egreso', 1, (select id from tesoreria.fondo where codigo = 'PROPIO'), 5, 84439, 'Combustible de unidades', 'transferencia', false),
(18, '2026-07-17', 'egreso', 1, (select id from tesoreria.fondo where codigo = 'PROPIO'), 6, 64885, 'Mantención menor', 'transferencia', false),
(19, '2026-07-02', 'egreso', 1, (select id from tesoreria.fondo where codigo = 'PROPIO'), 7, 39479, 'Reposición de material menor', 'transferencia', false),
(20, '2026-07-15', 'egreso', 1, (select id from tesoreria.fondo where codigo = 'PROPIO'), 9, 50000, 'Cuota al Cuerpo', 'transferencia', false),
(21, '2026-07-10', 'egreso', 1, (select id from tesoreria.fondo where codigo = 'PROPIO'), 10, 26713, 'Gastos administrativos', 'transferencia', false),
(22, '2026-08-26', 'ingreso', 1, (select id from tesoreria.fondo where codigo = 'PROPIO'), 1, 362444, 'Recaudación de cuotas sociales', 'transferencia', false),
(23, '2026-08-25', 'ingreso', 1, (select id from tesoreria.fondo where codigo = 'PROPIO'), 2, 158813, 'Venta de talonarios', 'transferencia', false),
(24, '2026-08-23', 'egreso', 1, (select id from tesoreria.fondo where codigo = 'PROPIO'), 5, 84565, 'Combustible de unidades', 'transferencia', false),
(25, '2026-08-08', 'egreso', 1, (select id from tesoreria.fondo where codigo = 'PROPIO'), 6, 77425, 'Mantención menor', 'transferencia', false),
(26, '2026-08-16', 'egreso', 1, (select id from tesoreria.fondo where codigo = 'PROPIO'), 7, 21266, 'Reposición de material menor', 'transferencia', false),
(27, '2026-08-26', 'egreso', 1, (select id from tesoreria.fondo where codigo = 'PROPIO'), 9, 50000, 'Cuota al Cuerpo', 'transferencia', false),
(28, '2026-08-16', 'egreso', 1, (select id from tesoreria.fondo where codigo = 'PROPIO'), 10, 33720, 'Gastos administrativos', 'transferencia', false),
(29, '2026-09-21', 'ingreso', 1, (select id from tesoreria.fondo where codigo = 'PROPIO'), 1, 334236, 'Recaudación de cuotas sociales', 'transferencia', false),
(30, '2026-09-08', 'ingreso', 1, (select id from tesoreria.fondo where codigo = 'PROPIO'), 2, 115624, 'Venta de talonarios', 'transferencia', false),
(31, '2026-09-03', 'egreso', 1, (select id from tesoreria.fondo where codigo = 'PROPIO'), 5, 101906, 'Combustible de unidades', 'transferencia', false),
(32, '2026-09-11', 'egreso', 1, (select id from tesoreria.fondo where codigo = 'PROPIO'), 6, 69961, 'Mantención menor', 'transferencia', false),
(33, '2026-09-15', 'egreso', 1, (select id from tesoreria.fondo where codigo = 'PROPIO'), 7, 26496, 'Reposición de material menor', 'transferencia', false),
(34, '2026-09-13', 'egreso', 1, (select id from tesoreria.fondo where codigo = 'PROPIO'), 9, 50000, 'Cuota al Cuerpo', 'transferencia', false),
(35, '2026-09-04', 'egreso', 1, (select id from tesoreria.fondo where codigo = 'PROPIO'), 10, 27505, 'Gastos administrativos', 'transferencia', false),
(36, '2026-10-18', 'ingreso', 1, (select id from tesoreria.fondo where codigo = 'PROPIO'), 1, 352782, 'Recaudación de cuotas sociales', 'transferencia', false),
(37, '2026-10-25', 'ingreso', 1, (select id from tesoreria.fondo where codigo = 'PROPIO'), 2, 121162, 'Venta de talonarios', 'transferencia', false),
(38, '2026-10-18', 'egreso', 1, (select id from tesoreria.fondo where codigo = 'PROPIO'), 5, 88090, 'Combustible de unidades', 'transferencia', false),
(39, '2026-10-17', 'egreso', 1, (select id from tesoreria.fondo where codigo = 'PROPIO'), 6, 72064, 'Mantención menor', 'transferencia', false),
(40, '2026-10-12', 'egreso', 1, (select id from tesoreria.fondo where codigo = 'PROPIO'), 7, 31255, 'Reposición de material menor', 'transferencia', false),
(41, '2026-10-08', 'egreso', 1, (select id from tesoreria.fondo where codigo = 'PROPIO'), 9, 50000, 'Cuota al Cuerpo', 'transferencia', false),
(42, '2026-10-18', 'egreso', 1, (select id from tesoreria.fondo where codigo = 'PROPIO'), 10, 30314, 'Gastos administrativos', 'transferencia', false),
(43, '2026-10-20', 'egreso', 1, (select id from tesoreria.fondo where codigo = 'PROPIO'), 7, 120000, 'Pago de reparación de material menor', 'transferencia', false),
(44, '2026-10-25', 'egreso', 1, (select id from tesoreria.fondo where codigo = 'PROPIO'), 10, 30000, 'Insumos de aseo', 'efectivo', false);
select setval(pg_get_serial_sequence('tesoreria.movimiento','id'), 44);

-- Recurrentes y escenario de proyección
insert into tesoreria.recurrente (descripcion, tipo, cuenta_id, fondo_id, categoria_id, monto_estimado, frecuencia, dia_mes, desde) values ('Cuotas sociales mensuales', 'ingreso', 1, (select id from tesoreria.fondo where codigo = 'PROPIO'), 1, 360000, 'mensual', 5, '2026-01-01');
insert into tesoreria.recurrente (descripcion, tipo, cuenta_id, fondo_id, categoria_id, monto_estimado, frecuencia, dia_mes, desde) values ('Combustible mensual', 'egreso', 1, (select id from tesoreria.fondo where codigo = 'PROPIO'), 5, 95000, 'mensual', 5, '2026-01-01');
insert into tesoreria.recurrente (descripcion, tipo, cuenta_id, fondo_id, categoria_id, monto_estimado, frecuencia, dia_mes, desde) values ('Gastos administrativos', 'egreso', 1, (select id from tesoreria.fondo where codigo = 'PROPIO'), 10, 35000, 'mensual', 5, '2026-01-01');
insert into tesoreria.recurrente (descripcion, tipo, cuenta_id, fondo_id, categoria_id, monto_estimado, frecuencia, dia_mes, desde) values ('Seguro anual de unidades', 'egreso', 1, (select id from tesoreria.fondo where codigo = 'PROPIO'), 8, 450000, 'anual', 1, '2026-01-01');
insert into tesoreria.escenario (id, nombre, descripcion) overriding system value values (1, 'Base', 'Escenario con los valores actuales.');
insert into tesoreria.escenario (id, nombre, descripcion) overriding system value values (2, 'Optimista', 'Escenario con mayor recaudación.');
insert into tesoreria.escenario_ajuste (escenario_id, mes, categoria_id, tipo, monto, descripcion) values (2, '2026-11-01', 1, 'ingreso', 60000, 'Mayor recaudación esperada');
insert into tesoreria.escenario_ajuste (escenario_id, mes, categoria_id, tipo, monto, descripcion) values (2, '2026-12-01', 1, 'ingreso', 60000, 'Mayor recaudación esperada');
select setval(pg_get_serial_sequence('tesoreria.escenario','id'), 2);

-- Cuotas sociales
insert into tesoreria.cuota_valor (anio, monto, vigente_desde) values (2026, 3000, '2026-01-01');
insert into tesoreria.cuota_pago (persona_id, periodo, monto) values ('e58014ec-d954-5bde-8fd9-655529ac50eb', '2026-01-01', 3000),
('e58014ec-d954-5bde-8fd9-655529ac50eb', '2026-02-01', 3000),
('e58014ec-d954-5bde-8fd9-655529ac50eb', '2026-03-01', 3000),
('e58014ec-d954-5bde-8fd9-655529ac50eb', '2026-04-01', 3000),
('e58014ec-d954-5bde-8fd9-655529ac50eb', '2026-05-01', 3000),
('e58014ec-d954-5bde-8fd9-655529ac50eb', '2026-06-01', 3000),
('e58014ec-d954-5bde-8fd9-655529ac50eb', '2026-07-01', 3000),
('e58014ec-d954-5bde-8fd9-655529ac50eb', '2026-08-01', 3000),
('e58014ec-d954-5bde-8fd9-655529ac50eb', '2026-10-01', 3000),
('20fb4035-3feb-58da-a9ab-77df01ce6a8e', '2026-01-01', 3000),
('20fb4035-3feb-58da-a9ab-77df01ce6a8e', '2026-02-01', 3000),
('20fb4035-3feb-58da-a9ab-77df01ce6a8e', '2026-03-01', 3000),
('20fb4035-3feb-58da-a9ab-77df01ce6a8e', '2026-04-01', 3000),
('20fb4035-3feb-58da-a9ab-77df01ce6a8e', '2026-05-01', 3000),
('20fb4035-3feb-58da-a9ab-77df01ce6a8e', '2026-06-01', 3000),
('20fb4035-3feb-58da-a9ab-77df01ce6a8e', '2026-07-01', 3000),
('20fb4035-3feb-58da-a9ab-77df01ce6a8e', '2026-08-01', 3000),
('20fb4035-3feb-58da-a9ab-77df01ce6a8e', '2026-09-01', 3000),
('20fb4035-3feb-58da-a9ab-77df01ce6a8e', '2026-10-01', 3000),
('2c27012d-f957-58be-aa9e-7c4cd2355b18', '2026-01-01', 3000),
('2c27012d-f957-58be-aa9e-7c4cd2355b18', '2026-02-01', 3000),
('2c27012d-f957-58be-aa9e-7c4cd2355b18', '2026-03-01', 3000),
('2c27012d-f957-58be-aa9e-7c4cd2355b18', '2026-04-01', 3000),
('2c27012d-f957-58be-aa9e-7c4cd2355b18', '2026-05-01', 3000),
('2c27012d-f957-58be-aa9e-7c4cd2355b18', '2026-06-01', 3000),
('2c27012d-f957-58be-aa9e-7c4cd2355b18', '2026-07-01', 3000),
('2c27012d-f957-58be-aa9e-7c4cd2355b18', '2026-08-01', 3000),
('2c27012d-f957-58be-aa9e-7c4cd2355b18', '2026-09-01', 3000),
('2c27012d-f957-58be-aa9e-7c4cd2355b18', '2026-10-01', 3000),
('4345e829-8b8a-5149-90b2-810ee247e60a', '2026-01-01', 3000),
('4345e829-8b8a-5149-90b2-810ee247e60a', '2026-02-01', 3000),
('4345e829-8b8a-5149-90b2-810ee247e60a', '2026-03-01', 3000),
('4345e829-8b8a-5149-90b2-810ee247e60a', '2026-04-01', 3000),
('4345e829-8b8a-5149-90b2-810ee247e60a', '2026-08-01', 3000),
('4345e829-8b8a-5149-90b2-810ee247e60a', '2026-09-01', 3000),
('4345e829-8b8a-5149-90b2-810ee247e60a', '2026-10-01', 3000),
('c1e20062-0df0-528a-85fd-03ac52aa9158', '2026-01-01', 3000),
('c1e20062-0df0-528a-85fd-03ac52aa9158', '2026-02-01', 3000),
('c1e20062-0df0-528a-85fd-03ac52aa9158', '2026-03-01', 3000),
('c1e20062-0df0-528a-85fd-03ac52aa9158', '2026-04-01', 3000),
('c1e20062-0df0-528a-85fd-03ac52aa9158', '2026-06-01', 3000),
('c1e20062-0df0-528a-85fd-03ac52aa9158', '2026-08-01', 3000),
('c1e20062-0df0-528a-85fd-03ac52aa9158', '2026-09-01', 3000),
('c1e20062-0df0-528a-85fd-03ac52aa9158', '2026-10-01', 3000),
('e87444d3-a2a6-5222-af23-a3292cd4842c', '2026-02-01', 3000),
('e87444d3-a2a6-5222-af23-a3292cd4842c', '2026-03-01', 3000),
('e87444d3-a2a6-5222-af23-a3292cd4842c', '2026-04-01', 3000),
('e87444d3-a2a6-5222-af23-a3292cd4842c', '2026-06-01', 3000),
('e87444d3-a2a6-5222-af23-a3292cd4842c', '2026-07-01', 3000),
('e87444d3-a2a6-5222-af23-a3292cd4842c', '2026-08-01', 3000),
('e87444d3-a2a6-5222-af23-a3292cd4842c', '2026-09-01', 3000),
('e87444d3-a2a6-5222-af23-a3292cd4842c', '2026-10-01', 3000),
('dee56da3-9c6b-5091-9d8e-32e95ca908e3', '2026-01-01', 3000),
('dee56da3-9c6b-5091-9d8e-32e95ca908e3', '2026-02-01', 3000),
('dee56da3-9c6b-5091-9d8e-32e95ca908e3', '2026-03-01', 3000),
('dee56da3-9c6b-5091-9d8e-32e95ca908e3', '2026-04-01', 3000),
('dee56da3-9c6b-5091-9d8e-32e95ca908e3', '2026-05-01', 3000),
('dee56da3-9c6b-5091-9d8e-32e95ca908e3', '2026-06-01', 3000),
('dee56da3-9c6b-5091-9d8e-32e95ca908e3', '2026-07-01', 3000),
('dee56da3-9c6b-5091-9d8e-32e95ca908e3', '2026-08-01', 3000),
('dee56da3-9c6b-5091-9d8e-32e95ca908e3', '2026-09-01', 3000),
('dee56da3-9c6b-5091-9d8e-32e95ca908e3', '2026-10-01', 3000),
('8f8831d0-40e9-5d41-ada6-aed4cda2a60f', '2026-01-01', 3000),
('8f8831d0-40e9-5d41-ada6-aed4cda2a60f', '2026-02-01', 3000),
('8f8831d0-40e9-5d41-ada6-aed4cda2a60f', '2026-03-01', 3000),
('8f8831d0-40e9-5d41-ada6-aed4cda2a60f', '2026-04-01', 3000),
('8f8831d0-40e9-5d41-ada6-aed4cda2a60f', '2026-05-01', 3000),
('8f8831d0-40e9-5d41-ada6-aed4cda2a60f', '2026-06-01', 3000),
('8f8831d0-40e9-5d41-ada6-aed4cda2a60f', '2026-07-01', 3000),
('8f8831d0-40e9-5d41-ada6-aed4cda2a60f', '2026-08-01', 3000),
('8f8831d0-40e9-5d41-ada6-aed4cda2a60f', '2026-09-01', 3000),
('8f8831d0-40e9-5d41-ada6-aed4cda2a60f', '2026-10-01', 3000),
('7a5efba2-1e47-51a1-bff9-7045345a182d', '2026-01-01', 3000),
('7a5efba2-1e47-51a1-bff9-7045345a182d', '2026-02-01', 3000),
('7a5efba2-1e47-51a1-bff9-7045345a182d', '2026-03-01', 3000),
('7a5efba2-1e47-51a1-bff9-7045345a182d', '2026-04-01', 3000),
('7a5efba2-1e47-51a1-bff9-7045345a182d', '2026-05-01', 3000),
('7a5efba2-1e47-51a1-bff9-7045345a182d', '2026-06-01', 3000),
('7a5efba2-1e47-51a1-bff9-7045345a182d', '2026-07-01', 3000),
('7a5efba2-1e47-51a1-bff9-7045345a182d', '2026-09-01', 3000),
('7a5efba2-1e47-51a1-bff9-7045345a182d', '2026-10-01', 3000),
('87585a59-cd24-5815-bbb7-9b7fbbc01c16', '2026-01-01', 3000),
('87585a59-cd24-5815-bbb7-9b7fbbc01c16', '2026-02-01', 3000),
('87585a59-cd24-5815-bbb7-9b7fbbc01c16', '2026-03-01', 3000),
('87585a59-cd24-5815-bbb7-9b7fbbc01c16', '2026-04-01', 3000),
('87585a59-cd24-5815-bbb7-9b7fbbc01c16', '2026-05-01', 3000),
('87585a59-cd24-5815-bbb7-9b7fbbc01c16', '2026-06-01', 3000),
('87585a59-cd24-5815-bbb7-9b7fbbc01c16', '2026-07-01', 3000),
('87585a59-cd24-5815-bbb7-9b7fbbc01c16', '2026-08-01', 3000),
('87585a59-cd24-5815-bbb7-9b7fbbc01c16', '2026-09-01', 3000),
('87585a59-cd24-5815-bbb7-9b7fbbc01c16', '2026-10-01', 3000),
('a5ac36f5-693c-55b3-81b1-c1535a355af7', '2026-01-01', 3000),
('a5ac36f5-693c-55b3-81b1-c1535a355af7', '2026-02-01', 3000),
('a5ac36f5-693c-55b3-81b1-c1535a355af7', '2026-03-01', 3000),
('a5ac36f5-693c-55b3-81b1-c1535a355af7', '2026-04-01', 3000),
('a5ac36f5-693c-55b3-81b1-c1535a355af7', '2026-05-01', 3000),
('a5ac36f5-693c-55b3-81b1-c1535a355af7', '2026-06-01', 3000),
('a5ac36f5-693c-55b3-81b1-c1535a355af7', '2026-08-01', 3000),
('a5ac36f5-693c-55b3-81b1-c1535a355af7', '2026-09-01', 3000),
('a5ac36f5-693c-55b3-81b1-c1535a355af7', '2026-10-01', 3000),
('719c8def-873f-50f2-83c4-7006e03ceb8c', '2026-01-01', 3000),
('719c8def-873f-50f2-83c4-7006e03ceb8c', '2026-02-01', 3000),
('719c8def-873f-50f2-83c4-7006e03ceb8c', '2026-03-01', 3000),
('719c8def-873f-50f2-83c4-7006e03ceb8c', '2026-04-01', 3000),
('719c8def-873f-50f2-83c4-7006e03ceb8c', '2026-05-01', 3000),
('719c8def-873f-50f2-83c4-7006e03ceb8c', '2026-06-01', 3000),
('719c8def-873f-50f2-83c4-7006e03ceb8c', '2026-07-01', 3000),
('719c8def-873f-50f2-83c4-7006e03ceb8c', '2026-08-01', 3000),
('719c8def-873f-50f2-83c4-7006e03ceb8c', '2026-09-01', 3000),
('719c8def-873f-50f2-83c4-7006e03ceb8c', '2026-10-01', 3000),
('8b8a4e76-f7f1-5fab-af6d-9a13dbe20dd5', '2026-01-01', 3000),
('8b8a4e76-f7f1-5fab-af6d-9a13dbe20dd5', '2026-02-01', 3000),
('8b8a4e76-f7f1-5fab-af6d-9a13dbe20dd5', '2026-03-01', 3000),
('8b8a4e76-f7f1-5fab-af6d-9a13dbe20dd5', '2026-05-01', 3000),
('8b8a4e76-f7f1-5fab-af6d-9a13dbe20dd5', '2026-07-01', 3000),
('8b8a4e76-f7f1-5fab-af6d-9a13dbe20dd5', '2026-08-01', 3000),
('8b8a4e76-f7f1-5fab-af6d-9a13dbe20dd5', '2026-09-01', 3000),
('8b8a4e76-f7f1-5fab-af6d-9a13dbe20dd5', '2026-10-01', 3000),
('d5bb007f-958d-5c73-ac74-2abbcc9606dd', '2026-02-01', 3000),
('d5bb007f-958d-5c73-ac74-2abbcc9606dd', '2026-03-01', 3000),
('d5bb007f-958d-5c73-ac74-2abbcc9606dd', '2026-04-01', 3000),
('d5bb007f-958d-5c73-ac74-2abbcc9606dd', '2026-05-01', 3000),
('d5bb007f-958d-5c73-ac74-2abbcc9606dd', '2026-06-01', 3000),
('d5bb007f-958d-5c73-ac74-2abbcc9606dd', '2026-07-01', 3000),
('d5bb007f-958d-5c73-ac74-2abbcc9606dd', '2026-08-01', 3000),
('d5bb007f-958d-5c73-ac74-2abbcc9606dd', '2026-09-01', 3000),
('d5bb007f-958d-5c73-ac74-2abbcc9606dd', '2026-10-01', 3000),
('6a523054-722b-5663-bb5e-7cec43e71400', '2026-01-01', 3000),
('6a523054-722b-5663-bb5e-7cec43e71400', '2026-02-01', 3000),
('6a523054-722b-5663-bb5e-7cec43e71400', '2026-04-01', 3000),
('6a523054-722b-5663-bb5e-7cec43e71400', '2026-05-01', 3000),
('6a523054-722b-5663-bb5e-7cec43e71400', '2026-07-01', 3000),
('6a523054-722b-5663-bb5e-7cec43e71400', '2026-08-01', 3000),
('6a523054-722b-5663-bb5e-7cec43e71400', '2026-09-01', 3000),
('6a523054-722b-5663-bb5e-7cec43e71400', '2026-10-01', 3000),
('6961e3db-e3cc-5a18-a7ec-47c623cd734a', '2026-01-01', 3000),
('6961e3db-e3cc-5a18-a7ec-47c623cd734a', '2026-02-01', 3000),
('6961e3db-e3cc-5a18-a7ec-47c623cd734a', '2026-03-01', 3000),
('6961e3db-e3cc-5a18-a7ec-47c623cd734a', '2026-04-01', 3000),
('6961e3db-e3cc-5a18-a7ec-47c623cd734a', '2026-06-01', 3000),
('6961e3db-e3cc-5a18-a7ec-47c623cd734a', '2026-07-01', 3000),
('6961e3db-e3cc-5a18-a7ec-47c623cd734a', '2026-08-01', 3000),
('6961e3db-e3cc-5a18-a7ec-47c623cd734a', '2026-09-01', 3000),
('518e32ec-a189-5ace-a6dc-841a2e136245', '2026-01-01', 3000),
('518e32ec-a189-5ace-a6dc-841a2e136245', '2026-04-01', 3000),
('518e32ec-a189-5ace-a6dc-841a2e136245', '2026-05-01', 3000),
('518e32ec-a189-5ace-a6dc-841a2e136245', '2026-06-01', 3000),
('518e32ec-a189-5ace-a6dc-841a2e136245', '2026-07-01', 3000),
('518e32ec-a189-5ace-a6dc-841a2e136245', '2026-08-01', 3000),
('518e32ec-a189-5ace-a6dc-841a2e136245', '2026-09-01', 3000),
('b8cd318d-ced4-56d5-ad1d-10ecff64f64b', '2026-01-01', 3000),
('b8cd318d-ced4-56d5-ad1d-10ecff64f64b', '2026-02-01', 3000),
('b8cd318d-ced4-56d5-ad1d-10ecff64f64b', '2026-03-01', 3000),
('b8cd318d-ced4-56d5-ad1d-10ecff64f64b', '2026-04-01', 3000),
('b8cd318d-ced4-56d5-ad1d-10ecff64f64b', '2026-05-01', 3000),
('b8cd318d-ced4-56d5-ad1d-10ecff64f64b', '2026-06-01', 3000),
('b8cd318d-ced4-56d5-ad1d-10ecff64f64b', '2026-07-01', 3000),
('b8cd318d-ced4-56d5-ad1d-10ecff64f64b', '2026-09-01', 3000),
('b8cd318d-ced4-56d5-ad1d-10ecff64f64b', '2026-10-01', 3000),
('6252616f-a023-543e-9845-044ededfea05', '2026-01-01', 3000),
('6252616f-a023-543e-9845-044ededfea05', '2026-02-01', 3000),
('6252616f-a023-543e-9845-044ededfea05', '2026-03-01', 3000),
('6252616f-a023-543e-9845-044ededfea05', '2026-04-01', 3000),
('6252616f-a023-543e-9845-044ededfea05', '2026-05-01', 3000),
('6252616f-a023-543e-9845-044ededfea05', '2026-06-01', 3000),
('6252616f-a023-543e-9845-044ededfea05', '2026-08-01', 3000),
('6252616f-a023-543e-9845-044ededfea05', '2026-10-01', 3000),
('0d0f33f5-6711-5d14-abfe-00a32dc594a2', '2026-01-01', 3000),
('0d0f33f5-6711-5d14-abfe-00a32dc594a2', '2026-02-01', 3000),
('0d0f33f5-6711-5d14-abfe-00a32dc594a2', '2026-03-01', 3000),
('0d0f33f5-6711-5d14-abfe-00a32dc594a2', '2026-04-01', 3000),
('0d0f33f5-6711-5d14-abfe-00a32dc594a2', '2026-05-01', 3000),
('0d0f33f5-6711-5d14-abfe-00a32dc594a2', '2026-06-01', 3000),
('0d0f33f5-6711-5d14-abfe-00a32dc594a2', '2026-07-01', 3000),
('0d0f33f5-6711-5d14-abfe-00a32dc594a2', '2026-08-01', 3000),
('99e3978a-5008-588d-93a1-e45e28c81702', '2026-01-01', 3000),
('99e3978a-5008-588d-93a1-e45e28c81702', '2026-02-01', 3000),
('99e3978a-5008-588d-93a1-e45e28c81702', '2026-03-01', 3000),
('99e3978a-5008-588d-93a1-e45e28c81702', '2026-04-01', 3000),
('99e3978a-5008-588d-93a1-e45e28c81702', '2026-05-01', 3000),
('99e3978a-5008-588d-93a1-e45e28c81702', '2026-06-01', 3000),
('99e3978a-5008-588d-93a1-e45e28c81702', '2026-07-01', 3000),
('99e3978a-5008-588d-93a1-e45e28c81702', '2026-08-01', 3000),
('99e3978a-5008-588d-93a1-e45e28c81702', '2026-09-01', 3000),
('99e3978a-5008-588d-93a1-e45e28c81702', '2026-10-01', 3000),
('cbd0661d-8815-5999-ab79-bd785dcf3f3b', '2026-01-01', 3000),
('cbd0661d-8815-5999-ab79-bd785dcf3f3b', '2026-02-01', 3000),
('cbd0661d-8815-5999-ab79-bd785dcf3f3b', '2026-03-01', 3000),
('cbd0661d-8815-5999-ab79-bd785dcf3f3b', '2026-05-01', 3000),
('cbd0661d-8815-5999-ab79-bd785dcf3f3b', '2026-06-01', 3000),
('cbd0661d-8815-5999-ab79-bd785dcf3f3b', '2026-07-01', 3000),
('cbd0661d-8815-5999-ab79-bd785dcf3f3b', '2026-08-01', 3000),
('cbd0661d-8815-5999-ab79-bd785dcf3f3b', '2026-10-01', 3000),
('5734d562-6470-5225-9137-6c4023409340', '2026-01-01', 3000),
('5734d562-6470-5225-9137-6c4023409340', '2026-02-01', 3000),
('5734d562-6470-5225-9137-6c4023409340', '2026-03-01', 3000),
('5734d562-6470-5225-9137-6c4023409340', '2026-04-01', 3000),
('5734d562-6470-5225-9137-6c4023409340', '2026-05-01', 3000),
('5734d562-6470-5225-9137-6c4023409340', '2026-07-01', 3000),
('5734d562-6470-5225-9137-6c4023409340', '2026-08-01', 3000),
('5734d562-6470-5225-9137-6c4023409340', '2026-09-01', 3000),
('5734d562-6470-5225-9137-6c4023409340', '2026-10-01', 3000),
('344dedc7-32e5-5d5f-a848-7fb592111bf1', '2026-01-01', 3000),
('344dedc7-32e5-5d5f-a848-7fb592111bf1', '2026-02-01', 3000),
('344dedc7-32e5-5d5f-a848-7fb592111bf1', '2026-03-01', 3000),
('344dedc7-32e5-5d5f-a848-7fb592111bf1', '2026-04-01', 3000),
('344dedc7-32e5-5d5f-a848-7fb592111bf1', '2026-05-01', 3000),
('344dedc7-32e5-5d5f-a848-7fb592111bf1', '2026-06-01', 3000),
('344dedc7-32e5-5d5f-a848-7fb592111bf1', '2026-07-01', 3000),
('344dedc7-32e5-5d5f-a848-7fb592111bf1', '2026-08-01', 3000),
('344dedc7-32e5-5d5f-a848-7fb592111bf1', '2026-09-01', 3000),
('344dedc7-32e5-5d5f-a848-7fb592111bf1', '2026-10-01', 3000);

-- Cierre mensual de septiembre
insert into tesoreria.cierre_mensual (periodo, cuenta_id, saldo_cartola, saldo_libro, cheques_no_cobrados, observacion) values ('2026-09-01', 1, 4850000, 4850000, 0, 'Cierre ficticio de septiembre');

-- Campaña 2025
insert into tesoreria.campana (id, anio, meta, valor_talonario, acta_id) overriding system value values (1, 2025, 2000000, 1000, 2);
insert into tesoreria.campana_participacion (campana_id, persona_id, venta_total, aporte_obligatorio, aporte_adicional, saldo_arrastre, observacion) values (1, 'e58014ec-d954-5bde-8fd9-655529ac50eb', 16000, 14391, 24827, 9939, 'Dato ficticio');
insert into tesoreria.campana_participacion (campana_id, persona_id, venta_total, aporte_obligatorio, aporte_adicional, saldo_arrastre, observacion) values (1, '20fb4035-3feb-58da-a9ab-77df01ce6a8e', 31000, 16475, 13778, 6886, 'Dato ficticio');
insert into tesoreria.campana_participacion (campana_id, persona_id, venta_total, aporte_obligatorio, aporte_adicional, saldo_arrastre, observacion) values (1, '2c27012d-f957-58be-aa9e-7c4cd2355b18', 9000, 5756, 4208, 7959, 'Dato ficticio');
insert into tesoreria.campana_participacion (campana_id, persona_id, venta_total, aporte_obligatorio, aporte_adicional, saldo_arrastre, observacion) values (1, '17f48af4-6fc3-5512-b003-ba76920910ff', 44000, 6167, 26035, 11396, 'Dato ficticio');
insert into tesoreria.campana_participacion (campana_id, persona_id, venta_total, aporte_obligatorio, aporte_adicional, saldo_arrastre, observacion) values (1, '4345e829-8b8a-5149-90b2-810ee247e60a', 55000, 19655, 8786, 755, 'Dato ficticio');
insert into tesoreria.campana_participacion (campana_id, persona_id, venta_total, aporte_obligatorio, aporte_adicional, saldo_arrastre, observacion) values (1, 'c1e20062-0df0-528a-85fd-03ac52aa9158', 8000, 11349, 5588, 1578, 'Dato ficticio');
insert into tesoreria.campana_participacion (campana_id, persona_id, venta_total, aporte_obligatorio, aporte_adicional, saldo_arrastre, observacion) values (1, 'e87444d3-a2a6-5222-af23-a3292cd4842c', 44000, 2652, 6121, 8000, 'Dato ficticio');
insert into tesoreria.campana_participacion (campana_id, persona_id, venta_total, aporte_obligatorio, aporte_adicional, saldo_arrastre, observacion) values (1, 'dee56da3-9c6b-5091-9d8e-32e95ca908e3', 31000, 10475, 27018, 4999, 'Dato ficticio');
insert into tesoreria.campana_participacion (campana_id, persona_id, venta_total, aporte_obligatorio, aporte_adicional, saldo_arrastre, observacion) values (1, '8f8831d0-40e9-5d41-ada6-aed4cda2a60f', 8000, 14307, 4527, 755, 'Dato ficticio');
insert into tesoreria.campana_participacion (campana_id, persona_id, venta_total, aporte_obligatorio, aporte_adicional, saldo_arrastre, observacion) values (1, '7a5efba2-1e47-51a1-bff9-7045345a182d', 38000, 4138, 13660, 9461, 'Dato ficticio');
insert into tesoreria.campana_participacion (campana_id, persona_id, venta_total, aporte_obligatorio, aporte_adicional, saldo_arrastre, observacion) values (1, '2b273959-45fa-5c61-b757-359a169f2e1e', 48000, 16638, 5354, 2969, 'Dato ficticio');
insert into tesoreria.campana_participacion (campana_id, persona_id, venta_total, aporte_obligatorio, aporte_adicional, saldo_arrastre, observacion) values (1, '87585a59-cd24-5815-bbb7-9b7fbbc01c16', 15000, 8794, 16287, 12538, 'Dato ficticio');
insert into tesoreria.campana_participacion (campana_id, persona_id, venta_total, aporte_obligatorio, aporte_adicional, saldo_arrastre, observacion) values (1, 'a5ac36f5-693c-55b3-81b1-c1535a355af7', 53000, 8744, 19208, 9050, 'Dato ficticio');
insert into tesoreria.campana_participacion (campana_id, persona_id, venta_total, aporte_obligatorio, aporte_adicional, saldo_arrastre, observacion) values (1, '719c8def-873f-50f2-83c4-7006e03ceb8c', 17000, 15645, 7796, 9646, 'Dato ficticio');
insert into tesoreria.campana_participacion (campana_id, persona_id, venta_total, aporte_obligatorio, aporte_adicional, saldo_arrastre, observacion) values (1, '8b8a4e76-f7f1-5fab-af6d-9a13dbe20dd5', 35000, 19750, 27856, 8933, 'Dato ficticio');
insert into tesoreria.campana_participacion (campana_id, persona_id, venta_total, aporte_obligatorio, aporte_adicional, saldo_arrastre, observacion) values (1, 'd5bb007f-958d-5c73-ac74-2abbcc9606dd', 48000, 10190, 24010, 10735, 'Dato ficticio');
insert into tesoreria.campana_participacion (campana_id, persona_id, venta_total, aporte_obligatorio, aporte_adicional, saldo_arrastre, observacion) values (1, '6a523054-722b-5663-bb5e-7cec43e71400', 36000, 10114, 3657, 8144, 'Dato ficticio');
insert into tesoreria.campana_participacion (campana_id, persona_id, venta_total, aporte_obligatorio, aporte_adicional, saldo_arrastre, observacion) values (1, '186fc2b3-89cd-5b37-b106-78d29bc1a104', 30000, 18758, 24829, 11131, 'Dato ficticio');
insert into tesoreria.campana_participacion (campana_id, persona_id, venta_total, aporte_obligatorio, aporte_adicional, saldo_arrastre, observacion) values (1, '6961e3db-e3cc-5a18-a7ec-47c623cd734a', 50000, 14876, 28492, 10127, 'Dato ficticio');
insert into tesoreria.campana_participacion (campana_id, persona_id, venta_total, aporte_obligatorio, aporte_adicional, saldo_arrastre, observacion) values (1, '518e32ec-a189-5ace-a6dc-841a2e136245', 55000, 12580, 29429, 4645, 'Dato ficticio');
select setval(pg_get_serial_sequence('tesoreria.campana','id'), 1);

-- Donaciones y beneficios
insert into nucleo.contraparte (tipo, nombre) values ('donante', 'Donante ficticio 1') on conflict do nothing;
insert into nucleo.contraparte (tipo, nombre) values ('donante', 'Donante ficticio 2') on conflict do nothing;
insert into nucleo.contraparte (tipo, nombre) values ('donante', 'Donante ficticio 3') on conflict do nothing;
insert into tesoreria.beneficio (nombre, descripcion, monto, activo) values ('Ayuda de sepelio', 'Beneficio ficticio para socios', 300000, true),('Beca de formación', 'Apoyo a cursos ANB', 150000, true);

-- Antigüedad manual, exenciones y códigos Charlie
update personal.persona set anios_servicio_manual = 12, exento_guardia = false where id = 'e58014ec-d954-5bde-8fd9-655529ac50eb';
update personal.persona set codigo_charlie = 'CH-201' where id = 'e58014ec-d954-5bde-8fd9-655529ac50eb';
update personal.persona set codigo_charlie = 'CH-202' where id = '20fb4035-3feb-58da-a9ab-77df01ce6a8e';
update personal.persona set codigo_charlie = 'CH-203' where id = '2c27012d-f957-58be-aa9e-7c4cd2355b18';
update personal.persona set codigo_charlie = 'CH-204' where id = '17f48af4-6fc3-5512-b003-ba76920910ff';
update personal.persona set exento_guardia = true, motivo_exencion = 'Miembro Honorario del Directorio General' where id = '4345e829-8b8a-5149-90b2-810ee247e60a';
update personal.persona set anios_servicio_manual = 18, exento_guardia = false where id = 'e87444d3-a2a6-5222-af23-a3292cd4842c';
update personal.persona set anios_servicio_manual = 24, exento_guardia = false where id = 'a5ac36f5-693c-55b3-81b1-c1535a355af7';
update personal.persona set exento_guardia = true, motivo_exencion = 'Miembro Honorario del Directorio General' where id = 'd5bb007f-958d-5c73-ac74-2abbcc9606dd';
update personal.persona set anios_servicio_manual = 30, exento_guardia = false where id = '6961e3db-e3cc-5a18-a7ec-47c623cd734a';
update personal.persona set anios_servicio_manual = 36, exento_guardia = false where id = 'dd6e2df9-978b-521f-8271-c8b87df4af97';
update personal.persona set exento_guardia = true, motivo_exencion = 'Miembro Honorario del Directorio General' where id = '5734d562-6470-5225-9137-6c4023409340';
update personal.persona set codigo_charlie = 'CH-209' where id = '8f8831d0-40e9-5d41-ada6-aed4cda2a60f';
update personal.persona set codigo_charlie = 'CH-214' where id = '719c8def-873f-50f2-83c4-7006e03ceb8c';

-- Abonos de antigüedad
insert into personal.antiguedad_abono (persona_id, anios, fecha, motivo, resolucion) values ('2c27012d-f957-58be-aa9e-7c4cd2355b18', 1, '2025-03-01', 'Abono por servicio en otra compañía', 'Acta de Oficiales N° 12/2025');
insert into personal.antiguedad_abono (persona_id, anios, fecha, motivo, resolucion) values ('dee56da3-9c6b-5091-9d8e-32e95ca908e3', 1.5, '2025-03-01', 'Abono por servicio en otra compañía', 'Acta de Oficiales N° 12/2025');
insert into personal.antiguedad_abono (persona_id, anios, fecha, motivo, resolucion) values ('8b8a4e76-f7f1-5fab-af6d-9a13dbe20dd5', 1, '2025-03-01', 'Abono por servicio en otra compañía', 'Acta de Oficiales N° 12/2025');

-- Guardias nocturnas históricas (compatibilidad)
insert into operaciones.guardia_turno (id, fecha, tipo, jefe_persona_id, inicio, termino) overriding system value values (1, '2026-08-01', 'nocturna', 'e87444d3-a2a6-5222-af23-a3292cd4842c', '2026-08-01'::timestamptz + interval '23 hours 30 minutes', '2026-08-02'::timestamptz + interval '9 hours 30 minutes');
insert into operaciones.guardia_integrante (turno_id, persona_id, funcion, origen, estado) values (1, 'e58014ec-d954-5bde-8fd9-655529ac50eb'::uuid, 'voluntario', 'asignacion_capitania', 'cumplida');
insert into operaciones.guardia_integrante (turno_id, persona_id, funcion, origen, estado) values (1, '20fb4035-3feb-58da-a9ab-77df01ce6a8e'::uuid, 'voluntario', 'asignacion_capitania', 'cumplida');
insert into operaciones.guardia_integrante (turno_id, persona_id, funcion, origen, estado) values (1, '2c27012d-f957-58be-aa9e-7c4cd2355b18'::uuid, 'voluntario', 'asignacion_capitania', 'cumplida');
insert into operaciones.guardia_integrante (turno_id, persona_id, funcion, origen, estado) values (1, '17f48af4-6fc3-5512-b003-ba76920910ff'::uuid, 'voluntario', 'asignacion_capitania', 'cumplida');
insert into operaciones.guardia_turno (id, fecha, tipo, jefe_persona_id, inicio, termino) overriding system value values (2, '2026-08-08', 'nocturna', 'dee56da3-9c6b-5091-9d8e-32e95ca908e3', '2026-08-08'::timestamptz + interval '23 hours 30 minutes', '2026-08-09'::timestamptz + interval '9 hours 30 minutes');
insert into operaciones.guardia_integrante (turno_id, persona_id, funcion, origen, estado) values (2, '20fb4035-3feb-58da-a9ab-77df01ce6a8e'::uuid, 'voluntario', 'asignacion_capitania', 'cumplida');
insert into operaciones.guardia_integrante (turno_id, persona_id, funcion, origen, estado) values (2, '2c27012d-f957-58be-aa9e-7c4cd2355b18'::uuid, 'voluntario', 'asignacion_capitania', 'cumplida');
insert into operaciones.guardia_integrante (turno_id, persona_id, funcion, origen, estado) values (2, '17f48af4-6fc3-5512-b003-ba76920910ff'::uuid, 'voluntario', 'asignacion_capitania', 'cumplida');
insert into operaciones.guardia_integrante (turno_id, persona_id, funcion, origen, estado) values (2, '4345e829-8b8a-5149-90b2-810ee247e60a'::uuid, 'voluntario', 'asignacion_capitania', 'cumplida');
insert into operaciones.guardia_turno (id, fecha, tipo, jefe_persona_id, inicio, termino) overriding system value values (3, '2026-08-15', 'nocturna', '8f8831d0-40e9-5d41-ada6-aed4cda2a60f', '2026-08-15'::timestamptz + interval '23 hours 30 minutes', '2026-08-16'::timestamptz + interval '9 hours 30 minutes');
insert into operaciones.guardia_integrante (turno_id, persona_id, funcion, origen, estado) values (3, '2c27012d-f957-58be-aa9e-7c4cd2355b18'::uuid, 'voluntario', 'asignacion_capitania', 'cumplida');
insert into operaciones.guardia_integrante (turno_id, persona_id, funcion, origen, estado) values (3, '17f48af4-6fc3-5512-b003-ba76920910ff'::uuid, 'voluntario', 'asignacion_capitania', 'cumplida');
insert into operaciones.guardia_integrante (turno_id, persona_id, funcion, origen, estado) values (3, '4345e829-8b8a-5149-90b2-810ee247e60a'::uuid, 'voluntario', 'asignacion_capitania', 'cumplida');
insert into operaciones.guardia_integrante (turno_id, persona_id, funcion, origen, estado) values (3, 'c1e20062-0df0-528a-85fd-03ac52aa9158'::uuid, 'voluntario', 'asignacion_capitania', 'cumplida');
insert into operaciones.guardia_turno (id, fecha, tipo, jefe_persona_id, inicio, termino) overriding system value values (4, '2026-08-22', 'nocturna', '7a5efba2-1e47-51a1-bff9-7045345a182d', '2026-08-22'::timestamptz + interval '23 hours 30 minutes', '2026-08-23'::timestamptz + interval '9 hours 30 minutes');
insert into operaciones.guardia_integrante (turno_id, persona_id, funcion, origen, estado) values (4, '17f48af4-6fc3-5512-b003-ba76920910ff'::uuid, 'voluntario', 'asignacion_capitania', 'cumplida');
insert into operaciones.guardia_integrante (turno_id, persona_id, funcion, origen, estado) values (4, '4345e829-8b8a-5149-90b2-810ee247e60a'::uuid, 'voluntario', 'asignacion_capitania', 'cumplida');
insert into operaciones.guardia_integrante (turno_id, persona_id, funcion, origen, estado) values (4, 'c1e20062-0df0-528a-85fd-03ac52aa9158'::uuid, 'voluntario', 'asignacion_capitania', 'cumplida');
insert into operaciones.guardia_integrante (turno_id, persona_id, funcion, origen, estado) values (4, 'e87444d3-a2a6-5222-af23-a3292cd4842c'::uuid, 'voluntario', 'asignacion_capitania', 'cumplida');
insert into operaciones.guardia_turno (id, fecha, tipo, jefe_persona_id, inicio, termino) overriding system value values (5, '2026-08-29', 'nocturna', '2b273959-45fa-5c61-b757-359a169f2e1e', '2026-08-29'::timestamptz + interval '23 hours 30 minutes', '2026-08-30'::timestamptz + interval '9 hours 30 minutes');
insert into operaciones.guardia_integrante (turno_id, persona_id, funcion, origen, estado) values (5, '4345e829-8b8a-5149-90b2-810ee247e60a'::uuid, 'voluntario', 'asignacion_capitania', 'cumplida');
insert into operaciones.guardia_integrante (turno_id, persona_id, funcion, origen, estado) values (5, 'c1e20062-0df0-528a-85fd-03ac52aa9158'::uuid, 'voluntario', 'asignacion_capitania', 'cumplida');
insert into operaciones.guardia_integrante (turno_id, persona_id, funcion, origen, estado) values (5, 'e87444d3-a2a6-5222-af23-a3292cd4842c'::uuid, 'voluntario', 'asignacion_capitania', 'cumplida');
insert into operaciones.guardia_integrante (turno_id, persona_id, funcion, origen, estado) values (5, 'dee56da3-9c6b-5091-9d8e-32e95ca908e3'::uuid, 'voluntario', 'asignacion_capitania', 'cumplida');
insert into operaciones.guardia_turno (id, fecha, tipo, jefe_persona_id, inicio, termino) overriding system value values (6, '2026-09-05', 'nocturna', '87585a59-cd24-5815-bbb7-9b7fbbc01c16', '2026-09-05'::timestamptz + interval '23 hours 30 minutes', '2026-09-06'::timestamptz + interval '9 hours 30 minutes');
insert into operaciones.guardia_integrante (turno_id, persona_id, funcion, origen, estado) values (6, 'c1e20062-0df0-528a-85fd-03ac52aa9158'::uuid, 'voluntario', 'asignacion_capitania', 'cumplida');
insert into operaciones.guardia_integrante (turno_id, persona_id, funcion, origen, estado) values (6, 'e87444d3-a2a6-5222-af23-a3292cd4842c'::uuid, 'voluntario', 'asignacion_capitania', 'cumplida');
insert into operaciones.guardia_integrante (turno_id, persona_id, funcion, origen, estado) values (6, 'dee56da3-9c6b-5091-9d8e-32e95ca908e3'::uuid, 'voluntario', 'asignacion_capitania', 'cumplida');
insert into operaciones.guardia_integrante (turno_id, persona_id, funcion, origen, estado) values (6, '8f8831d0-40e9-5d41-ada6-aed4cda2a60f'::uuid, 'voluntario', 'asignacion_capitania', 'cumplida');
select setval(pg_get_serial_sequence('operaciones.guardia_turno','id'), 6);

-- Ciclo de guardias de 14 días: Semana 1 en curso y Semana 2 abierta
select set_config('request.jwt.claim.role', 'service_role', true); do $$ begin perform operaciones.crear_ciclo_guardia('Ciclo noviembre 2026', '2026-11-16', 3); end $$;
update operaciones.guardia_ciclo set estado = 'en_curso' where fecha_inicio = '2026-11-16';
insert into operaciones.guardia_integrante (turno_id, persona_id, origen, estado) select t.id, 'e58014ec-d954-5bde-8fd9-655529ac50eb'::uuid, 'inscripcion', 'inscrito' from operaciones.guardia_turno t where t.ciclo_id = (select id from operaciones.guardia_ciclo where fecha_inicio = '2026-11-16') and t.fecha = '2026-11-16' on conflict do nothing;
insert into operaciones.guardia_integrante (turno_id, persona_id, origen, estado) select t.id, '20fb4035-3feb-58da-a9ab-77df01ce6a8e'::uuid, 'inscripcion', 'inscrito' from operaciones.guardia_turno t where t.ciclo_id = (select id from operaciones.guardia_ciclo where fecha_inicio = '2026-11-16') and t.fecha = '2026-11-16' on conflict do nothing;
insert into operaciones.guardia_integrante (turno_id, persona_id, origen, estado) select t.id, '2c27012d-f957-58be-aa9e-7c4cd2355b18'::uuid, 'inscripcion', 'inscrito' from operaciones.guardia_turno t where t.ciclo_id = (select id from operaciones.guardia_ciclo where fecha_inicio = '2026-11-16') and t.fecha = '2026-11-16' on conflict do nothing;
insert into operaciones.guardia_integrante (turno_id, persona_id, origen, estado) select t.id, '4345e829-8b8a-5149-90b2-810ee247e60a'::uuid, 'inscripcion', 'inscrito' from operaciones.guardia_turno t where t.ciclo_id = (select id from operaciones.guardia_ciclo where fecha_inicio = '2026-11-16') and t.fecha = '2026-11-17' on conflict do nothing;
insert into operaciones.guardia_integrante (turno_id, persona_id, origen, estado) select t.id, 'c1e20062-0df0-528a-85fd-03ac52aa9158'::uuid, 'inscripcion', 'inscrito' from operaciones.guardia_turno t where t.ciclo_id = (select id from operaciones.guardia_ciclo where fecha_inicio = '2026-11-16') and t.fecha = '2026-11-17' on conflict do nothing;
insert into operaciones.guardia_integrante (turno_id, persona_id, origen, estado) select t.id, 'e87444d3-a2a6-5222-af23-a3292cd4842c'::uuid, 'inscripcion', 'inscrito' from operaciones.guardia_turno t where t.ciclo_id = (select id from operaciones.guardia_ciclo where fecha_inicio = '2026-11-16') and t.fecha = '2026-11-17' on conflict do nothing;
insert into operaciones.guardia_integrante (turno_id, persona_id, origen, estado) select t.id, 'dee56da3-9c6b-5091-9d8e-32e95ca908e3'::uuid, 'inscripcion', 'inscrito' from operaciones.guardia_turno t where t.ciclo_id = (select id from operaciones.guardia_ciclo where fecha_inicio = '2026-11-16') and t.fecha = '2026-11-18' on conflict do nothing;
insert into operaciones.guardia_integrante (turno_id, persona_id, origen, estado) select t.id, '8f8831d0-40e9-5d41-ada6-aed4cda2a60f'::uuid, 'inscripcion', 'inscrito' from operaciones.guardia_turno t where t.ciclo_id = (select id from operaciones.guardia_ciclo where fecha_inicio = '2026-11-16') and t.fecha = '2026-11-19' on conflict do nothing;
insert into operaciones.guardia_integrante (turno_id, persona_id, origen, estado) select t.id, '7a5efba2-1e47-51a1-bff9-7045345a182d'::uuid, 'inscripcion', 'inscrito' from operaciones.guardia_turno t where t.ciclo_id = (select id from operaciones.guardia_ciclo where fecha_inicio = '2026-11-16') and t.fecha = '2026-11-19' on conflict do nothing;
insert into operaciones.guardia_integrante (turno_id, persona_id, origen, estado) select t.id, '87585a59-cd24-5815-bbb7-9b7fbbc01c16'::uuid, 'inscripcion', 'inscrito' from operaciones.guardia_turno t where t.ciclo_id = (select id from operaciones.guardia_ciclo where fecha_inicio = '2026-11-16') and t.fecha = '2026-11-20' on conflict do nothing;
insert into operaciones.guardia_integrante (turno_id, persona_id, origen, estado) select t.id, 'a5ac36f5-693c-55b3-81b1-c1535a355af7'::uuid, 'inscripcion', 'inscrito' from operaciones.guardia_turno t where t.ciclo_id = (select id from operaciones.guardia_ciclo where fecha_inicio = '2026-11-16') and t.fecha = '2026-11-20' on conflict do nothing;
insert into operaciones.guardia_integrante (turno_id, persona_id, origen, estado) select t.id, '719c8def-873f-50f2-83c4-7006e03ceb8c'::uuid, 'inscripcion', 'inscrito' from operaciones.guardia_turno t where t.ciclo_id = (select id from operaciones.guardia_ciclo where fecha_inicio = '2026-11-16') and t.fecha = '2026-11-20' on conflict do nothing;
insert into operaciones.guardia_integrante (turno_id, persona_id, origen, estado) select t.id, '8b8a4e76-f7f1-5fab-af6d-9a13dbe20dd5'::uuid, 'inscripcion', 'inscrito' from operaciones.guardia_turno t where t.ciclo_id = (select id from operaciones.guardia_ciclo where fecha_inicio = '2026-11-16') and t.fecha = '2026-11-22' on conflict do nothing;
insert into operaciones.guardia_integrante (turno_id, persona_id, origen, estado) select t.id, '7a5efba2-1e47-51a1-bff9-7045345a182d'::uuid, 'inscripcion', 'inscrito' from operaciones.guardia_turno t where t.ciclo_id = (select id from operaciones.guardia_ciclo where fecha_inicio = '2026-11-16') and t.fecha = '2026-11-24' on conflict do nothing;
insert into operaciones.guardia_integrante (turno_id, persona_id, origen, estado) select t.id, 'a5ac36f5-693c-55b3-81b1-c1535a355af7'::uuid, 'inscripcion', 'inscrito' from operaciones.guardia_turno t where t.ciclo_id = (select id from operaciones.guardia_ciclo where fecha_inicio = '2026-11-16') and t.fecha = '2026-11-26' on conflict do nothing;

-- Reporte y firma de una noche pasada, con Charlie Z8
do $$ declare v_turno bigint; v_persona uuid; begin select id into v_turno from operaciones.guardia_turno where ciclo_id = (select id from operaciones.guardia_ciclo where fecha_inicio = '2026-11-16') and fecha = '2026-11-16' limit 1; select id into v_persona from personal.persona where id = 'c1e20062-0df0-528a-85fd-03ac52aa9158'; perform set_config('request.jwt.claim.role', 'service_role', true); perform operaciones.guardar_reporte_guardia(v_turno, time '23:40', 'Z8', 'CH-201', '{}'::uuid[], '{}'::uuid[], 'Guardia normal, sin novedades.'); perform operaciones.firmar_reporte_guardia(v_turno); end $$;

-- Disciplina (solo visible para consejo; director ve sanciones ejecutoriadas)
insert into disciplina.expediente (id, numero, anio, persona_id, fecha_apertura, estado, causa, instructor_persona_id) overriding system value values (1, 1, 2026, '2ef99536-6cbf-5e68-a4f2-a9c6e151220e', '2026-09-05', 'resuelto', 'Incumplimiento ficticio de guardia', '2b273959-45fa-5c61-b757-359a169f2e1e');
insert into disciplina.sancion (expediente_id, persona_id, tipo_medida, descripcion, fecha, desde, hasta, ejecutoriada, fecha_ejecutoriada) values (1, '2ef99536-6cbf-5e68-a4f2-a9c6e151220e', 'suspension', 'Suspensión ficticia de 3 meses', '2026-09-20', '2026-09-01', '2026-12-31', true, '2026-09-25');
insert into disciplina.expediente (id, numero, anio, persona_id, fecha_apertura, estado, causa, instructor_persona_id) overriding system value values (2, 2, 2026, '5734d562-6470-5225-9137-6c4023409340', '2026-10-10', 'en_investigacion', 'Causa ficticia en investigación', '2b273959-45fa-5c61-b757-359a169f2e1e');
insert into disciplina.medida_preventiva (expediente_id, persona_id, medida, desde, hasta, motivo) values (2, '5734d562-6470-5225-9137-6c4023409340', 'Suspensión preventiva', '2026-10-11', '2026-11-30', 'Medida ficticia');
insert into disciplina.plazo_disciplinario (expediente_id, etapa, vence) values (2, 'Informe del instructor', '2026-12-15');
select setval(pg_get_serial_sequence('disciplina.expediente','id'), 2);

-- Tablero de Cuartel (órdenes del día, circulares CBL/compañía y citaciones)
insert into operaciones.orden_dia (numero, anio, fecha, vigente_hasta, titulo, texto, despacho_resumen) values (41, 2026, '2026-11-24', '2026-11-25', 'Revisión semanal de material menor y nivel de combustible', 'Se recuerda a la guardia nocturna verificar niveles de aceite, combustible y presión de aire en M-21 y M-22 antes de informar a Central.', 'Portal · Correo 28/28'),(42, 2026, '2026-11-26', '2026-11-27', 'Mantención preventiva unidad M-21 y orden de sala de máquinas', 'Durante la jornada de hoy la unidad M-21 permanecerá en revisión de bomba centrífuga. Mantener despejado el sector poniente de la sala de máquinas y verificar carga de equipos radiales portátiles.', 'Portal · Correo 28/28 · WhatsApp pendiente config.');
insert into secretaria.circular (origen, numero, anio, fecha, titulo, resumen, texto, despacho_resumen) values ('cbl', '08', 2026, '2026-11-23', 'Circular CBL N° 08: Normativa de despacho y comunicaciones radiales', 'Actualización de claves radiales y protocolo de respuesta en emergencias forestales.', 'La Comandancia del Cuerpo de Bomberos de Limache informa a todas las compañías la actualización de claves radiales para temporada estival y el uso obligatorio de equipo de protección completo en incendios de interfaz.', 'Portal · Correo 28/28'),('cbl', '09', 2026, '2026-11-25', 'Circular CBL N° 09: Calendario de academias generales', 'Fechas oficiales de academias de Cuerpo para el cierre del semestre.', 'Se comunica a los señores Directores y Capitanes las fechas de academias generales obligatorias y requisitos de inscripción de aspirantes en curso ANB.', 'Portal · Correo 28/28'),('compania', '05', 2026, '2026-11-22', 'Circular Compañía N° 05: Actualización de datos de contacto y tallas EPP', 'Se solicita a los voluntarios revisar su ficha personal y tallas de vestuario.', 'Estimados voluntarios: con motivo de la renovación programada de uniformes de trabajo, se solicita verificar sus tallas de calzado y chaqueta en la pestaña Personal o con Teniente 2°.', 'Portal · Correo 28/28'),('compania', '06', 2026, '2026-11-26', 'Circular Compañía N° 06: Reunión de coordinación de aniversario', 'Convocatoria a comisiones de trabajo para definir programa anual.', 'Se cita a los integrantes de las comisiones de celebración y archivo histórico a presentar sus propuestas antes del próximo viernes en Secretaría.', 'Portal · Correo 28/28');
insert into secretaria.citacion (numero, anio, fecha_emision, fecha_evento, hora_evento, lugar, tenida, obligatoria, tipo_acto_clave, titulo, detalle, despacho_resumen) values (12, 2026, '2026-11-16', '2026-11-21', '20:00', 'Cuartel Segunda Compañía', 'Tenida de trabajo', true, 'RO', 'Reunión Ordinaria de Compañía', 'Tabla ordinaria, lectura de correspondencia y cuenta de tesorería.', 'Portal · Correo 28/28'),(13, 2026, '2026-11-26', '2026-11-28', '19:30', 'Cuartel Segunda Compañía', 'Tenida de trabajo / EPP', true, '2', 'Academia Práctica de Rescate Vehicular y Extricación', 'Instrucción obligatoria con despliegue completo de herramientas hidráulicas de la unidad M-22. Puntualidad 19:15 horas.', 'Portal · Correo 28/28 · WhatsApp pendiente config.'),(14, 2026, '2026-11-26', '2026-12-02', '20:30', 'Salón de Sesiones', 'Civil formal / Tenida de salida', true, 'RO', 'Reunión Ordinaria Mensual de Compañía', 'Revisión de presupuesto, acuerdos pendientes y rol de guardias del próximo ciclo.', 'Portal · Correo 28/28');
insert into nucleo.despacho (id, origen_tipo, origen_id, titulo, resumen, correo_enviados, correo_total, whatsapp_enviados, whatsapp_total, whatsapp_error, whatsapp_plantilla) overriding system value values (1, 'citacion', 2, 'Citación N° 13: Academia Práctica de Rescate Vehicular', 'Citación obligatoria · Tenida de trabajo / EPP', 28, 28, 0, 28, 'Meta WhatsApp Cloud API no configurado en entorno demo.', 'citacion_compania');
select setval(pg_get_serial_sequence('nucleo.despacho','id'), 1);
insert into nucleo.despacho_detalle (despacho_id, persona_id, nombre, canal, destino, estado) values (1, 'e58014ec-d954-5bde-8fd9-655529ac50eb', 'Alejandra Rojas', 'correo', 'persona201@demo.local', 'enviado'),(1, 'e58014ec-d954-5bde-8fd9-655529ac50eb', 'Alejandra Rojas', 'whatsapp', '56910000201', 'no_configurado'),(1, 'c1e20062-0df0-528a-85fd-03ac52aa9158', 'Felipe Morales', 'correo', 'persona206@demo.local', 'enviado'),(1, 'c1e20062-0df0-528a-85fd-03ac52aa9158', 'Felipe Morales', 'whatsapp', '56910000206', 'no_configurado');

-- Zona de importación con datos dudosos de ejemplo
insert into nucleo.staging_importacion (origen, datos, estado, error) values ('persona_fecha_ingreso', '{"registro": 299, "nombre": "Persona sin fecha"}'::jsonb, 'pendiente', 'Falta fecha de ingreso'),('viper_asistencia', '{"lista": "2026-11-01", "registro": 250, "marca": "A"}'::jsonb, 'pendiente', 'Registro no está en la compañía');

commit;

-- Alertas de demostración
select seguridad.generar_alertas();
