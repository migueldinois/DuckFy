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

        window.meuGraficoSimulador = new Chart(ctx, {
            type: 'line',
            data: {
                labels: window.dadosGrafico.labels,
                datasets: [
                    {
                        label: 'Valor Investido',
                        data: window.dadosGrafico.investido,
                        borderColor: '#7C4DFF',
                        backgroundColor: 'rgba(124, 77, 255, 0.15)',
                        fill: true,
                        tension: 0.35,
                        borderWidth: 2
                    },
                    {
                        label: 'Patrimônio Total',
                        data: window.dadosGrafico.patrimonio,
                        borderColor: '#00E676',
                        backgroundColor: 'rgba(0, 230, 118, 0.15)',
                        fill: true,
                        tension: 0.35,
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { 
                            color: '#FFFFFF',
                            font: { family: 'Inter, sans-serif', size: 12 }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
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