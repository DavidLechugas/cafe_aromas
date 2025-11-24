<?php
require_once 'conexion.php';

header('Content-Type: application/json; charset=utf-8');

// 1. Conectar a la BD
$conexion = conectarBD();
if (!$conexion) {
    echo json_encode([
        'success' => false,
        'message' => 'No se pudo conectar a la base de datos.'
    ]);
    exit;
}

// 2. Consultar todos los trabajadores
$sql = "SELECT Id, nombre, kilos_cosechados, pago_pendientekg, pagado, fecha FROM trabajador ORDER BY Id ASC";
$result = $conexion->query($sql);

if (!$result) {
    echo json_encode([
        'success' => false,
        'message' => 'Error al consultar trabajadores: ' . $conexion->error
    ]);
    cerrarConexion($conexion);
    exit;
}

$trabajadores = [];

while ($row = $result->fetch_assoc()) {
    // Convertimos algunos valores a tipos numéricos claros
    $trabajadores[] = [
        'Id'               => (int)$row['Id'],
        'nombre'           => $row['nombre'],
        'kilos_cosechados' => (float)$row['kilos_cosechados'],
        'pago_pendientekg' => (int)$row['pago_pendientekg'],
        'pagado'           => (int)$row['pagado'],
        'fecha'            => $row['fecha'],
    ];
}

cerrarConexion($conexion);

// 3. Responder JSON
echo json_encode([
    'success'      => true,
    'trabajadores' => $trabajadores
]);
