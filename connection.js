require('dotenv').config();
const {Client} = require('pg')
const { Sequelize } = require("sequelize");
const fs = require('fs');
const rdsCa = fs.readFileSync('./rds-combined-ca-bundle.pem');
// const sequelize = new Sequelize("sqlite::memory:");
const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USERNAME || 'postgres',
    ssl: {
        rejectUnauthorized: true,
        ca: [rdsCa]
    },
    port: process.env.PORT || '5432',
    password: process.env.DB_PASSWORD || 'Harshika@123',
    database: process.env.DB_NAME || 'postgres',
    metrics_hostname: "localhost",
    metrics_port: 8125
})

const db2 = new Client({
    host: process.env.Replica_DB_HOST || 'localhost',
    user: process.env.DB_USERNAME || 'postgres',
    port: process.env.PORT || '5432',
    ssl: {
        rejectUnauthorized: true,
        ca: [rdsCa]
    },
    password: process.env.DB_PASSWORD || 'Harshika@123',
    database: process.env.DB_NAME || 'postgres',
    metrics_hostname: "localhost",
    metrics_port: 8125
})
// const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
//     dialect: 'postgres',
//     metrics_hostname: "localhost",
//     metrics_port: 8125,
//     port: process.env.PORT || '5432',
//     replication: {
//       read: [
//         { host: process.env.Replica_DB_HOST }
//       ],
//       write: { host: process.env.DB_HOST }
//     },
//     pool: {
//         max: 5,
//         min: 0,
//         acquire: 3000,
//         idle: 10000
//     },
// })

exports.client = client
exports.db2 = db2