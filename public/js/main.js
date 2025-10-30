/**
 * Hilfunktionen für eine bessere Kommunikation mit den HTML-Pages (Auswahl HTML-Elemente)
 */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/**
 * Erstellt ein Badge-Element für einen Pokémon-Typ.
 * Parameter t
 * Gibt einen String zurück
 */
function typeBadge(t){
    return `<span class="badge ${t}">${t}</span>`;
}

/**
 * Führt einen Fetch-Request (asynchron) aus und gibt das JSON-Ergebnis zurück.
 * Vereinheitlicht die API-Anfrage
 * Parameter url
 * Parameter opts
 * Gibt zurück: {Promise<any>}
 */
async function json(url, opts){
    const res = await fetch(url, opts);
    if (!res.ok) throw new Error('Request failed');
    return res.json();
}

/**
 * Erstellt eine debouncete Funktion.
 * Drosselt die Suchfunktion --> Verzögert den Aufruf einer Funktion, um unnötige viele Requests zu vermeiden.
 * Parameter fn
 * Parameter ms
 */
function debounce(fn, ms){
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), ms);
    };
}

/**
 * Gibt den LocalStorage-Schlüssel für Favoriten zurück (Im Browser --> Local).
 * Wichtig für die Speicherung der Favoriten, sodass diese später wieder gefunden werden können (pro Nutzer).
 * Gibt String zurück
 */
function favKey(){ return 'favorites'; }

/**
 * Lädt die Favoriten aus dem LocalStorage.
 * Falls kein String vorhanden oder ein Problem auftritt, wird ein leeres Array zurückgegeben, sodass kein Fehler entsteht.
 */
function getFavs(){
    try { return JSON.parse(localStorage.getItem(favKey())||'[]'); } catch { return []; }
}

/**
 * Speichert die Favoriten im LocalStorage.
 * Parameter arr
 */
function setFavs(arr){
    localStorage.setItem(favKey(), JSON.stringify(arr));
}

/**
 * Fügt oder entfernt ein Pokémon von den Favoriten auf dem Server.
 * Favorisierte Pokemon in der SQL-Favoriten-Datenbank hinzufügen oder entfernen.
 * Parameter id
 * Parameter active
 */
async function toggleFavorite(id, active){
    if (active){
        await fetch(`/api/favorites/${id}`, { method:'POST' });
    } else {
        await fetch(`/api/favorites/${id}`, { method:'DELETE' });
    }
}

/**
 * Aktualisiert das Aussehen eines Favoriten-Buttons (Herz-Icon).
 * Parameter btn (Der Button)
 * Parameter active Ob der Favorit aktiv ist.
 */
function updateFavBtn(btn, active) {
    if (!btn) return;
    btn.textContent = active ? '❤' : '♡';
    btn.classList.toggle('active', active);
}

/**
 * Kapselt die gesamte Logik zum Umschalten eines Favoriten.
 * Ändert LocalStorage (Browserseitig), ruft die Server-API auf, und gibt den neuen Status zurück.
 * Parameter id
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
 * Erzeugt das HTML-String für die Pokémon-Detailansicht.
 * Zeigt auch Favoritenbutton an
 * @Parameter p --> Das Pokémon-Objekt
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
              <div>Height</div><div>${p.height}</div>
              <div>Weight</div><div>${p.weight}</div>
            </div>
            <button class="fav-btn" id="favBtn" title="Favorisieren">♡</button>
          </div>
        </div>
    `;
}

/**
 * Ermittelt über Attribut des body (HTML) welche Seite aktuell angezeigt wird und ruft deren Initalisierungsfunktion auf.
 */
document.addEventListener('DOMContentLoaded', () => {
    const page = document.body.dataset.page;

    if (page === 'index') initSearch();
    if (page === 'gallery') initGallery();
    if (page === 'collection') initCollection();
    if (page === 'profile') initProfile();
});

// Search
/**
 * Initialisiert die Suchseite.
 */


