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


// ----------------------------------------------------------------
// NEUE ZENTRALE FUNKTIONEN (Refactoring)
// ----------------------------------------------------------------

/**
 * NEU: Aktualisiert das Aussehen eines Favoriten-Buttons (Herz-Icon und Klasse).
 * Diese Funktion war vorher in initSearch, initGallery und initCollection dupliziert.
 * @param {HTMLElement} btn Der Button.
 * @param {boolean} active Ob der Favorit aktiv ist.
 */
function updateFavBtn(btn, active) {
    if (!btn) return;
    btn.textContent = active ? '❤' : '♡';
    btn.classList.toggle('active', active);
}

/**
 * NEU: Kapselt die gesamte Logik zum Umschalten eines Favoriten.
 * Ändert LocalStorage, ruft die Server-API auf und gibt den neuen Status zurück.
 * @param {number} id Die Pokémon-ID.
 * @returns {Promise<boolean>} Der neue Favoritenstatus (true=favorisiert, false=nicht).
 */
async function handleFavToggle(id) {
    let favs = getFavs();
    const isFav = favs.includes(id);
    const newState = !isFav; // Der neue Status

    if (newState) {
        favs.push(id);
    } else {
        favs = favs.filter(x => x !== id);
    }

    setFavs(favs); // Lokalen Speicher aktualisieren
    await toggleFavorite(id, newState); // Server synchronisieren

    return newState; // Neuen Status zurückgeben
}

/**
 * NEU: Generiert das HTML für die Pokémon-Detailansicht.
 * Dieser HTML-Block war in initSearch, initGallery und initCollection dupliziert.
 * @param {object} p Das Pokémon-Objekt von der API.
 * @returns {string} Den HTML-String für die Detailkarte.
 */
