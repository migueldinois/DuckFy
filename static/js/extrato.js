document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('searchInput');
    const dateRangeTrigger = document.getElementById('dateRangeTrigger');
    const dateRangePicker = document.getElementById('dateRangePicker');
    const dateRangeLabel = document.getElementById('dateRangeLabel');
    const dateRangePreview = document.getElementById('dateRangePreview');
    const items = Array.from(document.querySelectorAll('.timeline-item'));
    const emptyMessage = document.getElementById('no-filter-results');
    const calendars = Array.from(document.querySelectorAll('.date-calendar'));
    const filterTabs = Array.from(document.querySelectorAll('.filter-tabs .tab-btn'));
    const activeTab = document.querySelector('.filter-tabs .tab-btn.active');
    let activeType = activeTab ? activeTab.dataset.tipo : 'tudo';

    if (!searchInput || !dateRangeTrigger || !dateRangePicker || !emptyMessage) {
        return;
    }

    const today = startOfDay(new Date());
    const appliedRange = {
        start: new Date(today.getFullYear(), today.getMonth(), 1),
        end: today
    };
    let draftRange = copyRange(appliedRange);
    let calendarMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    function startOfDay(date) {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }

    function copyRange(range) {
        return {
            start: range.start ? new Date(range.start) : null,
            end: range.end ? new Date(range.end) : null
        };
    }

    function normalizeText(text) {
        return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    }

    function parseDate(dateText) {
        const parts = dateText.split('/');
        if (parts.length !== 3) {
            return null;
        }

        const day = Number(parts[0]);
        const month = Number(parts[1]);
        const year = Number(parts[2]);
        const date = new Date(year, month - 1, day);

        if (!day || !month || !year
            || date.getFullYear() !== year
            || date.getMonth() !== month - 1
            || date.getDate() !== day) {
            return null;
        }

        return date;
    }

    function formatDate(date) {
        return date.toLocaleDateString('pt-BR');
    }

    function formatMonth(date) {
        return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    }

    function getPresetRange(preset) {
        const end = startOfDay(today);
        const start = new Date(end);
        const dayCounts = { last_7: 7, last_14: 14, last_30: 30, last_90: 90 };

        if (dayCounts[preset]) {
            start.setDate(start.getDate() - dayCounts[preset] + 1);
        } else if (preset === 'yesterday') {
            start.setDate(start.getDate() - 1);
            end.setDate(end.getDate() - 1);
        } else if (preset === 'this_month') {
            start.setDate(1);
        } else if (preset === 'last_month') {
            start.setDate(1);
            start.setMonth(start.getMonth() - 1);
            end.setDate(0);
        } else if (preset === 'this_year') {
            start.setMonth(0, 1);
        }

        return { start: start, end: end };
    }

    function updatePreview() {
        dateRangePicker.querySelector('.date-range-apply').disabled = !draftRange.start || !draftRange.end;

        if (draftRange.start && draftRange.end) {
            dateRangePreview.textContent = formatDate(draftRange.start) + ' – ' + formatDate(draftRange.end);
        } else if (draftRange.start) {
            dateRangePreview.textContent = formatDate(draftRange.start) + ' – Escolha o último dia';
        } else {
            dateRangePreview.textContent = 'Selecione as datas';
        }
    }

    function renderCalendar(calendar, monthOffset) {
        const month = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + monthOffset, 1);
        const firstWeekday = month.getDay();
        const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
        const weekdayLabels = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
        let markup = '<header class="date-calendar-header"><h3>' + formatMonth(month)
            + '</h3></header><div class="date-calendar-grid date-calendar-weekdays" aria-hidden="true">';

        weekdayLabels.forEach(function (weekday) {
            markup += '<span>' + weekday + '</span>';
        });
        markup += '</div><div class="date-calendar-grid date-calendar-days">';

        for (let blank = 0; blank < firstWeekday; blank += 1) {
            markup += '<span class="date-calendar-blank" aria-hidden="true"></span>';
        }

        for (let day = 1; day <= daysInMonth; day += 1) {
            const date = new Date(month.getFullYear(), month.getMonth(), day);
            const timestamp = date.getTime();
            const startTimestamp = draftRange.start ? draftRange.start.getTime() : null;
            const endTimestamp = draftRange.end ? draftRange.end.getTime() : null;
            const isStart = timestamp === startTimestamp;
            const isEnd = timestamp === endTimestamp;
            const isInRange = startTimestamp !== null && endTimestamp !== null
                && timestamp > startTimestamp && timestamp < endTimestamp;
            const classes = ['date-calendar-day'];

            if (isStart) classes.push('is-range-start');
            if (isEnd) classes.push('is-range-end');
            if (isInRange) classes.push('is-in-range');
            if (timestamp === today.getTime()) classes.push('is-today');

            markup += '<button type="button" class="' + classes.join(' ')
                + '" data-date="' + date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + day
                + '" aria-label="' + formatDate(date) + '"'
                + ((isStart || isEnd) ? ' aria-pressed="true"' : ' aria-pressed="false"')
                + '>' + day + '</button>';
        }

        markup += '</div>';
        calendar.innerHTML = markup;
    }

    function renderCalendars() {
        calendars.forEach(renderCalendar);
        updatePreview();
    }

    function applyFilters() {
        const searchTerm = normalizeText(searchInput.value.trim());
        let visibleCount = 0;

        items.forEach(function (item) {
            const itemText = normalizeText(item.querySelector('.info').textContent);
            const itemDate = parseDate(item.querySelector('.date').textContent.trim());
            const amountElement = item.querySelector('.amount');
            const isIncome = amountElement.classList.contains('positive');
            const matchesSearch = itemText.includes(searchTerm);
            const matchesType = activeType === 'tudo'
                || (activeType === 'entrada' && isIncome)
                || (activeType === 'saida' && !isIncome);
            const matchesDate = itemDate !== null
                && itemDate >= appliedRange.start
                && itemDate <= appliedRange.end;
            const shouldShow = matchesSearch && matchesType && matchesDate;

            item.hidden = !shouldShow;
            if (shouldShow) {
                visibleCount += 1;
            }
        });

        emptyMessage.hidden = items.length === 0 || visibleCount > 0;
    }

    function setPickerOpen(isOpen) {
        dateRangePicker.hidden = !isOpen;
        dateRangeTrigger.setAttribute('aria-expanded', String(isOpen));
    }

    function setActiveType(type) {
        activeType = type;
        filterTabs.forEach(function (tab) {
            const isActive = tab.dataset.tipo === type;
            tab.classList.toggle('active', isActive);
            if (isActive) {
                tab.setAttribute('aria-current', 'page');
            } else {
                tab.removeAttribute('aria-current');
            }
        });
        applyFilters();
    }

    filterTabs.forEach(function (tab) {
        tab.addEventListener('click', function (event) {
            event.preventDefault();
            const type = tab.dataset.tipo;
            if (type !== activeType) {
                window.history.pushState({ tipo: type }, '', tab.href);
                setActiveType(type);
            }
        });
    });

    window.addEventListener('popstate', function () {
        const type = new URLSearchParams(window.location.search).get('tipo');
        setActiveType(['tudo', 'saida', 'entrada'].includes(type) ? type : 'tudo');
    });

    dateRangeTrigger.addEventListener('click', function () {
        const opening = dateRangePicker.hidden;
        if (opening) {
            draftRange = copyRange(appliedRange);
            calendarMonth = new Date(draftRange.start.getFullYear(), draftRange.start.getMonth(), 1);
            renderCalendars();
        }
        setPickerOpen(opening);
    });

    dateRangePicker.addEventListener('click', function (event) {
        const navigationButton = event.target.closest('[data-month-shift]');
        if (navigationButton) {
            calendarMonth.setMonth(calendarMonth.getMonth() + Number(navigationButton.dataset.monthShift));
            renderCalendars();
            return;
        }

        const presetButton = event.target.closest('[data-preset]');
        if (presetButton) {
            draftRange = getPresetRange(presetButton.dataset.preset);
            calendarMonth = new Date(draftRange.start.getFullYear(), draftRange.start.getMonth(), 1);
            renderCalendars();
            return;
        }

        const dayButton = event.target.closest('[data-date]');
        if (dayButton) {
            const parts = dayButton.dataset.date.split('-').map(Number);
            const selectedDate = new Date(parts[0], parts[1] - 1, parts[2]);
            if (!draftRange.start || draftRange.end) {
                draftRange = { start: selectedDate, end: null };
            } else if (selectedDate < draftRange.start) {
                draftRange.end = draftRange.start;
                draftRange.start = selectedDate;
            } else {
                draftRange.end = selectedDate;
            }
            renderCalendars();
            return;
        }

        if (event.target.closest('.date-range-cancel')) {
            draftRange = copyRange(appliedRange);
            setPickerOpen(false);
            return;
        }

        if (event.target.closest('.date-range-apply')) {
            if (!draftRange.start || !draftRange.end) {
                return;
            }
            appliedRange.start = startOfDay(draftRange.start);
            appliedRange.end = startOfDay(draftRange.end);
            dateRangeLabel.textContent = 'Período selecionado';
            setPickerOpen(false);
            applyFilters();
        }
    });

    dateRangePicker.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            draftRange = copyRange(appliedRange);
            setPickerOpen(false);
            dateRangeTrigger.focus();
        }
    });

    document.addEventListener('click', function (event) {
        if (!dateRangePicker.hidden && !dateRangePicker.contains(event.target)
            && !dateRangeTrigger.contains(event.target)) {
            draftRange = copyRange(appliedRange);
            setPickerOpen(false);
        }
    }, true);

    searchInput.addEventListener('input', applyFilters);

    dateRangeLabel.textContent = 'Este mês';
    renderCalendars();
    applyFilters();
});
