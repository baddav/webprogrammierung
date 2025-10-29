const pool = require('../db/pool')

/**
 * Ruft einen zufälligen Fakt aus der Datenbank ab.
 * @returns {Promise<{length}|*|[{text: string}]>}
 */
async function getFacts() {
    const [rows] = await pool.query('SELECT text FROM facts ORDER BY RAND() LIMIT 1');
    if (!rows.length) {
        return [{text: 'Pokémon machen Spaß!'}];
    }
    return rows;
}

module.exports = {getFacts};