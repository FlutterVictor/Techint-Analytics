/* POINT INITIAL - main.js */

/*
  main.js completo e robusto:
  - controla usuário (foto, projeto)
  - toggle/fechar submenus (clicar no mesmo fecha)
  - seleção de disciplina e destaque
  - dashboard inicial (gerencial) quando nada selecionado
  - render de prévias (cards + gráficos) usando Chart.js
  - destruição segura de instâncias Chart.js
  - paleta de azuis (até 3 cores)
  - plugin leve de data-labels (desenha valores nos gráficos)
  - suporte opcional a mini-mapas / modal (Leaflet se carregado)
  - defensivo: verifica existência de elementos antes de operar
*/

(() => {
  'use strict';

  // ---------- Configurações ----------
  const CORES_AZUL = ['#004080', '#0066cc', '#80b3ff'];
  const DEFAULT_CHART_HEIGHT = 140; // altura reduzida conforme pedido
  const MINI_MAP_HEIGHT = 140;

  // ---------- Util (dom safe select) ----------
  function $id(id) { return document.getElementById(id); }
  function qs(sel, root = document) { return root.querySelector(sel); }
  function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

  // ---------- Elementos DOM (checar existência) ----------
  const userPhoto = $id('userPhoto');
  const userName = $id('userName');
  const userProject = $id('userProject');
  const fileInput = $id('fileInput');
  const projectCard = $id('projectCard');
  const confirmBtn = $id('confirmProjectBtn');
  const projectMessage = $id('projectMessage');
  const previewCard = $id('previewCard');
  const miniChartsContainer = $id('miniChartsContainer');
  const accessBtn = $id('accessDashboardBtn');
  const dashboardContainer = $id('dashboardContainer'); // existe no novo HTML

  // If any critical element missing, bail gracefully (avoid runtime errors)
  if (!miniChartsContainer || !previewCard) {
    console.warn('main.js: containers de gráficos não encontrados - verifique IDs no HTML.');
    return;
  }

  // ---------- Dados do usuário ----------
  const defaultUsuario = {
    name: 'José Victor Silva de Jesus',
    photo: 'assets/imagens/logo-por_cuadrado.jpeg',
    projeto: 'PCI Usiminas'
  };
  let usuario = defaultUsuario;
  try {
    const raw = localStorage.getItem('usuario');
    if (raw) usuario = JSON.parse(raw);
    else localStorage.setItem('usuario', JSON.stringify(defaultUsuario));
  } catch (e) {
    usuario = defaultUsuario;
  }

  // ---------- Inicializa UI com dados ----------
  if (userName) userName.innerText = usuario.name || defaultUsuario.name;
  if (userProject) userProject.innerText = usuario.projeto || defaultUsuario.projeto;
  if (userPhoto) userPhoto.style.backgroundImage = `url('${usuario.photo || defaultUsuario.photo}')`;

  // ---------- Helpers ----------
  function saveUsuario() {
    try { localStorage.setItem('usuario', JSON.stringify(usuario)); } catch (e) { /* ignore */ }
  }

  function randomArray(len, max = 100, round = true) {
    const out = [];
    for (let i = 0; i < len; i++) {
      const v = Math.random() * max;
      out.push(round ? Math.round(v) : v);
    }
    return out;
  }

  // Chart instances container (so we can destroy when rerender)
  const ChartRegistry = {
    instances: [],
    push(c) { this.instances.push(c); },
    destroyAll() {
      this.instances.forEach(ch => {
        try { ch.destroy(); } catch (e) { /* ignore */ }
      });
      this.instances = [];
    }
  };

  // ---------- Data label plugin (lightweight) ----------
  const SimpleDataLabel = {
    id: 'simpleDataLabel',
    afterDatasetsDraw(chart) {
      const ctx = chart.ctx;
      chart.data.datasets.forEach((dataset, dsIndex) => {
        const meta = chart.getDatasetMeta(dsIndex);
        if (!meta || !meta.data) return;
        meta.data.forEach((element, index) => {
          const value = dataset.data[index];
          if (value === undefined || value === null) return;
          ctx.save();
          const fontSize = Math.max(10, Math.round((chart.width / 200) * 11));
          ctx.font = `${fontSize}px Arial`;
          ctx.fillStyle = CORES_AZUL[0];
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          let posX = 0, posY = 0;

          // Bar/Point elements: take element.x, element.y
          if (element && typeof element.getCenterPoint === 'function') {
            // polarArea / doughnut slice support
            const p = element.getCenterPoint();
            posX = p.x;
            posY = p.y;
          } else if (element && element.tooltipPosition) {
            const p = element.tooltipPosition();
            posX = p.x;
            posY = p.y - 6;
          } else {
            // fallback to properties
            posX = element.x || (element._model && element._model.x) || 0;
            posY = (element.y || (element._model && element._model.y) || 0) - 6;
          }

          // For doughnut/pie, slightly raise the label towards center
          if (chart.config.type === 'doughnut' || chart.config.type === 'pie') {
            // try to calculate a better position using element.outerRadius / innerRadius if available
            if (element && element._model) {
              posX = element._model.x;
              posY = element._model.y;
            }
            // move up a bit
            posY -= DEFAULT_CHART_HEIGHT * 0.06;
          }

          try { ctx.fillText(String(value), posX, posY); } catch (e) { /* ignore drawing error */ }
          ctx.restore();
        });
      });
    }
  };

  // Register plugin if Chart is available and plugin not already registered
  if (window.Chart && Chart && !Chart.registry.getPlugin('simpleDataLabel')) {
    try { Chart.register(SimpleDataLabel); } catch (e) { /* ignore if fails */ }
  }

  // ---------- Create chart card ----------
  function createChartCard(titleText, opts = {}) {
    const card = document.createElement('div');
    card.className = 'chart-card';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.alignItems = 'stretch';
    card.style.boxSizing = 'border-box';
    // keep sizing compatible with CSS (styles will control most)
    card.style.margin = '6px';

    const title = document.createElement('div');
    title.className = 'chart-card-title';
    title.innerText = titleText || '';
    title.style.color = CORES_AZUL[0];
    title.style.fontWeight = '600';
    title.style.marginBottom = '6px';

    const value = document.createElement('div');
    value.className = 'chart-card-value';
    value.innerText = opts.valueText || '';
    value.style.marginBottom = '8px';
    value.style.color = '#333';

    card.appendChild(title);
    card.appendChild(value);

    // map card special
    if (opts.mapCard) {
      const mapWrap = document.createElement('div');
      mapWrap.style.width = '100%';
      mapWrap.style.height = (opts.height || MINI_MAP_HEIGHT) + 'px';
      mapWrap.style.borderRadius = '8px';
      mapWrap.style.overflow = 'hidden';
      mapWrap.style.background = '#eaf1fb';
      mapWrap.style.cursor = 'pointer';
      const mapTarget = document.createElement('div');
      mapTarget.className = 'mini-map-target';
      mapTarget.style.width = '100%';
      mapTarget.style.height = '100%';
      mapWrap.appendChild(mapTarget);
      mapWrap.addEventListener('click', () => openMapModal(opts.mapTitle || titleText || 'Mapa'));
      card.appendChild(mapWrap);
      return { card, mapMini: mapTarget, title, value };
    }

    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.minHeight = (opts.minHeight || DEFAULT_CHART_HEIGHT) + 'px';
    canvas.style.display = 'block';
    card.appendChild(canvas);

    return { card, canvas, title, value };
  }

  // ---------- Dataset factory (blue palette) ----------
  function datasetWithBluePalette(data, label = '', type = 'bar') {
    if (!Array.isArray(data)) data = [data];
    if (type === 'doughnut' || type === 'pie') {
      const bg = data.map((_, i) => CORES_AZUL[i % CORES_AZUL.length]);
      return { label, data, backgroundColor: bg, borderColor: CORES_AZUL[0], borderWidth: 1 };
    } else if (type === 'bar') {
      const bg = data.map((_, i) => CORES_AZUL[i % CORES_AZUL.length]);
      return { label, data, backgroundColor: bg, borderColor: CORES_AZUL[0], borderWidth: 1 };
    } else { // line, radar...
      return {
        label, data,
        backgroundColor: hexToRgba(CORES_AZUL[1], 0.12),
        borderColor: CORES_AZUL[0],
        borderWidth: 2,
        pointBackgroundColor: CORES_AZUL[1],
        tension: 0.28,
        fill: type === 'line'
      };
    }
  }

  function hexToRgba(hex, a = 1) {
    const h = hex.replace('#', '');
    if (h.length !== 6) return hex;
    const bigint = parseInt(h, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  // ---------- Clear mini charts (preview) ----------
  function clearPreviewCharts() {
    ChartRegistry.destroyAll();
    // clear container children
    while (miniChartsContainer.firstChild) miniChartsContainer.removeChild(miniChartsContainer.firstChild);
  }

  // ---------- Render logic ----------
  // Predefined mocks per setor/disciplina (expandable)
  const MOCKS = {
    gerencial: [
      { id: 'g_avanco', type: 'line', title: 'Avanço da Obra (%)', labels: ['Jan','Fev','Mar','Abr','Mai'], generator: () => randomArray(5, 100) },
      { id: 'g_custo', type: 'bar', title: 'Custo Previsto x Real (R$)', labels: ['Previsto','Realizado'], generator: () => [100000, 95000] },
      { id: 'g_hh', type: 'bar', title: 'HH Previsto x Real', labels: ['Previsto','Realizado'], generator: () => [1200, 1100] },
      { id: 'g_desvio', type: 'doughnut', title: 'Desvio (%)', labels: ['Atraso','Dentro'], generator: () => [20,80] }
    ],
    PYCP: {
      setorPreview: [
        { type: 'line', title: 'STD (Tempo de Produção)', labels:['S1','S2','S3','S4'], generator: ()=> randomArray(4,2,false) },
        { type: 'bar', title: 'HH Consumidos', labels:['A1','A2','A3'], generator: ()=> randomArray(3,30) }
      ],
      Planejamento: [
        { type:'line', title:'Planejamento - Progresso (%)', labels:['W1','W2','W3'], generator: ()=> [60,75,85] },
        { type:'doughnut', title:'Aderência ao Plano', labels:['Aderente','Não Aderente'], generator: ()=> [70,30] }
      ],
      Medição: [{ type:'bar', title:'Medição % Concluída', labels:['Item1','Item2','Item3'], generator: ()=> randomArray(3,100) }],
      Custo: [{ type:'bar', title:'Custo Planejado x Real', labels:['Previsto','Real'], generator: ()=> [50000,48000] }]
    },
    QSMS: {
      setorPreview: [
        { type:'doughnut', title:'Conformidade QSMS', labels:['OK','Not OK'], generator: ()=> [88,12] },
        { type:'bar', title:'Near Miss / Incidentes', labels:['Near Miss','Incidentes'], generator: ()=> [12,3] }
      ],
      Qualidade: [{ type:'line', title:'Índice de Qualidade (%)', labels:['Jan','Fev','Mar'], generator: ()=> [92,90,95] }],
      Segurança: [{ type:'bar', title:'Incidentes por Mês', labels:['Jan','Fev','Mar'], generator: ()=> randomArray(3,10) }]
    },
    Producao: {
      setorPreview: [
        { type:'line', title:'Produção Geral (%)', labels:['A1','A2','A3','A4'], generator: ()=> randomArray(4,100) },
        { type:'bar', title:'HH por Disciplina', labels:['Elétrica','Mecânica','Solda'], generator: ()=> randomArray(3,200) }
      ],
      Eletrica:[{type:'line', title:'Elétrica (%)', labels:['A1','A2','A3'], generator: ()=> randomArray(3,100)}],
      Mecânica:[{type:'line', title:'Mecânica (%)', labels:['D1','D2','D3'], generator: ()=> randomArray(3,100)}]
    },
    Diaf: {
      setorPreview: [
        { type:'doughnut', title:'Efetivo / Vagas', labels:['Ativos','Vagas'], generator: ()=> [720, 45] },
        { type:'bar', title:'Custos Financeiros', labels:['Previsto','Real'], generator: ()=> [50000,48000] }
      ],
      'Recursos Humanos':[{type:'line', title:'Efetivo (%)', labels:['Jan','Fev'], generator: ()=> [90,95]}],
      Financeiro:[{type:'bar', title:'Financeiro (R$)', labels:['Previsto','Real'], generator: ()=> [50000,48000]}]
    }
  };

  // ---------- Render small preview charts ----------
  function renderPreview(setor = null, disciplina = null) {
    clearPreviewCharts();

    let items = [];
    if (!setor) {
      items = MOCKS.gerencial.slice(0,3); // show first 3 on gerencial preview
    } else {
      const block = MOCKS[setor];
      if (!block) {
        items = MOCKS.gerencial.slice(0,3);
      } else {
        items = disciplina ? (block[disciplina] || []) : (block.setorPreview || []);
      }
    }

    if (!items || items.length === 0) {
      items = [{ type:'line', title:'Indicador', labels:['A','B','C'], generator: ()=> randomArray(3,100) }];
    }

    // Append cards to preview container
    items.forEach((cfg, idx) => {
      // Create card
      const { card, canvas, title, value } = createChartCard(cfg.title || `Gráfico ${idx+1}`);
      miniChartsContainer.appendChild(card);

      // compute data
      const data = (typeof cfg.generator === 'function') ? cfg.generator() : (cfg.data || randomArray(cfg.labels ? cfg.labels.length : 5, 100));
      // summary value
      if (cfg.type === 'doughnut' || cfg.type === 'pie') {
        value.innerText = String(data.reduce((a,b)=>a+b,0));
      } else {
        value.innerText = data.length ? String(data[data.length-1]) : '';
      }

      // create chart if canvas exists
      if (canvas && window.Chart) {
        const ctx = canvas.getContext('2d');
        const ds = [ datasetWithBluePalette(data, cfg.title || 'Série', cfg.type) ];
        const config = {
          type: cfg.type || 'line',
          data: { labels: cfg.labels || data.map((_,i)=>`P${i+1}`), datasets: ds },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: cfg.type !== 'line' } },
            scales: (cfg.type === 'doughnut' || cfg.type === 'pie') ? {} : { x: { display: true }, y: { display: true } }
          },
          plugins: []
        };
        // register data label plugin if available
        try {
          const chart = new Chart(ctx, config);
          ChartRegistry.push(chart);
        } catch (e) {
          console.error('Erro ao criar Chart.js (preview):', e);
        }
      }
    });
  }

  // ---------- Render main dashboard (bigger area) ----------
  function renderDashboard(setor = null, disciplina = null) {
    // Clear dashboardContainer DOM
    if (!dashboardContainer) return;
    while (dashboardContainer.firstChild) dashboardContainer.removeChild(dashboardContainer.firstChild);

    // For gerencial (home) show 6 cards (example)
    let items = [];
    if (!setor) {
      items = [
        { type:'line', title:'Avanço da Obra (%)', labels:['Jan','Fev','Mar','Abr','Mai'], generator: ()=> randomArray(5,100) },
        { type:'bar', title:'Custo Previsto x Real', labels:['Previsto','Real'], generator: ()=> [120000,110000] },
        { type:'doughnut', title:'Desvio (%)', labels:['Atraso','Dentro'], generator: ()=> [22,78] },
        { type:'bar', title:'HH Consumo Mensal', labels:['M1','M2','M3','M4'], generator: ()=> randomArray(4,200) },
        { type:'line', title:'Produtividade (%)', labels:['S1','S2','S3','S4'], generator: ()=> randomArray(4,100) },
        { type:'map', title:'Mapa de Efetividade (Mini)', map: true }
      ];
    } else {
      // If sector provided, use preset or fallback
      const block = MOCKS[setor];
      if (block && block.setorPreview) items = block.setorPreview.slice();
      else items = [{ type:'line', title:`Indicadores ${setor}`, labels:['A','B','C'], generator: ()=> randomArray(3,100) }];
      // ensure map present for producao and gerencial as requested
      if (setor === 'Producao') items.push({ type:'map', title:'Mapa Produção', map: true });
    }

    items.forEach((cfg, idx) => {
      if (cfg.map) {
        const { card, mapMini, title, value } = createChartCard(cfg.title || 'Mapa', { mapCard: true, height: MINI_MAP_HEIGHT, mapTitle: cfg.title });
        dashboardContainer.appendChild(card);
        // init mini map after small delay if leaflet is available
        setTimeout(()=> initMiniMap(mapMini), 80);
        return;
      }

      const { card, canvas, title, value } = createChartCard(cfg.title || `Gráfico ${idx+1}`, { minHeight: DEFAULT_CHART_HEIGHT });
      dashboardContainer.appendChild(card);

      const data = (typeof cfg.generator === 'function') ? cfg.generator() : (cfg.data || randomArray(cfg.labels ? cfg.labels.length : 5, 100));
      if (cfg.type === 'doughnut' || cfg.type === 'pie') value.innerText = String(data.reduce((a,b)=>a+b,0));
      else value.innerText = data.length ? String(data[data.length-1]) : '';

      if (canvas && window.Chart) {
        const ctx = canvas.getContext('2d');
        const ds = [ datasetWithBluePalette(data, cfg.title || 'Série', cfg.type) ];
        const cfgChart = {
          type: cfg.type || 'line',
          data: { labels: cfg.labels || data.map((_,i)=>`P${i+1}`), datasets: ds },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: cfg.type !== 'line' } },
            scales: (cfg.type === 'doughnut' || cfg.type === 'pie') ? {} : { x: { display: true }, y: { display: true } }
          }
        };
        try {
          const chart = new Chart(ctx, cfgChart);
          ChartRegistry.push(chart);
        } catch (err) { console.error('Erro Chart (dashboard):', err); }
      }
    });
  }

  // ---------- Mini-map (Leaflet) initialization ----------
  const HEAT_POINTS = [
    { lat: -19.48366303752505, lng: -42.52828474324588 },
    { lat: -19.48118578375113, lng: -42.54286877621104 }
  ];

  function initMiniMap(targetDiv) {
    if (!targetDiv) return;
    // if Leaflet not available, fallback
    if (typeof L === 'undefined') {
      targetDiv.innerHTML = `<div style="padding:8px;color:${CORES_AZUL[0]};font-size:0.95rem">Mini-mapa (Leaflet não carregado)</div>`;
      return;
    }
    // Give unique id
    if (!targetDiv.id) targetDiv.id = 'mini_map_' + Math.random().toString(36).slice(2,8);
    try {
      const m = L.map(targetDiv.id, { attributionControl:false, zoomControl:false, dragging:false }).setView([HEAT_POINTS[0].lat, HEAT_POINTS[0].lng], 14);
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom:19 }).addTo(m);
      HEAT_POINTS.forEach(p => {
        L.circle([p.lat,p.lng], { radius: 200, color: '#ff3333', fillColor:'#ff3333', fillOpacity:0.12, weight:0 }).addTo(m);
      });
      // store map reference on element for cleanup later
      targetDiv._miniMap = m;
    } catch (e) {
      targetDiv.innerHTML = `<div style="padding:8px;color:#333">Erro mini-mapa</div>`;
    }
  }

  // ---------- Map modal (opens a larger Leaflet map) ----------
  let mapModalEl = null;
  let mapInstance = null;
  function openMapModal(title = 'Mapa') {
    // create modal only once
    if (!mapModalEl) {
      mapModalEl = document.createElement('div');
      mapModalEl.style.position = 'fixed';
      mapModalEl.style.left = 0; mapModalEl.style.top = 0; mapModalEl.style.right = 0; mapModalEl.style.bottom = 0;
      mapModalEl.style.background = 'rgba(0,0,0,0.6)';
      mapModalEl.style.display = 'flex';
      mapModalEl.style.alignItems = 'center';
      mapModalEl.style.justifyContent = 'center';
      mapModalEl.style.zIndex = 9999;

      const inner = document.createElement('div');
      inner.style.width = '85%';
      inner.style.maxWidth = '1200px';
      inner.style.height = '80%';
      inner.style.background = '#fff';
      inner.style.borderRadius = '8px';
      inner.style.overflow = 'hidden';
      inner.style.display = 'flex';
      inner.style.flexDirection = 'column';

      const header = document.createElement('div');
      header.style.padding = '12px 16px';
      header.style.display = 'flex';
      header.style.justifyContent = 'space-between';
      header.style.alignItems = 'center';
      header.style.borderBottom = '1px solid #eee';
      const hTitle = document.createElement('div'); hTitle.innerText = title; hTitle.style.fontWeight = '700'; hTitle.style.color = CORES_AZUL[0];
      const btnClose = document.createElement('button'); btnClose.innerText = 'Fechar'; btnClose.style.cursor = 'pointer';
      btnClose.addEventListener('click', closeMapModal);
      header.appendChild(hTitle); header.appendChild(btnClose);

      const holder = document.createElement('div'); holder.style.flex = '1'; holder.id = 'modalMapHolder';

      inner.appendChild(header); inner.appendChild(holder);
      mapModalEl.appendChild(inner);
      document.body.appendChild(mapModalEl);

      // close on backdrop click
      mapModalEl.addEventListener('click', (e) => { if (e.target === mapModalEl) closeMapModal(); });
    } else {
      // update title if present
      const titleEl = mapModalEl.querySelector('div > div');
      if (titleEl) titleEl.innerText = title;
      mapModalEl.style.display = 'flex';
    }

    // init map inside modal holder (after appended to DOM)
    setTimeout(() => initModalMap('modalMapHolder'), 120);
  }

  function initModalMap(holderId) {
    const holder = document.getElementById(holderId);
    if (!holder) return;
    holder.innerHTML = '';
    if (typeof L === 'undefined') {
      holder.innerHTML = `<div style="padding:20px;color:#333">Leaflet não carregado. Adicione Leaflet para mapa interativo.</div>`;
      return;
    }
    const mapDiv = document.createElement('div');
    mapDiv.style.width = '100%';
    mapDiv.style.height = '100%';
    holder.appendChild(mapDiv);
    try {
      if (mapInstance) { mapInstance.remove(); mapInstance = null; }
      mapInstance = L.map(mapDiv).setView([HEAT_POINTS[0].lat, HEAT_POINTS[0].lng], 14);
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19 }).addTo(mapInstance);
      HEAT_POINTS.forEach(p => L.circle([p.lat,p.lng], { radius: 250, color:'#ff3333', fillColor:'#ff3333', fillOpacity:0.12 }).addTo(mapInstance));
      const latlngs = HEAT_POINTS.map(p => [p.lat,p.lng]);
      if (latlngs.length) mapInstance.fitBounds(latlngs, { padding: [40,40] });
    } catch (e) {
      holder.innerHTML = `<div style="padding:20px;color:#333">Erro ao carregar mapa.</div>`;
    }
  }

  function closeMapModal() {
    if (mapModalEl) mapModalEl.style.display = 'none';
    try { if (mapInstance) { mapInstance.remove(); mapInstance = null; } } catch(e){}
  }

  // ---------- Update preview (title/desc + render preview charts) ----------
  function updatePreview(setor = null, disciplina = null) {
    // title + description
    const titleEl = previewCard ? qs('h3', previewCard) : null;
    const descEl = previewCard ? qs('p', previewCard) : null;

    let title = `Sistema de Gerenciamento ${setor || ''}`;
    let desc = '';

    if (disciplina) {
      title += ` - ${disciplina}`;
      desc = `Prévia da disciplina ${disciplina} do setor ${setor}.`;
      if (accessBtn) { accessBtn.style.display = 'inline-block'; accessBtn.innerText = `Acessar ${disciplina}`; }
    } else {
      if (accessBtn) accessBtn.style.display = 'none';
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

    // render previews & main dashboard
    renderPreview(setor, disciplina);
    renderDashboard(setor, disciplina);
  }

  // ---------- Menu controls (toggle submenus) ----------
  // Use event delegation for robustness (sidebar may have many items)
  const sidebar = qs('.sidebar');
  if (sidebar) {
    sidebar.addEventListener('click', (e) => {
      const item = e.target.closest('.dashboard-item');
      if (!item) return;
      const submenu = item.querySelector('.sub-menu');
      const currentlyOpen = submenu && submenu.style.display === 'flex';

      // close others
      qsa('.dashboard-item', sidebar).forEach(it => {
        const sm = it.querySelector('.sub-menu');
        if (sm && sm !== submenu) sm.style.display = 'none';
        it.classList.remove('active');
      });

      if (submenu) {
        submenu.style.display = currentlyOpen ? 'none' : 'flex';
        if (!currentlyOpen) item.classList.add('active');
      } else {
        // no submenu: simply mark active
        item.classList.add('active');
      }

      const setor = item.dataset.setor;
      updatePreview(setor, null);
    });
  }

  // Bind disciplina clicks (delegation inside sidebar)
  if (sidebar) {
    sidebar.addEventListener('click', (e) => {
      const disc = e.target.closest('.disciplina-item');
      if (!disc) return;
      e.stopPropagation();
      // remove active from all
      qsa('.disciplina-item', sidebar).forEach(d => d.classList.remove('active'));
      disc.classList.add('active');

      const parent = disc.closest('.dashboard-item');
      const setor = parent ? parent.dataset.setor : null;
      const disciplina = disc.dataset.disciplina;
      updatePreview(setor, disciplina);
    });
  }

  // ---------- File upload / project card ----------

  if (userPhoto && fileInput) {
    userPhoto.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        userPhoto.style.backgroundImage = `url('${reader.result}')`;
        usuario.photo = reader.result;
        saveUsuario();
      };
      reader.readAsDataURL(file);
    });
  }

  if (userProject && projectCard) {
    // toggle project card display on click
    userProject.addEventListener('click', (e) => {
      const isShown = projectCard.style.display === 'block' || projectCard.classList.contains('show');
      if (isShown) {
        projectCard.style.display = 'none';
        projectCard.classList.remove('show');
      } else {
        projectCard.style.display = 'block';
        projectCard.classList.add('show');
      }
      e.stopPropagation();
    });

    // close projectCard on outside click
    document.addEventListener('click', (e) => {
      if (!projectCard) return;
      if ((projectCard.style.display === 'block' || projectCard.classList.contains('show')) && !projectCard.contains(e.target) && e.target !== userProject) {
        projectCard.style.display = 'none';
        projectCard.classList.remove('show');
        projectMessage.innerHTML = '';
      }
    });
    // close with ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (projectCard) { projectCard.style.display = 'none'; projectCard.classList.remove('show'); projectMessage.innerHTML = ''; }
      }
    });
  }

  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      const selected = document.querySelector('input[name="projeto"]:checked');
      if (!selected) { alert('Selecione um projeto'); return; }
      const val = selected.value;
      if (projectMessage) projectMessage.innerHTML = '<span class="spinner"></span> Atualizando...';
      setTimeout(() => {
        const allowed = ['PCI Usiminas','MOA Usiminas'];
        if (allowed.includes(val)) {
          usuario.projeto = val;
          if (userProject) userProject.innerText = val;
          if (projectMessage) projectMessage.innerHTML = '<span style="color:green">✔ Projeto atualizado!</span>';
          if (projectCard) { projectCard.style.display = 'none'; projectCard.classList.remove('show'); }
          saveUsuario();
        } else {
          if (projectMessage) projectMessage.innerHTML = 'Acesso restrito <span class="error-icon">✖</span>';
        }
      }, 700);
    });
  }

  // ---------- Logout ----------
  window.logout = function () {
    try { localStorage.removeItem('usuario'); } catch (e) {}
    // redirect or show feedback
    if (location) location.href = 'index.html';
  };

  // ---------- Initialize on load ----------
  // Render initial preview and dashboard
  updatePreview(null, null);

  // Expose some internals for debug (optional)
  window._dashboardAPI = {
    updatePreview,
    renderPreview,
    renderDashboard,
    clearPreviewCharts,
    ChartRegistry
  };

})();
/* POINT END - main.js */
