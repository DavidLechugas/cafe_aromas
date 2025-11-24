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

$descripcion = isset($_POST['descripcion']) ? trim($_POST['descripcion']) : '';
$fecha       = isset($_POST['fecha']) ? $_POST['fecha'] : '';
$monto       = isset($_POST['monto']) ? floatval($_POST['monto']) : 0;

if ($descripcion === '' || $fecha === '' || $monto <= 0) {
    echo json_encode([
        'success' => false,
        'message' => 'Datos inválidos.'
    ]);
    exit;
}

$conexion = conectarBD();
if (!$conexion) {
    echo json_encode([
        'success' => false,
        'message' => 'Error de conexión.'
    ]);
    exit;
}

$sqlInsert = "INSERT INTO gestion_gastos (descripcion, fecha, monto) VALUES (?, ?, ?)";
$stmt = $conexion->prepare($sqlInsert);

if (!$stmt) {
    echo json_encode([
        'success' => false,
        'message' => 'Error preparando consulta: ' . $conexion->error
    ]);
    exit;
}

$stmt->bind_param("ssd", $descripcion, $fecha, $monto);

if ($stmt->execute()) {
    echo json_encode([
        'success'     => true,
        'message'     => 'Gasto registrado.',
        'id'          => $stmt->insert_id,
        'descripcion' => $descripcion,
        'fecha'       => $fecha,
        'monto'       => $monto
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Error registrando gasto: ' . $stmt->error
    ]);
}

$stmt->close();
cerrarConexion($conexion);
z