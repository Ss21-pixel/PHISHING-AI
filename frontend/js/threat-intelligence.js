
const API_URL = 'https://phishing-ai-y7s9.onrender.com/api';

const token = localStorage.getItem('phishingAI_token');

let currentPage = 1;
const pageSize = 10;

let currentThreats = [];

// Elementos de la interfaz
const threatTableBody = document.getElementById('threatTableBody');
const threatMessage = document.getElementById('threatMessage');
const threatSearch = document.getElementById('threatSearch');
const severityFilter = document.getElementById('severityFilter');
const typeFilter = document.getElementById('typeFilter');

const previousPage = document.getElementById('previousPage');
const nextPage = document.getElementById('nextPage');

// Verificar sesión
if (!token) {
    window.location.href = 'login.html';
}

// Consultar inteligencia de amenazas
async function loadThreatIntelligence() {
    try {
        showMessage('Consultando indicadores de amenazas...', '');

        const params = new URLSearchParams({
            page: currentPage,
            limit: pageSize
        });

        const search = threatSearch.value.trim();
        const severity = severityFilter.value;
        const threatType = typeFilter.value.trim();

        if (search) params.append('search', search);
        if (severity) params.append('severity', severity);
        if (threatType) params.append('threatType', threatType);

        const response = await fetch(
            `${API_URL}/threat-intelligence?${params.toString()}`,
            {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const result = await response.json();

        if (response.status === 401) {
            localStorage.removeItem('phishingAI_token');
            localStorage.removeItem('phishingAI_user');
            window.location.href = 'login.html';
            return;
        }

        if (response.status === 403) {
            showMessage('No tienes permisos de administrador.', 'error');
            return;
        }

        if (!response.ok || !result.success) {
            throw new Error(result.message || 'No fue posible consultar las amenazas.');
        }

        currentThreats = result.data.threats || [];

        renderThreats(currentThreats);
        renderPagination(result.data.pagination);
        updateSummary(currentThreats, result.data.pagination);

        showMessage(
            `${result.data.pagination.total} indicadores encontrados.`,
            'success'
        );

    } catch (error) {
        console.error('Error consultando amenazas:', error);
        threatTableBody.innerHTML = `
            <tr>
                <td colspan="5">No fue posible cargar los indicadores.</td>
            </tr>
        `;
        showMessage(error.message, 'error');
    }
}

// Mostrar mensaje
function showMessage(message, type) {
    threatMessage.textContent = message;
    threatMessage.className = `threat-message ${type}`;
}

// Escapar texto para evitar insertar HTML recibido de la API
function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character]);
}

// Traducir gravedad
function translateSeverity(severity) {
    const labels = {
        CRITICAL: 'CRÍTICA',
        HIGH: 'ALTA',
        MEDIUM: 'MEDIA',
        LOW: 'BAJA'
    };

    return labels[severity] || severity || 'SIN CLASIFICAR';
}

// Crear etiqueta de gravedad
function severityBadge(severity) {
    const classes = {
        CRITICAL: 'severity-critical',
        HIGH: 'severity-high',
        MEDIUM: 'severity-medium',
        LOW: 'severity-low'
    };

    const cssClass = classes[severity] || '';

    return `
        <span class="threat-severity ${cssClass}">
            ${escapeHTML(translateSeverity(severity))}
        </span>
    `;
}

// Formatear fecha
function formatDate(dateValue) {
    if (!dateValue) return 'No disponible';

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return 'No disponible';

    return date.toLocaleString('es-CO', {
        dateStyle: 'short',
        timeStyle: 'short'
    });
}

// Mostrar amenazas en la tabla
function renderThreats(threats) {
    if (!threats.length) {
        threatTableBody.innerHTML = `
            <tr>
                <td colspan="5">No se encontraron amenazas registradas.</td>
            </tr>
        `;
        return;
    }

    threatTableBody.innerHTML = threats.map(threat => `
        <tr>
            <td class="threat-indicator">
                ${escapeHTML(threat.indicator || 'Sin indicador')}
            </td>

            <td>
                ${escapeHTML(threat.threat_type || 'No especificado')}
            </td>

            <td>
                ${escapeHTML(threat.description || 'Sin descripción')}
            </td>

            <td>
                ${severityBadge(threat.severity)}
            </td>

            <td>
                ${escapeHTML(formatDate(threat.created_at))}
            </td>
        </tr>
    `).join('');
}

// Actualizar resumen
function updateSummary(threats, pagination) {
    // La consulta está paginada: estos contadores se calculan
    // sobre los registros de la página actual, no sobre toda la BD.
    const total = pagination?.total ?? threats.length;

    document.getElementById('threatTotal').textContent = total;

    const critical = threats.filter(t => t.severity === 'CRITICAL').length;
    const high = threats.filter(t => t.severity === 'HIGH').length;
    const other = threats.filter(t =>
        ['MEDIUM', 'LOW'].includes(t.severity)
    ).length;

    document.getElementById('threatCritical').textContent = critical;
    document.getElementById('threatHigh').textContent = high;
    document.getElementById('threatOther').textContent = other;
}

// Paginación
function renderPagination(pagination) {
    const page = pagination?.page || 1;
    const totalPages = pagination?.totalPages || 0;

    document.getElementById('threatPaginationInfo').textContent =
        `Página ${page} de ${totalPages || 1}`;

    previousPage.disabled = page <= 1;
    nextPage.disabled = page >= totalPages;
}

// Aplicar filtros
document.getElementById('applyFilters').addEventListener('click', () => {
    currentPage = 1;
    loadThreatIntelligence();
});

// Actualizar registros
document.getElementById('refreshThreats').addEventListener('click', () => {
    loadThreatIntelligence();
});

// Página anterior
previousPage.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        loadThreatIntelligence();
    }
});

// Página siguiente
nextPage.addEventListener('click', () => {
    currentPage++;
    loadThreatIntelligence();
});

// Buscar al presionar Enter
threatSearch.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
        currentPage = 1;
        loadThreatIntelligence();
    }
});

// Iniciar módulo
if (token) {
    loadThreatIntelligence();
}
