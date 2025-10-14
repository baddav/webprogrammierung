const axios = require('axios');

async function getPokemonSpeciesCount() {
    const response = await axios.get('https://pokeapi.co/api/v2/pokemon-species');
    return response.data.count;
}

async function getPokemonFromAPI(id) {
    try {
        const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${id}`);
        const data = response.data;
        return {
            id: data.id,
            name: data.name,
            sprite: data.sprites.front_default,
            height: data.height,
            weight: data.weight,
            stats: {
                hp: data.stats.find(s => s.stat.name === 'hp')?.base_stat || 0,
                attack: data.stats.find(s => s.stat.name === 'attack')?.base_stat || 0,
                defense: data.stats.find(s => s.stat.name === 'defense')?.base_stat || 0,
                speed: data.stats.find(s => s.stat.name === 'speed')?.base_stat || 0,
            },
            types: data.types.map(t => t.type.name)
        };
    } catch (error) {
        console.error(`Fehler beim Abrufen von Pokémon #${id}:`, error.message);
        return null;
    }
}

module.exports = { getPokemonFromAPI, getPokemonSpeciesCount };