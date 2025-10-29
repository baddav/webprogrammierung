const pool = require('../db/pool')

async function getPokemonBySearch(search) {
    const term = `%${search.toLowerCase()}%`;
    const starts = `${search.toLowerCase()}%`;

    const [rows] = await pool.query(`SELECT id, name, sprite FROM pokemon WHERE LOWER(name) LIKE ? ORDER BY (CASE WHEN LOWER(name) LIKE ? THEN 0 ELSE 1 END), name ASC LIMIT 10`, [term, starts]);
    return rows;
}

/**
 * Ruft Pokémon-Daten basierend auf Filtern, Sortierung und Paginierung ab.
 */
async function getPokemonWithFilters(filters, params, orderBy, limit, offset) {
    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
    const query = `
        SELECT p.id, p.name, p.sprite, ps.attack
        FROM pokemon p
        JOIN pokemon_stats ps ON ps.pokemon_id = p.id
        ${whereClause}
        ORDER BY ${orderBy}
        LIMIT ? OFFSET ?
    `;
    params.push(limit, offset);
    const [rows] = await pool.query(query, params);
    return rows;
}

/**
 * Zählt die Gesamtanzahl der Pokémon basierend auf den Filtern.
 */
async function countPokemonWithFilters(filters, params) {
    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
    const countQuery = `
        SELECT COUNT(*) as total
        FROM pokemon p
        JOIN pokemon_stats ps ON ps.pokemon_id = p.id
        ${whereClause}
    `;
    const [[{ total }]] = await pool.query(countQuery, params);
    return total;
}

/**
 * Ruft die Basisinformationen eines Pokémon anhand seiner ID ab.
 */
async function getPokemonById(id) {
    const [[info]] = await pool.query('SELECT * FROM pokemon WHERE id = ?', [id]);
    return info;
}

/**
 * Ruft die Statuswerte eines Pokémon anhand seiner ID ab.
 */
async function getPokemonStatsById(id) {
    const [[stats]] = await pool.query('SELECT hp, attack, defense, speed FROM pokemon_stats WHERE pokemon_id = ?', [id]);
    return stats;
}

/**
 * Ruft die Typen eines Pokémon anhand seiner ID ab.
 */
async function getPokemonTypesById(id) {
    const [typesRows] = await pool.query('SELECT type FROM pokemon_types WHERE pokemon_id = ?', [id]);
    return typesRows.map(r => r.type);
}

module.exports = {getPokemonBySearch, getPokemonWithFilters, countPokemonWithFilters, getPokemonById, getPokemonStatsById, getPokemonTypesById};