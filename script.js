const supabaseUrl = 'https://hfkqihmhejipmyhemzys.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhma3FpaG1oZWppcG15aGVtenlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMjIxNTgsImV4cCI6MjA5MjY5ODE1OH0.ldH60pDU8ms8SmyEJ0NODqB4kv1qk541cnH5CJNaJqE';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

const PRECIO_KG = 1000;

// --- ESTADO GLOBAL ---
let nombresTrabajadores = {};
let produccionData = [];
let historialClasificacion = [];
let kilosTotalClasificados = 0;
let sessionActive = false;

// --- LÓGICA DE MODAL ---
const customModal = document.getElementById('custom-modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalAcceptBtn = document.getElementById('modal-accept-btn');

function showModal(title, message) {
    if (!customModal) {
        alert(`${title}: ${message}`);
        return;
    }
    modalTitle.textContent = title;
    modalMessage.innerHTML = message; 
    customModal.classList.add('visible');
}

function closeModal() {
    customModal.classList.remove('visible');
    modalMessage.innerHTML = '';
}

[modalCloseBtn, modalAcceptBtn].forEach(btn => btn?.addEventListener('click', closeModal));

// --- LÓGICA DEL CARRUSEL ---
const carouselTrack = document.getElementById('carousel-slide-track');
const prevBtn = document.getElementById('prev-slide-btn');
const nextBtn = document.getElementById('next-slide-btn');
let currentSlide = 0;
const totalSlides = 6; // Ajustado a 6 imágenes

function showSlide(index) {
    if (!carouselTrack) return;
    const slideWidth = carouselTrack.firstElementChild?.clientWidth || 0;
    if (index >= totalSlides) currentSlide = 0;
    else if (index < 0) currentSlide = totalSlides - 1;
    else currentSlide = index;
    carouselTrack.style.transform = `translateX(${-currentSlide * slideWidth}px)`;
}

nextBtn?.addEventListener('click', () => showSlide(currentSlide + 1));
prevBtn?.addEventListener('click', () => showSlide(currentSlide - 1));
window.addEventListener('resize', () => showSlide(currentSlide));

// --- INICIO Y NAVEGACIÓN ---

document.addEventListener('DOMContentLoaded', async () => {
    const savedSession = sessionStorage.getItem('cafe_aromas_session');
    if (savedSession) {
        sessionActive = true;
        document.getElementById('auth-view').style.display = 'none';
        document.getElementById('main-app').style.display = 'grid';
        showView('inicio');
    }

    await loadInitialData();

    // Navegación optimizada
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', async function (e) {
            e.preventDefault();
            if (!sessionActive) return; 

            const viewName = this.getAttribute('data-view');
            showView(viewName);

            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');

            // Carga bajo demanda
            const actions = {
                'inventario': loadProduccionFromDB,
                'calcular': renderNominaReporte,
                'inicio': updateStats,
                'gestion-trabajadores': cargarListaTrabajadoresUI,
                'gastos': loadGastosFromDB,
                'clasificacion': loadClasificacionFromDB
            };
            if (actions[viewName]) await actions[viewName]();
        });
    });

    // Auth Listeners
    document.getElementById('login-form')?.addEventListener('submit', handleLogin);
    document.getElementById('register-form')?.addEventListener('submit', handleRegister);
    document.getElementById('logout-btn')?.addEventListener('click', handleLogout);

    const toggleAuth = (showRegister) => {
        document.getElementById('login-form').style.display = showRegister ? 'none' : 'block';
        document.getElementById('register-form').style.display = showRegister ? 'block' : 'none';
    };
    document.getElementById('show-register')?.addEventListener('click', (e) => { e.preventDefault(); toggleAuth(true); });
    document.getElementById('show-login')?.addEventListener('click', (e) => { e.preventDefault(); toggleAuth(false); });

    // Reportes
    document.getElementById('generar-reporte-cosecha-btn')?.addEventListener('click', () => downloadCSV('reporte_cosecha.csv', 'reporte-cosecha-table'));
    document.getElementById('generar-reporte-choferes-btn')?.addEventListener('click', async () => {
        const { data } = await supabaseClient.from('chofer').select('*');
        downloadDataAsCSV('reporte_choferes.csv', ['ID', 'Nombre', 'Viajes', 'Tarifa', 'Total'], data.map(c => [c.Id, c.nombre, c.numero_viajes, c.tarifa, c.numero_viajes * c.tarifa]));
    });
    document.getElementById('generar-reporte-gastos-btn')?.addEventListener('click', () => downloadCSV('reporte_gastos.csv', 'gastos-table'));
});

async function loadInitialData() {
    await Promise.all([loadTrabajadoresFromDB(), loadChoferesFromDB()]);
    updateStats();
}

