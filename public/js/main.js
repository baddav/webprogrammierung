const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/**
 * Erstellt ein Badge-Element für einen Pokémon-Typ.
 * @param t
 * @returns {string}
 */
function typeBadge(t){
    return `<span class="badge ${t}">${t}</span>`;
}

/**
 * Führt einen Fetch-Request aus und gibt das JSON-Ergebnis zurück.
 * @param url
 * @param opts
 * @returns {Promise<any>}
 */
async function json(url, opts){
    const res = await fetch(url, opts);
    if (!res.ok) throw new Error('Request failed');
    return res.json();
}

/**
 * Erstellt eine debouncete Funktion.
 * @param fn
 * @param ms
 * @returns {(function(...[*]): void)|*}
 */
function debounce(fn, ms){
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), ms);
    };
}

/**
 * Gibt den LocalStorage-Schlüssel für Favoriten zurück.
 * @returns {string}
 */
function favKey(){ return 'favorites'; }

/**
 * Lädt die Favoriten aus dem LocalStorage.
 * @returns {any|*[]}
 */
function getFavs(){
    try { return JSON.parse(localStorage.getItem(favKey())||'[]'); } catch { return []; }
}

/**
 * Speichert die Favoriten im LocalStorage.
 * @param arr
 */
function setFavs(arr){
    localStorage.setItem(favKey(), JSON.stringify(arr));
}

/**
 * Fügt oder entfernt ein Pokémon von den Favoriten auf dem Server.
 * @param id
 * @param active
 * @returns {Promise<void>}
 */
async function toggleFavorite(id, active){
    if (active){
        await fetch(`/api/favorites/${id}`, { method:'POST' });
    } else {
        await fetch(`/api/favorites/${id}`, { method:'DELETE' });
    }
}

/** ---- Seiten-Init ---- */

/**
 * Initialisiert die Seite basierend auf dem data-page Attribut des body-Tags.
 */
document.addEventListener('DOMContentLoaded', () => {
    const page = document.body.dataset.page;

    if (page === 'index') initSearch();
    if (page === 'gallery') initGallery();
    if (page === 'collection') initCollection();
    if (page === 'profile') initProfile();
});

/** ---- PokeSearch ---- */

/**
 * Initialisiert die Suchseite.
 */
function initSearch(){
    const input = $('#search');
    const sugList = $('#suggestions');
    const detail = $('#detail');
    const factText = $('#fact-text');

    /**
     * Rendert die Suchvorschläge basierend auf dem Suchbegriff.
     * @param term
     * @returns {Promise<void>}
     */
    const renderSuggestions = async (term) => {
        if (!term) { sugList.innerHTML = ''; return; }
        try {
            const items = await json(`/api/pokemon?search=${encodeURIComponent(term)}`);
            sugList.innerHTML = items.map(i => `
        <div class="suggestion" data-id="${i.id}">
          <img src="${i.sprite || '/public/img/pokeball.svg'}" alt="">
          <div>#${i.id} ${i.name}</div>
        </div>
      `).join('');
            $$('.suggestion', sugList).forEach(el => el.addEventListener('click', () => showDetail(el.dataset.id)));
        } catch {}
    };

    /**
     * Debouncete Version der renderSuggestions Funktion.
     * @type {(function(...[*]): void)|*}
     */
    const debounced = debounce(renderSuggestions, 300);

    /**
     * Event-Listener für die Sucheingabe.
     */
    input.addEventListener('input', e => debounced(e.target.value.trim()));

    /**
     * Zeigt die Detailansicht für ein Pokémon an.
     * @param id
     * @returns {Promise<void>}
     */
    async function showDetail(id){
        try{
            const p = await json(`/api/pokemon/${id}`);
            sugList.innerHTML = '';
            detail.innerHTML = `
        <div class="card detail">
          <img src="${p.sprite || '/public/img/pokeball.svg'}" alt="${p.name}">
          <div>
            <h2 style="margin:0; text-transform:capitalize">${p.name} <small>#${p.id}</small></h2>
            <div class="badges" style="margin:8px 0">${p.types.map(typeBadge).join('')}</div>
            <div class="kv">
              <div>HP</div><div>${p.stats.hp}</div>
              <div>Attack</div><div>${p.stats.attack}</div>
              <div>Defense</div><div>${p.stats.defense}</div>
              <div>Speed</div><div>${p.stats.speed}</div>
              <div>Größe</div><div>${p.height}</div>
              <div>Gewicht</div><div>${p.weight}</div>
            </div>
            <button class="fav-btn" id="favBtn" title="Favorisieren">♡</button>
          </div>
        </div>
      `;
            const favBtn = $('#favBtn');
            let favs = getFavs();
            let isFav = favs.includes(p.id);
            updateFavBtn(favBtn, isFav);

            /**
             * Event-Listener für den Favoriten-Button.
             */
            favBtn.addEventListener('click', async () => {
                isFav = !isFav;
                if (isFav) favs.push(p.id); else favs = favs.filter(x => x !== p.id);
                setFavs(favs);
                updateFavBtn(favBtn, isFav);
                await toggleFavorite(p.id, isFav);
            });
        } catch {
            detail.innerHTML = `<div class="card">Nicht gefunden.</div>`;
        }
    }

    /**
     * Aktualisiert den Favoriten-Button.
     * @param btn
     * @param active
     */
    function updateFavBtn(btn, active){
        btn.textContent = active ? '❤' : '♡';
        btn.classList.toggle('active', active);
    }

    /**
     * Lädt und aktualisiert den Pokémon-Fakt.
     * @returns {Promise<void>}
     */
    async function loadFact(){
        try{
            const f = await json('/api/facts/next');
            factText.textContent = f.text || 'Pokémon sind cool!';
        }catch{}
    }
    loadFact();
    setInterval(loadFact, 10000);
}

