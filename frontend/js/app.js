/* =========================================
   PHISHING AI - FUNCIONALIDAD PRINCIPAL
========================================= */

// Dirección de nuestra API
const API_URL = "https://phishing-ai-y7s9.onrender.com/api";

// Tipo de contenido seleccionado
let analysisType = "URL";

// Elementos HTML
const analysisForm = document.getElementById("analysisForm");
const contentInput = document.getElementById("contentInput");
const analyzeButton = document.getElementById("analyzeButton");
const characterCount = document.getElementById("characterCount");
const inputHint = document.getElementById("inputHint");
const analysisMessage = document.getElementById("analysisMessage");
const analysisResult = document.getElementById("analysisResult");

// Pestañas
const tabs = document.querySelectorAll(".tab");

// =========================================
// CAMBIAR TIPO DE ANÁLISIS
// =========================================

tabs.forEach((tab) => {

    tab.addEventListener("click", () => {

        tabs.forEach((item) => {
            item.classList.remove("active");
        });

        tab.classList.add("active");

        analysisType = tab.dataset.type;

        if (analysisType === "URL") {

            contentInput.placeholder =
                "Pega aquí un enlace sospechoso...";

            inputHint.textContent =
                "Introduce una dirección web HTTP o HTTPS.";

        } else {

            contentInput.placeholder =
                "Pega aquí el mensaje que deseas analizar...";

            inputHint.textContent =
                "Introduce el contenido del mensaje sospechoso.";

        }

        clearResults();

    });

});

// =========================================
// CONTADOR DE CARACTERES
// =========================================

contentInput.addEventListener("input", () => {

    const total = contentInput.value.length;

    characterCount.textContent = `${total} / 10000`;

});

// =========================================
// LIMPIAR RESULTADOS
// =========================================

function clearResults() {

    analysisMessage.hidden = true;
    analysisResult.hidden = true;

    analysisMessage.textContent = "";

}

// =========================================
// MOSTRAR MENSAJES
// =========================================

function showMessage(message, type = "info") {

    analysisMessage.hidden = false;

    analysisMessage.textContent = message;

    analysisMessage.dataset.type = type;

}

// =========================================
// ENVIAR ANÁLISIS A LA API
// =========================================

analysisForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    clearResults();

    const originalContent = contentInput.value.trim();

    if (originalContent.length < 5) {

        showMessage(
            "Debes introducir al menos 5 caracteres.",
            "error"
        );

        return;

    }

    if (analysisType === "URL") {

        try {

            const parsedUrl = new URL(originalContent);

            if (!["http:", "https:"].includes(parsedUrl.protocol)) {
                throw new Error("Protocolo no permitido");
            }

        } catch {

            showMessage(
                "Introduce una dirección válida que comience por HTTP o HTTPS.",
                "error"
            );

            return;

        }

    }

    try {

        analyzeButton.disabled = true;

        analyzeButton.textContent = "Analizando contenido...";

        showMessage(
            "Estamos evaluando el contenido. Espera un momento..."
        );

        // Obtener token de autenticación
        const token = localStorage.getItem("phishingAI_token");

        if (!token) {

            showMessage(
                "Para realizar análisis debes iniciar sesión.",
                "error"
            );

            return;

        }

        // Enviar información al backend
        const response = await fetch(`${API_URL}/analyses`, {

            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },

            body: JSON.stringify({
                analysisType,
                originalContent
            })

        });

        const result = await response.json();

        if (!response.ok) {

            throw new Error(
                result.message || "No fue posible realizar el análisis."
            );

        }

        if (!result.success || !result.data) {
            throw new Error("La API devolvió una respuesta inesperada.");
        }

        showResult(result.data);

    } catch (error) {

        console.error("Error de análisis:", error);

        showMessage(
            error.message || "No se pudo conectar con el servidor.",
            "error"
        );

    } finally {

        analyzeButton.disabled = false;

        analyzeButton.textContent = "Analizar contenido →";

    }

});

// =========================================
// MOSTRAR RESULTADO DEL ANÁLISIS
// =========================================

function showResult(data) {

    analysisMessage.hidden = true;

    analysisResult.hidden = false;

    const level = data.risk_level || data.riskLevel || "UNKNOWN";

    const score = data.risk_score ?? data.riskScore ?? 0;

    document.getElementById("resultLevel").textContent =
        `Nivel de riesgo: ${level}`;

    document.getElementById("resultScore").textContent =
        `Puntuación de riesgo: ${score}/100`;

    document.getElementById("resultDescription").textContent =
        "El análisis ha sido procesado correctamente.";

    const threatList = document.getElementById("threatList");

    threatList.replaceChildren();

    const threats = Array.isArray(data.threats)
        ? data.threats
        : [];

    if (threats.length === 0) {

        const item = document.createElement("li");

        item.textContent = "No se registraron indicadores de amenaza.";

        threatList.appendChild(item);

    } else {

        threats.forEach((threat) => {

            const item = document.createElement("li");

            item.textContent =
                threat.description ||
                threat.threat_type ||
                threat.type ||
                threat.name ||
                "Indicador detectado";

            threatList.appendChild(item);

        });

    }

}
