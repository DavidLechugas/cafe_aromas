let TRABAJADORES_TOTAL = 30; // 30 trabajadores
const PRECIO_KG = 1000; // $1000 COP por kilogramo

// --- CREDENCIALES Y CLAVES DE ALMACENAMIENTO ---
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin123';
const USER_KEY = 'userCredentials'; // Clave para guardar usuarios

// --- SIMULACIÓN DE BASE DE DATOS LOCAL (localStorage) ---
let produccionData = JSON.parse(localStorage.getItem('produccionData')) || [];
let nombresTrabajadores = {};
let choferesData = JSON.parse(localStorage.getItem('choferesData')) || [];
let gastosData = [];
let pagosTrabajadores = JSON.parse(localStorage.getItem('pagosTrabajadores')) || {};

// --- VARIABLES GLOBALES PARA LA CLASIFICACIÓN (desde BD) ---
// Se rellenan desde backend/clasificacion_resumen.php
let kilosTotalClasificados = 0;
let historialClasificacion = [];
let totalCosechadoClasificacion = 0; // total cosechado que usamos en la vista de clasificación



// Cargar credenciales guardadas y asegurar que el admin existe
let userCredentials = JSON.parse(localStorage.getItem(USER_KEY)) || {};
if (Object.keys(userCredentials).length === 0 || !userCredentials[ADMIN_USER]) {
    userCredentials[ADMIN_USER] = ADMIN_PASS;
    localStorage.setItem(USER_KEY, JSON.stringify(userCredentials));
}


