require('dotenv').config();
const {Client} = require('pg')
console.log(process.env.host)
const db = new Client({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    port: process.env.PORT || '3000',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    metrics_hostname: "localhost",
    metrics_port: 8125
})

module.exports = db