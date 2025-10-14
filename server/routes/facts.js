const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// GET /api/facts/next  -> zufälliger Fakt
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
