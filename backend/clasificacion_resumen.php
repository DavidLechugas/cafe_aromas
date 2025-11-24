<?php
// backend/clasificacion_resumen.php
require_once 'conexion.php';

header('Content-Type: application/json; charset=utf-8');

$conexion = conectarBD();
if (!$conexion) {
    echo json_encode([
        'success' => false,
        'message' => 'No se pudo conectar a la base de datos.'
    ]);
    exit;
}

## 1. Total de kilos cosechados por todos los trabajadores
$sqlTotalCosechado = "SELECT COALESCE(SUM(kilos_cosechados), 0) AS total_kilos_cosechados FROM trabajador";
$resTotal = mysqli_query($conexion, $sqlTotalCosechado);

if (!$resTotal) {
    echo json_encode([
        'success' => false,
        'message' => 'Error al obtener total cosechado: ' . mysqli_error($conexion)
    ]);
    exit;
}

$rowTotal = mysqli_fetch_assoc($resTotal);
$totalKilosCosechados = (float)$rowTotal['total_kilos_cosechados'];

## 2. Total ya clasificado (tabla clasificacion)
$sqlTotalClasif = "SELECT COALESCE(SUM(total_clasificado), 0) AS total_clasificado FROM clasificacion";
$resClasif = mysqli_query($conexion, $sqlTotalClasif);

if (!$resClasif) {
    echo json_encode([
        'success' => false,
        'message' => 'Error al obtener total clasificado: ' . mysqli_error($conexion)
    ]);
    exit;
}

$rowClasif = mysqli_fetch_assoc($resClasif);
$totalClasificado = (float)$rowClasif['total_clasificado'];

## 3. Kilos pendientes = cosechado - clasificado (mínimo 0)
$kilosPendientes = $totalKilosCosechados - $totalClasificado;
if ($kilosPendientes < 0) {
    $kilosPendientes = 0;
}

## 4. Historial de clasificaciones
$sqlHistorial = "
    SELECT Id, kilos_cenicafe, kilos_colombia, total_clasificado, fecha
    FROM clasificacion
    ORDER BY fecha DESC, Id DESC
    LIMIT 100
";
$resHistorial = mysqli_query($conexion, $sqlHistorial);

$historial = [];
if ($resHistorial) {
    while ($row = mysqli_fetch_assoc($resHistorial)) {
        $historial[] = [
            'id' => (int)$row['Id'],
            'kilos_cenicafe' => (float)$row['kilos_cenicafe'],
            'kilos_colombia' => (float)$row['kilos_colombia'],
            'total_clasificado' => (float)$row['total_clasificado'],
            'fecha' => $row['fecha'],
        ];
    }
}

echo json_encode([
    'success' => true,
    'totalKilosCosechados' => $totalKilosCosechados,
    'totalClasificado'     => $totalClasificado,
    'kilosPendientes'      => $kilosPendientes,
    'historial'            => $historial,
]);

mysqli_close($conexion);
