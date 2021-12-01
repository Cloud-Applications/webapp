require('dotenv').config();
const {Client} = require('pg')
const db = new Client({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USERNAME || 'postgres',
    port: process.env.PORT || '5432',
    password: process.env.DB_PASSWORD || 'Harshika@123',
    database: process.env.DB_NAME || 'postgres',
    metrics_hostname: "localhost",
    metrics_port: 8125
})

module.exports = db