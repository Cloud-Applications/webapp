const client = require('../connection.js');
const logger = require('../logger');

const verifyUsers = (req, res) => {
    console.log(req, res);
}

exports.verifyUsers = verifyUsers;