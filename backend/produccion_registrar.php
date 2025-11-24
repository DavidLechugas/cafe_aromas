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

$idTrabajador = isset($_POST['id_trabajador']) ? intval($_POST['id_trabajador']) : 0;
$kilos        = isset($_POST['kilos']) ? floatval($_POST['kilos']) : 0;

if ($idTrabajador <= 0 || $kilos <= 0) {
    echo json_encode([
        'success' => false,
        'message' => 'Datos inválidos. Debe enviar un trabajador y kilos mayores a 0.'
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

// Verificar que el trabajador exista
$sqlCheck = "SELECT Id, nombre, kilos_cosechados FROM trabajador WHERE Id = ? LIMIT 1";
if (!$stmt = $conexion->prepare($sqlCheck)) {
    echo json_encode([
        'success' => false,
        'message' => 'Error al preparar la consulta: ' . $conexion->error
    ]);
    cerrarConexion($conexion);
    exit;
}

$stmt->bind_param("i", $idTrabajador);
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

$trabajador = $result->fetch_assoc();
$stmt->close();

// Actualizar kilos_cosechados sumando los nuevos kilos
$sqlUpdate = "
    UPDATE trabajador
    SET
        kilos_cosechados = kilos_cosechados + ?,
        pago_pendientekg = pago_pendientekg + ?,   -- sumamos también a pendientes
        pagado = 0,
        fecha = CURRENT_DATE()
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

$stmt2->bind_param("ddi", $kilos, $kilos, $idTrabajador);

if ($stmt2->execute()) {
    echo json_encode([
        'success' => true,
        'message' => 'Producción registrada correctamente en la base de datos.',
        'id_trabajador' => $idTrabajador,
        'kilos_agregados' => $kilos
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Error al actualizar la producción: ' . $stmt2->error
    ]);
}

$stmt2->close();
cerrarConexion($conexion);
