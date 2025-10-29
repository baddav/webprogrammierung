/**
 * Modul zum Arbeiten mit dem Dateisystem.
 */
const fs = require('fs');

/**
 * Pfadmodul für Dateipfade.
 */
const path = require('path');

/**
 * Lädt Umgebungsvariablen aus der .env-Datei.
 */
require('dotenv').config();

/**
 * Datenbank-Pool für die Verbindung zur Datenbank.
 */
const pool = require('../db/pool');

/**
 * Importiere PokeAPI-Dienste zum Abrufen von Pokémon-Daten.
 */
const { getPokemonFromAPI, getPokemonSpeciesCount } = require('../repositories/pokeapi');

/**
 * Hauptfunktion zum Ausführen des Seed-Skripts.
 * @returns {Promise<void>}
 */
async function run() {
    try {
        console.log('Schema anwenden...');

        /**
         * Liest das SQL-Schema aus der Datei ein.
         */
        const schema = fs.readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf8');

        /**
         * Teilt das Schema in einzelne SQL-Anweisungen auf und führt jede Anweisung nacheinander aus.
         */
        for (const stmt of schema.split(';').map(s => s.trim()).filter(Boolean)) {
            await pool.query(stmt);
        }

        console.log('Fakten füllen...');

        /**
         * Liste von Pokémon-Fakten zum Einfügen in die Datenbank.
         */
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

        /**
         * Löscht vorhandene Fakten und fügt die neuen Fakten in die Datenbank ein.
         */
        if (facts.length) {
            await pool.query('DELETE FROM facts');
            const values = facts.map(t => [t]);
            await pool.query('INSERT INTO facts (text) VALUES ?', [values]);
        }

        console.log('Ermittle die Gesamtanzahl der Pokémon-Spezies...');
        const totalSpecies = await getPokemonSpeciesCount();
        console.log(`Es gibt insgesamt ${totalSpecies} Pokémon-Spezies.`);

        /**
         * Lädt alle Pokémon-Spezies von der PokeAPI und fügt sie in die Datenbank ein.
         */
        console.log('Lade alle Pokémon-Spezies von der PokeAPI...');
        for (let id = 1; id <= totalSpecies; id++) {
            const p = await getPokemonFromAPI(id);
            if (!p) {
                console.log('Überspringe', id);
                continue;
            }

            /**
             * Fügt das Pokémon in die Datenbank ein oder aktualisiert es.
             */
            await pool.query(
                'INSERT INTO pokemon (id, name, sprite, height, weight) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name), sprite=VALUES(sprite), height=VALUES(height), weight=VALUES(weight)',
                [p.id, p.name, p.sprite, p.height, p.weight]
            );

            /**
             * Fügt die Statuswerte des Pokémon in die Datenbank ein oder aktualisiert sie,
             */
            await pool.query(
                'INSERT INTO pokemon_stats (pokemon_id, hp, attack, defense, speed) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE hp=VALUES(hp), attack=VALUES(attack), defense=VALUES(defense), speed=VALUES(speed)',
                [p.id, p.stats.hp, p.stats.attack, p.stats.defense, p.stats.speed]
            );

            /**
             * Löscht vorhandene Typen und fügt die neuen Typen für das Pokémon ein.
             */
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