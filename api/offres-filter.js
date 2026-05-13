document.addEventListener('DOMContentLoaded', () => {
    let toutesLesOffres = [];
    const grid = document.getElementById('offres-grid');
    const filtersNav = document.getElementById('offres-filters');

    // 1. Récupération des données via ton API
    fetch('/api/offres')
        .then(res => res.json())
        .then(data => {
            toutesLesOffres = data;
            initFilters();
            displayOffres('Tous'); // Affiche tout par défaut
        })
        .catch(err => {
            console.error("Erreur de chargement:", err);
            if(grid) grid.innerHTML = "<p>Erreur lors de la récupération des offres réelles.</p>";
        });

    // 2. Initialisation des boutons de filtres
    function initFilters() {
        if(!filtersNav) return;
        
        // Liste des catégories souhaitées
        const categories = ['Tous', 'Freelance', 'CDI', 'CDD', 'Alternance', 'Intérimaire'];
        
        filtersNav.innerHTML = categories.map(cat => 
            `<button class="filter-btn ${cat === 'Tous' ? 'active' : ''}" data-type="${cat}">${cat}</button>`
        ).join('');

        // Ajout du clic sur chaque bouton
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.target.getAttribute('data-type');
                displayOffres(type);
                
                // Gestion du style visuel (bouton bleu)
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
    }

    // 3. Fonction pour afficher les cartes
    function displayOffres(type) {
        if(!grid) return;

        const filtered = type === 'Tous' 
            ? toutesLesOffres 
            : toutesLesOffres.filter(o => o.type.trim() === type);

        if (filtered.length === 0) {
            grid.innerHTML = `<div class="no-offres">Aucune offre "${type}" n'est disponible pour le moment.</div>`;
            return;
        }

        grid.innerHTML = filtered.map(o => `
            <div class="offres-card">
                <div class="card-header">
                    <span class="badge-type">${o.type}</span>
                    <span class="secteur">${o.secteur || ''}</span>
                </div>
                <h3 class="job-title">${o.titre}</h3>
                <p class="infos">📍 ${o.lieu} • 📅 ${o.dateDebut || 'Démarrage ASAP'}</p>
                <div class="pricing">
                    ${o.tjm ? `<strong>${o.tjm}</strong>` : 'Rémunération : NC'}
                </div>
                <a href="${o.lien}" target="_blank" class="btn-postuler">Voir la mission</a>
            </div>
        `).join('');
    }
});
