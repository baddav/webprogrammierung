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

const {addPokemon, deletePokemon, getPokemon} = require("../repositories/favoritesRepo");

/**
 * Definiert eine POST-Route, um ein Pokémon zu den Favoriten hinzuzufügen.
 */
router.post('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);

        if (!id) return res.status(400).json({ error: 'Ungültige ID' });
        await addPokemon(id);
        res.json({ ok: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Serverfehler' });
    }
});

/**
 * Definiert eine DELETE-Route, um ein Pokémon aus den Favoriten zu entfernen.
 */
router.delete('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        await deletePokemon(id);
        res.json({ ok: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Serverfehler' });
    }
});

/**
 * Definiert eine GET-Route, um alle favorisierten Pokémon abzurufen.
 */
router.get('/', async (_req, res) => {
    try {

        /**
         * Ruft alle favorisierten Pokémon aus der Datenbank ab, sortiert nach Name aufsteigend.
         */
        const rows = await getPokemon();
        res.json(rows);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Serverfehler' });
    }
});

module.exports = router;