// --- LÓGICA DE MODAL (Reemplaza alert()) ---
const customModal = document.getElementById('custom-modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalAcceptBtn = document.getElementById('modal-accept-btn');

function showModal(title, message) {
    modalTitle.textContent = title;
    modalMessage.innerHTML = message; // Usamos innerHTML por si el historial pasa HTML
    customModal.classList.add('visible');
}

function closeModal() {
    customModal.classList.remove('visible');
    // Restaurar el contenido del modal-message a texto plano después de cerrar
    document.getElementById('modal-message').innerHTML = '';
}

modalCloseBtn.addEventListener('click', closeModal);
modalAcceptBtn.addEventListener('click', closeModal);

window.addEventListener('click', (event) => {
    if (event.target === customModal) {
        closeModal();
    }
});

// --- LÓGICA DEL CARRUSEL ---
const carouselTrack = document.getElementById('carousel-slide-track');
const prevBtn = document.getElementById('prev-slide-btn');
const nextBtn = document.getElementById('next-slide-btn');
let currentSlide = 0;
let slideWidth = 0;
const totalSlides = 5;

function updateSlideWidth() {
    if (carouselTrack && carouselTrack.firstElementChild) {
        slideWidth = carouselTrack.firstElementChild.clientWidth;
    }
}

function showSlide(index) {
    updateSlideWidth();

    if (index >= totalSlides) {
        currentSlide = 0;
    } else if (index < 0) {
        currentSlide = totalSlides - 1;
    } else {
        currentSlide = index;
    }

    carouselTrack.style.transform = `translateX(${-currentSlide * slideWidth}px)`;
}

function nextSlide() {
    showSlide(currentSlide + 1);
}

function prevSlide() {
    showSlide(currentSlide - 1);
}

if (nextBtn && prevBtn) {
    nextBtn.addEventListener('click', nextSlide);
    prevBtn.addEventListener('click', prevSlide);
}


window.addEventListener('resize', () => {
    updateSlideWidth();
    showSlide(currentSlide);
});
// -------------------------------------------------------------------

// --- LÓGICA DE INICIO DE LA APLICACIÓN (Auth y Navegación) ---

document.addEventListener('DOMContentLoaded', () => {
    // Select de trabajadores (se llenará desde la BD)
    const trabajadorSelect = document.getElementById('trabajador-select');

    function updateTrabajadorSelect() {
        if (!trabajadorSelect) return;
        trabajadorSelect.innerHTML = '<option value="">-- Elige un trabajador --</option>';

        // Recorremos los trabajadores que llegaron desde la BD
        Object.keys(nombresTrabajadores).forEach(id => {
            const nombre = nombresTrabajadores[id] || `Trabajador ${id}`;
            const option = document.createElement('option');
            option.value = id;
            option.textContent = `${id} - ${nombre}`;
            trabajadorSelect.appendChild(option);
        });
    }

    // Nueva función: cargar trabajadores desde la BD
    async function loadTrabajadoresFromDB() {
        try {
            const response = await fetch('backend/trabajadores_list.php');
            if (!response.ok) {
                console.error('HTTP error', response.status);
                showModal('Error', 'No se pudieron cargar los trabajadores desde el servidor.');
                return;
            }

            const data = await response.json();

            if (!data.success) {
                console.error('Error API:', data.message);
                showModal('Error', data.message || 'Error al cargar trabajadores.');
                return;
            }

            // data.trabajadores es un array con {Id, nombre, ...}
            nombresTrabajadores = {};
            data.trabajadores.forEach(t => {
                const id = String(t.Id);
                nombresTrabajadores[id] = t.nombre;
            });

            TRABAJADORES_TOTAL = Object.keys(nombresTrabajadores).length;

            // Opcional: copia en localStorage
            localStorage.setItem('nombresTrabajadores', JSON.stringify(nombresTrabajadores));

            // Actualizar UI que depende de trabajadores
            updateTrabajadorSelect();
            cargarListaTrabajadores();
            renderNominaReporte();
            updateStats();
        } catch (error) {
            console.error('Error al cargar trabajadores:', error);
            showModal('Error', 'Ocurrió un error al cargar los trabajadores.');
        }
    }

    // Llamamos a la carga desde BD al iniciar
    loadTrabajadoresFromDB();


    // Función para cambiar de vista (Se mueve al inicio para usarla)
    function showView(viewName) {
        document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
        const targetView = document.getElementById(viewName + '-view');
        if (targetView) {
            targetView.style.display = 'block';
        }
    }


    // Eventos de Navegación
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const viewName = this.getAttribute('data-view');
            showView(viewName);

            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');

            if (viewName === 'inventario') {
                renderProduccionTable();
            } else if (viewName === 'calcular') {
                renderNominaReporte();
            } else if (viewName === 'inicio') {
                updateStats();
            } else if (viewName === 'gestion-trabajadores') {
                cargarListaTrabajadores();
            } else if (viewName === 'gastos') {
                loadGastosFromDB();
            } else if (viewName === 'clasificacion') {
                updateClasificacionView(); // Llama a la nueva función de inicialización
            } else if (viewName === 'acerca') {
                setTimeout(() => {
                    updateSlideWidth();
                    showSlide(0);
                }, 50);
            }
        });
    });

    renderProduccionTable();
    updateStats();

    // Eventos de Auth (Simulación)
    document.getElementById('show-register').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('register-form').style.display = 'block';
    });
    document.getElementById('show-login').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('register-form').style.display = 'none';
    });

    // === LÓGICA DE INICIO DE SESIÓN (con PHP + MySQL) ===
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const user = document.getElementById('username').value.trim();
        const pass = document.getElementById('password').value;

        if (!user || !pass) {
            showModal('Error', 'Por favor, completa todos los campos.');
            return;
        }

        // Crear objeto FormData para enviar al PHP
        const formData = new FormData();
        formData.append('username', user);
        formData.append('password', pass);

        try {
            const response = await fetch('backend/login.php', {
                method: 'POST',
                body: formData
            });

            // Si el servidor respondió algo distinto de 200 OK
            if (!response.ok) {
                showModal('Error', 'Error al comunicarse con el servidor.');
                console.error('HTTP error', response.status);
                return;
            }

            const data = await response.json();

            if (data.success) {
                const nombreUsuario = data.username || user;
                showModal('Éxito', `Inicio de Sesión Exitoso! Bienvenido ${nombreUsuario}.`);

                // Tu lógica actual de mostrar la app
                document.getElementById('auth-view').style.display = 'none';
                document.getElementById('main-app').style.display = 'grid';
                showView('inicio');
                updateStats();
            } else {
                showModal('Error', data.message || 'Usuario o contraseña incorrectos. Por favor, intente de nuevo.');
            }

        } catch (error) {
            console.error('Error en la petición:', error);
            showModal('Error', 'Ocurrió un error inesperado. Intenta nuevamente.');
        }
    });


    // === LÓGICA DE REGISTRO (con PHP + MySQL) ===
    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const user = document.querySelector('#register-form input:nth-child(1)').value.trim();
        const pass = document.querySelector('#register-form input:nth-child(2)').value;
        const confirmPass = document.querySelector('#register-form input:nth-child(3)').value;

        if (user.length < 3) {
            showModal('Error', 'El nombre de usuario debe tener al menos 3 caracteres.');
            return;
        }
        if (pass !== confirmPass) {
            showModal('Error', 'La contraseña y la confirmación no coinciden.');
            return;
        }
        if (pass.length < 6) {
            showModal('Error', 'La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        // Ahora lo mandamos al backend, no a localStorage:
        const formData = new FormData();
        formData.append('username', user);
        formData.append('password', pass);
        formData.append('confirm_password', confirmPass);

        try {
            const response = await fetch('backend/registro_login.php', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                showModal('Error', 'Error al comunicarse con el servidor.');
                console.error('HTTP error', response.status);
                return;
            }

            const data = await response.json();

            if (data.success) {
                const nombreUsuario = data.username || user;
                showModal('¡Registro Exitoso!', `Cuenta creada para el usuario: ${nombreUsuario}. Ingresando al sistema...`);

                // Inicio de sesión automático (igual que tu lógica actual)
                document.getElementById('register-form').reset();
                document.getElementById('auth-view').style.display = 'none';
                document.getElementById('main-app').style.display = 'grid';
                showView('inicio');
                updateStats();
            } else {
                showModal('Error', data.message || 'No se pudo registrar el usuario.');
            }

        } catch (error) {
            console.error('Error en la petición:', error);
            showModal('Error', 'Ocurrió un error inesperado. Intenta nuevamente.');
        }
    });


    document.getElementById('logout-btn').addEventListener('click', () => {
        showModal('Sesión Cerrada', 'Ha cerrado sesión exitosamente.');
        document.getElementById('main-app').style.display = 'none';
        document.getElementById('auth-view').style.display = 'flex';
        document.getElementById('login-form').reset();
    });

    // --- LÓGICA DE GESTIÓN DE TRABAJADORES (CRUD) ---
    const gestionarTrabajadorForm = document.getElementById('gestionar-trabajador-form');
    const btnEliminar = document.getElementById('btn-eliminar-trabajador');

    if (gestionarTrabajadorForm && btnEliminar) {

        // --- Helper para actualizar nombre en BD (cambiar nombre manualmente) ---
        async function actualizarTrabajadorEnBD(id, nombre) {
            const formData = new FormData();
            formData.append('id', id);
            formData.append('nombre', nombre);
            formData.append('accion', 'update');

            const response = await fetch('backend/trabajador_update.php', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('HTTP error ' + response.status);
            }

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.message || 'Error al actualizar trabajador.');
            }
            return data; // {success, id, nombre, message}
        }

        // --- NUEVO Helper: "eliminar" -> restablecer a "trabajador X (por defecto)" ---
        async function eliminarTrabajadorEnBD(id) {
            const formData = new FormData();
            formData.append('id', id);

            const response = await fetch('backend/trabajador_delete.php', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('HTTP error ' + response.status);
            }

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.message || 'Error al eliminar (resetear) trabajador.');
            }
            return data; // {success, id, nombre, message}
        }

        // --- Submit: cambiar nombre del trabajador ---
        gestionarTrabajadorForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const idInput = document.getElementById('trabajador-id-input');
            const nombreInput = document.getElementById('trabajador-nombre-input');

            const id = parseInt(idInput.value, 10);
            const nombre = nombreInput.value.trim();

            if (!Number.isInteger(id) || id <= 0 || id > TRABAJADORES_TOTAL) {
                showModal('Error', 'ID de trabajador no válido.');
                return;
            }
            if (!nombre) {
                showModal('Error', 'El nombre no puede estar vacío.');
                return;
            }

            try {
                const data = await actualizarTrabajadorEnBD(id, nombre);

                const idStr = String(id);
                nombresTrabajadores[idStr] = data.nombre;
                localStorage.setItem('nombresTrabajadores', JSON.stringify(nombresTrabajadores));

                showModal('Éxito', `Nombre del Trabajador ${id} actualizado a: ${data.nombre}`);

                cargarListaTrabajadores();
                // Actualizar select de trabajadores si existe
                const trabajadorSelect = document.getElementById('trabajador-select');
                if (trabajadorSelect) {
                    trabajadorSelect.innerHTML = '<option value="">-- Elige un trabajador --</option>';
                    Object.keys(nombresTrabajadores).forEach(key => {
                        const nombreOpt = nombresTrabajadores[key] || `trabajador ${key} (por defecto)`;
                        const option = document.createElement('option');
                        option.value = key;
                        option.textContent = `${key} - ${nombreOpt}`;
                        trabajadorSelect.appendChild(option);
                    });
                }

                idInput.value = '';
                nombreInput.value = '';
            } catch (error) {
                console.error('Error actualizando trabajador:', error);
                showModal('Error', error.message);
            }
        });

        // --- Botón Eliminar: restablecer al nombre por defecto en BD ---
        btnEliminar.addEventListener('click', async function () {
            const idInput = document.getElementById('trabajador-id-input');
            const id = parseInt(idInput.value, 10);

            if (!Number.isInteger(id) || id <= 0 || id > TRABAJADORES_TOTAL) {
                showModal('Error', 'ID de trabajador no válido.');
                return;
            }

            try {
                const data = await eliminarTrabajadorEnBD(id);

                const idStr = String(id);
                // Nombre devuelto por el backend: "trabajador X (por defecto)"
                nombresTrabajadores[idStr] = data.nombre;
                localStorage.setItem('nombresTrabajadores', JSON.stringify(nombresTrabajadores));

                showModal('Éxito', `Nombre personalizado del Trabajador ${id} eliminado. Restablecido a "${data.nombre}".`);

                cargarListaTrabajadores();

                const trabajadorSelect = document.getElementById('trabajador-select');
                if (trabajadorSelect) {
                    trabajadorSelect.innerHTML = '<option value="">-- Elige un trabajador --</option>';
                    Object.keys(nombresTrabajadores).forEach(key => {
                        const nombreOpt = nombresTrabajadores[key] || `trabajador ${key} (por defecto)`;
                        const option = document.createElement('option');
                        option.value = key;
                        option.textContent = `${key} - ${nombreOpt}`;
                        trabajadorSelect.appendChild(option);
                    });
                }

                idInput.value = '';
                document.getElementById('trabajador-nombre-input').value = '';
            } catch (error) {
                console.error('Error eliminando (reseteando) trabajador:', error);
                showModal('Error', error.message);
            }
        });
    }

});