function handleLogout() {
    sessionActive = false;
    sessionStorage.removeItem('cafe_aromas_session');
    document.getElementById('main-app').style.display = 'none';
    document.getElementById('auth-view').style.display = 'flex';
}

function downloadCSV(filename, elementId) {
    const table = document.getElementById(elementId);
    if (!table || table.tagName !== 'TABLE') return;

    let csv = [];
    const rows = table.querySelectorAll('tr');
    rows.forEach(row => {
        const cols = Array.from(row.querySelectorAll('td, th')).map(c => c.innerText.replace(/,/g, '').replace(/\n/g, ' '));
        csv.push(cols.join(','));
    });
    triggerDownload(filename, csv.join('\n'));
}

function downloadDataAsCSV(filename, headers, rows) {
    let csv = [headers.join(',')];
    rows.forEach(row => csv.push(row.join(',')));
    triggerDownload(filename, csv.join('\n'));
}

function triggerDownload(filename, content) {
    const csvFile = new Blob([content], { type: 'text/csv' });
    const link = document.createElement('a');
    link.download = filename;
    link.href = window.URL.createObjectURL(csvFile);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function showView(viewName) {
    if (!sessionActive && viewName !== 'auth') return;
    document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
    const target = document.getElementById(viewName + '-view');
    if (target) target.style.display = 'block';
}

// --- FUNCIONES DE BASE DE DATOS ---

async function loadTrabajadoresFromDB() {
    try {
        const { data, error } = await supabaseClient.from('trabajador').select('*').order('Id', { ascending: true });
        if (error) throw error;
        nombresTrabajadores = {};
        const select = document.getElementById('trabajador-select');
        if (select) select.innerHTML = '<option value="">-- Elige un trabajador --</option>';
        
        data.forEach(t => {
            nombresTrabajadores[t.Id] = t.nombre;
            if (select) {
                const opt = new Option(`${t.Id} - ${t.nombre}`, t.Id);
                select.add(opt);
            }
        });
    } catch (error) {
        console.error('Error cargando trabajadores:', error);
    }
}

async function loadChoferesFromDB() {
    try {
        const { data, error } = await supabaseClient.from('chofer').select('*').order('Id', { ascending: true });
        if (error) throw error;
        const select = document.getElementById('chofer-select');
        if (select) {
            select.innerHTML = '<option value="">-- Elige un chofer --</option>';
            data.forEach(c => select.add(new Option(c.nombre, c.Id)));
        }
    } catch (error) {
        console.error('Error cargando choferes:', error);
    }
}

async function updateStats() {
    try {
        const { data, error } = await supabaseClient.from('trabajador').select('kilos_cosechados, pago_pendientekg');
        if (error) throw error;

        const stats = data.reduce((acc, t) => {
            acc.kilos += parseFloat(t.kilos_cosechados) || 0;
            acc.pagos += parseInt(t.pago_pendientekg) || 0;
            return acc;
        }, { kilos: 0, pagos: 0 });

        const totalEl = document.getElementById('total-cosechado');
        const pendienteEl = document.getElementById('pagos-pendientes');
        if (totalEl) totalEl.textContent = `${stats.kilos.toFixed(2)} kg`;
        if (pendienteEl) pendienteEl.textContent = `$ ${stats.pagos.toLocaleString('es-CO')} COP`;
    } catch (error) {}
}

// --- PRODUCCIÓN ---

async function loadProduccionFromDB() {
    try {
        const { data, error } = await supabaseClient.from('produccion').select('*').order('fecha', { ascending: false }).limit(10);
        if (error) throw error;
        const tbody = document.querySelector('#produccion-table tbody');
        if (!tbody) return;
        tbody.innerHTML = data.map(reg => `
            <tr>
                <td>${reg.Id}</td>
                <td>${nombresTrabajadores[reg.id_trabajador] || `ID ${reg.id_trabajador}`}</td>
                <td>${parseFloat(reg.kilos).toFixed(2)}</td>
                <td>${new Date(reg.fecha).toLocaleString()}</td>
            </tr>
        `).join('');
    } catch (error) {}
}

document.getElementById('produccion-form')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const id = parseInt(document.getElementById('trabajador-select').value);
    const kilos = parseFloat(document.getElementById('kilos-input').value);

    if (!id || isNaN(kilos)) return showModal('Error', 'Datos inválidos.');

    try {
        const { error: insErr } = await supabaseClient.from('produccion').insert([{ id_trabajador: id, kilos }]);
        if (insErr) throw insErr;

        const { data: t, error: fErr } = await supabaseClient.from('trabajador').select('*').eq('Id', id).single();
        if (fErr) throw fErr;

        await supabaseClient.from('trabajador').update({ 
            kilos_cosechados: (parseFloat(t.kilos_cosechados) || 0) + kilos, 
            pago_pendientekg: (parseInt(t.pago_pendientekg) || 0) + (kilos * PRECIO_KG) 
        }).eq('Id', id);

        showModal('Éxito', `Registrado: ${kilos.toFixed(2)} kg.`);
        this.reset();
        await loadProduccionFromDB();
        updateStats();
    } catch (error) {
        showModal('Error', 'No se pudo guardar.');
    }
});

