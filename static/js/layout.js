document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.getElementById("sidebar");
  const logo = sidebar?.querySelector(".sidebar-logo");
  const movimentoReduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let trocaLogoTimeout;

  function atualizarLogoSidebar(animar = true) {
    if (!sidebar || !logo) return;

    const recolhida = sidebar.classList.contains("collapsed");
    const temaClaro = document.documentElement.classList.contains("tema-claro");
    const paleta = localStorage.getItem("duckfy-daltonismo") || "normal";
    const chavePaleta = `logoRecolhida${paleta.charAt(0).toUpperCase()}${paleta.slice(1)}`;
    const origemRecolhida = logo.dataset[chavePaleta]
      || (temaClaro ? logo.dataset.logoRecolhidaClaro : logo.dataset.logoRecolhidaEscuro)
      || logo.dataset.logoRecolhida;
    const origem = recolhida
      ? origemRecolhida
      : temaClaro
        ? logo.dataset.logoClaro
        : logo.dataset.logoEscuro;

    if (!origem || logo.getAttribute("src") === origem) return;

    window.clearTimeout(trocaLogoTimeout);
    if (!animar || movimentoReduzido) {
      logo.classList.remove("is-changing");
      logo.src = origem;
      return;
    }

    logo.classList.add("is-changing");
    trocaLogoTimeout = window.setTimeout(() => {
      logo.src = origem;
      requestAnimationFrame(() => logo.classList.remove("is-changing"));
    }, 180);
  }

  if (sidebar) {
    sidebar.addEventListener("mouseenter", () => {
      sidebar.classList.remove("collapsed");
      atualizarLogoSidebar();
    });

    sidebar.addEventListener("mouseleave", () => {
      sidebar.classList.add("collapsed");
      atualizarLogoSidebar();
    });

    atualizarLogoSidebar(false);
  }

  document.addEventListener("duckfy:logo-update", () => atualizarLogoSidebar());

  const conteudoPrincipal = document.querySelector(".main-content");
  const linksNavegacao = document.querySelectorAll(
    ".sidebar-link[href], .bottom-bar a.nav-icon-btn[href], .bottom-bar .dropdown-menu a[href]"
  );

  linksNavegacao.forEach((link) => {
    link.addEventListener("click", (event) => {
      if (
        !conteudoPrincipal ||
        movimentoReduzido ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        link.hasAttribute("download") ||
        (link.target && link.target !== "_self")
      ) return;

      const destino = new URL(link.href, window.location.href);
      if (destino.origin !== window.location.origin || destino.href === window.location.href) return;

      event.preventDefault();
      conteudoPrincipal.classList.add("is-leaving");
      window.setTimeout(() => window.location.assign(destino.href), 350);
    });
  });

  const dropdownTrigger = document.querySelector(".dropdown-trigger");
  const dropdownMenu = document.querySelector(".dropdown-trigger .dropdown-menu");

  if (dropdownTrigger && dropdownMenu) {
    dropdownTrigger.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdownMenu.classList.toggle("show");
    });

    document.addEventListener("click", () => {
      dropdownMenu.classList.remove("show");
    });
  }
});