// --- LÓGICA DE GESTIÓN DE NOMBRES DE TRABAJADORES (EN VISTA INVENTARIO - SOLO LECTURA) ---

document.getElementById('trabajador-select').addEventListener('change', function () {
    const id = this.value;
    const container = document.getElementById('nombre-input-container');
    const inputNombre = document.getElementById('trabajador-nombre');

    if (id) {
        container.style.display = 'block';
        const nombreActual = nombresTrabajadores[id] || `Trabajador ${id}`;
        inputNombre.value = nombreActual;
        inputNombre.disabled = true;
    } else {
        container.style.display = 'none';
    }
});


// Función para cargar la lista de trabajadores en la vista de Gestión
function cargarListaTrabajadores() {
    const lista = document.getElementById('lista-nombres-trabajadores');
    if (!lista) return;
    lista.innerHTML = '';

    // Recorremos los IDs reales obtenidos desde la BD
    Object.keys(nombresTrabajadores).forEach(id => {
        const nombre = nombresTrabajadores[id] || `Trabajador ${id} (por defecto)`;
        const li = document.createElement('li');
        li.textContent = `ID ${id}: ${nombre}`;
        lista.appendChild(li);
    });
}


// --- LÓGICA DE REGISTRO DE PRODUCCIÓN (Inventario + BD) ---
document.getElementById('produccion-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const idTrabajador = document.getElementById('trabajador-select').value;
    const kilos = parseFloat(document.getElementById('kilos-input').value);

    if (!idTrabajador || kilos <= 0 || isNaN(kilos)) {
        showModal('Error de Validación', 'Por favor, selecciona un trabajador e ingresa una cantidad de kilos válida.');
        return;
    }

    const nombre = nombresTrabajadores[idTrabajador] || `Trabajador ${idTrabajador}`;

    // 1. Enviar al backend para registrar en la base de datos
    const formData = new FormData();
    formData.append('id_trabajador', idTrabajador);
    formData.append('kilos', kilos);

    try {
        const response = await fetch('backend/produccion_registrar.php', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            console.error('HTTP error', response.status);
            showModal('Error', 'Error al comunicarse con el servidor al registrar la producción.');
            return;
        }

        const data = await response.json();

        if (!data.success) {
            showModal('Error', data.message || 'No se pudo registrar la producción en la base de datos.');
            return;
        }

        // 2. Si la BD respondió OK, registramos también en el historial local
        let newCosechaId = produccionData.length + 1;

        const nuevoRegistro = {
            id: newCosechaId,
            idTrabajador: idTrabajador,
            nombre: nombre,
            kilos: kilos,
            fecha: new Date().toLocaleString()
        };

        produccionData.push(nuevoRegistro);
        localStorage.setItem('produccionData', JSON.stringify(produccionData));

        showModal(
            'Éxito',
            `Registro **ID ${nuevoRegistro.id}**: ${kilos.toFixed(2)} kg para ${nombre} exitoso. ` +
            `Kilos acumulados pendientes de clasificar: ${getGlobalProductionTotal().toFixed(2)} KG`
        );

        this.reset();
        document.getElementById('nombre-input-container').style.display = 'none';
        renderProduccionTable();
        updateStats();
        updateClasificacionView();

    } catch (error) {
        console.error('Error en la petición de producción:', error);
        showModal('Error', 'Ocurrió un error inesperado al registrar la producción. Intenta nuevamente.');
    }
});


