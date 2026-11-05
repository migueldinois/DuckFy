
// partículas do fundo

// seleciona o canvas e seu contexto de desenho
const canvas = document.getElementById("particulas-fundo");
const ctx = canvas.getContext("2d");

// define as variáveis da animação
let particulas = [];
let largura = 0;
let altura = 0;
let animacaoAtiva = true;

// verifica se o usuário prefere menos animações
const movimentoReduzido = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
).matches;

// ajusta o canvas ao tamanho da tela
function ajustarCanvas() {
    const proporcao = Math.min(window.devicePixelRatio || 1, 2);

    largura = window.innerWidth;
    altura = window.innerHeight;

    canvas.width = largura * proporcao;
    canvas.height = altura * proporcao;

    ctx.setTransform(proporcao, 0, 0, proporcao, 0, 0);

    criarParticulas();
}

// cria partículas com posições aleatórias
function criarParticulas() {
    const quantidade = Math.min(
        100,
        Math.max(35, Math.floor((largura * altura) / 14000))
    );

    particulas = [];

    for (let i = 0; i < quantidade; i++) {
        particulas.push({
            x: Math.random() * largura,
            y: Math.random() * altura,
            tamanho: Math.random() * 2 + 0.6,
            velocidadeX: (Math.random() - 0.5) * 0.35,
            velocidadeY: (Math.random() - 0.5) * 0.35,
            opacidade: Math.random() * 0.6 + 0.2,
            fase: Math.random() * Math.PI * 2,
            cor: Math.random() > 0.5
                ? "124, 77, 255"
                : "0, 230, 118"
        });
    }
}

// desenha e movimenta as partículas
function desenharParticulas() {
    ctx.clearRect(0, 0, largura, altura);

    const tempo = performance.now() * 0.001;

    particulas.forEach(function (p) {
        if (!movimentoReduzido) {
            p.x += p.velocidadeX;
            p.y += p.velocidadeY;

            if (p.x < -5) p.x = largura + 5;
            if (p.x > largura + 5) p.x = -5;
            if (p.y < -5) p.y = altura + 5;
            if (p.y > altura + 5) p.y = -5;
        }

        const brilho = movimentoReduzido
            ? p.opacidade
            : p.opacidade * (
                0.7 + Math.sin(tempo + p.fase) * 0.3
            );

        ctx.save();

        ctx.globalAlpha = brilho;
        ctx.fillStyle = `rgb(${p.cor})`;
        ctx.shadowColor = `rgb(${p.cor})`;
        ctx.shadowBlur = p.tamanho * 7;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.tamanho, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    });

    if (animacaoAtiva && !movimentoReduzido) {
        requestAnimationFrame(desenharParticulas);
    }
}

// inicia o canvas e a animação
ajustarCanvas();
desenharParticulas();

// reajusta o fundo quando a tela muda de tamanho
window.addEventListener("resize", ajustarCanvas);

// controla a animação ao mudar de aba
document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
        animacaoAtiva = false;
    } else if (!movimentoReduzido && !animacaoAtiva) {
        animacaoAtiva = true;
        desenharParticulas();
    }
});

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
