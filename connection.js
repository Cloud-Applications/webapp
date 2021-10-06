const {Client} = require('pg')

const db = new Client({
    host: "localhost",
    user: "postgres",
    port: 5432,
    password: "Harshika@123",
    database: "postgres"
})

module.exports = db