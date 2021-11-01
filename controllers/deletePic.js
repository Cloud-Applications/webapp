const client = require('../connection.js');
const {validateEmail, compare} = require('../helperFunctions');
const AWS = require("aws-sdk");
const {deleteUtility} = require('./deleteUtility.js');
AWS.config.update({region: "us-east-1"})
const s3 = new AWS.S3()
const deletePic =  (req, res) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(403).json({
            status: 401,
            msg: 'Forbidden'
        })
    }
    const encoded = authorization.substring(6);
    const decoded = Buffer.from(encoded, 'base64').toString('ascii');
    const [username, password] = decoded.split(':');
    if (!username) {
        return res.status(401).json('Unauthorized No authorization added');
    }
    const isEmailCorrect = validateEmail(username);
    if (!isEmailCorrect) {
        return res.status(401).json('Unauthorized Incorrect username');
    }
    const fetchUser = `Select id from users where username = $1`
    client.query(fetchUser, [username])
        .then(data => {
            if (data && data.rows.length) {
                let userId = data.rows[0].id;
                deleteUtility(userId);
            } else {
                return res.status(401).json('Unauthorized No such user exists');
            }
        })
        .catch(err => {
            return res.status(500).json({
                status: 500,
                msg: 'API not found'
            }) 
        })
}

exports.deletePic = deletePic;