// Función para renderizar la tabla de producción
function renderProduccionTable() {
    const tbody = document.querySelector('#produccion-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const ultimosRegistros = produccionData.slice(-10).reverse();

    ultimosRegistros.forEach(registro => {
        const row = tbody.insertRow();
        row.insertCell().textContent = registro.id;

        const nombreActual = registro.nombre; // nombre histórico
        row.insertCell().textContent = nombreActual;

        row.insertCell().textContent = registro.kilos.toFixed(2);
        row.insertCell().textContent = registro.fecha;
    });
}


// Función para actualizar las estadísticas de la vista Inicio
// Función para actualizar las estadísticas de la vista Inicio
async function updateStats() {
    const totalCosechadoEl = document.getElementById('total-cosechado');
    const pagosPendientesEl = document.getElementById('pagos-pendientes');

    let totalKilosCosechados = 0;

    try {
        const response = await fetch('backend/estadisticas_globales.php');

        if (response.ok) {
            const data = await response.json();

            if (data.success) {
                totalKilosCosechados = parseFloat(data.totalKilosCosechados) || 0;
            } else {
                console.error('Error en estadísticas backend:', data.message);
                // Fallback: usar lo que tenemos en el navegador
                totalKilosCosechados = getGlobalProductionTotal();
            }
        } else {
            console.error('HTTP error al obtener estadísticas:', response.status);
            totalKilosCosechados = getGlobalProductionTotal();
        }
    } catch (error) {
        console.error('Error al obtener estadísticas del servidor:', error);
        totalKilosCosechados = getGlobalProductionTotal();
    }

    // 2. Kilos totales pagados (como ya lo manejabas con pagosTrabajadores)
    const totalKilosPagados = Object.values(pagosTrabajadores)
        .reduce((sum, paidKilos) => sum + paidKilos, 0);

    // 3. Kilos y pagos PENDIENTES
    const kilosPendientes = totalKilosCosechados - totalKilosPagados;
    const pagoEstimado = kilosPendientes * PRECIO_KG;

    // Mostrar el total cosechado (histórico)
    if (totalCosechadoEl) {
        totalCosechadoEl.textContent = `${totalKilosCosechados.toFixed(2)} kg`;
    }

    // Mostrar solo los pagos PENDIENTES
    if (pagosPendientesEl) {
        pagosPendientesEl.textContent = `$ ${pagoEstimado.toLocaleString('es-CO')} COP`;
    }
}



// --- LÓGICA DE CÁLCULO DE NÓMINA Y HISTORIAL ---
// Función para renderizar el reporte de nómina (Trabajadores) desde la BD
async function renderNominaReporte() {
    const reporteTableBody = document.querySelector('#reporte-cosecha-table tbody');
    if (!reporteTableBody) return;
    reporteTableBody.innerHTML = '';

    try {
        const response = await fetch('backend/nomina_reporte.php');
        if (!response.ok) {
            console.error('HTTP error en nómina:', response.status);
            showModal('Error', 'No se pudo cargar la nómina desde el servidor.');
            return;
        }

        const data = await response.json();
        if (!data.success) {
            console.error('Error API nómina:', data.message);
            showModal('Error', data.message || 'Error al cargar la nómina.');
            return;
        }

        const trabajadores = data.trabajadores || [];

        trabajadores.forEach(t => {
            const id = String(t.id);
            const nombre = t.nombre || nombresTrabajadores[id] || `Trabajador ${id}`;

            // 🟢 Total de kilos que ha hecho el trabajador
            const kilosTotales = parseFloat(t.kilos_totales) || 0;

            // 🔒 Kilos pendientes (solo para cálculo interno, NO se muestran como columna)
            const kilosPendientes = parseFloat(t.kilos_pendientes) || 0;
            const pagoPendiente = kilosPendientes * PRECIO_KG;

            const row = reporteTableBody.insertRow();
            row.insertCell().textContent = id;
            row.insertCell().textContent = nombre;

            // 👉 Esta columna es "Kilos Cosechados" y muestra los kilos totales
            row.insertCell().textContent = kilosTotales.toFixed(2);

            // 👉 Esta columna es "Pago Pendiente"
            row.insertCell().textContent = `$ ${pagoPendiente.toLocaleString('es-CO')}`;

            const actionCell = row.insertCell();

            if (kilosPendientes > 0) {
                // Botón Historial
                const btnHistorial = document.createElement('button');
                btnHistorial.textContent = 'Ver Historial';
                btnHistorial.classList.add('btn-small-historial');
                btnHistorial.dataset.trabajadorId = id;
                actionCell.appendChild(btnHistorial);

                // Botón Pagado
                const btnPaid = document.createElement('button');
                btnPaid.textContent = 'Pagado';
                btnPaid.classList.add('btn-small-paid');
                btnPaid.dataset.trabajadorId = id;

                // Usamos kilosTotales para mantener la lógica de markAsPaid
                btnPaid.dataset.kilosTotales = kilosTotales;
                actionCell.appendChild(btnPaid);
            } else {
                actionCell.textContent = 'Al día';
            }
        });

        // Conectar eventos Historial (sigue usando produccionData por ahora)
        document.querySelectorAll('.btn-small-historial').forEach(btn => {
            btn.addEventListener('click', function () {
                const trabajadorId = this.dataset.trabajadorId;
                showHistorialTrabajador(trabajadorId);
            });
        });

        // Conectar evento Pagado
        document.querySelectorAll('.btn-small-paid').forEach(btn => {
            btn.addEventListener('click', function () {
                const trabajadorId = this.dataset.trabajadorId;
                const totalKilos = parseFloat(this.dataset.kilosTotales);
                markAsPaid(trabajadorId, totalKilos);
            });
        });

    } catch (error) {
        console.error('Error en nómina:', error);
        showModal('Error', 'Ocurrió un error al cargar la nómina.');
    }
}


// --- FUNCIÓN: Marcar como pagado (actualiza BD + localStorage) ---
async function markAsPaid(id, totalKilos) {
    const nombre = nombresTrabajadores[id] || `Trabajador ${id}`;
    const kilosPagadosPrevios = pagosTrabajadores[id] || 0;
    const kilosPendientes = totalKilos - kilosPagadosPrevios;

    if (kilosPendientes <= 0) {
        showModal('Advertencia', `${nombre} ya está al día. No hay pagos pendientes.`);
        return;
    }

    const pagoRealizado = kilosPendientes * PRECIO_KG;

    // 1. Avisar al backend que pagamos TODOS los kilos pendientes
    const formData = new FormData();
    formData.append('id', id);

    try {
        const response = await fetch('backend/trabajador_pagar.php', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            console.error('HTTP error al pagar:', response.status);
            showModal('Error', 'No se pudo registrar el pago en el servidor.');
            return;
        }

        const data = await response.json();
        if (!data.success) {
            showModal('Error', data.message || 'No se pudo registrar el pago.');
            return;
        }

        // 2. Mantener compatibilidad con la lógica local (pagosTrabajadores)
        pagosTrabajadores[id] = totalKilos;
        localStorage.setItem('pagosTrabajadores', JSON.stringify(pagosTrabajadores));

        showModal(
            'Pago Registrado',
            `Se ha registrado el pago de **${kilosPendientes.toFixed(2)} kg** ` +
            `($ ${pagoRealizado.toLocaleString('es-CO')}) a **${nombre}** (ID ${id}).`
        );

        // 3. Rerenderizar la tabla de nómina y actualizar estadísticas
        renderNominaReporte();
        updateStats();

    } catch (error) {
        console.error('Error al registrar pago:', error);
        showModal('Error', 'Ocurrió un error al registrar el pago. Intenta nuevamente.');
    }
}


// --- FUNCIÓN PARA MOSTRAR HISTORIAL DE COSECHA EN MODAL ---
function showHistorialTrabajador(id) {
    const nombre = nombresTrabajadores[id] || `Trabajador ${id}`;

    // 1. Filtrar los registros de producción solo para este trabajador
    const historial = produccionData
        .filter(reg => String(reg.idTrabajador) === String(id))
        .reverse(); // Mostrar lo más reciente primero

    if (historial.length === 0) {
        showModal(`Historial de Cosecha - ID ${id}`, `No hay registros de cosecha para ${nombre}.`);
        return;
    }

    // 2. Construir el contenido HTML para el historial
    let contentHTML = `
        <ul class="historial-list">
        <li><strong>ID Cosecha</strong><strong>Kilos</strong><strong>Fecha y Hora</strong></li>
    `;

    historial.forEach(reg => {
        contentHTML += `
            <li>
                <span>${reg.id}</span>
                <span class="historial-kilos">${reg.kilos.toFixed(2)} kg</span>
                <span>${reg.fecha}</span>
            </li>
        `;
    });

    contentHTML += `</ul>`;

    // 3. Mostrar el modal con el contenido HTML
    showModal(`Historial de Cosecha - ${nombre} (ID ${id})`, contentHTML);
}


// --- LÓGICA DE PAGO DE CHOFERES Y EXCEL  ---
document.getElementById('chofer-pago-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const chofer = document.getElementById('chofer-select').value;
    const viajes = parseInt(document.getElementById('viajes-input').value);
    const tarifa = parseFloat(document.getElementById('tarifa-input').value);

    if (!chofer || viajes <= 0 || tarifa <= 0 || isNaN(viajes) || isNaN(tarifa)) {
        showModal('Error de Validación', 'Por favor, ingresa datos válidos para el pago del chofer.');
        return;
    }

    const formData = new FormData();
    formData.append('chofer', chofer);
    formData.append('viajes', viajes);
    formData.append('tarifa', tarifa);

    try {
        const response = await fetch('backend/chofer_registrar.php', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            console.error('HTTP error', response.status);
            showModal('Error', 'Error al comunicarse con el servidor al registrar el pago del chofer.');
            return;
        }

        const data = await response.json();

        if (!data.success) {
            showModal('Error', data.message || 'No se pudo registrar el pago del chofer.');
            return;
        }

        const pagoTotal = data.pago_total;

        showModal(
            'Éxito',
            `Pago registrado para ${data.chofer}: ` +
            `$ ${pagoTotal.toLocaleString('es-CO')} COP por ${data.viajes} viajes.`
        );

        this.reset();
    } catch (error) {
        console.error('Error en la petición de chofer:', error);
        showModal('Error', 'Ocurrió un error inesperado al registrar el pago del chofer. Intenta nuevamente.');
    }
});


