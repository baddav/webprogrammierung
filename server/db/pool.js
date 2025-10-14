const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'db',
    user: process.env.DB_USER || 'pokedex',
    password: process.env.DB_PASS || 'pokedex',
    database: process.env.DB_NAME || 'pokedex',
    waitForConnections: true,
    connectionLimit: 10
}).promise();

module.exports = pool;
