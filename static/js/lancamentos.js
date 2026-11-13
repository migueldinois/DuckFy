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

    if (!valorDigitado.value && valorEnviado.value) {
      const valorRestaurado = Number(valorEnviado.value);
      if (Number.isFinite(valorRestaurado)) {
        valorDigitado.value = valorRestaurado.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
      }
    }
  }

  const etapasWizard = document.querySelectorAll('[data-wizard-step]');
  const paginaLancamento = document.querySelector('#page-lancamento');
  const etapasProgresso = document.querySelectorAll('[data-progress-step]');
  const indicadorEtapa = document.querySelector('#lancamento-step-count');
  const botaoContinuar = document.querySelector('[data-wizard-continue]');
  const botoesVoltar = document.querySelectorAll('[data-wizard-back]');
  const avisoSaldo = document.querySelector('#saldo-insuficiente');
  const botoesSelecionarConta = document.querySelectorAll('[data-account-select]');
  const painelContas = document.querySelector('.lancamento-account-page-panel');
  const campoConta = document.querySelector('#id_conta');
  const resumoConta = document.querySelector('#lancamento-conta-resumo');
  const nomeResumoConta = document.querySelector('#lancamento-conta-resumo-nome');
  const saldoResumoConta = document.querySelector('#lancamento-conta-resumo-saldo');
  const formularioLancamento = document.querySelector('.lancamento-wizard-form');
  const formularioCriarConta = document.querySelector('[data-account-create-form]');
  const feedbackCriarConta = document.querySelector('[data-account-form-feedback]');
  const inputSaldoNovaConta = document.querySelector('#saldo_atual');
  const previaSaldoNovaConta = document.querySelector('#previaSaldoNovoBanco');
  const botoesAlterarConta = document.querySelectorAll('[data-account-trigger]');
  let saldoContaSelecionada = null;

  function mostrarAvisoTipoObrigatorio() {
    window.DuckFyAlert?.show({
      icon: 'warning',
      title: 'Tipo obrigatório',
      text: 'Selecione entrada ou saída para continuar.',
      confirmButtonText: 'Entendi',
    });
  }

  function mostrarErroSaldo(mensagem) {
    if (window.DuckFyAlert?.error) {
      if (avisoSaldo) avisoSaldo.hidden = true;
      window.DuckFyAlert.error(mensagem, 'Saldo insuficiente');
      return;
    }

    if (avisoSaldo) {
      avisoSaldo.textContent = mensagem;
      avisoSaldo.hidden = false;
      avisoSaldo.focus();
    }
  }

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
    document.querySelector('[data-account-select], [data-open-modal="modalAdicionarBanco"]')?.focus();
  }

  function atualizarResumoConta(botao) {
    if (!botao) return;

    if (campoConta) campoConta.value = botao.dataset.accountId || '';
    if (nomeResumoConta) nomeResumoConta.textContent = botao.dataset.accountName || '';
    saldoContaSelecionada = Number(botao.dataset.accountBalance || 0);
    if (saldoResumoConta) {
      saldoResumoConta.textContent = `Saldo: ${saldoContaSelecionada.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      })}`;
    }
    if (resumoConta) resumoConta.hidden = false;
  }

  function atualizarPreviaSaldoNovaConta() {
    if (!inputSaldoNovaConta || !previaSaldoNovaConta) return;

    const textoValor = inputSaldoNovaConta.value.trim();
    const valor = Number(textoValor.replace(/\./g, '').replace(',', '.'));
    previaSaldoNovaConta.textContent = `R$ ${Number.isFinite(valor)
      ? valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : '0,00'}`;
  }

  function mostrarFeedbackCriarConta(mensagem) {
    if (feedbackCriarConta) {
      feedbackCriarConta.textContent = mensagem;
      feedbackCriarConta.hidden = false;
      return;
    }

    if (window.DuckFyAlert?.error) {
      window.DuckFyAlert.error(mensagem, 'Erro ao criar conta');
      return;
    }

    console.error(mensagem);
  }

  function configurarBotaoSelecaoConta(botao) {
    botao.addEventListener('click', function () {
      atualizarResumoConta(botao);
      definirEtapaWizard(3);
      document.querySelector('#local')?.focus();
    });
  }

  function criarOpcaoConta(conta) {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'lancamento-account-option';
    botao.dataset.accountSelect = '';
    botao.dataset.accountId = String(conta.id_conta);
    botao.dataset.accountName = conta.nome_conta;
    botao.dataset.accountBalance = conta.saldo_atual;

    const icone = document.createElement('span');
    icone.className = 'lancamento-account-option-icon';
    icone.setAttribute('aria-hidden', 'true');
    const iconeBanco = document.createElement('i');
    iconeBanco.className = 'bi bi-bank';
    icone.append(iconeBanco);

    const texto = document.createElement('span');
    texto.className = 'lancamento-account-option-copy';
    const nome = document.createElement('strong');
    nome.textContent = conta.nome_conta;
    const detalhes = document.createElement('small');
    detalhes.textContent = `${conta.tipo_conta} · Saldo: R$ ${conta.saldo_formatado}`;
    texto.append(nome, detalhes);

    const seta = document.createElement('i');
    seta.className = 'bi bi-arrow-right lancamento-account-option-arrow';
    seta.setAttribute('aria-hidden', 'true');
    botao.append(icone, texto, seta);
    return botao;
  }

  function exibirNovaConta(conta) {
    if (!painelContas) return null;

    let listaContas = painelContas.querySelector('.lancamento-account-list');
    if (!listaContas) {
      listaContas = document.createElement('div');
      listaContas.className = 'lancamento-account-list';
      listaContas.setAttribute('aria-label', 'Contas bancárias');
      painelContas.replaceChildren(listaContas);
    }

    const botaoConta = criarOpcaoConta(conta);
    listaContas.prepend(botaoConta);
    configurarBotaoSelecaoConta(botaoConta);
    return botaoConta;
  }

  function configurarFormularioCriarConta() {
    if (!formularioCriarConta) return;

    inputSaldoNovaConta?.addEventListener('currency:formatted', atualizarPreviaSaldoNovaConta);
    inputSaldoNovaConta?.addEventListener('input', atualizarPreviaSaldoNovaConta);
    atualizarPreviaSaldoNovaConta();

    formularioCriarConta.addEventListener('input', function () {
      if (feedbackCriarConta) {
        feedbackCriarConta.hidden = true;
        feedbackCriarConta.textContent = '';
      }
    });

    formularioCriarConta.addEventListener('submit', async function (evento) {
      evento.preventDefault();

      const botaoEnviar = formularioCriarConta.querySelector('[type="submit"]');
      const textoBotaoOriginal = botaoEnviar?.textContent;
      if (feedbackCriarConta) {
        feedbackCriarConta.hidden = true;
        feedbackCriarConta.textContent = '';
      }
      if (botaoEnviar) {
        botaoEnviar.disabled = true;
        botaoEnviar.textContent = 'Salvando...';
      }

      let botaoContaCriada;
      try {
        const resposta = await fetch(formularioCriarConta.action, {
          method: 'POST',
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json',
          },
          body: new FormData(formularioCriarConta),
        });
        const resultado = await resposta.json();

        if (!resposta.ok || !resultado.success) {
          mostrarFeedbackCriarConta(resultado.message || 'Não foi possível criar a conta bancária.');
          return;
        }

        if (!resultado.account || !resultado.account.id_conta) {
          throw new Error('A resposta do servidor não contém a conta criada.');
        }

        botaoContaCriada = exibirNovaConta(resultado.account);
        if (!botaoContaCriada) {
          throw new Error('Não foi possível atualizar a lista de contas do lançamento.');
        }

        formularioCriarConta.reset();
        atualizarPreviaSaldoNovaConta();
        ModalManager.fechar('modalAdicionarBanco');
      } catch (erro) {
        console.error('Erro ao criar conta pelo lançamento:', erro);
        mostrarFeedbackCriarConta('Não foi possível salvar a conta. Verifique sua conexão e tente novamente.');
        return;
      } finally {
        if (botaoEnviar) {
          botaoEnviar.disabled = false;
          botaoEnviar.textContent = textoBotaoOriginal;
        }
      }

      window.DuckFyAlert.success(
        'A conta foi criada. Selecione-a na lista para continuar o lançamento.',
        'Conta adicionada!'
      ).then(function () {
        botaoContaCriada.focus();
      });
    });
  }

  function navegarParaEtapa(etapa) {
    const tipoSelecionado = document.querySelector('[data-wizard-type]:checked');

    if (etapa === 1) {
      definirEtapaWizard(1);
      return;
    }

    if (!tipoSelecionado) {
      definirEtapaWizard(1);
      mostrarAvisoTipoObrigatorio();
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
      mostrarAvisoTipoObrigatorio();
      return;
    }

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

  botoesSelecionarConta.forEach(configurarBotaoSelecaoConta);

  botoesAlterarConta.forEach(function (botao) {
    botao.addEventListener('click', function () {
      mostrarEtapaConta();
    });
  });

  const contaRestaurada = Array.from(botoesSelecionarConta).find(function (botao) {
    return botao.dataset.accountId === campoConta?.value;
  });
  if (contaRestaurada) atualizarResumoConta(contaRestaurada);

  const etapaInicial = Number(paginaLancamento?.dataset.initialStep) || 1;
  definirEtapaWizard(etapaInicial === 3 && contaRestaurada ? 3 : 1);
  if (avisoSaldo && !avisoSaldo.hidden) {
    mostrarErroSaldo(avisoSaldo.textContent.trim());
  }
  configurarFormularioCriarConta();

  const campoCategoria = document.querySelector('#categoria-selecionada');
  const nomeCategoriaSelecionada = document.querySelector('#categoria-selecionada-nome');
  const botaoAbrirModalCategoria = document.querySelector('#abrir-modal-categorias');
  const modalCategoria = document.querySelector('#modal-selecionar-categoria');
  const botaoFecharModalCategoria = document.querySelector('#fechar-modal-categorias');
  let botoesCategoria = Array.from(document.querySelectorAll('[data-category-choice]'));
  const tiposTransacao = document.querySelectorAll('[name="tipo_transacao"]');
  const botoesAdicionarCategoria = Array.from(document.querySelectorAll('[data-category-create]'));
  const formularioCriarCategoria = document.querySelector('[data-category-create-form]');
  const feedbackCriarCategoria = document.querySelector('[data-category-form-feedback]');
  const tipoNovaCategoria = document.querySelector('#tipo');
  const nomeNovaCategoria = document.querySelector('#nome');
  const emojiNovaCategoria = document.querySelector('#emoji');
  const tituloModalCriarCategoria = document.querySelector('#titulo-modal-criar-categoria');

  function configurarBotaoCategoria(botao) {
    const cor = botao.dataset.categoryColor;
    if (cor && /^#[\da-f]{6}$/i.test(cor)) {
      botao.style.setProperty('--category-color', cor);
    }

    botao.addEventListener('click', function () {
      selecionarCategoria(botao);
    });
  }

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
    const corCategoria = botao.dataset.categoryColor;
    if (corCategoria && /^#[\da-f]{6}$/i.test(corCategoria)) {
      nomeCategoriaSelecionada.style.setProperty('--category-color', corCategoria);
    } else {
      nomeCategoriaSelecionada.style.removeProperty('--category-color');
    }

    botoesCategoria.forEach(function (opcao) {
      const mesmaCategoria = opcao.dataset.categoryId === botao.dataset.categoryId;
      opcao.classList.toggle('is-selected', mesmaCategoria);
    });

    if (botao.closest('.categoria-modal') && modalCategoria?.classList.contains('active')) {
      fecharModalCategoria();
      botaoAbrirModalCategoria?.focus();
    }
  }

  function criarOpcaoCategoria(categoria, dentroDoModal) {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.className = dentroDoModal ? 'categoria-modal-opcao' : 'btn-categoria-icon';
    botao.dataset.categoryChoice = '';
    botao.dataset.categoryType = categoria.tipo;
    botao.dataset.categoryId = String(categoria.id_categoria);
    botao.dataset.categoryName = categoria.nome;
    botao.dataset.categoryColor = categoria.cor;
    botao.title = categoria.nome;
    botao.setAttribute('aria-label', categoria.nome);

    const emoji = document.createElement('span');
    emoji.className = dentroDoModal ? 'categoria-modal-emoji emoji-ios' : 'emoji-ios';
    emoji.textContent = categoria.emoji;
    botao.append(emoji);

    if (dentroDoModal) {
      const nome = document.createElement('span');
      nome.textContent = categoria.nome;
      botao.append(nome);
    }

    configurarBotaoCategoria(botao);
    return botao;
  }

  function exibirNovaCategoria(categoria) {
    const categoriasRapidas = document.querySelector('#categorias-rapidas');
    const listaCategoriasModal = document.querySelector('.categoria-modal-lista');
    if (!categoriasRapidas || !listaCategoriasModal) return null;

    const botaoRapido = criarOpcaoCategoria(categoria, false);
    const botaoVerTodas = document.querySelector('#abrir-modal-categorias');
    categoriasRapidas.insertBefore(botaoRapido, botaoVerTodas);

    const botaoModal = criarOpcaoCategoria(categoria, true);
    const avisoVazio = listaCategoriasModal.querySelector(
      `[data-category-empty="${categoria.tipo}"]`
    );
    if (avisoVazio) {
      avisoVazio.remove();
    }
    listaCategoriasModal.append(botaoModal);

    botoesCategoria.push(botaoRapido, botaoModal);
    const botaoAdicionar = botoesAdicionarCategoria.find(function (botao) {
      return botao.dataset.categoryCreate === categoria.tipo;
    });
    botaoAdicionar?.remove();

    atualizarCategoriasVisiveis();
    selecionarCategoria(botaoRapido);
    return botaoRapido;
  }

  function iniciarCategorias() {
    atualizarCategoriasVisiveis();

    const tipo = obterTipoTransacao();
    if (!tipo) {
      if (nomeCategoriaSelecionada) nomeCategoriaSelecionada.textContent = 'Escolha o tipo para ver as categorias';
      return;
    }

    const categoriaRestaurada = campoCategoria?.value
      ? Array.from(botoesCategoria).find(function (botao) {
        return botao.dataset.categoryId === campoCategoria.value && botao.dataset.categoryType === tipo;
      })
      : null;
    const primeiraCategoria = categoriaRestaurada || document.querySelector(
      `.categoria-modal-lista [data-category-choice][data-category-type="${tipo}"]`
    );

    if (primeiraCategoria) {
      selecionarCategoria(primeiraCategoria);
    } else if (nomeCategoriaSelecionada) {
      nomeCategoriaSelecionada.textContent = 'Nenhuma categoria cadastrada';
    }
  }

  botoesCategoria.forEach(configurarBotaoCategoria);

  botoesAdicionarCategoria.forEach(function (botao) {
    botao.addEventListener('click', function () {
      if (!formularioCriarCategoria || !tipoNovaCategoria || !nomeNovaCategoria || !emojiNovaCategoria) return;

      const tipo = botao.dataset.categoryCreate;
      if (tituloModalCriarCategoria) {
        const tipoLegivel = tipo === 'saida' ? 'saída' : 'entrada';
        tituloModalCriarCategoria.textContent = `Adicionar categoria de ${tipoLegivel}`;
      }
      if (feedbackCriarCategoria) {
        feedbackCriarCategoria.hidden = true;
        feedbackCriarCategoria.textContent = '';
      }
      nomeNovaCategoria.value = '';
      emojiNovaCategoria.value = '';
      emojiNovaCategoria.dispatchEvent(new Event('input', { bubbles: true }));
      document.querySelector(
        `.tipo-categoria-btn[data-tipo="${tipo === 'entrada' ? 'ENTRADA' : 'SAIDA'}"]`
      )?.click();
      ModalManager.abrir('modalCriarCategoriaLancamento');
      nomeNovaCategoria?.focus();
    });
  });

  formularioCriarCategoria?.addEventListener('input', function () {
    if (feedbackCriarCategoria) {
      feedbackCriarCategoria.hidden = true;
      feedbackCriarCategoria.textContent = '';
    }
  });

  formularioCriarCategoria?.addEventListener('submit', async function (evento) {
    evento.preventDefault();

    const botaoEnviar = formularioCriarCategoria.querySelector('[type="submit"]');
    const textoBotaoOriginal = botaoEnviar?.textContent;
    if (feedbackCriarCategoria) {
      feedbackCriarCategoria.hidden = true;
      feedbackCriarCategoria.textContent = '';
    }
    if (botaoEnviar) {
      botaoEnviar.disabled = true;
      botaoEnviar.textContent = 'Salvando...';
    }

    let botaoCategoriaCriada;
    try {
      const resposta = await fetch(formularioCriarCategoria.action, {
        method: 'POST',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json',
        },
        body: new FormData(formularioCriarCategoria),
      });
      const resultado = await resposta.json();

      if (!resposta.ok || !resultado.success) {
        if (feedbackCriarCategoria) {
          feedbackCriarCategoria.textContent = resultado.message || 'Não foi possível criar a categoria.';
          feedbackCriarCategoria.hidden = false;
        }
        return;
      }

      if (!resultado.categoria || !resultado.categoria.id_categoria) {
        throw new Error('A resposta do servidor não contém a categoria criada.');
      }

      botaoCategoriaCriada = exibirNovaCategoria(resultado.categoria);
      if (!botaoCategoriaCriada) {
        throw new Error('Não foi possível atualizar as categorias do lançamento.');
      }

      nomeNovaCategoria.value = '';
      emojiNovaCategoria.value = '';
      emojiNovaCategoria.dispatchEvent(new Event('input', { bubbles: true }));
      ModalManager.fechar('modalCriarCategoriaLancamento');
    } catch (erro) {
      console.error('Erro ao criar categoria pelo lançamento:', erro);
      if (feedbackCriarCategoria) {
        feedbackCriarCategoria.textContent = 'Não foi possível salvar a categoria. Verifique sua conexão e tente novamente.';
        feedbackCriarCategoria.hidden = false;
      }
      return;
    } finally {
      if (botaoEnviar) {
        botaoEnviar.disabled = false;
        botaoEnviar.textContent = textoBotaoOriginal;
      }
    }

    window.DuckFyAlert.success(
      'A categoria foi criada e selecionada neste lançamento.',
      'Categoria adicionada!'
    ).then(function () {
      botaoCategoriaCriada.focus();
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

  formularioLancamento?.addEventListener('submit', function (evento) {
    const tipoSelecionado = document.querySelector('[name="tipo_transacao"]:checked');
    const valorNumerico = Number(valorEnviado?.value || 0);

    if (tipoSelecionado?.value === 'saida' && saldoContaSelecionada !== null && valorNumerico > saldoContaSelecionada) {
      evento.preventDefault();
      mostrarErroSaldo(`O valor informado ultrapassa o saldo de ${saldoContaSelecionada.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      })} disponível nesta conta.`);
      return;
    }

    if (!tipoSelecionado || !campoConta?.value) {
      evento.preventDefault();
      if (!tipoSelecionado) {
        definirEtapaWizard(1);
        mostrarAvisoTipoObrigatorio();
      } else {
        mostrarEtapaConta();
      }
    }
  });

  valorDigitado?.addEventListener('input', function () {
    if (avisoSaldo) avisoSaldo.hidden = true;
  });

  iniciarCategorias();
  window.carregarEmojisIOS?.();
}

configurarLancamentos();