
document.addEventListener("DOMContentLoaded", function () {
    const botoesTema = document.querySelectorAll("[data-theme-toggle]");
    const logos = document.querySelectorAll(".logo-imagem, .sidebar-logo");

    // verifica o tema salvo
    function temaEstaClaro() {
        return localStorage.getItem("duckfy-tema") === "claro";
    }

    // atualiza a logo de acordo com o tema
    function atualizarLogo() {
        logos.forEach((logo) => {
            const sidebarRecolhida = logo.classList.contains("sidebar-logo")
                && document.getElementById("sidebar")?.classList.contains("collapsed");
            const caminhoCorreto = sidebarRecolhida
                ? logo.dataset.logoRecolhida
                : temaEstaClaro()
                    ? logo.dataset.logoClaro
                    : logo.dataset.logoEscuro;

            if (caminhoCorreto && logo.getAttribute("src") !== caminhoCorreto) {
                logo.src = caminhoCorreto;
            }
        });
    }

    // aplica o tema e atualiza os elementos
    function aplicarTema(tema) {
        const claro = tema === "claro";

        document.documentElement.classList.toggle("tema-claro", claro);
        document.body.classList.toggle("tema-claro", claro);

        localStorage.setItem("duckfy-tema", tema);

        atualizarLogo();

        botoesTema.forEach((botao) => {
            botao.setAttribute(
                "aria-label",
                claro ? "Ativar tema escuro" : "Ativar tema claro"
            );

            botao.setAttribute(
                "title",
                claro ? "Ativar tema escuro" : "Ativar tema claro"
            );
            const icone = botao.querySelector("[data-theme-icon]");
            if (icone) {
                const iconeSidebar = icone.classList.contains("sidebar-icon");
                icone.className = claro ? "bi bi-moon-stars" : "bi bi-sun";
                if (iconeSidebar) icone.classList.add("sidebar-icon");
            }
            const texto = botao.querySelector("[data-theme-label], .theme-switch-label");
            if (texto) texto.textContent = claro ? "Tema escuro" : "Tema claro";
        });
    }

    // carrega a preferência salva
    aplicarTema(localStorage.getItem("duckfy-tema") || "escuro");

    // alterna o tema
    botoesTema.forEach((botao) => {
        botao.addEventListener("click", function () {
            aplicarTema(temaEstaClaro() ? "escuro" : "claro");
        });
    });
});
