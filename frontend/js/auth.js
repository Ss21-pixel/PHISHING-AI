
const AUTH_API_URL = "http://localhost:3000/api";

// Formularios
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const authMessage = document.getElementById("authMessage");

// Navegación
const loginLink = document.getElementById("loginLink");
const registerLink = document.getElementById("registerLink");
const logoutButton = document.getElementById("logoutButton");

// Mostrar mensajes
function showMessage(message, type = "error") {
    if (!authMessage) return;

    authMessage.textContent = message;
    authMessage.className = `auth-message ${type}`;
    authMessage.hidden = !message;
}

// Estado de carga
function setLoading(button, loading, originalHTML) {
    if (!button) return;

    button.disabled = loading;
    button.innerHTML = loading
        ? "PROCESANDO..."
        : originalHTML;
}

// Guardar sesión
function saveSession(data) {
    const token = data?.data?.token;
    const user = data?.data?.user;

    if (!token || !user) {
        throw new Error("La API no devolvió los datos de sesión necesarios.");
    }

    localStorage.setItem("phishingAI_token", token);
    localStorage.setItem("phishingAI_user", JSON.stringify(user));

    updateNavigation();
}

// Actualizar navegación
function updateNavigation() {
    const token = localStorage.getItem("phishingAI_token");
    const isAuthenticated = Boolean(token);

    if (loginLink) loginLink.hidden = isAuthenticated;
    if (registerLink) registerLink.hidden = isAuthenticated;
    if (logoutButton) logoutButton.hidden = !isAuthenticated;
}

// Cerrar sesión
function logout() {
    localStorage.removeItem("phishingAI_token");
    localStorage.removeItem("phishingAI_user");

    window.location.href = window.location.pathname.includes("/pages/")
        ? "../index.html"
        : "index.html";
}

if (logoutButton) {
    logoutButton.addEventListener("click", logout);
}

// Mostrar u ocultar contraseñas
document.querySelectorAll(".password-toggle").forEach(button => {
    button.addEventListener("click", () => {
        const inputId = button.dataset.password;
        const passwordInput = document.getElementById(inputId);

        if (!passwordInput) return;

        const isPassword = passwordInput.type === "password";

        passwordInput.type = isPassword ? "text" : "password";
        button.textContent = isPassword ? "Ocultar" : "Mostrar";
    });
});

// ========================================
// REGISTRO: solamente usuarios USER
// ========================================

if (registerForm) {
    registerForm.addEventListener("submit", async event => {
        event.preventDefault();
        showMessage("");

        const fullName = document.getElementById("fullName").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;
        const acceptTerms = document.getElementById("acceptTerms").checked;

        const button = document.getElementById("registerButton");
        const originalHTML = button.innerHTML;

        if (password !== confirmPassword) {
            showMessage("Las contraseñas no coinciden.");
            return;
        }

        if (!acceptTerms) {
            showMessage("Debes aceptar los términos y condiciones.");
            return;
        }

        if (password.length < 8) {
            showMessage("La contraseña debe tener al menos 8 caracteres.");
            return;
        }

        setLoading(button, true, originalHTML);

        try {
            const response = await fetch(`${AUTH_API_URL}/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    fullName,
                    email,
                    password
                })
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "No fue posible crear la cuenta."
                );
            }

            saveSession(result);

            showMessage(
                "¡Cuenta de usuario creada correctamente! Redirigiendo...",
                "success"
            );

            setTimeout(() => {
                window.location.href = "../index.html";
            }, 1200);

        } catch (error) {
            showMessage(
                error.message === "Failed to fetch"
                    ? "No se pudo conectar con el servidor. Verifica que el backend esté funcionando."
                    : error.message
            );

            setLoading(button, false, originalHTML);
        }
    });
}

// ========================================
// INICIO DE SESIÓN: USER o ADMIN
// ========================================

if (loginForm) {
    loginForm.addEventListener("submit", async event => {
        event.preventDefault();
        showMessage("");

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const selectedRole = document.getElementById("selectedRole").value;

        const button = document.getElementById("loginButton");
        const originalHTML = button.innerHTML;

        if (!["USER", "ADMIN"].includes(selectedRole)) {
            showMessage("Debes seleccionar un tipo de cuenta válido.");
            return;
        }

        setLoading(button, true, originalHTML);

        try {
            const response = await fetch(`${AUTH_API_URL}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    password,
                    selectedRole
                })
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "No fue posible iniciar sesión."
                );
            }

            saveSession(result);

            const actualRole = result.data.user.role;

            if (actualRole === "ADMIN") {
                showMessage(
                    "¡Bienvenido, administrador! Redirigiendo al panel...",
                    "success"
                );

                setTimeout(() => {
                    window.location.href = "admin.html";
                }, 1000);

            } else if (actualRole === "USER") {
                showMessage(
                    "¡Inicio de sesión exitoso! Redirigiendo...",
                    "success"
                );

                setTimeout(() => {
                    window.location.href = "../index.html";
                }, 1000);

            } else {
                localStorage.removeItem("phishingAI_token");
                localStorage.removeItem("phishingAI_user");

                throw new Error("El rol de la cuenta no es válido.");
            }

        } catch (error) {
            showMessage(
                error.message === "Failed to fetch"
                    ? "No se pudo conectar con el servidor. Verifica que el backend esté funcionando."
                    : error.message
            );

            setLoading(button, false, originalHTML);
        }
    });
}

// Inicializar navegación
updateNavigation();
