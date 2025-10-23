// ==== MENU LATERAL - Expandir/Contrair submenus ====
document.querySelectorAll(".dashboard-item").forEach(item => {
  item.addEventListener("click", () => {
    // Fechar outros abertos
    const active = document.querySelector(".dashboard-item.active");
    if (active && active !== item) {
      active.classList.remove("active");
      const prevSub = active.querySelector(".sub-menu");
      if (prevSub) prevSub.style.display = "none";
    }

    // Toggle submenu atual
    item.classList.toggle("active");
    const submenu = item.querySelector(".sub-menu");
    if (submenu) {
      submenu.style.display = submenu.style.display === "flex" ? "none" : "flex";
    }
  });
});

// Seleção da disciplina - marcar ativo (destacar)
document.querySelectorAll(".disciplina-item").forEach(subItem => {
  subItem.addEventListener("click", e => {
    e.stopPropagation(); // evitar toggle menu pai

    // Remove todos ativos
    document.querySelectorAll(".disciplina-item.active").forEach(act => act.classList.remove("active"));

    // Marca esse ativo
    subItem.classList.add("active");

    // Atualiza preview e botão acessar
    loadPreviewForDisciplina(subItem.dataset.disciplina);
  });
});

// ==== TROCA DE FOTO DE USUÁRIO ====
const userPhoto = document.getElementById("userPhoto");
const fileInput = document.getElementById("fileInput");

userPhoto.addEventListener("click", () => {
  fileInput.click();
});

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (file && file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onload = e => {
      userPhoto.style.backgroundImage = `url(${e.target.result})`;
    };
    reader.readAsDataURL(file);
  }
});

// ==== SELEÇÃO DE PROJETO ====
const userProject = document.getElementById("userProject");
const projectCard = document.getElementById("projectCard");
const confirmProjectBtn = document.getElementById("confirmProjectBtn");
const projectMessage = document.getElementById("projectMessage");

userProject.addEventListener("click", () => {
  projectCard.classList.toggle("hidden");
  projectMessage.textContent = "";
});

confirmProjectBtn.addEventListener("click", () => {
  const selected = [...projectCard.querySelectorAll("input[name=projeto]")].find(r => r.checked);
  if (selected) {
    userProject.textContent = `Projeto: ${selected.value}`;
    projectMessage.style.color = "green";
    projectMessage.textContent = "Projeto confirmado com sucesso!";
    projectCard.classList.add("hidden");
  } else {
    projectMessage.style.color = "red";
    projectMessage.textContent = "Selecione um projeto antes de confirmar.";
  }
});

// Fecha card ao clicar fora
document.addEventListener("click", e => {
  if (!projectCard.contains(e.target) && e.target !== userProject) {
    projectCard.classList.add("hidden");
    projectMessage.textContent = "";
  }
});

// ==== MINI GRÁFICOS DINÂMICOS ====

const miniChartsContainer = document.getElementById("miniChartsContainer");

// Dados exemplo por disciplina (você pode expandir para carregar via API)
const miniChartsData = {
  "Planejamento": [12, 19, 3, 5, 2, 3],
  "Medição": [5, 8, 7, 3, 6, 4],
  "Custo": [3, 7, 11, 6, 8, 5],
  "Almoxarifado": [9, 14, 8, 10, 5, 7],
  "Qualidade": [8, 15, 10, 7, 9, 6],
  "Segurança": [10, 12, 9, 8, 11, 7],
  "Meio Ambiente": [4, 6, 5, 9, 7, 10],
  "Saúde": [6, 8, 6, 7, 4, 5],
  "Elétrica": [7, 10, 11, 5, 9, 8],
  "Mecânica": [9, 12, 10, 6, 8, 9],
  "Solda": [5, 8, 6, 7, 9, 6],
  "Pintura": [8, 14, 10, 9, 7, 11],
  "Isolamento": [6, 11, 8, 10, 5, 7],
  "Movimentação de Carga": [9, 10, 11, 12, 8, 9],
  "Instrumentação": [7, 9, 8, 7, 6, 5],
  "Andaime": [6, 8, 7, 9, 8, 6],
  "Estruturas": [8, 12, 11, 13, 9, 10],
  "Recursos Humanos": [5, 7, 6, 8, 7, 9],
  "Financeiro": [7, 8, 9, 10, 8, 7],
  "Contratual": [6, 7, 5, 6, 7, 5]
};

