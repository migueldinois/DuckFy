
document.addEventListener("DOMContentLoaded", function () {
    const botaoTema = document.getElementById("btn-tema");
    const iconeTema = document.getElementById("icone-tema");
    const textoTema = document.getElementById("texto-tema");

    const CHAVE_TEMA = "duckfy-tema";

    // Verifica o tema salvo
    function temaEstaClaro() {
        return localStorage.getItem(CHAVE_TEMA) === "claro";
    }

    // Atualiza as logos conforme o tema
    function atualizarLogo() {
        const logos = document.querySelectorAll(
            ".logo-imagem, .cadastro-logo-imagem"
        );

        logos.forEach(function (logo) {
            const caminho = temaEstaClaro()
                ? logo.dataset.logoClaro
                : logo.dataset.logoEscuro;

            if (caminho && logo.getAttribute("src") !== caminho) {
                logo.src = caminho;
            }
        });
    }

    // Aplica o tema em todo o documento
    function aplicarTema(tema) {
        const claro = tema === "claro";

        document.documentElement.classList.toggle("tema-claro", claro);
        document.body.classList.toggle("tema-claro", claro);

        localStorage.setItem(CHAVE_TEMA, tema);

        atualizarLogo();

        if (botaoTema) {
            const descricao = claro
                ? "Ativar tema escuro"
                : "Ativar tema claro";

            botaoTema.setAttribute("aria-label", descricao);
            botaoTema.setAttribute("title", descricao);
            botaoTema.setAttribute("aria-pressed", String(claro));
        }

        if (iconeTema) {
            iconeTema.className = claro
                ? "bi bi-moon-fill"
                : "bi bi-sun-fill";
        }

        if (textoTema) {
            textoTema.textContent = claro
                ? "Tema escuro"
                : "Tema claro";
        }
    }

    // Carrega o tema salvo
    aplicarTema(localStorage.getItem(CHAVE_TEMA) || "escuro");

    // Alterna entre os temas
    if (botaoTema) {
        botaoTema.addEventListener("click", function () {
            aplicarTema(temaEstaClaro() ? "escuro" : "claro");
        });
    }
});
