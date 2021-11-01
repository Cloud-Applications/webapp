require('dotenv').config();
const {Client} = require('pg')
console.log(process.env.host)
const db = new Client({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    port: process.env.PORT,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    AccessKey: "AKIA2JROP6PD7WE447FO",
    SecretKey:"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"
})

module.exports = db