// Función genérica para exportar a CSV
function exportToCsv(filename, data) {
    const processedData = data.map(row =>
        row.map(item => `"${String(item).replace(/"/g, '""')}"`)
    );

    const csvContent = "data:text/csv;charset=utf-8," + processedData.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

document.getElementById('generar-reporte-cosecha-btn').addEventListener('click', () => {
    // Para el CSV de reporte, usamos Kilos Totales Cosechados (no pendientes) para tener el historial completo.
    const headers = ["ID", "Nombre", "Kilos Totales Cosechados (kg)", "Kilos Pagados (kg)", "Kilos Pendientes (kg)", "Pago Pendiente ($COP)"];
    const data = [headers];

    const resumenPagos = {};
    produccionData.forEach(reg => {
        if (!resumenPagos[reg.idTrabajador]) {
            resumenPagos[reg.idTrabajador] = { kilos: 0, nombre: nombresTrabajadores[reg.idTrabajador] || `Trabajador ${reg.idTrabajador}` };
        }
        resumenPagos[reg.idTrabajador].kilos += reg.kilos;
    });

    for (let i = 1; i <= TRABAJADORES_TOTAL; i++) {
        const id = String(i);
        const nombre = nombresTrabajadores[id] || `Trabajador ${id}`;
        const entry = resumenPagos[id] || { kilos: 0 };

        const kilosPagadosPrevios = pagosTrabajadores[id] || 0;
        const kilosPendientes = entry.kilos - kilosPagadosPrevios;
        const pagoPendiente = kilosPendientes * PRECIO_KG;

        data.push([
            id,
            nombre,
            entry.kilos.toFixed(2),
            kilosPagadosPrevios.toFixed(2),
            kilosPendientes.toFixed(2),
            pagoPendiente.toFixed(2)
        ]);
    }
    exportToCsv('Reporte_Nomina_Cosecha.csv', data);
    showModal('Descarga Éxito', 'Reporte de Nómina de Cosecha generado como CSV.');
});

// Reporte de Pago de Choferes csv
document.getElementById('generar-reporte-choferes-btn').addEventListener('click', async () => {
    // Ajustamos headers a lo que realmente tenemos en la BD
    const headers = ["ID", "Chofer", "Viajes", "Tarifa por Viaje ($COP)", "Pago Total ($COP)"];
    const data = [headers];

    try {
        const response = await fetch('backend/chofer_list.php');
        if (!response.ok) {
            console.error('HTTP error al cargar choferes:', response.status);
            showModal('Error', 'No se pudo cargar el reporte de choferes desde el servidor.');
            return;
        }

        const result = await response.json();
        if (!result.success) {
            console.error('Error API choferes:', result.message);
            showModal('Error', result.message || 'Error al cargar el reporte de choferes.');
            return;
        }

        const registros = result.registros || [];

        registros.forEach(reg => {
            const viajes = reg.viajes || 0;
            const tarifa = reg.tarifa || 0;
            const total = viajes * tarifa;

            data.push([
                reg.id,
                reg.chofer,
                viajes,
                tarifa.toFixed(2),
                total.toFixed(2)
            ]);
        });

        exportToCsv('Reporte_Pago_Choferes.csv', data);
        showModal('Descarga Éxito', 'Reporte de Pago de Choferes generado como CSV.');
    } catch (error) {
        console.error('Error al generar reporte de choferes:', error);
        showModal('Error', 'Ocurrió un error al generar el reporte de choferes.');
    }
});


// --- LÓGICA PARA GESTIÓN DE GASTOS ---

// Función para renderizar la tabla de gastos
// --- LÓGICA PARA GESTIÓN DE GASTOS ---

// Cargar gastos desde la base de datos
async function loadGastosFromDB() {
    try {
        const response = await fetch('backend/gastos_list.php');
        if (!response.ok) {
            console.error('HTTP error al cargar gastos:', response.status);
            showModal('Error', 'No se pudieron cargar los gastos desde el servidor.');
            return;
        }

        const data = await response.json();
        if (!data.success) {
            console.error('Error API gastos:', data.message);
            showModal('Error', data.message || 'Error al cargar los gastos.');
            return;
        }

        // Guardamos los gastos que vienen del backend en memoria
        gastosData = data.gastos || [];
        renderGastosTable();
    } catch (error) {
        console.error('Error al cargar gastos:', error);
        showModal('Error', 'Ocurrió un error al cargar los gastos.');
    }
}

// Función para renderizar la tabla de gastos
function renderGastosTable() {
    const tbody = document.querySelector('#gastos-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    // Ordenar del más reciente al más antiguo por fecha, luego por Id
    const gastosOrdenados = [...gastosData].sort((a, b) => {
        const dateA = new Date(a.fecha);
        const dateB = new Date(b.fecha);
        if (dateA.getTime() !== dateB.getTime()) {
            return dateB - dateA; // Más reciente primero
        }
        return b.id - a.id; // Si misma fecha, el de mayor Id primero
    });

    gastosOrdenados.forEach(gasto => {
        const row = tbody.insertRow();
        row.insertCell().textContent = gasto.id;
        row.insertCell().textContent = gasto.fecha;
        row.insertCell().textContent = gasto.descripcion;
        row.insertCell().textContent = `$ ${gasto.monto.toLocaleString('es-CO')}`;
    });
}


// Lógica de Registro de Gastos (PHP + MySQL)
const registroGastoForm = document.getElementById('registro-gasto-form');

if (registroGastoForm) {
    registroGastoForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const descripcion = document.getElementById('gasto-descripcion').value.trim();
        const monto = parseFloat(document.getElementById('gasto-monto').value);
        const fecha = document.getElementById('gasto-fecha').value; // Formato YYYY-MM-DD

        if (!descripcion || monto <= 0 || isNaN(monto) || !fecha) {
            showModal('Error de Validación', 'Por favor, completa todos los campos con valores válidos.');
            return;
        }

        const formData = new FormData();
        formData.append('descripcion', descripcion);
        formData.append('monto', monto);
        formData.append('fecha', fecha);

        try {
            const response = await fetch('backend/gasto_registrar.php', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                console.error('HTTP error al registrar gasto:', response.status);
                showModal('Error', 'Error al comunicarse con el servidor al registrar el gasto.');
                return;
            }

            const data = await response.json();

            if (!data.success) {
                showModal('Error', data.message || 'No se pudo registrar el gasto.');
                return;
            }

            showModal(
                'Éxito',
                `Gasto de $ ${monto.toLocaleString('es-CO')} COP registrado para: ${descripcion}.`
            );

            this.reset();

            // Volvemos a cargar desde la BD (actualiza gastosData + tabla)
            await loadGastosFromDB();

        } catch (error) {
            console.error('Error en el registro de gasto:', error);
            showModal('Error', 'Ocurrió un error inesperado al registrar el gasto.');
        }
    });
}


