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
            const starts = `${search.toLowerCase()}%`;

            const [rows] = await pool.query(`
                SELECT id, name, sprite 
                FROM pokemon 
                WHERE LOWER(name) LIKE ? 
                ORDER BY 
                    (CASE WHEN LOWER(name) LIKE ? THEN 0 ELSE 1 END), 
                    name ASC
                LIMIT 10
            `, [term, starts]);

            return res.json(rows);
        }

        const p = Math.max(parseInt(page, 10) || 1, 1);
        const l = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);
        const offset = (p - 1) * l;

        // Build dynamic filters and sorting
        const filters = [];
        const params = [];

        if (type) {
            filters.push('p.id IN (SELECT pokemon_id FROM pokemon_types WHERE type = ?)');
            params.push(type);
        }

        let orderBy = 'p.id ASC';
        if (sort === 'name_asc') orderBy = 'p.name ASC';
        else if (sort === 'name_desc') orderBy = 'p.name DESC';
        else if (sort === 'atk_asc') orderBy = 'ps.attack ASC';
        else if (sort === 'atk_desc') orderBy = 'ps.attack DESC';

        const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
        const query = `
            SELECT p.id, p.name, p.sprite, ps.attack
            FROM pokemon p
            JOIN pokemon_stats ps ON ps.pokemon_id = p.id
            ${whereClause}
            ORDER BY ${orderBy}
            LIMIT ? OFFSET ?
        `;
        params.push(l, offset);

        const countQuery = `
            SELECT COUNT(*) as total
            FROM pokemon p
                     JOIN pokemon_stats ps ON ps.pokemon_id = p.id
                ${whereClause}
        `;

        const [rows] = await pool.query(query, params);
        const [[{ total }]] = await pool.query(countQuery, params.slice(0, -2));

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
