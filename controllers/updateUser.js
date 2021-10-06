const client = require('../connection.js');
const {validateEmail, compare} = require('../helperFunctions');
const {
    v4: uuidv4
} = require('uuid');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const updateData = (username, password, req, res) => {
    const {
        account_created,
        account_updated,
        id
    } = req.body;
    const data = Object.keys(req.body);
    const filter = ['first_name','last_name','password','username']
    for(i in data){
        if(!filter.includes(data[i])){
            return res.status(400).json({
                status: 400,
                msg: 'No extra information allowed'
            })
        }
    }

    if(req.body?.username && req.body?.username !== username) {
        return res.status(400).json({
            status: 400,
            msg: 'Incorrect username passed'
        })
    }
    if (account_created || account_updated || id) {
        return res.status(400).json({
            status: 400,
            msg: 'No additional information can be changed'
        })
    }
    const isEmailCorrect = validateEmail(username);
    if (!isEmailCorrect) {
        return res.status(400).json({
            status: 400,
            msg: 'Incorrect email'
        })
    }

    const accountUpdated = new Date().toISOString();

    const text1 = 'Select first_name, last_name, password from users where username =$1 '
    const value1 = [username];

    client.query(text1, value1, (error, results) => {
        if (results.rows.length) {
            const first_name = req.body.first_name ? req.body.first_name : results.rows[0].first_name;
            const last_name = req.body.last_name ? req.body.last_name : results.rows[0].last_name;
            const password = req.body.password ? req.body.password : results.rows[0].password;
            bcrypt.genSalt(saltRounds, function (err, salt) {
                bcrypt.hash(password, salt, function (err, hash) {
                    const text = 'UPDATE public.users SET first_name=$1, last_name=$2, password=$3, account_updated=$4 WHERE username =$5'
                    const values = [first_name, last_name, hash, accountUpdated, username];
                    client.query(text, values, (err, result) => {
                        if (err) {
                            res.status(400).json({
                                status: 400,
                                error: err
                            });
                        } else {

                            res.status(204).json({
                                status: 204,
                                description: 'Values are updated'
                            });
                        }
                    });
                    client.end;
                });
            });
        } else {
            return res.status(400).json({
                status: 400,
                error: 'No email found'
            });
        }
    });
}

const updateUser = (req, res) => {
    const authorization = req.headers.authorization;
    if(!authorization) {
        return res.status(403).json({
            status: 403,
            msg: 'Forbidden Request'
        })
    }
    const encoded = authorization.substring(6);
    const decoded = Buffer.from(encoded, 'base64').toString('ascii');
    const [username, password] = decoded.split(':');
    if (!username || !password) {
        return res.status(403).json({
            status: 403,
            msg: 'Forbidden Request'
        })
    }
    const fetchUser = `Select password from users where username = $1`
    client.query(fetchUser, [username])
        .then(data => {
            if (data ?.rows.length) {
                compare(password, data.rows[0].password)
                    .then(test => {
                        if (test) return updateData(username, password, req, res);
                        return res.status(400).json({
                            status: 400,
                            msg: 'Incorrect password'
                        });
                    })
            } else {
                return res.status(400).json({
                    status: 400,
                    msg: 'Username incorrect'
                });
            }
        })
};

exports.updateUser = updateUser;