/** ---- Gallery ---- */

/**
 * Initialisiert die Galerie-Seite.
 */
function initGallery(){
    const grid = $('#grid');
    const typeSel = $('#type');
    const sortSel = $('#sort');
    const state = { page: 1, limit: 20, total: 0, type: '', sort: 'name_asc' }; // Standardwert für sort

    /**
     * Lädt und rendert die aktuelle Seite der Galerie.
     * @returns {Promise<void>}
     */
    async function loadPage(){
        const params = new URLSearchParams({
            page: state.page,
            limit: state.limit,
            type: state.type,
            sort: state.sort,
        });

        /**
         * Lädt die Pokémon-Daten und rendert sie im Grid.
         */
        const data = await json(`/api/pokemon?${params.toString()}`);
        state.total = data.total;
        grid.innerHTML = data.items.map(it => `
            <div class="tile" data-id="${it.id}">
                <img src="${it.sprite || '/public/img/pokeball.svg'}" alt="">
                <div class="name">${it.name}</div>
                <button class="fav-btn" title="Favorisieren">♡</button>
            </div>
        `).join('');

        $$('.tile', grid).forEach(tile => {
            const id = parseInt(tile.dataset.id, 10);
            tile.addEventListener('click', async e => {
                if (e.target.classList.contains('fav-btn')) return;
                await showDetail(id);
            });
            const btn = $('.fav-btn', tile);
            const favs = getFavs();
            const isFav = favs.includes(id);
            update(btn, isFav);
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                let sFav = getFavs();
                const curr = sFav.includes(id);
                if (curr) sFav = sFav.filter(x => x !== id); else sFav.push(id);
                setFavs(sFav);
                update(btn, !curr);
                await toggleFavorite(id, !curr);
            });
        });

        /**
         * Aktualisiert die Paginierungsanzeige.
         */
        const pages = Math.ceil(state.total / state.limit);
        $('#pageinfo').textContent = `Seite ${state.page} / ${pages}`;
        $('#prev').disabled = state.page <= 1;
        $('#next').disabled = state.page >= pages;
    }

    /**
     * Aktualisiert den Favoriten-Button.
     * @param btn
     * @param active
     */
    function updateFavBtn(btn, active) {
        btn.textContent = active ? '❤' : '♡';
        btn.classList.toggle('active', active);
    }

    /**
     * Zeigt die Detailansicht für ein Pokémon an.
     * @param id
     * @returns {Promise<void>}
     */
    async function showDetail(id) {
        const popup = document.getElementById('popup');
        const detail = document.getElementById('popup-detail');
        const closeBtn = document.getElementById('closePopup');

        try {
            const p = await json(`/api/pokemon/${id}`);
            detail.innerHTML = `
                <div class="card detail">
                    <img src="${p.sprite || '/public/img/pokeball.svg'}" alt="${p.name}">
                    <div>
                        <h2 style="margin:0; text-transform:capitalize">${p.name} <small>#${p.id}</small></h2>
                        <div class="badges" style="margin:8px 0">${p.types.map(typeBadge).join('')}</div>
                        <div class="kv">
                            <div>HP</div><div>${p.stats.hp}</div>
                            <div>Attack</div><div>${p.stats.attack}</div>
                            <div>Defense</div><div>${p.stats.defense}</div>
                            <div>Speed</div><div>${p.stats.speed}</div>
                            <div>Größe</div><div>${p.height}</div>
                            <div>Gewicht</div><div>${p.weight}</div>
                        </div>
                        <button class="fav-btn" id="favBtn" title="Favorisieren">♡</button>
                    </div>
                </div>
            `;

            /**
             * Popup sichtbar machen
             */
            popup.classList.remove('hidden');

            /**
             * Favoriten-Button Logik
             */
            const favBtn = document.getElementById('favBtn');
            let favs = getFavs();
            let isFav = favs.includes(p.id);
            updateFavBtn(favBtn, isFav);

            favBtn.addEventListener('click', async () => {
                isFav = !isFav;
                if (isFav) favs.push(p.id);
                else favs = favs.filter(x => x !== p.id);
                setFavs(favs);
                updateFavBtn(favBtn, isFav);
                await toggleFavorite(p.id, isFav);
            });

            /**
             * Schließen-Button
             */
            closeBtn.onclick = () => popup.classList.add('hidden');

            /**
             * Klick auf Overlay schließt ebenfalls
             * @param e
             */
            popup.onclick = (e) => {
                if (e.target === popup) popup.classList.add('hidden');
            };

        } catch {
            detail.innerHTML = `<div class="card">Nicht gefunden.</div>`;
            popup.classList.remove('hidden');
        }
    }

    /**
     * Aktualisiert den Favoriten-Button.
     * @param btn
     * @param active
     */
    function update(btn, active){ btn.textContent = active ? '❤' : '♡'; btn.classList.toggle('active', active); }

    /**
     * Event-Listener für die Paginierungs-Buttons.
     */
    $('#prev').addEventListener('click', () => { state.page--; loadPage(); });
    $('#next').addEventListener('click', () => { state.page++; loadPage(); });

    /**
     * Event-Listener für die Filter- und Sortier-Auswahl.
     */
    typeSel.addEventListener('change', () => {
        state.type = typeSel.value;
        state.page = 1; // Reset to first page
        loadPage();
    });

    /**
     * Event-Listener für die Sortier-Auswahl.
     */
    sortSel.addEventListener('change', () => {
        state.sort = sortSel.value;
        state.page = 1; // Reset to first page
        loadPage();
    });

    /**
     * Setzt die initialen Filter- und Sortierwerte.
     */
    sortSel.value = state.sort;

    loadPage();
}