function loadPreviewForDisciplina(disciplina) {
  // Limpa container
  miniChartsContainer.innerHTML = "";

  if (!miniChartsData[disciplina]) {
    miniChartsContainer.innerHTML = "<p>Sem dados para essa disciplina.</p>";
    document.getElementById("accessDashboardBtn").style.display = "none";
    return;
  }

  // Cria 3 mini charts (exemplo com barras)
  for (let i = 0; i < 3; i++) {
    const card = document.createElement("div");
    card.className = "chart-card";

    const title = document.createElement("div");
    title.className = "chart-card-title";
    title.textContent = `Indicador ${i + 1}`;

    const canvas = document.createElement("canvas");
    canvas.style.height = "120px";

    card.appendChild(title);
    card.appendChild(canvas);
    miniChartsContainer.appendChild(card);

    new Chart(canvas.getContext("2d"), {
      type: "bar",
      data: {
        labels: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"],
        datasets: [{
          label: "Valor",
          data: miniChartsData[disciplina].map(v => v + i * 2),
          backgroundColor: "#004080"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { display: false },
          y: { display: false, beginAtZero: true }
        },
        animation: { duration: 800 }
      }
    });
  }

  // Exibe botão acessar
  document.getElementById("accessDashboardBtn").style.display = "inline-block";
  document.getElementById("accessDashboardBtn").dataset.disciplina = disciplina;
}

// ==== BOTÃO ACESSAR DASHBOARD ====
const accessDashboardBtn = document.getElementById("accessDashboardBtn");
const dashboardContainer = document.getElementById("dashboardContainer");

accessDashboardBtn.addEventListener("click", () => {
  const disciplina = accessDashboardBtn.dataset.disciplina;
  if (!disciplina) return;

  // Limpa dashboard
  dashboardContainer.innerHTML = "";

  // Renderiza gráficos principais para a disciplina selecionada
  renderMainCharts(disciplina);
});

// ==== GRÁFICOS PRINCIPAIS ====

function renderMainCharts(disciplina) {
  // Criar container dos gráficos
  const gaugeDiv = document.createElement("div");
  gaugeDiv.className = "chart-main chart-gauge";

  const radarDiv = document.createElement("div");
  radarDiv.className = "chart-main chart-radar";

  // Canvas velocímetro
  const gaugeCanvas = document.createElement("canvas");
  gaugeCanvas.id = "gaugeChart";
  gaugeCanvas.width = 320;
  gaugeCanvas.height = 160;

  // Canvas radar
  const radarCanvas = document.createElement("canvas");
  radarCanvas.id = "radarChart";

  gaugeDiv.appendChild(gaugeCanvas);
  radarDiv.appendChild(radarCanvas);

  dashboardContainer.appendChild(gaugeDiv);
  dashboardContainer.appendChild(radarDiv);

  // Exemplo de valor (pode buscar via API)
  const valorVelocimetro = Math.floor(Math.random() * 101); // 0-100 aleatório

  renderGaugeChart(gaugeCanvas.getContext("2d"), valorVelocimetro);
  renderRadarChart(radarCanvas.getContext("2d"), disciplina);
}

function renderGaugeChart(ctx, value) {
  const gaugeMax = 100;

  // Limpa gráfico anterior, se houver
  if (window.gaugeChartInstance) {
    window.gaugeChartInstance.destroy();
  }

  window.gaugeChartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Valor", "Resto"],
      datasets: [{
        data: [value, gaugeMax - value],
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
        legend: { display: false }
      },
      animation: { animateRotate: true, duration: 1200 }
    },
    plugins: [{
      id: "gaugeCenterText",
      afterDraw(chart) {
        const { ctx, chartArea: { width, height } } = chart;
        ctx.save();
        ctx.font = "bold 26px 'Segoe UI'";
        ctx.fillStyle = "#004080";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${value}%`, width / 2, height * 0.75);
        ctx.restore();
      }
    }]
  });
}

function renderRadarChart(ctx, disciplina) {
  // Limpa gráfico anterior, se houver
  if (window.radarChartInstance) {
    window.radarChartInstance.destroy();
  }

  // Dados fictícios por disciplina para radar
  const radarDataMap = {
    "Planejamento": [65, 75, 70, 80, 60, 90],
    "Medição": [55, 65, 60, 70, 50, 80],
    "Custo": [60, 70, 65, 75, 55, 85],
    "Almoxarifado": [70, 80, 75, 85, 65, 95],
    "Qualidade": [75, 85, 80, 90, 70, 95],
    "Segurança": [80, 90, 85, 95, 75, 100],
    "Meio Ambiente": [60, 70, 65, 75, 55, 85],
    "Saúde": [55, 65, 60, 70, 50, 80],
    "Elétrica": [65, 75, 70, 80, 60, 90],
    "Mecânica": [70, 80, 75, 85, 65, 95],
    "Solda": [55, 65, 60, 70, 50, 80],
    "Pintura": [60, 70, 65, 75, 55, 85],
    "Isolamento": [50, 60, 55, 65, 45, 75],
    "Movimentação de Carga": [65, 75, 70, 80, 60, 90],
    "Instrumentação": [55, 65, 60, 70, 50, 80],
    "Andaime": [60, 70, 65, 75, 55, 85],
    "Estruturas": [70, 80, 75, 85, 65, 95],
    "Recursos Humanos": [55, 65, 60, 70, 50, 80],
    "Financeiro": [60, 70, 65, 75, 55, 85],
    "Contratual": [50, 60, 55, 65, 45, 75]
  };

  const dataRadar = radarDataMap[disciplina] || [50, 50, 50, 50, 50, 50];

  window.radarChartInstance = new Chart(ctx, {
    type: "radar",
    data: {
      labels: ["Velocidade", "Resistência", "Agilidade", "Precisão", "Força", "Tática"],
      datasets: [{
        label: disciplina,
        data: dataRadar,
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
          angleLines: { color: "#ccc" },
          grid: { color: "#ddd" },
          pointLabels: {
            color: "#004080",
            font: { size: 14, weight: "600" }
          },
          ticks: {
            display: false,
            max: 100,
            min: 0
          }
        }
      },
      plugins: { legend: { display: false }, tooltip: { enabled: true } },
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

// ==== MAPA LEAFLET (exemplo básico) ====
function loadMap() {
  const map = L.map("map").setView([-23.55, -46.63], 10); // São Paulo

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 18
  }).addTo(map);

  // Exemplo de marcadores
  const markers = [
    { lat: -23.55, lng: -46.63, title: "Centro SP" },
    { lat: -23.58, lng: -46.66, title: "Pinheiros" },
    { lat: -23.53, lng: -46.62, title: "Itaim" },
  ];

  markers.forEach(({ lat, lng, title }) => {
    L.marker([lat, lng]).addTo(map).bindPopup(title);
  });
}

// Carrega mapa se existir elemento com id "map"
if(document.getElementById("map")) {
  loadMap();
}

// ==== LOGOUT ====
function logout() {
  alert("Logout efetuado!");
  // Aqui você pode adicionar lógica real para logout
}
