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

$id     = isset($_POST['id']) ? intval($_POST['id']) : 0;
$nombre = isset($_POST['nombre']) ? trim($_POST['nombre']) : '';
$accion = isset($_POST['accion']) ? trim($_POST['accion']) : 'update';

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

// Si la acción es "reset", usamos un nombre por defecto
if ($accion === 'reset') {
    $nombreNuevo = 'Trabajador ' . $id;
} else {
    if ($nombre === '') {
        echo json_encode([
            'success' => false,
            'message' => 'El nombre no puede estar vacío.'
        ]);
        cerrarConexion($conexion);
        exit;
    }
    $nombreNuevo = $nombre;
}

$sql = "UPDATE trabajador SET nombre = ? WHERE Id = ?";
$stmt = $conexion->prepare($sql);

if (!$stmt) {
    echo json_encode([
        'success' => false,
        'message' => 'Error al preparar la consulta: ' . $conexion->error
    ]);
    cerrarConexion($conexion);
    exit;
}

$stmt->bind_param("si", $nombreNuevo, $id);

if ($stmt->execute()) {
    if ($stmt->affected_rows > 0) {
        echo json_encode([
            'success' => true,
            'id'      => $id,
            'nombre'  => $nombreNuevo,
            'message' => 'Trabajador actualizado correctamente.'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'No se encontró el trabajador con ese ID.'
        ]);
    }
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Error al actualizar trabajador: ' . $stmt->error
    ]);
}

$stmt->close();
cerrarConexion($conexion);
