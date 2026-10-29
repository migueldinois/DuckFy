document.querySelectorAll('[data-reserva-select]').forEach((container, selectIndex) => {
  const select = container.querySelector('select');
  const trigger = container.querySelector('.custom-select-trigger');
  const valueLabel = container.querySelector('[id$="-value"]');
  const listbox = container.querySelector('[role="listbox"]');
  const errorMessage = container.querySelector('.reserva-select-error');
  const options = Array.from(listbox.querySelectorAll('[role="option"]'));
  const enabledOptions = options.filter((option) => option.getAttribute('aria-disabled') !== 'true');
  let activeIndex = -1;

  const opcaoPreSelecionada = options.find((option) => option.dataset.selected === 'true');
  if (opcaoPreSelecionada) select.value = opcaoPreSelecionada.dataset.value;
  else select.selectedIndex = -1;

  const syncSelection = () => {
    const selectedOption = select.selectedOptions[0];
    valueLabel.textContent = selectedOption?.textContent.trim() || 'Selecione uma conta';
    trigger.classList.toggle('has-placeholder', select.value === '');
    options.forEach((option) => {
      option.setAttribute('aria-selected', String(option.dataset.value === select.value && select.value !== ''));
    });
    if (select.value) {
      trigger.removeAttribute('aria-invalid');
      errorMessage.hidden = true;
    }
  };

  const setActiveOption = (index) => {
    activeIndex = (index + enabledOptions.length) % enabledOptions.length;
    options.forEach((option) => option.classList.remove('is-active'));
    const activeOption = enabledOptions[activeIndex];
    activeOption.classList.add('is-active');
    trigger.setAttribute('aria-activedescendant', activeOption.id);
  };

  const openListbox = () => {
    if (!enabledOptions.length || trigger.disabled) return;
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

  options.forEach((option, optionIndex) => {
    option.id = `reserva-select-${selectIndex}-option-${optionIndex}`;
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
  select.form?.addEventListener('submit', (event) => {
    if (!select.disabled && !select.value) {
      event.preventDefault();
      trigger.setAttribute('aria-invalid', 'true');
      errorMessage.hidden = false;
      trigger.focus();
    }
  });
  document.addEventListener('click', (event) => {
    if (!container.contains(event.target)) closeListbox();
  });

  syncSelection();
});

const contaRetirada = document.querySelector('#conta_destino_retirada');
const valorRetirada = document.querySelector('#valor_retirada');

const atualizarLimiteRetirada = () => {
  if (!contaRetirada || !valorRetirada) return;

  const opcaoSelecionada = contaRetirada.selectedOptions[0];
  const valorAlocado = Number(opcaoSelecionada?.dataset.valorAlocado || 0);
  valorRetirada.max = valorAlocado.toFixed(2);

  if (valorRetirada.value) {
    valorRetirada.dispatchEvent(new Event('input', { bubbles: true }));
  }
};

contaRetirada?.addEventListener('change', atualizarLimiteRetirada);
atualizarLimiteRetirada();

if (new URLSearchParams(window.location.search).get('abrir_guardar') === '1') {
  const modalGuardar = document.getElementById('modalGuardarDinheiro');
  if (modalGuardar && window.bootstrap?.Modal) {
    window.bootstrap.Modal.getOrCreateInstance(modalGuardar).show();
  }
}