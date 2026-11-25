const API_URL = 'https://phishing-ai-y7s9.onrender.com/api/admin/users';

// Elementos de la página
const usersTableBody = document.getElementById('usersTableBody');
const userMessage = document.getElementById('userMessage');

const totalUsers = document.getElementById('totalUsers');
const activeUsers = document.getElementById('activeUsers');
const inactiveUsers = document.getElementById('inactiveUsers');

const searchUsers = document.getElementById('searchUsers');
const filterRole = document.getElementById('filterRole');
const filterStatus = document.getElementById('filterStatus');

const searchButton = document.getElementById('searchButton');
const clearFilters = document.getElementById('clearFilters');

const previousPage = document.getElementById('previousPage');
const nextPage = document.getElementById('nextPage');
const paginationInfo = document.getElementById('paginationInfo');

let currentPage = 1;
const pageLimit = 10;
let totalPages = 1;

// Obtener token
function getToken() {
    return localStorage.getItem('phishingAI_token');
}

// Obtener información de la sesión
function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem('phishingAI_user')) || null;
    } catch (error) {
        return null;
    }
}

// Mostrar mensajes
function showMessage(message, type = '') {
    userMessage.textContent = message;
    userMessage.className = `user-message ${type}`;
}

// Redirigir si no hay sesión válida
function redirectToLogin() {
    localStorage.removeItem('phishingAI_token');
    localStorage.removeItem('phishingAI_user');
    window.location.href = 'login.html';
}

