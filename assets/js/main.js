// === MAIN DASHBOARD JS ===
// Autor: ChatGPT (para Techint Engenharia e Construção)

document.addEventListener("DOMContentLoaded", () => {
  const dashboardItems = document.querySelectorAll(".dashboard-item");
  const userProject = document.getElementById("userProject");
  const projectCard = document.getElementById("projectCard");
  const confirmProjectBtn = document.getElementById("confirmProjectBtn");
  const projectMessage = document.getElementById("projectMessage");
  const miniChartsContainer = document.getElementById("miniChartsContainer");
  const dashboardContainer = document.getElementById("dashboardContainer");
  const accessDashboardBtn = document.getElementById("accessDashboardBtn");

  let selectedProject = null;
  let activeSetor = null;
  let activeDisciplina = null;

  // === INTERAÇÃO DO MENU ===
  dashboardItems.forEach(item => {
    item.addEventListener("click", e => {
      const submenu = item.querySelector(".sub-menu");
      const isActive = item.classList.contains("active");

      // Fecha todos os submenus
      document.querySelectorAll(".dashboard-item").forEach(i => i.classList.remove("active"));
      document.querySelectorAll(".sub-menu").forEach(sm => (sm.style.display = "none"));

      // Abre o submenu clicado
      if (!isActive && submenu) {
        item.classList.add("active");
        submenu.style.display = "flex";
      }
    });

    // Clique nas disciplinas
    const disciplinas = item.querySelectorAll(".disciplina-item");
    disciplinas.forEach(d => {
      d.addEventListener("click", e => {
        e.stopPropagation();
        document.querySelectorAll(".disciplina-item").forEach(x => x.classList.remove("active"));
        d.classList.add("active");

        activeSetor = item.dataset.setor;
        activeDisciplina = d.dataset.disciplina;

        renderPreview(activeSetor, activeDisciplina);
      });
    });
  });

  // === SELEÇÃO DE PROJETO ===
  userProject.addEventListener("click", e => {
    e.stopPropagation();
    projectCard.style.display = projectCard.style.display === "block" ? "none" : "block";
  });

  document.addEventListener("click", () => {
    if (projectCard.style.display === "block") projectCard.style.display = "none";
  });

  confirmProjectBtn.addEventListener("click", () => {
    const selected = document.querySelector("input[name='projeto']:checked");
    if (!selected) {
      projectMessage.textContent = "Selecione um projeto antes de confirmar.";
      projectMessage.style.color = "red";
      return;
    }
    selectedProject = selected.value;
    userProject.textContent = selectedProject;
    projectCard.style.display = "none";
  });

  // === FUNÇÃO PRINCIPAL DE RENDERIZAÇÃO ===
  function renderPreview(setor, disciplina) {
    miniChartsContainer.innerHTML = "";
    dashboardContainer.innerHTML = "";
    accessDashboardBtn.style.display = "inline-block";

    const title = `${setor} - ${disciplina}`;
    document.querySelector(".preview-card h3").textContent = title;

    // Cria 3 mini-gráficos
    createMiniChart(`${disciplina} - Indicador 1`, randomData(5), "bar");
    createMiniChart(`${disciplina} - Indicador 2`, randomData(5), "doughnut");
    createMiniChart(`${disciplina} - Indicador 3`, randomData(5), "line");

    // Botão acessar dashboard
    accessDashboardBtn.onclick = () => renderMainDashboard(setor, disciplina);
  }

  // === DASHBOARD COMPLETO ===
  function renderMainDashboard(setor, disciplina) {
    dashboardContainer.innerHTML = "";
    accessDashboardBtn.style.display = "none";

    switch (setor) {
      case "DIAF":
        if (disciplina === "Recursos Humanos") renderRH();
        else if (disciplina === "Financeiro") renderFinanceiro();
        break;

      case "PYCP":
        if (disciplina === "Planejamento") renderPlanejamento();
        else if (disciplina === "Custo") renderCusto();
        break;

      case "Produção":
        renderProducao(disciplina);
        break;

      case "QSMS":
      case "CMASS":
        renderQSMS(disciplina);
        break;
    }
  }

  // === FUNÇÕES DE GRÁFICOS ===

  // 1️⃣ DIAF - Recursos Humanos
  function renderRH() {
    createCard("Total de Colaboradores", "1.087");
    createChart("Absenteísmo", [3, 4, 5, 2, 6], "bar");
    createChart("Treinamentos Mensais", [12, 8, 15, 10, 14], "line");
  }

  // 2️⃣ DIAF - Financeiro
  function renderFinanceiro() {
    createCard("Custo Total (R$)", "12.8M");
    createChart("Distribuição de Custos", [30, 25, 20, 15, 10], "pie");
    createChart("Evolução de Gastos", [10, 12, 11, 14, 13], "line");
  }

  // 3️⃣ PYCP - Planejamento
  function renderPlanejamento() {
    createCard("Avanço Físico", "84%");
    createChart("Avanço Semanal (%)", [70, 75, 80, 82, 84], "bar");
    createChart("Cronograma", [5, 10, 8, 6, 4], "line");
  }

  // 4️⃣ PYCP - Custo
  function renderCusto() {
    createCard("Desvio Financeiro", "5.3%");
    createChart("Planejado x Realizado", [100, 95, 98, 105, 102], "bar");
    createChart("Custos por Área", [25, 30, 15, 20, 10], "pie");
  }

  // 5️⃣ Produção
  function renderProducao(disciplina) {
    createCard("Frente de Trabalho", disciplina);
    createChart("Avanço Diário", [60, 65, 70, 75, 80], "line");
    createChart("Não Conformidades", [2, 3, 1, 4, 2], "bar");
    createGauge("Produtividade", 78);
  }

  // 6️⃣ QSMS / CMASS
  function renderQSMS(disciplina) {
    createCard("Área", disciplina);
    createChart("Ocorrências Mensais", [5, 4, 6, 3, 2], "bar");
    createChart("Status de Auditorias", [60, 25, 15], "pie");
    createMap();
  }

  // === FUNÇÕES AUXILIARES ===

  function createCard(titulo, valor) {
    const card = document.createElement("div");
    card.classList.add("chart-card");
    card.innerHTML = `
      <div class="chart-card-title">${titulo}</div>
      <div class="chart-card-value">${valor}</div>
    `;
    dashboardContainer.appendChild(card);
  }

  function createChart(titulo, dados, tipo) {
    const container = document.createElement("div");
    container.classList.add("chart-card");
    const canvas = document.createElement("canvas");
    container.innerHTML = `<div class="chart-card-title">${titulo}</div>`;
    container.appendChild(canvas);
    dashboardContainer.appendChild(container);

    new Chart(canvas, {
      type: tipo,
      data: {
        labels: ["Jan", "Fev", "Mar", "Abr", "Mai"],
        datasets: [{
          label: titulo,
          data: dados,
          backgroundColor: [
            "#004080", "#0066cc", "#0099ff", "#33ccff", "#80dfff"
          ],
          borderColor: "#003366",
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: tipo !== "bar" } }
      }
    });
  }

  function createMiniChart(titulo, dados, tipo) {
    const container = document.createElement("div");
    container.classList.add("chart-card");
    const canvas = document.createElement("canvas");
    container.innerHTML = `<div class="chart-card-title">${titulo}</div>`;
    container.appendChild(canvas);
    miniChartsContainer.appendChild(container);

    new Chart(canvas, {
      type: tipo,
      data: {
        labels: ["A", "B", "C", "D", "E"],
        datasets: [{
          data: dados,
          backgroundColor: ["#004080", "#0066cc", "#0099ff", "#33ccff", "#80dfff"]
        }]
      },
      options: { responsive: true, plugins: { legend: { display: false } } }
    });
  }

  // Gráfico tipo velocímetro
  function createGauge(titulo, valor) {
    const container = document.createElement("div");
    container.classList.add("chart-card");
    container.innerHTML = `<div class="chart-card-title">${titulo}</div><canvas></canvas>`;
    dashboardContainer.appendChild(container);
    const ctx = container.querySelector("canvas");

    new Chart(ctx, {
      type: "doughnut",
      data: {
        datasets: [{
          data: [valor, 100 - valor],
          backgroundColor: ["#0099ff", "#e0e0e0"],
          borderWidth: 0
        }]
      },
      options: {
        rotation: -90,
        circumference: 180,
        cutout: "75%",
        plugins: {
          tooltip: { enabled: false },
          legend: { display: false }
        }
      }
    });

    const label = document.createElement("div");
    label.style.position = "relative";
    label.style.top = "-80px";
    label.style.textAlign = "center";
    label.style.fontSize = "1.4em";
    label.style.fontWeight = "bold";
    label.textContent = valor + "%";
    container.appendChild(label);
  }

  // Mapa
  function createMap() {
    const container = document.createElement("div");
    container.classList.add("chart-card");
    container.innerHTML = `<div class="chart-card-title">Mapa de Ocorrências</div><div id="map" style="height:250px;border-radius:8px;"></div>`;
    dashboardContainer.appendChild(container);

    const map = L.map("map").setView([-19.5, -42.6], 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
    }).addTo(map);
    L.marker([-19.5, -42.6]).addTo(map).bindPopup("Obra Principal").openPopup();
  }

  // Gera dados aleatórios
  function randomData(qtde) {
    return Array.from({ length: qtde }, () => Math.floor(Math.random() * 100));
  }
});
