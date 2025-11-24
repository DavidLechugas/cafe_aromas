<?php
require_once 'conexion.php';

session_start();

header('Content-Type: application/json; charset=utf-8');

// Solo permitir POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        'success' => false,
        'message' => 'Método no permitido.'
    ]);
    exit;
}

// 1. Datos del formulario
$username = isset($_POST['username']) ? trim($_POST['username']) : '';
$password = isset($_POST['password']) ? trim($_POST['password']) : '';

if ($username === '' || $password === '') {
    echo json_encode([
        'success' => false,
        'message' => 'Debe llenar usuario y contraseña.'
    ]);
    exit;
}

// 2. Conectar BD
$conexion = conectarBD();
if (!$conexion) {
    echo json_encode([
        'success' => false,
        'message' => 'No se pudo conectar a la base de datos.'
    ]);
    exit;
}

// 3. Buscar usuario (ajusta el nombre de columna si hace falta)
$sql = "SELECT Id, usuario, contraseña FROM usuarios WHERE usuario = ? LIMIT 1";

if ($stmt = $conexion->prepare($sql)) {

    $stmt->bind_param("s", $username);
    $stmt->execute();
    $resultado = $stmt->get_result();

    if ($resultado && $resultado->num_rows === 1) {
        $fila = $resultado->fetch_assoc();
        $passwordBD = $fila['contraseña'];

        // Comparación directa (por ahora)
        if ($password === $passwordBD) {

            $_SESSION['usuario_id'] = $fila['Id'];
            $_SESSION['usuario_nombre'] = $fila['usuario'];

            echo json_encode([
                'success'  => true,
                'username' => $fila['usuario'],
                'message'  => 'Inicio de sesión exitoso.'
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Usuario o contraseña incorrectos.'
            ]);
        }

    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Usuario o contraseña incorrectos.'
        ]);
    }

    $stmt->close();
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Error al preparar la consulta: ' . $conexion->error
    ]);
}

cerrarConexion($conexion);
