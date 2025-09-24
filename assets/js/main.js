/* POINT INITIAL - main.js */

// Dados do usuário
const usuario = JSON.parse(localStorage.getItem('usuario')) || {
    name:'José Victor Silva de Jesus',
    photo:'assets/imagens/logo-por_cuadrado.jpeg',
    projeto:'PCI Usiminas'
};

// Elementos DOM
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

// Inicializa informações do usuário
userName.innerText = usuario.name;
userProject.innerText = usuario.projeto;
userPhoto.style.backgroundImage = `url('${usuario.photo}')`;

// Upload de foto
userPhoto.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if(file){
        const reader = new FileReader();
        reader.onload = () => { 
            userPhoto.style.backgroundImage = `url('${reader.result}')`; 
            usuario.photo = reader.result; 
            localStorage.setItem('usuario', JSON.stringify(usuario));
        };
        reader.readAsDataURL(file);
    }
});

// Mostrar card ao clicar no projeto
userProject.addEventListener('click', () => { projectCard.style.display = 'block'; });

// Projetos autorizados
const projetosAutorizados = ['PCI Usiminas','MOA Usiminas'];

// Confirmar seleção de projeto
confirmBtn.addEventListener('click', () => {
    const selected = document.querySelector('input[name="projeto"]:checked');
    if(!selected) { alert('Selecione um projeto'); return; }

    const projetoEscolhido = selected.value;
    projectMessage.innerHTML = '<span class="spinner"></span> Atualizando...';

    setTimeout(()=>{
        if(projetosAutorizados.includes(projetoEscolhido)){
            usuario.projeto = projetoEscolhido;
            userProject.innerText = projetoEscolhido;
            projectMessage.innerHTML = '<span style="color:green;">✔ Projeto atualizado com sucesso!</span>';
            projectCard.style.display = 'none';
            localStorage.setItem('usuario', JSON.stringify(usuario));
        } else {
            projectMessage.innerHTML = 'Acesso restrito <span class="error-icon">✖</span>';
        }
    },1500);
});

// Logout
function logout() { 
    localStorage.removeItem('usuario'); 
    window.location.href='index.html'; 
}

// MENU LATERAL - Toggle submenus
const dashboardItems = document.querySelectorAll('.dashboard-item');
dashboardItems.forEach(item => {
    const submenu = item.querySelector('.sub-menu');
    item.addEventListener('click', () => {
        const isVisible = submenu && submenu.style.display === 'flex';

        // Fecha todos os outros
        dashboardItems.forEach(i => {
            const sm = i.querySelector('.sub-menu');
            if(sm) sm.style.display='none';
            i.classList.remove('active');
        });

        // Toggle atual
        if(submenu) submenu.style.display = isVisible ? 'none' : 'flex';
        if(!isVisible) item.classList.add('active');

        // Atualiza prévia
        const setor = item.dataset.setor;
        updatePreview(setor, null);
    });
});

// DISCIPLINAS - Seleção
function updateDisciplinasListeners(){
    const disciplinas = document.querySelectorAll('.disciplina-item');
    disciplinas.forEach(d => {
        d.addEventListener('click', (e) => {
            e.stopPropagation(); // Impede toggle do menu pai
            // Remove destaque de outras disciplinas
            disciplinas.forEach(dd => dd.classList.remove('active'));
            d.classList.add('active');

            const setor = d.closest('.dashboard-item').dataset.setor;
            const disciplina = d.dataset.disciplina;

            updatePreview(setor, disciplina);
        });
    });
}
updateDisciplinasListeners();

// Função para atualizar preview-card e gráficos
let chartInstances = [];
function updatePreview(setor, disciplina){
    // Atualiza título e descrição
    let title = `Sistema de Gerenciamento ${setor || ''}`;
    let desc = '';
    if(disciplina){
        title += ` - ${disciplina}`;
        desc = `Prévia da disciplina ${disciplina} do setor ${setor}.`;
        accessBtn.style.display='inline-block';
        accessBtn.innerText = `Acessar ${disciplina}`;
    } else {
        // Dashboard inicial ou setor
        accessBtn.style.display='none';
        switch(setor){
            case 'PYCP': desc='Planejamento, Medição e Custo'; break;
            case 'QSMS': desc='Qualidade, Segurança, Meio Ambiente e Saúde'; break;
            case 'Produção': desc='Elétrica, Andaime, Mecânica, Solda, Estruturas, Pintura, Isolamento, Movimentação e Instrumentação'; break;
            case 'Diaf': desc='Recursos Humanos, Financeiro e Contratual'; break;
            default: desc='Dashboard Gerencial: Avanço de obras, custo previsto x real, HH previsto x real, desvio e indicadores gerais.'; break;
        }
    }

    previewCard.querySelector('h3').innerText = title;
    previewCard.querySelector('p').innerText = desc;

    // Limpa gráficos anteriores
    miniChartsContainer.innerHTML = '';
    chartInstances.forEach(c => c.destroy());
    chartInstances = [];

    // Dados aleatórios para exemplo
    const miniData = {
        STD:[Math.random()*2,Math.random()*2,Math.random()*2,Math.random()*2,Math.random()*2],
        HH:[Math.random()*20,Math.random()*20,Math.random()*20,Math.random()*20,Math.random()*20],
        Custo:[Math.random()*20000,Math.random()*20000,Math.random()*20000,Math.random()*20000,Math.random()*20000],
        Medicao:[Math.random()*100,Math.random()*100,Math.random()*100,Math.random()*100,Math.random()*100]
    };
    const labels = ['A1','A2','A3','A4','A5'];
    const types = ['line','bar','bar','doughnut'];
    const keys = ['STD','HH','Custo','Medicao'];

    keys.forEach((key,i)=>{
        const canvas = document.createElement('canvas');
        canvas.id = `chart${i}`;
        canvas.style.margin='10px';
        canvas.style.flex='1 1 200px';
        canvas.style.minHeight = '200px';
        canvas.style.maxHeight = '300px';

        miniChartsContainer.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        const chart = new Chart(ctx,{
            type: types[i],
            data:{
                labels: labels,
                datasets:[{
                    label: key,
                    data: miniData[key],
                    backgroundColor:'#004080',
                    borderColor:'#004080',
                    fill: types[i]==='line'
                }]
            },
            options:{
                responsive:true,
                maintainAspectRatio:false,
                plugins:{ legend:{ display:false } },
                scales:{ x:{ display:true }, y:{ display:true } }
            }
        });
        chartInstances.push(chart);
    });
}

// Inicializa com dashboard geral
updatePreview(null, null);

/* POINT END - main.js */
