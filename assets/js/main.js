/* POINT INITIAL - main.js (VERSÃO FINAL EXTENDIDA)
   - Mantém layout
   - Suporta responsividade por tipo / conteúdo
   - Heatmap simples, KPI cards, previews de tabela
   - Redesenho em resize, destruição segura de charts
   - Paleta azul (até 3 tons)
   - Muitas anotações e pontos de extensão
*/

/* eslint-disable no-console */
(() => {
  'use strict';

  // ---------- CONFIGURAÇÕES GLOBAIS ----------
  const CORES_AZUL = ['#004080', '#0066cc', '#80b3ff'];
  const DEFAULT_CHART_HEIGHT = 240; // base visual para charts
  const LOADER_DELAY_MS = 250; // tempo simulado para "loading" de dados

  // ---------- DADOS DO USUÁRIO ----------
  const usuario = JSON.parse(localStorage.getItem('usuario')) || {
    name: 'José Victor Silva de Jesus',
    photo: 'assets/imagens/logo-por_cuadrado.jpeg',
    projeto: 'PCI Usiminas'
  };

  // ---------- ELEMENTOS DOM (CACHE) ----------
  const userPhoto = document.getElementById('userPhoto');
  const userName = document.getElementById('userName');
  const userProject = document.getElementById('userProject');
  const fileInput = document.getElementById('fileInput');
  const projectCard = document.getElementById('projectCard');
  const confirmBtn = document.getElementById('confirmProjectBtn');
  const projectMessage = document.getElementById('projectMessage');
  const previewCard = document.getElementById('previewCard');
  const miniChartsContainer = document.getElementById('miniChartsContainer');
  const accessBtn = document.getElementById('accessDashboardBtn');

  // For debug / dev
  window._TECHINT_DEBUG = window._TECHINT_DEBUG || {};

  // ---------- INICIALIZAÇÃO UI ----------
  function initUI() {
    userName.innerText = usuario.name;
    userProject.innerText = usuario.projeto;
    userPhoto.style.backgroundImage = `url('${usuario.photo}')`;
    // hide projectCard by default
    if (projectCard) projectCard.style.display = 'none';
  }
  initUI();

  // ---------- HELPERS ----------

  function saveUsuario() {
    localStorage.setItem('usuario', JSON.stringify(usuario));
  }

  function randomArray(length, max = 100, float = false) {
    const arr = [];
    for (let i = 0; i < length; i++) {
      const v = Math.random() * max;
      arr.push(float ? Number(v.toFixed(2)) : Math.round(v));
    }
    return arr;
  }

  function sum(arr) { return arr.reduce((a,b)=>a+b,0); }
  function last(arr) { return arr && arr.length ? arr[arr.length-1] : null; }

  // Safe Chart destruction / store
  function getChartStore() {
    miniChartsContainer._charts = miniChartsContainer._charts || [];
    return miniChartsContainer._charts;
  }
  function storeChart(chart) {
    const s = getChartStore();
    s.push(chart);
  }
  function destroyAllCharts() {
    const s = getChartStore();
    s.forEach(c => {
      try { c.destroy(); } catch (e) { console.warn('destroy chart fail', e); }
    });
    miniChartsContainer._charts = [];
  }

  // Utility: create dom element with class
  function el(tag='div', cls=null) {
    const d = document.createElement(tag);
    if (cls) d.className = cls;
    return d;
  }

  // Convert hex to rgba
  function hexToRgba(hex, alpha = 1) {
    const h = hex.replace('#','');
    const bigint = parseInt(h, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r},${g},${b},${alpha})`;
  }

  // Decide layout classes based on count
  function applyLayoutClass(count) {
    miniChartsContainer.classList.remove('one-per-row','two-per-row','three-per-row');
    if (count === 1) miniChartsContainer.classList.add('one-per-row');
    else if (count === 2) miniChartsContainer.classList.add('two-per-row');
    else miniChartsContainer.classList.add('three-per-row');
  }

  // ---------- UI: Upload / user photo / project selection ----------

  userPhoto.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      userPhoto.style.backgroundImage = `url('${reader.result}')`;
      usuario.photo = reader.result;
      saveUsuario();
    };
    reader.readAsDataURL(file);
  });

  userProject.addEventListener('click', (ev) => {
    ev.stopPropagation();
    projectCard.style.display = projectCard.style.display === 'block' ? 'none' : 'block';
  });

  // close projectCard clicking outside
  document.addEventListener('click', (ev) => {
    if (projectCard && projectCard.style.display === 'block') {
      if (!projectCard.contains(ev.target) && ev.target !== userProject) {
        projectCard.style.display = 'none';
        projectMessage.innerHTML = '';
      }
    }
  });

  // esc close
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') {
      if (projectCard) projectCard.style.display = 'none';
      projectMessage.innerHTML = '';
    }
  });

  confirmBtn.addEventListener('click', () => {
    const selected = document.querySelector('input[name="projeto"]:checked');
    if (!selected) { alert('Selecione um projeto'); return; }
    const escolha = selected.value;
    projectMessage.innerHTML = '<span class="spinner"></span> Atualizando...';
    setTimeout(() => {
      if (['PCI Usiminas','MOA Usiminas'].includes(escolha)) {
        usuario.projeto = escolha;
        userProject.innerText = escolha;
        projectMessage.innerHTML = '<span style="color:green">✔ Projeto atualizado com sucesso!</span>';
        projectCard.style.display = 'none';
        saveUsuario();
      } else {
        projectMessage.innerHTML = 'Acesso restrito, entre em contato com o administrador ou superior <span class="error-icon">✖</span>';
      }
    }, 600);
  });

  window.logout = function() {
    localStorage.removeItem('usuario');
    window.location.href = 'index.html';
  };

  // ---------- MENU LATERAL (toggle + selection handling) ----------
  const dashboardItems = document.querySelectorAll('.dashboard-item');
  dashboardItems.forEach(item => {
    const submenu = item.querySelector('.sub-menu');
    item.addEventListener('click', (ev) => {
      // if user clicked a nested discipline (we stopPropagation in discipline listener)
      const isVisible = submenu && submenu.style.display === 'flex';
      // close all
      dashboardItems.forEach(i => {
        const sm = i.querySelector('.sub-menu');
        if (sm && sm !== submenu) sm.style.display = 'none';
        i.classList.remove('active');
      });
      if (submenu) {
        submenu.style.display = isVisible ? 'none' : 'flex';
        if (!isVisible) item.classList.add('active');
      } else {
        item.classList.add('active');
      }
      const setor = item.dataset.setor;
      updatePreview(setor, null);
    });
  });

  // Disciplina click binding
  function onDisciplinaClick(e) {
    e.stopPropagation();
    const all = document.querySelectorAll('.disciplina-item');
    all.forEach(it => it.classList.remove('active'));
    this.classList.add('active');
    const setor = this.closest('.dashboard-item').dataset.setor;
    const disciplina = this.dataset.disciplina;
    updatePreview(setor, disciplina);
  }
  const disciplinas = document.querySelectorAll('.disciplina-item');
  disciplinas.forEach(d => d.addEventListener('click', onDisciplinaClick));

  // ---------- MOCK CONFIGURATIONS (dados / tipos) ----------
  const MOCKS = {
    gerencial: [
      { type:'line', title:'Avanço da Obra (%)', labels:['Jan','Feb','Mar','Apr','May'], generator: ()=> randomArray(5,100)},
      { type:'bar', title:'Custo Previsto x Real (R$)', labels:['Prev','Real'], generator: ()=> [120000, 115000]},
      { type:'bar', title:'HH Previsto x Real', labels:['Prev','Real'], generator: ()=> [1200, 1100]},
      { type:'doughnut', title:'Desvio (%)', labels:['Atraso','Dentro'], generator: ()=> [20,80]}
    ],
    PYCP: {
      setorPreview: [
        {type:'line', title:'STD (Tempo de Produção)', labels:['S1','S2','S3','S4'], generator: ()=> randomArray(4,2,true)},
        {type:'bar', title:'HH Consumidos', labels:['A1','A2','A3'], generator: ()=> randomArray(3,30)}
      ],
      Planejamento: [
        {type:'line', title:'Planejamento - Progresso (%)', labels:['W1','W2','W3'], generator: ()=> [60,75,85]},
        {type:'doughnut', title:'Aderência ao Plano', labels:['Aderente','Não'], generator: ()=> [70,30]}
      ],
      Medição: [{type:'bar', title:'Medição % Concluída', labels:['Item1','Item2','Item3'], generator: ()=> randomArray(3,100)}],
      Custo: [
        {type:'bar', title:'Custo Planejado x Real (R$)', labels:['Prev','Real'], generator: ()=> [50000,48000]},
        {type:'line', title:'Tendência de Custo', labels:['M1','M2','M3','M4'], generator: ()=> randomArray(4,60000)}
      ]
    },
    QSMS: {
      setorPreview: [
        {type:'doughnut', title:'Conformidade QSMS', labels:['OK','Not OK'], generator: ()=> [88,12]},
        {type:'bar', title:'Near Miss / Incidentes', labels:['Near Miss','Incidentes'], generator: ()=> [12,3]}
      ],
      Qualidade: [{type:'line', title:'Índice de Qualidade (%)', labels:['Jan','Fev','Mar'], generator: ()=> [92,90,95]}],
      Segurança: [{type:'bar', title:'Incidentes por Mês', labels:['Jan','Fev','Mar'], generator: ()=> randomArray(3,10)}],
      'Meio Ambiente e Saúde': [{type:'doughnut', title:'Indicadores Ambientais', labels:['Ok','Alerta'], generator: ()=> [85,15]}],
      Saude: [{type:'bar', title:'Indicadores de Saúde', labels:['Absenteísmo','Treinamentos'], generator: ()=> [3,8]}]
    },
    Producao: {
      setorPreview: [
        {type:'line', title:'Produção Geral (%)', labels:['A1','A2','A3','A4'], generator: ()=> randomArray(4,100)},
        {type:'bar', title:'HH por Disciplina', labels:['Elétrica','Mecânica','Solda'], generator: ()=> randomArray(3,200)}
      ],
      Eletrica: [{type:'line', title:'Elétrica (%)', labels:['A1','A2','A3'], generator: ()=> randomArray(3,100)}],
      Andaime: [{type:'bar', title:'Andaime (m)', labels:['Montagem','Desmontagem'], generator: ()=> [200,180]}],
      Mecânica: [{type:'line', title:'Mecânica (%)', labels:['D1','D2','D3'], generator: ()=> randomArray(3,100)}],
      Solda: [{type:'bar', title:'Solda - Inspecionadas x Aprovadas', labels:['Inspecionadas','Aprovadas'], generator: ()=> [30,28]}],
      Pintura: [{type:'bar', title:'Pintura (m²)', labels:['Previsto','Realizado'], generator: ()=> [1000,900]}],
      Isolamento: [{type:'doughnut', title:'Isolamento Térmico (%)', labels:['Concluído','Pendente'], generator: ()=> [75,25]}],
      'Movimentação de Carga':[ {type:'bar', title:'Mov. Carga (movs)', labels:['Previsto','Real'], generator: ()=> [50,45]} ],
      Instrumentação: [{type:'line', title:'Instrumentação (%)', labels:['T1','T2','T3'], generator: ()=> randomArray(3,100)}],
      Estruturas: [{type:'line', title:'Estruturas (%)', labels:['S1','S2','S3'], generator: ()=> randomArray(3,100)}]
    },
    Diaf: {
      setorPreview: [
        { type:'doughnut', title:'Efetivo / Vagas', labels:['Ativos','Vagas'], generator: ()=> [720, 45] },
        { type:'bar', title:'Custos Financeiros', labels:['Prev','Real'], generator: ()=> [50000,48000] }
      ],
      'Recursos Humanos': [{type:'line', title:'Efetivo (%)', labels:['Jan','Fev'], generator: ()=> [90,95]}],
      Financeiro: [{type:'bar', title:'Financeiro (R$)', labels:['Prev','Real'], generator: ()=> [50000,48000]}],
      Contratual: [{type:'doughnut', title:'Contratual', labels:['Em dia','Atraso'], generator: ()=> [80,20]}]
    }
  };

  // ---------- FUNÇÕES DE RENDER (CARDS + CHARTS) ----------

  // Creates a chart card with title, value, and canvas
  function createChartCard(titleText, typeHint = '') {
    const card = el('div','chart-card');
    // set type-specific class for CSS behavior
    if (typeHint) card.classList.add(typeHint);

    const title = el('div','chart-card-title');
    title.innerText = titleText;

    const value = el('div','chart-card-value');
    value.innerText = '';

    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.display = 'block';
    canvas.style.minHeight = DEFAULT_CHART_HEIGHT + 'px';

    card.appendChild(title);
    card.appendChild(value);
    card.appendChild(canvas);

    return { card, canvas, title, value };
  }

  // Build dataset using blue palette - returns dataset object for Chart.js
  function datasetWithBluePalette(data, label, type) {
    if (!Array.isArray(data)) data = Array.from(data);
    if (type === 'doughnut' || type === 'pie') {
      const bg = data.map((_, i) => CORES_AZUL[i % CORES_AZUL.length]);
      return { label, data, backgroundColor: bg, borderColor: '#ffffff', borderWidth: 1 };
    } else if (type === 'bar') {
      // color per bar
      const bg = data.map((_, i) => CORES_AZUL[i % CORES_AZUL.length]);
      return { label, data, backgroundColor: bg, borderColor: CORES_AZUL[0], borderWidth: 1 };
    } else {
      // line / radar
      return {
        label,
        data,
        backgroundColor: hexToRgba(CORES_AZUL[1], 0.12),
        borderColor: CORES_AZUL[0],
        borderWidth: 2,
        pointBackgroundColor: CORES_AZUL[1],
        tension: 0.25,
        fill: type === 'line'
      };
    }
  }

  // Create Chart.js config and instantiate chart
  function instantiateChart(canvas, cfg) {
    const ctx = canvas.getContext('2d');
    const chartConfig = {
      type: cfg.type || 'line',
      data: {
        labels: cfg.labels || cfg.data.map((_,i)=>`P${i+1}`),
        datasets: [datasetWithBluePalette(cfg.data, cfg.title || 'Série', cfg.type)]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: cfg.type !== 'line' && cfg.type !== 'radar' }
        },
        scales: (cfg.type === 'doughnut' || cfg.type === 'pie' || cfg.type === 'radar') ? {} : {
          x: { display: true },
          y: { display: true }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        },
        onResize: function(chart, size) {
          // Chart.js will handle redraw, but we can add hooks if needed
        }
      }
    };

    try {
      const c = new Chart(ctx, chartConfig);
      storeChart(c);
      return c;
    } catch (err) {
      console.error('Chart instantiation failed', err);
      return null;
    }
  }

  // Render a heatmap (simple) into a canvas element
  // input: 2D array of values, labelsX, labelsY
  function renderHeatmapIntoCanvas(canvas, grid, labelsX = [], labelsY = []) {
    // grid: array of rows, each row is array of numbers
    const ctx = canvas.getContext('2d');
    const rows = grid.length;
    const cols = grid[0] ? grid[0].length : 0;
    const width = canvas.clientWidth || canvas.width;
    const height = canvas.clientHeight || canvas.height;
    canvas.width = Math.max(width, 300);
    canvas.height = Math.max(height, 220);

    // compute cell size
    const cellW = canvas.width / Math.max(cols,1);
    const cellH = canvas.height / Math.max(rows,1);

    // find range
    let min = Infinity, max = -Infinity;
    grid.forEach(r => r.forEach(v => { if (v < min) min = v; if (v > max) max = v; }));
    if (min === Infinity) min = 0; if (max === -Infinity) max = 1;
    const range = max - min || 1;

    // helper to map value to color from blue shades
    function valueToColor(v) {
      const norm = (v - min) / range; // 0..1
      // blend from light (#eaf4ff) to dark (#004080)
      const light = [234,244,255];
      const dark = [0,64,128];
      const r = Math.round(light[0] + (dark[0]-light[0]) * norm);
      const g = Math.round(light[1] + (dark[1]-light[1]) * norm);
      const b = Math.round(light[2] + (dark[2]-light[2]) * norm);
      return `rgb(${r},${g},${b})`;
    }

    // clear
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // draw cells
    for (let r=0; r<rows; r++) {
      for (let c=0; c<cols; c++) {
        const v = grid[r][c];
        ctx.fillStyle = valueToColor(v);
        ctx.fillRect(c*cellW, r*cellH, cellW, cellH);
        // optional: draw small value text if big enough
        if (Math.min(cellW,cellH) > 30) {
          ctx.fillStyle = '#fff';
          ctx.font = `${Math.min(12, Math.floor(cellH/3))}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(v), c*cellW + cellW/2, r*cellH + cellH/2);
        }
      }
    }

    // optional labels
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    labelsX.forEach((lx, i) => {
      ctx.textAlign = 'center';
      ctx.fillText(lx, i*cellW + cellW/2, canvas.height - 6);
    });
    labelsY.forEach((ly, i) => {
      ctx.textAlign = 'right';
      ctx.fillText(ly, 6, i*cellH + cellH/2);
    });
  }

  // ---------- RENDERING OF MOCKS (MAIN ENTRY) ----------
  function renderMockChartsFor(setor, disciplina) {
    // show loader
    clearCharts();
    // small loader UI: create a spinner in container
    const spinner = el('div','mini-charts-loader');
    spinner.innerHTML = '<div class="spinner"></div>';
    miniChartsContainer.appendChild(spinner);

    // Simulate data fetch latency
    setTimeout(() => {
      // remove spinner
      if (spinner && spinner.parentNode) spinner.parentNode.removeChild(spinner);

      // choose mocks
      let items = [];
      if (!setor) { items = MOCKS.gerencial; }
      else {
        const block = MOCKS[setor];
        if (!block) items = MOCKS.gerencial;
        else {
          if (disciplina) items = block[disciplina] || [];
          else items = block.setorPreview || [];
        }
      }

      // fallback
      if (!items || items.length === 0) {
        items = [{ type:'line', title:'Indicador', labels:['A','B','C'], generator: ()=> randomArray(3,100) }];
      }

      // adapt layout classes
      applyLayoutClass(items.length >= 3 ? 3 : items.length);

      // create cards & charts
      items.forEach((cfg, idx) => {
        // Determine type hint class for CSS
        const typeHint = (cfg.type === 'doughnut' || cfg.type === 'pie') ? 'pizza' :
                         (cfg.type === 'bar') ? 'bar' :
                         (cfg.type === 'radar') ? 'radar' :
                         '';

        const { card, canvas, title, value } = createChartCard(cfg.title || `Gráfico ${idx+1}`, typeHint);

        // compute data
        const data = (typeof cfg.generator === 'function') ? cfg.generator() : (cfg.data || randomArray(cfg.labels ? cfg.labels.length : 5, 100));
        // set value summary
        if (cfg.type === 'doughnut' || cfg.type === 'pie') {
          value.innerText = sum(data);
        } else if (cfg.type === 'bar' || cfg.type === 'line') {
          value.innerText = last(data);
        } else {
          value.innerText = last(data);
        }

        // append card
        miniChartsContainer.appendChild(card);

        // special handling for heatmap-type (if cfg.type == 'heatmap' we render custom)
        if (cfg.type === 'heatmap') {
          // canvas size adjust
          canvas.style.minHeight = '260px';
          // draw heatmap directly
          const grid = cfg.grid || [
            [Math.round(Math.random()*100), Math.round(Math.random()*100), Math.round(Math.random()*100)],
            [Math.round(Math.random()*100), Math.round(Math.random()*100), Math.round(Math.random()*100)],
            [Math.round(Math.random()*100), Math.round(Math.random()*100), Math.round(Math.random()*100)]
          ];
          renderHeatmapIntoCanvas(canvas, grid, cfg.labels || [], cfg.yLabels || []);
          continue;
        }

        // instantiate Chart.js
        const chartObj = instantiateChart(canvas, { type: cfg.type, data, labels: cfg.labels, title: cfg.title });

        // If doughnut with many segments, expand card width (by toggling class)
        if ((cfg.type === 'doughnut' || cfg.type === 'pie') && (data.length > 5)) {
          // give more space by letting CSS adjust via class
          card.style.flex = '1 1 calc(50% - 20px)';
          card.style.maxWidth = 'calc(50% - 20px)';
        }

        // responsive adjustment: if many labels, increase minHeight
        if (cfg.labels && cfg.labels.length > 8) {
          canvas.style.minHeight = '300px';
        }
      });

    }, LOADER_DELAY_MS);
  }

  // ---------- INTEGRATION: updatePreview ----------
  function updatePreview(setor, disciplina) {
    const titleEl = previewCard.querySelector('h3');
    const descEl = previewCard.querySelector('p');
    let title = `Sistema de Gerenciamento ${setor || ''}`;
    let desc = '';

    if (disciplina) {
      title += ` - ${disciplina}`;
      desc = `Prévia da disciplina ${disciplina} do setor ${setor}.`;
      accessBtn.style.display = 'inline-block';
      accessBtn.innerText = `Acessar ${disciplina}`;
    } else {
      accessBtn.style.display = 'none';
      switch (setor) {
        case 'PYCP': desc = 'Planejamento, Medição e Custo'; break;
        case 'QSMS': desc = 'Qualidade, Segurança, Meio Ambiente e Saúde'; break;
        case 'Produção': desc = 'Elétrica, Andaime, Mecânica, Solda, Estruturas, Pintura, Isolamento, Movimentação e Instrumentação'; break;
        case 'Diaf': desc = 'Recursos Humanos, Financeiro e Contratual'; break;
        default: desc = 'Dashboard Gerencial: Avanço de obras, custo previsto x real, HH previsto x real, desvio e indicadores gerais.'; break;
      }
    }

    if (titleEl) titleEl.innerText = title;
    if (descEl) descEl.innerText = desc;

    // Render the charts for section
    renderMockChartsFor(setor, disciplina);
  }

  // ---------- INITIAL RENDER ----------
  updatePreview(null, null);

  // ---------- RESIZE HANDLING (redraw charts responsively) ----------
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    // throttle heavy redraws
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      // For Chart.js responsive charts, resizing is automatic,
      // but for custom heatmaps we re-render by re-invoking current preview
      // Determine currently active setor/disciplina by reading preview title text
      const currentTitle = previewCard.querySelector('h3').innerText || '';
      // crude parse: expects "Sistema de Gerenciamento X - Y" or similar
      const match = currentTitle.match(/^Sistema de Gerenciamento\s*(\S+)?(?:\s*-\s*(.*))?/);
      const setor = match && match[1] ? match[1] : null;
      const disciplina = match && match[2] ? match[2] : null;
      // Re-render charts to adjust sizes (we could be smarter and only resize heatmaps)
      renderMockChartsFor(setor === 'undefined' ? null : setor, disciplina);
    }, 250);
  });

  // ---------- Expose utilities for debugging ----------
  window._TECHINT_DEBUG.main = {
    updatePreview,
    renderMockChartsFor,
    destroyAllCharts,
    saveUsuario,
    usuario
  };

  // ---------- OPTIONAL: Export image of charts area ----------
  // Creates a combined image of miniChartsContainer (simple approach)
  async function exportDashboardImage() {
    // This uses html2canvas-like approach — not included — placeholder
    alert('Export não implementado neste mock (poderia usar html2canvas).');
  }
  window._TECHINT_DEBUG.exportDashboardImage = exportDashboardImage;

  // ---------- OPTIONAL: Add keyboard shortcuts (for dev) ----------
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'r') {
      // ctrl+r redraw
      const currentTitle = previewCard.querySelector('h3').innerText || '';
      const match = currentTitle.match(/^Sistema de Gerenciamento\s*(\S+)?(?:\s*-\s*(.*))?/);
      const setor = match && match[1] ? match[1] : null;
      const disciplina = match && match[2] ? match[2] : null;
      renderMockChartsFor(setor === 'undefined' ? null : setor, disciplina);
    }
  });

  // ---------- END IIFE ----------
})();

/* POINT END - main.js (VERSÃO FINAL EXTENDIDA) */
