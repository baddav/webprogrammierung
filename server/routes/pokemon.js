const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { getPokemonDetails } = require('../services/cache');

// GET /api/pokemon?search=pi  (autocomplete, max 10)
// GET /api/pokemon?page=1&limit=20  (gallery list)
// GET /api/pokemon/:id  (details)

router.get('/', async (req, res) => {
    try {
        const { search, page = 1, limit = 20, type, sort = 'id_asc' } = req.query;

        if (search) {
            const term = `%${search.toLowerCase()}%`;
            const [rows] = await pool.query(
                'SELECT id, name, sprite FROM pokemon WHERE LOWER(name) LIKE ? ORDER BY name ASC LIMIT 10',
                [term]
            );
            return res.json(rows);
        }

        const p = Math.max(parseInt(page, 10) || 1, 1);
        const l = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
        const offset = (p - 1) * l;

        // Build dynamic filters and sorting
        const filters = [];
        const params = [];

        if (type) {
            filters.push('id IN (SELECT pokemon_id FROM pokemon_types WHERE type = ?)');
            params.push(type);
        }

        let orderBy = 'id ASC';
        if (sort === 'name_asc') orderBy = 'name ASC';
        else if (sort === 'name_desc') orderBy = 'name DESC';
        else if (sort === 'id_desc') orderBy = 'id DESC';

        const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
        const query = `
            SELECT id, name, sprite
            FROM pokemon
            ${whereClause}
            ORDER BY ${orderBy}
            LIMIT ? OFFSET ?
        `;
        params.push(l, offset);

        const [rows] = await pool.query(query, params);
        const [[{ total }]] = await pool.query(`SELECT COUNT(*) as total FROM pokemon ${whereClause}`, params.slice(0, -2));
        res.json({ items: rows, page: p, limit: l, total });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Serverfehler' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (!id) return res.status(400).json({ error: 'Ungültige ID' });

        const details = await getPokemonDetails(id);
        if (!details) return res.status(404).json({ error: 'Nicht gefunden' });
        res.json(details);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Serverfehler' });
    }
});

module.exports = router;
