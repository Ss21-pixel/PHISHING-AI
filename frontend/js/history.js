const HISTORY_API_URL = "http://localhost:3000/api";

const historyTableBody = document.getElementById("historyTableBody");
const historyMessage = document.getElementById("historyMessage");

const totalAnalyses = document.getElementById("totalAnalyses");
const criticalAnalyses = document.getElementById("criticalAnalyses");
const highAnalyses = document.getElementById("highAnalyses");

const refreshButton = document.getElementById("refreshButton");

function showHistoryMessage(message, type = "") {
    historyMessage.textContent = message;
    historyMessage.className = "history-message";

    if (type) {
        historyMessage.classList.add(type);
    }
}

function formatDate(dateValue) {
    if (!dateValue) {
        return "Fecha no disponible";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "Fecha no disponible";
    }

    return date.toLocaleString("es-CO", {
        dateStyle: "medium",
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

function createCell(content) {
    const td = document.createElement("td");
    td.textContent = content;
    return td;
}

function renderHistory(analyses) {
    historyTableBody.replaceChildren();

    totalAnalyses.textContent = analyses.length;

    criticalAnalyses.textContent = analyses.filter(
        analysis => analysis.risk_level === "CRITICAL"
    ).length;

    highAnalyses.textContent = analyses.filter(
        analysis => analysis.risk_level === "HIGH"
    ).length;

    if (analyses.length === 0) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 6;
        cell.className = "empty-history";
        cell.textContent = "TodavÃ­a no tienes anÃ¡lisis registrados.";

        row.appendChild(cell);
        historyTableBody.appendChild(row);

        return;
    }

    analyses.forEach(analysis => {
        const row = document.createElement("tr");

        const typeCell = createCell(
            analysis.analysis_type === "URL" ? "Enlace URL" : "Mensaje"
        );

        const contentCell = document.createElement("td");
        const preview = document.createElement("span");

        preview.className = "content-preview";
        preview.textContent = analysis.original_content || "Sin contenido";

        contentCell.appendChild(preview);

        const riskCell = document.createElement("td");
        const badge = document.createElement("span");

        badge.className = `risk-badge ${getRiskClass(analysis.risk_level)}`;
        badge.textContent = getRiskLabel(analysis.risk_level);

        riskCell.appendChild(badge);

        const scoreCell = createCell(
            `${analysis.risk_score ?? 0}/100`
        );

        const dateCell = createCell(
            formatDate(analysis.created_at)
        );

        const detailCell = document.createElement("td");
        const detailButton = document.createElement("button");

        detailButton.type = "button";
        detailButton.className = "detail-button";
        detailButton.textContent = "Ver detalle";

        detailButton.addEventListener("click", () => {
            window.location.href = `detalle.html?id=${encodeURIComponent(analysis.id)}`;
        });

        detailCell.appendChild(detailButton);

        row.append(
            typeCell,
            contentCell,
            riskCell,
            scoreCell,
            dateCell,
            detailCell
        );

        historyTableBody.appendChild(row);
    });
}

async function loadHistory() {
    const token = localStorage.getItem("phishingAI_token");

    if (!token) {
        showHistoryMessage(
            "Debes iniciar sesiÃ³n para consultar tu historial.",
            "error"
        );

        historyTableBody.replaceChildren();

        totalAnalyses.textContent = "0";
        criticalAnalyses.textContent = "0";
        highAnalyses.textContent = "0";

        return;
    }

    refreshButton.disabled = true;
    refreshButton.textContent = "Cargando...";

    showHistoryMessage("Consultando tus anÃ¡lisis...");

    try {
        const response = await fetch(`${HISTORY_API_URL}/analyses`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        const result = await response.json();

        if (response.status === 401) {
            localStorage.removeItem("phishingAI_token");
            localStorage.removeItem("phishingAI_user");

            showHistoryMessage(
                "Tu sesiÃ³n ha expirado. Inicia sesiÃ³n nuevamente.",
                "error"
            );

            return;
        }

        if (!response.ok || !result.success) {
            throw new Error(
                result.message || "No fue posible cargar el historial."
            );
        }

        const analyses = Array.isArray(result.data)
            ? result.data
            : [];

        renderHistory(analyses);

        showHistoryMessage(
            `Se encontraron ${analyses.length} anÃ¡lisis en tu cuenta.`,
            "success"
        );

    } catch (error) {
        console.error("Error al cargar el historial:", error);

        showHistoryMessage(
            error.message || "Error de conexiÃ³n con el servidor.",
            "error"
        );

    } finally {
        refreshButton.disabled = false;
        refreshButton.textContent = "Actualizar";
    }
}

refreshButton.addEventListener("click", loadHistory);

loadHistory();



