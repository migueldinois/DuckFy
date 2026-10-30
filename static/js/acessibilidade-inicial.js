try {
    const preferencias = JSON.parse(localStorage.getItem("duckfy-acessibilidade") || "{}");
    if (["small", "medium", "large"].includes(preferencias.tamanhoTexto)) {
        document.documentElement.dataset.tamanhoTexto = preferencias.tamanhoTexto;
    }
    if (["protanopia", "deuteranopia", "tritanopia"].includes(preferencias.visaoCores)) {
        document.documentElement.dataset.visaoCores = preferencias.visaoCores;
    }
} catch {}