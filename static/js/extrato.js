document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('searchInput');
    const periodSelect = document.getElementById('periodSelect');
    const items = Array.from(document.querySelectorAll('.timeline-item'));
    const emptyMessage = document.getElementById('no-filter-results');

    if (!searchInput || !periodSelect || !emptyMessage) {
        return;
    }

    function normalizeText(text) {
        return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    }

    function parseDate(dateText) {
        const parts = dateText.split('/');
        const day = Number(parts[0]);
        const month = Number(parts[1]);
        const year = Number(parts[2]);

        if (!day || !month || !year) {
            return null;
        }

        return new Date(year, month - 1, day);
    }

    function getDateRange(period) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        switch (period) {
            case 'current_month':
                return [new Date(today.getFullYear(), today.getMonth(), 1), today];

            case 'last_month':
                return [
                    new Date(today.getFullYear(), today.getMonth() - 1, 1),
                    new Date(today.getFullYear(), today.getMonth(), 0)
                ];

            case '7_days':
            case '30_days':
                const start = new Date(today);
                const daysToSubtract = period === '7_days' ? 6 : 29;
                start.setDate(start.getDate() - daysToSubtract);
                return [start, today];

            default:
                return null;
        }
    }

    function applyFilters() {
        const searchTerm = normalizeText(searchInput.value.trim());
        const dateRange = getDateRange(periodSelect.value);
        let visibleCount = 0;

        items.forEach(function(item) {
            const itemText = normalizeText(item.querySelector('.info').textContent);
            const dateText = item.querySelector('.date').textContent.trim();
            const itemDate = parseDate(dateText);
            let shouldShow = itemText.includes(searchTerm);

            if (dateRange && itemDate) {
                const [startDate, endDate] = dateRange;
                shouldShow = shouldShow && itemDate >= startDate && itemDate <= endDate;
            } else if (dateRange) {
                shouldShow = false;
            }

            item.hidden = !shouldShow;
            if (!item.hidden) visibleCount += 1;
        });

        emptyMessage.hidden = items.length === 0 || visibleCount > 0;
    }

    searchInput.addEventListener('input', applyFilters);
    periodSelect.addEventListener('change', applyFilters);
    applyFilters();
});