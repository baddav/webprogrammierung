/**
 * Importiert MySQL-Pool für Datenbankverbindungen.
 */
const pool = require('../db/pool');

/**
 * Ermittelt die Anzahl der favorisierten Pokémon.
 */
async function countFavoritePokemons() {
    const [[{ favs }]] = await pool.query('SELECT COUNT(*) AS favs FROM favorites');
    return favs;
}

/**
 * Ermittelt die Anzahl der gesehenen Pokémon.
 */
async function countSeenPokemons() {
    const [[{ seen }]] = await pool.query('SELECT COUNT(*) AS seen FROM pokemon');
    return seen;
}

/**
 * Ermittelt den am häufigsten favorisierten Pokémon-Typ.
 */
async function getMostFavoritedType() {
    const [rows] = await pool.query(`SELECT pt.type, COUNT(*) as cnt FROM favorites f JOIN pokemon_types pt ON pt.pokemon_id = f.pokemon_id GROUP BY pt.type ORDER BY cnt DESC LIMIT 1`);
    return rows[0]?.type || null;
}

module.exports = { countFavoritePokemons, countSeenPokemons, getMostFavoritedType };