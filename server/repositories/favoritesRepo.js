/**
 * Importiert MySQL-Pool für Datenbankverbindungen.
 */
const pool = require('../db/pool');

/**
 * Fügt ein Pokémon zu den Favoriten hinzu.
 */
async function addFavPokemon(id) {
    const [result] = await pool.query('INSERT IGNORE INTO favorites (pokemon_id) VALUES (?)', [id]);
    return result;
}

/**
 * Entfernt ein Pokémon aus den Favoriten.
 */
async function deleteFavPokemon(id) {
    const [result] = await pool.query('DELETE FROM favorites WHERE pokemon_id = ?', [id]);
    return result;
}

/**
 * Ruft alle favorisierten Pokémon ab.
 */
async function getFavPokemon() {
    const [rows] = await pool.query(`SELECT p.id, p.name, p.sprite FROM favorites f JOIN pokemon p ON p.id = f.pokemon_id ORDER BY p.name ASC`);
    return rows;
}

module.exports = {addPokemon: addFavPokemon, deletePokemon: deleteFavPokemon, getPokemon: getFavPokemon};