/*
  Lädt Schema, füllt Facts und lädt alle Pokémon-Spezies in die DB.
*/
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const pool = require('../db/pool');
const { getPokemonFromAPI, getPokemonSpeciesCount } = require('../services/pokeapi');

async function run() {
    try {
        console.log('Schema anwenden...');
        const schema = fs.readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf8');
        for (const stmt of schema.split(';').map(s => s.trim()).filter(Boolean)) {
            await pool.query(stmt);
        }

        console.log('Fakten füllen (einmalig) ...');
        const facts = [
            'Pikachu ist das bekannteste Pokémon.',
            'Glurak ist der finale Starter von Glumanda.',
            'Ditto kann sich in jedes Pokémon verwandeln.',
            'Mewtu wurde künstlich geschaffen.',
            'Legendäre Vögel: Arktos, Zapdos, Lavados.',
            'Evoli hat viele Entwicklungen.',
            'Relaxo liebt es zu schlafen.',
            'Onix ist ein riesiger Felsenschlangen-Pokémon.',
            'Psyduck bekommt Kopfschmerzen durch seine Kräfte.',
            'Taubsi ist eines der ersten Vogel-Pokémon.'
        ];
        if (facts.length) {
            await pool.query('DELETE FROM facts');
            const values = facts.map(t => [t]);
            await pool.query('INSERT INTO facts (text) VALUES ?', [values]);
        }

        console.log('Ermittle die Gesamtanzahl der Pokémon-Spezies...');
        const totalSpecies = await getPokemonSpeciesCount();
        console.log(`Es gibt insgesamt ${totalSpecies} Pokémon-Spezies.`);

        console.log('Lade alle Pokémon-Spezies von der PokeAPI...');
        for (let id = 1; id <= totalSpecies; id++) {
            const p = await getPokemonFromAPI(id);
            if (!p) {
                console.log('Überspringe', id);
                continue;
            }
            // Insert main
            await pool.query(
                'INSERT INTO pokemon (id, name, sprite, height, weight) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name), sprite=VALUES(sprite), height=VALUES(height), weight=VALUES(weight)',
                [p.id, p.name, p.sprite, p.height, p.weight]
            );
            await pool.query(
                'INSERT INTO pokemon_stats (pokemon_id, hp, attack, defense, speed) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE hp=VALUES(hp), attack=VALUES(attack), defense=VALUES(defense), speed=VALUES(speed)',
                [p.id, p.stats.hp, p.stats.attack, p.stats.defense, p.stats.speed]
            );
            await pool.query('DELETE FROM pokemon_types WHERE pokemon_id = ?', [p.id]);
            if (p.types?.length) {
                const values = p.types.map(t => [p.id, t]);
                await pool.query('INSERT INTO pokemon_types (pokemon_id, type) VALUES ?', [values]);
            }
            if (id % 25 === 0) console.log(`...bis #${id} eingefügt`);
        }

        console.log('Fertig.');
        process.exit(0);
    } catch (e) {
        console.error('Seed-Fehler:', e);
        process.exit(1);
    }
}

run();