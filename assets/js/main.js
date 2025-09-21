// POINT INITIAL - main.js completo

// ------------------ Dados do usuário ------------------
const user = {
    nome: "José Victor Silva de Jesus",
    cargo: "Analista de Dados Jr",
    foto: "assets/imagens/logo-por_cuadrado.jpeg"
};

// ------------------ Projetos disponíveis ------------------
const projetos = [
    { nome: "Projeto PCI Usiminas", colaboradores: 1087, acesso: true },
    { nome: "Projeto MOA Usiminas", colaboradores: 355, acesso: true },
    { nome: "Projeto Restrito", colaboradores: 50, acesso: false }
];

// ------------------ Carrega informações do usuário ------------------
const userPhoto = document.getElementById("userPhoto");
const userName = document.querySelector(".user-section-top .name");
const userRole = document.querySelector(".user-section-top .role");
const currentProject = document.getElementById("currentProject");

if(userPhoto) userPhoto.src = user.foto;
if(userName) userName.textContent = user.nome;
if(userRole) userRole.textContent = user.cargo;
if(currentProject) currentProject.textContent = "Selecionar Projeto";

// ------------------ Lista de dashboards ------------------
const dashboardItems = document.querySelectorAll("#dashboardList li");
const previewCard = document.getElementById("previewCard");
const accessBtn = document.getElementById("accessBtn");

dashboardItems.forEach(item => {
    item.addEventListener("click", () => {
        const dashboardName = item.textContent;
        if(previewCard){
            previewCard.querySelector("p").textContent = `Pré-visualização do Dashboard ${dashboardName}`;
            accessBtn.textContent = `Acessar ${dashboardName}`;
        }
    });
});

// ------------------ Seleção de projeto ------------------
currentProject.addEventListener("click", () => {
    let projectCard = document.getElementById("projectCard");
    if(!projectCard){
        projectCard = document.createElement("div");
        projectCard.id = "projectCard";
        projectCard.style.textAlign = "center";
        projectCard.style.marginTop = "5px";

        projetos.forEach((proj, idx) => {
            const btn = document.createElement("button");
            btn.textContent = proj.nome;
            btn.addEventListener("click", () => selectProject(idx));
            projectCard.appendChild(btn);
        });

        document.getElementById("mainContent").appendChild(projectCard);
    }
    projectCard.style.display = "block";
});

function selectProject(idx){
    const proj = projetos[idx];
    const projectCard = document.getElementById("projectCard");

    // Remove mensagens antigas
    const oldMsg = document.getElementById("restrictedMsg");
    if(oldMsg) oldMsg.remove();

    // Cria loader
    const loader = document.createElement("div");
    loader.classList.add("loader");
    projectCard.appendChild(loader);

    setTimeout(() => {
        loader.remove();
        if(proj.acesso){
            currentProject.textContent = proj.nome;
            projectCard.style.display = "none";
            // Aqui você pode atualizar os dashboards com dados do projeto
        } else {
            const msg = document.createElement("div");
            msg.id = "restrictedMsg";
            msg.textContent = "Acesso restrito, entre em contato com o administrador do sistema ou seu superior direto para solicitar acesso";
            projectCard.appendChild(msg);
        }
    }, 1000);
}

// ------------------ Botão Acessar Dashboard ------------------
if(accessBtn){
    accessBtn.addEventListener("click", () => {
        showProjectCard();
    });
}

function showProjectCard(){
    currentProject.click();
}

// ------------------ Logout ------------------
const logoutBtn = document.getElementById("logoutBtn");
if(logoutBtn){
    logoutBtn.addEventListener("click", () => {
        alert("Logout realizado!");
        // Aqui você pode redirecionar para login ou limpar sessão
        // Ex: window.location.href = "login.html";
    });
}

// POINT END - main.js completo
