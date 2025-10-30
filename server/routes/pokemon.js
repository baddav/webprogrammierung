/**
 * Express ist ein zentrales Framework, dass für den Aufbau eines Webservers in Node.js benötigt wird.
 */
const express = require('express');

/**
 * Router-Objekt von Express wird erstellt, um Routen zu definieren.
 */
const router = express.Router();

/**
 * Importiert Funktionen zum Abrufen von Pokémon-Daten aus dem Repository.
 */
const {getPokemonBySearch, getPokemonWithFilters, countPokemonWithFilters, getPokemonById, getPokemonStatsById, getPokemonTypesById} = require("../repositories/pokemonRepo");

/**
 * Definiert eine GET-Route, um eine Liste von Pokémon abzurufen, mit Such-, Filter- und Sortieroptionen.
 */
router.get('/', async (req, res) => {
    try {

        /**
         * Extrahiert Such-, Filter- und Sortierparameter aus der Anfrage.
         */
        const { search, page = 1, limit = 20, type, sort = 'id_asc' } = req.query;

        /**
         * Wenn ein Suchbegriff vorhanden ist, rufe die Suchfunktion auf und gib die Ergebnisse zurück.
         */
        if (search) {
            const rows = await getPokemonBySearch(search);
            return res.json(rows);
        }

        /**
         * Berechnet die Paginierungsparameter.
         */
        const p = Math.max(parseInt(page, 10) || 1, 1);

        /**
         * Die maximale Anzahl von Einträgen pro Seite, begrenzt auf 50.
         */
        const l = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);

        /**
         * Der Offset für die Datenbankabfrage basierend auf der aktuellen Seite und dem Limit.
         */
        const offset = (p - 1) * l;

        const filters = [];
        const params = [];

        /**
         * Fügt einen Filter für den Pokémon-Typ hinzu, wenn dieser angegeben ist.
         */
        if (type) {
            filters.push('p.id IN (SELECT pokemon_id FROM pokemon_types WHERE type = ?)');
            params.push(type);
        }

        /**
         * Bestimmt die Sortierreihenfolge basierend auf dem angegebenen Sortierparameter.
         */
        let orderBy = 'p.id ASC';
        if (sort === 'name_asc') orderBy = 'p.name ASC';
        else if (sort === 'name_desc') orderBy = 'p.name DESC';
        else if (sort === 'atk_asc') orderBy = 'ps.attack ASC';
        else if (sort === 'atk_desc') orderBy = 'ps.attack DESC';

        /**
         * Ruft die gefilterten und sortierten Pokémon-Daten sowie die Gesamtanzahl ab.
         */
        const rows = await getPokemonWithFilters(filters, params, orderBy, l, offset);
        const total = await countPokemonWithFilters(filters, params);

        res.json({ items: rows, page: p, limit: l, total });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Serverfehler' });
    }
});

/**
 * Definiert eine GET-Route, um die Details eines bestimmten Pokémon anhand seiner ID abzurufen.
 */
router.get('/:id', async (req, res) => {
    try {

        /**
         * Die ID des Pokémon aus den Routenparametern extrahieren.
         */
        const id = parseInt(req.params.id, 10);

        /**
         * Überprüft, ob die ID gültig ist.
         */
        if (!id) return res.status(400).json({ error: 'Ungültige ID' });

        /**
         * Ruft die Basisinformationen des Pokémon aus der Datenbank ab.
         */
        const info = await getPokemonById(id);

        /**
         * Ruft die Statuswerte und Typen des Pokémon aus der Datenbank ab.
         */
        const stats = await getPokemonStatsById(id);
        const types = await getPokemonTypesById(id);

        /**
         * Gibt die Pokémon-Details als JSON-Antwort zurück.
         */
        res.json({
            id: info.id,
            name: info.name,
            sprite: info.sprite,
            height: info.height,
            weight: info.weight,
            stats: stats,
            types: types
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Serverfehler' });
    }
});

module.exports = router;
