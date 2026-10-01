document.addEventListener('DOMContentLoaded', function () {
    const monthLabel = document.getElementById('calendarMonthLabel');
    const daysGrid = document.getElementById('calendarDays');
    const prevBtn = document.getElementById('prevMonthBtn');
    const nextBtn = document.getElementById('nextMonthBtn');
    const todayBtn = document.getElementById('todayBtn');

    const dayDetailTitle = document.getElementById('dayDetailTitle');
    const dayDetailSubtitle = document.getElementById('dayDetailSubtitle');
    const dayDetailTable = document.getElementById('dayDetailTable');
    const dayDetailTableBody = document.getElementById('dayDetailTableBody');
    const dayDetailEmptyState = document.getElementById('dayDetailEmptyState');

    const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

    const today = new Date();
    let viewYear = today.getFullYear();
    let viewMonth = today.getMonth(); // 0-11
    let selectedISO = null;

    function pad(n) { return String(n).padStart(2, '0'); }
    function isoOf(y, m, d) { return `${y}-${pad(m + 1)}-${pad(d)}`; }

    function statusLabel(status) {
        return status.charAt(0).toUpperCase() + status.slice(1);
    }

    function buildCalendar() {
        monthLabel.textContent = `${MONTH_NAMES[viewMonth]} ${viewYear}`;
        daysGrid.innerHTML = '';

        const firstOfMonth = new Date(viewYear, viewMonth, 1);
        const startWeekday = firstOfMonth.getDay(); // 0 = Sunday
        const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
        const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

        const todayISO = AppData.todayISO();
        const cells = [];

        // Días del mes anterior para completar la primera semana
        for (let i = startWeekday - 1; i >= 0; i--) {
            const d = daysInPrevMonth - i;
            const m = viewMonth === 0 ? 11 : viewMonth - 1;
            const y = viewMonth === 0 ? viewYear - 1 : viewYear;
            cells.push({ y, m, d, otherMonth: true });
        }
        // Días del mes actual
        for (let d = 1; d <= daysInMonth; d++) {
            cells.push({ y: viewYear, m: viewMonth, d, otherMonth: false });
        }
        // Días del mes siguiente para completar la última semana (múltiplos de 7)
        let next = 1;
        while (cells.length % 7 !== 0) {
            const m = viewMonth === 11 ? 0 : viewMonth + 1;
            const y = viewMonth === 11 ? viewYear + 1 : viewYear;
            cells.push({ y, m, d: next++, otherMonth: true });
        }

        cells.forEach(cell => {
            const iso = isoOf(cell.y, cell.m, cell.d);
            const count = AppData.getAppointmentsByDate(iso).length;

            const cellEl = document.createElement('div');
            cellEl.className = 'calendar-day';
            if (cell.otherMonth) cellEl.classList.add('other-month');
            if (iso === todayISO) cellEl.classList.add('today');
            if (iso === selectedISO) cellEl.classList.add('selected');
            cellEl.dataset.iso = iso;

            let badgeHtml = '';
            if (count > 0) {
                const busyClass = count >= 4 ? 'busy' : '';
                badgeHtml = `<span class="day-count-badge ${busyClass}"><i class="bi bi-calendar-check"></i>${count} appt${count === 1 ? '' : 's'}</span>`;
            }

            cellEl.innerHTML = `
                <span class="day-number">${cell.d}</span>
                ${badgeHtml}
            `;

            cellEl.addEventListener('click', function () {
                selectedISO = iso;
                buildCalendar();
                renderDayDetail(iso);
            });

            daysGrid.appendChild(cellEl);
        });
    }

    function renderDayDetail(iso) {
        const appts = AppData.getAppointmentsByDate(iso);
        const displayDate = AppData.formatDateDisplay(iso);

        dayDetailTitle.textContent = `Appointments on ${displayDate}`;
        dayDetailSubtitle.textContent = appts.length
            ? `${appts.length} appointment${appts.length === 1 ? '' : 's'} scheduled`
            : 'Nothing scheduled for this day';

        if (appts.length === 0) {
            dayDetailEmptyState.style.display = 'none';
            dayDetailTable.style.display = 'table';
            dayDetailTableBody.innerHTML = '<tr class="empty-row"><td colspan="5"><div class="empty-state"><i class="bi bi-calendar-x"></i><p>No appointments on this day.</p></div></td></tr>';
            return;
        }

        dayDetailEmptyState.style.display = 'none';
        dayDetailTable.style.display = 'table';
        dayDetailTableBody.innerHTML = appts.map(appt => `
            <tr>
                <td data-label="Time">${AppData.time24to12(appt.time24)}</td>
                <td data-label="Patient">
                    <div class="patient-cell">
                        <div class="avatar-initials ${appt.colorClass}">${appt.initials}</div>
                        <span>${appt.patientName}</span>
                    </div>
                </td>
                <td data-label="Type">${appt.specialty}</td>
                <td data-label="Notes">${appt.notes ? appt.notes : '—'}</td>
                <td data-label="Status"><span class="status-badge ${appt.status}">${statusLabel(appt.status)}</span></td>
            </tr>
        `).join('');
    }

    prevBtn.addEventListener('click', function () {
        viewMonth -= 1;
        if (viewMonth < 0) { viewMonth = 11; viewYear -= 1; }
        buildCalendar();
    });
    nextBtn.addEventListener('click', function () {
        viewMonth += 1;
        if (viewMonth > 11) { viewMonth = 0; viewYear += 1; }
        buildCalendar();
    });
    todayBtn.addEventListener('click', function () {
        viewYear = today.getFullYear();
        viewMonth = today.getMonth();
        selectedISO = AppData.todayISO();
        buildCalendar();
        renderDayDetail(selectedISO);
    });

    buildCalendar();
    dayDetailEmptyState.style.display = 'none';
    dayDetailTable.style.display = 'table';
    dayDetailTableBody.innerHTML = '<tr class="empty-row"><td colspan="5"><div class="empty-state"><i class="bi bi-calendar3"></i><p>Select a day to see its appointments.</p></div></td></tr>';
});