function renderPokemonDetail(p) {
    return `
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
}

// ----------------------------------------------------------------
// ---- Seiten-Init ----
// ----------------------------------------------------------------

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

// ----------------------------------------------------------------
// ---- PokeSearch ----
// ----------------------------------------------------------------

/**
 * Initialisiert die Suchseite.
 */
function initSearch(){
    const input = $('#search');
    const sugList = $('#suggestions');
    const detail = $('#detail');
    const factText = $('#fact-text');

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

    const debounced = debounce(renderSuggestions, 300);
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

            // Verwendet die globale renderPokemonDetail-Funktion
            detail.innerHTML = renderPokemonDetail(p);

            const favBtn = $('#favBtn');
            let favs = getFavs();
            let isFav = favs.includes(p.id);

            // Verwendet die globale updateFavBtn-Funktion
            updateFavBtn(favBtn, isFav);

            /**
             * Event-Listener verwendet jetzt die globale handleFavToggle-Funktion.
             */
            favBtn.addEventListener('click', async () => {
                isFav = await handleFavToggle(p.id);
                updateFavBtn(favBtn, isFav);
            });
        } catch {
            detail.innerHTML = `<div class="card">Nicht gefunden.</div>`;
        }
    }

    async function loadFact(){
        try{
            const f = await json('/api/facts/next');
            factText.textContent = f.text || 'Pokémon sind cool!';
        }catch{}
    }
    loadFact();
    setInterval(loadFact, 10000);
}

// ----------------------------------------------------------------
// ---- Gallery ----
// ----------------------------------------------------------------

/**
 * Initialisiert die Galerie-Seite.
 */
function initGallery(){
    const grid = $('#grid');
    const typeSel = $('#type');
    const sortSel = $('#sort');
    const state = { page: 1, limit: 20, total: 0, type: '', sort: 'name_asc' };

    /**
     * Lädt und rendert die aktuelle Seite der Galerie.
     * @returns {Promise<void>}
     */
    async function loadPage(){

        // try...catch-Block hinzugefügt, um API-Fehler abzufangen.
        try {
            const params = new URLSearchParams({
                page: state.page,
                limit: state.limit,
                type: state.type,
                sort: state.sort,
            });

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
                    await showDetail(id); // Ruft die lokale showDetail-Funktion unten auf
                });
                const btn = $('.fav-btn', tile);
                const favs = getFavs();
                const isFav = favs.includes(id);

                // Verwendet die globale updateFavBtn-Funktion
                updateFavBtn(btn, isFav);

                /**
                 * Event-Listener verwendet jetzt die globale handleFavToggle-Funktion.
                 */
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const newState = await handleFavToggle(id);
                    updateFavBtn(btn, newState);
                });
            });

            const pages = Math.ceil(state.total / state.limit);
            $('#pageinfo').textContent = `Seite ${state.page} / ${pages}`;
            $('#prev').disabled = state.page <= 1;
            $('#next').disabled = state.page >= pages;

            // catch-Block hinzugefügt
        } catch (err) {
            console.error('Fehler beim Laden der Galerie-Seite:', err);
            grid.innerHTML = `<div class="card">Fehler beim Laden der Pokémon.</div>`;
        }
    }

    /**
     * Zeigt die Detailansicht für ein Pokémon im Popup an.
     * @param id
     * @returns {Promise<void>}
     */
    async function showDetail(id) {
        const popup = document.getElementById('popup');
        const detail = document.getElementById('popup-detail');
        const closeBtn = document.getElementById('closePopup');

        try {
            const p = await json(`/api/pokemon/${id}`);

            // Verwendet die globale renderPokemonDetail-Funktion
            detail.innerHTML = renderPokemonDetail(p);

            popup.classList.remove('hidden');

            const favBtn = document.getElementById('favBtn');
            let favs = getFavs();
            let isFav = favs.includes(p.id);

            // Verwendet die globale updateFavBtn-Funktion
            updateFavBtn(favBtn, isFav);

            /**
             * Event-Listener verwendet jetzt die globale handleFavToggle-Funktion.
             */
            favBtn.addEventListener('click', async () => {
                isFav = await handleFavToggle(p.id);
                updateFavBtn(favBtn, isFav);
            });

            closeBtn.onclick = () => popup.classList.add('hidden');
            popup.onclick = (e) => {
                if (e.target === popup) popup.classList.add('hidden');
            };

        } catch {
            detail.innerHTML = `<div class="card">Nicht gefunden.</div>`;
            popup.classList.remove('hidden');
        }
    }

    $('#prev').addEventListener('click', () => { state.page--; loadPage(); });
    $('#next').addEventListener('click', () => { state.page++; loadPage(); });

    typeSel.addEventListener('change', () => {
        state.type = typeSel.value;
        state.page = 1;
        loadPage();
    });

    sortSel.addEventListener('change', () => {
        state.sort = sortSel.value;
        state.page = 1;
        loadPage();
    });

    sortSel.value = state.sort;
    loadPage();
}

// ----------------------------------------------------------------
// ---- Collection ----
// ----------------------------------------------------------------

/**
 * Initialisiert die Favoriten-Collection-Seite.
 */
function initCollection(){
    const list = $('#list');

    async function loadFavs(){
        try {
            const data = await json('/api/favorites');
            if (!data || data.length === 0) {
                list.innerHTML = `<div class="card">Keine Favoriten vorhanden.</div>`;
                return;
            }

            list.innerHTML = data.map(d => `
              <div class="tile" data-id="${d.id}">
                <img src="${d.sprite || '/public/img/pokeball.svg'}" alt="">
                <div class="name">${d.name}</div>
                <div style="margin-top:6px;font-size:12px">ATK: ${d.attack ?? '-'}</div>
                <button class="fav-btn active" title="Entfernen">❤</button>
              </div>
            `).join('');

            $$('.tile', list).forEach(tile => {
                const id = parseInt(tile.dataset.id, 10);
                const btn = $('.fav-btn', tile);

                tile.addEventListener('click', (e) => {
                    if (e.target === btn) return;
                    showDetail(id); // Ruft die lokale showDetail-Funktion unten auf
                });

                /**
                 * HINWEIS: Dieser Handler bleibt unverändert.
                 * Er ist spezifisch für die Collection (nur entfernen, nicht togglen)
                 * und muss die Liste danach neu laden (`loadFavs`).
                 */
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    let favs = getFavs().filter(x => x !== id);
                    setFavs(favs);
                    await toggleFavorite(id, false);
                    await loadFavs(); // Liste neu laden
                });
            });
        } catch (err) {
            console.error('Fehler beim Laden der Favoriten:', err);
            list.innerHTML = `<div class="card">Fehler beim Laden der Favoriten.</div>`;
        }
    }

    /**
     * Zeigt die Detailansicht für ein Pokémon im Popup an.
     * @param id
     * @returns {Promise<void>}
     */
    async function showDetail(id){
        const popup = document.getElementById('popup');
        const detail = document.getElementById('popup-detail');
        const closeBtn = document.getElementById('closePopup');

        if (!popup || !detail || !closeBtn) {
            console.warn('Popup-Elemente nicht gefunden.');
            return;
        }

        try {
            const p = await json(`/api/pokemon/${id}`);

            // Verwendet die globale renderPokemonDetail-Funktion
            detail.innerHTML = renderPokemonDetail(p);

            popup.classList.remove('hidden');

            const favBtn = document.getElementById('favBtn');
            let favs = getFavs();
            let isFav = favs.includes(p.id);

            // Verwendet die globale updateFavBtn-Funktion
            updateFavBtn(favBtn, isFav);

            /**
             * Verwendet handleFavToggle, aber mit einer ZUSATZLOGIK:
             * Wenn ein Favorit entfernt wird (!newState), muss die Collection-Liste
             * im Hintergrund neu geladen werden.
             */
            favBtn.addEventListener('click', async () => {
                const newState = await handleFavToggle(p.id);
                updateFavBtn(favBtn, newState);

                // SPEZIALFALL: Wenn Favorit entfernt wurde, Liste neu laden
                if (!newState) {
                    await loadFavs();
                }
            });

            closeBtn.onclick = () => popup.classList.add('hidden');
            popup.onclick = (e) => {
                if (e.target === popup) popup.classList.add('hidden');
            };
        } catch (err) {
            console.error('Fehler beim Laden der Details:', err);
            detail.innerHTML = `<div class="card">Nicht gefunden.</div>`;
            popup.classList.remove('hidden');
        }
    }

    loadFavs();
}

// ----------------------------------------------------------------
// ---- Profile ----
// ----------------------------------------------------------------

/**
 * Initialisiert die Profil-Seite.
 */
function initProfile(){
    const favsEl = $('#stat-favs');
    const seenEl = $('#stat-seen');
    const typeEl = $('#stat-type');

    async function load(){
        const s = await json('/api/profile/stats');
        favsEl.textContent = s.favorites ?? 0;
        seenEl.textContent = s.seen ?? 0;
        typeEl.textContent = s.topType ? s.topType : '-';
    }
    load();
}