// Lógica para exportar el reporte de gastos a CSV (desde la BD)
document.getElementById('generar-reporte-gastos-btn').addEventListener('click', async () => {
    const headers = ["ID", "Fecha", "Descripción", "Monto ($COP)"];
    const data = [headers];

    try {
        const response = await fetch('backend/gastos_list.php');
        if (!response.ok) {
            console.error('HTTP error al cargar gastos para CSV:', response.status);
            showModal('Error', 'No se pudo cargar el reporte de gastos desde el servidor.');
            return;
        }

        const result = await response.json();
        if (!result.success) {
            console.error('Error API gastos CSV:', result.message);
            showModal('Error', result.message || 'Error al generar el reporte de gastos.');
            return;
        }

        const gastos = result.gastos || [];

        gastos.forEach(reg => {
            data.push([
                reg.id,
                reg.fecha,
                reg.descripcion,
                reg.monto.toFixed(2)
            ]);
        });

        exportToCsv('Reporte_Gastos.csv', data);
        showModal('Descarga Éxito', 'Reporte de Gastos generado como CSV.');
    } catch (error) {
        console.error('Error al generar reporte de gastos:', error);
        showModal('Error', 'Ocurrió un error al generar el reporte de gastos.');
    }
});


// -------------------------------------------------------------------
// --- LÓGICA DE CLASIFICACIÓN DE COSECHAS (NUEVA LÓGICA GLOBAL) ---
// -------------------------------------------------------------------

