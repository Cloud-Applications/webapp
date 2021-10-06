const client = require('../connection.js');
const {validateEmail, compare} = require('../helperFunctions');
const getUsers =  (req, res) => {
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
    const isEmailCorrect = validateEmail(username);
    if (!isEmailCorrect) {
        return res.status(400).json({
            status: 400,
            msg: 'Incorrect email type'
        })
    }
    const fetchUser = `Select password from users where username = $1`
    client.query(fetchUser, [username])
        .then(data => {
            if (data?.rows.length) {
                compare(password, data.rows[0].password)
                    .then(test => {
                        if(test) {
                            client.query(`Select id, first_name, last_name, username, account_created, account_updated from users where username = $1`, [username], (err, result) => {
                                if (!result.rows.length) {
                                    res.status(500).json({
                                        status: 403,
                                        error: "User not found"
                                    });
                                } else {
                                    res.status(200).json({
                                        status: 200,
                                        result
                                    });
                                }
                            });
                            client.end;
                        } else {
                            return res.status(400).json({
                                status: 400,
                                msg: 'Incorrect password in authorization'
                            }) 
                        }
                        
                    });
            } else {
                return res.status(400).json({
                    status: 400,
                    msg: 'Username doesn\'t exist'
                }) 
            }
        })
        .catch(err => {
            return res.status(500).json({
                status: 500,
                msg: 'API not found'
            }) 
        })
};
exports.getUsers = getUsers;