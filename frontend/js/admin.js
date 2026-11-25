const API_URL = 'https://phishing-ai-y7s9.onrender.com/api';

// Elementos del panel
const totalUsers = document.getElementById('totalUsers');
const activeUsers = document.getElementById('activeUsers');
const totalAnalyses = document.getElementById('totalAnalyses');
const highRiskAnalyses = document.getElementById('highRiskAnalyses');
const totalThreats = document.getElementById('totalThreats');
const recentAnalyses = document.getElementById('recentAnalyses');
const adminMessage = document.getElementById('adminMessage');

// Obtener token de autenticación
function getToken() {
    return localStorage.getItem('phishingAI_token');
}

// Consultar el panel administrativo
async function loadAdminDashboard() {
    const token = getToken();

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/admin/dashboard`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (response.status === 401) {
            localStorage.removeItem('phishingAI_token');
            localStorage.removeItem('phishingAI_user');
            window.location.href = 'login.html';
            return;
        }

        if (response.status === 403) {
            adminMessage.textContent =
                'Acceso denegado. Esta sección es exclusiva para administradores.';
            return;
        }

        if (!response.ok || !result.success) {
            throw new Error(result.message || 'No se pudo cargar el panel');
        }

        renderDashboard(result.data);

    } catch (error) {
        console.error('Error del panel administrativo:', error);
        adminMessage.textContent = error.message;
    }
}

// Mostrar estadísticas
function renderDashboard(data) {
    const stats = data.stats;

    totalUsers.textContent = stats.totalUsers ?? 0;
    activeUsers.textContent = stats.activeUsers ?? 0;
    totalAnalyses.textContent = stats.totalAnalyses ?? 0;
    highRiskAnalyses.textContent = stats.highRiskAnalyses ?? 0;
    totalThreats.textContent = stats.totalThreats ?? 0;

    renderRecentAnalyses(data.recentAnalyses || []);

    adminMessage.textContent = '';
}

// Mostrar los análisis recientes
function renderRecentAnalyses(analyses) {
    recentAnalyses.replaceChildren();

    if (analyses.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');

        cell.colSpan = 6;
        cell.textContent = 'Todavía no hay análisis registrados.';

        row.appendChild(cell);
        recentAnalyses.appendChild(row);
        return;
    }

    analyses.forEach(analysis => {
        const row = document.createElement('tr');

        const values = [
            analysis.full_name,
            analysis.email,
            analysis.analysis_type,
            analysis.risk_level,
            analysis.risk_score,
            analysis.created_at
                ? new Date(analysis.created_at).toLocaleString('es-CO')
                : 'Sin fecha'
        ];

        values.forEach((value, index) => {
            const cell = document.createElement('td');

            if (index === 3) {
                const badge = document.createElement('span');
                const risk = String(value || '').toLowerCase();

                badge.className = `risk-badge risk-${risk}`;
                badge.textContent = value || 'Sin clasificar';

                cell.appendChild(badge);
            } else {
                cell.textContent = value ?? '—';
            }

            row.appendChild(cell);
        });

        recentAnalyses.appendChild(row);
    });
}

// Cerrar sesión
const logoutButton = document.getElementById('logoutAdmin');

logoutButton.addEventListener('click', () => {
    localStorage.removeItem('phishingAI_token');
    localStorage.removeItem('phishingAI_user');

    window.location.href = 'login.html';
});

// Iniciar panel
loadAdminDashboard();
