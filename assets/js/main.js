/* POINT INITIAL - main.js */

/*
  main.js completo:
  - controle de usuário (foto, projeto)
  - toggle/fechar submenus (clicar no mesmo fecha)
  - seleção de disciplina e destaque
  - dashboard inicial quando nada selecionado
  - render de prévias (cards + gráficos) usando Chart.js
  - destruição segura de instâncias Chart.js para evitar bugs
  - paleta de azuis (até 3 cores)
  - responsividade leve (1/2/3 colunas + ajuste resize)
  - modal de mapa (Leaflet) + heatmap (leaflet-heat se disponível)
  - plugin interno para rótulos de dados nos charts
  - animações leves para cards e modais
*/

(() => {
  // ---------- Configurações / Paleta ----------
  const CORES_AZUL = ['#004080', '#0066cc', '#80b3ff']; // escuro, médio, claro
  const DEFAULT_CHART_HEIGHT = 140; // px reduzido conforme pedido

  // Coordenadas para o heatmap
  const HEAT_POINTS = [
    { lat: -19.48366303752505, lng: -42.52828474324588, value: 1 },
    { lat: -19.48118578375113, lng: -42.54286877621104, value: 1 }
  ];

  // ---------- Dados do usuário ----------
  const usuario = JSON.parse(localStorage.getItem('usuario')) || {
    name: 'José Victor Silva de Jesus',
    photo: 'assets/imagens/logo-por_cuadrado.jpeg',
    projeto: 'PCI Usiminas'
  };

  // ---------- Elementos DOM ----------
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

  // Modal elements
  let mapModal = null;
  let mapInstance = null;
  let mapHeatLayer = null;

  // ---------- Inicialização UI ----------
  userName.innerText = usuario.name;
  userProject.innerText = usuario.projeto;
  userPhoto.style.backgroundImage = `url('${usuario.photo}')`;

  // ---------- Helpers ----------
  function saveUsuario() {
    localStorage.setItem('usuario', JSON.stringify(usuario));
  }

  function randomArray(length, max = 100, round = true) {
    const arr = [];
    for (let i = 0; i < length; i++) {
      const v = Math.random() * max;
      arr.push(round ? Math.round(v) : v);
    }
    return arr;
  }

  function generateUniqueId(prefix='id') {
    return prefix + '-' + Math.random().toString(36).substr(2,8);
  }

  function clearCharts() {
    const charts = miniChartsContainer._charts || [];
    charts.forEach(c => { try { c.destroy(); } catch(e){} });
    miniChartsContainer._charts = [];
    miniChartsContainer.innerHTML = '';
    miniChartsContainer.classList.remove('one-per-row', 'two-per-row');
  }

  function pushChartInstance(chart) {
    miniChartsContainer._charts = miniChartsContainer._charts || [];
    miniChartsContainer._charts.push(chart);
  }

  // Chart.js plugin simples para rótulos
  const DataLabelPlugin = {
    id: 'simpleDataLabel',
    afterDatasetsDraw: function(chart) {
      const ctx = chart.ctx;
      chart.data.datasets.forEach((dataset, i) => {
        const meta = chart.getDatasetMeta(i);
        if (!meta || !meta.data) return;
        meta.data.forEach((element, index) => {
          ctx.save();
          const value = dataset.data[index];
          const fontSize = 11;
          ctx.font = fontSize + "px Arial";
          ctx.fillStyle = dataset.backgroundColor ? dataset.backgroundColor[index] : CORES_AZUL[0];
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          let posX = element.x || 0;
          let posY = (element.y || 0) - 6;
          if (chart.config.type === 'doughnut' || chart.config.type === 'pie') {
            const center = element._model ? {x: element._model.x, y: element._model.y} : {x: element.x, y: element.y};
            posX = center.x;
            posY = center.y - (DEFAULT_CHART_HEIGHT/6);
          }
          try { ctx.fillText(String(value), posX, posY); } catch(e){}
          ctx.restore();
        });
      });
    }
  };

  if (window.Chart && !Chart.registry.getPlugin('simpleDataLabel')) {
    Chart.register(DataLabelPlugin);
  }

  function createChartCard(titleText, options = {}) {
    const card = document.createElement('div');
    card.className = 'chart-card';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.alignItems = 'stretch';
    card.style.flex = '1 1 calc(33% - 20px)';
    card.style.maxWidth = 'calc(33% - 20px)';
    card.style.minWidth = '250px';
    card.style.margin = '10px';
    card.style.boxSizing = 'border-box';
    card.dataset.card = 'chart';

    const title = document.createElement('div');
    title.className = 'chart-card-title';
    title.innerText = titleText;
    title.style.color = CORES_AZUL[0];
    title.style.fontWeight = '600';
    title.style.marginBottom = '6px';
    title.style.fontSize = '0.95rem';

    const value = document.createElement('div');
    value.className = 'chart-card-value';
    value.innerText = options.valueText || '';
    value.style.color = '#333';
    value.style.fontSize = '1rem';
    value.style.marginBottom = '8px';

    if (options.mapCard) {
      const mapWrap = document.createElement('div');
      mapWrap.style.width = '100%';
      mapWrap.style.height = DEFAULT_CHART_HEIGHT + 'px';
      mapWrap.style.borderRadius = '8px';
      mapWrap.style.overflow = 'hidden';
      mapWrap.style.background = '#e9eef6';
      mapWrap.style.cursor = 'pointer';
      mapWrap.dataset.mapMini = 'true';

      const miniDiv = document.createElement('div');
      miniDiv.style.width = '100%';
      miniDiv.style.height = '100%';
      miniDiv.className = 'mini-map-target';
      mapWrap.appendChild(miniDiv);

      mapWrap.addEventListener('click', () => openMapModal(setorForMapContext(), titleText));

      card.appendChild(title);
      card.appendChild(value);
      card.appendChild(mapWrap);

      return { card, mapMini: miniDiv, title, value };
    }

    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.minHeight = DEFAULT_CHART_HEIGHT + 'px';
    canvas.style.display = 'block';

    card.appendChild(title);
    card.appendChild(value);
    card.appendChild(canvas);

    return { card, canvas, title, value };
  }

  function datasetWithBluePalette(data, label, type) {
    if (type === 'doughnut' || type === 'pie') {
      const bg = data.map((_, i) => CORES_AZUL[i % CORES_AZUL.length]);
      return { label, data, backgroundColor: bg, borderColor: CORES_AZUL[0], borderWidth: 1 };
    } else if (type === 'bar') {
      const bg = data.map((_, i) => CORES_AZUL[i % CORES_AZUL.length]);
      return { label, data, backgroundColor: bg, borderColor: CORES_AZUL[0], borderWidth: 1 };
    } else {
      return { label, data, backgroundColor: hexToRgba(CORES_AZUL[1],0.12), borderColor: CORES_AZUL[0], borderWidth: 2, pointBackgroundColor: CORES_AZUL[1], tension:0.25, fill: type==='line' };
    }
  }

  function hexToRgba(hex, alpha=1) {
    const h = hex.replace('#','');
    const bigint = parseInt(h,16);
    const r = (bigint>>16)&255, g=(bigint>>8)&255, b=bigint&255;
    return `rgba(${r},${g},${b},${alpha})`;
  }

  // ---------- User interactions ----------
  userPhoto.addEventListener('click', ()=>fileInput.click());
  fileInput.addEventListener('change', e=>{
    const file=e.target.files[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=()=>{ userPhoto.style.backgroundImage=`url('${reader.result}')`; usuario.photo=reader.result; saveUsuario(); };
    reader.readAsDataURL(file);
  });

  userProject.addEventListener('click',(e)=>{ projectCard.style.display='block'; e.stopPropagation(); });
  document.addEventListener('click',(e)=>{
    if(!projectCard) return;
    if(projectCard.style.display==='block' && !projectCard.contains(e.target) && e.target!==userProject){
      projectCard.style.display='none';
    }
  });

  confirmBtn.addEventListener('click',()=>{
    const val = document.getElementById('projectInput').value.trim();
    if(val.length>0){ usuario.projeto=val; saveUsuario(); userProject.innerText=val; projectCard.style.display='none'; projectMessage.innerText='Projeto atualizado!'; setTimeout(()=>{projectMessage.innerText='';},2000); }
  });

  // ---------- Dashboard Inicial ----------
  function loadDashboardGerencial(){
    clearCharts();

    // --- exemplo de 4 cards ---
    const chartsData = [
      {title:'HH Total', type:'bar', data: randomArray(6,120)},
      {title:'Efetivo', type:'doughnut', data: randomArray(3,100)},
      {title:'ML Movimentado', type:'line', data: randomArray(6,50)},
      {title:'STD', type:'bar', data: randomArray(6,50)}
    ];

    chartsData.forEach((cd)=>{
      const { card, canvas } = createChartCard(cd.title, { valueText: cd.data.reduce((a,b)=>a+b,0) });
      miniChartsContainer.appendChild(card);

      if(canvas){
        const ctx = canvas.getContext('2d');
        const chartType = cd.type;
        const dataset = datasetWithBluePalette(cd.data, cd.title, chartType);
        const chart = new Chart(ctx, { type: chartType, data: { labels: cd.data.map((_,i)=>i+1), datasets:[dataset] }, options:{ responsive:true, maintainAspectRatio:false } });
        pushChartInstance(chart);
      }

      // animação leve
      setTimeout(()=>{ card.classList.add('show'); }, 30);
    });

    adjustLayoutForScreen();
  }

  // ---------- Responsividade cards ----------
  function adjustLayoutForScreen() {
    const width = window.innerWidth;
    miniChartsContainer.classList.remove('one-per-row','two-per-row');
    const cards = miniChartsContainer.querySelectorAll('.chart-card');
    if(width<600) miniChartsContainer.classList.add('one-per-row');
    else if(width>=600 && width<900 && cards.length===2) miniChartsContainer.classList.add('two-per-row');
  }
  window.addEventListener('resize', adjustLayoutForScreen);

  // ---------- Modal Map ----------
  function openMapModal(setor, title){
    if(!mapModal){
      mapModal = document.createElement('div');
      mapModal.id = 'mapModal';
      mapModal.style.position = 'fixed';
      mapModal.style.top='0'; mapModal.style.left='0'; mapModal.style.width='100%'; mapModal.style.height='100%';
      mapModal.style.background='rgba(0,0,0,0.4)';
      mapModal.style.display='flex'; mapModal.style.alignItems='center'; mapModal.style.justifyContent='center';
      mapModal.style.zIndex='999';
      mapModal.style.opacity='0';
      const inner = document.createElement('div');
      inner.style.width='80%'; inner.style.height='80%'; inner.style.background='#fff'; inner.style.borderRadius='12px'; inner.style.position='relative';
      inner.id = 'mapModalInner';
      const closeBtn = document.createElement('button'); closeBtn.innerText='X';
      closeBtn.style.position='absolute'; closeBtn.style.top='10px'; closeBtn.style.right='10px'; closeBtn.style.zIndex='1000';
      closeBtn.addEventListener('click',()=>{ mapModal.classList.remove('show'); setTimeout(()=>{ mapModal.remove(); mapModal=null; },300); });
      inner.appendChild(closeBtn);
      const mapDiv = document.createElement('div'); mapDiv.id='mapModalContent'; mapDiv.style.width='100%'; mapDiv.style.height='100%';
      inner.appendChild(mapDiv);
      mapModal.appendChild(inner);
      document.body.appendChild(mapModal);
      setTimeout(()=>mapModal.classList.add('show'),10);
    }

    if(mapInstance) try{ mapInstance.remove(); mapInstance=null; mapHeatLayer=null; }catch(e){}
    mapInstance = L.map('mapModalContent').setView([HEAT_POINTS[0].lat, HEAT_POINTS[0].lng], 15);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(mapInstance);
    mapHeatLayer = L.heatLayer(HEAT_POINTS.map(p=>[p.lat,p.lng,p.value]), {radius:25, blur:15, maxZoom:17}).addTo(mapInstance);
  }

  function setorForMapContext(){ return {name:'Exemplo Setor'}; }

  // ---------- Inicialização ----------
  loadDashboardGerencial();

  window.logout = function(){
    alert("Logout realizado com sucesso!");
    localStorage.removeItem('usuario');
    location.reload();
  };

})();
