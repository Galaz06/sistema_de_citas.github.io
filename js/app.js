/* =========================================================
   app.js — Funciones compartidas por todas las páginas:
   modo oscuro, notificaciones y cuenta de usuario.
   ========================================================= */
const AppShell = (function () {
    const THEME_KEY = 'asys_theme';
    const $ = (sel, root) => (root || document).querySelector(sel);

    /* ---------- modo oscuro ---------- */
    function currentTheme() { return localStorage.getItem(THEME_KEY) || 'light'; }
    function applyTheme(t) {
        document.documentElement.setAttribute('data-theme', t);
        const icon = $('#themeToggle i');
        if (icon) icon.className = t === 'dark' ? 'bi bi-sun' : 'bi bi-moon';
    }
    function toggleTheme() {
        const next = currentTheme() === 'dark' ? 'light' : 'dark';
        localStorage.setItem(THEME_KEY, next);
        applyTheme(next);
    }

    /* ---------- utilidades ---------- */
    function esc(s) {
        return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }
    function timeAgo(ts) {
        const m = Math.floor((Date.now() - ts) / 60000);
        if (m < 1) return 'Just now';
        if (m < 60) return m + ' min ago';
        const h = Math.floor(m / 60);
        if (h < 24) return h + ' h ago';
        return Math.floor(h / 24) + ' d ago';
    }

    /* ---------- notificaciones ---------- */
    let panel;
    function refreshNotifications() {
        const badge = $('#notifBadge');
        const n = AppData.unreadCount();
        if (badge) {
            badge.style.display = n > 0 ? 'flex' : 'none';
            badge.firstElementChild.textContent = n > 9 ? '9+' : n;
        }
        if (!panel) return;
        const list = AppData.getNotifications();
        $('.notif-list', panel).innerHTML = list.length
            ? list.map(x => `
                <li class="notif-item ${x.read ? '' : 'unread'}">
                    <i class="bi bi-calendar-plus"></i>
                    <div><p>${esc(x.message)}</p><span>${timeAgo(x.createdAt)}</span></div>
                </li>`).join('')
            : '<li class="notif-empty"><i class="bi bi-bell-slash"></i><p>No notifications</p></li>';
    }

    function setupNotifications() {
        const bell = $('#notifBell');
        if (!bell) return;
        panel = document.createElement('div');
        panel.className = 'notif-panel';
        panel.innerHTML = `
            <div class="notif-header">
                <h4>Notifications</h4>
                <div>
                    <button type="button" data-n="read">Mark as read</button>
                    <button type="button" data-n="clear">Clear</button>
                </div>
            </div>
            <ul class="notif-list"></ul>`;
        bell.appendChild(panel);

        bell.addEventListener('click', function (e) {
            if (panel.contains(e.target)) return;
            panel.classList.toggle('open');
            refreshNotifications();
        });
        panel.addEventListener('click', function (e) {
            const b = e.target.closest('[data-n]');
            if (!b) return;
            if (b.dataset.n === 'read') AppData.markAllNotificationsRead();
            if (b.dataset.n === 'clear') AppData.clearNotifications();
            refreshNotifications();
        });
        document.addEventListener('click', function (e) {
            if (!bell.contains(e.target)) panel.classList.remove('open');
        });
        // Se actualiza si se crea una cita en otra pestaña
        window.addEventListener('storage', refreshNotifications);
        refreshNotifications();
    }

    /* ---------- cuenta ---------- */
    function initialsOf(name) {
        const words = (name || '').trim().split(/\s+/).filter(Boolean);
        if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
        return (words[0] || 'U').replace(/[^a-z0-9]/gi, '').slice(0, 2).toUpperCase() || 'U';
    }
    function paintUser() {
        const u = AppData.getUser();
        const photo = $('#userPhoto span');
        if (photo) photo.innerHTML = `<b>${esc(initialsOf(u.name))}</b>`;
        const n = $('#userNameLabel'); if (n) n.textContent = u.name;
        const r = $('#userRoleLabel'); if (r) r.textContent = u.role;
        const w = $('#welcomeName'); if (w) w.textContent = u.name;
    }

    function doLogout() {
        Auth.logout();
        location.href = Auth.LOGIN_URL;
    }
    function setupLogout() {
        document.querySelectorAll('.logout a, .mobile-nav-logout a').forEach(function (link) {
            link.addEventListener('click', function (e) { e.preventDefault(); doLogout(); });
        });
    }

    let accountModal;
    function setupAccount() {
        const profile = $('#userProfile');
        accountModal = document.createElement('div');
        accountModal.className = 'modal-overlay';
        accountModal.innerHTML = `
            <div class="modal-box">
                <div class="modal-header">
                    <div><h3>My account</h3><p>Your basic profile information</p></div>
                    <button class="modal-close" type="button" data-close aria-label="Close"><i class="bi bi-x-lg"></i></button>
                </div>
                <form id="accountForm" novalidate>
                    <div class="form-grid">
                        <div class="form-group" id="acc-group-name">
                            <label for="accName">Full name</label>
                            <input type="text" id="accName" required>
                            <span class="form-error">Please enter your name.</span>
                        </div>
                        <div class="form-group">
                            <label for="accRole">Specialty / role</label>
                            <input type="text" id="accRole" placeholder="General Practitioner">
                        </div>
                        <div class="form-row">
                            <div class="form-group" id="acc-group-email">
                                <label for="accEmail">Email <span class="hint">(username)</span></label>
                                <input type="email" id="accEmail" readonly disabled>
                                <span class="form-error"></span>
                            </div>
                            <div class="form-group">
                                <label for="accPhone">Phone <span class="hint">(optional)</span></label>
                                <input type="tel" id="accPhone">
                            </div>
                        </div>
                        <div class="account-section">
                            <div>
                                <b>Dark mode</b>
                                <span>Switch the look of the whole system</span>
                            </div>
                            <button type="button" class="btn btn-secondary" id="accThemeBtn"></button>
                        </div>
                        <div class="account-section">
                            <div>
                                <b>Session</b>
                                <span>Signed in as <span id="accSignedAs"></span></span>
                            </div>
                            <button type="button" class="btn btn-secondary" id="accLogoutBtn"><i class="bi bi-box-arrow-left"></i><span>Log out</span></button>
                        </div>
                        <div class="account-section danger-zone">
                            <div>
                                <b>Reset my data</b>
                                <span>Deletes every appointment, patient and notification of this account</span>
                            </div>
                            <button type="button" class="btn btn-danger" id="accResetBtn">Reset</button>
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn btn-secondary" data-close>Cancel</button>
                        <button type="submit" class="btn btn-primary"><i class="bi bi-check2"></i><span>Save changes</span></button>
                    </div>
                </form>
            </div>`;
        document.body.appendChild(accountModal);

        function themeBtnLabel() {
            $('#accThemeBtn', accountModal).innerHTML = currentTheme() === 'dark'
                ? '<i class="bi bi-sun"></i><span>Use light</span>'
                : '<i class="bi bi-moon"></i><span>Use dark</span>';
        }
        function open() {
            const u = AppData.getUser();
            $('#accName', accountModal).value = u.name;
            $('#accRole', accountModal).value = u.role;
            $('#accEmail', accountModal).value = u.email;
            $('#accPhone', accountModal).value = u.phone;
            $('#accSignedAs', accountModal).textContent = u.email;
            accountModal.querySelectorAll('.invalid').forEach(g => g.classList.remove('invalid'));
            themeBtnLabel();
            accountModal.classList.add('open');
            document.body.style.overflow = 'hidden';
        }
        function close() {
            accountModal.classList.remove('open');
            document.body.style.overflow = '';
        }

        if (profile) profile.addEventListener('click', open);
        document.querySelectorAll('[data-page-link="settings"]').forEach(a => {
            a.addEventListener('click', function (e) { e.preventDefault(); open(); });
        });
        accountModal.addEventListener('click', function (e) {
            if (e.target === accountModal || e.target.closest('[data-close]')) close();
        });
        $('#accLogoutBtn', accountModal).addEventListener('click', doLogout);
        $('#accThemeBtn', accountModal).addEventListener('click', function () { toggleTheme(); themeBtnLabel(); });
        $('#accResetBtn', accountModal).addEventListener('click', function () {
            if (!confirm('This will delete ALL appointments, patients and notifications. Continue?')) return;
            AppData.resetUserData();
            location.reload();
        });
        $('#accountForm', accountModal).addEventListener('submit', function (e) {
            e.preventDefault();
            const name = $('#accName', accountModal).value.trim();
            let ok = true;
            accountModal.querySelectorAll('.invalid').forEach(g => g.classList.remove('invalid'));
            if (!name) { $('#acc-group-name', accountModal).classList.add('invalid'); ok = false; }
            if (!ok) return;
            AppData.saveUser({
                name,
                role: $('#accRole', accountModal).value.trim(),
                phone: $('#accPhone', accountModal).value.trim()
            });
            paintUser();
            close();
        });
    }

    /* ---------- botón de tema en el header ---------- */
    function setupThemeButton() {
        const container = $('.user-container');
        if (!container) return;
        const btn = document.createElement('div');
        btn.className = 'circle';
        btn.id = 'themeToggle';
        btn.title = 'Toggle dark mode';
        btn.innerHTML = '<i class="bi bi-moon"></i>';
        btn.addEventListener('click', toggleTheme);
        container.insertBefore(btn, container.firstChild);
    }

    document.addEventListener('DOMContentLoaded', function () {
        setupThemeButton();
        applyTheme(currentTheme());
        setupNotifications();
        setupAccount();
        setupLogout();
        paintUser();
    });

    return { refreshNotifications, applyTheme, currentTheme };
})();
