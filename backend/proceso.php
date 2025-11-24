<?php
require_once "Registro_produccion.php";
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['seccion'])) {
        $seccion = intval($_POST['seccion']);
        $nombre = isset($_POST['nombre']) ? $_POST['nombre'] : '';
        $id = isset($_POST['id']) ? intval($_POST['id']) : 0;

        try {
            $registro = new Registro($nombre, $id, $seccion);
            echo json_encode(['status' => 'success', 'message' => 'Operación realizada con éxito']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
    } else {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Sección no especificada']);
    }
} else {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Método no permitido']);
}