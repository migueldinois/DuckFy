const endpointsRecuperacao = {
    enviarCodigo: "/api/recuperacao/enviar-codigo",
    verificarCodigo: "/api/recuperacao/verificar-codigo",
    redefinirSenha: "/api/recuperacao/redefinir-senha",
};

const formularios = {
    email: document.querySelector("#form-email"),
    codigo: document.querySelector("#form-codigo"),
    senha: document.querySelector("#form-senha"),
};

const campoEmail = document.querySelector("#email");
const campoCodigo = document.querySelector("#codigo");
const mensagemStatus = document.querySelector("#mensagem-status");
const tituloEtapa = document.querySelector("#titulo-etapa");
const descricaoEtapa = document.querySelector("#descricao-etapa");
const contadorEtapa = document.querySelector("#etapa-atual");
const pontosProgresso = document.querySelectorAll(".progresso-ponto");
let tokenRedefinicao = null;

async function chamarApi(url, dados) {
    const resposta = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
    });
    const resultado = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
        throw new Error(resultado.message || "Não foi possível concluir esta etapa.");
    }

    return resultado;
}

function mostrarMensagem(texto, sucesso = false) {
    mensagemStatus.textContent = texto;
    mensagemStatus.classList.toggle("sucesso", sucesso);
    mensagemStatus.hidden = false;
}

function definirEtapa(etapa) {
    Object.values(formularios).forEach((formulario) => {
        formulario.hidden = true;
    });
    formularios[etapa].hidden = false;
    pontosProgresso.forEach((ponto, indice) => {
        ponto.classList.toggle("ativo", indice <= ["email", "codigo", "senha"].indexOf(etapa));
    });

    const conteudo = {
        email: ["ETAPA 1 DE 3", "Confirme seu e-mail", "Vamos enviar um código para o e-mail associado à sua conta."],
        codigo: ["ETAPA 2 DE 3", "Digite seu código", `Enviamos um código de 6 dígitos para ${campoEmail.value}.`],
        senha: ["ETAPA 3 DE 3", "Crie uma nova senha", "Código confirmado. Agora escolha uma senha segura."],
    }[etapa];

    [contadorEtapa.textContent, tituloEtapa.textContent, descricaoEtapa.textContent] = conteudo;
    mensagemStatus.hidden = true;
}

async function enviarCodigo(botao) {
    botao.disabled = true;
    try {
        await chamarApi(endpointsRecuperacao.enviarCodigo, { email: campoEmail.value.trim() });
        definirEtapa("codigo");
        mostrarMensagem("Se o e-mail estiver cadastrado, você receberá o código.", true);
        campoCodigo.focus();
    } catch (erro) {
        mostrarMensagem(erro.message);
    } finally {
        botao.disabled = false;
    }
}

formularios.email.addEventListener("submit", (evento) => {
    evento.preventDefault();
    enviarCodigo(formularios.email.querySelector("button[type='submit']"));
});

document.querySelector("#reenviar-codigo").addEventListener("click", (evento) => {
    enviarCodigo(evento.currentTarget);
});

formularios.codigo.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const botao = formularios.codigo.querySelector("button[type='submit']");
    botao.disabled = true;
    try {
        const resultado = await chamarApi(endpointsRecuperacao.verificarCodigo, {
            email: campoEmail.value.trim(),
            codigo: campoCodigo.value.trim(),
        });
        tokenRedefinicao = resultado.reset_token;
        if (!tokenRedefinicao) {
            throw new Error("A API não retornou o token temporário de redefinição.");
        }
        definirEtapa("senha");
        document.querySelector("#senha").focus();
    } catch (erro) {
        mostrarMensagem(erro.message);
    } finally {
        botao.disabled = false;
    }
});

formularios.senha.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const senha = document.querySelector("#senha").value;
    const confirmarSenha = document.querySelector("#confirmar_senha").value;
    if (senha !== confirmarSenha) {
        mostrarMensagem("As senhas não coincidem.");
        return;
    }

    const botao = formularios.senha.querySelector("button[type='submit']");
    botao.disabled = true;
    try {
        await chamarApi(endpointsRecuperacao.redefinirSenha, {
            reset_token: tokenRedefinicao,
            senha,
        });
        mostrarMensagem("Senha redefinida. Redirecionando para o login...", true);
        window.location.assign("/login");
    } catch (erro) {
        mostrarMensagem(erro.message);
    } finally {
        botao.disabled = false;
    }
});