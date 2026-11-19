document.addEventListener('DOMContentLoaded', function () {
    const actionModal = document.getElementById('transactionActionModal');
    const editModal = document.getElementById('editTransactionModal');
    const editForm = document.getElementById('editTransactionForm');
    const deleteForm = document.getElementById('deleteTransactionForm');
    const editDescription = document.getElementById('editTransactionDescription');
    const editAmount = document.getElementById('editTransactionAmount');
    const editType = document.getElementById('editTransactionType');
    const editCategory = document.getElementById('editTransactionCategory');
    const editDate = document.getElementById('editTransactionDate');
    const datePicker = document.getElementById('transactionDateCalendar');
    const dateTrigger = document.getElementById('transactionDateTrigger');
    const calendarMonthLabel = document.getElementById('transactionCalendarMonth');
    const calendarDays = document.getElementById('transactionCalendarDays');
    const actionDescription = document.getElementById('transactionActionDescription');
    const editButton = document.getElementById('editTransactionButton');
    const deleteButton = document.getElementById('deleteTransactionButton');

    if (!actionModal || !editModal || !editForm || !deleteForm) return;

    let activeTransaction = null;
    let returnFocus = null;
    let calendarMonth = new Date();

    function openModal(modal, focusTarget) {
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        focusTarget?.focus();
    }

    function closeModal(modal, restoreFocus) {
        if (modal === editModal) setDatePickerOpen(false);
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        if (!document.querySelector('.transaction-modal.active')) {
            document.body.style.overflow = '';
        }
        if (restoreFocus) returnFocus?.focus();
    }

    function updateCategoryOptions() {
        const type = editType.value;
        Array.from(editCategory.options).forEach(function (option) {
            if (!option.value) return;
            const allowed = option.dataset.type === type;
            option.hidden = !allowed;
            option.disabled = !allowed;
        });

        const selected = editCategory.selectedOptions[0];
        if (selected?.disabled) editCategory.value = '';
    }

    function parseIsoDate(value) {
        const parts = (value || '').split('-').map(Number);
        if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return null;
        const date = new Date(parts[0], parts[1] - 1, parts[2]);
        if (date.getFullYear() !== parts[0] || date.getMonth() !== parts[1] - 1
            || date.getDate() !== parts[2]) return null;
        return date;
    }

    function parsePtDate(value) {
        const parts = (value || '').split('/').map(Number);
        if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return null;
        const date = new Date(parts[2], parts[1] - 1, parts[0]);
        if (date.getFullYear() !== parts[2] || date.getMonth() !== parts[1] - 1
            || date.getDate() !== parts[0]) return null;
        return date;
    }

    function getToday() {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    function formatIsoDate(value) {
        const date = parseIsoDate(value);
        return date ? date.toLocaleDateString('pt-BR') : '';
    }

    function toIsoDate(date) {
        return [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, '0'),
            String(date.getDate()).padStart(2, '0')
        ].join('-');
    }

    function formatPtDate(date) {
        return [
            String(date.getDate()).padStart(2, '0'),
            String(date.getMonth() + 1).padStart(2, '0'),
            date.getFullYear()
        ].join('/');
    }

    function renderTransactionCalendar(month) {
        const firstWeekday = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
        const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
        const today = getToday();
        const todayIso = toIsoDate(today);
        const selectedDate = parsePtDate(editDate.value);
        const selectedIso = selectedDate ? toIsoDate(selectedDate) : '';
        const cells = [];

        calendarMonthLabel.textContent = month.toLocaleDateString('pt-BR', {
            month: 'long',
            year: 'numeric'
        });

        for (let blank = 0; blank < firstWeekday; blank += 1) {
            const spacer = document.createElement('span');
            spacer.className = 'transaction-calendar-blank';
            spacer.setAttribute('aria-hidden', 'true');
            cells.push(spacer);
        }

        for (let day = 1; day <= daysInMonth; day += 1) {
            const date = new Date(month.getFullYear(), month.getMonth(), day);
            const isoDate = toIsoDate(date);
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'transaction-calendar-day';
            button.dataset.calendarDate = isoDate;
            button.textContent = String(day);
            button.setAttribute('aria-label', date.toLocaleDateString('pt-BR'));
            button.setAttribute('aria-pressed', String(isoDate === selectedIso));
            button.disabled = date > today;
            if (isoDate === selectedIso && !button.disabled) button.classList.add('is-selected');
            if (isoDate === todayIso) button.classList.add('is-today');
            cells.push(button);
        }

        calendarDays.replaceChildren(...cells);
        const nextMonthButton = datePicker.querySelector('[data-calendar-shift="1"]');
        if (nextMonthButton) {
            nextMonthButton.disabled = month.getFullYear() > today.getFullYear()
                || (month.getFullYear() === today.getFullYear()
                    && month.getMonth() >= today.getMonth());
        }
    }

    function setDatePickerOpen(isOpen) {
        datePicker.hidden = !isOpen;
        dateTrigger.setAttribute('aria-expanded', String(isOpen));
    }

    function openDatePicker() {
        const today = getToday();
        const selectedDate = parsePtDate(editDate.value) || today;
        const date = selectedDate > today ? today : selectedDate;
        calendarMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        renderTransactionCalendar(calendarMonth);
        setDatePickerOpen(true);
    }

    document.querySelectorAll('[data-transaction-action]').forEach(function (button) {
        button.addEventListener('click', function () {
            const transaction = button.closest('.timeline-item');
            if (!transaction || transaction.dataset.editable !== '1') return;

            activeTransaction = transaction;
            returnFocus = button;
            actionDescription.textContent = transaction.dataset.description;
            openModal(actionModal, editButton);
        });
    });

    editButton.addEventListener('click', function () {
        if (!activeTransaction) return;

        editForm.action = `/transacoes/${activeTransaction.dataset.transactionId}/editar`;
        editDescription.value = activeTransaction.dataset.description;
        editAmount.value = activeTransaction.dataset.amount;
        editType.value = activeTransaction.dataset.type;
        editDate.value = formatIsoDate(activeTransaction.dataset.date);
        editCategory.value = activeTransaction.dataset.category;
        updateCategoryOptions();

        closeModal(actionModal, false);
        openModal(editModal, editDescription);
    });

    editType.addEventListener('change', updateCategoryOptions);
    editForm.addEventListener('submit', function (event) {
        const selectedDate = parsePtDate(editDate.value);
        if (selectedDate && selectedDate <= getToday()) {
            editDate.setCustomValidity('');
            return;
        }

        event.preventDefault();
        editDate.setCustomValidity('Escolha uma data de hoje ou anterior.');
        editDate.reportValidity();
        window.DuckFyAlert.error('A data da transação não pode ser futura.', 'Data inválida');
    });
    dateTrigger.addEventListener('click', function () {
        openDatePicker();
    });
    editDate.addEventListener('click', openDatePicker);

    datePicker.addEventListener('click', function (event) {
        const shiftButton = event.target.closest('[data-calendar-shift]');
        if (shiftButton) {
            calendarMonth.setMonth(calendarMonth.getMonth() + Number(shiftButton.dataset.calendarShift));
            renderTransactionCalendar(calendarMonth);
            return;
        }

        const dayButton = event.target.closest('[data-calendar-date]');
        if (dayButton) {
            const date = parseIsoDate(dayButton.dataset.calendarDate);
            if (!date || date > getToday()) return;
            editDate.value = formatPtDate(date);
            setDatePickerOpen(false);
            dateTrigger.focus();
            editDate.setCustomValidity('');
            return;
        }

        if (event.target.closest('[data-calendar-today]')) {
            editDate.value = formatPtDate(getToday());
            setDatePickerOpen(false);
            dateTrigger.focus();
            editDate.setCustomValidity('');
            return;
        }

        if (event.target.closest('[data-calendar-close]')) {
            setDatePickerOpen(false);
            dateTrigger.focus();
        }
    });

    deleteButton.addEventListener('click', async function () {
        if (!activeTransaction) return;

        closeModal(actionModal, false);
        const confirmed = await window.DuckFyAlert.confirm({
            title: 'Excluir transação?',
            text: `Deseja excluir "${activeTransaction.dataset.description}"? O saldo da conta será atualizado.`,
            confirmButtonText: 'Excluir transação'
        });
        if (!confirmed) {
            returnFocus?.focus();
            return;
        }

        deleteForm.action = `/transacoes/${activeTransaction.dataset.transactionId}/excluir`;
        deleteForm.submit();
    });

    document.querySelectorAll('[data-close-transaction-modal]').forEach(function (button) {
        button.addEventListener('click', function () {
            const modal = button.closest('.transaction-modal');
            if (modal) closeModal(modal, true);
        });
    });

    [actionModal, editModal].forEach(function (modal) {
        modal.addEventListener('click', function (event) {
            if (event.target === modal) closeModal(modal, true);
        });
    });

    document.addEventListener('keydown', function (event) {
        if (event.key !== 'Escape') return;
        if (!datePicker.hidden) {
            setDatePickerOpen(false);
            dateTrigger.focus();
            return;
        }
        const activeModal = document.querySelector('.transaction-modal.active');
        if (activeModal) closeModal(activeModal, true);
    });

    document.addEventListener('click', function (event) {
        if (!datePicker.hidden && !datePicker.contains(event.target)
            && !dateTrigger.contains(event.target) && event.target !== editDate) {
            setDatePickerOpen(false);
        }
    });
});
