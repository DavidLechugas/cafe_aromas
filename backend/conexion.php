<?php

function conectarBD() {
    $host = "localhost";
    $username = "root";
    $password = "";
    $database = "cafe_aroma";
    $port = 3306;

    $conexion = mysqli_connect($host, $username, $password, $database, $port);

    if (!$conexion) {
        // Retorna null si falla
        return null;
    }

    return $conexion;
}

function cerrarConexion($conexion) {
    if ($conexion) {
        mysqli_close($conexion);
    }
}
