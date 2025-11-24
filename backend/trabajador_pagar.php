<?php
require_once 'conexion.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        'success' => false,
        'message' => 'Método no permitido.'
    ]);
    exit;
}

$id = isset($_POST['id']) ? intval($_POST['id']) : 0;

if ($id <= 0) {
    echo json_encode([
        'success' => false,
        'message' => 'ID de trabajador inválido.'
    ]);
    exit;
}

$conexion = conectarBD();
if (!$conexion) {
    echo json_encode([
        'success' => false,
        'message' => 'No se pudo conectar a la base de datos.'
    ]);
    exit;
}

$sql = "SELECT Id, nombre, kilos_cosechados, pago_pendientekg FROM trabajador WHERE Id = ? LIMIT 1";
$stmt = $conexion->prepare($sql);

if (!$stmt) {
    echo json_encode([
        'success' => false,
        'message' => 'Error al preparar la consulta: ' . $conexion->error
    ]);
    cerrarConexion($conexion);
    exit;
}

$stmt->bind_param("i", $id);
$stmt->execute();
$result = $stmt->get_result();

if (!$result || $result->num_rows === 0) {
    echo json_encode([
        'success' => false,
        'message' => 'No se encontró el trabajador con ese ID.'
    ]);
    $stmt->close();
    cerrarConexion($conexion);
    exit;
}

$row = $result->fetch_assoc();
$stmt->close();

$nombre          = $row['nombre'];
$kilosTotales    = (float)$row['kilos_cosechados'];
$kilosPendientes = (float)$row['pago_pendientekg'];

if ($kilosPendientes <= 0) {
    echo json_encode([
        'success' => false,
        'message' => 'El trabajador ya está al día. No hay kilos pendientes.'
    ]);
    cerrarConexion($conexion);
    exit;
}

// Marcamos todos los kilos pendientes como pagados
$kilosPagadosEnEstaOperacion = $kilosPendientes;

$sqlUpdate = "
    UPDATE trabajador
    SET pago_pendientekg = 0,
        pagado = 1
    WHERE Id = ?
";

$stmt2 = $conexion->prepare($sqlUpdate);
if (!$stmt2) {
    echo json_encode([
        'success' => false,
        'message' => 'Error al preparar la actualización: ' . $conexion->error
    ]);
    cerrarConexion($conexion);
    exit;
}

$stmt2->bind_param("i", $id);

if ($stmt2->execute()) {
    echo json_encode([
        'success'                     => true,
        'id'                          => $id,
        'nombre'                      => $nombre,
        'kilos_totales'               => $kilosTotales,
        'kilos_pagados_en_operacion'  => $kilosPagadosEnEstaOperacion
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Error al actualizar el pago: ' . $stmt2->error
    ]);
}

$stmt2->close();
cerrarConexion($conexion);
