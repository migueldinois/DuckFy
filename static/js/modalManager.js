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
        return;
      }

      const btnFechar = e.target.closest('[data-close-modal]');
      if (btnFechar) {
        e.preventDefault();
        const modal = btnFechar.closest('.duckfy-modal');
        if (modal) ModalManager.fechar(modal.id);
        return;
      }

      const btnExcluir = e.target.closest('#btnExcluirCategoria');
      if (btnExcluir) {
        e.preventDefault();
        const id = document.getElementById('edit_id_categoria')?.value;

        if (!id) return;

        window.DuckFyAlert.confirm({
          title: 'Excluir categoria?',
          text: 'Essa ação não pode ser desfeita.',
          confirmButtonText: 'Excluir categoria'
        }).then((confirmado) => {
          if (!confirmado) return;
          const formDeletar = document.getElementById('formDeletarCategoria');
          if (formDeletar) {
            formDeletar.action = `/categorias/deletar/${id}`;
            formDeletar.submit();
          }
        });
      }
    });
  }
};

function abrirModalEditarCategoria(dados) {
  if (!dados) return;

  const inputId = document.getElementById('edit_id_categoria');
  const inputNome = document.getElementById('edit_nome');
  const selectTipo = document.getElementById('edit_tipo');
  const inputEmoji = document.getElementById('edit_emoji');
  const inputCor = document.getElementById('edit_cor');
  const linkSubcats = document.getElementById('btnIrSubcategorias');

  if (inputId) inputId.value = dados.id;
  if (inputNome) inputNome.value = dados.nome;
  if (selectTipo) selectTipo.value = dados.tipo;
  if (inputEmoji) inputEmoji.value = dados.emoji;
  if (inputCor) {
    inputCor.value = dados.cor;
    atualizarCorPreviewEdit(dados.cor);
  }
  if (linkSubcats) {
    linkSubcats.href = `/categorias/${dados.id}/subcategorias`;
  }

  ModalManager.abrir('modalEditarCategoria');
}

function validarApenasUmEmoji(input) {
  const regexEmoji = /[\p{Extended_Pictographic}\p{Emoji_Presentation}\p{Regional_Indicator}\u20E3]/u;
  const segmenter = new Intl.Segmenter('pt', { granularity: 'grapheme' });
  const segmentos = Array.from(segmenter.segment(input.value));

  if (segmentos.length > 1) {
    input.value = segmentos[0].segment;
  }

  if (input.value && !regexEmoji.test(input.value)) {
    input.value = '';
    input.setCustomValidity('Insira apenas 1 emoji válido.');
  } else {
    input.setCustomValidity('');
  }
}

function atualizarCorPreview(corHex) {
  const box = document.getElementById('colorBox');
  if (box) box.style.backgroundColor = corHex;
}

function atualizarCorPreviewEdit(corHex) {
  const box = document.getElementById('editColorBox');
  if (box) box.style.backgroundColor = corHex;
}

function preencherEAbrirModalEdit(event, elemento) {
  event.preventDefault();
  const dados = {
    id: elemento.getAttribute('data-id'),
    nome: elemento.getAttribute('data-nome'),
    tipo: elemento.getAttribute('data-tipo'),
    emoji: elemento.getAttribute('data-emoji'),
    cor: elemento.getAttribute('data-cor')
  };
  abrirModalEditarCategoria(dados);
}

document.addEventListener('DOMContentLoaded', () => ModalManager.inicializar());
