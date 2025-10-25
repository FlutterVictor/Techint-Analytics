// ========== assets/js/main.js (versão aprimorada) ==========

// -------------------------------
// UTILITÁRIOS DE CORES E TIPOS
// -------------------------------
const colorPalettes = [
  ['#004080','#0073e6','#00b3ff','#33ccff','#80e1ff'],
  ['#ff6600','#ffa31a','#ffd11a','#ff9933','#cc5200'],
  ['#00b359','#33cc33','#66ff66','#00e673','#00994d'],
  ['#8000ff','#9933ff','#b366ff','#cc99ff','#6600cc'],
  ['#ff1a75','#ff4da6','#ff80bf','#ffb3d9','#cc0066'],
  ['#6c757d','#adb5bd','#495057','#343a40','#212529'],
  ['#17a2b8','#20c997','#ffc107','#e83e8c','#6610f2']
];

function getRandomPalette(n = 5) {
  const pal = colorPalettes[Math.floor(Math.random() * colorPalettes.length)];
  // se n > pal.length, repetir com mapeamento
  const out = Array.from({length: n}, (_, i) => pal[i % pal.length]);
  return out;
}

function getRandomType() {
  const tipos = ['bar','line','doughnut','pie','radar','polarArea'];
  return tipos[Math.floor(Math.random() * tipos.length)];
}

// -------------------------------
// DADOS EXEMPLO (mantive seus dados)
// -------------------------------
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

const radarDataMap = {
  "Planejamento": [65,75,70,80,60,90],
  "Medição": [55,65,60,70,50,80],
  "Custo": [60,70,65,75,55,85],
  "Almoxarifado": [70,80,75,85,65,95],
  "Qualidade": [75,85,80,90,70,95],
  "Segurança": [80,90,85,95,75,100],
  "Meio Ambiente": [60,70,65,75,55,85],
  "Saúde": [55,65,60,70,50,80],
  "Elétrica": [65,75,70,80,60,90],
  "Mecânica": [70,80,75,85,65,95],
  "Solda": [55,65,60,70,50,80],
  "Pintura": [60,70,65,75,55,85],
  "Isolamento": [50,60,55,65,45,75],
  "Movimentação de Carga": [65,75,70,80,60,90],
  "Instrumentação": [55,65,60,70,50,80],
  "Andaime": [60,70,65,75,55,85],
  "Estruturas": [70,80,75,85,65,95],
  "Recursos Humanos": [55,65,60,70,50,80],
  "Financeiro": [60,70,65,75,55,85],
  "Contratual": [50,60,55,65,45,75]
};

// -------------------------------
// ELEMENTOS DO DOM (usados no seu HTML)
// -------------------------------
const miniChartsContainer = document.getElementById("miniChartsContainer");
const dashboardContainer = document.getElementById("dashboardContainer");
const userPhoto = document.getElementById("userPhoto");
const fileInput = document.getElementById("fileInput");
const userNameEl = document.getElementById("userName");
const userProjectEl = document.getElementById("userProject");
const projectCard = document.getElementById("projectCard");
const confirmProjectBtn = document.getElementById("confirmProjectBtn");
const projectMessage = document.getElementById("projectMessage");
const exportPdfBtn = document.getElementById("exportPdfBtn");
const accessDashboardBtn = document.getElementById("accessDashboardBtn"); // caso exista no HTML

// -------------------------------
// INICIALIZAÇÃO: carregar perfil salvo (foto, nome, função, projeto)
// -------------------------------
const defaultUser = {
  name: userNameEl ? userNameEl.textContent.trim() : "Usuário",
  role: document.querySelector(".user-role") ? document.querySelector(".user-role").textContent.trim() : "",
  photo: null,
  project: null
};

let userData = JSON.parse(localStorage.getItem("techint_user")) || defaultUser;

// Aplicar no DOM
function applyUserToDOM() {
  if (userData.photo) userPhoto.style.backgroundImage = `url(${userData.photo})`;
  if (userData.name) userNameEl.textContent = userData.name;
  if (userData.project) userProjectEl.textContent = userData.project;
}
applyUserToDOM();

