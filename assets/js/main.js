/* POINT INITIAL - main.js */

(() => {
  const CORES_AZUL = ['#004080', '#0066cc', '#80b3ff'];
  const DEFAULT_CHART_HEIGHT = 140;

  const HEAT_POINTS = [
    { lat: -19.48366303752505, lng: -42.52828474324588, value: 1 },
    { lat: -19.48118578375113, lng: -42.54286877621104, value: 1 }
  ];

  const usuario = JSON.parse(localStorage.getItem('usuario')) || {
    name: 'José Victor Silva de Jesus',
    photo: 'assets/imagens/logo-por_cuadrado.jpeg',
    projeto: 'PCI Usiminas'
  };

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

  let mapModal = null;
  let mapInstance = null;
  let mapHeatLayer = null;

  // Inicializa info do usuário
  userName.innerText = usuario.name;
  userProject.innerText = usuario.projeto;
  userPhoto.style.backgroundImage = `url('${usuario.photo}')`;

  function saveUsuario() {
    localStorage.setItem('usuario', JSON.stringify(usuario));
  }

  function randomArray(length, max = 100) {
    return Array.from({ length }, () => Math.round(Math.random() * max));
  }

  function clearCharts() {
    const charts = miniChartsContainer._charts || [];
    charts.forEach(c => { try { c.destroy(); } catch(e){} });
    miniChartsContainer._charts = [];
    miniChartsContainer.innerHTML = '';
    miniChartsContainer.classList.remove('one-per-row','two-per-row');
  }

  function pushChartInstance(chart) {
    miniChartsContainer._charts = miniChartsContainer._charts || [];
    miniChartsContainer._charts.push(chart);
  }

  const DataLabelPlugin = {
    id: 'simpleDataLabel',
    afterDatasetsDraw(chart) {
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

    const title = document.createElement('div');
    title.className = 'chart-card-title';
    title.innerText = titleText;

    const value = document.createElement('div');
    value.className = 'chart-card-value';
    value.innerText = options.valueText || '';

    card.appendChild(title);
    card.appendChild(value);

    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.minHeight = DEFAULT_CHART_HEIGHT + 'px';
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

  // Interações usuário
  userPhoto.addEventListener('click', ()=>fileInput.click());
  fileInput.addEventListener('change', e=>{
    const file=e.target.files[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=()=>{ userPhoto.style.backgroundImage=`url('${reader.result}')`; usuario.photo=reader.result; saveUsuario(); };
    reader.readAsDataURL(file);
  });

  userProject.addEventListener('click', e=>{
    projectCard.style.display='block'; e.stopPropagation();
  });
  document.addEventListener('click', e=>{
    if(projectCard.style.display==='block' && !projectCard.contains(e.target) && e.target!==userProject){
      projectCard.style.display='none';
    }
  });

  confirmBtn.addEventListener('click', ()=>{
    const checked = document.querySelector('#projectCard input[name="projeto"]:checked');
    if(checked){
      usuario.projeto = checked.value;
      saveUsuario();
      userProject.innerText = checked.value;
      projectCard.style.display='none';
      projectMessage.innerText='Projeto atualizado!';
      setTimeout(()=>{ projectMessage.innerText=''; },2000);
    }
  });

  // ---------- Menu lateral ----------
  const dashboardItems = document.querySelectorAll('.dashboard-item');
  dashboardItems.forEach(item=>{
    const sub = item.querySelector('.sub-menu');
    item.addEventListener('click', e=>{
      dashboardItems.forEach(i=>{ if(i!==item) i.classList.remove('active'); if(i.querySelector('.sub-menu')) i.querySelector('.sub-menu').style.display='none'; });
      item.classList.toggle('active');
      if(sub) sub.style.display = item.classList.contains('active') ? 'flex' : 'none';
    });
  });

  const disciplinaItems = document.querySelectorAll('.disciplina-item');
  disciplinaItems.forEach(d=>{
    d.addEventListener('click', e=>{
      disciplinaItems.forEach(i=>i.classList.remove('active'));
      d.classList.add('active');
      alert(`Disciplina selecionada: ${d.dataset.disciplina}`);
    });
  });

  const inicioBtn = document.createElement('div');
  inicioBtn.className = 'dashboard-item';
  inicioBtn.innerText = 'Início';
  inicioBtn.addEventListener('click', loadDashboardGerencial);
  document.querySelector('.sidebar').insertBefore(inicioBtn, document.querySelector('.sidebar').firstChild);

  // ---------- Dashboard inicial ----------
  function loadDashboardGerencial(){
    clearCharts();
    const chartsData = [
      {title:'HH Total', type:'bar', data: randomArray(6,120)},
      {title:'Efetivo', type:'doughnut', data: randomArray(3,100)},
      {title:'ML Movimentado', type:'line', data: randomArray(6,50)},
      {title:'STD', type:'bar', data: randomArray(6,50)}
    ];

    chartsData.forEach(cd=>{
      const { card, canvas } = createChartCard(cd.title, { valueText: cd.data.reduce((a,b)=>a+b,0) });
      miniChartsContainer.appendChild(card);
      if(canvas){
        const ctx = canvas.getContext('2d');
        const dataset = datasetWithBluePalette(cd.data, cd.title, cd.type);
        const chart = new Chart(ctx, { type: cd.type, data: { labels: cd.data.map((_,i)=>i+1), datasets:[dataset] }, options:{ responsive:true, maintainAspectRatio:false } });
        pushChartInstance(chart);
      }
    });
  }

  function adjustLayoutForScreen() {
    const width = window.innerWidth;
    miniChartsContainer.classList.remove('one-per-row','two-per-row');
    const cards = miniChartsContainer.querySelectorAll('.chart-card');
    if(width<600) miniChartsContainer.classList.add('one-per-row');
    else if(width>=600 && width<900 && cards.length===2) miniChartsContainer.classList.add('two-per-row');
  }
  window.addEventListener('resize', adjustLayoutForScreen);

  // ---------- Logout ----------
  window.logout = function(){
    alert("Logout realizado com sucesso!");
    localStorage.removeItem('usuario');
    location.reload();
  };

})();
