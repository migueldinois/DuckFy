document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('graficoSimulador');

    if (canvas && window.dadosGrafico && window.dadosGrafico.labels && window.dadosGrafico.labels.length > 0) {

        if (window.meuGraficoSimulador instanceof Chart) {
            window.meuGraficoSimulador.destroy();
        }

        const ctx = canvas.getContext('2d');

        // Gradiente de preenchimento idêntico ao modelo (Branco/Verde a desvanecer na base)
        const gradientPatrimonio = ctx.createLinearGradient(0, 0, 0, 300);
        gradientPatrimonio.addColorStop(0, 'rgba(255, 255, 255, 0.25)'); // Perto da linha (sombra suave)
        gradientPatrimonio.addColorStop(1, 'rgba(255, 255, 255, 0.0)');  // Base totalmente transparente

        window.meuGraficoSimulador = new Chart(ctx, {
            type: 'line',
            data: {
                labels: window.dadosGrafico.labels,
                datasets: [
                    // 1. Linha do Benchmark (CDI / Investido - Linha Tracejada Roxa/Azul)
                    {
                        label: 'CDI (Benchmark)',
                        data: window.dadosGrafico.investido,
                        borderColor: '#7C4DFF',
                        borderWidth: 2,
                        borderDash: [5, 5],        // Torna a linha tracejada
                        fill: false,
                        tension: 0.1,
                        pointRadius: 0,
                        pointHoverRadius: 5,
                        pointBackgroundColor: '#7C4DFF'
                    },
                    // 2. Linha Principal (Património / Rentabilidade - Linha Branca com Área Gradiente)
                    {
                        label: 'Rentabilidade',
                        data: window.dadosGrafico.patrimonio,
                        borderColor: '#FFFFFF',    // Linha sólida branca como na imagem
                        backgroundColor: gradientPatrimonio,
                        fill: true,                // Ativa o Gráfico de Área
                        tension: 0.2,              // Linha suave/flutuante
                        borderWidth: 2.5,
                        pointRadius: 0,            // Oculta pontos normais
                        pointHoverRadius: 7,       // Mostra a bolinha apenas no hover
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
                    legend: {
                        position: 'bottom',
                        align: 'start',
                        labels: {
                            color: '#FFFFFF',
                            font: { family: 'system-ui, sans-serif', size: 13, weight: 'bold' },
                            usePointStyle: true,
                            boxWidth: 8
                        }
                    },
                    tooltip: {
                        backgroundColor: '#181826',
                        titleColor: '#FFFFFF',
                        bodyColor: '#00E676',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1,
                        padding: 12,
                        displayColors: false
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },  // Remove linhas de grade verticais
                        ticks: { color: '#8E8E93', font: { size: 11 } }
                    },
                    y: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        ticks: { color: '#8E8E93', font: { size: 11 } }
                    }
                }
            }
        });
    }
});