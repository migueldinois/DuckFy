
if (!window.duckfyCategoriasInicializado) {
    window.duckfyCategoriasInicializado = true;

    document.addEventListener('DOMContentLoaded', () => {


        // seleção do tipo de categoria
        const campoTipo = document.getElementById('tipo');
        const botoesTipo = document.querySelectorAll('.tipo-categoria-btn');

        botoesTipo.forEach(botao => {
            botao.addEventListener('click', () => {

                const tipoSelecionado = botao.dataset.tipo;

                campoTipo.value = tipoSelecionado;

                botoesTipo.forEach(item => {
                    const selecionado = item === botao;

                    item.classList.toggle('selecionado', selecionado);
                    item.setAttribute('aria-pressed', selecionado);
                });
            });
        });


        // ========================================
        // CONFIGURAÇÃO DO SELETOR DE EMOJIS
        // ========================================


        // impede digitação manual no campo de emoji
        document.querySelectorAll('.emoji-input').forEach(campo => {
            campo.setAttribute('readonly', true);
            campo.setAttribute('placeholder', 'Selecione um emoji');
            campo.style.cursor = 'pointer';
        });
        const picker = document.createElement('div');

        picker.id = 'emojiPicker';
        picker.className = 'emoji-picker';
        picker.hidden = true;

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

            <div id="emojiPickerContainer">
                <p class="emoji-picker-loading">Carregando emojis...</p>
            </div>
        `;

        document.body.appendChild(picker);

        const fechar = document.getElementById('fecharEmojiPicker');
        const header = picker.querySelector('.emoji-picker-header');
        const container = document.getElementById('emojiPickerContainer');

        let campoAtual = null;
        let iconeAtual = null;
        let emojiPickerElement = null;

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

            if (emojiPickerElement) {

                const temaClaro = document.documentElement.classList.contains('tema-claro');

                emojiPickerElement.classList.toggle('light', temaClaro);
                emojiPickerElement.classList.toggle('dark', !temaClaro);
            }
        }

        // ========================================
        // CARREGAMENTO DO NOVO SELETOR DE EMOJIS
        // ========================================


        const carregarSeletorEmoji = async () => {

            try {

                await import(
                    'https://cdn.jsdelivr.net/npm/emoji-picker-element@1.29.1/index.js'
                );

                await customElements.whenDefined('emoji-picker');

                emojiPickerElement = document.createElement('emoji-picker');

                emojiPickerElement.setAttribute('locale', 'en');

                emojiPickerElement.setAttribute(
                    'data-source',
                    'https://cdn.jsdelivr.net/npm/emoji-picker-element-data@1.8.0/en/emojibase/data.json'
                );

                // tradução da interface
                emojiPickerElement.i18n = {
                    categories: {
                        custom: 'Personalizados',
                        'smileys-emotion': 'Expressões e emoções',
                        'people-body': 'Pessoas e corpo',
                        'animals-nature': 'Animais e natureza',
                        'food-drink': 'Comidas e bebidas',
                        'travel-places': 'Viagens e lugares',
                        activities: 'Atividades',
                        objects: 'Objetos',
                        symbols: 'Símbolos',
                        flags: 'Bandeiras'
                    },
                    categoriesLabel: 'Categorias',
                    emojiUnsupportedMessage: 'Seu navegador não oferece suporte a emojis coloridos.',
                    favoritesLabel: 'Favoritos',
                    loadingMessage: 'Carregando...',
                    networkErrorMessage: 'Não foi possível carregar os emojis.',
                    regionLabel: 'Seletor de emojis',
                    searchDescription: 'Pesquise um emoji',
                    searchLabel: 'Pesquisar',
                    searchResultsLabel: 'Resultados da pesquisa',
                    skinToneDescription: 'Escolha um tom de pele',
                    skinToneLabel: 'Escolher tom de pele',
                    skinTones: [
                        'Padrão',
                        'Claro',
                        'Médio-claro',
                        'Médio',
                        'Médio-escuro',
                        'Escuro'
                    ],
                    skinTonesLabel: 'Tons de pele'
                };

                emojiPickerElement.addEventListener('emoji-click', event => {

                    if (!campoAtual) return;

                    const emojiSelecionado = event.detail?.unicode;

                    if (!emojiSelecionado) return;

                    const campoSelecionado = campoAtual;

                    campoSelecionado.value = emojiSelecionado;

                    campoSelecionado.dispatchEvent(
                        new Event('input', { bubbles: true })
                    );

                    campoSelecionado.dispatchEvent(
                        new Event('change', { bubbles: true })
                    );

                    fecharPicker();

                    campoSelecionado.focus();
                });

                container.innerHTML = '';
                container.appendChild(emojiPickerElement);

                aplicarTemaEmoji();

                console.log('Seletor de emojis carregado com sucesso!');

            } catch (erro) {

                console.error('Erro ao carregar o seletor de emojis:', erro);

                container.innerHTML = `
            <p class="emoji-picker-error">
                Não foi possível carregar os emojis.
                Verifique o console para identificar o erro.
            </p>
        `;
            }
        };


        const emojiPickerPronto = carregarSeletorEmoji();

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
        // ARRASTAR O SELETOR
        // ========================================

        let arrastando = false;
        let ponteiroAtual = null;

        let inicioX = 0;
        let inicioY = 0;

        let posicaoInicialX = 0;
        let posicaoInicialY = 0;

        const distanciaMinima = 3;

        header.addEventListener('pointerdown', event => {

            if (picker.hidden) return;

            const caminho = event.composedPath();

            const clicouEmControle = caminho.some(elemento => {

                return elemento instanceof Element &&
                    elemento.matches(
                        'button, input, select, textarea, a, [role="button"]'
                    );
            });

            if (clicouEmControle) return;

            const rect = picker.getBoundingClientRect();

            inicioX = event.clientX;
            inicioY = event.clientY;

            posicaoInicialX = rect.left;
            posicaoInicialY = rect.top;

            ponteiroAtual = event.pointerId;

            header.setPointerCapture(event.pointerId);
        });

        header.addEventListener('pointermove', event => {

            if (ponteiroAtual !== event.pointerId) return;

            const movimentoX = event.clientX - inicioX;
            const movimentoY = event.clientY - inicioY;

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

            esquerda = Math.max(
                margem,
                Math.min(esquerda, window.innerWidth - largura - margem)
            );

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

        header.addEventListener('pointerup', finalizarArraste);
        header.addEventListener('pointercancel', finalizarArraste);
        header.addEventListener('lostpointercapture', finalizarArraste);

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

            posicaoManual = false;

            aplicarTemaEmoji();

            posicionarPicker(icone);

            try {

                await emojiPickerPronto;

                if (picker.hidden || iconeAtual !== icone) return;

                aplicarTemaEmoji();

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
                event.target.closest?.('[data-emoji-trigger]')
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
        });

        observadorTema.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });

        // ========================================
        // SELETOR DE CORES PERSONALIZADO
        // ========================================

        const campoCor = document.getElementById('cor');
        const colorBox = document.getElementById('colorBox');
        const colorValue = document.getElementById('colorValue');

        const opcoesCores = document.querySelectorAll(
            '.color-option[data-color]'
        );

        const botaoCorPersonalizada = document.getElementById('corPersonalizada');

        let corConfirmada = campoCor?.value || '#7C4DFF';
        let seletorPickr = null;

        // ========================================
        // HISTÓRICO DE CORES
        // ========================================

        const chaveHistoricoCores = 'duckfy-historico-cores';
        const limiteHistorico = 8;

        const coresPredefinidas = [
            '#7C4DFF',
            '#00E676',
            '#58A6FF',
            '#FFB547',
            '#FF758F',
            '#A0A0B0'
        ];

        function carregarHistoricoCores() {

            try {

                const historico = JSON.parse(
                    localStorage.getItem(chaveHistoricoCores)
                );

                if (!Array.isArray(historico)) return [];

                return historico
                    .filter(cor => /^#[0-9A-F]{6}$/i.test(cor))
                    .map(cor => cor.toUpperCase())
                    .filter((cor, indice, lista) => lista.indexOf(cor) === indice)
                    .slice(0, limiteHistorico);

            } catch (erro) {

                console.error('Erro ao carregar histórico de cores:', erro);

                return [];
            }
        }

        function salvarHistoricoCor(cor) {

            const historico = carregarHistoricoCores();

            const coresAtualizadas = [
                cor.toUpperCase(),
                ...historico.filter(item => item !== cor.toUpperCase())
            ].slice(0, limiteHistorico);

            try {

                localStorage.setItem(
                    chaveHistoricoCores,
                    JSON.stringify(coresAtualizadas)
                );

                renderizarHistoricoCores();

            } catch (erro) {

                console.error('Erro ao salvar histórico de cores:', erro);
            }
        }

        function renderizarHistoricoCores() {

            const historicoContainer = document.getElementById('historicoCores');

            if (!historicoContainer) return;

            const opcoesHistorico = historicoContainer.querySelector(
                '.color-history-options'
            );

            const historico = carregarHistoricoCores();

            opcoesHistorico.innerHTML = '';

            historicoContainer.hidden = historico.length === 0;

            historico.forEach(cor => {

                const botao = document.createElement('button');

                botao.type = 'button';
                botao.className = 'color-option color-history-option';
                botao.dataset.color = cor;
                botao.style.setProperty('--cor-opcao', cor);
                botao.setAttribute('aria-label', `Selecionar cor ${cor}`);

                botao.classList.toggle(
                    'selecionada',
                    campoCor?.value.toUpperCase() === cor
                );

                opcoesHistorico.appendChild(botao);
            });
        }

        // adiciona a cor confirmada ao histórico visual do Pickr
        function atualizarHistoricoPickr(cor) {

            if (!seletorPickr) return;

            const historico = carregarHistoricoCores();

            const indiceExistente = historico.findIndex(
                item => item === cor.toUpperCase()
            );

            if (indiceExistente !== -1) {

                const indiceSwatch =
                    coresPredefinidas.length +
                    (historico.length - 1 - indiceExistente);

                seletorPickr.removeSwatch(indiceSwatch);
            }

            if (
                historico.length >= limiteHistorico &&
                indiceExistente === -1
            ) {
                seletorPickr.removeSwatch(coresPredefinidas.length);
            }

            seletorPickr.addSwatch(cor.toUpperCase());
        }

        // ========================================
        // ATUALIZAR PRÉVIA DA COR
        // ========================================

        function atualizarCorPreview(cor) {

            if (botaoCorPersonalizada) {

                const iconeMais = botaoCorPersonalizada.querySelector('i');
                const corAtual = cor.toUpperCase();

                const ehCorPredefinida = coresPredefinidas.includes(corAtual);

                if (ehCorPredefinida) {
                    botaoCorPersonalizada.style.backgroundColor = '';

                    if (iconeMais) {
                        iconeMais.style.display = '';
                    }

                } else {
                    botaoCorPersonalizada.style.backgroundColor = corAtual;

                    if (iconeMais) {
                        iconeMais.style.display = 'none';
                    }
                }
            }

            if (!campoCor || !colorBox || !colorValue || !cor) return;

            cor = cor.toUpperCase();

            campoCor.value = cor;
            colorBox.style.backgroundColor = cor;
            colorValue.textContent = cor;

            opcoesCores.forEach(opcao => {

                opcao.classList.toggle(
                    'selecionada',
                    opcao.dataset.color.toUpperCase() === cor
                );
            });

            const corPredefinida = Array.from(opcoesCores).some(opcao => {
                return opcao.dataset.color.toUpperCase() === cor;
            });

            if (botaoCorPersonalizada) {

                botaoCorPersonalizada.classList.toggle(
                    'selecionada',
                    !corPredefinida
                );
            }
        }

        // ========================================
        // INICIAR O PICKR
        // ========================================

        if (
            campoCor &&
            botaoCorPersonalizada &&
            window.Pickr
        ) {

            const historicoInicial = carregarHistoricoCores();

            seletorPickr = Pickr.create({

                el: botaoCorPersonalizada,
                theme: 'classic',
                useAsButton: true,
                container: 'body',
                appClass: 'duckfy-color-picker',
                default: corConfirmada,
                position: 'bottom-middle',
                padding: 8,

                swatches: [],

                components: {
                    preview: false,
                    opacity: false,
                    hue: true,

                    interaction: {
                        hex: false,
                        rgba: false,
                        hsla: false,
                        hsva: false,
                        cmyk: false,
                        input: false,
                        clear: false,
                        save: true
                    }
                },

                i18n: {
                    'btn:save': 'Confirmar',
                    'btn:cancel': 'Cancelar',
                    'btn:clear': 'Limpar',
                    'aria:btn:save': 'Confirmar e fechar',
                    'aria:btn:cancel': 'Cancelar e fechar',
                    'aria:btn:clear': 'Limpar seleção'
                }
            });

            // confirma a cor escolhida
            seletorPickr.on('save', cor => {

                if (!cor) return;

                const hexadecimal = cor.toHEXA().toString().toUpperCase();

                corConfirmada = hexadecimal;

                salvarHistoricoCor(hexadecimal);

                atualizarCorPreview(hexadecimal);

                seletorPickr.hide();
            });

            // restaura a última cor confirmada ao cancelar
            seletorPickr.on('cancel', () => {

                atualizarCorPreview(corConfirmada);

                seletorPickr.setColor(corConfirmada);
            });

            // atualiza a prévia enquanto o usuário escolhe
            seletorPickr.on('change', cor => {

                if (!cor) return;

                atualizarCorPreview(cor.toHEXA().toString());
            });

        } else if (botaoCorPersonalizada) {

            console.error('A biblioteca Pickr não foi carregada.');
        }

        // ========================================
        // SELECIONAR CORES PREDEFINIDAS
        // ========================================

        opcoesCores.forEach(opcao => {

            opcao.addEventListener('click', () => {

                const cor = opcao.dataset.color;

                corConfirmada = cor.toUpperCase();

                atualizarCorPreview(cor);

                if (seletorPickr) {
                    seletorPickr.setColor(cor);
                }
            });
        });

        // ========================================
        // SELECIONAR CORES DO HISTÓRICO
        // ========================================

        const historicoContainer = document.getElementById('historicoCores');

        if (historicoContainer) {

            historicoContainer.addEventListener('click', event => {

                const botao = event.target.closest('[data-color]');

                if (!botao) return;

                const cor = botao.dataset.color.toUpperCase();

                corConfirmada = cor;

                atualizarCorPreview(cor);

                if (seletorPickr) {
                    seletorPickr.setColor(cor);
                }

                renderizarHistoricoCores();
            });
        }

        // ========================================
        // APLICAR COR INICIAL
        // ========================================

        atualizarCorPreview(corConfirmada);
        renderizarHistoricoCores();

    });
}
