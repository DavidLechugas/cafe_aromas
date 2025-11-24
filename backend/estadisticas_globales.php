<?php
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

// Total de kilos cosechados = suma de kilos_cosechados de todos los trabajadores
$sql = "SELECT COALESCE(SUM(kilos_cosechados), 0) AS total_kilos_cosechados FROM trabajador";
$result = $conexion->query($sql);

if (!$result) {
    echo json_encode([
        'success' => false,
        'message' => 'Error al consultar estadísticas: ' . $conexion->error
    ]);
    cerrarConexion($conexion);
    exit;
}

$row = $result->fetch_assoc();
$totalKilosCosechados = isset($row['total_kilos_cosechados']) ? (float)$row['total_kilos_cosechados'] : 0.0;

cerrarConexion($conexion);

echo json_encode([
    'success'              => true,
    'totalKilosCosechados' => $totalKilosCosechados
]);
