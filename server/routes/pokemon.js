/**
 * Express ist ein zentrales Framework, dass für den Aufbau eines Webservers in Node.js benötigt wird.
 */
const express = require('express');

/**
 * Router-Objekt von Express wird erstellt, um Routen zu definieren.
 */
const router = express.Router();

/**
 * Datenbank-Pool für die Verbindung zur Datenbank.
 */
const pool = require('../db/pool');

/**
 * Importiere den Cache-Service, um Pokémon-Details abzurufen.
 */
const { getPokemonDetails } = require('../services/cache');

/**
 * Definiert eine GET-Route, um eine Liste von Pokémon abzurufen, mit Such-, Filter- und Sortieroptionen.
 */
router.get('/', async (req, res) => {
    try {

        /**
         * Extrahiert die Abfrageparameter aus der Anfrage.
         */
        const { search, page = 1, limit = 20, type, sort = 'id_asc' } = req.query;

        /**
         * Wenn ein Suchbegriff vorhanden ist, führe eine Suche durch und gib die Ergebnisse zurück.
         */
        if (search) {
            const term = `%${search.toLowerCase()}%`;
            const starts = `${search.toLowerCase()}%`;

            const [rows] = await pool.query(`
                SELECT id, name, sprite 
                FROM pokemon 
                WHERE LOWER(name) LIKE ? 
                ORDER BY 
                    (CASE WHEN LOWER(name) LIKE ? THEN 0 ELSE 1 END), 
                    name ASC
                LIMIT 10
            `, [term, starts]);

            return res.json(rows);
        }

        /**
         * Berechne die Paginierungsparameter.
         */
        const p = Math.max(parseInt(page, 10) || 1, 1);

        /**
         * Begrenze die Anzahl der Ergebnisse pro Seite auf einen Bereich zwischen 1 und 50.
         */
        const l = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);

        /**
         * Berechnet den Offset für die SQL-Abfrage basierend auf der aktuellen Seite und dem Limit.
         */
        const offset = (p - 1) * l;

        const filters = [];
        const params = [];

        /**
         * Fügt einen Filter für den Pokémon-Typ hinzu, falls der 'type'-Parameter angegeben ist.
         */
        if (type) {
            filters.push('p.id IN (SELECT pokemon_id FROM pokemon_types WHERE type = ?)');
            params.push(type);
        }

        /**
         * Bestimmt die Sortierreihenfolge basierend auf dem 'sort'-Parameter.
         */
        let orderBy = 'p.id ASC';
        if (sort === 'name_asc') orderBy = 'p.name ASC';
        else if (sort === 'name_desc') orderBy = 'p.name DESC';
        else if (sort === 'atk_asc') orderBy = 'ps.attack ASC';
        else if (sort === 'atk_desc') orderBy = 'ps.attack DESC';

        /**
         * Konstruiert die WHERE-Klausel basierend auf den angegebenen Filtern.
         */
        const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
        const query = `
            SELECT p.id, p.name, p.sprite, ps.attack
            FROM pokemon p
            JOIN pokemon_stats ps ON ps.pokemon_id = p.id
            ${whereClause}
            ORDER BY ${orderBy}
            LIMIT ? OFFSET ?
        `;
        params.push(l, offset);

        /**
         * SQL-Abfrage, um die Gesamtanzahl der Pokémon zu zählen, die den Filterkriterien entsprechen.
         */
        const countQuery = `
            SELECT COUNT(*) as total
            FROM pokemon p
                     JOIN pokemon_stats ps ON ps.pokemon_id = p.id
                ${whereClause}
        `;

        /**
         * Führt die Abfragen aus, um die Pokémon-Daten und die Gesamtanzahl abzurufen.
         */
        const [rows] = await pool.query(query, params);

        /**
         * Ruft die Gesamtanzahl der Pokémon ab, die den Filterkriterien entsprechen.
         */
        const [[{ total }]] = await pool.query(countQuery, params.slice(0, -2));

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
         * Extrahiert die Pokémon-ID aus den Routenparametern und konvertiert sie in eine Zahl.
         */
        const id = parseInt(req.params.id, 10);

        /**
         * Überprüft, ob die ID gültig ist. Wenn nicht, wird ein 400-Fehler zurückgegeben.
         */
        if (!id) return res.status(400).json({ error: 'Ungültige ID' });

        /**
         * Ruft die Details des Pokémon aus dem Cache-Service ab.
         */
        const details = await getPokemonDetails(id);

        /**
         * Wenn keine Details gefunden werden, wird ein 404-Fehler zurückgegeben.
         */
        if (!details) return res.status(404).json({ error: 'Nicht gefunden' });
        res.json(details);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Serverfehler' });
    }
});

module.exports = router;
