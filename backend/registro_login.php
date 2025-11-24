<?php
require_once 'conexion.php';

header('Content-Type: application/json; charset=utf-8');
session_start();

// Solo permitir POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        'success' => false,
        'message' => 'Método no permitido.'
    ]);
    exit;
}

// 1. Leer datos enviados por el formulario (via fetch/FormData)
$username = isset($_POST['username']) ? trim($_POST['username']) : '';
$password = isset($_POST['password']) ? trim($_POST['password']) : '';
$confirm  = isset($_POST['confirm_password']) ? trim($_POST['confirm_password']) : '';

// Validaciones básicas
if ($username === '' || $password === '' || $confirm === '') {
    echo json_encode([
        'success' => false,
        'message' => 'Debe completar todos los campos.'
    ]);
    exit;
}

if (strlen($username) < 3) {
    echo json_encode([
        'success' => false,
        'message' => 'El nombre de usuario debe tener al menos 3 caracteres.'
    ]);
    exit;
}

if ($password !== $confirm) {
    echo json_encode([
        'success' => false,
        'message' => 'La contraseña y la confirmación no coinciden.'
    ]);
    exit;
}

if (strlen($password) < 6) {
    echo json_encode([
        'success' => false,
        'message' => 'La contraseña debe tener al menos 6 caracteres.'
    ]);
    exit;
}

// 2. Conectar a la BD
$conexion = conectarBD();
if (!$conexion) {
    echo json_encode([
        'success' => false,
        'message' => 'No se pudo conectar a la base de datos.'
    ]);
    exit;
}

// 3. Verificar si el usuario ya existe
$sql_check = "SELECT Id FROM usuarios WHERE usuario = ? LIMIT 1";

if ($stmt = $conexion->prepare($sql_check)) {
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $resultado = $stmt->get_result();

    if ($resultado && $resultado->num_rows > 0) {
        echo json_encode([
            'success' => false,
            'message' => 'El usuario ya existe. Intente con otro nombre.'
        ]);
        $stmt->close();
        cerrarConexion($conexion);
        exit;
    }

    $stmt->close();
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Error al preparar la consulta de verificación: ' . $conexion->error
    ]);
    cerrarConexion($conexion);
    exit;
}

// 4. Insertar nuevo usuario
// OJO: en tu BD actual las contraseñas están en texto plano, así que guardo igual para ser compatible con el login actual.
$sql_insert = "INSERT INTO usuarios (usuario, contraseña) VALUES (?, ?)";

if ($stmt = $conexion->prepare($sql_insert)) {

    // Si luego quieres usar hash, sería:
    // $passwordHash = password_hash($password, PASSWORD_BCRYPT);
    // y cambiar $password por $passwordHash
    $stmt->bind_param("ss", $username, $password);

    if ($stmt->execute()) {
        // Opcional: loguear automáticamente al usuario recién creado
        $_SESSION['usuario_id'] = $stmt->insert_id;
        $_SESSION['usuario_nombre'] = $username;

        echo json_encode([
            'success'  => true,
            'username' => $username,
            'message'  => 'Registro exitoso. Usuario creado correctamente.'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Error al registrar el usuario: ' . $stmt->error
        ]);
    }

    $stmt->close();
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Error al preparar la consulta de inserción: ' . $conexion->error
    ]);
}

cerrarConexion($conexion);
