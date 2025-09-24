Lembrando, não altere layout.

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
  - responsividade leve (aplica classes ao container para 1/2/3 colunas)
*/

(() => {
  // ---------- Configurações / Paleta ----------
  const CORES_AZUL = ['#004080', '#0066cc', '#80b3ff']; // escuro, médio, claro
  const DEFAULT_CHART_HEIGHT = 260; // px (visual)

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

  function clearCharts() {
    // Destrói instâncias Chart.js armazenadas como propriedade do container
    const charts = miniChartsContainer._charts || [];
    charts.forEach(c => {
      try { c.destroy(); } catch (e) { /* ignore */ }
    });
    miniChartsContainer._charts = [];
    miniChartsContainer.innerHTML = '';
    // remover classes de layout
    miniChartsContainer.classList.remove('one-per-row', 'two-per-row');
  }

  function pushChartInstance(chart) {
    miniChartsContainer._charts = miniChartsContainer._charts || [];
    miniChartsContainer._charts.push(chart);
  }

  // Cria um elemento card com título + canvas
  function createChartCard(titleText) {
    const card = document.createElement('div');
    card.className = 'chart-card';
    // Inline card styles kept minimal — layout control by CSS
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.alignItems = 'stretch';
    card.style.flex = '1 1 calc(33% - 20px)'; // 3 por linha com espaçamento
    card.style.maxWidth = 'calc(33% - 20px)';
    card.style.minWidth = '250px';
    card.style.margin = '10px';
    card.style.boxSizing = 'border-box';

    const title = document.createElement('div');
    title.className = 'chart-card-title';
    title.innerText = titleText;
    title.style.color = CORES_AZUL[0];
    title.style.fontWeight = '600';
    title.style.marginBottom = '8px';
    title.style.fontSize = '0.95rem';

    const value = document.createElement('div');
    value.className = 'chart-card-value';
    value.innerText = ''; // preenchido opcionalmente
    value.style.color = '#333';
    value.style.fontSize = '1.05rem';
    value.style.marginBottom = '8px';

    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.minHeight = DEFAULT_CHART_HEIGHT + 'px';
    canvas.style.display = 'block';

    card.appendChild(title);
    card.appendChild(value);
    card.appendChild(canvas);

    return { card, canvas, title, value };
  }

  // Cria dataset com até 3 cores (cicla cores usadas)
  function datasetWithBluePalette(data, label, type) {
    if (type === 'doughnut' || type === 'pie') {
      // use array of colors one per data point (cycle)
      const bg = data.map((_, i) => CORES_AZUL[i % CORES_AZUL.length]);
      return {
        label,
        data,
        backgroundColor: bg,
        borderColor: CORES_AZUL[0],
        borderWidth: 1
      };
    } else if (type === 'bar') {
      // per-bar color can be array or single color
      const bg = data.map((_, i) => CORES_AZUL[i % CORES_AZUL.length]);
      return {
        label,
        data,
        backgroundColor: bg,
        borderColor: CORES_AZUL[0],
        borderWidth: 1
      };
    } else { // line, radar ...
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

  function hexToRgba(hex, alpha = 1) {
    const h = hex.replace('#', '');
    const bigint = parseInt(h, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  // ---------- User interactions ----------

  // Upload de foto
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

  // Project card open
  userProject.addEventListener('click', (e) => {
    projectCard.style.display = 'block';
    // position: ensure visible within main header area (no layout change)
    e.stopPropagation();
  });

  // Close projectCard when clicking outside
  document.addEventListener('click', (e) => {
    if (!projectCard) return;
    if (projectCard.style.display === 'block' && !projectCard.contains(e.target) && e.target !== userProject) {
      projectCard.style.display = 'none';
      projectMessage.innerHTML = '';
    }
  });
  // close with ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      projectCard.style.display = 'none';
      projectMessage.innerHTML = '';
    }
  });

  // Confirm project selection
  confirmBtn.addEventListener('click', () => {
    const selected = document.querySelector('input[name="projeto"]:checked');
    if (!selected) { alert('Selecione um projeto'); return; }
    const projetoEscolhido = selected.value;
    projectMessage.innerHTML = '<span class="spinner"></span> Atualizando...';
    setTimeout(() => {
      if (['PCI Usiminas', 'MOA Usiminas'].includes(projetoEscolhido)) {
        usuario.projeto = projetoEscolhido;
        userProject.innerText = projetoEscolhido;
        projectMessage.innerHTML = '<span style="color:green;">✔ Projeto atualizado com sucesso!</span>';
        projectCard.style.display = 'none';
        saveUsuario();
      } else {
        projectMessage.innerHTML = 'Acesso restrito, entre em contato com o administrador ou superior <span class="error-icon">✖</span>';
      }
    }, 900);
  });

  // Logout function
  window.logout = function () {
    localStorage.removeItem('usuario');
    window.location.href = 'index.html';
  };

  // ---------- Menu lateral (toggle / close other submenus) ----------
  const dashboardItems = document.querySelectorAll('.dashboard-item');
  dashboardItems.forEach(item => {
    const submenu = item.querySelector('.sub-menu');
    item.addEventListener('click', (e) => {
      // If click on submenu item, let that handler run (we stopPropagation there).
      // Toggle this submenu, and close others
      const isVisible = submenu && submenu.style.display === 'flex';

      dashboardItems.forEach(i => {
        const sm = i.querySelector('.sub-menu');
        if (sm && sm !== submenu) sm.style.display = 'none';
        i.classList.remove('active');
      });

      if (submenu) {
        submenu.style.display = isVisible ? 'none' : 'flex';
        if (!isVisible) item.classList.add('active');
      } else {
        // no submenu -> just active
        item.classList.add('active');
      }

      const setor = item.dataset.setor;
      updatePreview(setor, null);
    });
  });

  // ---------- Disciplinas listeners ----------
  function bindDisciplinaClicks() {
    const disciplinas = document.querySelectorAll('.disciplina-item');
    disciplinas.forEach(d => {
      // ensure we don't double-bind
      d.removeEventListener('click', onDisciplinaClick);
      d.addEventListener('click', onDisciplinaClick);
    });
  }

  function onDisciplinaClick(e) {
    e.stopPropagation();
    const disciplinasAll = document.querySelectorAll('.disciplina-item');
    disciplinasAll.forEach(dd => dd.classList.remove('active'));
    this.classList.add('active');

    const setor = this.closest('.dashboard-item').dataset.setor;
    const disciplina = this.dataset.disciplina;
    updatePreview(setor, disciplina);
  }

  bindDisciplinaClicks();

  // ---------- Chart rendering logic ----------
  // We'll have predefined mock chart configs per setor/disciplina to show variety
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
      Medição: [
        { type:'bar', title:'Medição % Concluída', labels:['Item1','Item2','Item3'], generator: ()=> randomArray(3,100) }
      ],
      Custo: [
        { type:'bar', title:'Custo Planejado x Real (R$)', labels:['Previsto','Real'], generator: ()=> [50000,48000] },
        { type:'line', title:'Tendência de Custo', labels:['M1','M2','M3','M4'], generator: ()=> randomArray(4,60000) }
      ]
    },
    QSMS: {
      setorPreview: [
        { type:'doughnut', title:'Conformidade QSMS', labels:['OK','Not OK'], generator: ()=> [88,12] },
        { type:'bar', title:'Near Miss / Incidentes', labels:['Near Miss','Incidentes'], generator: ()=> [12,3] }
      ],
      Qualidade: [{ type:'line', title:'Índice de Qualidade (%)', labels:['Jan','Fev','Mar'], generator: ()=> [92,90,95] }],
      Segurança: [{ type:'bar', title:'Incidentes por Mês', labels:['Jan','Fev','Mar'], generator: ()=> randomArray(3,10) }],
      'Meio Ambiente e Saúde': [{ type:'doughnut', title:'Indicadores Ambientais', labels:['Ok','Alerta'], generator: ()=> [85,15] }],
      Saude: [{ type:'bar', title:'Indicadores de Saúde', labels:['Absenteísmo','Treinamentos'], generator: ()=> [3,8] }]
    },
    Producao: {
      setorPreview: [
        { type:'line', title:'Produção Geral (%)', labels:['A1','A2','A3','A4'], generator: ()=> randomArray(4,100) },
        { type:'bar', title:'HH por Disciplina', labels:['Elétrica','Mecânica','Solda'], generator: ()=> randomArray(3,200) }
      ],
      Eletrica:[{type:'line', title:'Elétrica (%)', labels:['A1','A2','A3'], generator: ()=> randomArray(3,100)}],
      Andaime:[{type:'bar', title:'Andaime (m)', labels:['Montagem','Desmontagem'], generator: ()=> [200,180]}],
      Mecânica:[{type:'line', title:'Mecânica (%)', labels:['D1','D2','D3'], generator: ()=> randomArray(3,100)}],
      Solda:[{type:'bar', title:'Solda - Inspecionadas x Aprovadas', labels:['Inspecionadas','Aprovadas'], generator: ()=> [30,28]}],
      Pintura:[{type:'bar', title:'Pintura (m²)', labels:['Previsto','Realizado'], generator: ()=> [1000,900]}],
      Isolamento:[{type:'doughnut', title:'Isolamento Térmico (%)', labels:['Concluído','Pendente'], generator: ()=> [75,25]}],
      'Movimentação de Carga':[{type:'bar', title:'Mov. Carga (movs)', labels:['Previsto','Real'], generator: ()=> [50,45]}],
      Instrumentação:[{type:'line', title:'Instrumentação (%)', labels:['T1','T2','T3'], generator: ()=> randomArray(3,100)}],
      Estruturas:[{type:'line', title:'Estruturas (%)', labels:['S1','S2','S3'], generator: ()=> randomArray(3,100)}]
    },
    Diaf: {
      setorPreview: [
        { type:'doughnut', title:'Efetivo / Vagas', labels:['Ativos','Vagas'], generator: ()=> [720, 45] },
        { type:'bar', title:'Custos Financeiros', labels:['Previsto','Real'], generator: ()=> [50000,48000] }
      ],
      'Recursos Humanos':[{type:'line', title:'Efetivo (%)', labels:['Jan','Fev'], generator: ()=> [90,95]}],
      Financeiro:[{type:'bar', title:'Financeiro (R$)', labels:['Previsto','Real'], generator: ()=> [50000,48000]}],
      Contratual:[{type:'doughnut', title:'Contratual', labels:['Em dia','Atraso'], generator: ()=> [80,20]}]
    }
  };

  // ---------- Render function ----------
  function renderMockChartsFor(setor, disciplina) {
    clearCharts();

    // choose proper mock set
    let items = [];
    if (!setor) {
      items = MOCKS.gerencial || MOCKS['gerencial'];
    } else {
      const block = MOCKS[setor];
      if (!block) {
        // fallback: show gerencial if setor desconhecido
        items = MOCKS.gerencial;
      } else {
        if (disciplina) {
          items = block[disciplina] || [];
        } else {
          // setor preview
          items = block.setorPreview || [];
        }
      }
    }

    // fallback: ensure at least 1 chart
    if (!items || items.length === 0) {
      items = [{ type: 'line', title: 'Indicador', labels: ['A','B','C'], generator: ()=> randomArray(3,100) }];
    }

    // decide layout class based on count
    if (items.length === 1) miniChartsContainer.classList.add('one-per-row');
    else if (items.length === 2) miniChartsContainer.classList.add('two-per-row');
    else miniChartsContainer.classList.remove('one-per-row','two-per-row');

    // create each card + chart
    items.forEach((cfg, idx) => {
      const { card, canvas, title, value } = createChartCard(cfg.title || `Gráfico ${idx+1}`);
      // optional value summary (example): show last datapoint or sum for bar/doughnut
      const data = (typeof cfg.generator === 'function') ? cfg.generator() : (cfg.data || randomArray(cfg.labels ? cfg.labels.length : 5, 100));
      if (cfg.type === 'doughnut' || cfg.type === 'pie') {
        const total = data.reduce((a,b)=>a+b,0);
        value.innerText = total ? `${total}` : '';
      } else if (cfg.type === 'bar') {
        value.innerText = data.length>0 ? `${data[data.length-1]}` : '';
      } else {
        value.innerText = data.length>0 ? `${data[data.length-1]}` : '';
      }

      // append card into container
      miniChartsContainer.appendChild(card);

      // create chart
      const ctx = canvas.getContext('2d');
      // dataset(s)
      const ds = [ datasetWithBluePalette(data, cfg.title || 'Série', cfg.type) ];

      const chartConfig = {
        type: cfg.type || 'line',
        data: {
          labels: cfg.labels || data.map((_,i) => `P${i+1}`),
          datasets: ds
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: cfg.type !== 'line' } // show legend for non-line for clarity
          },
          scales: (cfg.type === 'doughnut' || cfg.type === 'pie' || cfg.type === 'radar') ? {} : {
            x: { display: true },
            y: { display: true }
          }
        }
      };

      try {
        const chart = new Chart(ctx, chartConfig);
        pushChartInstance(chart);
      } catch (err) {
        console.error('Erro ao instanciar Chart.js', err);
      }
    });
  }

  // ---------- updatePreview (integra tudo) ----------
  function updatePreview(setor, disciplina) {
    // Title / description update
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

    // render charts for this selection
    renderMockChartsFor(setor, disciplina);
  }

  // ---------- Inicialização ----------
  // Start with dashboard gerencial
  updatePreview(null, null);

  // Expose for debug (optional)
  window._techint = {
    usuario,
    updatePreview,
    clearCharts
  };

})(); 

/* POINT END - main.js */
