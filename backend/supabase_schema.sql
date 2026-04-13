-- Archivo de migración de MySQL a PostgreSQL (Supabase)

-- 1. Estructura de tabla para 'chofer'
DROP TABLE IF EXISTS public.chofer CASCADE;
CREATE TABLE public.chofer (
  "Id" SERIAL PRIMARY KEY,
  "nombre" TEXT NOT NULL,
  "numero_viajes" INTEGER NOT NULL DEFAULT 0,
  "tarifa" DOUBLE PRECISION NOT NULL DEFAULT 0
);

INSERT INTO public.chofer ("Id", "nombre", "numero_viajes", "tarifa") VALUES
(1, 'Jose Torres', 2, 20000),
(2, 'Omar Ojeda', 12, 5000);

-- Ajustar la secuencia para asegurar que los nuevos ID sigan correctamente
SELECT setval(pg_get_serial_sequence('public.chofer', 'Id'), (SELECT MAX("Id") FROM public.chofer));

-- --------------------------------------------------------

-- 2. Estructura de tabla para 'clasificacion'
DROP TABLE IF EXISTS public.clasificacion CASCADE;
CREATE TABLE public.clasificacion (
  "Id" SERIAL PRIMARY KEY,
  "kilos_cenicafe" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "kilos_colombia" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "total_clasificado" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "fecha" DATE NOT NULL DEFAULT CURRENT_DATE
);

-- --------------------------------------------------------

-- 3. Estructura de tabla para 'gestion_gastos'
DROP TABLE IF EXISTS public.gestion_gastos CASCADE;
CREATE TABLE public.gestion_gastos (
  "Id" SERIAL PRIMARY KEY,
  "descripcion" TEXT NOT NULL,
  "fecha" DATE NOT NULL DEFAULT CURRENT_DATE,
  "monto" DOUBLE PRECISION NOT NULL DEFAULT 0
);

INSERT INTO public.gestion_gastos ("Id", "descripcion", "fecha", "monto") VALUES
(1, 'combustible chofer', '2025-11-24', 1200);

SELECT setval(pg_get_serial_sequence('public.gestion_gastos', 'Id'), (SELECT MAX("Id") FROM public.gestion_gastos));

-- --------------------------------------------------------

-- 4. Estructura de tabla para 'trabajador'
DROP TABLE IF EXISTS public.trabajador CASCADE;
CREATE TABLE public.trabajador (
  "Id" SERIAL PRIMARY KEY,
  "nombre" TEXT NOT NULL,
  "kilos_cosechados" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "pago_pendientekg" INTEGER NOT NULL DEFAULT 0,
  "pagado" BOOLEAN NOT NULL DEFAULT true,
  "fecha" DATE NOT NULL DEFAULT CURRENT_DATE
);

INSERT INTO public.trabajador ("Id", "nombre", "kilos_cosechados", "pago_pendientekg", "pagado", "fecha") VALUES
(1, 'David Sanchez', 12, 12, false, '2025-11-24'),
(2, 'María Gómez', 39.3, 0, true, '2025-11-24'),
(3, 'Carlos Ramírez', 57.8, 0, true, '2025-11-24'),
(4, 'Ana Torres', 18.6, 0, true, '2025-11-03'),
(5, 'Luis Herrera', 52.4, 0, true, '2025-11-04'),
(6, 'Sofía Medina', 39.1, 0, true, '2025-11-04'),
(7, 'Pedro Castillo', 72.7, 0, true, '2025-11-24'),
(8, 'Daniel López', 22.9, 0, true, '2025-11-05'),
(9, 'Laura Sánchez', 47.3, 0, true, '2025-11-06'),
(10, 'Miguel Rojas', 0, 0, false, '2025-11-06'),
(11, 'Carmen Díaz', 31, 0, true, '2025-11-07'),
(12, 'Felipe Orozco', 0, 0, false, '2025-11-07'),
(13, 'Lucía Velásquez', 63.8, 0, true, '2025-11-08'),
(14, 'Andrés Palacios', 41.4, 0, true, '2025-11-08'),
(15, 'Diana Quevedo', 26.6, 0, true, '2025-11-09'),
(16, 'José Márquez', 82.1, 0, true, '2025-11-24'),
(17, 'Valentina Castaño', 58.9, 0, true, '2025-11-10'),
(18, 'Camilo Restrepo', 36.2, 3300, false, '2025-11-10'),
(19, 'Karina Acosta', 14.7, 2000, true, '2025-11-11'),
(20, 'Samuel Reyes', 69.3, 0, true, '2025-11-11'),
(21, 'Paula Aguirre', 49.8, 3700, true, '2025-11-12'),
(22, 'Diego Montoya', 23.1, 2400, false, '2025-11-12'),
(23, 'Marcela Muñoz', 57.4, 4100, true, '2025-11-13'),
(24, 'Julián Quintero', 32.6, 2800, false, '2025-11-13'),
(25, 'Tatiana Ríos', 44, 3000, true, '2025-11-14'),
(26, 'Oscar Valencia', 68.7, 4300, false, '2025-11-14'),
(27, 'Gloria Bautista', 53.1, 3600, true, '2025-11-15'),
(28, 'Héctor Bermúdez', 21.4, 2200, false, '2025-11-15'),
(29, 'Yolanda Nieto', 37.9, 0, true, '2025-11-16'),
(30, 'Juan Carlos', 75.2, 0, true, '2025-11-16');

SELECT setval(pg_get_serial_sequence('public.trabajador', 'Id'), (SELECT MAX("Id") FROM public.trabajador));

-- --------------------------------------------------------

-- 5. Estructura de tabla para 'usuarios'
DROP TABLE IF EXISTS public.usuarios CASCADE;
CREATE TABLE public.usuarios (
  "Id" SERIAL PRIMARY KEY,
  "usuario" TEXT NOT NULL,
  "contraseña" VARCHAR(150) NOT NULL
);

INSERT INTO public.usuarios ("Id", "usuario", "contraseña") VALUES
(1, 'admin', 'admin123'),
(3, 'david', 'david123'),
(4, 'danny', 'danny123');

SELECT setval(pg_get_serial_sequence('public.usuarios', 'Id'), (SELECT MAX("Id") FROM public.usuarios));
