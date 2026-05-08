document.addEventListener('DOMContentLoaded', () => {
    const loginScreen = document.getElementById('login-screen');
    const dashboardScreen = document.getElementById('dashboard-screen');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const logoutBtn = document.getElementById('logout-btn');
    const calendarGrid = document.getElementById('calendar-grid');
    const loading = document.getElementById('loading');

    // Credentials provided by user
    const VALID_USER = 'LlantecaElSalvador';
    const VALID_PASS = 'Llanteca2026@';

    // Google Sheets CSV Export URL
    const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1TznppsHvwjgG23XZCQSRasZIK3sXt_Di/export?format=csv';

    // Hover animation for login background
    const loginBg = document.getElementById('login-bg-image');
    if (loginScreen && loginBg) {
        loginScreen.addEventListener('mousemove', (e) => {
            const x = (window.innerWidth / 2 - e.pageX) / 50;
            const y = (window.innerHeight / 2 - e.pageY) / 50;
            loginBg.style.transform = `translate(${x}px, ${y}px) scale(1.05)`;
        });
    }

    // Modal logic
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('modal-img');
    const closeModal = document.getElementById('close-modal');

    window.openFullscreen = function(url) {
        modal.classList.add('active');
        modalImg.src = url;
    };

    closeModal.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });

    // Check login state
    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        showDashboard();
    }

    // Login Form Submit
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = document.getElementById('username').value;
        const pass = document.getElementById('password').value;

        if (user === VALID_USER && pass === VALID_PASS) {
            sessionStorage.setItem('isLoggedIn', 'true');
            loginError.style.display = 'none';
            showDashboard();
        } else {
            loginError.style.display = 'block';
        }
    });

    // Logout
    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('isLoggedIn');
        loginForm.reset();
        dashboardScreen.classList.remove('active');
        loginScreen.classList.add('active');
    });

    function showDashboard() {
        loginScreen.classList.remove('active');
        dashboardScreen.classList.add('active');
        fetchCalendarData();
    }

    function fetchCalendarData() {
        calendarGrid.innerHTML = '';
        loading.style.display = 'block';

        Papa.parse(SHEET_CSV_URL, {
            download: true,
            header: true,
            complete: function(results) {
                loading.style.display = 'none';
                renderCards(results.data);
            },
            error: function(error) {
                loading.style.display = 'none';
                calendarGrid.innerHTML = '<p style="color:red; text-align:center; width:100%;">Error al cargar los datos. Asegúrate de tener conexión a internet.</p>';
            }
        });
    }

    function getDirectImageLink(url) {
        if (!url) return null;
        
        // Regex para extraer el ID de un enlace de Google Drive
        const driveRegex = /\/d\/([a-zA-Z0-9_-]+)/;
        const match = url.match(driveRegex);
        
        if (match && match[1]) {
            // Usa la API de thumbnail para evitar los bloqueos de Drive en etiquetas <img>
            return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1000`;
        }
        
        // Si no es un enlace de Drive, lo devuelve tal cual
        return url;
    }

    function renderCards(data) {
        data.forEach(row => {
            // Validate row has essential data (Fecha or Copy)
            if (!row['Fecha de Publicación'] && !row['Copy para Redes Sociales (FB/IG)']) return;

            const card = document.createElement('div');
            card.className = 'content-card';

            const fecha = row['Fecha de Publicación'] || 'Pendiente';
            const objetivo = row['Objetivo'] || 'General';
            const tipo = row['Tipo de Contenido'] || 'Post';
            const copy = row['Copy para Redes Sociales (FB/IG)'] || 'Sin texto';
            const visualDesc = row['Descripción del Contenido Gráfico'] || 'Imagen no disponible';
            
            // Buscar la URL de la imagen en posibles columnas nuevas
            const rawUrl = row['URL Imagen'] || row['Link de Imagen'] || row['Imagen'] || '';
            const directImgUrl = getDirectImageLink(rawUrl);

            let mediaHTML = '';
            if (directImgUrl) {
                // Si hay URL, mostrar la imagen con boton de ampliar
                mediaHTML = `
                    <div style="position: relative; width: 100%; display: flex; align-items: center; justify-content: center; background: transparent;">
                        <img src="${directImgUrl}" alt="Contenido Visual" style="width: 100%; height: auto; display: block; border-radius: 0;" onerror="this.onerror=null; this.outerHTML='<div style=\\'padding:2rem; text-align:center; color:var(--accent-blue);\\'><p>⚠️</p><p style=\\'font-size:0.85rem;\\'>Imagen no disponible o sin permisos</p></div>';">
                        <button class="fullscreen-btn" onclick="openFullscreen('${directImgUrl}')" title="Ver en pantalla completa">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>
                        </button>
                    </div>
                `;
            } else {
                // Si no hay URL, mostrar la descripción en texto
                mediaHTML = `<p>📸 ${visualDesc}</p>`;
            }

            card.innerHTML = `
                <div class="card-header">
                    <span class="date-badge">${fecha}</span>
                    <span class="type-badge">${tipo}</span>
                </div>
                <div class="card-image-placeholder" style="${directImgUrl ? 'padding: 0; background: transparent;' : ''}">
                    ${mediaHTML}
                </div>
                <div class="card-body">
                    <div class="objective">Objetivo: ${objetivo}</div>
                    <div class="copy-text">${copy}</div>
                </div>
            `;
            calendarGrid.appendChild(card);
        });
        
        if(calendarGrid.children.length === 0) {
            calendarGrid.innerHTML = '<p style="text-align:center; width:100%; color:var(--text-secondary);">No hay contenidos disponibles en el calendario.</p>';
        }
    }
});
