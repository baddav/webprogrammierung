const pool = require('../db/pool')

async function addPokemon(id) {

    const [result] = await pool.query('INSERT IGNORE INTO favorites (pokemon_id) VALUES (?)', [id]);
    return result
}

async function deletePokemon(id) {
    const [result] = await pool.query('DELETE FROM favorites WHERE pokemon_id = ?', [id]);
    return result
}

async function getPokemon() {
    const [rows] = await pool.query(`SELECT p.id, p.name, p.sprite FROM favorites f JOIN pokemon p ON p.id = f.pokemon_id ORDER BY p.name ASC`);
    return rows;
}

module.exports = {addPokemon, deletePokemon, getPokemon};