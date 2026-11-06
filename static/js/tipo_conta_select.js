document.querySelectorAll('.tipo-conta-select').forEach((container) => {
    const select = container.querySelector('select[name="tipo_conta"]');
    if (!select || !select.id) return;

    const label = document.querySelector(`label[for="${select.id}"]`);
    if (!label) return;

    const options = Array.from(select.options);
    const trigger = document.createElement('button');
    const valueLabel = document.createElement('span');
    const chevron = document.createElement('span');
    const listbox = document.createElement('div');
    const error = document.createElement('span');
    const optionElements = options.map((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.id = `${select.id}-option-${index}`;
        optionElement.className = 'tipo-conta-opcao';
        optionElement.setAttribute('role', 'option');
        optionElement.setAttribute('aria-disabled', String(option.disabled));
        optionElement.setAttribute('aria-selected', 'false');
        optionElement.dataset.value = option.value;
        optionElement.textContent = option.textContent.trim();
        return optionElement;
    });
    const enabledOptions = optionElements.filter((option) => option.getAttribute('aria-disabled') !== 'true');
    let activeIndex = -1;
    let typeahead = '';
    let typeaheadTimeout;

    if (!label.id) label.id = `${select.id}-label`;

    trigger.id = `${select.id}-trigger`;
    trigger.type = 'button';
    trigger.className = 'tipo-conta-trigger has-placeholder';
    trigger.setAttribute('role', 'combobox');
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', `${select.id}-options`);
    trigger.setAttribute('aria-autocomplete', 'none');
    trigger.setAttribute('aria-required', String(select.required));
    trigger.setAttribute('aria-labelledby', `${label.id} ${select.id}-value`);
    trigger.setAttribute('aria-describedby', `${select.id}-error`);

    valueLabel.id = `${select.id}-value`;
    chevron.className = 'tipo-conta-chevron';
    chevron.setAttribute('aria-hidden', 'true');
    trigger.append(valueLabel, chevron);

    listbox.id = `${select.id}-options`;
    listbox.className = 'tipo-conta-lista';
    listbox.setAttribute('role', 'listbox');
    listbox.setAttribute('aria-labelledby', label.id);
    listbox.hidden = true;
    listbox.append(...optionElements);

    error.id = `${select.id}-error`;
    error.className = 'tipo-conta-erro';
    error.setAttribute('role', 'alert');
    error.textContent = 'Selecione um tipo de conta.';
    error.hidden = true;

    container.classList.add('is-enhanced');
    container.classList.toggle('has-icon', Boolean(container.querySelector('.input-icon')));
    select.setAttribute('aria-hidden', 'true');
    select.tabIndex = -1;
    select.after(trigger, listbox, error);

    function updateSelection() {
        const selectedOption = select.options[select.selectedIndex];
        valueLabel.textContent = selectedOption?.textContent.trim() || 'Selecione o tipo';
        trigger.classList.toggle('has-placeholder', !select.value);
        optionElements.forEach((option) => {
            option.setAttribute('aria-selected', String(option.dataset.value === select.value && Boolean(select.value)));
        });
        trigger.removeAttribute('aria-invalid');
        error.hidden = true;
    }

    function setActiveOption(index) {
        if (!enabledOptions.length) return;
        activeIndex = (index + enabledOptions.length) % enabledOptions.length;
        optionElements.forEach((option) => option.classList.remove('is-active'));
        const activeOption = enabledOptions[activeIndex];
        activeOption.classList.add('is-active');
        trigger.setAttribute('aria-activedescendant', activeOption.id);
        activeOption.scrollIntoView({ block: 'nearest' });
    }

    function openListbox() {
        if (!enabledOptions.length) return;
        listbox.hidden = false;
        container.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
        const selectedIndex = enabledOptions.findIndex((option) => option.dataset.value === select.value);
        setActiveOption(selectedIndex >= 0 ? selectedIndex : 0);
    }

    function closeListbox(returnFocus = false) {
        listbox.hidden = true;
        container.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
        trigger.removeAttribute('aria-activedescendant');
        optionElements.forEach((option) => option.classList.remove('is-active'));
        activeIndex = -1;
        if (returnFocus) trigger.focus();
    }

    function chooseOption(optionElement) {
        if (optionElement.getAttribute('aria-disabled') === 'true') return;
        select.value = optionElement.dataset.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        closeListbox(true);
    }

    trigger.addEventListener('click', () => {
        if (listbox.hidden) openListbox();
        else closeListbox();
    });

    trigger.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            if (listbox.hidden) {
                openListbox();
                if (event.key === 'ArrowUp') setActiveOption(enabledOptions.length - 1);
            } else {
                setActiveOption(activeIndex + (event.key === 'ArrowDown' ? 1 : -1));
            }
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
            event.stopPropagation();
            closeListbox(true);
        } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
            typeahead += event.key.toLocaleLowerCase();
            window.clearTimeout(typeaheadTimeout);
            typeaheadTimeout = window.setTimeout(() => { typeahead = ''; }, 700);
            const matchIndex = enabledOptions.findIndex((option) =>
                option.textContent.trim().toLocaleLowerCase().startsWith(typeahead)
            );
            if (matchIndex >= 0) {
                if (listbox.hidden) openListbox();
                setActiveOption(matchIndex);
            }
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

    select.addEventListener('change', updateSelection);
    select.addEventListener('invalid', (event) => {
        event.preventDefault();
        trigger.setAttribute('aria-invalid', 'true');
        error.hidden = false;
        trigger.focus();
    });
    select.form?.addEventListener('reset', () => window.setTimeout(updateSelection));
    document.addEventListener('pointerdown', (event) => {
        if (!container.contains(event.target)) closeListbox();
    });

    updateSelection();
});
