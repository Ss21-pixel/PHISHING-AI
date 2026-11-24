const { URL } = require('node:url');

// Normalizar texto para facilitar la detección.
function normalizeText(content) {
    return String(content)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

// Agregar un indicador al resultado.
function addThreat(threats, type, description, indicator, points) {
    threats.push({
        threatType: type,
        description,
        indicator,
        points,
        source: 'INTERNAL_RULES'
    });
}

// Analizar enlaces.
function detectUrlThreats(content) {
    const threats = [];
    let parsedUrl;

    try {
        parsedUrl = new URL(content);
    } catch {
        throw new Error('No se pudo interpretar la URL.');
    }

    const hostname = parsedUrl.hostname.toLowerCase();
    const normalized = normalizeText(content);

    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
        addThreat(threats, 'IP_ADDRESS',
            'El enlace utiliza una dirección IP en lugar de un dominio convencional.',
            hostname, 35);
    }

    if (hostname.includes('xn--')) {
        addThreat(threats, 'PUNYCODE_DOMAIN',
            'El dominio contiene caracteres codificados que podrían imitar otro dominio.',
            hostname, 30);
    }

    if (parsedUrl.username || parsedUrl.password) {
        addThreat(threats, 'URL_CREDENTIALS',
            'La dirección contiene información de usuario o contraseña.',
            parsedUrl.host, 30);
    }

    const shorteners = [
        'bit.ly', 'tinyurl.com', 't.co', 'is.gd',
        'cutt.ly', 'ow.ly', 'rb.gy', 'buff.ly'
    ];

    if (shorteners.includes(hostname)) {
        addThreat(threats, 'SHORTENED_URL',
            'El enlace utiliza un servicio de acortamiento y oculta su destino final.',
            hostname, 20);
    }

    const suspiciousWords = [
        'login', 'verify', 'secure', 'account', 'password',
        'update', 'banking', 'signin', 'verification',
        'wallet', 'confirm'
    ];

    const foundWords = suspiciousWords.filter(word =>
        normalized.includes(word)
    );

    if (foundWords.length > 0) {
        addThreat(threats, 'SUSPICIOUS_URL_KEYWORDS',
            'El enlace contiene palabras frecuentes en intentos de suplantación.',
            foundWords.join(', '), 15);
    }

    if (hostname.split('.').length >= 5) {
        addThreat(threats, 'MULTIPLE_SUBDOMAINS',
            'El dominio contiene varios subdominios que requieren revisión.',
            hostname, 15);
    }

    if (parsedUrl.protocol === 'http:') {
        addThreat(threats, 'UNENCRYPTED_HTTP',
            'El enlace utiliza HTTP y no HTTPS. La conexión no está cifrada.',
            parsedUrl.protocol, 10);
    }

    if (/[^\x00-\x7F]/.test(hostname)) {
        addThreat(threats, 'NON_ASCII_DOMAIN',
            'El dominio contiene caracteres no ASCII que requieren revisión.',
            hostname, 20);
    }

    return threats;
}

// Analizar mensajes.
function detectMessageThreats(content) {
    const threats = [];
    const normalized = normalizeText(content);

    const patterns = [
        {
            regex: /\b(contrasena|password|clave)\b/i,
            type: 'PASSWORD_REQUEST',
            description: 'El mensaje menciona contraseñas o claves de acceso.',
            points: 20
        },
        {
            regex: /\b(verifica|verificar|verifique|verifiquen|confirma|confirmar|confirme|actualiza|actualizar|actualice)\s+(?:tu|su|la)?\s*(?:cuenta|contrasena|clave|identidad|datos)\b/i,
            type: 'ACCOUNT_VERIFICATION',
            description: 'El mensaje solicita verificar o actualizar información de una cuenta.',
            points: 20
        },
        {
            regex: /\b(urgente|inmediatamente|ultima oportunidad|suspendida|bloqueada)\b/i,
            type: 'URGENT_LANGUAGE',
            description: 'El mensaje utiliza lenguaje de urgencia o presión.',
            points: 15
        },
        {
            regex: /\b(premio|ganador|has ganado|recompensa|regalo)\b/i,
            type: 'FALSE_REWARD',
            description: 'El mensaje contiene promesas de premios o recompensas.',
            points: 20
        },
        {
            regex: /https?:\/\/[^\s]+/i,
            type: 'MESSAGE_CONTAINS_LINK',
            description: 'El mensaje contiene un enlace que debe analizarse.',
            points: 10
        },
        {
            regex: /\b(codigo de seguridad|codigo de verificacion|codigo otp)\b/i,
            type: 'SECURITY_CODE_REQUEST',
            description: 'El mensaje menciona códigos de seguridad o verificación.',
            points: 20
        },
        {
            regex: /\b(transferencia|pago inmediato|datos bancarios)\b/i,
            type: 'FINANCIAL_REQUEST',
            description: 'El mensaje contiene solicitudes o referencias financieras.',
            points: 15
        },
        {
            regex: /\b(haz clic|haga clic|ingresa aqui|ingrese aqui|accede ahora|acceda ahora|acceda al|entra al siguiente enlace)\b/i,
            type: 'SUSPICIOUS_ACTION',
            description: 'El mensaje intenta dirigir al usuario hacia una acción inmediata.',
            points: 10
        }
    ];

    for (const pattern of patterns) {
        if (pattern.regex.test(normalized)) {
            addThreat(
                threats,
                pattern.type,
                pattern.description,
                pattern.regex.source,
                pattern.points
            );
        }
    }

    return threats;
}

// Punto de entrada del detector.
function detectThreats(content, analysisType) {
    if (typeof content !== 'string' || !content.trim()) {
        throw new Error('El contenido que se desea analizar está vacío.');
    }

    if (analysisType === 'URL') {
        return detectUrlThreats(content.trim());
    }

    if (analysisType === 'MESSAGE') {
        return detectMessageThreats(content.trim());
    }

    throw new Error('El tipo de análisis no es válido.');
}

module.exports = {
    detectThreats,
    detectUrlThreats,
    detectMessageThreats
};
