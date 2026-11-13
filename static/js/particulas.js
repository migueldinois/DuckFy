const canvas = document.getElementById("particulas-fundo");
const ctx = canvas.getContext("2d");

let particulas = [];
let largura = 0;
let altura = 0;
let animacaoAtiva = true;

const movimentoReduzido = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
).matches;

function ajustarCanvas() {
    const proporcao = Math.min(window.devicePixelRatio || 1, 2);

    largura = window.innerWidth;
    altura = window.innerHeight;

    canvas.width = largura * proporcao;
    canvas.height = altura * proporcao;

    ctx.setTransform(proporcao, 0, 0, proporcao, 0, 0);

    criarParticulas();
}

function criarParticulas() {
    const quantidade = Math.min(
        100,
        Math.max(35, Math.floor((largura * altura) / 14000))
    );

    particulas = [];

    for (let indice = 0; indice < quantidade; indice++) {
        particulas.push({
            x: Math.random() * largura,
            y: Math.random() * altura,
            tamanho: Math.random() * 2 + 0.6,
            velocidadeX: (Math.random() - 0.5) * 0.35,
            velocidadeY: (Math.random() - 0.5) * 0.35,
            opacidade: Math.random() * 0.6 + 0.2,
            fase: Math.random() * Math.PI * 2,
            cor: Math.random() > 0.5 ? "marca" : "destaque"
        });
    }
}

function desenharParticulas() {
    ctx.clearRect(0, 0, largura, altura);
    const estilosRaiz = getComputedStyle(document.documentElement);
    const cores = {
        marca: estilosRaiz.getPropertyValue("--brand-primary").trim() || "#7C4DFF",
        destaque: estilosRaiz.getPropertyValue("--accent-primary").trim() || "#00E676"
    };

    const tempo = performance.now() * 0.001;

    particulas.forEach((particula) => {
        if (!movimentoReduzido) {
            particula.x += particula.velocidadeX;
            particula.y += particula.velocidadeY;

            if (particula.x < -5) particula.x = largura + 5;
            if (particula.x > largura + 5) particula.x = -5;
            if (particula.y < -5) particula.y = altura + 5;
            if (particula.y > altura + 5) particula.y = -5;
        }

        const brilho = movimentoReduzido
            ? particula.opacidade
            : particula.opacidade * (
                0.7 + Math.sin(tempo + particula.fase) * 0.3
            );

        ctx.save();
        ctx.globalAlpha = brilho;
        const cor = cores[particula.cor];
        ctx.fillStyle = cor;
        ctx.shadowColor = cor;
        ctx.shadowBlur = particula.tamanho * 7;
        ctx.beginPath();
        ctx.arc(particula.x, particula.y, particula.tamanho, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });

    if (animacaoAtiva && !movimentoReduzido) {
        requestAnimationFrame(desenharParticulas);
    }
}

ajustarCanvas();
desenharParticulas();

window.addEventListener("resize", ajustarCanvas);
document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        animacaoAtiva = false;
    } else if (!movimentoReduzido && !animacaoAtiva) {
        animacaoAtiva = true;
        desenharParticulas();
    }
});