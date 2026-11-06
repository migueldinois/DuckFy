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

  const etapasWizard = document.querySelectorAll('[data-wizard-step]');
  const etapasProgresso = document.querySelectorAll('[data-progress-step]');
  const indicadorEtapa = document.querySelector('#lancamento-step-count');
  const botaoContinuar = document.querySelector('[data-wizard-continue]');
  const botoesVoltar = document.querySelectorAll('[data-wizard-back]');
  const avisoWizard = document.querySelector('#lancamento-wizard-feedback');
  const botoesSelecionarConta = document.querySelectorAll('[data-account-select]');
  const campoConta = document.querySelector('#id_conta');
  const resumoConta = document.querySelector('#lancamento-conta-resumo');
  const nomeResumoConta = document.querySelector('#lancamento-conta-resumo-nome');
  const formularioLancamento = document.querySelector('.lancamento-wizard-form');
  const botoesAlterarConta = document.querySelectorAll('[data-account-trigger]');

  function definirEtapaWizard(etapa) {
    etapasWizard.forEach(function (painel) {
      painel.hidden = Number(painel.dataset.wizardStep) !== etapa;
      painel.classList.toggle('is-active', !painel.hidden);
    });

    etapasProgresso.forEach(function (item) {
      const numeroEtapa = Number(item.dataset.progressStep);
      item.classList.toggle('is-current', numeroEtapa === etapa);
      item.classList.toggle('is-complete', numeroEtapa < etapa);
      if (numeroEtapa === etapa) {
        item.setAttribute('aria-current', 'step');
      } else {
        item.removeAttribute('aria-current');
      }
    });

    if (indicadorEtapa) indicadorEtapa.textContent = `Etapa ${etapa} de 3`;
  }

  function mostrarEtapaConta() {
    definirEtapaWizard(2);
    document.querySelector('[data-account-select]')?.focus();
  }

  function navegarParaEtapa(etapa) {
    const tipoSelecionado = document.querySelector('[data-wizard-type]:checked');

    if (etapa === 1) {
      definirEtapaWizard(1);
      return;
    }

    if (!tipoSelecionado) {
      definirEtapaWizard(1);
      if (avisoWizard) avisoWizard.hidden = false;
      document.querySelector('[data-wizard-type]')?.focus();
      return;
    }

    if (etapa === 2) {
      mostrarEtapaConta();
      return;
    }

    if (!campoConta?.value) {
      mostrarEtapaConta();
      return;
    }

    definirEtapaWizard(3);
    document.querySelector('#local')?.focus();
  }

  etapasProgresso.forEach(function (item) {
    item.addEventListener('click', function () {
      navegarParaEtapa(Number(item.dataset.progressStep));
    });
  });

  botaoContinuar?.addEventListener('click', function () {
    const tipoSelecionado = document.querySelector('[data-wizard-type]:checked');
    if (!tipoSelecionado) {
      if (avisoWizard) avisoWizard.hidden = false;
      return;
    }

    if (avisoWizard) avisoWizard.hidden = true;
    mostrarEtapaConta();
  });

  botoesVoltar.forEach(function (botao) {
    botao.addEventListener('click', function () {
      const etapaDestino = Number(botao.dataset.wizardBack);
      definirEtapaWizard(etapaDestino);
      if (etapaDestino === 1) document.querySelector('[data-wizard-type]:checked')?.focus();
      if (etapaDestino === 2) document.querySelector('[data-account-select]')?.focus();
    });
  });

  botoesSelecionarConta.forEach(function (botao) {
    botao.addEventListener('click', function () {
      if (campoConta) campoConta.value = botao.dataset.accountId || '';
      if (nomeResumoConta) nomeResumoConta.textContent = botao.dataset.accountName || '';
      if (resumoConta) resumoConta.hidden = false;
      definirEtapaWizard(3);
      document.querySelector('#local')?.focus();
    });
  });

  botoesAlterarConta.forEach(function (botao) {
    botao.addEventListener('click', function () {
      mostrarEtapaConta();
    });
  });

  definirEtapaWizard(1);

  const campoCategoria = document.querySelector('#categoria-selecionada');
  const nomeCategoriaSelecionada = document.querySelector('#categoria-selecionada-nome');
  const botaoAbrirModalCategoria = document.querySelector('#abrir-modal-categorias');
  const modalCategoria = document.querySelector('#modal-selecionar-categoria');
  const botaoFecharModalCategoria = document.querySelector('#fechar-modal-categorias');
  const botoesCategoria = document.querySelectorAll('[data-category-choice]');
  const tiposTransacao = document.querySelectorAll('[name="tipo_transacao"]');
  const botoesAdicionarCategoria = document.querySelectorAll('[data-category-create]');

  botoesCategoria.forEach(function (botao) {
    const cor = botao.dataset.categoryColor;
    if (cor && /^#[\da-f]{6}$/i.test(cor)) {
      botao.style.setProperty('--category-color', cor);
    }
  });

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
    return tipoSelecionado ? tipoSelecionado.value : '';
  }

  function atualizarCategoriasVisiveis() {
    const tipo = obterTipoTransacao();

    botoesCategoria.forEach(function (botao) {
      botao.hidden = botao.dataset.categoryType !== tipo;
    });

    botoesAdicionarCategoria.forEach(function (botao) {
      botao.hidden = botao.dataset.categoryCreate !== tipo;
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
    if (!tipo) {
      if (nomeCategoriaSelecionada) nomeCategoriaSelecionada.textContent = 'Escolha o tipo para ver as categorias';
      return;
    }

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
      if (avisoWizard) avisoWizard.hidden = true;
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

  formularioLancamento?.addEventListener('submit', function (evento) {
    const tipoSelecionado = document.querySelector('[name="tipo_transacao"]:checked');
    if (!tipoSelecionado || !campoConta?.value) {
      evento.preventDefault();
      if (!tipoSelecionado) {
        definirEtapaWizard(1);
        if (avisoWizard) avisoWizard.hidden = false;
      } else {
        mostrarEtapaConta();
      }
    }
  });

  iniciarCategorias();
  window.carregarEmojisIOS?.();
}

configurarLancamentos();