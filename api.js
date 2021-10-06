const client = require('./connection.js')
const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
const {
    v4: uuidv4
} = require('uuid');
app.listen(3300, () => {
    console.log("Sever is now listening at port 3300");
})
const saltRounds = 10;
client.connect();

app.use(bodyParser.json());
const id = uuidv4();
app.get('/v1/user/self', (req, res) => {
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
                                msg: 'Incorrect email or password in authorization'
                            }) 
                        }
                        
                    });
            }
        })
});

function validateEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}
app.post('/v1/user', (req, res) => {
    const {
        username,
        first_name,
        last_name,
        password
    } = req.body;
    const isEmailCorrect = validateEmail(username);
    if (!isEmailCorrect || password.length < 5 || !first_name.length || !last_name.length) {
        return res.status(400).json({
            status: 400,
            msg: 'Incorrect details'
        })
    }
    const id = uuidv4();
    const account_created = new Date().toISOString();
    const account_updated = new Date().toISOString();
    bcrypt.genSalt(saltRounds, function (err, salt) {
        bcrypt.hash(password, salt, function (err, hash) {
            const text1 = 'Select * from users where username =$1'
            const value1 = [username];
            client.query(text1, value1, (error, results) => {
                if (!results.rows.length) {
                    const text = 'INSERT INTO users(first_name, last_name, password, username, account_created, account_updated, id) VALUES($1, $2,  $3, $4, $5, $6, $7) RETURNING id, first_name, last_name, username, account_created, account_updated'
                    const values = [first_name, last_name, hash, username, account_created, account_updated, id];
                    client.query(text, values, (err, result) => {
                        if (err) {
                            res.status(403).json({
                                status: 403,
                                error: err
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
                        msg: 'Email already in use'
                    })
                }
            })
        });
    });
});

function compare(password, hashedPassword) {
    // Cannot bcrypt compare when one is undefined
    if (!password || !hashedPassword) {
        return Promise.resolve(false);
    }

    return Promise.resolve(bcrypt.compare(password, hashedPassword));
}
const updateData = (username, password, req, res) => {
    const {
        account_created,
        account_updated,
        id
    } = req.body;
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
                            res.status(500).json({
                                status: 500,
                                error: err
                            });
                        } else {
                            res.status(200).json({
                                status: 200,
                                result
                            });
                        }
                    });
                    client.end;
                });
            });
        } else {
            res.status(404).json({
                status: 404,
                error: 'No email found'
            });
        }
    });
}
app.put('/v1/user/self', (req, res) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(404).json({
            status: 403,
            msg: 'Forbidden'
        })
    }
    const encoded = authorization.substring(6);
    const decoded = Buffer.from(encoded, 'base64').toString('ascii');
    const [username, password] = decoded.split(':');

    const fetchUser = `Select password from users where username = $1`
    client.query(fetchUser, [username])
        .then(data => {
            if (data ?.rows.length) {
                compare(password, data.rows[0].password)
                    .then(test => {
                        if (test) return updateData(username, password, req, res);
                        return res.status(404).json({
                            status: 403,
                            msg: 'Incorrect password'
                        });
                    })
            }
        })
});

module.exports = app;