/** ---- Collection ---- */

/**
 * Initialisiert die Favoriten-Collection-Seite.
 */
function initCollection(){
    const list = $('#list');

    /**
     * Lädt und rendert die Favoritenliste.
     * @returns {Promise<void>}
     */
    async function loadFavs(){
        try {
            /**
             * Favoriten vom Server laden
             */
            const data = await json('/api/favorites');

            /**
             * Keine Favoriten vorhanden
             */
            if (!data || data.length === 0) {
                list.innerHTML = `<div class="card">Keine Favoriten vorhanden.</div>`;
                return;
            }

            /**
             * Favoriten rendern
             */
            list.innerHTML = data.map(d => `
              <div class="tile" data-id="${d.id}">
                <img src="${d.sprite || '/public/img/pokeball.svg'}" alt="">
                <div class="name">${d.name}</div>
                <div style="margin-top:6px;font-size:12px">ATK: ${d.attack ?? '-'}</div>
                <button class="fav-btn active" title="Entfernen">❤</button>
              </div>
            `).join('');

            /**
             * Event-Listener für jedes Tile
             */
            $$('.tile', list).forEach(tile => {
                const id = parseInt(tile.dataset.id, 10);
                const btn = $('.fav-btn', tile);

                /**
                 * Detailansicht anzeigen
                 */
                tile.addEventListener('click', (e) => {
                    if (e.target === btn) return;
                    showDetail(id);
                });

                /**
                 * Favorit entfernen
                 */
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    // lokal und serverseitig entfernen, danach Liste neu laden
                    let favs = getFavs().filter(x => x !== id);
                    setFavs(favs);
                    await toggleFavorite(id, false);
                    await loadFavs();
                });
            });
        } catch (err) {
            console.error('Fehler beim Laden der Favoriten:', err);
            list.innerHTML = `<div class="card">Fehler beim Laden der Favoriten.</div>`;
        }
    }

    /**
     * Zeigt die Detailansicht für ein Pokémon an.
     * @param id
     * @returns {Promise<void>}
     */
    async function showDetail(id){
        const popup = document.getElementById('popup');
        const detail = document.getElementById('popup-detail');
        const closeBtn = document.getElementById('closePopup');

        /**
         * Fehlermeldung, wenn Popup-Elemente nicht gefunden werden
         */
        if (!popup || !detail || !closeBtn) {
            console.warn('Popup-Elemente nicht gefunden.');
            return;
        }

        try {

            /**
             * Pokémon-Details laden
             */
            const p = await json(`/api/pokemon/${id}`);

            /**
             * Detail-HTML rendern
             */
            detail.innerHTML = `
                <div class="card detail">
                    <img src="${p.sprite || '/public/img/pokeball.svg'}" alt="${p.name}">
                    <div>
                        <h2 style="margin:0; text-transform:capitalize">${p.name} <small>#${p.id}</small></h2>
                        <div class="badges" style="margin:8px 0">${p.types.map(typeBadge).join('')}</div>
                        <div class="kv">
                            <div>HP</div><div>${p.stats.hp}</div>
                            <div>Attack</div><div>${p.stats.attack}</div>
                            <div>Defense</div><div>${p.stats.defense}</div>
                            <div>Speed</div><div>${p.stats.speed}</div>
                            <div>Größe</div><div>${p.height}</div>
                            <div>Gewicht</div><div>${p.weight}</div>
                        </div>
                        <button class="fav-btn" id="favBtn" title="Favorisieren">♡</button>
                    </div>
                </div>
            `;

            /**
             * Popup sichtbar machen
             */
            popup.classList.remove('hidden');

            /**
             * Favoriten-Button Logik
             */
            const favBtn = document.getElementById('favBtn');
            let favs = getFavs();
            let isFav = favs.includes(p.id);
            updateFavBtn(favBtn, isFav);

            /**
             * Event-Listener für den Favoriten-Button
             */
            favBtn.addEventListener('click', async () => {
                isFav = !isFav;
                if (isFav) favs.push(p.id);
                else favs = favs.filter(x => x !== p.id);
                setFavs(favs);
                updateFavBtn(favBtn, isFav);
                await toggleFavorite(p.id, isFav);
                await loadFavs(); // aktualisiere Collection falls Favorit entfernt
            });

            /**
             * Schließen-Button
             */
            closeBtn.onclick = () => popup.classList.add('hidden');

            /**
             * Klick auf Overlay schließt ebenfalls
             */
            popup.onclick = (e) => {
                if (e.target === popup) popup.classList.add('hidden');
            };
        } catch (err) {
            console.error('Fehler beim Laden der Details:', err);
            detail.innerHTML = `<div class="card">Nicht gefunden.</div>`;
            popup.classList.remove('hidden');
        }
    }

    /**
     * Aktualisiert den Favoriten-Button.
     * @param btn
     * @param active
     */
    function updateFavBtn(btn, active) {
        if (!btn) return;
        btn.textContent = active ? '❤' : '♡';
        btn.classList.toggle('active', active);
    }

    /**
     * Favoriten laden
     */
    loadFavs();
}

/** ---- Profile ---- */

/**
 * Initialisiert die Profil-Seite.
 */
function initProfile(){
    const favsEl = $('#stat-favs');
    const seenEl = $('#stat-seen');
    const typeEl = $('#stat-type');

    /**
     * Lädt und aktualisiert die Profilstatistiken.
     * @returns {Promise<void>}
     */
    async function load(){
        const s = await json('/api/profile/stats');
        favsEl.textContent = s.favorites ?? 0;
        seenEl.textContent = s.seen ?? 0;
        typeEl.textContent = s.topType ? s.topType : '-';
    }
    load();
}
