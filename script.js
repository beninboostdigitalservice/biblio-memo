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
