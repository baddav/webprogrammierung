const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// POST /api/favorites/:id
router.post('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (!id) return res.status(400).json({ error: 'Ungültige ID' });

        await pool.query('INSERT IGNORE INTO favorites (pokemon_id) VALUES (?)', [id]);
        res.json({ ok: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Serverfehler' });
    }
});

// DELETE /api/favorites/:id
router.delete('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        await pool.query('DELETE FROM favorites WHERE pokemon_id = ?', [id]);
        res.json({ ok: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Serverfehler' });
    }
});


router.get('/', async (_req, res) => {
    try {
        const [rows] = await pool.query(
            `
                SELECT p.id, p.name, p.sprite
                FROM favorites f
                         JOIN pokemon p ON p.id = f.pokemon_id
                ORDER BY p.name ASC
            `
        );

        res.json(rows);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Serverfehler' });
    }
});

module.exports = router;