function initSearch(){
    /**
     * Beschreibt welche HTML-Elemente verwendet werden
     */
    const input = $('#search');
    const sugList = $('#suggestions');
    const detail = $('#detail');
    const factText = $('#fact-text');

    /**
     * Anzeigen der Suchvorschläge
     */
    const renderSuggestions = async (term) => {
        if (!term) { sugList.innerHTML = ''; return; }
        try {
            const items = await json(`/api/pokemon?search=${encodeURIComponent(term)}`); // Anfrage aufgrund Suchbegriff

            /**
             * Erzeugt Vorschlagskacheln
             */
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
     * Hier wird nun die Suche verzögert, um Request zu reduzieren.
     */
    const debounced = debounce(renderSuggestions, 300);
    input.addEventListener('input', e => debounced(e.target.value.trim()));

    /**
     * Zeigt die Detailansicht für ein Pokémon an.
     * Parameter id
     */
    async function showDetail(id){
        try{
            /**
             * Ließt Daten der übergebenen Pokemon ID
             */
            const p = await json(`/api/pokemon/${id}`);
            sugList.innerHTML = '';

            detail.innerHTML = renderPokemonDetail(p); // Verwendet die globale renderPokemonDetail-Funktion, um Pokemon-Karten zu erzeugen

            /**
             * Schaut ob Pokemon Favorit ist und zeigt dementsprechend das Herz an oder nicht
             */
            const favBtn = $('#favBtn');
            let favs = getFavs();
            let isFav = favs.includes(p.id);


            updateFavBtn(favBtn, isFav); // Verwendet die globale updateFavBtn-Funktion

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


    /**
     * Holt die Fakten aus der Datenbank und lädt alle 10 Sekunden einen neuen.
     * Falls keine Fakten vorhanden, wird ein Standardtext angezeigt.
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

// Gallery
/**
 * Initialisiert die Galerie-Seite.
 */
function initGallery(){
    const grid = $('#grid');
    const typeSel = $('#type');
    const sortSel = $('#sort');
    /**
     * Gibt Zustand der Gallery an für Aktualisierung dieser
     */
    const state = { page: 1, limit: 20, total: 0, type: '', sort: 'name_asc' };

    /**
     * Lädt und rendert die aktuelle Seite (Pokemon Kacheln) der Galerie.
     */
    async function loadPage(){
        try {
            /**
             * Parameter für Request an DB
             */
            const params = new URLSearchParams({
                page: state.page,
                limit: state.limit,
                type: state.type,
                sort: state.sort,
            });

            const data = await json(`/api/pokemon?${params.toString()}`);
            state.total = data.total;

            /**
             * HTML für jede Kachel generieren und ins Grid einfügen
             */
            grid.innerHTML = data.items.map(it => `
                <div class="tile" data-id="${it.id}">
                    <img src="${it.sprite || '/public/img/pokeball.svg'}" alt="">
                    <div class="name">${it.name}</div>
                    <button class="fav-btn" title="Favorisieren">♡</button>
                </div>
            `).join('');

            /**
             * Eventlistener setzen
             */
            $$('.tile', grid).forEach(tile => {
                const id = parseInt(tile.dataset.id, 10);

                /**
                 * Klick auf Kachel öffnet Detailansicht
                 */
                tile.addEventListener('click', async e => {
                    if (e.target.classList.contains('fav-btn')) return;
                    await showDetail(id);
                });

                /**
                 * Schaut ob Pokemon Favorit ist und zeigt dementsprechend das Herz an oder nicht
                 */
                const btn = $('.fav-btn', tile);
                const favs = getFavs();
                const isFav = favs.includes(id);

                /**
                 * Verwendet die globale updateFavBtn-Funktion
                 */
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

            /**
             * Gesamtseite berechnen und Anzeige aktualisieren
             */
            const pages = Math.ceil(state.total / state.limit);
            $('#pageinfo').textContent = `Seite ${state.page} / ${pages}`;
            $('#prev').disabled = state.page <= 1;
            $('#next').disabled = state.page >= pages;

        } catch (err) {
            console.error('Fehler beim Laden der Galerie-Seite:', err);
            grid.innerHTML = `<div class="card">Fehler beim Laden der Pokémon.</div>`;
        }
    }

    /**
     * Zeigt die Detailansicht für ein Pokémon im Popup an.
     * Parameter id
     */
    async function showDetail(id) {
        const popup = document.getElementById('popup');
        const detail = document.getElementById('popup-detail');
        const closeBtn = document.getElementById('closePopup');

        try {

            /**
             * Lädt Pokemondaten
             */
            const p = await json(`/api/pokemon/${id}`);


            detail.innerHTML = renderPokemonDetail(p); // Verwendet die globale renderPokemonDetail-Funktion

            popup.classList.remove('hidden'); //Entfernt die hidden-Klasse und blendet das Popup ein

            const favBtn = document.getElementById('favBtn');
            let favs = getFavs();
            let isFav = favs.includes(p.id);


            updateFavBtn(favBtn, isFav); // Verwendet die globale updateFavBtn-Funktion

            /**
             * Event-Listener verwendet nutzt die globale handleFavToggle-Funktion.
             */
            favBtn.addEventListener('click', async () => {
                isFav = await handleFavToggle(p.id);
                updateFavBtn(favBtn, isFav);
            });

            /**
             * Bei Klick auf Close-Button wird Popup wieder versteckt (hidden)
             */
            closeBtn.onclick = () => popup.classList.add('hidden');
            popup.onclick = (e) => {
                if (e.target === popup) popup.classList.add('hidden');
            };

        } catch {
            detail.innerHTML = `<div class="card">Nicht gefunden.</div>`;
            popup.classList.remove('hidden');
        }
    }

    /**
     * Seite wechseln durch Buttons (Seite 1/...)
     */
    $('#prev').addEventListener('click', () => { state.page--; loadPage(); });
    $('#next').addEventListener('click', () => { state.page++; loadPage(); });

    /**
     * Eventlistener für Filter und Sortierfunktion
     * Aktualisiert den Zusatnd und lädt die Gallerie neu
     */
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

//Collection
/**
 * Initialisiert die Favoriten-Collection-Seite.
 */
function initCollection(){
    const list = $('#list');

    /**
     * Lädt Favoriten und stellt Request an DB/Server
     */
    async function loadFavs(){
        try {
            const data = await json('/api/favorites');

            /**
             * Wenn keine Favoriten vorhanden sind, wird eine entsprechende Nachricht angezeigt
             */
            if (!data || data.length === 0) {
                list.innerHTML = `<div class="card">Keine Favoriten vorhanden.</div>`;
                return;
            }

            /**
             * Favoriten als Kachel anzeigen
             */
            list.innerHTML = data.map(d => `
              <div class="tile" data-id="${d.id}">
                <img src="${d.sprite || '/public/img/pokeball.svg'}" alt="">
                <div class="name">${d.name}</div>
                <button class="fav-btn active" title="Entfernen">❤</button>
              </div>
            `).join('');

            /**
             * Klickevents setzen
             */
            $$('.tile', list).forEach(tile => {
                const id = parseInt(tile.dataset.id, 10);
                const btn = $('.fav-btn', tile);

                /**
                 * Bei Klick auf Kachel Pokemondetails anzeigen
                 */
                tile.addEventListener('click', (e) => {
                    if (e.target === btn) return;
                    showDetail(id);
                });

                /**
                 * Favoriten entfernen mit Klick auf Herz Symbol
                 * e.stopPropagation(); sperrt dass bei Klicken die Detailkachel geöffnet wird
                 * Pokémon lokal & serverseitig aus den Favoriten entfernen
                 */
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
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
     * Zeigt die Detailansicht für ein Pokémon im Popup an.
     * Parameter id
     */
    async function showDetail(id){
        const popup = document.getElementById('popup');
        const detail = document.getElementById('popup-detail');
        const closeBtn = document.getElementById('closePopup');

        /**
         * Prüft ob die notwendigen HTML-Elemente für das Detail-Popup existieren
         */
        if (!popup || !detail || !closeBtn) {
            console.warn('Popup-Elemente nicht gefunden.');
            return;
        }

        try {

            /**
             * Ruft Pokemon Daten ab und wartet bis diese vollständig sind
             */
            const p = await json(`/api/pokemon/${id}`);
            /**
             * HTML-String erzeugen
             */
            detail.innerHTML = renderPokemonDetail(p);

            popup.classList.remove('hidden');

            const favBtn = document.getElementById('favBtn');
            let favs = getFavs();
            let isFav = favs.includes(p.id);

            updateFavBtn(favBtn, isFav);

            /**
             * Verwendet handleFavToggle
             * Zusatzlogik zu den anderen showDetail(): Wenn ein Favorit entfernt wird, muss die Collection-Liste im Hintergrund neu geladen werden.
             */
            favBtn.addEventListener('click', async () => {
                const newState = await handleFavToggle(p.id);
                updateFavBtn(favBtn, newState);

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

//Profil
/**
 * Initialisiert die Profil-Seite.
 */
function initProfile(){
    /**
     * HTML-Elemente
     */
    const favsEl = $('#stat-favs');
    const seenEl = $('#stat-seen');
    const typeEl = $('#stat-type');

    async function load(){

        /**
         * Abruf der Statistiken vom Server
         */
        const s = await json('/api/profile/stats');
        /**
         * Anzeige der Statistiken
         */
        favsEl.textContent = s.favorites ?? 0;
        seenEl.textContent = s.seen ?? 0;
        typeEl.textContent = s.topType ? s.topType : '-';
    }
    load();
}