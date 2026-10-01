/* =========================================================
   auth.js — "Base de datos" de usuarios sobre localStorage.
   Estructura:
     asys_users_v1   -> { "correo@x.com": { email, passHash, name, role, phone, createdAt } }
     asys_session_v1 -> correo del usuario con sesión activa
                        (localStorage si marcó "Remember me", si no sessionStorage)
   Los datos de cada usuario (citas, pacientes, notificaciones) se guardan
   en AppData con claves separadas por correo.
   OJO: es una simulación en el navegador. No es seguridad real.
   ========================================================= */
const Auth = (function () {
    const USERS_KEY = 'asys_users_v1';
    const SESSION_KEY = 'asys_session_v1';
    const DEFAULT_ROLE = 'General Practitioner';

    const inHtmlDir = /\/html\/[^/]*$/i.test(location.pathname);
    const LOGIN_URL = inHtmlDir ? 'login.html' : 'html/login.html';
    const HOME_URL = inHtmlDir ? '../index.html' : 'index.html';

    function normalize(email) { return String(email || '').trim().toLowerCase(); }

    // Hash simple (cyrb53) con el correo como sal: evita guardar la clave en texto plano.
    function hash(password, email) {
        const str = email + '|' + password;
        let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
        for (let i = 0; i < str.length; i++) {
            const ch = str.charCodeAt(i);
            h1 = Math.imul(h1 ^ ch, 2654435761);
            h2 = Math.imul(h2 ^ ch, 1597334677);
        }
        h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
        h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
        return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
    }

    function readUsers() {
        try {
            const u = JSON.parse(localStorage.getItem(USERS_KEY));
            return u && typeof u === 'object' ? u : {};
        } catch (e) { return {}; }
    }
    function writeUsers(users) { localStorage.setItem(USERS_KEY, JSON.stringify(users)); }

    function currentEmail() {
        const e = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
        return e && readUsers()[e] ? e : null; // sesión inválida si el usuario ya no existe
    }

    function setSession(email, remember) {
        sessionStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(SESSION_KEY);
        (remember ? localStorage : sessionStorage).setItem(SESSION_KEY, email);
    }

    function register(emailRaw, password, remember) {
        const email = normalize(emailRaw);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: 'Please enter a valid email.' };
        if (!password || password.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' };
        const users = readUsers();
        if (users[email]) return { ok: false, error: 'An account with this email already exists.' };
        users[email] = {
            email,
            passHash: hash(password, email),
            name: email,            // el correo es el nombre de usuario
            role: DEFAULT_ROLE,
            phone: '',
            createdAt: Date.now()
        };
        writeUsers(users);
        setSession(email, remember);
        return { ok: true };
    }

    function login(emailRaw, password, remember) {
        const email = normalize(emailRaw);
        const user = readUsers()[email];
        if (!user) return { ok: false, error: 'No account found with this email.' };
        if (user.passHash !== hash(password, email)) return { ok: false, error: 'Incorrect password.' };
        setSession(email, remember);
        return { ok: true };
    }

    function logout() {
        sessionStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(SESSION_KEY);
    }

    function getAccount() {
        const email = currentEmail();
        const u = email ? readUsers()[email] : null;
        if (!u) return { email: '', name: '', role: DEFAULT_ROLE, phone: '' };
        return { email: u.email, name: u.name || u.email, role: u.role || DEFAULT_ROLE, phone: u.phone || '' };
    }

    function updateAccount(fields) {
        const email = currentEmail();
        if (!email) return;
        const users = readUsers();
        const u = users[email];
        if (fields.name !== undefined) u.name = fields.name.trim() || email;
        if (fields.role !== undefined) u.role = fields.role.trim() || DEFAULT_ROLE;
        if (fields.phone !== undefined) u.phone = fields.phone.trim();
        writeUsers(users);
    }

    // Páginas privadas: sin sesión -> al login.
    function requireSession() {
        if (!currentEmail()) {
            location.replace(LOGIN_URL);
            return false;
        }
        return true;
    }
    // Página de login: con sesión -> directo al dashboard.
    function redirectIfLoggedIn() {
        if (currentEmail()) location.replace(HOME_URL);
    }

    return {
        DEFAULT_ROLE, LOGIN_URL, HOME_URL,
        register, login, logout, currentEmail,
        getAccount, updateAccount, requireSession, redirectIfLoggedIn
    };
})();
