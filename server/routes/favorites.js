/**
 * Express ist ein zentrales Framework, dass für den Aufbau eines Webservers in Node.js benötigt wird.
 */
const express = require('express');

/**
 * Router-Objekt von Express wird erstellt, um Routen zu definieren.
 */
const router = express.Router();

/**
 * Importiert Funktionen zum Verwalten der Favoriten aus dem Repository.
 */
const {addFavPokemon, deleteFavPokemon, getFavPokemon} = require("../repositories/favoritesRepo");

/**
 * Definiert eine POST-Route, um ein Pokémon zu den Favoriten hinzuzufügen.
 */
router.post('/:id', async (req, res) => {
    try {

        /**
         * Die ID des Pokémon aus den URL-Parametern.
         */
        const id = parseInt(req.params.id, 10);

        if (!id) return res.status(400).json({ error: 'Ungültige ID' });
        await addFavPokemon(id);
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
        await deleteFavPokemon(id);
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
        const rows = await getFavPokemon();
        res.json(rows);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Serverfehler' });
    }
});

module.exports = router;
