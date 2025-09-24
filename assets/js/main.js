/* POINT INITIAL - main.js */
/*
  main.js completo - mantive estrutura e funções:
  - menu lateral (toggle/fechar), seleção de disciplina
  - usuário (foto, projeto, logout)
  - preview-card dinâmico com charts (Chart.js)
  - plugin simples para rótulos de dados
  - mini-mapas por card + modal Leaflet (fallback se não carregado)
  - destruição segura de charts / limpeza de mini-mapas
  - paleta em tons de azul (até 3 cores)
*/

(() => {
  // ---------- CONFIGURAÇÕES ----------
  const CORES_AZUL = ['#004080', '#0066cc', '#80b3ff'];
  const DEFAULT_CHART_HEIGHT = 140; // px (altura reduzida)
  const MINI_MAP_HEIGHT = 140; // px

  // Coordenadas solicitadas
  const HEAT_POINTS = [
    { lat: -19.48366303752505, lng: -42.52828474324588, value: 1 },
    { lat: -19.48118578375113, lng: -42.54286877621104, value: 1 }
  ];

  // ---------- ESTADO / DADOS ----------
  const usuario = JSON.parse(localStorage.getItem('usuario')) || {
    name: 'José Victor Silva de Jesus',
    photo: 'assets/imagens/logo-por_cuadrado.jpeg',
    projeto: 'PCI Usiminas'
  };

  // ---------- ELEMENTOS DOM ----------
  const previewCard = document.getElementById('previewCard');
  const miniChartsContainer = document.getElementById('miniChartsContainer');
  const accessBtn = document.getElementById('accessDashboardBtn');

  const userPhoto = document.getElementById('userPhoto');
  const userName = document.getElementById('userName');
  const userProject = document.getElementById('userProject');
  const fileInput = document.getElementById('fileInput');
  const projectCard = document.getElementById('projectCard');
  const confirmBtn = document.getElementById('confirmProjectBtn');
  const projectMessage = document.getElementById('projectMessage');

  let currentSetor = null;
  let currentDisciplina = null;
  let chartInstances = [];
  // guard mini-mapas criados no container para cleanup
  const miniMaps = [];

  // Modal mapa
  let mapModal = null;
  let modalMapInstance = null;
  let modalHeatLayer = null;

  // ---------- INICIALIZAÇÃO UI ----------
  function initUI() {
    userName.innerText = usuario.name;
    userProject.innerText = usuario.projeto;
    userPhoto.style.backgroundImage = `url('${usuario.photo}')`;
  }
  initUI();

  // ---------- HELPERS ----------
  function saveUsuario() {
    localStorage.setItem('usuario', JSON.stringify(usuario));
  }

  function randomArray(length, max = 100, round = true) {
    const a = [];
    for (let i = 0; i < length; i++) {
      const v = Math.random() * max;
      a.push(round ? Math.round(v) : v);
    }
    return a;
  }

  function formatCurrency(v) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  }

  function hexToRgba(hex, alpha = 1) {
    const h = hex.replace('#','');
    const bigint = parseInt(h,16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r},${g},${b},${alpha})`;
  }

  // destrói todos os Charts e limpa mini-mapas
  function clearAllPreviews() {
    // destruir charts
    (chartInstances || []).forEach(c => {
      try { c.destroy(); } catch(e){/*ignore*/ }
    });
    chartInstances = [];
    // limpar DOM
    miniChartsContainer.innerHTML = '';
    // limpar mini-mapas criados
    miniMaps.forEach(m => {
      try { if (m._mapInstance) { m._mapInstance.remove(); } } catch(e){/*ignore*/ }
      // remove element content
      if (m.el) m.el.innerHTML = '';
    });
    miniMaps.length = 0;
    // reset layout classes
    miniChartsContainer.classList.remove('one-per-row','two-per-row','three-per-row');
  }

  // Guarda instância
  function pushChart(chart) { chartInstances.push(chart); }

  // ---------- Chart.js DataLabel plugin (simples) ----------
  const SimpleDataLabel = {
    id: 'simpleDataLabel',
    afterDatasetsDraw(chart, args, options) {
      const ctx = chart.ctx;
      chart.data.datasets.forEach((dataset, dsIndex) => {
        const meta = chart.getDatasetMeta(dsIndex);
        if (!meta || !meta.data) return;
        meta.data.forEach((element, index) => {
          ctx.save();
          ctx.font = '11px Arial';
          ctx.fillStyle = CORES_AZUL[0];
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          let posX = null, posY = null;
          try {
            if (element.tooltipPosition) {
              const p = element.tooltipPosition();
              posX = p.x;
              posY = p.y - 6;
            } else if (element.getCenter) {
              const c = element.getCenter(); // arcs in doughnut
              posX = c.x;
              posY = c.y;
            } else {
              posX = element.x || (element._model && element._model.x) || 0;
              posY = (element.y || (element._model && element._model.y)) - 6;
            }

            // for doughnut/pie, move label slightly up
            if (chart.config.type === 'doughnut' || chart.config.type === 'pie') {
              // try to place inside slice by moving toward center
              if (element._model && element._model.x && element._model.y) {
                posX = element._model.x;
                posY = element._model.y;
              }
            }

            const value = dataset.data[index];
            if (value !== undefined && value !== null && value !== '') {
              ctx.fillText(String(value), posX, posY);
            }
          } catch (e) {
            // ignore if positioning fails
          }
          ctx.restore();
        });
      });
    }
  };

  // register plugin if Chart available and not registered
  if (window.Chart && (!Chart.registry || !Chart.registry.getPlugin('simpleDataLabel'))) {
    try { Chart.register(SimpleDataLabel); } catch(e){/*ignore*/ }
  }

  // ---------- Criação de card (chart ou map mini) ----------
  function createChartCard(titleText, opts = {}) {
    // opts: { mapCard: boolean, valueText: string, wide: boolean }
    const card = document.createElement('div');
    card.className = 'chart-card';
    // Flex sizing kept to CSS but ensure min-height for cards
    card.style.boxSizing = 'border-box';

    const title = document.createElement('div');
    title.className = 'chart-card-title';
    title.innerText = titleText;
    title.style.color = CORES_AZUL[0];

    const value = document.createElement('div');
    value.className = 'chart-card-value';
    value.innerText = opts.valueText || '';

    card.appendChild(title);
    card.appendChild(value);

    if (opts.mapCard) {
      const mapWrap = document.createElement('div');
      mapWrap.className = 'mini-map-wrap';
      Object.assign(mapWrap.style, { width:'100%', height: MINI_MAP_HEIGHT + 'px', borderRadius:'8px', overflow:'hidden', background:'#e9eef6', cursor:'pointer' });
      const target = document.createElement('div');
      target.className = 'mini-map-target';
      target.style.width = '100%';
      target.style.height = '100%';
      mapWrap.appendChild(target);
      card.appendChild(mapWrap);

      // click abre modal
      mapWrap.addEventListener('click', () => openMapModal(currentSetor || 'Gerencial', titleText));

      // keep reference for init
      miniMaps.push({ el: target, _mapInstance: null });
      return { card, mapMini: target, title, value };
    } else {
      const canvas = document.createElement('canvas');
      // controle de altura: se wide, deixar maior
      canvas.style.width = '100%';
      canvas.style.minHeight = DEFAULT_CHART_HEIGHT + 'px';
      canvas.style.display = 'block';
      card.appendChild(canvas);
      return { card, canvas, title, value };
    }
  }

  // ---------- Dataset helper (paleta azul 1-3 cores) ----------
  function datasetWithBluePalette(data, label, type) {
    if (type === 'doughnut' || type === 'pie') {
      const bg = data.map((_,i) => CORES_AZUL[i % CORES_AZUL.length]);
      return { label, data, backgroundColor: bg, borderColor: '#ffffff', borderWidth: 1 };
    } else if (type === 'bar') {
      const bg = data.map((_,i) => CORES_AZUL[i % CORES_AZUL.length]);
      return { label, data, backgroundColor: bg, borderColor: CORES_AZUL[0], borderWidth:1 };
    } else if (type === 'horizontalBar') {
      const bg = data.map((_,i) => CORES_AZUL[i % CORES_AZUL.length]);
      return { label, data, backgroundColor: bg, borderColor: CORES_AZUL[0] };
    } else {
      // line/scatter etc
      return {
        label,
        data,
        backgroundColor: hexToRgba(CORES_AZUL[1], 0.12),
        borderColor: CORES_AZUL[0],
        pointBackgroundColor: CORES_AZUL[1],
        borderWidth: 2,
        tension: 0.25,
        fill: type === 'line'
      };
    }
  }

  // ---------- MOCKS / CONFIGS por setor e disciplina ----------
  const MOCKS = {
    gerencial: [
      { id:'g_av', type:'line', title:'Avanço da Obra (%)', labels:['Jan','Fev','Mar','Abr','Mai'], generator: ()=> randomArray(5,100) },
      { id:'g_custo', type:'bar', title:'Custo Previsto x Real (R$)', labels:['Prev','Real'], generator: ()=> [120000, 115000], format: 'currency' },
      { id:'g_hh', type:'bar', title:'HH Previsto x Real', labels:['Prev','Real'], generator: ()=> [1500,1400] },
      { id:'g_desvio', type:'doughnut', title:'Desvio (%)', labels:['Dentro','Fora'], generator: ()=> [78,22] },
      { id:'g_mini_map', type:'map', title:'Mapa Efetividade (mini)', map:true }
    ],
    PYCP: {
      setorPreview: [
        { type:'line', title:'STD (Tempo de Produção)', labels:['S1','S2','S3','S4'], generator: ()=> randomArray(4,2,false) },
        { type:'bar', title:'HH Consumidos', labels:['A1','A2','A3'], generator: ()=> randomArray(3,60) }
      ],
      Planejamento: [
        { type:'line', title:'Planejamento - Progresso (%)', labels:['W1','W2','W3'], generator: ()=> [60,75,85] },
        { type:'doughnut', title:'Aderência ao Plano', labels:['Aderente','Não Aderente'], generator: ()=> [70,30] }
      ],
      'Medição': [
        { type:'bar', title:'Medição % Concluída', labels:['Item1','Item2','Item3'], generator: ()=> randomArray(3,100) }
      ],
      'Custo': [
        { type:'bar', title:'Custo Planejado x Real (R$)', labels:['Previsto','Real'], generator: ()=> [50000,48000], format:'currency' },
        { type:'line', title:'Tendência de Custo', labels:['M1','M2','M3','M4'], generator: ()=> randomArray(4,60000), format:'currency'}
      ]
    },
    QSMS: {
      setorPreview: [
        { type:'doughnut', title:'Conformidade QSMS', labels:['OK','Not OK'], generator: ()=> [88,12] },
        { type:'bar', title:'Near Miss / Incidentes', labels:['Near Miss','Incidentes'], generator: ()=> [12,3] }
      ],
      'Qualidade': [{ type:'line', title:'Índice de Qualidade (%)', labels:['Jan','Fev','Mar'], generator: ()=> [92,90,95] }],
      'Segurança': [{ type:'bar', title:'Incidentes por Mês', labels:['Jan','Fev','Mar'], generator: ()=> randomArray(3,10) }],
      'Meio Ambiente e Saúde': [{ type:'doughnut', title:'Indicadores Ambientais', labels:['Ok','Alerta'], generator: ()=> [85,15] }]
    },
    'Produção': {
      setorPreview: [
        { type:'line', title:'Produção Geral (%)', labels:['A1','A2','A3','A4'], generator: ()=> randomArray(4,100) },
        { type:'bar', title:'HH por Disciplina', labels:['Elétrica','Mecânica','Solda'], generator: ()=> randomArray(3,200) },
        { id:'p_map', type:'map', title:'Mapa Efetividade (mini)', map:true }
      ],
      'Elétrica': [{ type:'line', title:'Elétrica (%)', labels:['A1','A2','A3'], generator: ()=> randomArray(3,100) }],
      'Mecânica': [{ type:'line', title:'Mecânica (%)', labels:['D1','D2','D3'], generator: ()=> randomArray(3,100) }],
      'Solda': [{ type:'bar', title:'Solda - Inspecionadas x Aprovadas', labels:['Inspecionadas','Aprovadas'], generator: ()=> [30,28] }],
      'Pintura': [{ type:'bar', title:'Pintura (m²)', labels:['Previsto','Realizado'], generator: ()=> [1000,900] }],
      'Isolamento': [{ type:'doughnut', title:'Isolamento Térmico (%)', labels:['Concluído','Pendente'], generator: ()=> [75,25] }],
      'Movimentação de Carga': [{ type:'bar', title:'Mov. Carga (movs)', labels:['Previsto','Real'], generator: ()=> [50,45] }],
      'Instrumentação': [{ type:'line', title:'Instrumentação (%)', labels:['T1','T2','T3'], generator: ()=> randomArray(3,100) }],
      'Estruturas': [{ type:'line', title:'Estruturas (%)', labels:['S1','S2','S3'], generator: ()=> randomArray(3,100) }]
    },
    'Diaf': {
      setorPreview: [
        { type:'doughnut', title:'Efetivo / Vagas', labels:['Ativos','Vagas'], generator: ()=> [720,45] },
        { type:'bar', title:'Custos Financeiros', labels:['Previsto','Real'], generator: ()=> [50000,48000], format:'currency' }
      ],
      'Recursos Humanos': [{ type:'line', title:'Efetivo (%)', labels:['Jan','Fev'], generator: ()=> [90,95] }],
      'Financeiro': [{ type:'bar', title:'Financeiro (R$)', labels:['Previsto','Real'], generator: ()=> [50000,48000], format:'currency' }],
      'Contratual': [{ type:'doughnut', title:'Contratual', labels:['Em dia','Atraso'], generator: ()=> [80,20] }]
    }
  };

  // ---------- RENDERIZAÇÃO DE PRÉVIA (cartões + gráficos) ----------
  function renderPreview(setor = null, disciplina = null) {
    // Atualiza título/descrição
    const titleEl = previewCard.querySelector('h3');
    const descEl = previewCard.querySelector('p');

    let title = `Sistema de Gerenciamento ${setor ? setor : ''}`.trim();
    let desc = '';

    if (disciplina) {
      title += ` - ${disciplina}`;
      desc = `Prévia da disciplina ${disciplina} do setor ${setor}.`;
      accessBtn.style.display = 'inline-block';
      accessBtn.innerText = `Acessar ${disciplina}`;
    } else {
      accessBtn.style.display = 'none';
      switch (setor) {
        case 'PYCP': desc='Planejamento, Medição e Custo'; break;
        case 'QSMS': desc='Qualidade, Segurança, Meio Ambiente e Saúde'; break;
        case 'Produção': desc='Elétrica, Andaime, Mecânica, Solda, Estruturas, Pintura, Isolamento, Movimentação e Instrumentação'; break;
        case 'Diaf': desc='Recursos Humanos, Financeiro e Contratual'; break;
        default: desc='Dashboard Gerencial: Avanço de obras, custo previsto x real, HH previsto x real, desvio e indicadores gerais.'; break;
      }
    }

    if (titleEl) titleEl.innerText = title;
    if (descEl) descEl.innerText = desc;

    // render charts/cards
    renderCardsFor(setor, disciplina);
  }

  function renderCardsFor(setor, disciplina) {
    clearAllPreviews();

    let items = [];
    if (!setor) items = MOCKS.gerencial;
    else {
      const block = MOCKS[setor];
      if (!block) items = MOCKS.gerencial;
      else items = disciplina ? (block[disciplina] || []) : (block.setorPreview || []);
    }

    if (!items || items.length === 0) {
      items = [{ type:'line', title:'Indicador', labels:['A','B','C'], generator: ()=> randomArray(3,100) }];
    }

    // decide classe de layout com base na quantidade (controla quantos por linha)
    if (items.length === 1) miniChartsContainer.classList.add('one-per-row');
    else if (items.length === 2) miniChartsContainer.classList.add('two-per-row');
    else miniChartsContainer.classList.add('three-per-row');

    items.forEach((cfg, idx) => {
      // MAP card (mini)
      if (cfg.map) {
        const { card, mapMini, title, value } = createChartCard(cfg.title || `Mapa ${idx+1}`, { mapCard:true });
        miniChartsContainer.appendChild(card);
        // init mini map delayed to allow DOM attach
        setTimeout(()=> {
          try { initMiniMap(mapMini); } catch(e){ console.warn('mini map init error', e); }
        }, 60);
        return;
      }

      // normal chart card
      const { card, canvas, title, value } = createChartCard(cfg.title || `Gráfico ${idx+1}`);
      miniChartsContainer.appendChild(card);

      // gerar dados
      const dataValues = (typeof cfg.generator === 'function') ? cfg.generator() : (cfg.data || randomArray(cfg.labels ? cfg.labels.length : 5, 100));
      // pre-formatar o valor exibido no card
      if (cfg.type === 'doughnut' || cfg.type === 'pie') {
        const total = Array.isArray(dataValues) ? dataValues.reduce((a,b)=>a+b,0) : dataValues;
        value.innerText = (cfg.format === 'currency') ? formatCurrency(total) : String(total);
      } else if (cfg.type === 'bar' && cfg.labels && cfg.labels.length === 2 && cfg.format === 'currency') {
        // ex: Prev x Real
        value.innerText = (dataValues && dataValues[1]) ? formatCurrency(dataValues[1]) : '';
      } else if (Array.isArray(dataValues)) {
        value.innerText = dataValues.length ? String(dataValues[dataValues.length-1]) : '';
      }

      // datasets
      const ds = [ datasetWithBluePalette(Array.isArray(dataValues) ? dataValues : [dataValues], cfg.title || 'Série', cfg.type) ];

      // Chart config
      const cfgChart = {
        type: cfg.type === 'horizontalBar' ? 'bar' : (cfg.type || 'line'),
        data: {
          labels: cfg.labels || (Array.isArray(dataValues) ? dataValues.map((_,i)=>`P${i+1}`) : ['Valor']),
          datasets: ds
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: cfg.type !== 'line' },
          },
          scales: (cfg.type === 'doughnut' || cfg.type === 'pie' || cfg.type === 'radar') ? {} : {
            x: { display: true },
            y: { display: true }
          },
        }
      };

      // special for horizontal bars
      if (cfg.type === 'horizontalBar') {
        cfgChart.options.indexAxis = 'y';
      }

      // attach plugin for simple labels (registered globally)
      try {
        if (typeof Chart !== 'undefined') {
          const chart = new Chart(canvas.getContext('2d'), cfgChart);
          pushChart(chart);
        } else {
          // fallback: show textual representation
          canvas.parentElement.innerHTML = `<div style="padding:16px;color:#444">Chart.js não carregado. Exiba gráfico com dados: ${JSON.stringify(ds[0].data)}</div>`;
        }
      } catch (err) {
        console.error('Erro ao criar chart', err);
        canvas.parentElement.innerHTML = `<div style="padding:12px;color:#c00">Erro ao gerar gráfico</div>`;
      }
    });
  }

  // ---------- MINI MAP (card) ----------

  function initMiniMap(targetDiv) {
    // targetDiv é a div onde colocaremos mini mapa. Se Leaflet estiver presente, usa; senão fallback
    if (!targetDiv) return;
    // se já inicializado neste elemento, retorne
    if (targetDiv._mapInitialized) return;

    if (typeof L !== 'undefined') {
      try {
        // garantir id
        if (!targetDiv.id) targetDiv.id = 'mini-map-' + Math.random().toString(36).slice(2,8);
        // inic map
        const m = L.map(targetDiv.id, { attributionControl:false, zoomControl:false, dragging:false, scrollWheelZoom:false, doubleClickZoom:false }).setView([HEAT_POINTS[0].lat, HEAT_POINTS[0].lng], 14);
        // satélite tile (Esri) ou fallback OSM
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom:19 }).addTo(m);

        // add semi-translucent circles for heat
        HEAT_POINTS.forEach(p => {
          L.circle([p.lat, p.lng], { radius:200, color:'#ff3333', fillColor:'#ff3333', fillOpacity:0.16, weight:0 }).addTo(m);
        });

        // add a small marker
        HEAT_POINTS.forEach(p => {
          L.circleMarker([p.lat, p.lng], { radius:3, fillColor:'#fff', color:CORES_AZUL[0], fillOpacity:1 }).addTo(m);
        });

        // store on element for cleanup
        targetDiv._mapInitialized = true;
        targetDiv._mapInstance = m;
        miniMaps.push({ el: targetDiv, _mapInstance: m });
      } catch (e) {
        targetDiv.innerHTML = `<div style="padding:8px;color:${CORES_AZUL[0]}">Mini-mapa não pôde ser inicializado</div>`;
      }
    } else {
      // fallback visual
      targetDiv.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:${CORES_AZUL[0]};">Mini-mapa (Leaflet não carregado)</div>`;
    }
  }

  // ---------- MAP MODAL (maior) ----------
  function openMapModal(setorContext = 'Gerencial', titleText = 'Mapa') {
    // cria/modal se não existe
    if (!mapModal) {
      mapModal = document.createElement('div');
      mapModal.id = 'mapModal';
      Object.assign(mapModal.style, {
        position:'fixed', left:0, top:0, right:0, bottom:0, background:'rgba(0,0,0,0.6)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center'
      });

      const inner = document.createElement('div');
      inner.style.width = '90%';
      inner.style.height = '82%';
      inner.style.background = '#fff';
      inner.style.borderRadius = '10px';
      inner.style.overflow = 'hidden';
      inner.style.display = 'flex';
      inner.style.flexDirection = 'column';

      const header = document.createElement('div');
      header.style.display = 'flex';
      header.style.alignItems = 'center';
      header.style.justifyContent = 'space-between';
      header.style.padding = '12px 16px';
      header.style.borderBottom = '1px solid #eee';

      const hTitle = document.createElement('div');
      hTitle.innerText = titleText;
      hTitle.style.fontWeight = '700';
      hTitle.style.color = CORES_AZUL[0];

      const closeBtn = document.createElement('button');
      closeBtn.innerText = 'Fechar';
      Object.assign(closeBtn.style, { background:CORES_AZUL[0], color:'#fff', border:'none', padding:'8px 12px', borderRadius:'6px', cursor:'pointer' });
      closeBtn.addEventListener('click', closeMapModal);

      header.appendChild(hTitle);
      header.appendChild(closeBtn);

      const holder = document.createElement('div');
      holder.id = 'mapModalHolder';
      holder.style.flex = '1';
      holder.style.minHeight = '200px';

      inner.appendChild(header);
      inner.appendChild(holder);
      mapModal.appendChild(inner);
      document.body.appendChild(mapModal);

      mapModal.addEventListener('click', (ev)=> {
        if (ev.target === mapModal) closeMapModal();
      });
    } else {
      mapModal.style.display = 'flex';
    }

    // init modal map after small delay
    setTimeout(()=> initModalMap('mapModalHolder'), 120);
  }

  function closeMapModal() {
    if (mapModal) mapModal.style.display = 'none';
    // remove modal map instance for fresh init next time
    try {
      if (modalMapInstance) {
        modalMapInstance.remove();
        modalMapInstance = null;
        modalHeatLayer = null;
      }
    } catch(e){/*ignore*/}
  }

  function initModalMap(holderId) {
    const holder = document.getElementById(holderId);
    if (!holder) return;
    holder.innerHTML = ''; // reset

    if (typeof L !== 'undefined') {
      // build map container
      const mapDiv = document.createElement('div');
      mapDiv.style.width = '100%';
      mapDiv.style.height = '100%';
      mapDiv.id = 'leaflet-modal-' + Math.random().toString(36).slice(2,8);
      holder.appendChild(mapDiv);

      try {
        modalMapInstance = L.map(mapDiv.id, { zoomControl:true }).setView([HEAT_POINTS[0].lat, HEAT_POINTS[0].lng], 15);
        // satellite tiles (Esri)
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom:19 }).addTo(modalMapInstance);
        // if leaflet-heat present, use heat layer
        if (typeof L.heatLayer === 'function') {
          const heatPts = HEAT_POINTS.map(p => [p.lat, p.lng, p.value || 0.6]);
          modalHeatLayer = L.heatLayer(heatPts, { radius: 40, blur: 25, maxZoom: 17, gradient: {0.2: 'rgba(128,179,255,0.2)', 0.6: 'rgba(0,102,204,0.35)', 1: 'rgba(255,0,0,0.6)'} }).addTo(modalMapInstance);
        } else {
          // fallback: circles
          HEAT_POINTS.forEach(p => {
            L.circle([p.lat,p.lng], { radius:250, color:'#ff3333', fillColor:'#ff3333', fillOpacity:0.16, weight:0 }).addTo(modalMapInstance);
          });
        }
        // markers
        HEAT_POINTS.forEach(p => {
          L.circleMarker([p.lat,p.lng], { radius:4, fillColor:'#fff', color:CORES_AZUL[0], fillOpacity:1 }).addTo(modalMapInstance);
        });

        // fit bounds
        const latlngs = HEAT_POINTS.map(p => [p.lat,p.lng]);
        if (latlngs.length) modalMapInstance.fitBounds(latlngs, { padding:[40,40] });
      } catch (e) {
        holder.innerHTML = `<div style="padding:20px;color:#333">Erro ao inicializar mapa.</div>`;
        console.error(e);
      }
    } else {
      holder.innerHTML = `<div style="padding:20px;color:#333">Leaflet não está carregado. Adicione Leaflet para o mapa real.</div>`;
    }
  }

  // ---------- MENU LATERAL BINDs ----------
  function bindMenu() {
    const dashboardItems = document.querySelectorAll('.dashboard-item');

    dashboardItems.forEach(item => {
      const submenu = item.querySelector('.sub-menu');
      // Toggle top-level click
      item.addEventListener('click', (ev) => {
        // if click on a disciplina (child), that click will be handled separately (stopPropagation there)
        const isVisible = submenu && submenu.style.display === 'flex';

        // close others
        dashboardItems.forEach(i => {
          const s = i.querySelector('.sub-menu');
          if (s && s !== submenu) s.style.display = 'none';
          i.classList.remove('active');
        });

        // toggle current
        if (submenu) {
          submenu.style.display = isVisible ? 'none' : 'flex';
          if (!isVisible) item.classList.add('active');
        } else {
          item.classList.toggle('active');
        }

        // update preview for the setor (no disciplina)
        const setor = item.dataset.setor;
        currentSetor = setor;
        currentDisciplina = null;
        renderPreview(setor, null);
      });
    });

    // disciplinas
    function bindDisciplinas() {
      const disciplinas = document.querySelectorAll('.disciplina-item');
      disciplinas.forEach(d => {
        // avoid double-binding
        d.removeEventListener('click', onDisciplinaClick);
        d.addEventListener('click', onDisciplinaClick);
      });
    }

    function onDisciplinaClick(e) {
      e.stopPropagation();
      // remove active from all
      document.querySelectorAll('.disciplina-item').forEach(dd => dd.classList.remove('active'));
      this.classList.add('active');

      const setor = this.closest('.dashboard-item').dataset.setor;
      const disciplina = this.dataset.disciplina;
      currentSetor = setor;
      currentDisciplina = disciplina;
      // atualizar preview
      renderPreview(setor, disciplina);
    }

    bindDisciplinas();
  }
  bindMenu();

  // ---------- USUÁRIO / PROJETO ----------
  // upload foto
  userPhoto.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      userPhoto.style.backgroundImage = `url('${r.result}')`;
      usuario.photo = r.result;
      saveUsuario();
    };
    r.readAsDataURL(f);
  });

  // toggle project card
  userProject.addEventListener('click', (e) => {
    projectCard.style.display = projectCard.style.display === 'block' ? 'none' : 'block';
    e.stopPropagation();
  });

  // close project card when clicking outside
  document.addEventListener('click', (e) => {
    if (!projectCard) return;
    if (projectCard.style.display === 'block' && !projectCard.contains(e.target) && e.target !== userProject) {
      projectCard.style.display = 'none';
      projectMessage.innerHTML = '';
    }
  });

  // ESC handler
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      projectCard.style.display = 'none';
      projectMessage.innerHTML = '';
      closeMapModal();
    }
  });

  confirmBtn.addEventListener('click', () => {
    const selected = document.querySelector('input[name="projeto"]:checked');
    if (!selected) { alert('Selecione um projeto'); return; }
    const chosen = selected.value;
    projectMessage.innerHTML = '<span class="spinner"></span> Atualizando...';
    setTimeout(()=> {
      const allowed = ['PCI Usiminas','MOA Usiminas'];
      if (allowed.includes(chosen)) {
        usuario.projeto = chosen;
        userProject.innerText = chosen;
        projectMessage.innerHTML = '<span style="color:green;">✔ Projeto atualizado com sucesso!</span>';
        projectCard.style.display = 'none';
        saveUsuario();
      } else {
        projectMessage.innerHTML = 'Acesso restrito <span class="error-icon">✖</span>';
      }
    }, 800);
  });

  window.logout = function() {
    // mantive simples: remove usuario e redireciona pra index
    try { localStorage.removeItem('usuario'); } catch(e){/*ignore*/}
    // se quiser redirecionar para index.html:
    // window.location.href = 'index.html';
    alert('Logout realizado. (Implementar redirecionamento conforme ambiente)');
  };

  // ---------- ACCESS BTN (opcional: abre dashboard completo) ----------
  accessBtn.addEventListener('click', () => {
    // Ao clicar em Acessar disciplina, você pode abrir a página/detalhe completo.
    // Aqui, apenas renderizamos uma versão "expandida" (a seu critério ajustar).
    if (currentSetor && currentDisciplina) {
      // Renderização com mais cards (exemplo)
      clearAllPreviews();
      const bigTitle = `${currentSetor} — ${currentDisciplina} (Dashboard Completo - Prévia)`;
      previewCard.querySelector('h3').innerText = bigTitle;
      previewCard.querySelector('p').innerText = `Painel expandido de ${currentDisciplina}.`;
      // exemplo: 4 gráficos maiores
      const examples = MOCKS[currentSetor] && MOCKS[currentSetor][currentDisciplina] ? MOCKS[currentSetor][currentDisciplina] : [
        { type:'line', title:`${currentDisciplina} - Evolução`, labels:['T1','T2','T3','T4'], generator: ()=> randomArray(4,100) },
        { type:'bar', title:`${currentDisciplina} - Comparativo`, labels:['A','B','C'], generator: ()=> randomArray(3,200) },
        { type:'doughnut', title:`${currentDisciplina} - Distribuição`, labels:['X','Y','Z'], generator: ()=> randomArray(3,100) }
      ];
      // render these
      examples.forEach((cfg, i) => {
        const { card, canvas, title, value } = createChartCard(cfg.title || `Graf ${i+1}`);
        miniChartsContainer.appendChild(card);
        const dataVals = (typeof cfg.generator === 'function') ? cfg.generator() : (cfg.data || randomArray(cfg.labels ? cfg.labels.length : 5, 100));
        value.innerText = Array.isArray(dataVals) ? String(dataVals[dataVals.length-1]) : String(dataVals);
        const ds = [datasetWithBluePalette(Array.isArray(dataVals) ? dataVals : [dataVals], cfg.title || 'Série', cfg.type)];
        try {
          const ch = new Chart(canvas.getContext('2d'), {
            type: cfg.type || 'line',
            data: { labels: cfg.labels || dataVals.map((_,k)=>`P${k+1}`), datasets: ds },
            options: { responsive:true, maintainAspectRatio:false }
          });
          pushChart(ch);
        } catch(e) { console.error(e); }
      });
    } else {
      // sem seleção -> volta gerencial
      renderPreview(null,null);
    }
  });

  // ---------- Inicial render (Dashboard Gerencial) ----------
  renderPreview(null, null);

  // Expor funções utilitárias para debug (opcional)
  window._dashboard = {
    renderPreview,
    clearAllPreviews,
    openMapModal
  };

})(); 

/* POINT END - main.js */