// Variables para la nueva vista de clasificación
const cosechaKilosTotalDisplay = document.getElementById('cosecha-kilos-total-display');
const cosechaKilosRestanteDisplay = document.getElementById('cosecha-kilos-restante-display');
const registroClasificacionForm = document.getElementById('registro-clasificacion-form');
const btnRegistrarClasificacion = document.getElementById('btn-registrar-clasificacion');
const clasificacionHistorialTableBody = document.querySelector('#clasificacion-historial-table tbody');
const lastClassificationDateEl = document.getElementById('last-classification-date');

// Función para calcular el total de kilos cosechados (acumulado total)
function getGlobalProductionTotal() {
    return produccionData.reduce((sum, reg) => sum + reg.kilos, 0);
}

// Función para renderizar la tabla de historial
function renderHistorialClasificacion() {
    if (!clasificacionHistorialTableBody) return;
    clasificacionHistorialTableBody.innerHTML = '';

    // El backend ya viene ordenado, pero si quieres puedes ordenar aquí también
    const historialOrdenado = [...historialClasificacion];

    historialOrdenado.forEach(registro => {
        const row = clasificacionHistorialTableBody.insertRow();

        const cenicafe = parseFloat(registro.kilos_cenicafe) || 0;
        const variedad = parseFloat(registro.kilos_colombia) || 0;
        const total   = parseFloat(registro.total_clasificado) || 0;

        row.insertCell().textContent = registro.fecha; // YYYY-MM-DD
        row.insertCell().textContent = cenicafe.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        row.insertCell().textContent = variedad.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        row.insertCell().textContent = total.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    });
}


