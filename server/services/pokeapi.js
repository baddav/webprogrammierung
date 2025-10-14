// Node 18+ hat fetch eingebaut
const BASE = 'https://pokeapi.co/api/v2/pokemon/';

async function getPokemonFromAPI(idOrName) {
    const res = await fetch(BASE + idOrName);
    if (!res.ok) return null;
    const d = await res.json();

    const types = d.types.map(t => t.type.name);
    const stats = {
        hp: d.stats.find(s => s.stat.name === 'hp')?.base_stat ?? 0,
        attack: d.stats.find(s => s.stat.name === 'attack')?.base_stat ?? 0,
        defense: d.stats.find(s => s.stat.name === 'defense')?.base_stat ?? 0,
        speed: d.stats.find(s => s.stat.name === 'speed')?.base_stat ?? 0
    };

    return {
        id: d.id,
        name: d.name,
        sprite: d.sprites.other['official-artwork']?.front_default || d.sprites.front_default || '',
        height: d.height,
        weight: d.weight,
        types,
        stats
    };
}

module.exports = { getPokemonFromAPI };