// Salvar user
function saveUser() {
  localStorage.setItem("techint_user", JSON.stringify(userData));
}

// -------------------------------
// TROCA DE FOTO (persistente)
// -------------------------------
if (userPhoto && fileInput) {
  userPhoto.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = e => {
        userData.photo = e.target.result;
        userPhoto.style.backgroundImage = `url(${userData.photo})`;
        saveUser();
      };
      reader.readAsDataURL(file);
    } else {
      alert("Envie um arquivo de imagem válido.");
    }
  });
}

// Permitir editar nome ao clicar (rápido e simples — substitua por modal se desejar)
if (userNameEl) {
  userNameEl.addEventListener("click", () => {
    const novo = prompt("Editar nome do usuário:", userData.name || "");
    if (novo !== null) {
      userData.name = novo || defaultUser.name;
      applyUserToDOM();
      saveUser();
    }
  });
}

// -------------------------------
// SELEÇÃO DINÂMICA DE PROJETO (mantém inputs existentes)
// -------------------------------
if (userProjectEl) {
  userProjectEl.addEventListener("click", (e) => {
    e.stopPropagation();
    if (projectCard) {
      projectCard.classList.toggle("hidden");
      projectMessage.textContent = "";
    }
  });
}

// Confirmar projeto (mantive sua lógica)
if (confirmProjectBtn) {
  confirmProjectBtn.addEventListener("click", () => {
    const selected = [...projectCard.querySelectorAll("input[name=projeto]")].find(r => r.checked);
    if (selected) {
      userData.project = selected.value;
      userProjectEl.textContent = `Projeto: ${selected.value}`;
      projectMessage.style.color = "green";
      projectMessage.textContent = "Projeto confirmado com sucesso!";
      projectCard.classList.add("hidden");
      saveUser();
    } else {
      projectMessage.style.color = "red";
      projectMessage.textContent = "Selecione um projeto antes de confirmar.";
    }
  });

  // fechar o card se clicar fora
  document.addEventListener("click", e => {
    if (projectCard && !projectCard.contains(e.target) && e.target !== userProjectEl) {
      projectCard.classList.add("hidden");
      projectMessage.textContent = "";
    }
  });
}

// -------------------------------
// MENU LATERAL: expandir/contrair (mantive sua lógica, com melhoria para abrir só um)
// -------------------------------
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

// -------------------------------
// SELEÇÃO DE DISCIPLINA: marcar ativo e carregar dashboards automaticamente
// -------------------------------
document.querySelectorAll(".disciplina-item").forEach(subItem => {
  subItem.addEventListener("click", e => {
    e.stopPropagation();
    // remover outros ativos
    document.querySelectorAll(".disciplina-item.active").forEach(act => act.classList.remove("active"));
    subItem.classList.add("active");

    // carregar preview e os gráficos principais direto
    const disciplina = subItem.dataset.disciplina;
    loadPreviewForDisciplina(disciplina);
    renderMainDashboard(disciplina);
  });
});

