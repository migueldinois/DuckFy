
document.addEventListener('DOMContentLoaded', () => {

    // ========================================
    // CONFIGURAÇÃO DO SELETOR
    // ========================================

    const picker = document.createElement('div');

    picker.id = 'emojiPicker';
    picker.className = 'emoji-picker';
    picker.hidden = true;

    picker.style.position = 'fixed';
    picker.style.zIndex = '99999';
    picker.style.width = '350px';
    picker.style.maxWidth = 'calc(100vw - 24px)';
    picker.style.maxHeight = 'calc(100vh - 24px)';
    picker.style.boxSizing = 'border-box';
    picker.style.overflow = 'hidden';

    picker.innerHTML = `
        <div class="emoji-picker-header">
            <strong>Escolha um emoji</strong>

            <button
                type="button"
                id="fecharEmojiPicker"
                aria-label="Fechar seletor"
            >
                <i class="bi bi-x-lg"></i>
            </button>
        </div>

        <div id="emojiMartContainer"></div>
    `;

    document.body.appendChild(picker);

    const fechar = document.getElementById('fecharEmojiPicker');
    const container = document.getElementById('emojiMartContainer');

    let campoAtual = null;
    let iconeAtual = null;
    let emojiMartPicker = null;

    // ========================================
    // CORES DO DUCKFY
    // ========================================

    function converterCorRGB(cor) {

        if (!cor) return '124, 77, 255';

        const valor = cor.trim();

        if (valor.startsWith('#')) {

            let hex = valor.replace('#', '');

            if (hex.length === 3) {
                hex = hex.split('').map(letra => letra + letra).join('');
            }

            const numero = parseInt(hex, 16);

            return [
                (numero >> 16) & 255,
                (numero >> 8) & 255,
                numero & 255
            ].join(', ');
        }

        const rgb = valor.match(/\d+/g);

        return rgb ? rgb.slice(0, 3).join(', ') : '124, 77, 255';
    }

    function aplicarTemaEmoji() {

        const estilos = getComputedStyle(document.documentElement);

        const fundo = converterCorRGB(
            estilos.getPropertyValue('--bg-surface-1')
        );

        const fundoInput = converterCorRGB(
            estilos.getPropertyValue('--bg-primary')
        );

        const texto = converterCorRGB(
            estilos.getPropertyValue('--text-primary')
        );

        const destaque = converterCorRGB(
            estilos.getPropertyValue('--brand-primary')
        );

        const borda = converterCorRGB(
            estilos.getPropertyValue('--border-color')
        );

        picker.style.setProperty('--rgb-background', fundo);
        picker.style.setProperty('--rgb-color', texto);
        picker.style.setProperty('--rgb-input', fundoInput);
        picker.style.setProperty('--rgb-accent', destaque);
        picker.style.setProperty('--rgb-border', borda);
        picker.style.setProperty('--rgb-primary', destaque);
    }

    // ========================================
    // CARREGAMENTO DO EMOJI MART
    // ========================================

    const carregarEmojiMart = async () => {

        try {

            if (!window.EmojiMart || !window.EmojiMart.Picker) {
                throw new Error('Biblioteca Emoji Mart não encontrada.');
            }

            const enderecoDados = window.emojiMartDataUrl;

            if (!enderecoDados) {
                throw new Error('Endereço dos dados dos emojis não encontrado.');
            }

            const resposta = await fetch(enderecoDados);

            if (!resposta.ok) {
                throw new Error('Não foi possível carregar os emojis.');
            }

            const dadosEmojis = await resposta.json();

            emojiMartPicker = new window.EmojiMart.Picker({

                data: dadosEmojis,

                locale: 'pt',

                theme: 'light',

                previewPosition: 'none',

                navPosition: 'top',

                searchPosition: 'sticky',

                perLine: 8,

                maxFrequentRows: 2,

                onEmojiSelect: (emoji) => {

                    if (!campoAtual) return;

                    const campoSelecionado = campoAtual;

                    campoSelecionado.value = emoji.native;

                    campoSelecionado.dispatchEvent(
                        new Event('input', { bubbles: true })
                    );

                    campoSelecionado.dispatchEvent(
                        new Event('change', { bubbles: true })
                    );

                    fecharPicker();

                    campoSelecionado.focus();
                }

            });

            container.appendChild(emojiMartPicker);

            aplicarTemaEmoji();

        } catch (erro) {

            console.error('Erro ao carregar Emoji Mart:', erro);

            container.textContent =
                'Não foi possível carregar os emojis. Verifique sua conexão.';
        }
    };

    const emojiMartPronto = carregarEmojiMart();

    // ========================================
    // CONTROLE DA POSIÇÃO MANUAL
    // ========================================

    let posicaoManual = false;

    // ========================================
    // POSICIONAMENTO AUTOMÁTICO
    // ========================================

    function posicionarPicker(icone) {

        if (!icone || posicaoManual) return;

        const rect = icone.getBoundingClientRect();

        picker.hidden = false;
        picker.style.visibility = 'hidden';

        const margem = 12;
        const espacamento = 8;

        const largura = picker.offsetWidth;
        const altura = picker.offsetHeight;

        let esquerda = rect.left;
        let topo = rect.bottom + espacamento;

        if (esquerda + largura > window.innerWidth - margem) {
            esquerda = window.innerWidth - largura - margem;
        }

        if (esquerda < margem) {
            esquerda = margem;
        }

        if (topo + altura > window.innerHeight - margem) {
            topo = rect.top - altura - espacamento;
        }

        if (topo < margem) {
            topo = margem;
        }

        picker.style.left = `${esquerda}px`;
        picker.style.top = `${topo}px`;

        picker.style.visibility = 'visible';
    }

    // ========================================
    // ARRASTAR O TECLADO INTEIRO
    // ========================================

    let arrastando = false;
    let ponteiroAtual = null;

    let inicioX = 0;
    let inicioY = 0;

    let posicaoInicialX = 0;
    let posicaoInicialY = 0;

    const distanciaMinima = 3;

    picker.addEventListener('pointerdown', event => {

        if (picker.hidden) return;

        // verifica se o clique ocorreu em um controle interativo
        // considera também elementos dentro do Shadow DOM do Emoji Mart
        const caminho = event.composedPath();

        const clicouEmControle = caminho.some(elemento => {

            return elemento instanceof Element &&
                elemento.matches(
                    'button, input, select, textarea, a, [role="button"], [contenteditable="true"]'
                );

        });

        if (clicouEmControle) return;

        const rect = picker.getBoundingClientRect();

        inicioX = event.clientX;
        inicioY = event.clientY;

        posicaoInicialX = rect.left;
        posicaoInicialY = rect.top;

        ponteiroAtual = event.pointerId;

        // captura o movimento do ponteiro
        picker.setPointerCapture(event.pointerId);

    });

    picker.addEventListener('pointermove', event => {

        if (ponteiroAtual !== event.pointerId) return;

        const movimentoX = event.clientX - inicioX;
        const movimentoY = event.clientY - inicioY;

        // evita considerar um clique simples como arraste
        if (
            !arrastando &&
            Math.abs(movimentoX) < distanciaMinima &&
            Math.abs(movimentoY) < distanciaMinima
        ) {
            return;
        }

        arrastando = true;
        posicaoManual = true;

        picker.classList.add('arrastando');

        const margem = 8;

        const largura = picker.offsetWidth;
        const altura = picker.offsetHeight;

        let esquerda = posicaoInicialX + movimentoX;
        let topo = posicaoInicialY + movimentoY;

        // limita o movimento horizontal
        esquerda = Math.max(
            margem,
            Math.min(esquerda, window.innerWidth - largura - margem)
        );

        // limita o movimento vertical
        topo = Math.max(
            margem,
            Math.min(topo, window.innerHeight - altura - margem)
        );

        picker.style.left = `${esquerda}px`;
        picker.style.top = `${topo}px`;

    });

    function finalizarArraste() {

        arrastando = false;
        ponteiroAtual = null;

        picker.classList.remove('arrastando');

    }

    picker.addEventListener('pointerup', finalizarArraste);
    picker.addEventListener('pointercancel', finalizarArraste);
    picker.addEventListener('lostpointercapture', finalizarArraste);

    // ========================================
    // ABRIR SELETOR
    // ========================================

    async function abrirPicker(icone) {

        if (!picker.hidden && iconeAtual === icone) {
            fecharPicker();
            return;
        }

        const idCampo = icone.dataset.emojiTrigger;

        campoAtual = document.getElementById(idCampo);
        iconeAtual = icone;

        if (!campoAtual) return;

        document.querySelectorAll('[data-emoji-trigger]').forEach(item => {
            item.classList.remove('active');
        });

        icone.classList.add('active');

        // ao abrir novamente, posiciona perto do ícone
        posicaoManual = false;

        aplicarTemaEmoji();

        posicionarPicker(icone);

        try {

            await emojiMartPronto;

            if (picker.hidden || iconeAtual !== icone) return;

            if (emojiMartPicker) {

                emojiMartPicker.update({
                    theme: document.documentElement.classList.contains('tema-claro')
                        ? 'light'
                        : 'dark'
                });

            }

            posicionarPicker(icone);

        } catch (erro) {
            console.error(erro);
        }
    }

    // ========================================
    // FECHAR SELETOR
    // ========================================

    function fecharPicker() {

        picker.hidden = true;
        picker.style.visibility = '';

        posicaoManual = false;

        if (iconeAtual) {
            iconeAtual.classList.remove('active');
        }

        iconeAtual = null;
        campoAtual = null;
    }

    fechar.addEventListener('click', fecharPicker);

    // ========================================
    // CLIQUE NOS ÍCONES DOS CAMPOS
    // ========================================

    document.querySelectorAll('[data-emoji-trigger]').forEach(icone => {

        icone.addEventListener('click', event => {
            event.stopPropagation();
            abrirPicker(icone);
        });

        icone.addEventListener('keydown', event => {

            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                abrirPicker(icone);
            }

        });

    });

    // ========================================
    // FECHAR AO CLICAR FORA
    // ========================================

    document.addEventListener('click', event => {

        if (picker.hidden) return;

        if (
            picker.contains(event.target) ||
            event.target.closest('[data-emoji-trigger]')
        ) {
            return;
        }

        fecharPicker();
    });

    // ========================================
    // FECHAR COM ESC
    // ========================================

    document.addEventListener('keydown', event => {

        if (event.key === 'Escape' && !picker.hidden) {
            fecharPicker();
        }

    });

    // ========================================
    // ATUALIZAR POSIÇÃO
    // ========================================

    window.addEventListener('resize', () => {

        if (picker.hidden) return;

        if (posicaoManual) {

            const margem = 8;

            const esquerda = Math.max(
                margem,
                Math.min(
                    picker.offsetLeft,
                    window.innerWidth - picker.offsetWidth - margem
                )
            );

            const topo = Math.max(
                margem,
                Math.min(
                    picker.offsetTop,
                    window.innerHeight - picker.offsetHeight - margem
                )
            );

            picker.style.left = `${esquerda}px`;
            picker.style.top = `${topo}px`;

        } else if (iconeAtual) {
            posicionarPicker(iconeAtual);
        }

    });

    window.addEventListener('scroll', () => {

        if (!picker.hidden && iconeAtual && !posicaoManual) {
            posicionarPicker(iconeAtual);
        }

    }, true);

    // ========================================
    // ATUALIZAR TEMA
    // ========================================

    const observadorTema = new MutationObserver(() => {

        if (picker.hidden) return;

        aplicarTemaEmoji();

        if (emojiMartPicker) {

            emojiMartPicker.update({
                theme: document.documentElement.classList.contains('tema-claro')
                    ? 'light'
                    : 'dark'
            });

        }

    });

    observadorTema.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class']
    });

});
