const ModalManager = {
  abrir(idModal) {
    const modal = document.getElementById(idModal);
    if (modal) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  },

  fechar(idModal) {
    const modal = document.getElementById(idModal);
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  },

  inicializar() {
    document.addEventListener('click', (e) => {
      const btnAbrir = e.target.closest('[data-open-modal]');
      if (btnAbrir) {
        e.preventDefault();
        const idModal = btnAbrir.getAttribute('data-open-modal');
        ModalManager.abrir(idModal);
      }

      const btnFechar = e.target.closest('[data-close-modal]');
      if (btnFechar) {
        e.preventDefault();
        const modal = btnFechar.closest('.duckfy-modal');
        if (modal) ModalManager.fechar(modal.id);
      }
    });
  }
};

document.addEventListener('DOMContentLoaded', () => ModalManager.inicializar());