// -------------------------------
// PREVIEW: mini-gráficos (melhorados com cores dinamicas e tipos variados)
// -------------------------------
function loadPreviewForDisciplina(disciplina) {
  miniChartsContainer.innerHTML = "";
  const data = miniChartsData[disciplina];
  if (!data) {
    miniChartsContainer.innerHTML = "<p>Sem dados para essa disciplina.</p>";
    if (accessDashboardBtn) accessDashboardBtn.style.display = "none";
    return;
  }

  // gerar 3 mini charts variados
  for (let i = 0; i < 3; i++) {
    const card = document.createElement("div");
    card.className = "chart-card";

    const title = document.createElement("div");
    title.className = "chart-card-title";
    title.textContent = `Indicador ${i + 1}`;

    const canvas = document.createElement("canvas");
    // ajuste de estilo para mini
    canvas.style.height = "140px";

    card.appendChild(title);
    card.appendChild(canvas);
    miniChartsContainer.appendChild(card);

    const palette = getRandomPalette(6);
    const tipo = i === 0 ? 'bar' : (i === 1 ? 'doughnut' : 'line');

    new Chart(canvas.getContext("2d"), {
      type: tipo,
      data: {
        labels: ["Jan","Fev","Mar","Abr","Mai","Jun"],
        datasets: [{
          label: "Valor",
          data: data.map(v => v + i*2),
          backgroundColor: tipo === 'bar' ? palette : palette.slice(0, data.length),
          borderColor: palette,
          fill: tipo === 'line' ? false : true,
          tension: 0.3
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

  // Esconder botão acessar caso exista (não necessário)
  if (accessDashboardBtn) accessDashboardBtn.style.display = "none";
}

// -------------------------------
// RENDERIZAÇÃO DO DASHBOARD PRINCIPAL (3 fileiras, múltiplos tipos)
// -------------------------------
let activeChartInstances = []; // para destruir se recarregar

function clearActiveCharts() {
  activeChartInstances.forEach(inst => {
    try { inst.destroy(); } catch(e){/* ignore */ }
  });
  activeChartInstances = [];
}

function renderMainDashboard(disciplina) {
  // limpa
  dashboardContainer.innerHTML = "";

  // Cabeçalho do dashboard com botão de export (se existir, já no HTML)
  const header = document.createElement("div");
  header.style.display = "flex";
  header.style.justifyContent = "space-between";
  header.style.alignItems = "center";
  header.style.marginBottom = "12px";

  const h2 = document.createElement("h2");
  h2.textContent = `Dashboard — ${disciplina}`;
  h2.style.color = "#003366";
  h2.style.margin = "0";
  h2.style.fontSize = "1.2rem";

  header.appendChild(h2);
  dashboardContainer.appendChild(header);

  // Grid: vamos gerar 9 cards (3 colunas x 3 linhas)
  const chartsToCreate = [
    { type: 'bar', title: 'Progresso Semanal' },
    { type: 'pie', title: 'Distribuição de Atividades' },
    { type: 'radar', title: 'Capacidades (Radar)' },
    { type: 'polarArea', title: 'Risco por Área' },
    { type: 'line', title: 'Tendência Mensal' },
    { type: 'doughnut', title: 'Status (%)' },
    { type: 'gauge', title: 'Velocímetro' },
    { type: 'card', title: 'Indicador Principal' },
    { type: 'map', title: 'Localização (Mapa)' }
  ];

  // criar os cards
  chartsToCreate.forEach((ch, idx) => {
    const card = document.createElement("div");
    card.className = "chart-card";

    const title = document.createElement("div");
    title.className = "chart-card-title";
    title.textContent = ch.title;

    card.appendChild(title);

    // dependendo do tipo, criar canvas ou elemento especial
    if (ch.type === 'card') {
      const perf = document.createElement("div");
      perf.className = "performance-indicator";
      const valueSpan = document.createElement("div");
      valueSpan.className = "value";
      const val = Math.floor(Math.random() * 41) + 60; // 60-100
      valueSpan.textContent = `${val}%`;
      perf.appendChild(document.createTextNode("Desempenho"));
      perf.appendChild(valueSpan);
      card.appendChild(perf);
      dashboardContainer.appendChild(card);
      return;
    }

    if (ch.type === 'map') {
      const mapDiv = document.createElement("div");
      mapDiv.id = `miniMap_${idx}`;
      mapDiv.style.width = "100%";
      mapDiv.style.height = "240px";
      mapDiv.style.marginTop = "8px";
      card.appendChild(mapDiv);
      dashboardContainer.appendChild(card);
      // init map depois do append
      setTimeout(() => {
        try {
          const map = L.map(mapDiv.id, { scrollWheelZoom: false }).setView([-23.55, -46.63], 11);
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 18
          }).addTo(map);
          // marcador aleatório para demo
          L.marker([-23.55 + Math.random()*0.06, -46.63 + Math.random()*0.06]).addTo(map).bindPopup(`${disciplina} - Ponto`);
        } catch (e) {
          // Leaflet pode não estar presente; ignore
        }
      }, 200);
      return;
    }

    // gauge (velocímetro) special handling
    if (ch.type === 'gauge') {
      const canvas = document.createElement("canvas");
      canvas.id = `gauge_${idx}`;
      canvas.style.height = "160px";
      canvas.style.width = "100%";
      card.appendChild(canvas);
      dashboardContainer.appendChild(card);
      // render gauge
      const value = Math.floor(Math.random() * 101);
      renderGaugeChart(canvas.getContext("2d"), value);
      return;
    }

    // caso padrão: inserir canvas
    const canvas = document.createElement("canvas");
    canvas.id = `chart_${idx}`;
    canvas.style.height = "220px";
    card.appendChild(canvas);
    dashboardContainer.appendChild(card);

    // criar chart com Chart.js
    const ctx = canvas.getContext("2d");
    const palette = getRandomPalette(6);
    const labels = ["Jan","Fev","Mar","Abr","Mai","Jun"];
    let cfg;

    if (ch.type === 'radar') {
      const dataRadar = radarDataMap[disciplina] || [50,50,50,50,50,50];
      cfg = {
        type: 'radar',
        data: {
          labels: ['Velocidade','Resistência','Agilidade','Precisão','Força','Tática'],
          datasets: [{
            label: disciplina,
            data: dataRadar,
            backgroundColor: hexToRgba(palette[0],0.25),
            borderColor: palette[0],
            pointBackgroundColor: palette[1]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            r: {
              angleLines: { color: "#eee" },
              grid: { color: "#f0f0f0" },
              pointLabels: { color: "#004080", font: { size: 12, weight: "600" } },
              ticks: { display: false, max: 100, min: 0 }
            }
          }
        }
      };
    } else if (ch.type === 'pie' || ch.type === 'doughnut' || ch.type === 'polarArea') {
      const vals = Array.from({length: 6}, () => Math.floor(Math.random()*100));
      cfg = {
        type: ch.type === 'polarArea' ? 'polarArea' : (ch.type === 'pie' ? 'pie' : 'doughnut'),
        data: {
          labels,
          datasets: [{
            data: vals,
            backgroundColor: getRandomPalette(vals.length),
            borderWidth: 0
          }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
      };
    } else {
      // bar / line default
      cfg = {
        type: (ch.type === 'line' ? 'line' : 'bar'),
        data: {
          labels,
          datasets: [{
            label: ch.title,
            data: Array.from({length: labels.length}, () => Math.floor(Math.random()*100)),
            backgroundColor: palette,
            borderColor: palette,
            borderWidth: 1,
            fill: ch.type === 'line' ? false : true,
            tension: 0.3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, max: 100 } }
        }
      };
    }

    try {
      const inst = new Chart(ctx, cfg);
      activeChartInstances.push(inst);
    } catch(e) {
      // falha ao criar gráfico - não interromper fluxo
      console.error("Erro ao criar gráfico:", e);
    }
  });

  // ajustar grid: seu CSS .chart-card já cuida da responsividade/colunas
}

// -------------------------------
// Função auxiliar para rgba
// -------------------------------
function hexToRgba(hex, alpha = 0.3) {
  const h = hex.replace('#','');
  const bigint = parseInt(h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// -------------------------------
// Funções de Gauge e Radar (mantive suas implementações, com cores dinâmicas)
// -------------------------------
function renderGaugeChart(ctx, value) {
  const gaugeMax = 100;
  if (window.gaugeChartInstance) {
    try { window.gaugeChartInstance.destroy(); } catch(e){}
  }

  const pal = getRandomPalette(2);
  window.gaugeChartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Valor","Resto"],
      datasets: [{
        data: [value, gaugeMax - value],
        backgroundColor: [pal[0], '#e9f2ff'],
        borderWidth: 0
      }]
    },
    options: {
      rotation: -Math.PI,
      circumference: Math.PI,
      cutout: "78%",
      plugins: { tooltip: { enabled: false }, legend: { display: false } },
      animation: { animateRotate: true, duration: 1200 }
    },
    plugins: [{
      id: "gaugeCenterText",
      afterDraw(chart) {
        const { ctx, chartArea: { width, height } } = chart;
        ctx.save();
        ctx.font = "bold 22px 'Segoe UI'";
        ctx.fillStyle = pal[0];
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${value}%`, width / 2, height * 0.78);
        ctx.restore();
      }
    }]
  });
}

// -------------------------------
// MAP (se existir elemento com id "map" no HTML, carregamos)
//
// Nota: a versão principal de menu.html tinha o elemento comentado.
// -------------------------------
function loadMapIfExists() {
  const mapEl = document.getElementById("map");
  if (!mapEl) return;
  if (mapEl.style.display === "none") return;

  try {
    const map = L.map("map").setView([-23.55, -46.63], 10);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 18
    }).addTo(map);
    const markers = [
      { lat: -23.55, lng: -46.63, title: "Centro SP" },
      { lat: -23.58, lng: -46.66, title: "Pinheiros" },
      { lat: -23.53, lng: -46.62, title: "Itaim" },
    ];
    markers.forEach(({ lat, lng, title }) => {
      L.marker([lat, lng]).addTo(map).bindPopup(title);
    });
  } catch (e) {
    console.warn("Leaflet não inicializado (ou não presente).", e);
  }
}
loadMapIfExists();

// -------------------------------
// EXPORTAR PARA PDF (usa html2canvas + jsPDF se presentes)
// -------------------------------
async function generatePDF() {
  // checar dependências
  if (typeof html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
    alert("Para exportar em PDF você precisa incluir html2canvas e jsPDF no HTML.\nEx.: \n<script src=\"https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js\"></script>\n<script src=\"https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js\"></script>");
    return;
  }

  try {
    // esconder elementos que não queremos no PDF (opcional)
    const sidebar = document.querySelector('.sidebar');
    const exportBtn = exportPdfBtn;
    if (exportBtn) exportBtn.style.display = 'none';

    // capturar a área principal (a div .main)
    const mainEl = document.querySelector('.main');
    const canvas = await html2canvas(mainEl, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');

    // criar pdf em landscape para melhor encaixe
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // calcular tamanho da imagem em mm mantendo proporção
    const imgProps = pdf.getImageProperties(imgData);
    const imgWidth = pageWidth - 20; // margens
    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

    let position = 10;
    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    // se for maior que a página, adicionar páginas extras (simples)
    let remainingHeight = imgHeight - (pageHeight - 20);
    let offset = pageHeight - 20;
    let sliceY = (canvas.height * (pageHeight - 20)) / imgHeight;

    while (remainingHeight > 0) {
      pdf.addPage();
      position = 10;
      // recortar canvas original — solução simples: reaplicar imagem com offset negativo
      pdf.addImage(imgData, 'PNG', 10, position - offset, imgWidth, imgHeight);
      remainingHeight -= (pageHeight - 20);
      offset += (pageHeight - 20);
    }

    // restaurar visibilidade do botão
    if (exportBtn) exportBtn.style.display = 'inline-block';

    pdf.save(`dashboard_${(new Date()).toISOString().slice(0,10)}.pdf`);
  } catch (e) {
    console.error("Erro ao gerar PDF:", e);
    alert("Falha ao gerar PDF. Veja console para mais detalhes.");
  }
}

if (exportPdfBtn) {
  exportPdfBtn.addEventListener("click", generatePDF);
}

// -------------------------------
// LOGOUT simples (mantive a sua função)
// -------------------------------
function logout() {
  alert("Logout efetuado!");
  // Se desejar, limpar localStorage relacionado ao usuário (opcional)
  // localStorage.removeItem("techint_user");
}

// exportar logout para global (HTML onclick uses logout())
window.logout = logout;

// -------------------------------
// FUNÇÃO INICIAL — opcional: carregar primeiro setor/primeira disciplina ativa ao abrir
// -------------------------------
(function initialLoad() {
  // Se algum item já estiver marcado active, usa esse; senão marca o primeiro disponível
  const firstDisc = document.querySelector(".disciplina-item");
  if (firstDisc) {
    // marcar visualmente e disparar carregamento
    firstDisc.classList.add("active");
    const disciplina = firstDisc.dataset.disciplina;
    loadPreviewForDisciplina(disciplina);
    renderMainDashboard(disciplina);
  }

  // aplicar foto se estiver salva
  applyUserToDOM();
})();

// -------------------------------
// FIM DO SCRIPT
// -------------------------------