// --- GESTIÓN TRABAJADORES ---

document.getElementById('gestionar-trabajador-form')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const id = document.getElementById('trabajador-id-input').value;
    const nombre = document.getElementById('trabajador-nombre-input').value.trim();

    if (!id || !nombre) return;

    try {
        const { error } = await supabaseClient.from('trabajador').update({ nombre }).eq('Id', id);
        if (error) throw error;
        showModal('Éxito', 'Actualizado.');
        await loadTrabajadoresFromDB();
        cargarListaTrabajadoresUI();
        this.reset();
    } catch (error) { showModal('Error', 'No se pudo actualizar.'); }
});

document.getElementById('btn-eliminar-trabajador')?.addEventListener('click', async function() {
    const id = document.getElementById('trabajador-id-input').value;
    if (!id) return showModal('Error', 'Ingrese un ID.');

    try {
        await supabaseClient.from('trabajador').update({ nombre: `Trabajador ${id}` }).eq('Id', id);
        showModal('Éxito', 'Restablecido.');
        await loadTrabajadoresFromDB();
        cargarListaTrabajadoresUI();
    } catch (error) { showModal('Error', 'No se pudo restablecer.'); }
});

// --- NÓMINA ---

async function renderNominaReporte() {
    const tbody = document.querySelector('#reporte-cosecha-table tbody');
    if (!tbody) return;
    try {
        const { data, error } = await supabaseClient.from('trabajador').select('*').order('Id', { ascending: true });
        if (error) throw error;
        tbody.innerHTML = data.map(t => `
            <tr>
                <td>${t.Id}</td>
                <td>${t.nombre}</td>
                <td>${(parseFloat(t.kilos_cosechados) || 0).toFixed(2)}</td>
                <td>$ ${(parseInt(t.pago_pendientekg) || 0).toLocaleString('es-CO')}</td>
                <td>${parseInt(t.pago_pendientekg) > 0 ? `<button class="btn-small-paid" onclick="markAsPaid(${t.Id}, ${t.pago_pendientekg})">Pagado</button>` : 'Al día'}</td>
            </tr>
        `).join('');
    } catch (error) {}
}

async function markAsPaid(id, monto) {
    try {
        await supabaseClient.from('pagos').insert([{ id_trabajador: id, kilos_pagados: monto/PRECIO_KG, monto_pagado: monto }]);
        await supabaseClient.from('trabajador').update({ pago_pendientekg: 0 }).eq('Id', id);
        showModal('Éxito', 'Pago registrado.');
        await renderNominaReporte();
        updateStats();
    } catch (error) { showModal('Error', 'Error al pagar.'); }
}

// --- CHOFERES ---

document.getElementById('chofer-pago-form')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const id = document.getElementById('chofer-select').value;
    const viajes = parseInt(document.getElementById('viajes-input').value);
    const tarifa = parseFloat(document.getElementById('tarifa-input').value);

    try {
        const { data: c } = await supabaseClient.from('chofer').select('*').eq('Id', id).single();
        await supabaseClient.from('chofer').update({ numero_viajes: (c.numero_viajes || 0) + viajes, tarifa }).eq('Id', id);
        showModal('Éxito', 'Pago registrado.');
        this.reset();
    } catch (error) { showModal('Error', 'Error al registrar.'); }
});

// --- CLASIFICACIÓN ---

async function loadClasificacionFromDB() {
    try {
        const { data, error } = await supabaseClient.from('clasificacion').select('*').order('fecha', { ascending: false });
        if (error) throw error;
        historialClasificacion = data || [];
        kilosTotalClasificados = historialClasificacion.reduce((sum, r) => sum + (parseFloat(r.total_clasificado) || 0), 0);
        
        const tbody = document.querySelector('#clasificacion-historial-table tbody');
        if (tbody) {
            tbody.innerHTML = historialClasificacion.map(r => `
                <tr>
                    <td>${new Date(r.fecha).toLocaleDateString()}</td>
                    <td>${parseFloat(r.kilos_cenicafe).toFixed(2)}</td>
                    <td>${parseFloat(r.kilos_colombia).toFixed(2)}</td>
                    <td>${parseFloat(r.total_clasificado).toFixed(2)}</td>
                </tr>
            `).join('');
        }
        await updateClasificacionView();
    } catch (error) {}
}

