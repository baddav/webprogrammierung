/**
 * Express ist ein zentrales Framework, dass für den Aufbau eines Webservers in Node.js benötigt wird.
 */
const express = require('express');

/**
 * Router-Objekt von Express wird erstellt, um Routen zu definieren.
 */
const router = express.Router();

/**
 * Importiert die Funktion zum Abrufen von Fakten aus der DB.
 */
const { getFacts } = require('../repositories/factRepo');

/**
 * Definiert eine GET-Route, die einen zufälligen Fakt aus der Datenbank abruft.
 */
router.get('/next', async (_req, res) => {
    try {
        const rows = await getFacts();
        res.json(rows[0]);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Serverfehler' });
    }
});

module.exports = router;
