document.addEventListener('DOMContentLoaded', function () {
    const btn_sidebar = document.querySelector(".btn-sidebar");
    const sidebar = document.querySelector(".sidebar");

    if (!btn_sidebar || !sidebar) return;

    btn_sidebar.addEventListener("click", () => {
        sidebar.classList.toggle("collapsed");
        btn_sidebar.classList.toggle("collapsed");
    });
});


document.addEventListener('DOMContentLoaded', function () {
    var toggleBtn = document.getElementById('mobileMenuBtn');
    var overlay = document.getElementById('mobileNavOverlay');
    var backdrop = document.getElementById('mobileNavBackdrop');
    var closeBtn = document.getElementById('mobileNavClose');

    if (!overlay) return;

    function isMobile() {
        return window.innerWidth <= 768;
    }

    function openNav() {
        overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeNav() {
        overlay.classList.remove('open');
        document.body.style.overflow = '';
    }

    if (toggleBtn) {
        toggleBtn.addEventListener('click', function () {
            if (isMobile()) {
                openNav();
            }
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', closeNav);
    }

    if (backdrop) {
        backdrop.addEventListener('click', closeNav);
    }

    window.addEventListener('resize', function () {
        if (!isMobile()) closeNav();
    });
});


/* =========================================================
   Resaltado de sección activa
   Cada página define <body data-page="home|appointments|patients|schedule|settings">
   y cada link del sidebar / mobile-nav define data-page="...".
   Así, al entrar a cualquier página, el ítem correspondiente
   queda pintado con el mismo celeste que usa el :hover.
   ========================================================= */
document.addEventListener('DOMContentLoaded', function () {
    const currentPage = document.body.getAttribute('data-page');
    if (!currentPage) return;

    document.querySelectorAll('[data-page-link]').forEach(function (link) {
        if (link.getAttribute('data-page-link') === currentPage) {
            link.closest('.nav-link')?.classList.add('active');
            link.classList.add('active-link');
        }
    });
});