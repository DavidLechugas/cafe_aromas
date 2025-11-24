-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 24-11-2025 a las 10:49:34
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `cafe_aroma`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `chofer`
--

CREATE TABLE `chofer` (
  `Id` int(11) NOT NULL,
  `nombre` text NOT NULL,
  `numero_viajes` int(30) NOT NULL,
  `tarifa` double NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `chofer`
--

INSERT INTO `chofer` (`Id`, `nombre`, `numero_viajes`, `tarifa`) VALUES
(1, 'Jose Torres', 2, 20000),
(2, 'Omar Ojeda', 12, 5000);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `clasificacion`
--

CREATE TABLE `clasificacion` (
  `Id` int(11) NOT NULL,
  `kilos_cenicafe` double NOT NULL,
  `kilos_colombia` double NOT NULL,
  `total_clasificado` double NOT NULL,
  `fecha` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `gestion_gastos`
--

CREATE TABLE `gestion_gastos` (
  `Id` int(11) NOT NULL,
  `descripcion` text NOT NULL,
  `fecha` date NOT NULL,
  `monto` double NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `gestion_gastos`
--

INSERT INTO `gestion_gastos` (`Id`, `descripcion`, `fecha`, `monto`) VALUES
(1, 'combustible chofer', '2025-11-24', 1200);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `trabajador`
--

CREATE TABLE `trabajador` (
  `Id` int(11) NOT NULL,
  `nombre` text NOT NULL,
  `kilos_cosechados` double NOT NULL,
  `pago_pendientekg` int(11) NOT NULL,
  `pagado` tinyint(1) NOT NULL DEFAULT 1,
  `fecha` date NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `trabajador`
--

INSERT INTO `trabajador` (`Id`, `nombre`, `kilos_cosechados`, `pago_pendientekg`, `pagado`, `fecha`) VALUES
(1, 'David Sanchez', 12, 12, 0, '2025-11-24'),
(2, 'María Gómez', 39.3, 0, 1, '2025-11-24'),
(3, 'Carlos Ramírez', 57.8, 0, 1, '2025-11-24'),
(4, 'Ana Torres', 18.6, 0, 1, '2025-11-03'),
(5, 'Luis Herrera', 52.4, 0, 1, '2025-11-04'),
(6, 'Sofía Medina', 39.1, 0, 1, '2025-11-04'),
(7, 'Pedro Castillo', 72.7, 0, 1, '2025-11-24'),
(8, 'Daniel López', 22.9, 0, 1, '2025-11-05'),
(9, 'Laura Sánchez', 47.3, 0, 1, '2025-11-06'),
(10, 'Miguel Rojas', 0, 0, 0, '2025-11-06'),
(11, 'Carmen Díaz', 31, 0, 1, '2025-11-07'),
(12, 'Felipe Orozco', 0, 0, 0, '2025-11-07'),
(13, 'Lucía Velásquez', 63.8, 0, 1, '2025-11-08'),
(14, 'Andrés Palacios', 41.4, 0, 1, '2025-11-08'),
(15, 'Diana Quevedo', 26.6, 0, 1, '2025-11-09'),
(16, 'José Márquez', 82.1, 0, 1, '2025-11-24'),
(17, 'Valentina Castaño', 58.9, 0, 1, '2025-11-10'),
(18, 'Camilo Restrepo', 36.2, 3300, 0, '2025-11-10'),
(19, 'Karina Acosta', 14.7, 2000, 1, '2025-11-11'),
(20, 'Samuel Reyes', 69.3, 0, 1, '2025-11-11'),
(21, 'Paula Aguirre', 49.8, 3700, 1, '2025-11-12'),
(22, 'Diego Montoya', 23.1, 2400, 0, '2025-11-12'),
(23, 'Marcela Muñoz', 57.4, 4100, 1, '2025-11-13'),
(24, 'Julián Quintero', 32.6, 2800, 0, '2025-11-13'),
(25, 'Tatiana Ríos', 44, 3000, 1, '2025-11-14'),
(26, 'Oscar Valencia', 68.7, 4300, 0, '2025-11-14'),
(27, 'Gloria Bautista', 53.1, 3600, 1, '2025-11-15'),
(28, 'Héctor Bermúdez', 21.4, 2200, 0, '2025-11-15'),
(29, 'Yolanda Nieto', 37.9, 0, 1, '2025-11-16'),
(30, 'Juan Carlos', 75.2, 0, 1, '2025-11-16');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `Id` int(11) NOT NULL,
  `usuario` text NOT NULL,
  `contraseña` varchar(150) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`Id`, `usuario`, `contraseña`) VALUES
(1, 'admin', 'admin123'),
(3, 'david', 'david123'),
(4, 'danny', 'danny123');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `chofer`
--
ALTER TABLE `chofer`
  ADD PRIMARY KEY (`Id`);

--
-- Indices de la tabla `clasificacion`
--
ALTER TABLE `clasificacion`
  ADD PRIMARY KEY (`Id`);

--
-- Indices de la tabla `gestion_gastos`
--
ALTER TABLE `gestion_gastos`
  ADD PRIMARY KEY (`Id`);

--
-- Indices de la tabla `trabajador`
--
ALTER TABLE `trabajador`
  ADD PRIMARY KEY (`Id`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`Id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `clasificacion`
--
ALTER TABLE `clasificacion`
  MODIFY `Id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `gestion_gastos`
--
ALTER TABLE `gestion_gastos`
  MODIFY `Id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `trabajador`
--
ALTER TABLE `trabajador`
  MODIFY `Id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `Id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
