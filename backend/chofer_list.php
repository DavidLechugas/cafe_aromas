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

$sql = "SELECT Id, nombre, numero_viajes, tarifa FROM chofer ORDER BY Id ASC";
$result = $conexion->query($sql);

if (!$result) {
    echo json_encode([
        'success' => false,
        'message' => 'Error al consultar choferes: ' . $conexion->error
    ]);
    cerrarConexion($conexion);
    exit;
}

$registros = [];

while ($row = $result->fetch_assoc()) {
    $registros[] = [
        'id'            => (int)$row['Id'],
        'chofer'        => $row['nombre'],
        'viajes'        => (int)$row['numero_viajes'],
        'tarifa'        => (float)$row['tarifa']
    ];
}

cerrarConexion($conexion);

echo json_encode([
    'success'  => true,
    'registros'=> $registros
]);
