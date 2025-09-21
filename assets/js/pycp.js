// POINT INITIAL - pycp.js

// Função para criar gráficos mockup do PYCP
function initPYCPCharts() {
    // STD (Tempo de Produção)
    const ctxSTD = document.getElementById("chartSTD").getContext("2d");
    new Chart(ctxSTD, {
        type: 'line',
        data: {
            labels: ['Semana 1','Semana 2','Semana 3','Semana 4'],
            datasets: [{
                label: 'STD (h)',
                data: [8, 7.5, 8.2, 7.8],
                backgroundColor: 'rgba(0,64,128,0.2)',
                borderColor: '#004080',
                borderWidth: 2,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: true } },
            scales: { y: { beginAtZero: true } }
        }
    });

    // HH Consumidas
    const ctxHH = document.getElementById("chartHH").getContext("2d");
    new Chart(ctxHH, {
        type: 'bar',
        data: {
            labels: ['Setor A','Setor B','Setor C','Setor D'],
            datasets: [{
                label: 'HH',
                data: [120, 95, 130, 110],
                backgroundColor: '#0066cc'
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: true } },
            scales: { y: { beginAtZero: true } }
        }
    });

    // Custos
    const ctxCusto = document.getElementById("chartCusto").getContext("2d");
    new Chart(ctxCusto, {
        type: 'pie',
        data: {
            labels: ['Material','Mão de Obra','Equipamentos'],
            datasets: [{
                label: 'Custos',
                data: [50000, 30000, 20000],
                backgroundColor: ['#004080','#0066cc','#00ccff']
            }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });

    // Medição
    const ctxMed = document.getElementById("chartMedicao").getContext("2d");
    new Chart(ctxMed, {
        type: 'doughnut',
        data: {
            labels: ['Concluído','Em andamento','Atrasado'],
            datasets: [{
                label: 'Medição',
                data: [60, 30, 10],
                backgroundColor: ['#004080','#0066cc','#ff3333']
            }]
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
    });
}

// Inicializa gráficos ao carregar a página
window.addEventListener("DOMContentLoaded", () => {
    initPYCPCharts();
});

// POINT END - pycp.js
