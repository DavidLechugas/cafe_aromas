<?php
require_once 'conexion.php';

class Registro{
    private $conexion;
    private $nombre;
    private $id;

    public function __construct($nombre, $id, $seccion) {
        $this->conexion = conectarBD();
        $this->nombre = $nombre;
        $this->id = $id;
        if($seccion == 1){
            $this->registrarPersona($nombre, $id);
            $this->registrarTrabajador($id);
        } else if($seccion == 2){
            $this->rProduccion($id, $_POST['kilos']);
        }

    }
    private function registrarPersona($nombre, $id) {
        $stmt = $this->conexion->prepare("INSERT INTO personas (`cedula`, `nombrecompleto`, `fecha`) VALUES (?,?,?)");
        $rol = 'trabajador';
        $stmt->bind_param('iss', $this->id, $this->nombre, date('Y-m-d'));
        if ($stmt->execute()) {
            return true;
        } else {
            return false;
        }

    }

    private function registrarTrabajador($id) {
        $stmt = $this->conexion->prepare("INSERT INTO trabajador (`cedula_usuario`, `habilitado`, `pagos_pendiente`, `kilos_trabajados`) VALUES (?,?,?,?)");
        $habilitado = 1;
        $pagos = 0;
        $kilos = 0;
        $stmt->bind_param('iiii', $this->id, $habilitado, $pagos, $kilos);
        
        if ($stmt->execute()) {
            return true;
        } else {
            return false;
        }
    }
    private function rProduccion($id, $kilos) {
        $stmt = $this->conexion->prepare("INSERT INTO produccion (`cedula_trabajador`, `cantidad_kilos`) VALUES (?,?)");
        $stmt->bind_param('id', $this->id, $kilos);
        
        if ($stmt->execute()) {
            return true;
        } else {
            return false;
        }
    }


    public function __destruct() {
        cerrarConexion($this->conexion);
    }
}

class trabajador{
    private $id;
    private $nombre;

    public function __construct($id, $nombre) {
        $this->id = $id;
        $this->nombre = $nombre;
    }

    private $conexion;

    public function __construct($id, $nombre) {
        $this->id = $id;
        $this->nombre = $nombre;
        $this->conexion = conectarBD();
    }

    public function trabajadoresJson() {
        $stmt = $this->conexion->prepare("SELECT id, nombre FROM trabajador WHERE id = ?");
        $stmt->bind_param('i', $this->id);
        $stmt->execute();
        $resultado = $stmt->get_result();
        $datos = $resultado->fetch_assoc();
        $stmt->close();
        return json_encode($datos);
    }

    public function __destruct() {
        cerrarConexion($this->conexion);
    }
}