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

// Nombre por defecto: "trabajador X (por defecto)"
$nombreNuevo = 'trabajador ' . $id . ' (por defecto)';

// Reset completo de datos del trabajador
$sql = "
    UPDATE trabajador
    SET
        nombre = ?,
        kilos_cosechados = 0,
        pago_pendientekg = 0,
        pagado = 0
    WHERE Id = ?
";

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
            'message' => 'Trabajador restablecido al nombre y datos por defecto.'
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
