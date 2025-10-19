// Kleine Hilfen
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function typeBadge(t){
    return `<span class="badge ${t}">${t}</span>`;
}

async function json(url, opts){
    const res = await fetch(url, opts);
    if (!res.ok) throw new Error('Request failed');
    return res.json();
}

function debounce(fn, ms){
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), ms);
    };
}

function favKey(){ return 'favorites'; }
function getFavs(){
    try { return JSON.parse(localStorage.getItem(favKey())||'[]'); } catch { return []; }
}
function setFavs(arr){
    localStorage.setItem(favKey(), JSON.stringify(arr));
}

async function toggleFavorite(id, active){
    if (active){
        await fetch(`/api/favorites/${id}`, { method:'POST' });
    } else {
        await fetch(`/api/favorites/${id}`, { method:'DELETE' });
    }
}

// ---- Seiten-Init ----
document.addEventListener('DOMContentLoaded', () => {
    const page = document.body.dataset.page;

    if (page === 'index') initSearch();
    if (page === 'gallery') initGallery();
    if (page === 'collection') initCollection();
    if (page === 'profile') initProfile();
});

// ---- PokeSearch ----
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

    function updateFavBtn(btn, active){
        btn.textContent = active ? '❤' : '♡';
        btn.classList.toggle('active', active);
    }

    // Fakten rotieren
    async function loadFact(){
        try{
            const f = await json('/api/facts/next');
            factText.textContent = f.text || 'Pokémon sind cool!';
        }catch{}
    }
    loadFact();
    setInterval(loadFact, 10000);
}

// ---- Gallery ----
function initGallery(){
    const grid = $('#grid');
    const typeSel = $('#type');
    const sortSel = $('#sort');
    const state = { page: 1, limit: 20, total: 0, type: '', sort: 'name_asc' }; // Standardwert für sort

    async function loadPage(){
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

        // Pager
        const pages = Math.ceil(state.total / state.limit);
        $('#pageinfo').textContent = `Seite ${state.page} / ${pages}`;
        $('#prev').disabled = state.page <= 1;
        $('#next').disabled = state.page >= pages;
    }

    function updateFavBtn(btn, active) {
        btn.textContent = active ? '❤' : '♡';
        btn.classList.toggle('active', active);
    }

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

            // Popup sichtbar machen
            popup.classList.remove('hidden');

            // Favoriten-Button-Logik
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

            // Schließen-Button
            closeBtn.onclick = () => popup.classList.add('hidden');

            // Auch schließen, wenn man außerhalb klickt
            popup.onclick = (e) => {
                if (e.target === popup) popup.classList.add('hidden');
            };

        } catch {
            detail.innerHTML = `<div class="card">Nicht gefunden.</div>`;
            popup.classList.remove('hidden');
        }
    }



    function update(btn, active){ btn.textContent = active ? '❤' : '♡'; btn.classList.toggle('active', active); }

    $('#prev').addEventListener('click', () => { state.page--; loadPage(); });
    $('#next').addEventListener('click', () => { state.page++; loadPage(); });

    typeSel.addEventListener('change', () => {
        state.type = typeSel.value;
        state.page = 1; // Reset to first page
        loadPage();
    });

    sortSel.addEventListener('change', () => {
        state.sort = sortSel.value;
        state.page = 1; // Reset to first page
        loadPage();
    });

    // Set default sort value in the dropdown
    sortSel.value = state.sort;

    loadPage();
}

// ---- Collection ----
function initCollection(){
    const list = $('#list');

    // Lädt alle Favoriten vom Server und rendert sie
    async function loadFavs(){
        try {
            // /api/favorites liefert eine Liste mit Favoriten (wie schon vorher)
            const data = await json('/api/favorites');

            // Wenn keine Favoriten, Zeige Hinweis
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

            // Event-Listener setzen
            $$('.tile', list).forEach(tile => {
                const id = parseInt(tile.dataset.id, 10);
                const btn = $('.fav-btn', tile);

                // Klick auf Tile -> Popup öffnen (außer wenn Fav-Button angeklickt)
                tile.addEventListener('click', (e) => {
                    if (e.target === btn) return;
                    showDetail(id);
                });

                // Entfernen aus Favoriten
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

    // Detail-Fenster (Popup) für Collection — identisch zur Gallery-Implementierung
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

            // Popup sichtbar machen
            popup.classList.remove('hidden');

            // Favoriten-Button Logik
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
                await loadFavs(); // aktualisiere Collection falls Favorit entfernt
            });

            // Schließen-Button
            closeBtn.onclick = () => popup.classList.add('hidden');

            // Klick auf Overlay schließt ebenfalls
            popup.onclick = (e) => {
                if (e.target === popup) popup.classList.add('hidden');
            };
        } catch (err) {
            console.error('Fehler beim Laden der Details:', err);
            detail.innerHTML = `<div class="card">Nicht gefunden.</div>`;
            popup.classList.remove('hidden');
        }
    }

    function updateFavBtn(btn, active) {
        if (!btn) return;
        btn.textContent = active ? '❤' : '♡';
        btn.classList.toggle('active', active);
    }

    // initial load
    loadFavs();
}

// ---- Profile ----
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
