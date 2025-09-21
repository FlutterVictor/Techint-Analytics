// POINT INITIAL - main.js

// Dados do usuário
const user = {
    name: "José Victor Silva de Jesus",
    role: "Analista de Dados Jr",
    photo: "assets/imagens/logo-por_cuadrado.jpeg",
    authorizedProjects: ["PCI Usiminas","MOA Usiminas"] // projetos liberados
};

// Referências
const userImg = document.getElementById("userPhoto");
const userName = document.querySelector(".user-section .name");
const userRole = document.querySelector(".user-section .role");
const dashboardList = document.querySelectorAll("#dashboardList li");
const previewCard = document.getElementById("previewCard");

// Atualiza usuário
function loadUser() {
    userImg.src = user.photo;
    userName.textContent = user.name;
    userRole.textContent = user.role;
}

// Controle de projeto
function selectProject(dashboardName) {
    // Cria card de seleção
    let projectCard = document.getElementById("projectCard");
    if(!projectCard){
        projectCard = document.createElement("div");
        projectCard.id = "projectCard";
        previewCard.appendChild(projectCard);
    }
    projectCard.innerHTML = "<h3>Selecione o projeto para "+dashboardName+"</h3>";
    user.authorizedProjects.push("Projeto restrito"); // simula projeto restrito
    user.authorizedProjects.forEach(proj=>{
        let btn = document.createElement("button");
        btn.textContent = proj;
        btn.onclick = ()=>{
            if(proj==="Projeto restrito"){
                showRestricted();
            } else {
                showLoading(proj);
            }
        };
        projectCard.appendChild(btn);
    });
    projectCard.style.display = "block";
}

// Mensagem de acesso restrito
function showRestricted(){
    let msg = document.getElementById("restrictedMsg");
    if(!msg){
        msg = document.createElement("div");
        msg.id="restrictedMsg";
        previewCard.appendChild(msg);
    }
    msg.textContent = "Acesso restrito, entre em contato com o administrador do sistema ou seu superior direto para solicitar acesso.";
    msg.style.display="block";
}

// Simula atualização de projeto
function showLoading(project){
    previewCard.innerHTML="<p>Atualizando "+project+" ...</p><div class='loader'></div>";
    setTimeout(()=>{ 
        previewCard.innerHTML="<p>Dashboard atualizado para "+project+"</p><button id='accessBtn'>Acessar Dashboard</button>";
    },1500);
}

// Evento dashboards
dashboardList.forEach(item=>{
    item.addEventListener("click",()=>{
        selectProject(item.dataset.dashboard);
    });
});

// Logout
document.getElementById("logoutBtn").addEventListener("click",()=>{
    alert("Logout efetuado");
});

// Inicializa
loadUser();

// POINT END - main.js
