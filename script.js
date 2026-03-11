document.addEventListener('DOMContentLoaded', () => {
    document.documentElement.classList.add('js');

    const specialiteSelect = document.getElementById('specialiteFilter');
    const memoireList = document.getElementById('memoireList');
    const header = document.querySelector('header');
    const menuToggle = document.querySelector('.menu-toggle');
    const primaryNav = document.getElementById('primaryNav');

    function normalizeSpecialite(value) {
        return String(value || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, '');
    }

    function filterMemoires() {
        if (!specialiteSelect || !memoireList) return;
        const selected = normalizeSpecialite(specialiteSelect.value);
        const cards = memoireList.querySelectorAll('.card');
        cards.forEach(card => {
            const spec = normalizeSpecialite(card.getAttribute('data-specialite'));
            card.style.display = (selected === 'all' || spec === selected) ? '' : 'none';
        });
    }

    function setMenuOpen(isOpen) {
        if (!header || !menuToggle) return;
        header.classList.toggle('is-menu-open', isOpen);
        menuToggle.setAttribute('aria-expanded', String(isOpen));
    }

    function setupMenu() {
        if (!header || !menuToggle || !primaryNav) return;

        menuToggle.addEventListener('click', () => {
            const isOpen = header.classList.contains('is-menu-open');
            setMenuOpen(!isOpen);
        });

        primaryNav.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (!link) return;
            setMenuOpen(false);
        });

        document.addEventListener('click', (e) => {
            if (!header.classList.contains('is-menu-open')) return;
            const insideHeader = header.contains(e.target);
            if (!insideHeader) setMenuOpen(false);
        });

        document.addEventListener('keydown', (e) => {
            if (e.key !== 'Escape') return;
            if (!header.classList.contains('is-menu-open')) return;
            setMenuOpen(false);
            menuToggle.focus();
        });
    }

    function setupCardReveal() {
        const cards = memoireList ? Array.from(memoireList.querySelectorAll('.card')) : [];
        if (!cards.length) return;

        const reveal = (card) => card.classList.add('is-visible');

        if (!('IntersectionObserver' in window)) {
            cards.forEach(reveal);
            return;
        }

        cards.forEach(card => card.classList.add('will-reveal'));

        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                reveal(entry.target);
                io.unobserve(entry.target);
            });
        }, { root: null, threshold: 0.12 });

        cards.forEach(card => io.observe(card));
    }

    // NOTE: onglets de tri supprimés — on utilise uniquement le `select` pour filtrer
    if (specialiteSelect) {
        specialiteSelect.addEventListener('change', () => {
            filterMemoires();
        });
    }

    // Remplacer les boutons "Lire" existants par 2 icônes : view + download
    function replaceReadButtons() {
        if (!memoireList) return;
        const oldBtns = memoireList.querySelectorAll('.readBtn');
        oldBtns.forEach(b => {
            const file = b.getAttribute('data-file');
            const actions = document.createElement('div');
            actions.className = 'card-actions';

            // View button (opens preview)
            const view = document.createElement('button');
            view.type = 'button';
            view.className = 'icon-btn view';
            view.setAttribute('aria-label', 'Voir le document');
            view.dataset.file = file || '';
            view.innerHTML = `\
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">\
                    <path d="M12 5C7 5 2.73 8.11 1 12c1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7zm0 11.5a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9zm0-7a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z"/>\
                </svg>`;

            // Download button
            const dl = document.createElement('button');
            dl.type = 'button';
            dl.className = 'icon-btn download';
            dl.setAttribute('aria-label', 'Télécharger le document');
            dl.dataset.file = file || '';
            dl.innerHTML = `\
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">\
                    <path d="M12 16c-.3 0-.59-.11-.82-.33l-4-4a1.003 1.003 0 011.41-1.42L11 12.59V4a1 1 0 112 0v8.59l2.41-2.34a1.003 1.003 0 011.41 1.42l-4 4c-.23.22-.52.33-.82.33zM5 20a1 1 0 010-2h14a1 1 0 010 2H5z"/>\
                </svg>`;

            actions.appendChild(view);
            actions.appendChild(dl);

            // Remplace le parent du bouton existant
            const parentP = b.parentElement;
            if (parentP) parentP.replaceChild(actions, b);
        });
    }

    // Gestion des clics sur view / download
    if (memoireList) {
        memoireList.addEventListener('click', (e) => {
            const view = e.target.closest('.icon-btn.view');
            const dl = e.target.closest('.icon-btn.download');
            if (view) {
                const file = view.dataset.file;
                if (file) openDriveOrUrlInNewTab(file);
                try { StatsManager && StatsManager.recordPDFClick((view.closest('.card')||{}).dataset.specialite, (view.closest('.card')||{}).querySelector('h3')?.textContent || 'Sans titre'); } catch(e) {}
                return;
            }
            if (dl) {
                const file = dl.dataset.file;
                if (file) downloadFile(file);
                try { StatsManager && StatsManager.recordPDFClick((dl.closest('.card')||{}).dataset.specialite, (dl.closest('.card')||{}).querySelector('h3')?.textContent || 'Sans titre'); } catch(e) {}
                return;
            }
        });
    }

    function toDriveDownload(url) {
        try {
            const u = new URL(url);
            if (u.hostname.includes('drive.google.com')) {
                const m = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
                const id = m && m[1] ? m[1] : u.searchParams.get('id');
                if (id) return `https://drive.google.com/uc?export=download&id=${id}`;
            }
        } catch (err) {}
        return url;
    }

    function downloadFile(file) {
        const final = toDriveDownload(file);
        const a = document.createElement('a');
        a.href = final;
        a.setAttribute('rel', 'noopener noreferrer');
        a.download = '';
        document.body.appendChild(a);
        a.click();
        a.remove();
    }

    // Simple typing animation for hero text
    function initAnimatedText() {
        const el = document.querySelector('.animated-text');
        if (!el) return;
        const phrases = [
            'Bibliothèque de mémoires',
            'Trouvez le mémoire qui fera avancer votre projet',
            'Téléchargez ou consultez en un clic'
        ];
        let idx = 0, pos = 0, forward = true;

        function step() {
            const str = phrases[idx];
            if (forward) {
                pos++;
                el.textContent = str.slice(0, pos);
                if (pos >= str.length) { forward = false; setTimeout(step, 1200); return; }
            } else {
                pos--;
                el.textContent = str.slice(0, pos);
                if (pos <= 0) { forward = true; idx = (idx + 1) % phrases.length; }
            }
            setTimeout(step, forward ? 60 : 30);
        }
        step();
    }

    function toDrivePreview(url) {
        try {
            const u = new URL(url);
            if (u.hostname.includes('drive.google.com')) {
                const m = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
                if (m && m[1]) return `https://drive.google.com/file/d/${m[1]}/preview`;
                const id = u.searchParams.get('id');
                if (id) return `https://drive.google.com/file/d/${id}/preview`;
            }
        } catch (err) {
            // not a valid absolute URL - return original
        }
        return url;
    }

    function openDriveOrUrlInNewTab(file) {
        const finalUrl = toDrivePreview(file);
        const a = document.createElement('a');
        a.href = finalUrl;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        a.remove();
    }

    // appel initial
    setupMenu();
    setupCardReveal();
    replaceReadButtons();
    replaceSpecialiteLabels();
    initAnimatedText();
    filterMemoires();

    // Remove the visible "Spécialité :" prefix in card paragraphs and style them
    function replaceSpecialiteLabels() {
        const cards = document.querySelectorAll('.memoires .card');
        cards.forEach(card => {
            // Find the first <p> that contains the word 'Spécialité' (case-insensitive)
            const p = Array.from(card.querySelectorAll('p')).find(el => /spécialité\s*:/i.test(el.textContent));
            if (!p) return;
            // Extract text after ':' or after the word 'Spécialité'
            const match = p.textContent.match(/:\s*(.*)$/i);
            const value = match && match[1] ? match[1].trim() : p.textContent.replace(/spécialité\s*:?/i, '').trim();
            p.textContent = value || '';
            p.classList.add('specialite');
        });
    }

    // Highlight du lien de navigation actif
    try {
        const links = document.querySelectorAll('nav#primaryNav .nav-link');
        const current = location.href;
        links.forEach(link => {
            const href = link.getAttribute('href') || '';
            if (href.startsWith('#')) {
                if (location.hash === href) link.classList.add('is-nav-active');
            } else {
                // compare la fin de l'URL afin de fonctionner en file:// ou serveur
                if (current.endsWith(href) || (href === 'index.html' && current.endsWith('/'))) {
                    link.classList.add('is-nav-active');
                }
            }
        });
        // Add click handlers to update active state immediately and close menu on mobile
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                links.forEach(l => l.classList.remove('is-nav-active'));
                link.classList.add('is-nav-active');
                // close mobile menu
                try { setMenuOpen(false); } catch (err) {}
            });
        });
    } catch (err) {
        // silent
    }
});

