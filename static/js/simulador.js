document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('graficoSimulador');
    const formatarMoeda = valor => new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);

    ['aporte-inicial', 'aporte-mensal'].forEach(id => {
        const input = document.getElementById(id);
        if (!input) {
            return;
        }

        const atualizarValor = () => {
            const digitos = input.value.replace(/\D/g, '').slice(0, 15);
            if (!digitos) {
                input.value = '';
                return;
            }

            const valor = Number(digitos) / 100;
            input.value = `R$ ${valor.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}`;
        };

        input.addEventListener('focus', () => input.select());
        input.addEventListener('input', atualizarValor);
        atualizarValor();
    });

    if (canvas && window.dadosGrafico && window.dadosGrafico.labels && window.dadosGrafico.labels.length > 0) {

        if (window.meuGraficoSimulador instanceof Chart) {
            window.meuGraficoSimulador.destroy();
        }

        const ctx = canvas.getContext('2d');

        // Gradiente de preenchimento
        const gradientPatrimonio = ctx.createLinearGradient(0, 0, 0, 300);
        gradientPatrimonio.addColorStop(0, 'rgba(255, 255, 255, 0.25)'); 
        gradientPatrimonio.addColorStop(1, 'rgba(255, 255, 255, 0.0)');  

        window.meuGraficoSimulador = new Chart(ctx, {
            type: 'line',
            data: {
                labels: window.dadosGrafico.labels,
                datasets: [
                    // 1. Linha do Benchmark (CDI / Investido)
                    {
                        label: 'CDI (Benchmark)',
                        data: window.dadosGrafico.investido,
                        borderColor: '#7C4DFF',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        fill: false,
                        tension: 0.1,
                        pointRadius: 0,
                        pointHoverRadius: 5,
                        pointBackgroundColor: '#7C4DFF'
                    },
                    // 2. Linha Principal (Patrimônio / Rentabilidade)
                    {
                        label: 'Rentabilidade',
                        data: window.dadosGrafico.patrimonio,
                        borderColor: '#FFFFFF',
                        backgroundColor: gradientPatrimonio,
                        fill: true,
                        tension: 0.2,
                        borderWidth: 2.5,
                        pointRadius: 0,
                        pointHoverRadius: 7,
                        pointBackgroundColor: '#FFFFFF',
                        pointBorderColor: '#00E676',
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
                    // Legenda interna desativada para dar lugar à explicação HTML
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: '#181826',
                        titleColor: '#FFFFFF',
                        bodyColor: '#00E676',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
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
                        ticks: { color: '#8E8E93', font: { size: 11 } }
                    },
                    y: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: {
                            color: '#8E8E93',
                            font: { size: 11 },
                            callback: value => formatarMoeda(value)
                        }
                    }
                }
            }
        });
    }
});