/**
 * Actualiza la vista de clasificación con los totales globales.
 */
function updateClasificacionView() {
    if (!cosechaKilosTotalDisplay) return;

    const totalCosechado = getGlobalProductionTotal();
    const kilosPendientes = totalCosechado - kilosTotalClasificados;
    const ultimoRegistro = historialClasificacion.length > 0 ? historialClasificacion[historialClasificacion.length - 1] : null;

    cosechaKilosTotalDisplay.textContent = totalCosechado.toFixed(2).toLocaleString('es-CO');
    cosechaKilosRestanteDisplay.textContent = kilosPendientes.toFixed(2).toLocaleString('es-CO');

    // Actualizar fecha de última clasificación
    if (lastClassificationDateEl) {
        lastClassificationDateEl.textContent = ultimoRegistro ? `Última Clasificación: ${ultimoRegistro.fecha}` : 'Última Clasificación: Nunca';
    }

    // Habilitar / Deshabilitar formulario
    if (kilosPendientes > 0) {
        btnRegistrarClasificacion.disabled = false;
        btnRegistrarClasificacion.textContent = 'Registrar Clasificación Pendiente';
        // Sugerir la cantidad a clasificar en los placeholders
        document.getElementById('kilos-cenicafe').placeholder = `Máx. ${kilosPendientes.toFixed(2)} KG`;
        document.getElementById('kilos-variedad-colombia').placeholder = `Máx. ${kilosPendientes.toFixed(2)} KG`;
        registroClasificacionForm.querySelector('input#kilos-cenicafe').required = true;
        registroClasificacionForm.querySelector('input#kilos-variedad-colombia').required = true;
    } else {
        btnRegistrarClasificacion.disabled = true;
        btnRegistrarClasificacion.textContent = 'No hay Kilos Pendientes de Clasificar';
        document.getElementById('kilos-cenicafe').placeholder = '0.00 KG';
        document.getElementById('kilos-variedad-colombia').placeholder = '0.00 KG';
        // Para que no salten errores de required cuando está deshabilitado
        registroClasificacionForm.querySelector('input#kilos-cenicafe').required = false;
        registroClasificacionForm.querySelector('input#kilos-variedad-colombia').required = false;
    }

    // Renderizar la tabla de historial
    renderHistorialClasificacion();
}

// 2. Manejar el registro de la clasificación
if (registroClasificacionForm) {
    registroClasificacionForm.addEventListener('submit', function (e) {
        e.preventDefault();

        // Si el botón está deshabilitado por no haber kilos pendientes, no procesar
        if (btnRegistrarClasificacion.disabled) {
            showModal('Advertencia', 'No hay kilos de cosecha pendientes de clasificar.');
            return;
        }

        const kilosCenicafe = parseFloat(document.getElementById('kilos-cenicafe').value) || 0;
        const kilosVariedadColombia = parseFloat(document.getElementById('kilos-variedad-colombia').value) || 0;
        const totalClasificadoEnEstaSesion = kilosCenicafe + kilosVariedadColombia;

        const totalCosechado = getGlobalProductionTotal();
        const kilosPendientes = totalCosechado - kilosTotalClasificados;


        if (kilosCenicafe < 0 || kilosVariedadColombia < 0) {
            showModal('Error', 'Los kilos clasificados no pueden ser valores negativos.');
            return;
        }

        if (totalClasificadoEnEstaSesion <= 0) {
            showModal('Advertencia', 'Debe clasificar una cantidad de kilos mayor a cero.');
            return;
        }

        // Verificar que el total clasificado no exceda los kilos pendientes
        if (totalClasificadoEnEstaSesion > kilosPendientes) {
            showModal('Advertencia',
                `El total clasificado (${totalClasificadoEnEstaSesion.toFixed(2).toLocaleString('es-CO')} KG) excede los kilos pendientes (${kilosPendientes.toFixed(2).toLocaleString('es-CO')} KG). Por favor, corrija los valores.`
            );
            return;
        }

        // --- Actualizar el estado global ---
        kilosTotalClasificados += totalClasificadoEnEstaSesion;

        // Registrar la sesión de clasificación en el historial
        const nuevoRegistroHistorial = {
            fecha: new Date().toLocaleString(),
            cenicafe: kilosCenicafe,
            variedadColombia: kilosVariedadColombia,
            totalClasificado: totalClasificadoEnEstaSesion
        };

        historialClasificacion.push(nuevoRegistroHistorial);

        localStorage.setItem('kilosTotalClasificados', kilosTotalClasificados);
        localStorage.setItem('historialClasificacion', JSON.stringify(historialClasificacion));

        // Muestra el mensaje de éxito
        showModal('Éxito',
            `Clasificación global registrada.<br>` +
            `Kilos Cenicafé: **${kilosCenicafe.toFixed(2).toLocaleString('es-CO')} KG**.<br>` +
            `Kilos Variedad Colombia: **${kilosVariedadColombia.toFixed(2).toLocaleString('es-CO')} KG**.<br>`
        );

        this.reset();
        updateClasificacionView();
    });
}


// -------------------------------------------------------------------
// Se asegura de que la vista de clasificación se inicialice correctamente al cargar.
document.addEventListener('DOMContentLoaded', () => {
    // ... otros listeners
    // No llamamos a updateClasificacionView aquí, se llama desde el listener de navegación.
});