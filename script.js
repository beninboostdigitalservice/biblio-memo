document.addEventListener('DOMContentLoaded', () => {
    const specialiteSelect = document.getElementById('specialiteFilter');
    const memoireList = document.getElementById('memoireList');

    function filterMemoires() {
        const selected = specialiteSelect.value;
        const cards = memoireList.querySelectorAll('.card');
        cards.forEach(card => {
            const spec = card.getAttribute('data-specialite');
            card.style.display = (selected === 'all' || spec === selected) ? '' : 'none';
        });
    }

    specialiteSelect.addEventListener('change', filterMemoires);

    // Event delegation pour les boutons Lire -> ouvrir dans un nouvel onglet
    memoireList.addEventListener('click', (e) => {
        const btn = e.target.closest('.readBtn');
        if (!btn) return;
        const file = btn.getAttribute('data-file');
        if (!file) return;
        openDriveOrUrlInNewTab(file);
    });

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
    filterMemoires();
});

// Ajoutez ceci à votre script.js existant

// ============================================
// SYSTÈME DE STATISTIQUES DE CLICS
// ============================================

const StatsManager = {
    // Clés de stockage
    KEYS: {
        TOTAL_VISITS: 'rms_total_visits',
        PDF_CLICKS: 'rms_pdf_clicks',
        SPECIALITE_STATS: 'rms_specialite_stats',
        LAST_VISIT: 'rms_last_visit'
    },

    // Initialisation
    init() {
        this.trackVisit();
        this.setupPDFTracking();
        this.displayStats(); // Pour la page admin
    },

    // Compteur de visites du site
    trackVisit() {
        const today = new Date().toDateString();
        const lastVisit = localStorage.getItem(this.KEYS.LAST_VISIT);
        
        // Incrémente seulement si nouvelle session (dernière visite != aujourd'hui)
        // Ou utilisez sessionStorage pour compter chaque onglet ouvert
        let visits = parseInt(localStorage.getItem(this.KEYS.TOTAL_VISITS) || '0');
        
        if (lastVisit !== today) {
            visits++;
            localStorage.setItem(this.KEYS.TOTAL_VISITS, visits);
            localStorage.setItem(this.KEYS.LAST_VISIT, today);
        }
        
        console.log(`Visites totales: ${visits}`);
        return visits;
    },

    // Suivi des clics sur les PDF
    setupPDFTracking() {
        const memoireList = document.getElementById('memoireList');
        if (!memoireList) return;

        memoireList.addEventListener('click', (e) => {
            const btn = e.target.closest('.readBtn');
            if (!btn) return;

            const card = btn.closest('.card');
            const specialite = card?.dataset.specialite || 'unknown';
            const title = card?.querySelector('h3')?.textContent?.trim() || 'Sans titre';

            this.recordPDFClick(specialite, title);
        });
    },

    recordPDFClick(specialite, title) {
        // Clics totaux
        let totalClicks = parseInt(localStorage.getItem(this.KEYS.PDF_CLICKS) || '0');
        totalClicks++;
        localStorage.setItem(this.KEYS.PDF_CLICKS, totalClicks);

        // Stats par spécialité
        let specStats = JSON.parse(localStorage.getItem(this.KEYS.SPECIALITE_STATS) || '{}');
        specStats[specialite] = (specStats[specialite] || 0) + 1;
        localStorage.setItem(this.KEYS.SPECIALITE_STATS, JSON.stringify(specStats));

        // Historique détaillé (limité aux 50 derniers)
        let history = JSON.parse(localStorage.getItem('rms_click_history') || '[]');
        history.unshift({
            date: new Date().toISOString(),
            specialite: specialite,
            title: title.substring(0, 50) // Limite la longueur
        });
        if (history.length > 50) history = history.slice(0, 50);
        localStorage.setItem('rms_click_history', JSON.stringify(history));

        console.log(`Clic enregistré: ${specialite} - ${title}`);
    },

    // Récupère toutes les statistiques
    getStats() {
        return {
            totalVisits: parseInt(localStorage.getItem(this.KEYS.TOTAL_VISITS) || '0'),
            totalPDFClicks: parseInt(localStorage.getItem(this.KEYS.PDF_CLICKS) || '0'),
            bySpecialite: JSON.parse(localStorage.getItem(this.KEYS.SPECIALITE_STATS) || '{}'),
            history: JSON.parse(localStorage.getItem('rms_click_history') || '[]')
        };
    },

    // Affiche les stats dans la console (ou créez une page admin)
    displayStats() {
        const stats = this.getStats();
        console.log('=== STATISTIQUES RÉUSSIRMASOUTENANCE ===');
        console.log(`Visites totales: ${stats.totalVisits}`);
        console.log(`Clics PDF totaux: ${stats.totalPDFClicks}`);
        console.log('Par spécialité:', stats.bySpecialite);
        
        // Vérifie si on est sur une page admin
        const adminContainer = document.getElementById('statsContainer');
        if (adminContainer) {
            this.renderAdminDashboard(adminContainer, stats);
        }
    },

    // Rendu du tableau de bord admin
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
                <h2>📊 Tableau de bord des statistiques</h2>
                
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

        // Trie par nombre de clics décroissant
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
                
                <button onclick="StatsManager.exportStats()" class="export-btn">
                    📥 Exporter les données (JSON)
                </button>
                <button onclick="StatsManager.resetStats()" class="reset-btn">
                    🗑️ Réinitialiser les statistiques
                </button>
            </div>
        `;

        container.innerHTML = html;
    },

    // Exporte les données
    exportStats() {
        const stats = this.getStats();
        const dataStr = JSON.stringify(stats, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `stats_reussirmasoutenance_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    },

    // Réinitialise les stats
    resetStats() {
        if (confirm('Êtes-vous sûr de vouloir réinitialiser toutes les statistiques ?')) {
            Object.values(this.KEYS).forEach(key => localStorage.removeItem(key));
            localStorage.removeItem('rms_click_history');
            alert('Statistiques réinitialisées !');
            location.reload();
        }
    }
};

// Initialisation au chargement
document.addEventListener('DOMContentLoaded', () => {
    StatsManager.init();
});