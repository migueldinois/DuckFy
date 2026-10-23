function configurarLancamentos() {
  const valorDigitado = document.querySelector('#valor-display');
  const valorEnviado = document.querySelector('#valor');

  if (valorDigitado && valorEnviado) {
    function atualizarValor() {
      let numerosDigitados = '';

      for (const caractere of valorDigitado.value) {
        if (caractere >= '0' && caractere <= '9') {
          numerosDigitados += caractere;
        }
      }

      numerosDigitados = numerosDigitados.slice(0, 15);

      if (numerosDigitados === '') {
        valorDigitado.value = '';
        valorEnviado.value = '';
        return;
      }

      const valorNumerico = Number(numerosDigitados) / 100;
      valorDigitado.value = valorNumerico.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      valorEnviado.value = valorNumerico.toFixed(2);
    }

    function limparValor() {
      valorDigitado.value = '';
      valorEnviado.value = '';
    }

    function limparValorDepoisDoReset() {
      window.setTimeout(limparValor);
    }

    valorDigitado.addEventListener('input', atualizarValor);
    valorDigitado.form?.addEventListener('reset', limparValorDepoisDoReset);
  }

  const campoCategoria = document.querySelector('#categoria-selecionada');
  const nomeCategoriaSelecionada = document.querySelector('#categoria-selecionada-nome');
  const botaoAbrirModalCategoria = document.querySelector('#abrir-modal-categorias');
  const modalCategoria = document.querySelector('#modal-selecionar-categoria');
  const botaoFecharModalCategoria = document.querySelector('#fechar-modal-categorias');
  const botoesCategoria = document.querySelectorAll('[data-category-choice]');
  const tiposTransacao = document.querySelectorAll('[name="tipo_transacao"]');

  function abrirModalCategoria() {
    if (!modalCategoria) return;

    modalCategoria.classList.add('active');
    modalCategoria.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function fecharModalCategoria() {
    if (!modalCategoria) return;

    modalCategoria.classList.remove('active');
    modalCategoria.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function obterTipoTransacao() {
    const tipoSelecionado = document.querySelector('[name="tipo_transacao"]:checked');
    return tipoSelecionado ? tipoSelecionado.value : 'saida';
  }

  function atualizarCategoriasVisiveis() {
    const tipo = obterTipoTransacao();

    botoesCategoria.forEach(function (botao) {
      botao.hidden = botao.dataset.categoryType !== tipo;
    });

    document.querySelectorAll('[data-category-empty]').forEach(function (aviso) {
      aviso.hidden = aviso.dataset.categoryEmpty !== tipo;
    });
  }

  function selecionarCategoria(botao) {
    if (!campoCategoria) return;

    campoCategoria.value = botao.dataset.categoryId;
    nomeCategoriaSelecionada.textContent = `Selecionada: ${botao.dataset.categoryName}`;

    botoesCategoria.forEach(function (opcao) {
      const mesmaCategoria = opcao.dataset.categoryId === botao.dataset.categoryId;
      opcao.classList.toggle('is-selected', mesmaCategoria);
    });

    if (botao.closest('.categoria-modal') && modalCategoria.classList.contains('active')) {
      fecharModalCategoria();
      botaoAbrirModalCategoria?.focus();
    }
  }

  function iniciarCategorias() {
    atualizarCategoriasVisiveis();

    const tipo = obterTipoTransacao();
    const primeiraCategoria = document.querySelector(
      `.categoria-modal-lista [data-category-choice][data-category-type="${tipo}"]`
    );

    if (primeiraCategoria) {
      selecionarCategoria(primeiraCategoria);
    } else if (nomeCategoriaSelecionada) {
      nomeCategoriaSelecionada.textContent = 'Nenhuma categoria cadastrada';
    }
  }

  botoesCategoria.forEach(function (botao) {
    botao.addEventListener('click', function () {
      selecionarCategoria(botao);
    });
  });

  botaoAbrirModalCategoria?.addEventListener('click', abrirModalCategoria);
  botaoFecharModalCategoria?.addEventListener('click', fecharModalCategoria);
  modalCategoria?.addEventListener('click', function (evento) {
    if (evento.target === modalCategoria) fecharModalCategoria();
  });
  document.addEventListener('keydown', function (evento) {
    if (evento.key === 'Escape' && modalCategoria?.classList.contains('active')) {
      fecharModalCategoria();
      botaoAbrirModalCategoria.focus();
    }
  });

  tiposTransacao.forEach(function (tipo) {
    tipo.addEventListener('change', function () {
      atualizarCategoriasVisiveis();

      const primeiraCategoria = document.querySelector(
        `.categoria-modal-lista [data-category-choice][data-category-type="${tipo.value}"]`
      );

      if (primeiraCategoria) {
        selecionarCategoria(primeiraCategoria);
      } else {
        campoCategoria.value = '';
        nomeCategoriaSelecionada.textContent = 'Nenhuma categoria cadastrada';
      }
    });
  });

  iniciarCategorias();

  const container = document.querySelector('#subcategoria-select');
  if (!container) return;

  const select = container.querySelector('#subcategoria');
  const trigger = container.querySelector('#subcategoria-trigger');
  const valueLabel = container.querySelector('#subcategoria-value');
  const listbox = container.querySelector('#subcategoria-options');
  const options = Array.from(listbox.querySelectorAll('[role="option"]'));
  const enabledOptions = options.filter((option) => option.getAttribute('aria-disabled') !== 'true');
  let activeIndex = -1;

  const syncSelection = () => {
    const selectedOption = select.selectedOptions[0];
    valueLabel.textContent = selectedOption.textContent;
    trigger.classList.toggle('has-placeholder', select.value === '');
    options.forEach((option) => {
      const isSelected = option.dataset.value === select.value && select.value !== '';
      option.setAttribute('aria-selected', String(isSelected));
    });
  };

  const setActiveOption = (index) => {
    activeIndex = (index + enabledOptions.length) % enabledOptions.length;
    options.forEach((option) => option.classList.remove('is-active'));
    const activeOption = enabledOptions[activeIndex];
    activeOption.classList.add('is-active');
    trigger.setAttribute('aria-activedescendant', activeOption.id);
  };

  const openListbox = () => {
    listbox.hidden = false;
    container.classList.add('is-open');
    trigger.setAttribute('aria-expanded', 'true');
    const selectedIndex = enabledOptions.findIndex((option) => option.dataset.value === select.value);
    setActiveOption(selectedIndex >= 0 ? selectedIndex : 0);
  };

  const closeListbox = (returnFocus = false) => {
    listbox.hidden = true;
    container.classList.remove('is-open');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.removeAttribute('aria-activedescendant');
    options.forEach((option) => option.classList.remove('is-active'));
    activeIndex = -1;
    if (returnFocus) trigger.focus();
  };

  const chooseOption = (option) => {
    if (option.getAttribute('aria-disabled') === 'true') return;
    select.value = option.dataset.value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    closeListbox(true);
  };

  options.forEach((option, index) => {
    option.id = `subcategoria-option-${index}`;
  });

  trigger.addEventListener('click', () => {
    if (listbox.hidden) openListbox();
    else closeListbox();
  });

  trigger.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (listbox.hidden) openListbox();
      else setActiveOption(activeIndex + (event.key === 'ArrowDown' ? 1 : -1));
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      if (listbox.hidden) openListbox();
      setActiveOption(event.key === 'Home' ? 0 : enabledOptions.length - 1);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (listbox.hidden) openListbox();
      else if (activeIndex >= 0) chooseOption(enabledOptions[activeIndex]);
    } else if (event.key === 'Escape' && !listbox.hidden) {
      event.preventDefault();
      closeListbox(true);
    }
  });

  listbox.addEventListener('click', (event) => {
    const option = event.target.closest('[role="option"]');
    if (option) chooseOption(option);
  });

  listbox.addEventListener('pointerover', (event) => {
    const option = event.target.closest('[role="option"]');
    const index = enabledOptions.indexOf(option);
    if (index >= 0) setActiveOption(index);
  });

  select.addEventListener('change', syncSelection);
  document.addEventListener('click', (event) => {
    if (!container.contains(event.target)) closeListbox();
  });
  select.form?.addEventListener('reset', () => window.setTimeout(syncSelection));

  syncSelection();
}

configurarLancamentos();