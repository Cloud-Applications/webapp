const client = require('../connection.js');
const {validateEmail, compare} = require('../helperFunctions');

const getPic =  (req, res) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(403).json({
            status: 403,
            msg: 'Forbidden'
        })
    }
    const encoded = authorization.substring(6);
    const decoded = Buffer.from(encoded, 'base64').toString('ascii');
    const [username, password] = decoded.split(':');
    if (!username) {
        return res.status(403).json({
            status: 403,
            msg: 'Forbidden'
        })
    }
    const isEmailCorrect = validateEmail(username);
    if (!isEmailCorrect) {
        return res.status(400).json({
            status: 400,
            msg: 'Incorrect email type'
        })
    }
    const fetchUser = `Select id from users where username = $1`
    client.query(fetchUser, [username])
        .then(data => {
            if (data && data.rows.length) {
                let userId = data.rows[0].id;
                client.query(`Select id, user_id, file_name, url, upload_date from photos where user_id = $1`, [userId], (err, result) => {
                    console.log(err, result, 'get');
                    if (!result.rows.length) {
                        res.status(500).json({
                            status: 403,
                            error: "User not found"
                        });
                    } else {
                        res.status(200).json(result.rows[0]);
                    }
                });
            } else {
                return res.status(404).json({
                    status: 404,
                    msg: 'Not Found'
                }) 
            }
        })
        .catch(err => {
            return res.status(500).json({
                status: 500,
                msg: 'API not found'
            }) 
        })
}

exports.getPic = getPic;