// Ajoutez ceci à votre script.js existant

// ============================================
// SYSTÈME DE STATISTIQUES GLOBAL (FIREBASE)
// ============================================

// TODO: REMPLACEZ CECI PAR LA CONFIGURATION DE VOTRE PROJET FIREBASE !
const firebaseConfig = {
    apiKey: "AIzaSyB3KtzJ7VUTv7kQd0pHhaI-SpHpxNCdTqg",
    authDomain: "biblio-memo-73494.firebaseapp.com",
    databaseURL: "https://biblio-memo-73494-default-rtdb.firebaseio.com",
    projectId: "biblio-memo-73494",
    storageBucket: "biblio-memo-73494.firebasestorage.app",
    messagingSenderId: "386112484513",
    appId: "1:386112484513:web:3bb7ce8d9f35ee13b62ce0"
};

let db = null;

// On initialise Firebase uniquement si la configuration a été modifiée
if (firebaseConfig.apiKey !== "VOTRE_API_KEY_ICI") {
    firebase.initializeApp(firebaseConfig);
    db = firebase.database();
} else {
    console.warn("Firebase n'est pas configuré. Veuillez remplacer firebaseConfig dans script.js.");
}

const StatsManager = {
    init() {
        if (!db) return; // Stoppe si Firebase n'est pas configuré
        this.trackVisit();
        this.setupPDFTracking();
        
        // Si on est sur la page admin, écouter les données en temps réel
        const adminContainer = document.getElementById('statsContainer');
        if (adminContainer) {
            this.listenToStats(adminContainer);
        }
    },

    // Compteur de visites uniques (basé sur la session du navigateur)
    trackVisit() {
        const today = new Date().toDateString();
        const lastVisit = sessionStorage.getItem('rms_last_visit_session');
        
        if (lastVisit !== today) {
            sessionStorage.setItem('rms_last_visit_session', today);
            
            // Incrémente le compteur global de Firebase
            const visitsRef = db.ref('stats/totalVisits');
            visitsRef.transaction((currentVisits) => {
                return (currentVisits || 0) + 1;
            });
        }
    },

    setupPDFTracking() {
        const memoireList = document.getElementById('memoireList');
        if (!memoireList) return;

        memoireList.addEventListener('click', (e) => {
            const btn = e.target.closest('.icon-btn, .readBtn');
            if (!btn) return;

            const card = btn.closest('.card');
            const specialite = (card && card.dataset && card.dataset.specialite) ? card.dataset.specialite : 'unknown';
            const titleEl = card ? card.querySelector('h3') : null;
            const title = titleEl && titleEl.textContent ? titleEl.textContent.trim() : 'Sans titre';

            this.recordPDFClick(specialite, title);
        });
    },

    recordPDFClick(specialite, title) {
        if (!db) return;

        // 1. Incrémente le compteur total global
        db.ref('stats/totalPDFClicks').transaction((current) => {
            return (current || 0) + 1;
        });

        // 2. Incrémente par spécialité
        db.ref('stats/bySpecialite/' + specialite).transaction((current) => {
            return (current || 0) + 1;
        });

        // 3. Ajoute dans l'historique (limité manuellement ou simplement ajouté avec le timestamp)
        const newClickRef = db.ref('stats/history').push();
        newClickRef.set({
            date: new Date().toISOString(),
            specialite: specialite,
            title: title.substring(0, 50)
        });
    },

    // Écoute les changements en temps réel pour l'admin
    listenToStats(container) {
        container.innerHTML = "<p>Chargement des statistiques Firebase globales en temps réel...</p>";
        
        db.ref('stats').on('value', (snapshot) => {
            const data = snapshot.val() || {};
            
            // Formatage des données pour simuler l'ancienne structure
            const stats = {
                totalVisits: data.totalVisits || 0,
                totalPDFClicks: data.totalPDFClicks || 0,
                bySpecialite: data.bySpecialite || {},
                history: []
            };

            // Transformation de l'historique (objet Firebase vers tableau trié)
            if (data.history) {
                stats.history = Object.values(data.history).sort((a, b) => new Date(b.date) - new Date(a.date));
            }

            this.renderAdminDashboard(container, stats);
        });
    },

    // L'affichage reste presque pareil qu'avant
    renderAdminDashboard(container, stats) {
        const specialites = {
            'cyber': 'Cybersécurité',
            'ia': 'Intelligence Artificielle',
            'geniecivilbatiment': 'Génie Civil',
            'finance': 'Finance',
            'energetique': 'Énergétique et Procédés',
            'energierenouvelable': 'Énergie Renouvelable',
            'froidetclimatisation': 'Froid et Climatisation'
        };

        let html = `
            <div class="stats-dashboard">
                <h2>📊 Statistiques Globales en Temps Réel</h2>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-number">${stats.totalVisits}</div>
                        <div class="stat-label">Visites totales</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${stats.totalPDFClicks}</div>
                        <div class="stat-label">Clics sur PDF</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">${Object.keys(stats.bySpecialite).length}</div>
                        <div class="stat-label">Spécialités actives</div>
                    </div>
                </div>

                <h3>📚 Clics par spécialité</h3>
                <div class="specialite-stats">
        `;

        const sortedSpecs = Object.entries(stats.bySpecialite)
            .sort((a, b) => b[1] - a[1]);

        for (const [key, count] of sortedSpecs) {
            const name = specialites[key] || key;
            const percentage = stats.totalPDFClicks > 0 
                ? Math.round((count / stats.totalPDFClicks) * 100) 
                : 0;
            
            html += `
                <div class="spec-bar">
                    <div class="spec-name">${name}</div>
                    <div class="spec-progress">
                        <div class="spec-fill" style="width: ${percentage}%"></div>
                    </div>
                    <div class="spec-count">${count} (${percentage}%)</div>
                </div>
            `;
        }

        html += `
                </div>
                
                <h3>🕐 Derniers clics</h3>
                <ul class="click-history">
        `;

        stats.history.slice(0, 10).forEach(click => {
            const date = new Date(click.date).toLocaleString('fr-FR');
            html += `
                <li>
                    <span class="click-date">${date}</span>
                    <span class="click-spec">${specialites[click.specialite] || click.specialite}</span>
                    <span class="click-title">${click.title}</span>
                </li>
            `;
        });

        html += `
                </ul>
                <button onclick="StatsManager.resetStats()" class="reset-btn">
                    🗑️ Réinitialiser (Firebase)
                </button>
                <p style="margin-top:20px; color:#666; font-size:12px;">Ces données proviennent de Firebase et incluent tous les utilisateurs.</p>
            </div>
        `;

        container.innerHTML = html;
    },

    resetStats() {
        if (!db) return;
        if (confirm('⚠️ Êtes-vous sûr de vouloir supprimer TOUTES les statistiques Firebase GLOBALEMENT ? Cette action est irréversible.')) {
            db.ref('stats').set(null).then(() => {
                alert('Statistiques réinitialisées sur le serveur !');
            });
        }
    }
};

// Initialisation au chargement
document.addEventListener('DOMContentLoaded', () => {
    StatsManager.init();
});