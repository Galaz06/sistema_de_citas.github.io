document.addEventListener('DOMContentLoaded', function () {
    const upcomingList = document.getElementById('homeUpcomingList');
    const completedBody = document.getElementById('homeCompletedBody');
    if (!upcomingList && !completedBody) return;

    const $ = id => document.getElementById(id);
    const statusLabel = s => s.charAt(0).toUpperCase() + s.slice(1);
    const pct = (n, total) => total ? (Math.round((n / total) * 1000) / 10) + '%' : '0%';

    function renderLists() {
        const today = AppData.todayISO();
        const upcoming = AppData.getUpcomingAppointments().filter(a => a.dateISO === today).slice(0, 5);
        upcomingList.innerHTML = upcoming.length
            ? upcoming.map(appt => `
                <li class="appointment-item">
                    <div class="avatar-initials ${appt.colorClass}">${appt.initials}</div>
                    <div class="appointment-info">
                        <p class="appointment-name">${appt.patientName}</p>
                        <span class="appointment-type">${appt.specialty}</span>
                    </div>
                    <div class="appointment-meta">
                        <span class="appointment-time">${AppData.time24to12(appt.time24)}</span>
                        <span class="status-badge ${appt.status}">${statusLabel(appt.status)}</span>
                    </div>
                </li>`).join('')
            : '<li class="empty-list"><i class="bi bi-calendar-x"></i><p>No upcoming appointments</p></li>';

        const completed = AppData.getAllAppointmentsHistory().filter(a => a.status === 'completed').slice(0, 5);
        completedBody.innerHTML = completed.length
            ? completed.map(appt => `
                <tr>
                    <td data-label="Date">${AppData.formatDateDisplay(appt.dateISO)} · ${AppData.time24to12(appt.time24)}</td>
                    <td data-label="Patient"><div class="patient-cell"><div class="avatar-initials ${appt.colorClass}">${appt.initials}</div><span>${appt.patientName}</span></div></td>
                    <td data-label="Type">${appt.specialty}</td>
                    <td data-label="Notes">${appt.notes ? appt.notes : '—'}</td>
                    <td data-label="Status"><span class="status-badge completed">Completed</span></td>
                </tr>`).join('')
            : '<tr class="empty-row"><td colspan="5"><div class="empty-state"><i class="bi bi-clipboard-x"></i><p>No completed appointments yet</p></div></td></tr>';
    }

    function renderStats() {
        const s = AppData.getStats();
        $('cardToday').textContent = s.todayTotal;
        $('cardCompleted').textContent = s.todayCompleted;
        $('cardPending').textContent = s.todayPending;
        $('cardCancelled').textContent = s.todayCancelled;

        $('cardCompletedPct').innerHTML = s.todayTotal ? `<span>${pct(s.todayCompleted, s.todayTotal)}</span> of the total` : 'No data yet';
        $('cardPendingPct').innerHTML = s.todayTotal ? `<span>${pct(s.todayPending, s.todayTotal)}</span> of the total` : 'No data yet';
        $('cardCancelledPct').innerHTML = s.todayTotal ? `<span>${pct(s.todayCancelled, s.todayTotal)}</span> of the total` : 'No data yet';

        const trend = $('cardTodayTrend');
        if (s.lastWeekTotal > 0 && s.weekTotal > 0) {
            const diff = Math.round(((s.weekTotal - s.lastWeekTotal) / s.lastWeekTotal) * 100);
            trend.className = 'card-statistics ' + (diff >= 0 ? 'trend-up' : 'trend-down');
            trend.innerHTML = `<i class="bi bi-arrow-${diff >= 0 ? 'up' : 'down'}"></i><p><span>${Math.abs(diff)}%</span> ${diff >= 0 ? 'more' : 'less'} than last week</p>`;
        } else {
            trend.className = 'card-statistics trend-neutral';
            trend.innerHTML = '<p>No data yet</p>';
        }

        // Gráfico semanal (escala dinámica, mínimo 20)
        const max = Math.max(20, Math.ceil(Math.max(...s.perDay) / 5) * 5);
        const ticks = [max, max * 0.75, max * 0.5, max * 0.25, 0].map(n => `<span>${Math.round(n)}</span>`).join('');
        $('chartYAxis').innerHTML = ticks;
        document.querySelectorAll('#chartBars .bar-col').forEach((col, i) => {
            col.style.setProperty('--val', (s.perDay[i] / max * 100) + '%');
            col.querySelector('.bar-val').textContent = s.perDay[i];
            col.classList.toggle('highlight', i === s.todayIndex);
        });

        // Dona de tipos de cita
        const t = s.types, total = s.weekTotal;
        $('donutTotal').textContent = total;
        $('legCheckups').textContent = `${t.checkups} (${pct(t.checkups, total)})`;
        $('legNew').textContent = `${t.firstTime} (${pct(t.firstTime, total)})`;
        $('legStudies').textContent = `${t.studies} (${pct(t.studies, total)})`;
        $('legOther').textContent = `${t.other} (${pct(t.other, total)})`;
        const donut = $('donutChart');
        if (total === 0) {
            donut.style.background = 'var(--icon-bg)';
        } else {
            const colors = ['var(--sidebar-color)', '#22c55e', '#f5a524', 'var(--primary-color)'];
            const vals = [t.checkups, t.firstTime, t.studies, t.other];
            let acc = 0;
            const stops = vals.map((v, i) => {
                const from = acc / total * 100; acc += v;
                return `${colors[i]} ${from}% ${acc / total * 100}%`;
            });
            donut.style.background = `conic-gradient(${stops.join(', ')})`;
        }
    }

    renderLists();
    renderStats();
});
