const client = require('../connection.js');
const {validateEmail, compare} = require('../helperFunctions');
const AWS = require("aws-sdk");
const SDC = require('statsd-client');
const logger = require('../logger');
const {deleteUtility} = require('./deleteUtility.js');
AWS.config.update({region: "us-east-1"})
const s3 = new AWS.S3()
sdc = new SDC({host: 'localhost', port: 8125});
const deletePic =  (req, res) => {
    let startTime = Date.now();
    sdc.increment('endpoint.user.delete.pic');
    logger.info('Made user delete Picture api call');
    const authorization = req.headers.authorization;
    if (!authorization) {
        logger.error('No authorization provided to delete a pic of a user');
        return res.status(403).json({
            status: 401,
            msg: 'Forbidden'
        })
    }
    const encoded = authorization.substring(6);
    const decoded = Buffer.from(encoded, 'base64').toString('ascii');
    const [username, password] = decoded.split(':');
    if (!username) {
        logger.error('Unauthorized No authorization added to delete a pic of a user');
        return res.status(401).json('Unauthorized No authorization added');
    }
    const isEmailCorrect = validateEmail(username);
    if (!isEmailCorrect) {
        logger.error('Incorrect email format for user authorization');
        return res.status(401).json('Unauthorized Incorrect username');
    }
    const fetchUser = `Select id, verified from users where username = $1`
    client.query(fetchUser, [username])
        .then(data => {
            if (data && data.rows.length) {
                if(!data.rows[0].verified) {
                    logger.error('User not verified to perform any action');
                    return res.status(400).json({
                        status: 400,
                        error: 'User not verified'
                    });
                }
                let userId = data.rows[0].id;
                deleteUtility(userId, res);
            } else {
                logger.error('Unauthorized No such user exists');
                return res.status(401).json('Unauthorized No such user exists');
            }
        })
        .catch(err => {
            logger.error('API not found');
            return res.status(500).json({
                status: 500,
                msg: 'API not found'
            }) 
        })
        let endTime = Date.now();
        var elapsed = endTime - startTime;
        sdc.timing('timing.user.delete.pic', elapsed);
}

exports.deletePic = deletePic;