
document.addEventListener("DOMContentLoaded", function () {
<<<<<<< HEAD
    const botoesTema = document.querySelectorAll("[data-theme-toggle]");
=======
    const botoesTema = document.querySelectorAll("#btn-tema, .bottom-theme-switch");
>>>>>>> 2c609b2f000a979fd7015f0e05ebf89ef6075575
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

<<<<<<< HEAD
        botoesTema.forEach((botao) => {
            botao.setAttribute(
=======
        botoesTema.forEach((botaoTema) => {
            botaoTema.setAttribute(
>>>>>>> 2c609b2f000a979fd7015f0e05ebf89ef6075575
                "aria-label",
                claro ? "Ativar tema escuro" : "Ativar tema claro"
            );

            botao.setAttribute(
                "title",
                claro ? "Ativar tema escuro" : "Ativar tema claro"
            );
<<<<<<< HEAD
            const icone = botao.querySelector("[data-theme-icon]");
            if (icone) {
                const iconeSidebar = icone.classList.contains("sidebar-icon");
                icone.className = claro ? "bi bi-moon-stars" : "bi bi-sun";
                if (iconeSidebar) icone.classList.add("sidebar-icon");
            }
            const texto = botao.querySelector("[data-theme-label]");
            if (texto) texto.textContent = claro ? "Tema escuro" : "Tema claro";
=======

            const iconeTema = botaoTema.querySelector(".theme-switch-icon");
            if (iconeTema) {
                iconeTema.className = claro
                    ? "bi bi-moon-stars-fill theme-switch-icon"
                    : "bi bi-brightness-high-fill theme-switch-icon";
            }

            const textoTema = botaoTema.querySelector(".theme-switch-label");
            if (textoTema) {
                textoTema.textContent = claro
                    ? "Tema escuro"
                    : "Tema claro";
            }
>>>>>>> 2c609b2f000a979fd7015f0e05ebf89ef6075575
        });
    }

    // carrega a preferência salva
    aplicarTema(localStorage.getItem("duckfy-tema") || "escuro");

    // alterna o tema
<<<<<<< HEAD
    botoesTema.forEach((botao) => {
        botao.addEventListener("click", function () {
=======
    botoesTema.forEach((botaoTema) => {
        botaoTema.addEventListener("click", function () {
>>>>>>> 2c609b2f000a979fd7015f0e05ebf89ef6075575
            aplicarTema(temaEstaClaro() ? "escuro" : "claro");
        });
    });
});
