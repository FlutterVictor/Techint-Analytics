// === MENU LATERAL E SUBMENUS ===
document.querySelectorAll(".dashboard-item").forEach(item => {
  item.addEventListener("click", () => {
    const active = document.querySelector(".dashboard-item.active");
    if (active && active !== item) {
      active.classList.remove("active");
      const prevSub = active.querySelector(".sub-menu");
      if (prevSub) prevSub.style.display = "none";
    }

    item.classList.toggle("active");
    const submenu = item.querySelector(".sub-menu");
    if (submenu) {
      submenu.style.display = submenu.style.display === "flex" ? "none" : "flex";
    }
  });
});

// Controle seleção da disciplina (submenus)
document.querySelectorAll(".disciplina-item").forEach(subItem => {
  subItem.addEventListener("click", e => {
    e.stopPropagation();
    document.querySelectorAll(".disciplina-item.active").forEach(act => act.classList.remove("active"));
    subItem.classList.add("active");
  });
});

// === CARD DE SELEÇÃO DE PROJETO ===
const userProject = document.querySelector(".user-project");
const projectCard = document.getElementById("projectCard");
const confirmProjectBtn = document.getElementById("confirmProjectBtn");
const projectMessage = document.getElementById("projectMessage");

userProject.addEventListener("click", () => {
  projectCard.style.display = projectCard.style.display === "block" ? "none" : "block";
});

confirmProjectBtn.addEventListener("click", () => {
  const selected = [...projectCard.querySelectorAll("input[type=radio]")].find(r => r.checked);
  if (selected) {
    userProject.textContent = `Projeto: ${selected.value}`;
    projectMessage.textContent = "Projeto confirmado com sucesso!";
    projectMessage.style.color = "green";
    setTimeout(() => {
      projectCard.style.display = "none";
      projectMessage.textContent = "";
    }, 1500);
  } else {
    projectMessage.textContent = "Selecione um projeto antes de confirmar.";
    projectMessage.style.color = "red";
  }
});

// Fecha card se clicar fora
document.addEventListener("click", e => {
  if (!projectCard.contains(e.target) && e.target !== userProject) {
    projectCard.style.display = "none";
  }
});

// === GRÁFICOS COM CHART.JS ===

// 1) Gráfico Velocímetro (Gauge) - usando Doughnut com customização
const gaugeCtx = document.getElementById("gaugeChart").getContext("2d");
const gaugeValue = 72; // Exemplo valor em %
const gaugeMax = 100;

const gaugeChart = new Chart(gaugeCtx, {
  type: "doughnut",
  data: {
    labels: ["Valor", "Resto"],
    datasets: [{
      data: [gaugeValue, gaugeMax - gaugeValue],
      backgroundColor: ["#004080", "#d1e0ff"],
      borderWidth: 0
    }]
  },
  options: {
    rotation: -Math.PI,
    circumference: Math.PI,
    cutout: "80%",
    plugins: {
      tooltip: { enabled: false },
      legend: { display: false },
      annotation: {
        annotations: []
      }
    },
    animation: {
      animateRotate: true,
      duration: 1200
    }
  }
});

// Texto central do velocímetro (via plugin)
Chart.register({
  id: 'gaugeCenterText',
  afterDraw(chart) {
    const {ctx, chartArea: {width, height}} = chart;
    ctx.save();
    ctx.font = 'bold 26px "Segoe UI"';
    ctx.fillStyle = '#004080';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${gaugeValue}%`, width/2, height*0.75);
    ctx.restore();
  }
});
gaugeChart.update();

// 2) Radar Chart
const radarCtx = document.getElementById("radarChart").getContext("2d");
const radarChart = new Chart(radarCtx, {
  type: "radar",
  data: {
    labels: ["Velocidade", "Resistência", "Agilidade", "Precisão", "Força", "Tática"],
    datasets: [{
      label: "Desempenho",
      data: [65, 75, 70, 80, 60, 90],
      fill: true,
      backgroundColor: "rgba(0, 64, 128, 0.3)",
      borderColor: "#004080",
      pointBackgroundColor: "#004080",
      pointBorderColor: "#fff",
      pointHoverBackgroundColor: "#fff",
      pointHoverBorderColor: "#004080"
    }]
  },
  options: {
    scales: {
      r: {
        angleLines: {
          color: "#ccc"
        },
        grid: {
          color: "#ddd"
        },
        pointLabels: {
          color: "#004080",
          font: {
            size: 14,
            weight: "600"
          }
        },
        ticks: {
          display: false,
          max: 100,
          min: 0
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: true
      }
    },
    responsive: true,
    maintainAspectRatio: false
  }
});

// 3) Mini Charts - Exemplo simples (Barras)
const miniCharts = document.querySelectorAll(".chart-card canvas");
miniCharts.forEach((canvas, i) => {
  new Chart(canvas.getContext("2d"), {
    type: "bar",
    data: {
      labels: ["Jan", "Feb", "Mar", "Apr", "Mai", "Jun"],
      datasets: [{
        label: "Vendas",
        data: [12, 19, 3, 5, 2, 3].map(n => n + i * 5), // Varia valores para cada mini chart
        backgroundColor: "#004080"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {legend: {display: false}},
      scales: {
        x: {display: false},
        y: {display: false, beginAtZero: true}
      },
      animation: {
        duration: 700
      }
    }
  });
});

// === MAPA LEAFLET ===
const map = L.map("map").setView([-23.55, -46.63], 10); // Exemplo: São Paulo

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 18,
}).addTo(map);

// Marcadores de exemplo
const markersData = [
  { lat: -23.55, lng: -46.63, title: "Centro SP" },
  { lat: -23.58, lng: -46.66, title: "Pinheiros" },
  { lat: -23.53, lng: -46.62, title: "Itaim" },
];

markersData.forEach(({lat, lng, title}) => {
  L.marker([lat, lng]).addTo(map).bindPopup(title);
});

// Controle do zoom manual com botão (exemplo)
const zoomInBtn = document.createElement("button");
zoomInBtn.textContent = "+";
zoomInBtn.style.position = "absolute";
zoomInBtn.style.top = "10px";
zoomInBtn.style.right = "50px";
zoomInBtn.style.zIndex = 1000;
zoomInBtn.style.padding = "6px 10px";
zoomInBtn.style.background = "#004080";
zoomInBtn.style.color = "#fff";
zoomInBtn.style.border = "none";
zoomInBtn.style.borderRadius = "6px";
zoomInBtn.style.cursor = "pointer";

const zoomOutBtn = zoomInBtn.cloneNode(true);
zoomOutBtn.textContent = "-";
zoomOutBtn.style.top = "50px";

document.getElementById("map").appendChild(zoomInBtn);
document.getElementById("map").appendChild(zoomOutBtn);

zoomInBtn.addEventListener("click", () => {
  map.zoomIn();
});
zoomOutBtn.addEventListener("click", () => {
  map.zoomOut();
});

// === ANIMAÇÃO E INTERAÇÃO GERAL ===
// Para futuras interações e atualizações

