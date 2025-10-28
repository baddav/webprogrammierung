/**
 * Main application file for the Pokémon API server.
 */
const path = require('path');

/**
 * Lödt das Express-Framework.
 */
const express = require('express');

/**
 * Hauptanwendungsobjekt von Express.
 */
const app = express();

/**
 * Lädt Umgebungsvariablen aus der .env-Datei.
 */
require('dotenv').config();

/**
 * Importiere die Routen-Module.
 */
const pokemonRoutes = require('./routes/pokemon');
const favoritesRoutes = require('./routes/favorites');
const factsRoutes = require('./routes/facts');
const profileRoutes = require('./routes/profile');

/**
 * Middleware zum Parsen von JSON- und URL-kodierten Daten.
 */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Statische Dateien und HTML-Seiten bereitstellen.
 */
app.use('/public', express.static(path.join(__dirname, '..', 'public')));
app.get('/', (_, res) => res.sendFile(path.join(__dirname, '..', 'views', 'index.html')));
app.get('/gallery', (_, res) => res.sendFile(path.join(__dirname, '..', 'views', 'gallery.html')));
app.get('/collection', (_, res) => res.sendFile(path.join(__dirname, '..', 'views', 'collection.html')));
app.get('/profile', (_, res) => res.sendFile(path.join(__dirname, '..', 'views', 'profile.html')));

/**
 * API-Routen einbinden.
 */
app.use('/api/pokemon', pokemonRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/facts', factsRoutes);
app.use('/api/profile', profileRoutes);

/**
 * Starten des Servers auf dem angegebenen Port.
 */
const PORT = process.env.PORT;
app.listen(PORT, '0.0.0.0', () => {
    console.log('API läuft auf Port', PORT);
});

module.exports = app;
