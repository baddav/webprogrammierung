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

// GET /api/favorites?type=fire&sort=name_asc|name_desc|atk_asc|atk_desc
router.get('/', async (req, res) => {
    try {
        const { type, sort } = req.query;

        let where = 'WHERE f.pokemon_id = p.id AND ps.pokemon_id = p.id';
        const params = [];

        if (type) {
            where += ' AND EXISTS (SELECT 1 FROM pokemon_types pt WHERE pt.pokemon_id = p.id AND pt.type = ?)';
            params.push(type.toLowerCase());
        }

        let order = 'ORDER BY p.name ASC';
        switch (sort) {
            case 'name_desc': order = 'ORDER BY p.name DESC'; break;
            case 'atk_asc': order = 'ORDER BY ps.attack ASC'; break;
            case 'atk_desc': order = 'ORDER BY ps.attack DESC'; break;
            case 'name_asc': default: order = 'ORDER BY p.name ASC';
        }

        const [rows] = await pool.query(
            `
                SELECT p.id, p.name, p.sprite, ps.attack
                FROM favorites f
                         JOIN pokemon p ON p.id = f.pokemon_id
                         JOIN pokemon_stats ps ON ps.pokemon_id = p.id
                    ${where} ${order}
            `,
            params
        );

        res.json(rows);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Serverfehler' });
    }
});

module.exports = router;
