// aplica as preferencias salvas antes de carregar o css
try {
    const raiz = document.documentElement;
    const tema = localStorage.getItem("duckfy-tema");
    const paleta = localStorage.getItem("duckfy-daltonismo") || "normal";
    const paletasDaltonismo = ["protanopia", "deuteranopia", "tritanopia", "monocromatica"];

    raiz.classList.toggle("tema-claro", tema === "claro");
    raiz.classList.remove(
        "daltonismo-protanopia",
        "daltonismo-deuteranopia",
        "daltonismo-tritanopia",
        "daltonismo-monocromatica"
    );
    if (paletasDaltonismo.includes(paleta)) {
        raiz.classList.add(`daltonismo-${paleta}`);
    }
} catch {}
