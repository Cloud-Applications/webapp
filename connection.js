require('dotenv').config();
const {Client} = require('pg')

const db = new Client({
    host: process.env.host,
    user: process.env.user,
    port: process.env.port,
    password: process.env.password,
    database: process.env.database
})

module.exports = db