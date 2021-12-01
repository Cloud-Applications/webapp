const logger = require('./logger');
require('dotenv').config();
const {Client} = require('pg')
logger.info({env: process.env, msg: 'test in connection'});
const db = new Client({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USERNAME || 'postgres',
    port: process.env.PORT || '5432',
    password: process.env.DB_PASSWORD || 'Harshika@123',
    database: process.env.DB_NAME || 'postgres',
    metrics_hostname: "localhost",
    topic: process.env.TOPIC_ARN,
    domain: process.env.DOMAIN_NAME,
    metrics_port: 8125
})

module.exports = db