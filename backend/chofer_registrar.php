<?php
require_once 'conexion.php';

header('Content-Type: application/json; charset=utf-8');

// Solo permitir POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        'success' => false,
        'message' => 'Método no permitido.'
    ]);
    exit;
}

$chofer = isset($_POST['chofer']) ? trim($_POST['chofer']) : '';
$viajes = isset($_POST['viajes']) ? intval($_POST['viajes']) : 0;
$tarifa = isset($_POST['tarifa']) ? floatval($_POST['tarifa']) : 0;

if ($chofer === '' || $viajes <= 0 || $tarifa <= 0) {
    echo json_encode([
        'success' => false,
        'message' => 'Datos inválidos. Verifica chofer, viajes y tarifa.'
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

// Obtener próximo Id manualmente (por si no tiene AUTO_INCREMENT configurado)
$sqlNext = "SELECT COALESCE(MAX(Id), 0) + 1 AS nextId FROM chofer";
$result = $conexion->query($sqlNext);

if (!$result) {
    echo json_encode([
        'success' => false,
        'message' => 'Error al calcular el próximo Id: ' . $conexion->error
    ]);
    cerrarConexion($conexion);
    exit;
}

$row = $result->fetch_assoc();
$nextId = (int)$row['nextId'];

$sqlInsert = "INSERT INTO chofer (Id, nombre, numero_viajes, tarifa) VALUES (?, ?, ?, ?)";
$stmt = $conexion->prepare($sqlInsert);

if (!$stmt) {
    echo json_encode([
        'success' => false,
        'message' => 'Error al preparar el INSERT: ' . $conexion->error
    ]);
    cerrarConexion($conexion);
    exit;
}

$stmt->bind_param("isid", $nextId, $chofer, $viajes, $tarifa);

if ($stmt->execute()) {
    $pagoTotal = $viajes * $tarifa;

    echo json_encode([
        'success'    => true,
        'message'    => 'Pago de chofer registrado correctamente.',
        'id'         => $nextId,
        'chofer'     => $chofer,
        'viajes'     => $viajes,
        'tarifa'     => $tarifa,
        'pago_total' => $pagoTotal
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Error al insertar el pago de chofer: ' . $stmt->error
    ]);
}

$stmt->close();
cerrarConexion($conexion);
