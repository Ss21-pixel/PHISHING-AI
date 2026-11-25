const DETAIL_API_URL = "https://phishing-ai-y7s9.onrender.com/api";

const detailMessage = document.getElementById("detailMessage");
const analysisDetails = document.getElementById("analysisDetails");

function showDetailMessage(message, type = "") {
    detailMessage.textContent = message;
    detailMessage.className = "history-message";

    if (type) {
        detailMessage.classList.add(type);
    }
}

function formatDetailDate(value) {
    if (!value) {
        return "No disponible";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "No disponible";
    }

    return date.toLocaleString("es-CO", {
        dateStyle: "long",
        timeStyle: "short"
    });
}

function getRiskClass(level) {
    const classes = {
        LOW: "risk-low",
        MEDIUM: "risk-medium",
        HIGH: "risk-high",
        CRITICAL: "risk-critical"
    };

    return classes[level] || "risk-medium";
}

function getRiskLabel(level) {
    const labels = {
        LOW: "BAJO",
        MEDIUM: "MEDIO",
        HIGH: "ALTO",
        CRITICAL: "CRÃTICO"
    };

    return labels[level] || level || "SIN CLASIFICAR";
}

function getRiskDescription(level) {
    const descriptions = {
        LOW: "Se identificaron pocos indicadores de riesgo.",
        MEDIUM: "Se identificaron algunos indicadores sospechosos.",
        HIGH: "Se encontraron varios indicadores de riesgo.",
        CRITICAL: "Se identificaron mÃºltiples indicadores de alto riesgo."
    };

    return descriptions[level] || "Consulta los indicadores detectados.";
}

function renderThreats(threats) {
    const threatsList = document.getElementById("threatsList");
    const threatCount = document.getElementById("threatCount");

    threatsList.replaceChildren();

    threatCount.textContent =
        `${threats.length} ${threats.length === 1 ? "amenaza" : "amenazas"}`;

    if (threats.length === 0) {
        const message = document.createElement("div");
        message.className = "no-threats";
        message.textContent =
            "No se registraron amenazas para este anÃ¡lisis. Esto no garantiza que el contenido sea completamente seguro.";

        threatsList.appendChild(message);
        return;
    }

    threats.forEach(threat => {
        const card = document.createElement("article");
        card.className = "threat-card";

        const title = document.createElement("h3");
        title.textContent = threat.threat_type || "Indicador detectado";

        const description = document.createElement("p");
        description.textContent =
            threat.description || "Sin descripciÃ³n disponible.";

        const severity = document.createElement("p");
        severity.textContent =
            `Severidad: ${threat.severity || "No especificada"}`;

        card.append(title, description, severity);

        if (threat.indicator) {
            const indicator = document.createElement("code");
            indicator.className = "threat-indicator";
            indicator.textContent = `Indicador: ${threat.indicator}`;

            card.appendChild(indicator);
        }

        threatsList.appendChild(card);
    });
}

function renderAnalysis(analysis) {
    const level = analysis.risk_level || "LOW";

    document.getElementById("riskLevel").textContent =
        getRiskLabel(level);

    document.getElementById("riskLevel").className =
        `risk-badge ${getRiskClass(level)}`;

    document.getElementById("riskScore").textContent =
        analysis.risk_score ?? 0;

    document.getElementById("riskDescription").textContent =
        getRiskDescription(level);

    document.getElementById("analysisId").textContent =
        analysis.id ?? "--";

    document.getElementById("analysisType").textContent =
        analysis.analysis_type === "URL" ? "Enlace URL" : "Mensaje";

    document.getElementById("analysisStatus").textContent =
        analysis.status || "No disponible";

    document.getElementById("analysisDate").textContent =
        formatDetailDate(analysis.created_at);

    document.getElementById("originalContent").textContent =
        analysis.original_content || "Sin contenido disponible.";

    document.getElementById("resultSummary").textContent =
        analysis.result_summary || "No hay un resumen disponible.";

    renderThreats(
        Array.isArray(analysis.threats) ? analysis.threats : []
    );

    analysisDetails.hidden = false;
    detailMessage.hidden = true;
}

async function loadAnalysisDetail() {
    const token = localStorage.getItem("phishingAI_token");

    if (!token) {
        showDetailMessage(
            "Debes iniciar sesiÃ³n para consultar este anÃ¡lisis.",
            "error"
        );
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const analysisId = params.get("id");

    if (!analysisId || !/^[1-9]\d*$/.test(analysisId)) {
        showDetailMessage(
            "El identificador del anÃ¡lisis no es vÃ¡lido.",
            "error"
        );
        return;
    }

    showDetailMessage("Consultando informaciÃ³n del anÃ¡lisis...");

    try {
        const response = await fetch(
            `${DETAIL_API_URL}/analyses/${encodeURIComponent(analysisId)}`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const result = await response.json();

        if (response.status === 401) {
            localStorage.removeItem("phishingAI_token");
            localStorage.removeItem("phishingAI_user");

            showDetailMessage(
                "Tu sesiÃ³n ha expirado. Inicia sesiÃ³n nuevamente.",
                "error"
            );
            return;
        }

        if (response.status === 404) {
            showDetailMessage(
                "No se encontrÃ³ el anÃ¡lisis solicitado o no tienes permiso para consultarlo.",
                "error"
            );
            return;
        }

        if (!response.ok || !result.success || !result.data) {
            throw new Error(
                result.message || "No fue posible consultar el anÃ¡lisis."
            );
        }

        renderAnalysis(result.data);

    } catch (error) {
        console.error("Error al consultar el anÃ¡lisis:", error);

        showDetailMessage(
            error.message || "No se pudo conectar con el servidor.",
            "error"
        );
    }
}

loadAnalysisDetail();