async function updateClasificacionView() {
    try {
        const { data } = await supabaseClient.from('trabajador').select('kilos_cosechados');
        const total = data.reduce((sum, t) => sum + (parseFloat(t.kilos_cosechados) || 0), 0);
        const pendiente = Math.max(0, total - kilosTotalClasificados);
        
        document.getElementById('cosecha-kilos-total-display').textContent = total.toFixed(2);
        document.getElementById('cosecha-kilos-restante-display').textContent = pendiente.toFixed(2);
        
        const btn = document.getElementById('btn-registrar-clasificacion');
        if(btn) {
            btn.disabled = pendiente < 0.1;
            btn.textContent = pendiente < 0.1 ? 'Sin kilos pendientes' : 'Registrar Clasificación';
        }
    } catch (error) {}
}

document.getElementById('registro-clasificacion-form')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const ceni = parseFloat(document.getElementById('kilos-cenicafe').value) || 0;
    const col = parseFloat(document.getElementById('kilos-variedad-colombia').value) || 0;
    const total = ceni + col;
    
    if (total <= 0) return showModal('Error', 'Ingrese cantidades.');

    try {
        await supabaseClient.from('clasificacion').insert([{ kilos_cenicafe: ceni, kilos_colombia: col, total_clasificado: total }]);
        showModal('Éxito', 'Guardado.');
        this.reset();
        await loadClasificacionFromDB();
    } catch (error) { showModal('Error', 'Error al guardar.'); }
});

// --- GASTOS ---

async function loadGastosFromDB() {
    try {
        const { data, error } = await supabaseClient.from('gestion_gastos').select('*').order('fecha', { ascending: false });
        if (error) throw error;
        const tbody = document.querySelector('#gastos-table tbody');
        if (tbody) {
            tbody.innerHTML = data.map(g => `
                <tr>
                    <td>${g.Id}</td>
                    <td>${g.fecha}</td>
                    <td>${g.descripcion}</td>
                    <td>$ ${parseFloat(g.monto).toLocaleString('es-CO')}</td>
                </tr>
            `).join('');
        }
    } catch (error) {}
}

document.getElementById('registro-gasto-form')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const descripcion = document.getElementById('gasto-descripcion').value;
    const monto = parseFloat(document.getElementById('gasto-monto').value);
    const fecha = document.getElementById('gasto-fecha').value;
    
    if (!descripcion || isNaN(monto) || !fecha) return showModal('Error', 'Campos incompletos.');

    try {
        await supabaseClient.from('gestion_gastos').insert([{ descripcion, monto, fecha }]);
        showModal('Éxito', 'Gasto registrado.');
        this.reset();
        await loadGastosFromDB();
    } catch (error) { showModal('Error', 'Error al guardar.'); }
});

// --- AUTH HANDLERS ---

async function handleLogin(e) {
    e.preventDefault();
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value;
    
    try {
        const { data, error } = await supabaseClient.from('usuarios').select('*').eq('usuario', user).maybeSingle();
        if (error || !data || data.contraseña !== pass) return showModal('Error', 'Credenciales incorrectas.');

        sessionActive = true;
        sessionStorage.setItem('cafe_aromas_session', user);
        document.getElementById('auth-view').style.display = 'none';
        document.getElementById('main-app').style.display = 'grid';
        showView('inicio');
    } catch (error) { showModal('Error', 'Error de conexión.'); }
}

async function handleRegister(e) {
    e.preventDefault();
    const user = document.getElementById('reg-username').value.trim();
    const pass = document.getElementById('reg-password').value;
    const confirm = document.getElementById('reg-confirm').value;

    if (user.length < 3 || pass.length < 6) return showModal('Error', 'Usuario min. 3, Clave min. 6 caracteres.');
    if (pass !== confirm) return showModal('Error', 'Las claves no coinciden.');

    try {
        const { error } = await supabaseClient.from('usuarios').insert([{ usuario: user, contraseña: pass }]);
        if (error) throw error;
        showModal('Éxito', 'Cuenta creada.');
        document.getElementById('register-form').reset();
        document.getElementById('register-form').style.display = 'none';
        document.getElementById('login-form').style.display = 'block';
    } catch (error) { showModal('Error', 'Error al registrar.'); }
}

function cargarListaTrabajadoresUI() {
    const lista = document.getElementById('lista-nombres-trabajadores');
    if (!lista) return;
    lista.innerHTML = Object.keys(nombresTrabajadores).map(id => `<li>ID ${id}: ${nombresTrabajadores[id]}</li>`).join('');
}
