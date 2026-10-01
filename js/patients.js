document.addEventListener('DOMContentLoaded', function () {
    const tableBody = document.getElementById('patientsTableBody');
    const emptyState = document.getElementById('patientsEmptyState');
    const countLabel = document.getElementById('patientsCountLabel');

    const modal = document.getElementById('patientModal');
    const openModalBtn = document.getElementById('newPatientBtn');
    const closeModalBtn = document.getElementById('closePatientModal');
    const cancelBtn = document.getElementById('cancelPatientBtn');
    const form = document.getElementById('patientForm');

    function renderRow(patient) {
        const apptCount = AppData.countAppointmentsForPatient(patient.id);
        return `
            <tr>
                <td data-label="Patient">
                    <div class="patient-cell">
                        <div class="avatar-initials ${patient.colorClass}">${patient.initials}</div>
                        <span>${patient.name}</span>
                    </div>
                </td>
                <td data-label="Phone">${patient.phone ? patient.phone : '—'}</td>
                <td data-label="Email">${patient.email ? patient.email : '—'}</td>
                <td data-label="DOB">${patient.dobISO ? AppData.isoToMMDDYYYY(patient.dobISO) : '—'}</td>
                <td data-label="Gender">${patient.gender ? patient.gender : '—'}</td>
                <td data-label="Appointments">${apptCount}</td>
            </tr>
        `;
    }

    function render() {
        const patients = AppData.getPatients();
        countLabel.textContent = `${patients.length} patient${patients.length === 1 ? '' : 's'} registered`;

        if (patients.length === 0) {
            tableBody.innerHTML = '<tr class="empty-row"><td colspan="6"><div class="empty-state"><i class="bi bi-people"></i><p>No patients yet. Add one, or create an appointment.</p></div></td></tr>';
            emptyState.style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            tableBody.innerHTML = patients.map(renderRow).join('');
        }
    }

    function openModal() {
        form.reset();
        clearErrors();
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
        document.getElementById('fullName').focus();
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

    /* auto-formatea el input de fecha de nacimiento como MM/DD/YYYY */
    const dobInput = document.getElementById('dob');
    dobInput.addEventListener('input', function () {
        let digits = dobInput.value.replace(/\D/g, '').slice(0, 8);
        let out = digits;
        if (digits.length > 4) {
            out = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
        } else if (digits.length > 2) {
            out = `${digits.slice(0, 2)}/${digits.slice(2)}`;
        }
        dobInput.value = out;
    });

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        clearErrors();

        const name = document.getElementById('fullName').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const email = document.getElementById('email').value.trim();
        const dobStr = document.getElementById('dob').value.trim();
        const gender = document.getElementById('gender').value;
        const notes = document.getElementById('patientNotes').value.trim();

        let valid = true;

        if (!name) {
            markInvalid('group-name');
            valid = false;
        }

        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            markInvalid('group-email');
            valid = false;
        }

        let dobISO = '';
        if (dobStr) {
            dobISO = AppData.mmddyyyyToISO(dobStr);
            if (!dobISO) {
                markInvalid('group-dob');
                valid = false;
            }
        }

        if (!valid) return;

        AppData.addPatient({ name, phone, email, dobISO, gender, notes });

        closeModal();
        render();
    });

    render();
});
