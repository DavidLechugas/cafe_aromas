<?php
require_once 'conexion.php';

header('Content-Type: application/json; charset=utf-8');

$conexion = conectarBD();
if (!$conexion) {
    echo json_encode([
        'success' => false,
        'message' => 'No se pudo conectar a la base de datos.'
    ]);
    exit;
}

$sql = "SELECT Id, nombre, kilos_cosechados, pago_pendientekg FROM trabajador ORDER BY Id ASC";
$result = $conexion->query($sql);

if (!$result) {
    echo json_encode([
        'success' => false,
        'message' => 'Error al consultar nómina: ' . $conexion->error
    ]);
    cerrarConexion($conexion);
    exit;
}

$trabajadores = [];

while ($row = $result->fetch_assoc()) {
    $id              = (int)$row['Id'];
    $nombre          = $row['nombre'];
    $kilosTotales    = (float)$row['kilos_cosechados'];
    $kilosPendientes = (float)$row['pago_pendientekg'];

    if ($kilosPendientes < 0) $kilosPendientes = 0;
    if ($kilosPendientes > $kilosTotales) $kilosPendientes = $kilosTotales;

    $kilosPagados = $kilosTotales - $kilosPendientes;

    $trabajadores[] = [
        'id'               => $id,
        'nombre'           => $nombre,
        'kilos_totales'    => $kilosTotales,
        'kilos_pendientes' => $kilosPendientes,
        'kilos_pagados'    => $kilosPagados
    ];
}

cerrarConexion($conexion);

echo json_encode([
    'success'      => true,
    'trabajadores' => $trabajadores
]);