// Consultar usuarios
async function loadUsers() {
    const token = getToken();

    if (!token) {
        redirectToLogin();
        return;
    }

    const params = new URLSearchParams({
        search: searchUsers.value.trim(),
        role: filterRole.value,
        status: filterStatus.value,
        page: currentPage,
        limit: pageLimit
    });

    showMessage('Consultando usuarios...');

    try {
        const response = await fetch(`${API_URL}?${params}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const result = await response.json();

        if (response.status === 401) {
            redirectToLogin();
            return;
        }

        if (response.status === 403) {
            showMessage(
                'Acceso denegado. Esta sección es exclusiva para administradores.',
                'error'
            );
            return;
        }

        if (!response.ok || !result.success) {
            throw new Error(result.message || 'No se pudieron consultar los usuarios.');
        }

        renderUsers(result.data.users || []);
        renderStatistics(result.data.users || [], result.data.pagination);
        renderPagination(result.data.pagination);

        showMessage(result.message || 'Usuarios consultados correctamente.');

    } catch (error) {
        console.error('Error al consultar usuarios:', error);
        showMessage(error.message, 'error');
    }
}

// Construir una celda de tabla segura
function createCell(value) {
    const cell = document.createElement('td');
    cell.textContent = value ?? '—';
    return cell;
}

// Crear etiqueta visual
function createBadge(text, className) {
    const badge = document.createElement('span');
    badge.className = className;
    badge.textContent = text;
    return badge;
}

// Mostrar usuarios
function renderUsers(users) {
    usersTableBody.replaceChildren();

    if (users.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');

        cell.colSpan = 7;
        cell.textContent = 'No se encontraron usuarios.';

        row.appendChild(cell);
        usersTableBody.appendChild(row);
        return;
    }

    const currentUser = getCurrentUser();

    users.forEach(user => {
        const row = document.createElement('tr');

        row.appendChild(createCell(user.id));
        row.appendChild(createCell(user.full_name));
        row.appendChild(createCell(user.email));

        const roleCell = document.createElement('td');

        const roleBadge = createBadge(
            user.role === 'ADMIN' ? 'Administrador' : 'Usuario',
            `user-role ${user.role === 'ADMIN' ? 'role-admin' : 'role-user'}`
        );

        roleCell.appendChild(roleBadge);
        row.appendChild(roleCell);

        const statusCell = document.createElement('td');

        const isActive = Number(user.is_active) === 1;

        const statusBadge = createBadge(
            isActive ? 'Activo' : 'Inactivo',
            `user-status ${isActive ? 'status-active' : 'status-inactive'}`
        );

        statusCell.appendChild(statusBadge);
        row.appendChild(statusCell);

        const date = user.created_at
            ? new Date(user.created_at).toLocaleDateString('es-CO')
            : 'Sin fecha';

        row.appendChild(createCell(date));

        const actionCell = document.createElement('td');
        const actionButton = document.createElement('button');

        const isCurrentUser =
            currentUser && Number(currentUser.id) === Number(user.id);

        actionButton.type = 'button';
        actionButton.className =
            `user-action-button ${isActive ? 'deactivate' : 'activate'}`;

        actionButton.textContent = isActive ? 'Desactivar' : 'Activar';

        // Impedir que el administrador desactive su propia cuenta
        if (isCurrentUser && isActive) {
            actionButton.disabled = true;
            actionButton.title = 'No puedes desactivar tu propia cuenta';
        } else {
            actionButton.addEventListener('click', () => {
                changeUserStatus(user.id, !isActive);
            });
        }

        actionCell.appendChild(actionButton);
        row.appendChild(actionCell);

        usersTableBody.appendChild(row);
    });
}

// Mostrar estadísticas de los resultados consultados
function renderStatistics(users, pagination) {
    totalUsers.textContent = pagination.total ?? 0;

    const active = users.filter(
        user => Number(user.is_active) === 1
    ).length;

    const inactive = users.filter(
        user => Number(user.is_active) === 0
    ).length;

    activeUsers.textContent = active;
    inactiveUsers.textContent = inactive;
}

// Mostrar paginación
function renderPagination(pagination) {
    currentPage = Number(pagination.page) || 1;
    totalPages = Number(pagination.totalPages) || 1;

    paginationInfo.textContent =
        `Página ${currentPage} de ${totalPages}`;

    previousPage.disabled = currentPage <= 1;
    nextPage.disabled = currentPage >= totalPages;
}

// Cambiar estado de una cuenta
async function changeUserStatus(userId, isActive) {
    const action = isActive ? 'activar' : 'desactivar';

    const confirmed = window.confirm(
        `¿Estás seguro de que deseas ${action} esta cuenta?`
    );

    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${userId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${getToken()}`
            },
            body: JSON.stringify({ isActive })
        });

        const result = await response.json();

        if (response.status === 401) {
            redirectToLogin();
            return;
        }

        if (!response.ok || !result.success) {
            throw new Error(result.message || 'No se pudo actualizar la cuenta.');
        }

        showMessage(
            result.message || 'Estado de la cuenta actualizado correctamente.',
            'success'
        );

        await loadUsers();

    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        showMessage(error.message, 'error');
    }
}

// Buscar usuarios
searchButton.addEventListener('click', () => {
    currentPage = 1;
    loadUsers();
});

// Buscar al presionar Enter
searchUsers.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
        currentPage = 1;
        loadUsers();
    }
});

// Limpiar filtros
clearFilters.addEventListener('click', () => {
    searchUsers.value = '';
    filterRole.value = '';
    filterStatus.value = '';
    currentPage = 1;

    loadUsers();
});

// Página anterior
previousPage.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        loadUsers();
    }
});

// Página siguiente
nextPage.addEventListener('click', () => {
    if (currentPage < totalPages) {
        currentPage++;
        loadUsers();
    }
});

// Cerrar sesión
document.getElementById('logoutAdmin').addEventListener('click', () => {
    localStorage.removeItem('phishingAI_token');
    localStorage.removeItem('phishingAI_user');

    window.location.href = 'login.html';
});

// Verificar rol y cargar usuarios
function initializeUserManagement() {
    const token = getToken();
    const currentUser = getCurrentUser();

    if (!token || !currentUser) {
        redirectToLogin();
        return;
    }

    if (currentUser.role !== 'ADMIN') {
        window.location.href = '../index.html';
        return;
    }

    loadUsers();
}

initializeUserManagement();
