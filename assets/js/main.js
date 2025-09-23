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
            projectMessage.innerHTML = 'Acesso restrito, entre em contato com o administrador ou superior <span class="error-icon">✖</span>';
        }
    },1500);
});

// Logout
function logout() { localStorage.removeItem('usuario'); window.location.href='index.html'; }

// Menu lateral
const dashboardItems = document.querySelectorAll('.dashboard-item');
dashboardItems.forEach(item => {
    item.addEventListener('click', () => {
        // Ativa o dashboard selecionado
        dashboardItems.forEach(i => {
            i.classList.remove('active');
            if(i.querySelector('.sub-menu')) i.querySelector('.sub-menu').style.display='none';
        });
        item.classList.add('active');

        // Expande submenu se existir
        const submenu = item.querySelector('.sub-menu');
        if(submenu) submenu.style.display='flex';

        // Atualiza prévia para o dashboard
        const dashboard = item.dataset.dashboard;
        updatePreview(dashboard, null);
    });
});

// Submenu de disciplinas
const disciplinas = document.querySelectorAll('.disciplina-item');
disciplinas.forEach(d => {
    d.addEventListener('click', () => {
        // Remove destaque de outras disciplinas
        disciplinas.forEach(dd => dd.classList.remove('active'));
        d.classList.add('active');

        const dashboard = d.closest('.dashboard-item').dataset.dashboard;
        const disciplina = d.dataset.disciplina;

        // Atualiza prévia
        updatePreview(dashboard, disciplina);
    });
});

// Função para atualizar preview-card
function updatePreview(dashboard, disciplina){
    let title = `Sistema de Gerenciamento ${dashboard}`;
    let desc = '';
    let miniData = {};

    if(disciplina){
        title += ` - ${disciplina}`;
        desc = `Prévia da disciplina ${disciplina} do setor ${dashboard}.`;
    } else {
        // Descrição resumida do dashboard
        switch(dashboard){
            case 'PYCP': desc='Planejamento, Medição e Custo.'; break;
            case 'QSMS': desc='Qualidade, Segurança, Meio Ambiente e Saúde.'; break;
            case 'Produção': desc='Elétrica, Andaime, Mecânica, Solda, Estruturas, Pintura, Isolamento, Movimentação, Instrumentação.'; break;
            case 'RH': desc='Recursos Humanos, Financeiro e Contratual.'; break;
            case 'Suprimentos': desc='Compras, Almoxarifado e Suprimentos.'; break;
            default: desc='Visualize indicadores.'; break;
        }
    }

    previewCard.querySelector('h3').innerText = title;
    previewCard.querySelector('p').innerText = desc;

    // Mostra botão de acessar se disciplina selecionada
    const accessBtn = previewCard.querySelector('.access-btn');
    if(disciplina){ 
        accessBtn.style.display='inline-block';
        accessBtn.innerText=`Acessar ${disciplina}`;
    } else {
        accessBtn.style.display='none';
    }

    // Atualiza mini-gráficos (exemplo genérico)
    miniData = {
        STD:[1.2,0.9,1.5,1.1,0.8],
        HH:[10,12,8,15,9],
        Custo:[10000,8000,12000,7000,5000],
        Medicao:[80,60,50,90,70]
    };

    const ctxIds = ['miniSTD','miniHH','miniCusto','miniMedicao'];
    const types = ['line','bar','bar','doughnut'];
    ctxIds.forEach((id,i)=>{
        if(window[id]) window[id].destroy();
        window[id] = new Chart(document.getElementById(id), {
            type:types[i],
            data:{ labels:['A1','A2','A3','A4','A5'], datasets:[{data:miniData[Object.keys(miniData)[i]], backgroundColor:'#004080', borderColor:'#004080', fill:types[i]=='line'}]},
            options:{ responsive:false, plugins:{legend:{display:false}}, scales:{x:{display:false},y:{display:false}} }
        });
    });
}

// Inicializa com PYCP
updatePreview('PYCP', null);

/* POINT END - main.js */
