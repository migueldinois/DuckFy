document.addEventListener("click", async (event) => {
    const linkSair = event.target.closest("[data-confirmar-logout]");
    if (!linkSair) return;

    event.preventDefault();
    const confirmado = await window.DuckFyAlert.confirm({
        title: "Sair da conta?",
        text: "Você deseja realmente sair da sua conta?",
        confirmButtonText: "Sair da conta",
        cancelButtonText: "Cancelar"
    });

    if (confirmado) {
        window.location.assign(linkSair.href);
    }
});
