
document.addEventListener("DOMContentLoaded", function () {
    const botoesTema = document.querySelectorAll("#btn-tema, .bottom-theme-switch");
    const logos = document.querySelectorAll(".logo-imagem, .sidebar-logo");

    // verifica o tema salvo
    function temaEstaClaro() {
        return localStorage.getItem("duckfy-tema") === "claro";
    }

    // atualiza a logo de acordo com o tema
    function atualizarLogo() {
        logos.forEach((logo) => {
            const caminhoCorreto = temaEstaClaro()
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

        botoesTema.forEach((botaoTema) => {
            botaoTema.setAttribute(
                "aria-label",
                claro ? "Ativar tema escuro" : "Ativar tema claro"
            );

            botaoTema.setAttribute(
                "title",
                claro ? "Ativar tema escuro" : "Ativar tema claro"
            );

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
        });
    }

    // carrega a preferência salva
    aplicarTema(localStorage.getItem("duckfy-tema") || "escuro");

    // alterna o tema
    botoesTema.forEach((botaoTema) => {
        botaoTema.addEventListener("click", function () {
            aplicarTema(temaEstaClaro() ? "escuro" : "claro");
        });
    });
});
