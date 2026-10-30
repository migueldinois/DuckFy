(function () {
  const alertDefaults = {
    background: '#19191b',
    color: '#f4f4f5',
    confirmButtonColor: '#7c4dff',
    cancelButtonColor: '#555560',
    backdrop: 'rgba(8, 8, 12, 0.72)',
    zIndex: 10001,
    focusConfirm: false
  };

  const mostrar = (opcoes = {}) => {
    if (!window.Swal) {
      console.error('SweetAlert2 não foi carregado.');
      return Promise.resolve({ isConfirmed: false });
    }

    return window.Swal.fire({ ...alertDefaults, ...opcoes });
  };

  window.DuckFyAlert = {
    show(opcoes) {
      return mostrar(opcoes);
    },
    success(text, title = 'Tudo certo!') {
      return mostrar({ icon: 'success', title, text, confirmButtonText: 'Continuar' });
    },
    error(text, title = 'Não foi possível concluir') {
      return mostrar({ icon: 'error', title, text, confirmButtonText: 'Entendi' });
    },
    confirm(opcoes = {}) {
      return mostrar({
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Confirmar',
        cancelButtonText: 'Cancelar',
        reverseButtons: true,
        ...opcoes
      }).then((resultado) => resultado.isConfirmed);
    }
  };

  const mostrarMensagens = async () => {
    const criarConfiguracao = (elemento) => {
      const tipo = elemento.dataset.swalType;
      return {
        icon: tipo === 'success' || tipo === 'withdrawal' ? 'success' : tipo === 'error' ? 'error' : tipo === 'warning' ? 'warning' : 'info',
        title: tipo === 'success' ? 'Ação concluída' : tipo === 'withdrawal' ? 'Retirada concluída' : tipo === 'error' ? 'Confira esta informação' : tipo === 'warning' ? 'Atenção' : 'Aviso',
        text: elemento.dataset.swalMessage,
        confirmButtonText: 'Entendi'
      };
    };

    document.querySelectorAll('[data-swal-message][data-swal-modal]').forEach((elemento) => {
      const modal = document.querySelector(elemento.dataset.swalModal);
      modal?.addEventListener('shown.bs.modal', () => mostrar(criarConfiguracao(elemento)));
    });

    const mensagens = Array.from(document.querySelectorAll('[data-swal-message]:not([data-swal-modal])'));

    for (const elemento of mensagens) {
      await mostrar(criarConfiguracao(elemento));
    }
  };

  const formuláriosComErro = new WeakSet();
  document.addEventListener('invalid', (evento) => {
    evento.preventDefault();
    const campo = evento.target;
    const formulario = campo.form || campo;
    if (formuláriosComErro.has(formulario)) return;

    formuláriosComErro.add(formulario);
    mostrar({
      icon: 'warning',
      title: 'Verifique os dados',
      text: campo.validationMessage || 'Confira os campos obrigatórios.',
      confirmButtonText: 'Corrigir'
    }).then(() => {
      campo.focus({ preventScroll: true });
      formuláriosComErro.delete(formulario);
    });
  }, true);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mostrarMensagens, { once: true });
  } else {
    mostrarMensagens();
  }
})();