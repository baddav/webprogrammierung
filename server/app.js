const path = require('path');
const express = require('express');
const app = express();
require('dotenv').config();

const pokemonRoutes = require('./routes/pokemon');
const favoritesRoutes = require('./routes/favorites');
const factsRoutes = require('./routes/facts');
const profileRoutes = require('./routes/profile');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static & Views
app.use('/public', express.static(path.join(__dirname, '..', 'public')));
app.get('/', (_, res) => res.sendFile(path.join(__dirname, '..', 'views', 'index.html')));
app.get('/gallery', (_, res) => res.sendFile(path.join(__dirname, '..', 'views', 'gallery.html')));
app.get('/collection', (_, res) => res.sendFile(path.join(__dirname, '..', 'views', 'collection.html')));
app.get('/profile', (_, res) => res.sendFile(path.join(__dirname, '..', 'views', 'profile.html')));

// API
app.use('/api/pokemon', pokemonRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/facts', factsRoutes);
app.use('/api/profile', profileRoutes);

// Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log('API läuft auf Port', PORT);
});

module.exports = app;
