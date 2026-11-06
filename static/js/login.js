
// tema e logo

// seleciona o botão de tema
const botaoTema = document.getElementById("btn-tema");

// verifica se o tema atual é claro
function temaEstaClaro() {
    return document.documentElement.classList.contains("tema-claro");
}

// atualiza a logo conforme o tema
function atualizarLogo() {
    const logo = document.querySelector(".logo-imagem");

    if (!logo) return;

    const temaClaro = document.documentElement.classList.contains("tema-claro");

    if (temaClaro) {
        logo.src = logo.dataset.logoEscuro;
    } else {
        logo.src = logo.dataset.logoClaro;
    }
}

// aplica o tema escolhido pelo usuário
function aplicarTema(tema) {
    const claro = tema === "claro";

    document.documentElement.classList.toggle("tema-claro", claro);
    document.body.classList.toggle("tema-claro", claro);

    localStorage.setItem("duckfy-tema", tema);

    atualizarLogo();

    if (botaoTema) {
        const descricao = claro
            ? "Ativar tema escuro"
            : "Ativar tema claro";

        botaoTema.setAttribute("aria-label", descricao);
        botaoTema.setAttribute("title", descricao);

        const iconeTema = botaoTema.querySelector(".theme-switch-icon");
        if (iconeTema) {
            iconeTema.className = claro
                ? "bi bi-moon-stars-fill theme-switch-icon"
                : "bi bi-brightness-high-fill theme-switch-icon";
        }
    }
}

// aplica o tema salvo ou usa o tema escuro como padrão
aplicarTema(localStorage.getItem("duckfy-tema") || "escuro");

// alterna o tema ao clicar no botão
if (botaoTema) {
    botaoTema.addEventListener("click", function () {
        aplicarTema(temaEstaClaro() ? "escuro" : "claro");
    });
}

// aviso dos termos

// seleciona os elementos do aviso
const botaoTermos = document.getElementById("btn-termos-bloqueado");
const avisoTermos = document.getElementById("aviso-termos");
const fecharAviso = document.getElementById("fechar-aviso");

// mostra o aviso ao clicar no botão dos termos
if (botaoTermos && avisoTermos) {
    botaoTermos.addEventListener("click", function () {
        avisoTermos.hidden = false;
    });
}

// esconde o aviso ao clicar no botão de fechar
if (fecharAviso && avisoTermos) {
    fecharAviso.addEventListener("click", function () {
        avisoTermos.hidden = true;
    });
}
