-- SCRIPT DE CONFIGURACIÓN PARA SUPABASE
-- Copia y pega este contenido en el SQL Editor de tu proyecto en Supabase.

-- 1. Limpieza (Opcional - ¡CUIDADO! Borra datos existentes)
-- DROP TABLE IF EXISTS public.produccion CASCADE;
-- DROP TABLE IF EXISTS public.pagos CASCADE;
-- DROP TABLE IF EXISTS public.chofer CASCADE;
-- DROP TABLE IF EXISTS public.clasificacion CASCADE;
-- DROP TABLE IF EXISTS public.gestion_gastos CASCADE;
-- DROP TABLE IF EXISTS public.trabajador CASCADE;
-- DROP TABLE IF EXISTS public.usuarios CASCADE;

-- 2. Crear Tabla Trabajador
CREATE TABLE IF NOT EXISTS public.trabajador (
    "Id" SERIAL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "kilos_cosechados" NUMERIC DEFAULT 0,
    "pago_pendientekg" NUMERIC DEFAULT 0,
    "pagado" BOOLEAN DEFAULT FALSE,
    "fecha" DATE DEFAULT CURRENT_DATE
);

-- 3. Crear Tabla Chofer
CREATE TABLE IF NOT EXISTS public.chofer (
    "Id" SERIAL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "numero_viajes" INTEGER DEFAULT 0,
    "tarifa" NUMERIC DEFAULT 0
);

-- 4. Crear Tabla Clasificación
CREATE TABLE IF NOT EXISTS public.clasificacion (
    "Id" SERIAL PRIMARY KEY,
    "kilos_cenicafe" NUMERIC DEFAULT 0,
    "kilos_colombia" NUMERIC DEFAULT 0,
    "total_clasificado" NUMERIC DEFAULT 0,
    "fecha" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Crear Tabla Gestión Gastos
CREATE TABLE IF NOT EXISTS public.gestion_gastos (
    "Id" SERIAL PRIMARY KEY,
    "descripcion" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "monto" NUMERIC DEFAULT 0
);

-- 6. Crear Tabla Usuarios
CREATE TABLE IF NOT EXISTS public.usuarios (
    "Id" SERIAL PRIMARY KEY,
    "usuario" TEXT UNIQUE NOT NULL,
    "contraseña" TEXT NOT NULL
);

-- 7. Crear Tabla Producción (Relacional)
CREATE TABLE IF NOT EXISTS public.produccion (
    "Id" SERIAL PRIMARY KEY,
    "id_trabajador" INTEGER REFERENCES public.trabajador("Id"),
    "kilos" NUMERIC NOT NULL,
    "fecha" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Crear Tabla Pagos (Relacional)
CREATE TABLE IF NOT EXISTS public.pagos (
    "Id" SERIAL PRIMARY KEY,
    "id_trabajador" INTEGER REFERENCES public.trabajador("Id"),
    "kilos_pagados" NUMERIC NOT NULL,
    "monto_pagado" NUMERIC NOT NULL,
    "fecha" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Insertar Trabajadores Iniciales (1 al 30)
DO $$
BEGIN
    FOR i IN 1..30 LOOP
        INSERT INTO public.trabajador ("nombre") 
        VALUES ('Trabajador ' || i)
        ON CONFLICT DO NOTHING;
    END LOOP;
END $$;

-- 10. Insertar Choferes Iniciales
INSERT INTO public.chofer ("nombre", "tarifa") VALUES
('Jose Torres', 50000),
('Omar Ojeda', 50000)
ON CONFLICT DO NOTHING;

-- 11. Insertar Usuario Administrador
INSERT INTO public.usuarios ("usuario", "contraseña") VALUES
('admin', 'admin123')
ON CONFLICT DO NOTHING;

-- NOTA SOBRE SEGURIDAD:
-- Por defecto, estas tablas son creadas en el esquema 'public'.
-- Si habilitas RLS (Row Level Security), recuerda añadir políticas para permitir lecturas y escrituras.
-- Para prototipos rápidos, puedes deshabilitar RLS en la configuración de cada tabla en el panel de Supabase.
