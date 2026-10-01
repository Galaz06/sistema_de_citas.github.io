/* =========================================================
   data.js — Capa de datos compartida (Patients + Appointments)
   Persistencia simple con localStorage para que Appointments,
   Patients, Schedule y Home lean/escriban la misma info.
   ========================================================= */

const AppData = (function () {
    const PATIENTS_KEY = 'asys_patients_v1';
    const APPTS_KEY = 'asys_appointments_v1';
    const SEED_FLAG_KEY = 'asys_multiuser_v3';
    const NOTIF_KEY = 'asys_notifications_v1';

    // Cada usuario tiene sus propias claves: <clave>::<correo>
    function k(base) {
        return base + '::' + (Auth.currentEmail() || '__none__');
    }

    const SPECIALTIES = [
        'Cardiology checkup',
        'Electrocardiogram',
        'Follow-up consultation',
        'First consultation',
        'Stress test',
        'Other'
    ];

    const COLOR_CLASSES = ['color-1', 'color-2', 'color-3', 'color-4', 'color-5'];

    /* ---------- utilidades ---------- */

    function pad(n) { return String(n).padStart(2, '0'); }

    function todayISO() {
        const d = new Date();
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }

    function isoFromOffset(days) {
        const d = new Date();
        d.setDate(d.getDate() + days);
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }

    function initials(name) {
        return name
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map(w => w[0] ? w[0].toUpperCase() : '')
            .join('');
    }

    function colorForIndex(i) {
        return COLOR_CLASSES[i % COLOR_CLASSES.length];
    }

    function uid(prefix) {
        return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
    }

    // "2026-09-04" -> "04 Sep 2026"
    function formatDateDisplay(iso) {
        if (!iso) return '';
        const [y, m, d] = iso.split('-').map(Number);
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        return `${pad(d)} ${months[m - 1]} ${y}`;
    }

    // "2026-09-04" -> "09/04/2026" (mm/dd/yyyy)
    function isoToMMDDYYYY(iso) {
        if (!iso) return '';
        const [y, m, d] = iso.split('-');
        return `${m}/${d}/${y}`;
    }

    // "09/04/2026" -> "2026-09-04" | null si es inválida
    function mmddyyyyToISO(str) {
        const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec((str || '').trim());
        if (!match) return null;
        const [, mm, dd, yyyy] = match;
        const m = Number(mm), d = Number(dd), y = Number(yyyy);
        if (m < 1 || m > 12 || d < 1 || d > 31) return null;
        const date = new Date(y, m - 1, d);
        if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
        return `${y}-${pad(m)}-${pad(d)}`;
    }

    // "09:00" (24h) -> "09:00 AM"
    function time24to12(t) {
        if (!t) return '';
        const [hStr, mStr] = t.split(':');
        let h = Number(hStr);
        const suffix = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        if (h === 0) h = 12;
        return `${pad(h)}:${mStr} ${suffix}`;
    }

    function sortKey(appt) {
        return `${appt.dateISO} ${appt.time24}`;
    }

    /* ---------- storage bajo nivel ---------- */

    function readPatients() {
        try {
            return JSON.parse(localStorage.getItem(k(PATIENTS_KEY))) || [];
        } catch (e) { return []; }
    }
    function writePatients(list) {
        localStorage.setItem(k(PATIENTS_KEY), JSON.stringify(list));
    }
    function readAppointments() {
        try {
            return JSON.parse(localStorage.getItem(k(APPTS_KEY))) || [];
        } catch (e) { return []; }
    }
    function writeAppointments(list) {
        localStorage.setItem(k(APPTS_KEY), JSON.stringify(list));
    }

    /* ---------- seed inicial ---------- */
    // Una sola vez: borra los datos viejos que no pertenecían a ningún usuario.
    function seedIfNeeded() {
        if (localStorage.getItem(SEED_FLAG_KEY)) return;
        ['asys_patients_v1', 'asys_appointments_v1', 'asys_notifications_v1', 'asys_user_v1', 'asys_seeded_v1', 'asys_clean_start_v2']
            .forEach(key => localStorage.removeItem(key));
        localStorage.setItem(SEED_FLAG_KEY, '1');
    }

    function resetUserData() {
        [PATIENTS_KEY, APPTS_KEY, NOTIF_KEY].forEach(base => localStorage.removeItem(k(base)));
    }

    /* ---------- API pública: pacientes ---------- */

    function getPatients() {
        return readPatients();
    }

    function findPatientByName(name) {
        const target = name.trim().toLowerCase();
        return readPatients().find(p => p.name.trim().toLowerCase() === target) || null;
    }

    function addPatient(data) {
        const patients = readPatients();
        const patient = {
            id: uid('pat'),
            name: data.name.trim(),
            initials: initials(data.name),
            colorClass: colorForIndex(patients.length),
            phone: data.phone || '',
            email: data.email || '',
            dobISO: data.dobISO || '',
            gender: data.gender || '',
            notes: data.notes || ''
        };
        patients.push(patient);
        writePatients(patients);
        return patient;
    }

    // Devuelve el paciente existente (por nombre) o crea uno nuevo automáticamente.
    function getOrCreatePatientByName(name, extra) {
        const existing = findPatientByName(name);
        if (existing) return existing;
        return addPatient(Object.assign({ name }, extra || {}));
    }

    function countAppointmentsForPatient(patientId) {
        return readAppointments().filter(a => a.patientId === patientId).length;
    }

    /* ---------- API pública: citas ---------- */

    function getAppointments() {
        return readAppointments();
    }

    function getUpcomingAppointments() {
        const today = todayISO();
        return readAppointments()
            .filter(a => a.dateISO >= today && a.status !== 'completed' && a.status !== 'cancelled')
            .sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
    }

    function getAllAppointmentsHistory() {
        return readAppointments()
            .slice()
            .sort((a, b) => sortKey(b).localeCompare(sortKey(a))); // más reciente primero
    }

    function getAppointmentsByDate(iso) {
        return readAppointments()
            .filter(a => a.dateISO === iso)
            .sort((a, b) => a.time24.localeCompare(b.time24));
    }

    function getAppointmentCountsByMonth(year, monthIndex0) {
        const counts = {};
        readAppointments().forEach(a => {
            const [y, m] = a.dateISO.split('-').map(Number);
            if (y === year && (m - 1) === monthIndex0) {
                counts[a.dateISO] = (counts[a.dateISO] || 0) + 1;
            }
        });
        return counts;
    }

    function addAppointment(data) {
        const patient = getOrCreatePatientByName(data.patientName, { phone: data.patientPhone || '' });
        const appts = readAppointments();
        const appt = {
            id: uid('appt'),
            patientId: patient.id,
            patientName: patient.name,
            initials: patient.initials,
            colorClass: patient.colorClass,
            dateISO: data.dateISO,
            time24: data.time24,
            specialty: data.specialty,
            notes: data.notes || '',
            status: data.status || 'confirmed'
        };
        appts.push(appt);
        writeAppointments(appts);
        addNotification(`New appointment: ${appt.patientName} · ${formatDateDisplay(appt.dateISO)} at ${time24to12(appt.time24)}`);
        return appt;
    }

    function updateAppointmentStatus(id, status) {
        const list = readAppointments();
        const a = list.find(x => x.id === id);
        if (!a) return;
        a.status = status;
        writeAppointments(list);
    }
    function deleteAppointment(id) {
        writeAppointments(readAppointments().filter(a => a.id !== id));
    }

    /* ---------- cuenta de usuario ---------- */

    function getUser() { return Auth.getAccount(); }
    function saveUser(data) { Auth.updateAccount(data); return Auth.getAccount(); }

    /* ---------- notificaciones ---------- */

    function getNotifications() {
        try { return JSON.parse(localStorage.getItem(k(NOTIF_KEY))) || []; } catch (e) { return []; }
    }
    function writeNotifications(list) {
        localStorage.setItem(k(NOTIF_KEY), JSON.stringify(list.slice(0, 50)));
    }
    function addNotification(message) {
        const list = getNotifications();
        list.unshift({ id: uid('ntf'), message, createdAt: Date.now(), read: false });
        writeNotifications(list);
    }
    function markAllNotificationsRead() {
        writeNotifications(getNotifications().map(n => Object.assign(n, { read: true })));
    }
    function clearNotifications() { writeNotifications([]); }
    function unreadCount() { return getNotifications().filter(n => !n.read).length; }

    /* ---------- estadísticas ---------- */

    function mondayOfWeek(date) {
        const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const diff = (d.getDay() + 6) % 7; // lunes = 0
        d.setDate(d.getDate() - diff);
        return d;
    }
    function isoOfDate(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }

    function getStats() {
        const all = readAppointments();
        const todayStr = todayISO();
        const today = all.filter(a => a.dateISO === todayStr);

        const mon = mondayOfWeek(new Date());
        const weekDays = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(mon); d.setDate(mon.getDate() + i);
            weekDays.push(isoOfDate(d));
        }
        const week = all.filter(a => weekDays.includes(a.dateISO));
        const perDay = weekDays.map(iso => week.filter(a => a.dateISO === iso).length);

        const lastMon = new Date(mon); lastMon.setDate(mon.getDate() - 7);
        const lastWeekDays = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(lastMon); d.setDate(lastMon.getDate() + i);
            lastWeekDays.push(isoOfDate(d));
        }
        const lastWeekTotal = all.filter(a => lastWeekDays.includes(a.dateISO)).length;

        const types = { checkups: 0, firstTime: 0, studies: 0, other: 0 };
        week.forEach(a => {
            if (a.specialty === 'Cardiology checkup' || a.specialty === 'Follow-up consultation') types.checkups++;
            else if (a.specialty === 'First consultation') types.firstTime++;
            else if (a.specialty === 'Electrocardiogram' || a.specialty === 'Stress test') types.studies++;
            else types.other++;
        });

        return {
            todayTotal: today.length,
            todayCompleted: today.filter(a => a.status === 'completed').length,
            todayPending: today.filter(a => a.status === 'pending' || a.status === 'confirmed').length,
            todayCancelled: today.filter(a => a.status === 'cancelled').length,
            perDay, weekTotal: week.length, lastWeekTotal, types,
            todayIndex: (new Date().getDay() + 6) % 7
        };
    }

    return {
        SPECIALTIES,
        resetUserData, getUser, saveUser, updateAppointmentStatus, deleteAppointment,
        getNotifications, addNotification, markAllNotificationsRead, clearNotifications, unreadCount,
        getStats,
        seedIfNeeded,
        todayISO,
        isoFromOffset,
        formatDateDisplay,
        isoToMMDDYYYY,
        mmddyyyyToISO,
        time24to12,
        getPatients,
        addPatient,
        findPatientByName,
        countAppointmentsForPatient,
        getAppointments,
        getUpcomingAppointments,
        getAllAppointmentsHistory,
        getAppointmentsByDate,
        getAppointmentCountsByMonth,
        addAppointment
    };
})();

// Siembra los datos de ejemplo la primera vez que se carga cualquier página.
AppData.seedIfNeeded();
