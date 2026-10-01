document.addEventListener('DOMContentLoaded', function () {
    const tableBody = document.getElementById('appointmentsTableBody');
    const emptyState = document.getElementById('appointmentsEmptyState');
    const tableTitle = document.getElementById('appointmentsTableTitle');
    const tableSubtitle = document.getElementById('appointmentsTableSubtitle');
    const viewAllBtn = document.getElementById('viewAllBtn');
    const viewAllBtnLabel = document.getElementById('viewAllBtnLabel');

    const modal = document.getElementById('appointmentModal');
    const openModalBtn = document.getElementById('newAppointmentBtn');
    const closeModalBtn = document.getElementById('closeAppointmentModal');
    const cancelBtn = document.getElementById('cancelAppointmentBtn');
    const form = document.getElementById('appointmentForm');
    const specialtySelect = document.getElementById('appointmentSpecialty');
    const patientNamesList = document.getElementById('patientNamesList');

    let showingHistory = false;

    /* ---------- render de tabla ---------- */

    function statusLabel(status) {
        return status.charAt(0).toUpperCase() + status.slice(1);
    }

    function actionButtons(appt) {
        let html = '';
        if (appt.status === 'pending') html += `<button class="btn-icon-sm" data-act="confirmed" data-id="${appt.id}" title="Confirm"><i class="bi bi-check-circle"></i></button>`;
        if (appt.status === 'pending' || appt.status === 'confirmed') {
            html += `<button class="btn-icon-sm ok" data-act="completed" data-id="${appt.id}" title="Mark as completed"><i class="bi bi-check2-all"></i></button>`;
            html += `<button class="btn-icon-sm warn" data-act="cancelled" data-id="${appt.id}" title="Cancel"><i class="bi bi-x-circle"></i></button>`;
        }
        html += `<button class="btn-icon-sm danger" data-act="delete" data-id="${appt.id}" title="Delete"><i class="bi bi-trash"></i></button>`;
        return html;
    }

    tableBody.addEventListener('click', function (e) {
        const btn = e.target.closest('[data-act]');
        if (!btn) return;
        const id = btn.dataset.id, act = btn.dataset.act;
        if (act === 'delete') {
            if (!confirm('Delete this appointment?')) return;
            AppData.deleteAppointment(id);
        } else {
            AppData.updateAppointmentStatus(id, act);
        }
        render();
        if (window.AppShell) AppShell.refreshNotifications();
    });

    function renderRow(appt) {
        const dateDisplay = `${AppData.formatDateDisplay(appt.dateISO)} · ${AppData.time24to12(appt.time24)}`;
        return `
            <tr>
                <td data-label="Date">${dateDisplay}</td>
                <td data-label="Patient">
                    <div class="patient-cell">
                        <div class="avatar-initials ${appt.colorClass}">${appt.initials}</div>
                        <span>${appt.patientName}</span>
                    </div>
                </td>
                <td data-label="Type">${appt.specialty}</td>
                <td data-label="Notes">${appt.notes ? appt.notes : '—'}</td>
                <td data-label="Status"><span class="status-badge ${appt.status}">${statusLabel(appt.status)}</span></td>
                <td data-label="Actions"><div class="row-actions">${actionButtons(appt)}</div></td>
            </tr>
        `;
    }

    function render() {
        const list = showingHistory ? AppData.getAllAppointmentsHistory() : AppData.getUpcomingAppointments();

        if (showingHistory) {
            tableTitle.textContent = 'Appointment history';
            tableSubtitle.textContent = 'All appointments, most recent first';
            viewAllBtnLabel.textContent = 'Show upcoming';
            viewAllBtn.classList.add('is-active');
        } else {
            tableTitle.textContent = 'Upcoming appointments';
            tableSubtitle.textContent = 'Soonest first';
            viewAllBtnLabel.textContent = 'View all';
            viewAllBtn.classList.remove('is-active');
        }

        if (list.length === 0) {
            const msg = showingHistory ? 'No appointments yet' : 'No upcoming appointments';
            tableBody.innerHTML = `<tr class="empty-row"><td colspan="6"><div class="empty-state"><i class="bi bi-calendar-x"></i><p>${msg}</p></div></td></tr>`;
            emptyState.style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            tableBody.innerHTML = list.map(renderRow).join('');
        }
    }

    viewAllBtn.addEventListener('click', function () {
        showingHistory = !showingHistory;
        render();
    });

    /* ---------- modal ---------- */

    function fillSpecialtyOptions() {
        specialtySelect.innerHTML = '<option value="" disabled selected>Select a specialty</option>' +
            AppData.SPECIALTIES.map(s => `<option value="${s}">${s}</option>`).join('');
    }

    function fillPatientDatalist() {
        patientNamesList.innerHTML = AppData.getPatients()
            .map(p => `<option value="${p.name}"></option>`)
            .join('');
    }

    function openModal() {
        form.reset();
        clearErrors();
        fillSpecialtyOptions();
        fillPatientDatalist();
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
        document.getElementById('patientName').focus();
    }

    function closeModal() {
        modal.classList.remove('open');
        document.body.style.overflow = '';
    }

    openModalBtn.addEventListener('click', openModal);
    closeModalBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) {
        if (e.target === modal) closeModal();
    });

    function clearErrors() {
        form.querySelectorAll('.form-group.invalid').forEach(g => g.classList.remove('invalid'));
    }

    function markInvalid(groupId) {
        document.getElementById(groupId).classList.add('invalid');
    }

    /* auto-formatea el input de fecha como MM/DD/YYYY mientras se escribe */
    const dateInput = document.getElementById('appointmentDate');
    dateInput.addEventListener('input', function () {
        let digits = dateInput.value.replace(/\D/g, '').slice(0, 8);
        let out = digits;
        if (digits.length > 4) {
            out = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
        } else if (digits.length > 2) {
            out = `${digits.slice(0, 2)}/${digits.slice(2)}`;
        }
        dateInput.value = out;
    });

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        clearErrors();

        const patientName = document.getElementById('patientName').value.trim();
        const patientPhone = document.getElementById('patientPhone').value.trim();
        const dateStr = dateInput.value.trim();
        const time24 = document.getElementById('appointmentTime').value;
        const specialty = specialtySelect.value;
        const notes = document.getElementById('appointmentNotes').value.trim();

        let valid = true;

        if (!patientName) {
            markInvalid('group-patientName');
            valid = false;
        }

        const dateISO = AppData.mmddyyyyToISO(dateStr);
        if (!dateISO) {
            markInvalid('group-date');
            valid = false;
        }

        if (!time24) {
            markInvalid('group-time');
            valid = false;
        }

        if (!specialty) {
            markInvalid('group-specialty');
            valid = false;
        }

        if (!valid) return;

        AppData.addAppointment({
            patientName,
            patientPhone,
            dateISO,
            time24,
            specialty,
            notes,
            status: dateISO === AppData.todayISO() ? 'confirmed' : 'confirmed'
        });

        closeModal();
        showingHistory = false;
        render();
        if (window.AppShell) AppShell.refreshNotifications();
    });

    render();
});
