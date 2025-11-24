<?php
// backend/clasificacion_registrar.php
require_once 'conexion.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        'success' => false,
        'message' => 'Método no permitido. Usa POST.'
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

## 1. Leer datos
$kilosCenicafe = isset($_POST['kilos_cenicafe']) ? (float)$_POST['kilos_cenicafe'] : 0;
$kilosColombia = isset($_POST['kilos_colombia']) ? (float)$_POST['kilos_colombia'] : 0;

if ($kilosCenicafe < 0 || $kilosColombia < 0) {
    echo json_encode([
        'success' => false,
        'message' => 'Los kilos no pueden ser negativos.'
    ]);
    exit;
}

$totalSesion = $kilosCenicafe + $kilosColombia;
if ($totalSesion <= 0) {
    echo json_encode([
        'success' => false,
        'message' => 'Debes clasificar una cantidad mayor a cero.'
    ]);
    exit;
}

## 2. Recalcular total cosechado
$sqlTotalCosechado = "SELECT COALESCE(SUM(kilos_cosechados), 0) AS total_kilos_cosechados FROM trabajador";
$resTotal = mysqli_query($conexion, $sqlTotalCosechado);
if (!$resTotal) {
    echo json_encode([
        'success' => false,
        'message' => 'Error al obtener total cosechado: ' . mysqli_error($conexion)
    ]);
    exit;
}
$rowTotal = mysqli_fetch_assoc($resTotal);
$totalKilosCosechados = (float)$rowTotal['total_kilos_cosechados'];

## 3. Total ya clasificado
$sqlTotalClasif = "SELECT COALESCE(SUM(total_clasificado), 0) AS total_clasificado FROM clasificacion";
$resClasif = mysqli_query($conexion, $sqlTotalClasif);
if (!$resClasif) {
    echo json_encode([
        'success' => false,
        'message' => 'Error al obtener total clasificado: ' . mysqli_error($conexion)
    ]);
    exit;
}
$rowClasif = mysqli_fetch_assoc($resClasif);
$totalClasificado = (float)$rowClasif['total_clasificado'];

## 4. Kilos pendientes actuales
$kilosPendientes = $totalKilosCosechados - $totalClasificado;
if ($kilosPendientes < 0) {
    $kilosPendientes = 0;
}

## 5. Validar que no te pases
if ($totalSesion > $kilosPendientes) {
    echo json_encode([
        'success' => false,
        'message' => 'El total clasificado en esta sesión (' . $totalSesion . ' kg) excede los kilos pendientes (' . $kilosPendientes . ' kg).'
    ]);
    exit;
}

## 6. Insertar registro en clasificacion
$totalClasificadoNuevo = $totalSesion;
$fechaHoy = date('Y-m-d');

$stmt = $conexion->prepare("
    INSERT INTO clasificacion (kilos_cenicafe, kilos_colombia, total_clasificado, fecha)
    VALUES (?, ?, ?, ?)
");
if (!$stmt) {
    echo json_encode([
        'success' => false,
        'message' => 'Error al preparar insert: ' . $conexion->error
    ]);
    exit;
}

$stmt->bind_param("ddds", $kilosCenicafe, $kilosColombia, $totalClasificadoNuevo, $fechaHoy);
if (!$stmt->execute()) {
    echo json_encode([
        'success' => false,
        'message' => 'Error al insertar clasificación: ' . $stmt->error
    ]);
    $stmt->close();
    exit;
}
$stmt->close();

## 7. Recalcular totales después de insertar
$nuevoTotalClasificado = $totalClasificado + $totalClasificadoNuevo;
$nuevosKilosPendientes = $totalKilosCosechados - $nuevoTotalClasificado;
if ($nuevosKilosPendientes < 0) {
    $nuevosKilosPendientes = 0;
}

echo json_encode([
    'success' => true,
    'message' => 'Clasificación registrada correctamente.',
    'registro' => [
        'kilos_cenicafe'    => $kilosCenicafe,
        'kilos_colombia'    => $kilosColombia,
        'total_clasificado' => $totalClasificadoNuevo,
        'fecha'             => $fechaHoy
    ],
    'totalKilosCosechados' => $totalKilosCosechados,
    'totalClasificado'     => $nuevoTotalClasificado,
    'kilosPendientes'      => $nuevosKilosPendientes
]);

mysqli_close($conexion);
