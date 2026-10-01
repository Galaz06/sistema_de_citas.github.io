// ===== Referencias =====
const login_div = document.querySelector(".login");
const banner_content = document.querySelector(".banner-content");
const btn_toggle = document.querySelector("#sign-up-button");

const login_title_h1 = document.querySelector(".login-title h1");
const login_title_p = document.querySelector(".login-title p");
const submit_btn = document.querySelector(".login-form button");

const login_form = document.querySelector(".login-form");
const password_input = document.querySelector(".login-field.password input");
const password_icon = document.querySelector(".login-field.password i");

// REFERENCIAS PARA EL CARRUSEL Y NUEVOS PANELES
const login_slider = document.querySelector(".login-slider");
const forgot_link = document.querySelector("#forgot-link");

const forgot_form = document.querySelector("#forgot-form");
const forgot_email_input = document.querySelector("#forgot-email-input");

const reset_form = document.querySelector("#reset-form");
const reset_subtitle = document.querySelector("#reset-subtitle");
const new_password_input = document.querySelector("#new-password-input");
const new_password_icon = document.querySelector("#new-password-icon");


// Función para enmascarar el correo
function maskEmail(email) {
    if (!email || !email.includes('@')) return email;

    const [name, domain] = email.split('@');

    // Si el nombre tiene 3 letras o menos, mostramos solo 1 letra
    if (name.length <= 3) {
        return `${name[0]}***@${domain}`;
    }

    // Si tiene más de 3 letras, mostramos las primeras 3 y ocultamos el resto
    const visiblePart = name.substring(0, 3);
    return `${visiblePart}***@${domain}`;
}


// ===== Estado Global =====
let isRegisterMode = false;
let currentPane = 1; // 1 = Login/Register, 2 = Forgot (Email), 3 = Reset (Code + Pass)

// ===== Textos por modo (Login/Register) =====
const texts = {
    login: {
        title: "Login",
        subtitle: "Enter your credentials to continue",
        button: "Login",
        toggleBtn: "Sign up"
    },
    register: {
        title: "Sign Up",
        subtitle: "Create an account to get started",
        button: "Sign Up",
        toggleBtn: "Login"
    }
};

// Función de ayuda para mover el slider
function updateSliderPosition() {
    login_slider.className = "login-slider step-" + currentPane;
}

// ===== Lógica del botón del Banner (Toggle / Back) =====
btn_toggle.addEventListener('click', function() {
    
    // Si estamos en el paso 3 (Poner Código), regresar al paso 2 (Poner Email)
    if (currentPane === 3) {
        currentPane = 2;
        updateSliderPosition();
        btn_toggle.querySelector('b').textContent = "Back to Sign In"; // El botón vuelve a decir esto
        return; 
    }

    // Si estamos en el paso 2 (Poner Email), regresar al paso 1 (Login principal)
    if (currentPane === 2) {
        currentPane = 1;
        updateSliderPosition();
        
        // Restaurar el texto original del botón (Sign up o Login)
        const current = isRegisterMode ? texts.register : texts.login;
        btn_toggle.querySelector('b').textContent = current.toggleBtn;
        return; 
    }

    // Si NO estamos en Forgot Password (paso 1), hacemos el toggle normal de Login/Registro
    isRegisterMode = !isRegisterMode;
    if (typeof showAuthError === 'function') showAuthError('');
    login_div.classList.toggle('collapsed');
    banner_content.classList.toggle('collapsed');

    const current = isRegisterMode ? texts.register : texts.login;
    login_title_h1.textContent = current.title;
    login_title_p.textContent = current.subtitle;
    submit_btn.querySelector('b').textContent = current.button;
    btn_toggle.querySelector('b').textContent = current.toggleBtn;
});

// ===== 1. Iniciar Forgot Password (Ir a Panel 2) =====
forgot_link.addEventListener('click', function(e) {
    e.preventDefault(); 
    currentPane = 2; 
    updateSliderPosition();
    btn_toggle.querySelector('b').textContent = "Back to Sign In";
});

// ===== 2. Enviar Email para Código (Ir a Panel 3) =====
forgot_form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Obtener y enmascarar el email
    const userEmail = forgot_email_input.value;
    const maskedEmail = maskEmail(userEmail);

    // Inyectamos el texto limpio usando la versión recortada
    reset_subtitle.innerHTML = `A verification code was sent to <span class="highlight-email">${maskedEmail}</span>`;

    currentPane = 3;
    updateSliderPosition();
    btn_toggle.querySelector('b').textContent = "Back to Reset Password";
});

// ===== 3. Confirmar Nueva Contraseña (Regresar al Login) =====
reset_form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Simulación visual: Regresamos al principio
    currentPane = 1;
    updateSliderPosition();
    
    // Restauramos el botón del banner al texto normal
    const current = isRegisterMode ? texts.register : texts.login;
    btn_toggle.querySelector('b').textContent = current.toggleBtn;

    // Limpiar los formularios para seguridad
    forgot_form.reset();
    reset_form.reset();
});

// ===== Login / Registro reales (contra la "DB" en localStorage) =====
const auth_error = document.querySelector("#auth-error");
const login_email_input = login_form.querySelector('input[type="email"]');
const remember_checkbox = login_form.querySelector('input[type="checkbox"]');

function showAuthError(msg) { auth_error.textContent = msg; }

// Si ya hay sesión activa, directo al sistema
Auth.redirectIfLoggedIn();

[login_email_input, password_input].forEach(function (inp) {
    inp.addEventListener('input', function () { showAuthError(''); });
});

login_form.addEventListener('submit', function(e) {
    e.preventDefault();
    showAuthError('');

    const email = login_email_input.value;
    const password = password_input.value;
    const remember = remember_checkbox.checked;

    const result = isRegisterMode
        ? Auth.register(email, password, remember)
        : Auth.login(email, password, remember);

    if (!result.ok) {
        showAuthError(result.error);
        return;
    }
    window.location.href = Auth.HOME_URL;
});

// ===== Mostrar/ocultar contraseña (Login Original) =====
password_icon.addEventListener('click', function() {
    const isHidden = password_input.type === 'password';
    password_input.type = isHidden ? 'text' : 'password';
    password_icon.classList.toggle('bi-eye-fill', !isHidden);
    password_icon.classList.toggle('bi-eye-slash-fill', isHidden);
});

// ===== Mostrar/ocultar contraseña (Nueva Contraseña Panel 3) =====
new_password_icon.addEventListener('click', function() {
    const isHidden = new_password_input.type === 'password';
    new_password_input.type = isHidden ? 'text' : 'password';
    new_password_icon.classList.toggle('bi-eye-fill', !isHidden);
    new_password_icon.classList.toggle('bi-eye-slash-fill', isHidden);
});

// Iniciar en posición 1 por defecto
updateSliderPosition();