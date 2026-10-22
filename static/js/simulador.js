document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('graficoSimulador');

    // Imprime no console F12 para diagnóstico
    console.log("Dados recebidos do Flask:", window.dadosGrafico);

    if (canvas && window.dadosGrafico && window.dadosGrafico.labels && window.dadosGrafico.labels.length > 0) {

        // Destroi o gráfico antigo se a tela for recarregada
        if (window.meuGraficoSimulador instanceof Chart) {
            window.meuGraficoSimulador.destroy();
        }

        const ctx = canvas.getContext('2d');

        // Cria o gradiente vertical para o Patrimônio Total (estilo XP)
        const gradientPatrimonio = ctx.createLinearGradient(0, 0, 0, 320);
        gradientPatrimonio.addColorStop(0, 'rgba(0, 230, 118, 0.35)'); // Verde translúcido no topo
        gradientPatrimonio.addColorStop(1, 'rgba(0, 230, 118, 0.0)');  // Fica totalmente transparente na base

        window.meuGraficoSimulador = new Chart(ctx, {
            type: 'line',
            data: {
                labels: window.dadosGrafico.labels,
                datasets: [
                    // 1. Patrimônio Total (Linha Verde Sólida com Gradiente)
                    {
                        label: 'Patrimônio Total',
                        data: window.dadosGrafico.patrimonio,
                        borderColor: '#00E676',
                        backgroundColor: gradientPatrimonio,
                        fill: true,
                        tension: 0.3,
                        borderWidth: 2.5,
                        pointRadius: 0,            // Oculta os pontos na linha para ficar fluido
                        pointHoverRadius: 6,       // Exibe o ponto apenas ao passar o mouse
                        pointBackgroundColor: '#00E676'
                    },
                    // 2. Valor Investido (Linha Pontilhada/Benchmark estilo CDI)
                    {
                        label: 'Valor Investido',
                        data: window.dadosGrafico.investido,
                        borderColor: '#7C4DFF',
                        borderWidth: 2,
                        borderDash: [6, 6],        // Torna a linha pontilhada [comprimento, espaçamento]
                        fill: false,               // Sem preenchimento sob a linha pontilhada
                        tension: 0.3,
                        pointRadius: 0,
                        pointHoverRadius: 5,
                        pointBackgroundColor: '#7C4DFF'
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
                        position: 'top',
                        labels: { 
                            color: '#FFFFFF',
                            font: { family: 'Inter, sans-serif', size: 12 },
                            usePointStyle: true    // Ajusta o ícone da legenda
                        }
                    },
                    tooltip: {
                        backgroundColor: '#16161A',
                        titleColor: '#FFFFFF',
                        bodyColor: '#A09CB0',
                        borderColor: '#282830',
                        borderWidth: 1,
                        padding: 10
                    }
                },
                scales: {
                    x: {
                        grid: { 
                            display: false         // Remove linhas verticais para um visual mais limpo
                        },
                        ticks: { color: '#A09CB0' }
                    },
                    y: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#A09CB0' }
                    }
                }
            }
        });
    } else {
        console.warn("Simulador: Os dados do gráfico não possuem pontos válidos para desenhar.", window.dadosGrafico);
    }
});