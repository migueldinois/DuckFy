// Alternância entre tema claro e escuro
document.addEventListener("DOMContentLoaded", function () {
    const botaoTema = document.getElementById("btn-tema");
    const textoTema = document.getElementById("texto-tema");
    const iconeTema = document.getElementById("icone-tema");

    // Verifica se o botão existe na página
    if (!botaoTema) {
        return;
    }

    botaoTema.addEventListener("click", function () {
        // Alterna o tema
        document.body.classList.toggle("tema-claro");

        const temaClaro = document.body.classList.contains("tema-claro");

        // Atualiza o texto
        if (textoTema) {
            textoTema.textContent = temaClaro
                ? "Tema escuro"
                : "Tema claro";
        }

        // Atualiza o ícone
        if (iconeTema) {
            iconeTema.classList.toggle("bi-sun-fill", !temaClaro);
            iconeTema.classList.toggle("bi-moon-fill", temaClaro);
        }

        // Atualiza a descrição acessível
        botaoTema.setAttribute(
            "aria-label",
            temaClaro ? "Ativar tema escuro" : "Ativar tema claro"
        );
    });
});
