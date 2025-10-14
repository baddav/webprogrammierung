const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// GET /api/profile/stats
router.get('/stats', async (_req, res) => {
    try {
        const [[{ favs }]] = await pool.query('SELECT COUNT(*) AS favs FROM favorites');
        const [[{ seen }]] = await pool.query('SELECT COUNT(*) AS seen FROM pokemon');

        const [rows] = await pool.query(`
            SELECT pt.type, COUNT(*) as cnt
            FROM favorites f
                     JOIN pokemon_types pt ON pt.pokemon_id = f.pokemon_id
            GROUP BY pt.type
            ORDER BY cnt DESC
                LIMIT 1
        `);
        const topType = rows[0]?.type || null;

        res.json({ favorites: favs, seen, topType });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Serverfehler' });
    }
});

module.exports = router;
