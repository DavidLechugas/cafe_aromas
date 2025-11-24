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

$sql = "SELECT Id, descripcion, fecha, monto
        FROM gestion_gastos
        ORDER BY fecha DESC, Id DESC";

$result = $conexion->query($sql);

$gastos = [];

while ($row = $result->fetch_assoc()) {
    $gastos[] = [
        'id'          => (int)$row['Id'],
        'descripcion' => $row['descripcion'],
        'fecha'       => $row['fecha'],
        'monto'       => (float)$row['monto']
    ];
}

echo json_encode([
    'success' => true,
    'gastos'  => $gastos
]);
