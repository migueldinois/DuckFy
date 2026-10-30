document.addEventListener("DOMContentLoaded", () => {
    const assistente = document.getElementById("assistente-acessibilidade");
    if (!assistente) return;

    const etapas = [...assistente.querySelectorAll("[data-access-step]")];
    const contador = document.getElementById("contador-etapas");
    const progresso = assistente.querySelector(".acessibilidade-progresso");
    const barraProgresso = document.getElementById("barra-progresso");
    const botaoVoltar = document.getElementById("botao-voltar-etapa");
    const botaoAvancar = document.getElementById("botao-proxima-etapa");
    const botaoConcluir = document.getElementById("botao-concluir");
    const botaoPerfil = document.getElementById("botao-voltar-perfil");
    const mensagemConcluida = document.getElementById("mensagem-concluida");
    const previewTamanho = document.getElementById("preview-tamanho");
    const resumoTamanho = document.getElementById("resumo-tamanho");
    const resumoCores = document.getElementById("resumo-cores");
    const nomesTamanho = { small: "Pequeno", medium: "Médio", large: "Grande" };
    const nomesCores = {
        none: "Padrão",
        protanopia: "Protanopia",
        deuteranopia: "Deuteranopia",
        tritanopia: "Tritanopia"
    };
    const chavePreferencias = "duckfy-acessibilidade";

    let preferenciasSalvas = {};
    try {
        preferenciasSalvas = JSON.parse(localStorage.getItem(chavePreferencias) || "{}");
    } catch {
        preferenciasSalvas = {};
    }

    const tamanhoInicial = Object.hasOwn(nomesTamanho, preferenciasSalvas.tamanhoTexto)
        ? preferenciasSalvas.tamanhoTexto
        : "medium";
    const coresIniciais = Object.hasOwn(nomesCores, preferenciasSalvas.visaoCores)
        ? preferenciasSalvas.visaoCores
        : "none";

    const tamanhoInicialInput = assistente.querySelector(`input[name="tamanho-texto"][value="${tamanhoInicial}"]`);
    const coresInicialInput = assistente.querySelector(`input[name="visao-cores"][value="${coresIniciais}"]`);
    if (tamanhoInicialInput) tamanhoInicialInput.checked = true;
    if (coresInicialInput) coresInicialInput.checked = true;

    let etapaAtual = 1;

    function lerEscolhas() {
        return {
            tamanhoTexto: assistente.querySelector('input[name="tamanho-texto"]:checked')?.value || "medium",
            visaoCores: assistente.querySelector('input[name="visao-cores"]:checked')?.value || "none"
        };
    }

    function atualizarResumo() {
        const escolhas = lerEscolhas();
        resumoTamanho.textContent = nomesTamanho[escolhas.tamanhoTexto];
        resumoCores.textContent = nomesCores[escolhas.visaoCores];
        previewTamanho.style.fontSize = { small: "0.9rem", medium: "1rem", large: "1.2rem" }[escolhas.tamanhoTexto];
        assistente.querySelectorAll(".opcao-tamanho").forEach((opcao) => {
            opcao.setAttribute("aria-checked", String(opcao.querySelector("input").checked));
        });
        assistente.querySelectorAll(".opcao-visao").forEach((opcao) => {
            opcao.setAttribute("aria-checked", String(opcao.querySelector("input").checked));
        });
    }

    function mostrarEtapa(numero) {
        etapaAtual = Math.max(1, Math.min(etapas.length, numero));
        etapas.forEach((etapa) => {
            etapa.hidden = Number(etapa.dataset.accessStep) !== etapaAtual;
        });

        contador.textContent = `Etapa ${etapaAtual} de ${etapas.length}`;
        progresso.setAttribute("aria-valuenow", String(etapaAtual));
        barraProgresso.style.width = `${(etapaAtual / etapas.length) * 100}%`;
        botaoVoltar.hidden = etapaAtual === 1;
        botaoAvancar.hidden = etapaAtual === 1 || etapaAtual === etapas.length;
        botaoConcluir.hidden = etapaAtual !== etapas.length;
        botaoPerfil.hidden = true;
        atualizarResumo();

        const titulo = etapas[etapaAtual - 1].querySelector("h1");
        titulo?.focus({ preventScroll: true });
    }

    assistente.querySelectorAll('input[name="tamanho-texto"], input[name="visao-cores"]').forEach((input) => {
        input.addEventListener("change", atualizarResumo);
    });

    assistente.querySelectorAll("[data-next]").forEach((botao) => {
        botao.addEventListener("click", () => mostrarEtapa(etapaAtual + 1));
    });
    botaoAvancar.addEventListener("click", () => mostrarEtapa(etapaAtual + 1));
    botaoVoltar.addEventListener("click", () => mostrarEtapa(etapaAtual - 1));

    botaoConcluir.addEventListener("click", () => {
        const escolhas = lerEscolhas();
        localStorage.setItem(chavePreferencias, JSON.stringify(escolhas));
        document.documentElement.dataset.tamanhoTexto = escolhas.tamanhoTexto;

        if (escolhas.visaoCores === "none") {
            delete document.documentElement.dataset.visaoCores;
        } else {
            document.documentElement.dataset.visaoCores = escolhas.visaoCores;
        }

        mensagemConcluida.hidden = false;
        botaoConcluir.hidden = true;
        botaoPerfil.hidden = false;
        botaoPerfil.focus();
    });

    mostrarEtapa(1);
});