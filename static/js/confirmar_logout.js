const dialogConfirmarLogout = document.getElementById("dialog-confirmar-logout");
const botaoCancelarLogout = document.getElementById("cancelar-logout");
const botaoConfirmarLogout = document.getElementById("confirmar-logout");
let urlLogoutSelecionada = "";

if (dialogConfirmarLogout && botaoCancelarLogout && botaoConfirmarLogout) {
    document.addEventListener("click", (event) => {
        const linkSair = event.target.closest("[data-confirmar-logout]");
        if (!linkSair) return;

        event.preventDefault();
        urlLogoutSelecionada = linkSair.href;
        dialogConfirmarLogout.showModal();
    });

    botaoCancelarLogout.addEventListener("click", () => {
        dialogConfirmarLogout.close();
    });

    botaoConfirmarLogout.addEventListener("click", () => {
        if (urlLogoutSelecionada) {
            window.location.assign(urlLogoutSelecionada);
        }
    });

    dialogConfirmarLogout.addEventListener("click", (event) => {
        if (event.target === dialogConfirmarLogout) {
            dialogConfirmarLogout.close();
        }
    });
}
