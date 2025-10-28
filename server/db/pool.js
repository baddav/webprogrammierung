/**
 * Modul zum Erstellen eines MySQL-Datenbank-Pools.
 */
const mysql = require('mysql2');

/**
 * Lädt Umgebungsvariablen aus der .env-Datei.
 */
require('dotenv').config();

/**
 * Datenbank-Pool für die Verbindung zur Datenbank.
 */
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT || 3306),
    waitForConnections: true,
    connectionLimit: 10
}).promise();

module.exports = pool;
