const pool = require('../db/pool');
const { getPokemonFromAPI } = require('./pokeapi');

async function ensurePokemonInDB(id) {
    const [rows] = await pool.query('SELECT id FROM pokemon WHERE id = ?', [id]);
    if (rows.length > 0) return true;

    const p = await getPokemonFromAPI(id);
    if (!p) return false;

    await pool.query(
        'INSERT INTO pokemon (id, name, sprite, height, weight) VALUES (?, ?, ?, ?, ?)',
        [p.id, p.name, p.sprite, p.height, p.weight]
    );
    await pool.query(
        'INSERT INTO pokemon_stats (pokemon_id, hp, attack, defense, speed) VALUES (?, ?, ?, ?, ?)',
        [p.id, p.stats.hp, p.stats.attack, p.stats.defense, p.stats.speed]
    );

    if (p.types?.length) {
        const values = p.types.map(t => [p.id, t]);
        await pool.query('INSERT INTO pokemon_types (pokemon_id, type) VALUES ?', [values]);
    }
    return true;
}

async function getPokemonDetails(id) {
    await ensurePokemonInDB(id);

    const [[info]] = await pool.query('SELECT * FROM pokemon WHERE id = ?', [id]);
    if (!info) return null;

    const [[stats]] = await pool.query('SELECT hp, attack, defense, speed FROM pokemon_stats WHERE pokemon_id = ?', [id]);
    const [typesRows] = await pool.query('SELECT type FROM pokemon_types WHERE pokemon_id = ?', [id]);

    return {
        id: info.id,
        name: info.name,
        sprite: info.sprite,
        height: info.height,
        weight: info.weight,
        stats: stats || {},
        types: typesRows.map(r => r.type)
    };
}

module.exports = { ensurePokemonInDB, getPokemonDetails };
