/**
 * Express ist ein zentrales Framework,
 * dass für den Aufbau eines Webservers in Node.js benötigt wird.
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
 * Definiert eine GET-Route, die Statistiken über die Pokémon-Datenbank abruft.
 */
router.get('/stats', async (_req, res) => {
    try {
        /**
         * Ermittelt die Anzahl der favorisierten Pokémon.
         */
        const [[{ favs }]] = await pool.query('SELECT COUNT(*) AS favs FROM favorites');

        /**
         * Ermittelt die Anzahl der gesehenen Pokémon.
         */
        const [[{ seen }]] = await pool.query('SELECT COUNT(*) AS seen FROM pokemon');

        /**
         * Ermittelt den am häufigsten favorisierten Pokémon-Typ.
         */
        const [rows] = await pool.query(`
            SELECT pt.type, COUNT(*) as cnt
            FROM favorites f
                     JOIN pokemon_types pt ON pt.pokemon_id = f.pokemon_id
            GROUP BY pt.type
            ORDER BY cnt DESC
                LIMIT 1
        `);

        /**
         * Der am häufigsten favorisierte Pokémon-Typ.
         */
        const topType = rows[0]?.type || null;

        res.json({ favorites: favs, seen, topType });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Serverfehler' });
    }
});

module.exports = router;
