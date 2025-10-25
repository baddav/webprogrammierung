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
 * Definiert eine GET-Route, die einen zufälligen Fakt aus der Datenbank abruft.
 */
router.get('/next', async (_req, res) => {
    try {
        const [rows] = await pool.query('SELECT text FROM facts ORDER BY RAND() LIMIT 1');
        if (!rows.length) return res.json({ text: 'Pokémon machen Spaß!' });
        res.json(rows[0]);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Serverfehler' });
    }
});

module.exports = router;
