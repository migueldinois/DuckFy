document.addEventListener('DOMContentLoaded', () => {
    const formatarMoeda = valor => new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);

    const inputsAporte = [
        document.getElementById('aporte-inicial'),
        document.getElementById('aporte-mensal')
    ];
    const formSimulador = document.getElementById('form-simulador');
    const campoAnos = document.getElementById('input_anos');
    const campoAnosPersonalizado = document.getElementById('inputModalAnos');
    const elementoModal = document.getElementById('modalEditarPeriodo');
    const modalPeriodo = elementoModal ? new bootstrap.Modal(elementoModal) : null;

    function campoTemValor(input) {
        return Boolean(input && /\d/.test(input.value));
    }

    function validarAportes() {
        const camposVazios = inputsAporte.filter(input => !campoTemValor(input));
        if (camposVazios.length > 0) {
            camposVazios[0]?.focus();
            window.DuckFyAlert.show({
                icon: 'warning',
                title: 'Complete os aportes',
                text: 'Preencha os campos de aporte inicial e mensal antes de continuar.',
                confirmButtonText: 'Corrigir'
            });
            return false;
        }

        return true;
    }

    function configurarMascaraMonetaria(input) {
        if (!input) {
            return;
        }

        function formatarValor() {
            const digitos = input.value.replace(/\D/g, '').slice(0, 15);
            if (!digitos) {
                input.value = '';
                return;
            }

            input.value = `R$ ${(Number(digitos) / 100).toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}`;
        }

        input.addEventListener('focus', () => input.select());
        input.addEventListener('input', formatarValor);
        formatarValor();
    }

    function alterarPeriodo(anos) {
        if (!formSimulador || !campoAnos || !validarAportes()) {
            return false;
        }

        campoAnos.value = anos;
        formSimulador.requestSubmit();
        return true;
    }

    function configurarFormulario() {
        formSimulador?.addEventListener('submit', event => {
            if (!validarAportes()) {
                event.preventDefault();
            }
        });

        inputsAporte.forEach(input => {
            configurarMascaraMonetaria(input);
        });

        document.querySelectorAll('[data-anos]').forEach(botao => {
            botao.addEventListener('click', () => {
                alterarPeriodo(Number(botao.dataset.anos));
            });
        });

        const botaoEditarPeriodo = document.getElementById('btn-editar-periodo');
        botaoEditarPeriodo?.addEventListener('click', () => {
            if (campoAnosPersonalizado) {
                campoAnosPersonalizado.value = campoAnos?.value || 5;
                modalPeriodo?.show();
            }
        });

        const botaoConfirmarPeriodo = document.getElementById('btnConfirmarAnosModal');
        botaoConfirmarPeriodo?.addEventListener('click', () => {
            const anos = Number.parseInt(campoAnosPersonalizado?.value, 10);
            const anosValidados = Number.isNaN(anos)
                ? 1
                : Math.min(Math.max(anos, 1), 50);

            modalPeriodo?.hide();
            alterarPeriodo(anosValidados);
        });
    }

    function configurarGrafico() {
        const canvas = document.getElementById('graficoSimulador');
        const dadosGrafico = window.dadosGrafico;

        if (!canvas || !dadosGrafico?.labels?.length) {
            return;
        }

        if (window.meuGraficoSimulador instanceof Chart) {
            window.meuGraficoSimulador.destroy();
        }

        const ctx = canvas.getContext('2d');
        const estilosRaiz = getComputedStyle(document.documentElement);
        const lerCor = (variavel, padrao) => estilosRaiz.getPropertyValue(variavel).trim() || padrao;
        const corMarca = lerCor('--brand-primary', '#7C4DFF');
        const corDestaque = lerCor('--accent-primary', '#00E676');
        const corTexto = lerCor('--text-primary', '#FFFFFF');
        const corTextoSuave = lerCor('--text-muted', '#A0A0B0');
        const corSuperficie = lerCor('--bg-surface-2', '#181826');
        const corBorda = lerCor('--border-color', 'rgba(255, 255, 255, 0.15)');
        const comOpacidade = (cor, opacidade) => {
            const hexadecimal = cor.match(/^#([\da-f]{6})$/i);
            if (!hexadecimal) return cor;

            const valor = parseInt(hexadecimal[1], 16);
            const vermelho = (valor >> 16) & 255;
            const verde = (valor >> 8) & 255;
            const azul = valor & 255;
            return `rgba(${vermelho}, ${verde}, ${azul}, ${opacidade})`;
        };
        const gradientPatrimonio = ctx.createLinearGradient(0, 0, 0, 300);
        gradientPatrimonio.addColorStop(0, comOpacidade(corDestaque, 0.25));
        gradientPatrimonio.addColorStop(1, comOpacidade(corDestaque, 0));

        window.meuGraficoSimulador = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dadosGrafico.labels,
                datasets: [
                    {
                        label: 'CDI (Benchmark)',
                        data: dadosGrafico.investido,
                        borderColor: corMarca,
                        borderWidth: 2,
                        borderDash: [5, 5],
                        fill: false,
                        tension: 0.1,
                        pointRadius: 0,
                        pointHoverRadius: 5,
                        pointBackgroundColor: corMarca
                    },
                    {
                        label: 'Rentabilidade',
                        data: dadosGrafico.patrimonio,
                        borderColor: corTexto,
                        backgroundColor: gradientPatrimonio,
                        fill: true,
                        tension: 0.2,
                        borderWidth: 2.5,
                        pointRadius: 0,
                        pointHoverRadius: 7,
                        pointBackgroundColor: corTexto,
                        pointBorderColor: corDestaque,
                        pointBorderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: corSuperficie,
                        titleColor: corTexto,
                        bodyColor: corDestaque,
                        borderColor: corBorda,
                        borderWidth: 1,
                        padding: 12,
                        displayColors: false,
                        callbacks: {
                            label: context => `${context.dataset.label}: ${formatarMoeda(context.parsed.y)}`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: corTextoSuave, font: { size: 11 } }
                    },
                    y: {
                        grid: { color: comOpacidade(corTextoSuave, 0.18) },
                        ticks: {
                            color: corTextoSuave,
                            font: { size: 11 },
                            callback: value => formatarMoeda(value)
                        }
                    }
                }
            }
        });
    }

    configurarFormulario();
    configurarGrafico();
});