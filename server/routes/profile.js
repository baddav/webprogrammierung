/**
 * Express ist ein zentrales Framework,
 * dass für den Aufbau eines Webservers in Node.js benötigt wird.
 */
const express = require('express');

/**
 * Router-Objekt von Express wird erstellt, um Routen zu definieren.
 */
const router = express.Router();

const {countFavoritePokemons, countSeenPokemons, getMostFavoritedType} = require("../repositories/profileRepo");

/**
 * Definiert eine GET-Route, die Statistiken über die Pokémon-Datenbank abruft.
 */
router.get('/stats', async (_req, res) => {
    try {
        /**
         * Ermittelt die Anzahl der favorisierten Pokémon.
         */
        const favs = await countFavoritePokemons();

        /**
         * Ermittelt die Anzahl der gesehenen Pokémon.
         */
        const seen = await countSeenPokemons();

        /**
         * Ermittelt den am häufigsten favorisierten Pokémon-Typ.
         */
        const topType = await getMostFavoritedType();

        res.json({ favorites: favs, seen, topType });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Serverfehler' });
    }
});

module.exports = router;
