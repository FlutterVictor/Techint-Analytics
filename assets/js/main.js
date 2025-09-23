/* POINT INITIAL - Menu JS */
document.addEventListener("DOMContentLoaded", () => {
  const menuItems = document.querySelectorAll(".menu ul li");
  const preview = document.getElementById("dashboard-preview");
  const projectName = document.getElementById("project-name");
  const projectModal = document.getElementById("project-selection");
  const confirmBtn = document.getElementById("confirm-project");
  const projectOptions = document.querySelectorAll(".project-option");
  const errorMsg = document.getElementById("error-msg");

  let selectedProject = null;

  // Mockups de dashboards
  const dashboards = {
    pycp: {
      title: "Sistema de Gerenciamento - PYCP",
      content: "<p>Mockup de gráficos de planejamento, custos e medições.</p>"
    },
    rh: {
      title: "Sistema de Gerenciamento - RH",
      content: "<p>Mockup de gráficos de Recursos Humanos e Finanças.</p>"
    },
    producao: {
      title: "Sistema de Gerenciamento - Produção",
      content: "<p>Mockup de gráficos de Produção e Avanços de Obra.</p>"
    },
    suprimentos: {
      title: "Sistema de Gerenciamento - Suprimentos",
      content: "<p>Mockup de gráficos de Compras e Almoxarifado.</p>"
    },
    qsms: {
      title: "Sistema de Gerenciamento - QSMS",
      content: "<p>Mockup de gráficos de Qualidade, Segurança e Meio Ambiente.</p>"
    }
  };

  // Alternar entre dashboards
  menuItems.forEach(item => {
    item.addEventListener("click", () => {
      const key = item.getAttribute("data-dashboard");
      if (dashboards[key]) {
        preview.innerHTML = `
          <div class="card-preview">
            <h2>${dashboards[key].title}</h2>
            ${dashboards[key].content}
            <button onclick="alert('Acessando ${dashboards[key].title}')">
              Acessar ${dashboards[key].title}
            </button>
          </div>
        `;
      }
    });
  });

  // Seleção de projetos
  projectName.addEventListener("click", () => {
    projectModal.style.display = "block";
    errorMsg.textContent = "";
  });

  projectOptions.forEach(option => {
    option.addEventListener("click", () => {
      selectedProject = option.getAttribute("data-project");
      projectOptions.forEach(opt => opt.style.background = "");
      option.style.background = "#d0e7ff";
    });
  });

  confirmBtn.addEventListener("click", () => {
    if (!selectedProject) {
      errorMsg.textContent = "Selecione um projeto primeiro!";
      return;
    }
    if (selectedProject === "restrito") {
      projectModal.style.display = "none";
      alert("Acesso restrito, entre em contato com o administrador do sistema ou seu superior direto para solicitar acesso.");
    } else {
      projectName.textContent = selectedProject;
      projectModal.style.display = "none";
    }
  });

  // Fechar modal clicando fora
  window.addEventListener("click", (e) => {
    if (e.target === projectModal) {
      projectModal.style.display = "none";
    }
  });
});
/* POINT END - Menu JS */
